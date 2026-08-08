@echo off
chcp 65001 >nul
title 一键部署 - SterneSite
cd /d "%~dp0"

echo ========================================
echo   一键部署到 GitHub + Cloudflare Pages
echo ========================================
echo.

REM 检查是否为 git 仓库
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo [错误] 当前目录还不是 git 仓库，请先完成初始化关联。
    pause
    exit /b 1
)

REM 暂存所有改动
git add .

REM 检查是否有实际改动
git diff --cached --quiet
if %errorlevel%==0 (
    echo 没有检测到任何改动，无需部署。
    pause
    exit /b 0
)

REM 输入提交说明（可留空自动生成）
set MSG=
set /p MSG=请输入本次更新说明（直接回车自动生成）: 
if "%MSG%"=="" set MSG=update: %date% %time%

git commit -m "%MSG%"
if errorlevel 1 (
    echo [错误] 提交失败，请检查上方报错信息。
    pause
    exit /b 1
)

echo.
echo 正在推送到 GitHub ...
git push
if errorlevel 1 (
    echo [错误] 推送失败，常见原因：网络问题 / 未登录 GitHub 账号。
    pause
    exit /b 1
)

echo.
echo ========================================
echo   推送成功！
echo   Cloudflare Pages 会在 1-2 分钟内自动重新部署，
echo   可去 Cloudflare 控制台查看部署进度。
echo ========================================
pause
