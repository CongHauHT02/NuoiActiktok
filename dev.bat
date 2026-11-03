@echo off
title TikTok Account Manager - Development Server
cd /d "%~dp0"
set "PATH=C:\Users\adminloc\AppData\Roaming\nvm\v20.11.1;%PATH%"
echo ========================================================
echo   TIKTOK ACCOUNT MANAGER (DEV MODE)
echo   Dang khoi dong tai: http://localhost:3000
echo ========================================================
call pnpm dev -p 3000
pause

