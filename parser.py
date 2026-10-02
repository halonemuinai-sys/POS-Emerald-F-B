import os
import re
import datetime
import calendar
import xlrd

def get_file_hash(filepath):
    import hashlib
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def extract_city_and_type(location_name):
    loc = location_name.upper().strip()
    
    # Type
    if loc.startswith('CAFE'):
        otype = 'CAFE'
    elif loc.startswith('KIOSK'):
        otype = 'KIOSK'
    elif loc.startswith('DIP-SHOP'):
        otype = 'DIP-SHOP'
    elif loc.startswith('RTS'):
        otype = 'RTS'
    elif loc.startswith('PASTRY'):
        otype = 'PASTRY'
    elif loc.startswith('WAREHOUSE'):
        otype = 'WAREHOUSE'
    elif any(k in loc for k in ['HEAD OFFICE', 'OFFICE', 'SALES', 'TRAINING', 'HUMAN RESOURCES']):
        otype = 'HEAD OFFICE'
    else:
        otype = 'OTHER'
        
    # City
    city = 'JAKARTA'
    if any(k in loc for k in ['BALI', 'BEACHWALK', 'JIMBARAN']):
        city = 'BALI'
    elif any(k in loc for k in ['SURABAYA', 'GALAXY MALL', 'PAKUWON', 'CIPUTRA WORLD', 'TUNJUNGAN']):
        city = 'SURABAYA'
    elif any(k in loc for k in ['BANDUNG', 'SETIABUDHI']):
        city = 'BANDUNG'
    elif any(k in loc for k in ['SEMARANG', 'PARAGON']):
        city = 'SEMARANG'
    elif any(k in loc for k in ['MEDAN', 'CENTRE POINT']):
        city = 'MEDAN'
    elif any(k in loc for k in ['MAKASSAR', 'RATU INDAH']):
        city = 'MAKASSAR'
    elif any(k in loc for k in ['SERPONG', 'TANGERANG', 'KARAWACI', 'LIVING WORLD', 'ALAM SUTRA', 'BSD', 'SOETTA']):
        city = 'TANGERANG/BANTEN'
    elif 'BEKASI' in loc:
        city = 'BEKASI'
    elif any(k in loc for k in ['SENTUL', 'BOGOR']):
        city = 'BOGOR'
        
    return otype, city

def categorize_coa(code, name):
    prefix = str(code)[:2]
    if prefix == '11':
        return '1100', 'Cash & Bank'
    elif prefix in ['12', '13', '14']:
        return '1200', 'Receivables & Inventory'
    elif prefix in ['15', '16', '17', '18']:
        return '1500', 'Fixed Assets'
    elif prefix == '21':
        return '2100', 'Liabilities / AP'
    elif prefix == '31':
        return '3100', 'Equity'
    elif prefix == '41':
        return '4100', 'Sales Revenue'
    elif prefix == '50':
        return '5000', 'Sales Discount & Deductions'
    elif prefix == '70':
        if 'Retail' in name or str(code).startswith('7002'):
            return '7000', 'COGS - Retail'
        return '7000', 'COGS - Cafe'
    elif str(code).startswith('8100'):
        return '8100', 'Salaries & Personnel Expenses'
    elif str(code).startswith('8200'):
        return '8200', 'Marketing Expenses'
    elif str(code).startswith('8300'):
        if str(code) == '8300.04.01':
            return '8300', 'Card Commission (EDC MDR)'
        return '8300', 'General & Administrative (GA)'
    elif str(code).startswith('840'):
        return '8400', 'Depreciation & Amortization'
    elif str(code).startswith('8500'):
        return '8500', 'Other Income & Expenses'
    elif str(code).startswith('9000'):
        return '9000', 'Holding Management Fee'
    return prefix + '00', 'General Accounts'

