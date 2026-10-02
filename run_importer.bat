@echo off
title POS Emerald Excel Importer - Laragon MySQL
color 0A
echo ======================================================================
echo           POS EMERALD INGESTION ENGINE (LARAGON MYSQL)
echo ======================================================================
echo.

cd /d "%~dp0"

echo Memeriksa instalasi Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python tidak terdeteksi di sistem PATH!
    echo Silakan instal Python atau jalankan lewat terminal Laragon.
    pause
    exit /b 1
)

echo Menjalankan engine impor file Excel...
echo.
python main.py import

echo.
echo ======================================================================
echo Selesai! Tekan tombol apa saja untuk melihat status database...
echo ======================================================================
pause >nul

python main.py status
echo.
pause
