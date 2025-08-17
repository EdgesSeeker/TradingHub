@echo off
title Trading Journal Starter
echo ========================================
echo    Trading Journal wird gestartet...
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

echo Starte Trading Journal Server...
echo.
echo Das Journal wird automatisch in Ihrem Browser geöffnet.
echo Drücken Sie Ctrl+C um den Server zu beenden.
echo.

REM Starte den Server und öffne Browser nach 3 Sekunden
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"
npm start

pause 