@echo off
chcp 65001 >nul
echo ========================================
echo   Meow - Go cai dat Windows Services
echo ========================================
echo.

:: Kiem tra quyen Admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [LOI] Can quyen Administrator!
    echo Click phai vao file nay va chon "Run as administrator"
    pause
    exit /b 1
)

SET "NSSM=%~dp0tools\nssm.exe"

if not exist "%NSSM%" (
    echo [LOI] Khong tim thay NSSM. Chay service-install.cmd truoc.
    pause
    exit /b 1
)

echo Dang dung va xoa services...
"%NSSM%" stop MeowBot
"%NSSM%" remove MeowBot confirm
"%NSSM%" stop MeowWeb
"%NSSM%" remove MeowWeb confirm

echo.
echo Xong! Services da duoc go cai dat.
pause
