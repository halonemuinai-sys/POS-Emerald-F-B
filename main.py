import os
import sys
import argparse
from database import load_config, init_database, get_connection
from importer import PosEmeraldImporter

def show_status():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM imported_files;")
            total_files = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM pos_transactions;")
            total_trxs = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM chart_of_accounts;")
            total_coas = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM outlets;")
            total_outlets = cur.fetchone()[0]
            
            cur.execute("SELECT SUM(debet), SUM(credit) FROM pos_transactions;")
            tot_debet, tot_credit = cur.fetchone()
            tot_debet = tot_debet or 0.0
            tot_credit = tot_credit or 0.0
            
            print("=" * 70)
            print("POS EMERALD DATABASE STATUS (POSTGRESQL 17)")
            print("=" * 70)
            print(f"Total Imported Files   : {total_files}")
            print(f"Total Ledger / Trx Rows: {total_trxs:,}")
            print(f"Total Chart of Accounts: {total_coas}")
            print(f"Total Outlets / Stores : {total_outlets}")
            print(f"Total Debet (IDR)      : Rp {float(tot_debet):,.2f}")
            print(f"Total Credit (IDR)     : Rp {float(tot_credit):,.2f}")
            
            print("\n--- Riwayat File yang Diimpor ---")
            cur.execute("""
                SELECT file_name, batch_code, total_rows, duration_seconds, status, created_at 
                FROM imported_files 
                ORDER BY id ASC;
            """)
            rows = cur.fetchall()
            if rows:
                print(f"{'Nama File':<42} | {'Batch':<10} | {'Baris':<8} | {'Waktu':<6} | {'Status'}")
                print("-" * 75)
                for r in rows:
                    dur_str = f"{r[3]:.1f}s" if r[3] else "-"
                    print(f"{r[0]:<42} | {str(r[1]):<10} | {r[2]:<8,}| {dur_str:<6} | {r[4]}")
            else:
                print("Belum ada file yang diimpor.")
            print("=" * 70)
    finally:
        conn.close()

def reset_database():
    confirm = input("PERINGATAN: Ini akan MENGHAPUS SEMUA DATA transaksi POS Emerald di PostgreSQL. Lanjutkan? (y/N): ")
    if confirm.strip().lower() == 'y':
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("TRUNCATE TABLE pos_transactions, imported_files, chart_of_accounts, outlets CASCADE;")
            conn.commit()
            print("Database pos_emerald (PostgreSQL) berhasil di-reset (kosong).")
        finally:
            conn.close()
    else:
        print("Operasi reset dibatalkan.")

def main():
    parser = argparse.ArgumentParser(description="POS Emerald Excel Ingestion Engine (PostgreSQL)")
    subparsers = parser.add_subparsers(dest="command", help="Perintah yang tersedia")
    
    # Command: import
    import_parser = subparsers.add_parser("import", help="Impor file Excel POS ke PostgreSQL")
    import_parser.add_argument("--dir", "-d", default=None, help="Folder sumber file Excel (default: folder saat ini)")
    import_parser.add_argument("--force", "-f", action="store_true", help="Paksa impor ulang dan timpa data yang sudah ada")
    
    # Command: status
    subparsers.add_parser("status", help="Lihat status dan statistik database")
    
    # Command: init
    subparsers.add_parser("init", help="Inisialisasi atau update tabel & views database")
    
    # Command: reset
    subparsers.add_parser("reset", help="Hapus seluruh data transaksi dari database")

    args = parser.parse_args()
    
    if args.command == "import" or args.command is None:
        target_dir = getattr(args, "dir", None)
        force = getattr(args, "force", False)
        importer = PosEmeraldImporter()
        importer.run_import(target_dir=target_dir, force=force)
    elif args.command == "status":
        show_status()
    elif args.command == "init":
        init_database()
    elif args.command == "reset":
        reset_database()
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
