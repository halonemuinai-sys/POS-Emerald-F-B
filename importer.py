import os
import glob
import time
import psycopg2
from psycopg2.extras import execute_values
from database import get_connection, load_config, init_database
from parser import PosExcelParser

class PosEmeraldImporter:
    def __init__(self, config=None):
        self.config = config or load_config()
        self.batch_size = self.config.get("importer", {}).get("batch_size", 2000)
        self.skip_imported = self.config.get("importer", {}).get("skip_already_imported", True)
        
    def get_file_list(self, target_dir=None):
        search_dir = target_dir or self.config.get("importer", {}).get("source_directory", ".")
        patterns = self.config.get("importer", {}).get("file_patterns", ["*.xls", "*.xlsx"])
        
        all_files = []
        for pat in patterns:
            found = glob.glob(os.path.join(search_dir, pat))
            for f in found:
                if not os.path.basename(f).startswith('~$'):
                    all_files.append(os.path.abspath(f))
                    
        # Recursively search including 2023 folder and uploads
        for root, _, files in os.walk(search_dir):
            if any(skip in root for skip in ["node_modules", ".next", ".git"]):
                continue
            for file in files:
                if (file.endswith('.xls') or file.endswith('.xlsx')) and not file.startswith('~$'):
                    full_p = os.path.abspath(os.path.join(root, file))
                    if full_p not in all_files:
                        all_files.append(full_p)
                        
        return sorted(list(set(all_files)))

    def is_file_imported(self, conn, filename, file_hash):
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, file_hash, status, total_rows 
                FROM imported_files 
                WHERE file_name = %s;
            """, (filename,))
            row = cur.fetchone()
            if row:
                f_id, db_hash, status, rows = row
                if status == 'COMPLETED' and db_hash == file_hash:
                    return True, f_id, rows
                return False, f_id, rows
        return False, None, 0

    def import_single_file(self, conn, filepath, force=False):
        filename = os.path.basename(filepath)
        start_time = time.time()
        
        parser = PosExcelParser(filepath)
        
        already_imported, existing_id, prev_rows = self.is_file_imported(conn, filename, parser.file_hash)
        if already_imported and not force:
            return {
                "file_name": filename,
                "status": "SKIPPED",
                "message": f"Already imported ({prev_rows:,} rows)",
                "rows": prev_rows,
                "duration": 0
            }
            
        print(f" -> Parsing Excel: {filename} ({parser.file_size / (1024*1024):.2f} MB)...")
        file_meta, coas, outlets, records = parser.parse()
        file_type = file_meta.get("file_type", "DETAIL")
        
        try:
            with conn.cursor() as cur:
                if existing_id:
                    cur.execute("DELETE FROM imported_files WHERE id = %s;", (existing_id,))
                    
                cur.execute("""
                    INSERT INTO imported_files 
                    (file_name, file_path, file_size, file_hash, batch_code, period_from, period_to, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'PROCESSING')
                    RETURNING id;
                """, (
                    file_meta["file_name"],
                    file_meta["file_path"],
                    file_meta["file_size"],
                    file_meta["file_hash"],
                    file_meta["batch_code"],
                    file_meta["period_from"],
                    file_meta["period_to"]
                ))
                file_id = cur.fetchone()[0]
                
                # Upsert COA
                if coas:
                    coa_sql = """
                        INSERT INTO chart_of_accounts 
                        (account_code, account_name, account_series, account_category)
                        VALUES %s
                        ON CONFLICT (account_code) DO UPDATE SET 
                            account_name = EXCLUDED.account_name,
                            account_series = EXCLUDED.account_series,
                            account_category = EXCLUDED.account_category;
                    """
                    coa_data = [
                        (c["account_code"], c["account_name"], c["account_series"], c["account_category"])
                        for c in coas
                    ]
                    execute_values(cur, coa_sql, coa_data)
                    
                # Upsert Outlets
                if outlets:
                    outlet_sql = """
                        INSERT INTO outlets (location_name, outlet_type, city)
                        VALUES %s
                        ON CONFLICT (location_name) DO UPDATE SET 
                            outlet_type = EXCLUDED.outlet_type,
                            city = EXCLUDED.city;
                    """
                    outlet_data = [
                        (o["location_name"], o["outlet_type"], o["city"])
                        for o in outlets
                    ]
                    execute_values(cur, outlet_sql, outlet_data)
                    
                total_records = len(records)
                
                # If SUMMARY file
                if file_type == "SUMMARY":
                    bal_sql = """
                        INSERT INTO monthly_trial_balance 
                        (file_id, period_ym, account_code, account_name, beginning_balance, debet, credit, ending_balance)
                        VALUES %s
                        ON CONFLICT (period_ym, account_code) DO UPDATE SET 
                            beginning_balance = EXCLUDED.beginning_balance,
                            debet = EXCLUDED.debet,
                            credit = EXCLUDED.credit,
                            ending_balance = EXCLUDED.ending_balance;
                    """
                    bal_data = [
                        (
                            file_id,
                            b["period_ym"],
                            b["account_code"],
                            b["account_name"],
                            b["beginning_balance"],
                            b["debet"],
                            b["credit"],
                            b["ending_balance"]
                        )
                        for b in records
                    ]
                    execute_values(cur, bal_sql, bal_data)
                else:
                    # DETAIL transactions
                    trx_sql = """
                        INSERT INTO pos_transactions 
                        (file_id, source_file, row_index, trx_date, period_ym, account_code, account_name, 
                         trx_no, trx_type, description, item_name, quantity, location_name, notes, 
                         user_create, debet, credit, net_amount, ending_balance, docno)
                        VALUES %s
                    """
                    trx_data = [
                        (
                            file_id,
                            t["source_file"],
                            t["row_index"],
                            t["trx_date"],
                            t["period_ym"],
                            t["account_code"],
                            t["account_name"],
                            t["trx_no"],
                            t["trx_type"],
                            t["description"],
                            t["item_name"],
                            t["quantity"],
                            t["location_name"],
                            t["notes"],
                            t["user_create"],
                            t["debet"],
                            t["credit"],
                            t["net_amount"],
                            t["ending_balance"],
                            t["docno"]
                        )
                        for t in records
                    ]
                    execute_values(cur, trx_sql, trx_data, page_size=self.batch_size)
                    
                duration = time.time() - start_time
                cur.execute("""
                    UPDATE imported_files 
                    SET status = 'COMPLETED',
                        total_rows = %s,
                        total_debet = %s,
                        total_credit = %s,
                        duration_seconds = %s,
                        error_message = NULL,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s;
                """, (
                    total_records,
                    file_meta["total_debet"],
                    file_meta["total_credit"],
                    duration,
                    file_id
                ))
                
            conn.commit()
            return {
                "file_name": filename,
                "status": "COMPLETED",
                "message": f"Successfully inserted {total_records:,} {file_type.lower()} rows",
                "rows": total_records,
                "duration": duration
            }
        except Exception as e:
            conn.rollback()
            try:
                with conn.cursor() as cur:
                    cur.execute("""
                        UPDATE imported_files 
                        SET status = 'FAILED', error_message = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE file_name = %s;
                    """, (str(e)[:500], filename))
                conn.commit()
            except:
                pass
            return {
                "file_name": filename,
                "status": "FAILED",
                "message": str(e),
                "rows": 0,
                "duration": time.time() - start_time
            }

    def run_import(self, target_dir=None, force=False):
        init_database()
        
        file_list = self.get_file_list(target_dir)
        print("=" * 80)
        print("POS EMERALD INGESTION ENGINE (POSTGRESQL 17)")
        print(f"Target Directory: {os.path.abspath(target_dir or '.')}")
        print(f"Total Excel Files Detected: {len(file_list)}")
        print(f"Mode: {'FORCE OVERWRITE' if force else 'SAFE IDEMPOTENT (Skip duplicates)'}")
        print("=" * 80)
        
        if not file_list:
            print("No Excel files (*.xls, *.xlsx) found in target directory.")
            return
            
        conn = get_connection()
        results = []
        overall_start = time.time()
        
        try:
            for idx, fpath in enumerate(file_list, 1):
                fname = os.path.basename(fpath)
                print(f"[{idx}/{len(file_list)}] Processing: {fname}")
                res = self.import_single_file(conn, fpath, force=force)
                results.append(res)
                
                if res['status'] == 'COMPLETED':
                    print(f"    [OK] {res['message']} in {res['duration']:.2f}s")
                elif res['status'] == 'SKIPPED':
                    print(f"    [SKIP] {res['message']}")
                else:
                    print(f"    [FAIL] {res['message']}")
                    
        finally:
            conn.close()
            
        overall_dur = time.time() - overall_start
        total_rows_imported = sum(r['rows'] for r in results if r['status'] == 'COMPLETED')
        completed_files = sum(1 for r in results if r['status'] == 'COMPLETED')
        skipped_files = sum(1 for r in results if r['status'] == 'SKIPPED')
        failed_files = sum(1 for r in results if r['status'] == 'FAILED')
        
        print("\n" + "=" * 80)
        print("POSTGRESQL IMPORT EXECUTION SUMMARY")
        print("=" * 80)
        print(f"Total Files Scanned    : {len(file_list)}")
        print(f"Successfully Imported  : {completed_files}")
        print(f"Skipped (Unchanged)    : {skipped_files}")
        print(f"Failed                 : {failed_files}")
        print(f"Total Transactions/Rows: {total_rows_imported:,} rows inserted")
        print(f"Total Elapsed Time     : {overall_dur:.2f} seconds")
        if overall_dur > 0 and total_rows_imported > 0:
            print(f"Ingestion Throughput   : {total_rows_imported / overall_dur:,.1f} rows/sec")
        print("=" * 80)

if __name__ == '__main__':
    importer = PosEmeraldImporter()
    importer.run_import()
