@echo off
title TikTok Account Manager - Development Server
cd /d "%~dp0"

:: Ensure modern Node v20 is loaded first
if exist "C:\Users\adminloc\AppData\Roaming\nvm\v20.11.1" set "PATH=C:\Users\adminloc\AppData\Roaming\nvm\v20.11.1;%PATH%"
if exist "C:\Users\dchau\AppData\Roaming\nvm\v20.11.1" set "PATH=C:\Users\dchau\AppData\Roaming\nvm\v20.11.1;%PATH%"
if exist "%APPDATA%\nvm\v20.11.1" set "PATH=%APPDATA%\nvm\v20.11.1;%PATH%"
if exist "%LOCALAPPDATA%\Programs\nodejs" set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
if exist "%APPDATA%\nvm\current" set "PATH=%APPDATA%\nvm\current;%PATH%"

echo ========================================================
echo   TIKTOK ACCOUNT MANAGER (DEV MODE)
echo   Dang khoi dong tai: http://localhost:3000
echo ========================================================

node -v
where pnpm >nul 2>nul
if %errorlevel% equ 0 (
  call pnpm dev -p 3000
) else (
  where npm >nul 2>nul
  if %errorlevel% equ 0 (
    call npm run dev -- -p 3000
  ) else (
    echo [LOI] Khong tim thay Node.js hoac pnpm/npm tren he thong.
    echo Vui long cai dat Node.js tai: https://nodejs.org
  )
)
pause
