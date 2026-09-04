@echo off
title Trading Journal - Einfacher Starter
color 0A
echo.
echo ========================================
echo    Trading Journal - Einfacher Starter
echo ========================================
echo.

REM Prüfe ob Node.js installiert ist
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js ist nicht installiert!
    echo Bitte installieren Sie Node.js von https://nodejs.org/
    pause
    exit /b 1
)

REM Wechsle zum Projektverzeichnis
cd /d "%~dp0"

REM Stoppe alle laufenden Node.js Prozesse auf Port 3000
echo Stoppe alte Prozesse...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Warte kurz
timeout /t 2 /nobreak >nul

REM Prüfe ob node_modules existiert
if not exist "node_modules" (
    echo Installiere Abhängigkeiten...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Fehler beim Installieren der Abhängigkeiten!
        pause
        exit /b 1
    )
)

echo.
echo Starte Trading Journal Server...
echo.
echo ========================================
echo    Server wird gestartet...
echo ========================================
echo.
echo Die App wird automatisch in Ihrem Browser geöffnet.
echo.
echo Für das Handy: http://192.168.0.61:3000
echo QR-Code: http://192.168.0.61:3000/qr-code.html
echo.
echo Drücken Sie Ctrl+C um den Server zu beenden.
echo.

REM Starte den Server
npm start

pause
