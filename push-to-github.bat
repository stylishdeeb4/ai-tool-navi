@echo off
chcp 65001 > nul
echo.
echo ========================================
echo  ai-tool-navi を GitHub にプッシュします
echo ========================================
echo.

cd /d "%~dp0"

git init
git add .
git commit -m "first commit: AI tool navi site"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/stylishdeeb4/ai-tool-navi.git
git push -u origin main

echo.
echo ========================================
if %ERRORLEVEL% == 0 (
    echo  完了！GitHubへのプッシュが成功しました
) else (
    echo  エラーが発生しました
    echo  GitHubにログインしているか確認してください
)
echo ========================================
echo.
pause
