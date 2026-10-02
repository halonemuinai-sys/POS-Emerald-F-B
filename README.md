# POS Emerald F&B - Data Ingestion Engine & Analytics Cockpit

Sistem ETL berkecepatan tinggi (*high-throughput*) dan Dashboard Analitik Interaktif Fullstack untuk mengonsolidasikan dan menganalisis laporan **POS & General Ledger Häagen-Dazs (PT. Rahayu Arumdhani International - MRA Group)** multi-tahun (2018 s/d 2024).

Mengelola lebih dari **7,74 Juta baris transaksi**, 647 Master COA, dan 138 Toko/Outlet dengan database **PostgreSQL 17** serta aplikasi web **Next.js 15 App Router**.

---

## 🏛️ Arsitektur Sistem

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          394+ FILE EXCEL POS                            │
│                 (Multi-Year: 2018, 2019, 2020..2024)                    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PYTHON 3 HIGH-SPEED ETL                           │
│  - parser.py      : Smart BIFF8/XLSX parser, Date & BOM Qty Resolver    │
│  - importer.py    : Bulk psycopg2 execute_values (~7.400 rows/sec)      │
│  - database.py    : Connection pool & schema auto-migrator              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL 17 DATABASE (pos_emerald)                 │
│  - 7.740.577 baris pos_transactions (Buku Besar & Detail POS)           │
│  - 37.022 baris monthly_trial_balance (Rekap Trial Balance 6 Kolom)     │
│  - 647 Master Chart of Accounts (COA)                                   │
│  - 138 Master Toko & Lokasi Gudang                                      │
│  - Analytical Views (v_pos_cogs_summary, v_edc_card_commissions, dll)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      FULLSTACK NEXT.JS DASHBOARD                        │
│             (Next.js 15, React 19, Tailwind CSS, Lucide)                │
│  - http://localhost:3000                                                │
│  - KPI Cockpit, Menu Terlaris, Top Store Performance                    │
│  - Live Transaction Explorer (Search 7.7M rows with pagination)         │
│  - Web Drag-and-Drop File & Folder Ingestion Uploader                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Fitur Utama

1. **High Ingestion Throughput:**
   * Mampu memproses hingga **7.400+ baris per detik** ke PostgreSQL 17 menggunakan batch insert `execute_values`.
   * Seluruh 394 file Excel (1.3 GB data mentah) selesai diimpor dalam waktu ~15 menit.
2. **Safe & Idempotent (Anti Duplikasi):**
   * Pengecekan *checksum* SHA-256 pada tabel `imported_files`. File yang sudah pernah diimpor akan otomatis dilewati (*SKIPPED*) tanpa menduplikasi data.
3. **Smart Date Normalization:**
   * Memperbaiki ambiguitas tanggal Excel dan mengekstrak tanggal sebenarnya dari transaksi POS (`YYMMDD`), serta validasi batas akhir hari per bulan (`calendar.monthrange`).
4. **Item Name & BOM Extraction:**
   * Memisahkan nama item dan kuantiti cup dari deskripsi (misal: `Cup Vanilla (3)` -> Item: `Cup Vanilla`, Qty: `3`).
   * Mengklasifikasikan bahan baku/kondimen (`POSSTOCK/COND`) terpisah dari produk jadi (`POSSTOCK_REGULAR`).
5. **Dashboard Web Interaktif:**
   * Tampilan modern gelap (*dark theme*) untuk manajemen eksekutif dan finance.
   * Pencarian langsung (*real-time search & filter*) jutaan transaksi berdasarkan toko, tanggal, akun COA, dan nomor transaksi.
6. **Handover Data Engineer:**
   * Tersedia script `export_database.bat` yang mengekspor seluruh basis data ke file terkompresi `pos_emerald_backup.dump` (~175 MB dari 3 GB data riil) untuk kemudahan serah terima ke tim Data Engineer / BI.

---

## 📂 Struktur Repositori

```text
.
├── config.json                 # Konfigurasi database & ETL
├── database.py                 # Manajemen koneksi PostgreSQL
├── parser.py                   # Parser Excel cerdas & normalisasi
├── importer.py                 # Core bulk ingestion engine
├── main.py                     # CLI controller (import, status, init, reset)
├── schema_pg.sql               # DDL Schema PostgreSQL 17
├── export_database.bat         # Script ekspor dump untuk Data Engineer
├── run_importer.bat            # Windows Launcher ETL (Double-click)
├── run_dashboard.bat           # Windows Launcher Web Dashboard
├── PANDUAN_DATA_ENGINEER.md    # Dokumen panduan handover untuk Data Engineer
│
└── web/                        # Next.js Fullstack Dashboard
    ├── app/
    │   ├── api/                # API Routes (stats, transactions, outlets, coa, upload)
    │   ├── page.tsx            # Halaman utama Cockpit Dashboard
    │   ├── layout.tsx          # Root Layout & Inter font
    │   └── globals.css         # Styling Tailwind CSS
    ├── lib/
    │   └── db.ts               # PostgreSQL Connection Pool
    ├── package.json
    └── next.config.mjs
```

---

## 🛠️ Panduan Instalasi & Penggunaan

### 1. Prasyarat Sistem
* **PostgreSQL 17** (tersedia di Laragon atau PostgreSQL standalone port `5432`).
* **Node.js 18+** & npm.
* **Python 3.9+** dengan paket:
  ```bash
  pip install psycopg2-binary xlrd openpyxl
  ```

### 2. Konfigurasi Kredensial (`config.json`)
```json
{
  "db_type": "postgres",
  "postgres": {
    "host": "127.0.0.1",
    "port": 5432,
    "user": "mrafnb",
    "password": "fnb@2031mra",
    "database": "pos_emerald"
  }
}
```

### 3. Menjalankan Ingestion Engine (ETL)
```bash
# Menjalankan impor otomatis seluruh file Excel di folder
python main.py import

# Melihat ringkasan status impor di terminal
python main.py status
```

### 4. Menjalankan Web Dashboard
```bash
cd web
npm install
npm run build
npm run start
```
Buka browser di: **`http://localhost:3000`**

---

## 📊 Kredensial Database Default
* **Database Name**: `pos_emerald`
* **Username**: `mrafnb`
* **Password**: `fnb@2031mra`
* **Port**: `5432`

---

## 📄 Lisensi
Hak Cipta © 2026 PT. Rahayu Arumdhani International / MRA Group.
