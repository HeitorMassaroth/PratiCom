# Script de Inicialização do Praticom (Backend + Frontend)

$projectRoot = $PSScriptRoot

Write-Host "🚀 Iniciando backend Node.js / Express..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "$projectRoot\server" -WindowStyle Hidden

Write-Host "🚀 Iniciando frontend Vite / React..." -ForegroundColor Cyan
Set-Location "$projectRoot\client"
npm run dev
