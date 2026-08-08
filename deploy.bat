@echo off
title Deploy SterneSite
if not "%~dp0"=="" cd /d "%~dp0"

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
if errorlevel 1 (
    git commit -m "update: %date% %time%"
    if errorlevel 1 (
        echo [ERROR] git commit failed.
        pause
        exit /b 1
    )
) else (
    echo No new changes to commit. Will try push anyway.
)

echo.
echo Pushing to GitHub ...
git push origin HEAD
if errorlevel 1 (
    echo.
    echo [ERROR] git push failed.
    echo Common causes: network problem / proxy not on / not logged in.
    echo Your commits are safe on this computer. Fix network and run again.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Done! Cloudflare Pages will auto-redeploy
echo   in 1-2 minutes. Check the CF dashboard.
echo ============================================
pause
