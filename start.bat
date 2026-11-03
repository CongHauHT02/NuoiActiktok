@echo off
title TikTok Account Manager - Production Server
cd /d "%~dp0"
set "PATH=C:\Users\adminloc\AppData\Roaming\nvm\v20.11.1;%PATH%"
echo ========================================================
echo   TIKTOK ACCOUNT MANAGER & AUTOMATION PLATFORM
echo   Dang khoi dong may chu tai: http://localhost:3000
echo ========================================================
call pnpm start -p 3000
pause

