@echo off
title TikTok Account Manager - Production Server
cd /d "%~dp0"

:: Add common nvm and node directories to PATH if present
if exist "%LOCALAPPDATA%\Programs\nodejs" set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
if exist "%APPDATA%\nvm\v20.11.1" set "PATH=%APPDATA%\nvm\v20.11.1;%PATH%"
if exist "%APPDATA%\nvm\current" set "PATH=%APPDATA%\nvm\current;%PATH%"
if exist "%ProgramFiles%\nodejs" set "PATH=%ProgramFiles%\nodejs;%PATH%"

echo ========================================================
echo   TIKTOK ACCOUNT MANAGER & AUTOMATION PLATFORM
echo   Dang khoi dong may chu tai: http://localhost:3000
echo ========================================================

where pnpm >nul 2>nul
if %errorlevel% equ 0 (
  call pnpm start -p 3000
) else (
  where npm >nul 2>nul
  if %errorlevel% equ 0 (
    call npm start -- -p 3000
  ) else (
    echo [LOI] Khong tim thay Node.js hoac pnpm/npm tren he thong.
    echo Vui long cai dat Node.js tai: https://nodejs.org
  )
)
pause
