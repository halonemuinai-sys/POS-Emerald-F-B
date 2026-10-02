# Panduan Serah Terima Database POS Häagen-Dazs (pos_emerald)

Dokumen ini ditujukan untuk **Data Engineer / Data Analyst / BI Developer** yang akan mengakses atau me-restore database `pos_emerald`.

---

## 1. Spesifikasi Data & Database

- **Database Engine**: PostgreSQL 17 (kompatibel dengan PostgreSQL 14, 15, 16, 17)
- **Nama Database**: `pos_emerald`
- **Total Record Transaksi**: **7.740.577 baris** (Rentang waktu: 2018 - 2024)
- **Total Summary Trial Balance**: **37.022 baris**
- **Master COA**: **647 akun**
- **Master Lokasi / Toko**: **138 lokasi** (Cafe, Kiosk, Dip-Shop, RTS, Pastry, Warehouse)
- **Default Database User**:
  - Username: `mrafnb`
  - Password: `fnb@2031mra`

---

## 2. Cara Restore di Lingkungan Data Engineer

Jika diberikan file `pos_emerald_backup.dump`:

### Langkah A: Buat Database Kosong di PostgreSQL
```sql
CREATE DATABASE pos_emerald;
CREATE USER mrafnb WITH PASSWORD 'fnb@2031mra';
GRANT ALL PRIVILEGES ON DATABASE pos_emerald TO mrafnb;
```

### Langkah B: Jalankan `pg_restore` (Multi-core)
```bash
# Menggunakan pg_restore (format Custom Archive -F c)
pg_restore -h localhost -p 5432 -U postgres -d pos_emerald -v pos_emerald_backup.dump
```
> *Catatan: Proses restore hanya memakan waktu 1–3 menit untuk ~7,7 juta baris data.*

---

## 3. Struktur Tabel Utama

| Tabel / View | Keterangan |
| :--- | :--- |
| `pos_transactions` | Tabel buku besar detail seluruh transaksi POS (BOM produk, debet, credit, toko, kasir, EDC) |
| `monthly_trial_balance` | Ringkasan saldo bulanan (Beginning, Debet, Credit, Ending) per akun COA |
| `chart_of_accounts` | Master Akun COA lengkap dengan kategori & series (1000 - 9000) |
| `outlets` | Master Toko & Cabang lengkap dengan jenis outlet & kota |
| `imported_files` | Log audit SHA-256 seluruh file Excel sumber (394 file) |
| `v_pos_cogs_summary` | View analitik HPP produk jadi per outlet dan periode |
| `v_pos_sales_discount_summary` | View analitik diskon penjualan POS per tanggal & toko |
| `v_edc_card_commissions` | View ringkasan MDR komisi bank kartu kredit |

---

## 4. Contoh Query Analisis Cepat

```sql
-- Cek Performa Bulanan Toko (Penjualan & HPP)
SELECT 
    period_ym,
    location_name,
    COUNT(*) AS total_trx,
    SUM(debet) AS total_debet,
    SUM(credit) AS total_credit
FROM pos_transactions
GROUP BY period_ym, location_name
ORDER BY period_ym DESC, total_trx DESC;
```
