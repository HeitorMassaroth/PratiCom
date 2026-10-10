@echo off
title Iniciando Praticom ERP
echo ====================================================
echo   🚀 INICIANDO SISTEMA PRATICOM ERP (BACKEND + FRONTEND)
echo ====================================================
echo.

:: 1. Iniciar Servidor Backend (Node.js/Express na porta 5000)
echo [1/2] Iniciando Servidor Backend (Porta 5000)...
start "Praticom - Backend (Porta 5000)" cmd /k "cd /d "%~dp0server" && npm run dev"

:: Aguarda 2 segundos para inicializacao do servidor
ping 127.0.0.1 -n 3 >nul

:: 2. Iniciar Cliente Frontend (Vite/React na porta 5173)
echo [2/2] Iniciando Cliente Frontend (Porta 5173)...
start "Praticom - Frontend (Porta 5173)" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo ====================================================
echo   ✅ Servicos iniciados em janelas separadas!
echo   🌐 O sistema estara disponivel em: http://localhost:5173
echo ====================================================
echo.
pause
