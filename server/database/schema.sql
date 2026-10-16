-- Schema Relacional SQLite - PratiCom ERP v2 (Clean MVC + DDD)
PRAGMA foreign_keys = ON;

-- 1. Condomínios (Tenants Raiz)
CREATE TABLE IF NOT EXISTS condominiums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    address TEXT,
    city TEXT,
    state TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Blocos / Torres
CREATE TABLE IF NOT EXISTS blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condominium_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(condominium_id, name),
    FOREIGN KEY (condominium_id) REFERENCES condominiums(id) ON DELETE CASCADE
);

-- 3. Unidades (Apartamentos/Casas)
CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_id INTEGER NOT NULL,
    number TEXT NOT NULL,
    floor INTEGER,
    type TEXT DEFAULT 'Residencial',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(block_id, number),
    FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
);

-- 4. Moradores
CREATE TABLE IF NOT EXISTS residents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    cpf TEXT,
    role TEXT DEFAULT 'Proprietário' CHECK(role IN ('Proprietário', 'Inquilino', 'Dependente')),
    emergency_contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);

-- 5. Veículos
CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    resident_id INTEGER,
    plate TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT,
    type TEXT DEFAULT 'Carro',
    parking_spot TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
);

-- 6. Encomendas (Portaria)
CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    resident_id INTEGER,
    courier TEXT NOT NULL,
    tracking_code TEXT,
    description TEXT,
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'PICKED_UP', 'CANCELLED')),
    pickup_code TEXT NOT NULL,
    notes TEXT,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    picked_up_at DATETIME,
    picked_up_by TEXT,
    cancelled_at DATETIME,
    cancellation_reason TEXT,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
);

-- 7. Controle de Acesso / Portaria
CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    destination_unit_id INTEGER NOT NULL,
    visitor_name TEXT NOT NULL,
    document TEXT NOT NULL,
    type TEXT DEFAULT 'Visitante',
    status TEXT DEFAULT 'IN_PROPERTY' CHECK(status IN ('IN_PROPERTY', 'EXITED')),
    company TEXT,
    vehicle_plate TEXT,
    entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    exited_at DATETIME,
    FOREIGN KEY (destination_unit_id) REFERENCES units(id) ON DELETE CASCADE
);

-- 8. Espaços / Áreas Comuns
CREATE TABLE IF NOT EXISTS spaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condominium_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    capacity INTEGER DEFAULT 30,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (condominium_id) REFERENCES condominiums(id) ON DELETE CASCADE
);

-- 9. Reservas de Espaços
CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    space_id INTEGER NOT NULL,
    resident_id INTEGER NOT NULL,
    unit_id INTEGER NOT NULL,
    reservation_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT DEFAULT 'CONFIRMED' CHECK(status IN ('CONFIRMED', 'CANCELLED')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);

-- 10. Transações Financeiras
CREATE TABLE IF NOT EXISTS financial_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condominium_id INTEGER NOT NULL,
    unit_id INTEGER,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    due_date TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'PAID')),
    payment_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (condominium_id) REFERENCES condominiums(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
);

-- 11. Mural de Comunicados
CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condominium_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Geral',
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('normal', 'urgente', 'alta')),
    is_pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (condominium_id) REFERENCES condominiums(id) ON DELETE CASCADE
);

-- 12. Mercadinho Autônomo - Produtos
CREATE TABLE IF NOT EXISTS market_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condominium_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Geral',
    price REAL NOT NULL CHECK(price >= 0),
    stock_quantity INTEGER DEFAULT 0 CHECK(stock_quantity >= 0),
    min_stock INTEGER DEFAULT 5,
    barcode TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (condominium_id) REFERENCES condominiums(id) ON DELETE CASCADE
);

-- 13. Vendas do Mercadinho (PDV)
CREATE TABLE IF NOT EXISTS market_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condominium_id INTEGER NOT NULL,
    unit_id INTEGER,
    resident_id INTEGER,
    total_amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (condominium_id) REFERENCES condominiums(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
);

-- 14. Itens da Venda do Mercadinho
CREATE TABLE IF NOT EXISTS market_sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES market_sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES market_products(id) ON DELETE CASCADE
);

-- 15. Módulos Habilitados por Condomínio
CREATE TABLE IF NOT EXISTS condominium_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condominium_id INTEGER NOT NULL,
    module_key TEXT NOT NULL,
    is_enabled INTEGER DEFAULT 1,
    UNIQUE(condominium_id, module_key),
    FOREIGN KEY (condominium_id) REFERENCES condominiums(id) ON DELETE CASCADE
);
