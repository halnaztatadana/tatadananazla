@echo off
cd /d "%~dp0"
echo ========================================================
echo   MENGIRIM KODE TERBARU TATADANA KE GITHUB
echo   Repo: https://github.com/halidanazla10-gif/tatadanaa.git
echo ========================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo [SUKSES] Semua kode terbaru berhasil terkirim ke GitHub!
) else (
    echo [INFO] Jika diminta login, silakan klik 'Sign in with your browser'.
)
echo.
pause
