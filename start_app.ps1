# Script de Inicialização Rápida - PratiCom ERP v2 (Clean MVC + DDD)
Write-Host "🚀 Inicializando PratiCom ERP v2..." -ForegroundColor Cyan

# Inicia Servidor Backend em segundo plano
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm.cmd run dev"

# Inicia Servidor Frontend
Set-Location client
npm.cmd run dev
