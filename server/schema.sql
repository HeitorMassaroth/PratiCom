-- Schema DDL para Banco de Dados Relacional SQLite do Praticom ERP
PRAGMA foreign_keys = ON;

-- 1. Unidades Condominiais
CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block TEXT NOT NULL,
    number TEXT NOT NULL,
    floor INTEGER,
    type TEXT DEFAULT 'Residencial',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(block, number)
);

-- 2. Moradores
CREATE TABLE IF NOT EXISTS residents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    cpf TEXT,
    role TEXT DEFAULT 'Proprietário',
    emergency_contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);

-- 3. Veículos
CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    resident_id INTEGER,
    plate TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT,
    type TEXT DEFAULT 'Carro',
    parking_spot TEXT,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
);

-- 4. Animais de Estimação (Pets)
CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    resident_id INTEGER,
    name TEXT NOT NULL,
    species TEXT DEFAULT 'Cachorro',
    breed TEXT,
    size TEXT,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
);

-- 5. Encomendas (Portaria)
CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    resident_id INTEGER,
    courier TEXT NOT NULL,
    tracking_code TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending',
    pickup_code TEXT NOT NULL,
    notes TEXT,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    picked_up_at DATETIME,
    picked_up_by TEXT,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
);

-- 6. Controle de Acesso (Portaria)
CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_name TEXT NOT NULL,
    document TEXT NOT NULL,
    type TEXT DEFAULT 'Visitante',
    destination_unit_id INTEGER NOT NULL,
    entry_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    exit_time DATETIME,
    status TEXT DEFAULT 'IN_PROPERTY',
    notes TEXT,
    FOREIGN KEY (destination_unit_id) REFERENCES units(id) ON DELETE CASCADE
);

-- 7. Espaços Comuns
CREATE TABLE IF NOT EXISTS spaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    capacity INTEGER NOT NULL,
    price_per_hour REAL DEFAULT 0,
    rules TEXT
);

-- 8. Reservas de Espaços
CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    space_id INTEGER NOT NULL,
    unit_id INTEGER NOT NULL,
    resident_id INTEGER NOT NULL,
    reservation_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    total_price REAL DEFAULT 0,
    status TEXT DEFAULT 'CONFIRMED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
);

-- 9. Transações Financeiras
CREATE TABLE IF NOT EXISTS financial_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    due_date DATE NOT NULL,
    paid_at DATETIME,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
);

-- 10. Mural de Comunicados
CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Geral',
    priority TEXT DEFAULT 'normal',
    author TEXT DEFAULT 'Síndico Geral',
    target_block TEXT DEFAULT 'Todos',
    is_pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATE
);

-- 11. Mercadinho - Produtos
CREATE TABLE IF NOT EXISTS market_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    barcode TEXT
);

-- 12. Mercadinho - Vendas (PDV)
CREATE TABLE IF NOT EXISTS market_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    resident_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
);

-- 13. Mercadinho - Itens da Venda
CREATE TABLE IF NOT EXISTS market_sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES market_sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES market_products(id) ON DELETE SET NULL
);

-- 14. Configurações persistentes da Linha de Produtos (LPS)
CREATE TABLE IF NOT EXISTS app_features (
    feature TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices Otimizados
CREATE INDEX IF NOT EXISTS idx_residents_unit ON residents(unit_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_access_status ON access_logs(status);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_financial_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_market_sale_items_sale ON market_sale_items(sale_id);
