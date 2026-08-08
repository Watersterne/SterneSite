@echo off
title Deploy SterneSite
cd /d "%~dp0"

echo ============================================
echo   Deploy to GitHub  -^>  Cloudflare Pages
echo ============================================
echo.

git rev-parse --is-inside-work-tree >/dev/null 2>&1
if errorlevel 1 (
    echo [ERROR] Not a git repository yet.
    pause
    exit /b 1
)

git add .

git diff --cached --quiet
if %errorlevel%==0 (
    echo No changes detected. Nothing to deploy.
    pause
    exit /b 0
)

set MSG=%*
if "%MSG%"=="" set MSG=update: %date% %time%

git commit -m "%MSG%"
if errorlevel 1 (
    echo [ERROR] git commit failed.
    pause
    exit /b 1
)

echo.
echo Pushing to GitHub ...
git push origin HEAD
if errorlevel 1 (
    echo [ERROR] git push failed. Check network / GitHub login.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Done! Cloudflare Pages will auto-redeploy
echo   in 1-2 minutes. Check the CF dashboard.
echo ============================================
pause
