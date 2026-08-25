$env:PATH = "C:\Users\richa\.gemini\antigravity-ide\scratch\nodejs;" + $env:PATH

# Iniciar servidor backend em segundo plano
Start-Process -FilePath "C:\Users\richa\.gemini\antigravity-ide\scratch\nodejs\node.exe" -ArgumentList "server.js" -WorkingDirectory "C:\Users\richa\.gemini\antigravity-ide\scratch\condo-erp\server" -WindowStyle Hidden

# Iniciar frontend Vite
Set-Location "C:\Users\richa\.gemini\antigravity-ide\scratch\condo-erp\client"
& "C:\Users\richa\.gemini\antigravity-ide\scratch\nodejs\npm.cmd" run dev
