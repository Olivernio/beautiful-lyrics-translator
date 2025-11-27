@echo off
echo ========================================
echo Servidor de Traduccion de Letras
echo ========================================
echo.

cd /d "%~dp0"

echo Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no encontrado. Por favor instala Python 3.8 o superior.
    pause
    exit /b 1
)

echo.
echo Iniciando servidor...
echo.
python server.py

pause

