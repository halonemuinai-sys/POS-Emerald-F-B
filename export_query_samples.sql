-- ========================================================================
-- CONTOH QUERY ANALITIK POS EMERALD (LARAGON MYSQL)
-- Database: pos_emerald
-- Gunakan query ini di phpMyAdmin, HeidiSQL, DBeaver, atau Navicat
-- ========================================================================

USE pos_emerald;

-- ------------------------------------------------------------------------
-- 1. TOP 10 PRODUK ES KRIM PALING LAKU BERDASARKAN VOLUME PENJUALAN
-- ------------------------------------------------------------------------
SELECT 
    item_name,
    account_name,
    SUM(quantity) AS total_unit_terjual,
    SUM(debet) AS total_diskon_penjualan_idr,
    COUNT(DISTINCT location_name) AS jumlah_toko_yang_menjual
FROM pos_transactions
WHERE trx_type = 'SALES_INVOICE_SI'
GROUP BY item_name, account_name
ORDER BY total_unit_terjual DESC
LIMIT 10;

-- ------------------------------------------------------------------------
-- 2. REKAP HPP (COGS) KREASI DINE-IN DAN KONSUMSI BULK TUB / BAHAN BAKU
-- ------------------------------------------------------------------------
SELECT 
    item_name AS nama_bahan_atau_kreasi,
    trx_type,
    SUM(quantity) AS total_pemakaian_qty,
    SUM(debet) AS total_biaya_hpp_idr
FROM pos_transactions
WHERE account_code = '7001.30.00'
GROUP BY item_name, trx_type
ORDER BY total_biaya_hpp_idr DESC
LIMIT 15;

-- ------------------------------------------------------------------------
-- 3. TOTAL BIAYA KOMISI KARTU KREDIT (EDC MDR) PER OUTLET / CAFE
-- ------------------------------------------------------------------------
SELECT 
    location_name AS nama_outlet,
    SUM(debet) AS total_komisi_edc_idr,
    COUNT(*) AS total_transaksi_gesek,
    ROUND(SUM(debet) / COUNT(*), 2) AS rata_rata_fee_per_gesek
FROM pos_transactions
WHERE account_code = '8300.04.01'
GROUP BY location_name
ORDER BY total_komisi_edc_idr DESC;

-- ------------------------------------------------------------------------
-- 4. PERINGKAT OUTLET BERDASARKAN TOTAL AKTIVITAS & BIAYA HPP POS
-- ------------------------------------------------------------------------
SELECT 
    t.location_name,
    o.outlet_type,
    o.city,
    COUNT(*) AS total_transaksi,
    SUM(CASE WHEN t.trx_type LIKE 'POSSTOCK%' THEN t.debet ELSE 0 END) AS total_hpp_pos,
    SUM(CASE WHEN t.trx_type = 'SALES_INVOICE_SI' THEN t.debet ELSE 0 END) AS total_diskon_penjualan
FROM pos_transactions t
LEFT JOIN outlets o ON t.location_name = o.location_name
WHERE t.location_name != ''
GROUP BY t.location_name, o.outlet_type, o.city
ORDER BY total_hpp_pos DESC
LIMIT 15;

-- ------------------------------------------------------------------------
-- 5. REKAPITULASI BIAYA KERUSAKAN / PECAH / MELELEH (DAMAGE & SPOILAGE)
-- ------------------------------------------------------------------------
SELECT 
    location_name,
    description,
    SUM(debet) AS total_spoilage_idr
FROM pos_transactions
WHERE account_code = '8300.05.01'
GROUP BY location_name, description
ORDER BY total_spoilage_idr DESC
LIMIT 10;
