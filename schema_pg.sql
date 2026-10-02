-- ========================================================================
-- DATABASE SCHEMA: pos_emerald (PostgreSQL 17)
-- Target: Laragon PostgreSQL (127.0.0.1:5432)
-- ========================================================================

-- 1. Tabel Log File yang Diimpor
CREATE TABLE IF NOT EXISTS imported_files (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL UNIQUE,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    batch_code VARCHAR(50),
    period_from DATE,
    period_to DATE,
    total_rows INT DEFAULT 0,
    total_debet NUMERIC(18, 2) DEFAULT 0.00,
    total_credit NUMERIC(18, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'PENDING',
    duration_seconds REAL DEFAULT 0.0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_file_hash ON imported_files(file_hash);
CREATE INDEX IF NOT EXISTS idx_file_status ON imported_files(status);

-- 2. Master Chart of Accounts (COA)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    account_code VARCHAR(20) PRIMARY KEY,
    account_name VARCHAR(255) NOT NULL,
    account_series VARCHAR(10) NOT NULL,
    account_category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coa_series ON chart_of_accounts(account_series);
CREATE INDEX IF NOT EXISTS idx_coa_category ON chart_of_accounts(account_category);

-- 3. Master Lokasi / Outlet
CREATE TABLE IF NOT EXISTS outlets (
    location_name VARCHAR(150) PRIMARY KEY,
    outlet_type VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outlet_type ON outlets(outlet_type);
CREATE INDEX IF NOT EXISTS idx_outlet_city ON outlets(city);

-- 4. Tabel Transaksi Buku Besar & POS (Main Ledger)
CREATE TABLE IF NOT EXISTS pos_transactions (
    id BIGSERIAL PRIMARY KEY,
    file_id INT NOT NULL REFERENCES imported_files(id) ON DELETE CASCADE,
    source_file VARCHAR(255) NOT NULL,
    row_index INT NOT NULL,
    trx_date DATE,
    period_ym VARCHAR(7),
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    trx_no VARCHAR(100),
    trx_type VARCHAR(50) NOT NULL,
    description TEXT,
    item_name VARCHAR(255),
    quantity INT DEFAULT 1,
    location_name VARCHAR(150),
    notes TEXT,
    user_create VARCHAR(50),
    debet NUMERIC(18, 2) DEFAULT 0.00,
    credit NUMERIC(18, 2) DEFAULT 0.00,
    net_amount NUMERIC(18, 2) DEFAULT 0.00,
    ending_balance NUMERIC(18, 2),
    docno VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trx_date ON pos_transactions(trx_date);
CREATE INDEX IF NOT EXISTS idx_period_ym ON pos_transactions(period_ym);
CREATE INDEX IF NOT EXISTS idx_account_code ON pos_transactions(account_code);
CREATE INDEX IF NOT EXISTS idx_trx_no ON pos_transactions(trx_no);
CREATE INDEX IF NOT EXISTS idx_trx_type ON pos_transactions(trx_type);
CREATE INDEX IF NOT EXISTS idx_location_name ON pos_transactions(location_name);
CREATE INDEX IF NOT EXISTS idx_item_name ON pos_transactions(item_name);
CREATE INDEX IF NOT EXISTS idx_user_create ON pos_transactions(user_create);

-- 5. Views untuk Reporting & Analitik Cepat

-- A. Ringkasan HPP Produk Jadi POS
CREATE OR REPLACE VIEW v_pos_cogs_summary AS
SELECT 
    period_ym,
    location_name,
    account_code,
    account_name,
    item_name,
    SUM(quantity) AS total_qty,
    SUM(debet) AS total_cogs_idr,
    COUNT(*) AS total_trx
FROM pos_transactions
WHERE trx_type IN ('POSSTOCK_REGULAR', 'POSSTOCK_COND')
GROUP BY period_ym, location_name, account_code, account_name, item_name;

-- B. Ringkasan Diskon Penjualan POS (Sales Invoices)
CREATE OR REPLACE VIEW v_pos_sales_discount_summary AS
SELECT 
    period_ym,
    trx_date,
    location_name,
    item_name,
    SUM(quantity) AS total_qty_sold,
    SUM(debet) AS total_discount_idr,
    COUNT(*) AS total_records
FROM pos_transactions
WHERE trx_type = 'SALES_INVOICE_SI'
GROUP BY period_ym, trx_date, location_name, item_name;

-- C. Rekapitulasi Biaya Komisi Kartu Kredit (EDC MDR)
CREATE OR REPLACE VIEW v_edc_card_commissions AS
SELECT 
    period_ym,
    location_name,
    description AS payment_channel,
    user_create,
    SUM(debet) AS total_commission_idr,
    COUNT(*) AS total_settlements
FROM pos_transactions
WHERE account_code = '8300.04.01'
GROUP BY period_ym, location_name, description, user_create;

-- D. Ringkasan Kinerja Bulanan per Outlet
CREATE OR REPLACE VIEW v_outlet_monthly_performance AS
SELECT 
    t.period_ym,
    t.location_name,
    o.outlet_type,
    o.city,
    COUNT(*) AS total_rows,
    SUM(CASE WHEN t.trx_type LIKE 'POSSTOCK%' THEN t.debet ELSE 0 END) AS total_pos_cogs,
    SUM(CASE WHEN t.trx_type = 'SALES_INVOICE_SI' THEN t.debet ELSE 0 END) AS total_sales_discount,
    SUM(CASE WHEN t.account_code = '8300.04.01' THEN t.debet ELSE 0 END) AS total_card_commission
FROM pos_transactions t
LEFT JOIN outlets o ON t.location_name = o.location_name
GROUP BY t.period_ym, t.location_name, o.outlet_type, o.city;
