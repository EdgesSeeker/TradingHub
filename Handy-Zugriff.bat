@echo off
title Trading Journal - Handy Zugriff
color 0B
echo.
echo ========================================
echo    Trading Journal - Handy Zugriff
echo ========================================
echo.

REM Ermittle die IP-Adresse
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set IP=%%a
    goto :found
)
:found

echo Ihre IP-Adresse: %IP%
echo.
echo ========================================
echo    Handy-Zugriff URLs:
echo ========================================
echo.
echo Haupt-App: http://%IP%:3000
echo QR-Code:   http://%IP%:3000/qr-code.html
echo Install:   http://%IP%:3000/pwa-install.html
echo.
echo ========================================
echo    Anleitung für Handy:
echo ========================================
echo.
echo 1. Öffnen Sie den Browser auf Ihrem Handy
echo 2. Geben Sie eine der URLs oben ein
echo 3. Für QR-Code: Scannen Sie mit der Kamera
echo 4. Für Installation: Folgen Sie den Anweisungen
echo.
echo ========================================

REM Öffne QR-Code Seite automatisch
echo Öffne QR-Code Seite...
start http://%IP%:3000/qr-code.html

echo.
echo Drücken Sie eine beliebige Taste zum Beenden...
pause >nul
