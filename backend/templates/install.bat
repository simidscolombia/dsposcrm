@echo off
echo ===================================================
echo   SIMIDS POS - INSTALADOR AUTOMATIZADO LOCAL
echo ===================================================
echo.
echo Verificando Node.js...
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado. Descarguelo desde https://nodejs.org/ e instale la version recomendada.
    pause
    exit /b
)

echo.
echo Instalando Gestor de Procesos (PM2)...
call npm install -g pm2 >nul 2>&1

echo.
echo Instalando dependencias del Sistema Base...
cd simidspos-backend
call npm install

echo.
echo Configurando e instalando la Interfaz Grafica...
cd ../simidspos-frontend
call npm install

echo.
echo Abriendo puertos de red local en Firewall de Windows (Puerto 3000)...
netsh advfirewall firewall add rule name="SIMIDS POS Port 3000" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1

echo.
echo Encendiendo el motor del sistema SIMIDS POS...
cd ../simidspos-backend
call pm2 start index.js --name "simids-pos-backend"
call pm2 save
call pm2 startup >nul 2>&1

echo.
echo ===================================================
echo INSTALACION COMPLETADA CON EXITO.
echo ===================================================
echo El sistema ya esta corriendo silenciosamente en segundo plano.
echo.
echo Para abrir la caja registradora en este computador:
echo - Abra Google Chrome e ingrese a: http://localhost:3000
echo.
echo Para abrir el sistema en una Tablet (Meseros):
echo - Conecte la tablet a esta misma red Wi-Fi y digite la IP local de este computador seguida de :3000
echo.
pause
