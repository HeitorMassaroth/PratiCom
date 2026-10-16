import db from '../config/database.js';

export function seedDatabase() {
  const existingCondo = db.prepare('SELECT COUNT(*) as count FROM condominiums').get();
  if (existingCondo.count > 0) return;

  console.log('🌱 Povoando banco de dados inicial do PratiCom ERP...');

  const insertCondo = db.prepare(`
    INSERT INTO condominiums (id, name, cnpj, address, city, state, phone, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBlock = db.prepare(`
    INSERT INTO blocks (id, condominium_id, name, description)
    VALUES (?, ?, ?, ?)
  `);

  const insertUnit = db.prepare(`
    INSERT INTO units (id, block_id, number, floor, type)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertResident = db.prepare(`
    INSERT INTO residents (id, unit_id, name, email, phone, cpf, role, emergency_contact)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (id, unit_id, resident_id, plate, model, color, type, parking_spot)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDelivery = db.prepare(`
    INSERT INTO deliveries (id, unit_id, resident_id, courier, tracking_code, description, status, pickup_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAccess = db.prepare(`
    INSERT INTO access_logs (id, destination_unit_id, visitor_name, document, type, status, company, vehicle_plate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSpace = db.prepare(`
    INSERT INTO spaces (id, condominium_id, name, capacity, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertReservation = db.prepare(`
    INSERT INTO reservations (id, space_id, resident_id, unit_id, reservation_date, start_time, end_time, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTx = db.prepare(`
    INSERT INTO financial_transactions (id, condominium_id, unit_id, type, category, description, amount, due_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (id, condominium_id, title, content, category, priority, is_pinned)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertProduct = db.prepare(`
    INSERT INTO market_products (id, condominium_id, name, category, price, stock_quantity, min_stock, barcode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertModule = db.prepare(`
    INSERT INTO condominium_modules (condominium_id, module_key, is_enabled)
    VALUES (?, ?, 1)
  `);

  const runSeed = db.transaction(() => {
    // 1. Condomínios
    insertCondo.run(1, 'Residencial Solar das Palmeiras', '12.345.678/0001-90', 'Av. das Américas, 1500', 'Curitiba', 'PR', '(41) 3344-5566', 'ACTIVE');
    insertCondo.run(2, 'Edifício Bosque das Flores', '98.765.432/0001-10', 'Rua XV de Novembro, 450', 'Curitiba', 'PR', '(41) 3222-1100', 'ACTIVE');

    // 2. Módulos Ativos
    const modules = ['dashboard', 'deliveries', 'access', 'residents', 'reservations', 'financial', 'announcements', 'market'];
    for (const m of modules) {
      insertModule.run(1, m);
      insertModule.run(2, m);
    }

    // 3. Blocos
    insertBlock.run(1, 1, 'Torre A - Acácia', 'Bloco frontal voltado para a portaria principal');
    insertBlock.run(2, 1, 'Torre B - Bromélia', 'Bloco dos fundos voltado para a área de lazer');
    insertBlock.run(3, 2, 'Bloco Único', 'Edifício residencial exclusivo');

    // 4. Unidades
    insertUnit.run(1, 1, '101', 1, 'Residencial');
    insertUnit.run(2, 1, '102', 1, 'Residencial');
    insertUnit.run(3, 1, '201', 2, 'Residencial');
    insertUnit.run(4, 2, '101', 1, 'Residencial');
    insertUnit.run(5, 3, '501', 5, 'Residencial');

    // 5. Moradores
    insertResident.run(1, 1, 'Mariana Silva Santos', 'mariana.silva@email.com', '(41) 99111-2233', '123.456.789-00', 'Proprietário', 'Irmã: (41) 98877-6655');
    insertResident.run(2, 1, 'Carlos Eduardo Santos', 'carlos.santos@email.com', '(41) 99222-3344', '234.567.890-11', 'Proprietário', 'Esposa: (41) 99111-2233');
    insertResident.run(3, 2, 'Ana Beatriz Oliveira', 'ana.oliveira@email.com', '(41) 99333-4455', '345.678.901-22', 'Inquilino', 'Mãe: (41) 97766-5544');
    insertResident.run(4, 3, 'Fernando Costa Lima', 'fernando.costa@email.com', '(41) 99444-5566', '456.789.012-33', 'Proprietário', 'Esposa: (41) 98811-2233');

    // 6. Veículos
    insertVehicle.run(1, 1, 1, 'BRA2E19', 'Jeep Compass Limited', 'Preto Carbono', 'SUV', 'Vaga 101-A');
    insertVehicle.run(2, 2, 3, 'ABC1234', 'Honda Civic Touring', 'Prata', 'Sedan', 'Vaga 102-B');
    insertVehicle.run(3, 3, 4, 'PRT9Z88', 'Toyota Corolla Cross', 'Branco Polar', 'SUV', 'Vaga 201');

    // 7. Encomendas
    insertDelivery.run(1, 1, 1, 'Mercado Livre', 'MLB9988776655', 'Caixa grande de utilidades domésticas', 'PENDING', '4821');
    insertDelivery.run(2, 2, 3, 'Amazon Express', 'AMZ11223344', 'Livros e eletrônicos', 'PENDING', '7392');

    // 8. Portaria / Controle de Acesso
    insertAccess.run(1, 1, 'Marcos Vinicius Técnico', '45.890.123-X', 'Prestador de Serviço', 'IN_PROPERTY', 'Copel Manutenções', 'COP4455');
    insertAccess.run(2, 2, 'Juliana Mendes', '32.145.678-9', 'Visitante', 'IN_PROPERTY', 'Particular', 'JUL9988');

    // 9. Espaços Comuns
    insertSpace.run(1, 1, 'Salão de Festas Nobre', 60, 'Salão climatizado com cozinha completa, churrasqueira e mesas');
    insertSpace.run(2, 1, 'Espaço Gourmet & Churrasqueira', 25, 'Área aberta com forno de pizza e churrasqueira a carvão');
    insertSpace.run(3, 1, 'Quadra Poliesportiva', 20, 'Quadra coberta com vestiário anexo');

    // 10. Reservas
    const today = new Date().toISOString().split('T')[0];
    insertReservation.run(1, 1, 1, 1, today, '14:00', '22:00', 'CONFIRMED');

    // 11. Financeiro
    insertTx.run(1, 1, 1, 'income', 'Taxa Condominial', 'Cota Condominial Ref. Mês Atual - Apto 101', 480.00, today, 'PAID');
    insertTx.run(2, 1, 2, 'income', 'Taxa Condominial', 'Cota Condominial Ref. Mês Atual - Apto 102', 480.00, today, 'PENDING');
    insertTx.run(3, 1, null, 'expense', 'Manutenção Elevadores', 'Manutenção preventiva mensal - Atlas Schindler', 1250.00, today, 'PAID');
    insertTx.run(4, 1, null, 'expense', 'Limpeza e Portaria', 'Empresa Terceirizada Alpha Facilities', 4500.00, today, 'PENDING');

    // 12. Comunicados
    insertAnnouncement.run(1, 1, 'Assembleia Geral Ordinária de Moradores', 'Convocação para AGO com prestação de contas no Salão de Festas.', 'Assembleia', 'alta', 1);
    insertAnnouncement.run(2, 1, 'Manutenção Preventiva das Bombas de Água', 'Haverá breve interrupção no fornecimento das 14h às 16h nesta quinta.', 'Manutenção', 'urgente', 1);
    insertAnnouncement.run(3, 1, 'Uso Consciente das Vagas de Garagem', 'Lembramos a todos que não é permitido estacionar fora da demarcação.', 'Geral', 'normal', 0);

    // 13. Mercadinho Autônomo
    insertProduct.run(1, 1, 'Refrigerante Coca-Cola 350ml', 'Bebidas', 5.50, 24, 6, '7891000100101');
    insertProduct.run(2, 1, 'Água Mineral Crystal sem Gás 500ml', 'Bebidas', 3.00, 30, 10, '7891000100102');
    insertProduct.run(3, 1, 'Salgadinho Doritos Queijo Nacho 84g', 'Snacks', 8.90, 4, 5, '7891000100103');
    insertProduct.run(4, 1, 'Chocolate Barra Nestlé Classic 90g', 'Doces', 6.90, 15, 5, '7891000100104');
    insertProduct.run(5, 1, 'Sorvete Kibon Pote 1.5L', 'Congelados', 26.90, 8, 3, '7891000100105');
  });

  runSeed();
  console.log('✅ Banco de dados SQLite populado com sucesso!');
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