def parse_item_and_qty(description):
    if not description:
        return '', 1
    desc = str(description).strip()
    match = re.search(r'^(.*?)\s*\((\d+)\)\s*$', desc)
    if match:
        val = int(match.group(2))
        if 0 <= val <= 100000:
            return match.group(1).strip(), val
    return desc, 1

def clamp_date(y, m, d, period_default="2023-12"):
    try:
        y = int(y)
        m = int(m)
        d = int(d)
        if y < 100:
            y += 2000
        y = max(2015, min(2035, y))
        m = max(1, min(12, m))
        _, max_d = calendar.monthrange(y, m)
        d = max(1, min(max_d, d))
        return f"{y:04d}-{m:02d}-{d:02d}", f"{y:04d}-{m:02d}"
    except:
        return f"{period_default}-01", period_default

def resolve_date(c0, c1, period_default="2023-12"):
    if c1:
        s1 = str(c1).strip()
        m1 = re.search(r'(\d{2})(\d{2})(\d{2})', s1)
        if m1:
            yy, mm, dd = m1.groups()
            return clamp_date(int(yy) + 2000, int(mm), int(dd), period_default)

    if isinstance(c0, str) and c0.strip():
        s0 = c0.strip()
        m2 = re.match(r'^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$', s0)
        if m2:
            d_int, m_int, y_int = int(m2.group(1)), int(m2.group(2)), int(m2.group(3))
            return clamp_date(y_int, m_int, d_int, period_default)
        m3 = re.match(r'^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$', s0)
        if m3:
            y_int, m_int, d_int = int(m3.group(1)), int(m3.group(2)), int(m3.group(3))
            return clamp_date(y_int, m_int, d_int, period_default)

    if isinstance(c0, (int, float)) and c0 > 0:
        base_date = datetime.date(1899, 12, 30)
        dt = base_date + datetime.timedelta(days=int(c0))
        if dt.day == 12 and dt.month <= 12 and "12" in period_default:
            return clamp_date(dt.year, 12, dt.month, period_default)
        return clamp_date(dt.year, dt.month, dt.day, period_default)

    return f"{period_default}-01", period_default

def get_period_last_day(period_ym):
    try:
        parts = period_ym.split('-')
        y = int(parts[0])
        m = int(parts[1])
        _, last_d = calendar.monthrange(y, m)
        return f"{period_ym}-{last_d:02d}"
    except:
        return f"{period_ym}-28"

def classify_trx_type(trx_no, account_code):
    s = str(trx_no).strip().upper()
    if 'POSSTOCK/COND' in s:
        return 'POSSTOCK_COND'
    if 'POSSTOCK' in s:
        return 'POSSTOCK_REGULAR'
    if s.startswith('SI/'):
        return 'SALES_INVOICE_SI'
    if s.startswith('ST/'):
        return 'STOCK_TRANSFER_ST'
    if str(account_code) == '8300.04.01':
        return 'CREDIT_CARD_COMMISSION'
    if s.startswith('RAI/I/AR'):
        return 'BACKOFFICE_AR'
    if s.startswith('RAI/GL'):
        return 'BACKOFFICE_GL'
    if s.startswith('RAI/CO'):
        return 'BACKOFFICE_CO'
    if s.startswith('RAI/CI'):
        return 'BACKOFFICE_CI'
    if s.startswith('RAI/AP'):
        return 'BACKOFFICE_AP'
    if s.startswith('HGD/DO'):
        return 'DELIVERY_DO'
    if s.startswith('RR/'):
        return 'RECEIVING_RR'
    if s.startswith('IC/'):
        return 'INVENTORY_IC'
    return 'OTHER'

def safe_cell(sheet, row, col):
    if row < sheet.nrows and col < sheet.ncols:
        return sheet.cell_value(row, col)
    return ''

