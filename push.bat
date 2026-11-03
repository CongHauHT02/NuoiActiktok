@echo off
title Push Code to GitHub
cd /d "%~dp0"
if exist "%LOCALAPPDATA%\Programs\Git\cmd" set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"

echo ========================================================
echo   TIKTOK ACCOUNT MANAGER - GITHUB PUSH
echo   Repo: https://github.com/CongHauHT02/NuoiActiktok.git
echo ========================================================

echo Dang day code len GitHub...
git push -u origin main
if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo   [THANH CONG] Da day toan bo ma nguon len GitHub!
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   [YEU CAU XAC THUC GITHUB]
    echo   Ban co the dan Personal Access Token (PAT) de day ngay:
    echo ========================================================
    set /p GITHUB_TOKEN="Nhap GitHub Token (ghp_...): "
    if defined GITHUB_TOKEN (
        git push https://CongHauHT02:%GITHUB_TOKEN%@github.com/CongHauHT02/NuoiActiktok.git main
    )
)
echo.
pause
