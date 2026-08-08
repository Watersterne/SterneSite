@echo off
title Word to Post - SterneSite
cd /d "%~dp0.."

echo.
echo Starting Word to Post converter...
echo.
python scripts\doc2post.py
if errorlevel 1 (
    echo.
    echo [INFO] Script exited without success.
    echo Make sure python and python-docx are installed:
    echo   pip install python-docx
)
echo.
pause