class PosExcelParser:
    def __init__(self, filepath):
        self.filepath = filepath
        self.filename = os.path.basename(filepath)
        self.file_size = os.path.getsize(filepath)
        self.file_hash = get_file_hash(filepath)
        
        match = re.search(r'^([0-9A-Za-z]+)-BO', self.filename)
        self.batch_code = match.group(1) if match else self.filename.split('.')[0]
        
    def parse(self):
        wb = xlrd.open_workbook(self.filepath)
        sheet = wb.sheet_by_index(0)
        
        r0_val = str(safe_cell(sheet, 0, 0)) + ' ' + str(safe_cell(sheet, 0, 1))
        is_summary = 'summary' in r0_val.lower() or sheet.ncols <= 7
        
        if is_summary:
            return self._parse_summary(sheet)
        else:
            return self._parse_detail(sheet)

    def _parse_summary(self, sheet):
        period_text = str(safe_cell(sheet, 3, 2)).strip()
        period_default = "2023-01"
        if re.match(r'^\d{6}$', period_text):
            period_default = f"{period_text[:4]}-{period_text[4:]}"
        elif re.match(r'^\d{4}[\-\/]\d{2}', period_text):
            period_default = f"{period_text[:4]}-{period_text[5:7]}"
        elif re.match(r'^\d{6}', self.batch_code):
            period_default = f"{self.batch_code[:4]}-{self.batch_code[4:6]}"
            
        coas = {}
        monthly_balances = []
        total_debet = 0.0
        total_credit = 0.0
        
        for r in range(5, sheet.nrows):
            c0 = str(safe_cell(sheet, r, 0)).strip()
            c1 = str(safe_cell(sheet, r, 1)).strip()
            c2 = safe_cell(sheet, r, 2)
            c3 = safe_cell(sheet, r, 3)
            c4 = safe_cell(sheet, r, 4)
            c5 = safe_cell(sheet, r, 5)
            
            if not c0 or c0.lower().startswith('total'):
                continue
                
            try:
                beg_val = float(c2) if c2 != '' else 0.0
            except:
                beg_val = 0.0
                
            try:
                deb_val = float(c3) if c3 != '' else 0.0
            except:
                deb_val = 0.0
                
            try:
                cre_val = float(c4) if c4 != '' else 0.0
            except:
                cre_val = 0.0
                
            try:
                end_val = float(c5) if c5 != '' else 0.0
            except:
                end_val = 0.0
                
            total_debet += deb_val
            total_credit += cre_val
            
            series, cat = categorize_coa(c0, c1)
            coas[c0] = {
                "account_code": c0,
                "account_name": c1,
                "account_series": series,
                "account_category": cat
            }
            
            monthly_balances.append({
                "period_ym": period_default,
                "account_code": c0,
                "account_name": c1,
                "beginning_balance": beg_val,
                "debet": deb_val,
                "credit": cre_val,
                "ending_balance": end_val
            })
            
        period_to = get_period_last_day(period_default)
        file_meta = {
            "file_name": self.filename,
            "file_path": os.path.abspath(self.filepath),
            "file_size": self.file_size,
            "file_hash": self.file_hash,
            "batch_code": self.batch_code,
            "period_from": f"{period_default}-01",
            "period_to": period_to,
            "total_rows": len(monthly_balances),
            "total_debet": total_debet,
            "total_credit": total_credit,
            "file_type": "SUMMARY"
        }
        
        return file_meta, list(coas.values()), [], monthly_balances

    def _parse_detail(self, sheet):
        period_text = f"{safe_cell(sheet, 3, 0)} {safe_cell(sheet, 3, 1)} {safe_cell(sheet, 3, 2)}"
        
        period_default = "2023-12"
        if re.match(r'^\d{6}', self.batch_code):
            period_default = f"{self.batch_code[:4]}-{self.batch_code[4:6]}"
        else:
            p_match = re.search(r'(\d{4})[\-\/](\d{2})', period_text)
            if p_match:
                period_default = f"{p_match.group(1)}-{p_match.group(2)}"
            
        coas = {}
        outlets = {}
        transactions = []
        
        current_acc_code = ""
        current_acc_name = ""
        
        total_debet = 0.0
        total_credit = 0.0
        
        # Dynamically locate header row
        start_row = 4
        for r_check in range(2, min(9, sheet.nrows)):
            c0_val = str(safe_cell(sheet, r_check, 0)).strip().lower()
            c1_val = str(safe_cell(sheet, r_check, 1)).strip().lower()
            if c0_val == 'date' or c1_val == 'transaction no':
                start_row = r_check + 1
                break
                
        for r in range(start_row, sheet.nrows):
            c0 = safe_cell(sheet, r, 0)
            c1 = str(safe_cell(sheet, r, 1)).strip()
            c2 = str(safe_cell(sheet, r, 2)).strip()
            c3 = str(safe_cell(sheet, r, 3)).strip()
            c4 = str(safe_cell(sheet, r, 4)).strip()
            c5 = str(safe_cell(sheet, r, 5)).strip()
            c6 = safe_cell(sheet, r, 6)
            c7 = safe_cell(sheet, r, 7)
            c8 = safe_cell(sheet, r, 8)
            c9 = str(safe_cell(sheet, r, 9)).strip()
            
            # Check Account Header
            if re.match(r'^\d{4}[\.\d]+$', c1) and len(c1) >= 4 and not c1.startswith('PO'):
                current_acc_code = c1
                current_acc_name = c2
                series, category = categorize_coa(c1, c2)
                coas[c1] = {
                    "account_code": c1,
                    "account_name": c2,
                    "account_series": series,
                    "account_category": category
                }
                continue
                
            # Skip subtotal / totals
            s0 = str(c0).strip()
            s4 = str(c4).strip()
            if s0.startswith('Total') or 'Total ' in s0 or c1.startswith('Total') or 'Total Account' in s4:
                continue
                
            if not c1 and not c2 and not c3:
                continue
            if c1 == 'Transaction No' or c2 == 'Description':
                continue
                
            try:
                debet_val = float(c6) if c6 != '' else 0.0
            except:
                debet_val = 0.0
                
            try:
                credit_val = float(c7) if c7 != '' else 0.0
            except:
                credit_val = 0.0
                
            total_debet += debet_val
            total_credit += credit_val
            net_amount = debet_val - credit_val
            
            ending_val = None
            if c8 != '':
                try:
                    ending_val = float(c8)
                except:
                    pass
                    
            trx_date, period_ym = resolve_date(c0, c1, period_default)
            trx_type = classify_trx_type(c1, current_acc_code)
            item_name, qty = parse_item_and_qty(c2)
            
            if c3:
                otype, city = extract_city_and_type(c3)
                if c3 not in outlets:
                    outlets[c3] = {
                        "location_name": c3,
                        "outlet_type": otype,
                        "city": city
                    }
                    
            transactions.append({
                "source_file": self.filename,
                "row_index": r + 1,
                "trx_date": trx_date,
                "period_ym": period_ym,
                "account_code": current_acc_code,
                "account_name": current_acc_name,
                "trx_no": c1,
                "trx_type": trx_type,
                "description": c2,
                "item_name": item_name,
                "quantity": qty,
                "location_name": c3,
                "notes": c4,
                "user_create": c5 if c5 else None,
                "debet": debet_val,
                "credit": credit_val,
                "net_amount": net_amount,
                "ending_balance": ending_val,
                "docno": c9 if c9 else None
            })
            
        period_to = get_period_last_day(period_default)
        file_meta = {
            "file_name": self.filename,
            "file_path": os.path.abspath(self.filepath),
            "file_size": self.file_size,
            "file_hash": self.file_hash,
            "batch_code": self.batch_code,
            "period_from": f"{period_default}-01",
            "period_to": period_to,
            "total_rows": len(transactions),
            "total_debet": total_debet,
            "total_credit": total_credit,
            "file_type": "DETAIL"
        }
        
        return file_meta, list(coas.values()), list(outlets.values()), transactions
