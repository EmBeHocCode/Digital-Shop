@echo off
chcp 65001 >nul
echo ========================================
echo   Meow - Cai dat Windows Services
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

SET "ROOT=%~dp0"
SET "BUN=%USERPROFILE%\.bun\bin\bun.exe"
SET "BOT_DIR=%ROOT%apps\bot"
SET "WEB_DIR=%ROOT%apps\web"
SET "TOOLS_DIR=%ROOT%tools"
SET "LOGS_DIR=%ROOT%service-logs"
SET "BOT_PORT=10000"

:: Doc PORT tu apps\bot\.env (neu co), fallback 10000
if exist "%BOT_DIR%\.env" (
    for /f "usebackq tokens=1,* delims==" %%A in ("%BOT_DIR%\.env") do (
        if /I "%%A"=="PORT" set "BOT_PORT=%%B"
    )
)

:: Tao thu muc can thiet
if not exist "%TOOLS_DIR%" mkdir "%TOOLS_DIR%"
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"
if not exist "%LOGS_DIR%\web" mkdir "%LOGS_DIR%\web"
if not exist "%LOGS_DIR%\bot" mkdir "%LOGS_DIR%\bot"

:: Kiem tra bun
if not exist "%BUN%" (
    echo [LOI] Khong tim thay bun tai: %BUN%
    echo Hay cai dat bun truoc: https://bun.sh
    pause
    exit /b 1
)

:: Download NSSM neu chua co
if not exist "%TOOLS_DIR%\nssm.exe" (
    echo [1/4] Tai NSSM...
    powershell -NoProfile -Command ^
        "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile '%TOOLS_DIR%\nssm.zip' -UseBasicParsing"
    if not exist "%TOOLS_DIR%\nssm.zip" (
        echo [LOI] Khong tai duoc NSSM. Kiem tra ket noi mang.
        echo Hoac tai thu cong: https://nssm.cc/download
        echo Va dat vao: %TOOLS_DIR%\nssm.exe
        pause
        exit /b 1
    )
    powershell -NoProfile -Command ^
        "Expand-Archive '%TOOLS_DIR%\nssm.zip' '%TOOLS_DIR%\nssm-tmp' -Force; Copy-Item '%TOOLS_DIR%\nssm-tmp\nssm-2.24\win64\nssm.exe' '%TOOLS_DIR%\nssm.exe' -Force; Remove-Item '%TOOLS_DIR%\nssm-tmp' -Recurse -Force; Remove-Item '%TOOLS_DIR%\nssm.zip' -Force"
    echo     NSSM da san sang.
) else (
    echo [1/4] NSSM da co san.
)

SET "NSSM=%TOOLS_DIR%\nssm.exe"

:: Xoa service cu neu ton tai
echo.
echo [2/4] Xoa service cu (neu co)...
"%NSSM%" stop MeowBot 2>nul
"%NSSM%" remove MeowBot confirm 2>nul
"%NSSM%" stop MeowWeb 2>nul
"%NSSM%" remove MeowWeb confirm 2>nul
timeout /t 2 /nobreak >nul

:: Cai dat MeowBot service
echo.
echo [3/4] Cai dat service MeowBot (port %BOT_PORT%)...
"%NSSM%" install MeowBot "%BUN%"
"%NSSM%" set MeowBot AppParameters "run dev"
"%NSSM%" set MeowBot AppDirectory "%BOT_DIR%"
"%NSSM%" set MeowBot DisplayName "Meow - Bot Service"
"%NSSM%" set MeowBot Description "Zalo AI Bot - tu dong chay khi Windows khoi dong"
"%NSSM%" set MeowBot Start SERVICE_AUTO_START
"%NSSM%" set MeowBot AppEnvironmentExtra "PATH=%USERPROFILE%\.bun\bin;%PATH%" "PORT=%BOT_PORT%"
"%NSSM%" set MeowBot AppStdout "%LOGS_DIR%\bot\stdout.log"
"%NSSM%" set MeowBot AppStderr "%LOGS_DIR%\bot\stderr.log"
"%NSSM%" set MeowBot AppRotateFiles 1
"%NSSM%" set MeowBot AppRotateOnline 1
"%NSSM%" set MeowBot AppRotateBytes 10485760
"%NSSM%" set MeowBot AppRestartDelay 5000
echo     MeowBot da cai dat.

:: Cai dat MeowWeb service
echo.
echo [4/4] Cai dat service MeowWeb (port 3000)...
"%NSSM%" install MeowWeb "%BUN%"
"%NSSM%" set MeowWeb AppParameters "run dev"
"%NSSM%" set MeowWeb AppDirectory "%WEB_DIR%"
"%NSSM%" set MeowWeb DisplayName "Meow - Web Dashboard"
"%NSSM%" set MeowWeb Description "Meow Web Dashboard - tu dong chay khi Windows khoi dong"
"%NSSM%" set MeowWeb Start SERVICE_AUTO_START
"%NSSM%" set MeowWeb AppEnvironmentExtra "PATH=%USERPROFILE%\.bun\bin;%PATH%" "PORT=3000"
"%NSSM%" set MeowWeb AppStdout "%LOGS_DIR%\web\stdout.log"
"%NSSM%" set MeowWeb AppStderr "%LOGS_DIR%\web\stderr.log"
"%NSSM%" set MeowWeb AppRotateFiles 1
"%NSSM%" set MeowWeb AppRotateOnline 1
"%NSSM%" set MeowWeb AppRotateBytes 10485760
"%NSSM%" set MeowWeb AppRestartDelay 5000
echo     MeowWeb da cai dat.

:: Khoi dong ca 2 service
echo.
echo Dang khoi dong services...
"%NSSM%" start MeowBot
timeout /t 5 /nobreak >nul
"%NSSM%" start MeowWeb

echo.
echo ========================================
echo   HOAN TAT!
echo ========================================
echo.
echo   Services da duoc cai dat va se tu dong
echo   chay moi khi Windows khoi dong.
echo.
echo   Bot  : http://localhost:%BOT_PORT%
echo   Web  : http://localhost:3000
echo.
echo   Quan ly trong Services (services.msc)
echo   - MeowBot  : Meow - Bot Service
echo   - MeowWeb  : Meow - Web Dashboard
echo.
echo   De go cai dat: chay service-uninstall.cmd
echo.
pause
