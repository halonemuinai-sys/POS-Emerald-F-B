@echo off
echo ========================================================
echo EXPORT DATABASE POS EMERALD (POSTGRESQL 17)
echo Standard Dump for Data Engineers / Team Migration
echo ========================================================
echo.

set PG_BIN=C:\laragon\bin\postgresql\postgresql-17\bin
set DUMP_FILE=pos_emerald_backup.dump

echo Mengekspor database pos_emerald (7.7 juta transaksi) ke %DUMP_FILE%...
echo Format: PostgreSQL Custom Archive (Terkompresi otomatis ~300-400 MB)
echo.

"%PG_BIN%\pg_dump.exe" -h 127.0.0.1 -p 5432 -U postgres -d pos_emerald -F c -b -v -f "%DUMP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo SUKSES! File dump telah dibuat: %DUMP_FILE%
    echo File ini siap dikirim ke Data Engineer Anda.
    echo ========================================================
) else (
    echo.
    echo [ERROR] Gagal mengekspor database.
)

pause
