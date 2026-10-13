# 🚀 COMO INICIAR E ABRIR O PRATICOM ERP

## ⚡ Método Rápido (Arquivos Batch - Windows)

Você pode dar duplo clique nos arquivos `.bat` na raiz do projeto:

1. **[`iniciar_sistema.bat`](file:///c:/Users/Heitor/Praticom/iniciar_sistema.bat)**: Inicializa automaticamente o backend (Node.js/Express) e o frontend (Vite/React) em janelas dedicadas do prompt de comando.
2. **[`abrir_sistema.bat`](file:///c:/Users/Heitor/Praticom/abrir_sistema.bat)**: Abre a aplicação web diretamente no seu navegador padrão (`http://localhost:5173`).

---

## 🛠️ Método Manual (Terminal / PowerShell)

### 1. Iniciar o Backend
```powershell
cd server 
npm run dev
```

### 2. Iniciar o Frontend
```powershell
cd client
npm run dev
```

### 3. Acessar no Navegador
Acesse [http://localhost:5173](http://localhost:5173).