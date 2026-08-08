@echo off
title New Post - SterneSite
cd /d "%~dp0"

echo.
echo Starting New Post helper...
echo.
python new_post.py
if errorlevel 1 (
    echo.
    echo [INFO] Script exited without success.
    echo If python is not installed, install it from python.org
    echo ^(check "Add python.exe to PATH" during install^).
)
echo.
pause
