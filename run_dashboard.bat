@echo off
title POS Emerald Fullstack Next.js Dashboard
color 0A
echo ======================================================================
echo           POS EMERALD WEB DASHBOARD (FULLSTACK NEXT.JS)
echo ======================================================================
echo.

cd /d "%~dp0web"

echo Memeriksa instalasi Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js tidak terdeteksi di sistem PATH!
    pause
    exit /b 1
)

echo Membuka browser ke http://localhost:3000...
start http://localhost:3000

echo Menjalankan Next.js Web Server di port 3000...
echo Tekan CTRL + C untuk menghentikan server.
echo.
npm run dev
pause
