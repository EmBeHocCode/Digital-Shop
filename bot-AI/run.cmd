@echo off
chcp 65001 >nul
SET "PATH=%USERPROFILE%\.bun\bin;%PATH%"
SET "BOT_PORT=10000"

:: Doc PORT tu apps\bot\.env (neu co), fallback 10000
if exist "%~dp0apps\bot\.env" (
  for /f "usebackq tokens=1,* delims==" %%A in ("%~dp0apps\bot\.env") do (
    if /I "%%A"=="PORT" set "BOT_PORT=%%B"
  )
)

if not exist "%~dp0logs" mkdir "%~dp0logs"
if not exist "%~dp0service-logs\web" mkdir "%~dp0service-logs\web"
if not exist "%~dp0service-logs\bot" mkdir "%~dp0service-logs\bot"

echo ========================================
echo   Meow - Khoi dong lai...
echo ========================================
echo.

:: Kill old windows by title
echo [0/2] Dong cac cua so cu...
taskkill /FI "WINDOWTITLE eq Meow - Web Dashboard" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Meow - Bot" /F >nul 2>&1

:: Stop services neu da cai NSSM (tranh service auto-restart gay start chong)
if exist "%~dp0tools\nssm.exe" (
  "%~dp0tools\nssm.exe" stop MeowBot >nul 2>&1
  "%~dp0tools\nssm.exe" stop MeowWeb >nul 2>&1
)

:: Kill processes on ports 3000 and BOT_PORT
powershell -NoProfile -Command ^
  "$ports = @(3000, %BOT_PORT%); foreach ($p in $ports) { $pid2 = (Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1); if ($pid2) { Stop-Process -Id $pid2 -Force -ErrorAction SilentlyContinue; Write-Host `"  Killed port $p (PID $pid2)`" } }"

:: Remove Next.js dev lock if stale
if exist "%~dp0apps\web\.next\dev\lock" (
  del /f /q "%~dp0apps\web\.next\dev\lock" >nul 2>&1
  echo   Next.js lock removed
)

timeout /t 1 /nobreak >nul
echo.

echo [1/2] Khoi dong Bot (port %BOT_PORT%)...
start "Meow - Bot" cmd /k "chcp 65001 >nul && SET PATH=%USERPROFILE%\.bun\bin;%PATH% && SET PORT=%BOT_PORT% && cd /d %~dp0apps\bot && bun run dev"

timeout /t 3 /nobreak >nul
echo.

echo [2/2] Khoi dong Web Dashboard (port 3000)...
echo.
echo    Bot : http://localhost:%BOT_PORT%
echo    Web : http://localhost:3000
echo.

title Meow - Web Dashboard
cd /d "%~dp0apps\web"
powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Set-Location '%~dp0apps\web'; bun run dev 2>&1 | Tee-Object -FilePath '%~dp0service-logs\web\stdout.log'"
