// ============================================================================
// PratiCom ERP - Initial Seed Data
// Popula o banco de dados SQLite com dados complexos, relacionais e realistas
// ============================================================================

export function seedDatabase(dbEngine) {
  const Condominiums = dbEngine.getTable('condominiums');
  const Modules = dbEngine.getTable('condominium_modules');
  const CondoSettings = dbEngine.getTable('condo_settings');
  const Blocks = dbEngine.getTable('blocks');
  const Units = dbEngine.getTable('units');
  const Residents = dbEngine.getTable('residents');
  const Users = dbEngine.getTable('users');
  const Vehicles = dbEngine.getTable('vehicles');
  const Pets = dbEngine.getTable('pets');
  const Deliveries = dbEngine.getTable('deliveries');
  const AccessLogs = dbEngine.getTable('access_logs');
  const Spaces = dbEngine.getTable('spaces');
  const Reservations = dbEngine.getTable('reservations');
  const Occurrences = dbEngine.getTable('occurrences');
  const Polls = dbEngine.getTable('polls');
  const PollVotes = dbEngine.getTable('poll_votes');
  const Financial = dbEngine.getTable('financial_transactions');
  const Announcements = dbEngine.getTable('announcements');
  const Products = dbEngine.getTable('market_products');
  const Sales = dbEngine.getTable('market_sales');
  const SaleItems = dbEngine.getTable('market_sale_items');
  const AuditLogs = dbEngine.getTable('audit_logs');

  // Evita duplicar se já existirem condomínios
  if (Condominiums.count() > 0) {
    console.log('[Seed] Banco de dados já possui registros. Pulando seed inicial.');
    return;
  }

  console.log('[Seed] Populando dados relacionais corporativos...');

  dbEngine.transaction(() => {
    // 1. Condomínios (Multi-tenant)
    const condo1 = Condominiums.insert({
      name: 'Condomínio Solar das Palmeiras',
      cnpj: '12345678000190',
      address: 'Rua das Palmeiras, 500 - Batel',
      city: 'Curitiba',
      state: 'PR',
      postal_code: '80420-000',
      phone: '(41) 3222-1000',
      status: 'ACTIVE'
    });

    const condo2 = Condominiums.insert({
      name: 'Residencial Jardins do Bosque',
      cnpj: '98765432000110',
      address: 'Av. Cândido Hartmann, 1200 - Champagnat',
      city: 'Curitiba',
      state: 'PR',
      postal_code: '80710-570',
      phone: '(41) 3333-2000',
      status: 'ACTIVE'
    });

    // 2. Módulos Ativos por Condomínio
    const allModuleKeys = ['dashboard', 'deliveries', 'access', 'residents', 'reservations', 'financial', 'market', 'announcements'];
    for (const key of allModuleKeys) {
      Modules.insert({ condominium_id: condo1.id, module_key: key, is_enabled: 1 });
      Modules.insert({ condominium_id: condo2.id, module_key: key, is_enabled: key === 'financial' ? 0 : 1 });
    }

    // 3. Blocos / Torres
    const blockA = Blocks.insert({
      condominium_id: condo1.id,
      name: 'Torre A - Acácia',
      description: 'Torre residencial com 8 pavimentos e 32 apartamentos',
      status: 'ACTIVE'
    });

    const blockB = Blocks.insert({
      condominium_id: condo1.id,
      name: 'Torre B - Bromélia',
      description: 'Torre residencial com 8 pavimentos e 32 apartamentos',
      status: 'ACTIVE'
    });

    const block1 = Blocks.insert({
      condominium_id: condo2.id,
      name: 'Bloco 1 - Jacarandá',
      description: 'Bloco de baixa densidade com 4 pavimentos',
      status: 'ACTIVE'
    });

    // 4. Unidades / Apartamentos
    const unit101 = Units.insert({ block_id: blockA.id, number: '101', floor: 1, type: 'Residencial' });
    const unit102 = Units.insert({ block_id: blockA.id, number: '102', floor: 1, type: 'Residencial' });
    const unit201 = Units.insert({ block_id: blockA.id, number: '201', floor: 2, type: 'Residencial' });
    const unit202 = Units.insert({ block_id: blockA.id, number: '202', floor: 2, type: 'Residencial' });
    const unitPH = Units.insert({ block_id: blockA.id, number: '801-PH', floor: 8, type: 'Cobertura' });

    const unitB101 = Units.insert({ block_id: blockB.id, number: '101', floor: 1, type: 'Residencial' });
    const unitB201 = Units.insert({ block_id: blockB.id, number: '201', floor: 2, type: 'Residencial' });

    const unitJ11 = Units.insert({ block_id: block1.id, number: '11', floor: 1, type: 'Residencial' });

    // 5. Moradores
    const resident1 = Residents.insert({
      unit_id: unit101.id,
      name: 'Carlos Eduardo Mendes',
      email: 'carlos.mendes@email.com',
      phone: '(41) 98888-1111',
      cpf: '12345678901',
      role: 'Proprietário',
      emergency_contact: 'Mariana Mendes (Esposa) - (41) 98888-1112'
    });

    const resident2 = Residents.insert({
      unit_id: unit101.id,
      name: 'Mariana Mendes',
      email: 'mariana.mendes@email.com',
      phone: '(41) 98888-1112',
      cpf: '12345678902',
      role: 'Dependente'
    });

    const resident3 = Residents.insert({
      unit_id: unit102.id,
      name: 'Roberto Souza',
      email: 'roberto.souza@email.com',
      phone: '(41) 97777-2222',
      cpf: '23456789012',
      role: 'Inquilino'
    });

    const resident4 = Residents.insert({
      unit_id: unit201.id,
      name: 'Ana Paula Ferreira',
      email: 'ana.ferreira@email.com',
      phone: '(41) 96666-3333',
      cpf: '34567890123',
      role: 'Proprietário'
    });

    // 6. Usuários do Sistema (RBAC)
    Users.insert({
      condominium_id: condo1.id,
      name: 'Administrador PratiCom',
      email: 'admin@praticom.com.br',
      password_hash: 'pbkdf2$hash$supersecret',
      role: 'ADMIN',
      status: 'ACTIVE'
    });

    Users.insert({
      condominium_id: condo1.id,
      name: 'Dr. Síndico Geral',
      email: 'sindico.solar@praticom.com.br',
      password_hash: 'pbkdf2$hash$supersecret',
      role: 'SINDICO',
      status: 'ACTIVE'
    });

    Users.insert({
      condominium_id: condo1.id,
      name: 'Portaria Central 24h',
      email: 'portaria.solar@praticom.com.br',
      password_hash: 'pbkdf2$hash$supersecret',
      role: 'TRABALHADOR',
      status: 'ACTIVE'
    });

    Users.insert({
      condominium_id: condo1.id,
      resident_id: resident1.id,
      name: 'Carlos Eduardo Mendes',
      email: 'carlos.mendes@email.com',
      password_hash: 'pbkdf2$hash$supersecret',
      role: 'MORADOR',
      status: 'ACTIVE'
    });

    // 7. Veículos
    Vehicles.insert({
      unit_id: unit101.id,
      resident_id: resident1.id,
      plate: 'BRA2E19',
      model: 'Jeep Compass',
      color: 'Cinza Granite',
      type: 'SUV',
      parking_spot: 'G1-12'
    });

    Vehicles.insert({
      unit_id: unit102.id,
      resident_id: resident3.id,
      plate: 'ABC1234',
      model: 'Honda Civic',
      color: 'Preto Cristal',
      type: 'Carro',
      parking_spot: 'G1-14'
    });

    Vehicles.insert({
      unit_id: unit201.id,
      resident_id: resident4.id,
      plate: 'RIO2A18',
      model: 'Toyota Corolla Cross',
      color: 'Branco Pérola',
      type: 'SUV',
      parking_spot: 'G2-05'
    });

    // 8. Encomendas (com PIN)
    Deliveries.insert({
      unit_id: unit101.id,
      resident_id: resident1.id,
      courier: 'Mercado Livre',
      tracking_code: 'BR123456789ML',
      description: 'Caixa Média - Eletrônicos',
      status: 'PENDING',
      pickup_code: '7429',
      received_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      notes: 'Embalagem intacta'
    });

    Deliveries.insert({
      unit_id: unit102.id,
      resident_id: resident3.id,
      courier: 'Amazon Logística',
      tracking_code: 'AMZ987654321BR',
      description: 'Envelope almofadado - Livros',
      status: 'PENDING',
      pickup_code: '1853',
      received_at: new Date(Date.now() - 3600000 * 4).toISOString()
    });

    Deliveries.insert({
      unit_id: unit201.id,
      resident_id: resident4.id,
      courier: 'Correios - Sedex',
      tracking_code: 'SS123456789BR',
      description: 'Caixa Pequena',
      status: 'PICKED_UP',
      pickup_code: '9041',
      received_at: new Date(Date.now() - 86400000).toISOString(),
      picked_up_at: new Date(Date.now() - 3600000).toISOString(),
      picked_up_by: 'Ana Paula Ferreira'
    });

    // 9. Controle de Acesso
    AccessLogs.insert({
      destination_unit_id: unit101.id,
      visitor_name: 'Lucas Nogueira',
      document: 'RG 12.345.678-9',
      type: 'Visitante',
      status: 'IN_PROPERTY',
      entered_at: new Date(Date.now() - 3600000).toISOString()
    });

    AccessLogs.insert({
      destination_unit_id: unit201.id,
      visitor_name: 'Marcos Silva',
      document: 'CPF 999.888.777-66',
      type: 'Prestador de Serviço',
      company: 'Claro Fibra Telecom',
      status: 'IN_PROPERTY',
      entered_at: new Date(Date.now() - 1800000).toISOString()
    });

    AccessLogs.insert({
      destination_unit_id: unit102.id,
      visitor_name: 'Entregador iFood',
      document: 'RG 45.678.901-2',
      type: 'Delivery',
      status: 'EXITED',
      entered_at: new Date(Date.now() - 7200000).toISOString(),
      exited_at: new Date(Date.now() - 6600000).toISOString()
    });

    // 10. Espaços Comuns
    const spaceGourmet = Spaces.insert({
      condominium_id: condo1.id,
      name: 'Espaço Gourmet & Churrasqueira',
      capacity: 25,
      description: 'Churrasqueira a carvão, chopeira, cooktop e smart TV'
    });

    const spaceFestas = Spaces.insert({
      condominium_id: condo1.id,
      name: 'Salão de Festas Nobre',
      capacity: 60,
      description: 'Mobiliário completo, ar condicionado central, cozinha industrial'
    });

    Spaces.insert({
      condominium_id: condo1.id,
      name: 'Quadra Poliesportiva',
      capacity: 20,
      description: 'Iluminação LED para uso noturno'
    });

    // 11. Reservas de Áreas Comuns
    const today = new Date().toISOString().split('T')[0];
    const nextWeekend = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

    Reservations.insert({
      space_id: spaceGourmet.id,
      resident_id: resident1.id,
      unit_id: unit101.id,
      reservation_date: nextWeekend,
      start_time: '12:00',
      end_time: '18:00',
      status: 'CONFIRMED',
      notes: 'Almoço de aniversário de família'
    });

    Reservations.insert({
      space_id: spaceFestas.id,
      resident_id: resident4.id,
      unit_id: unit201.id,
      reservation_date: today,
      start_time: '19:00',
      end_time: '23:00',
      status: 'CONFIRMED',
      notes: 'Reunião de condôminos'
    });

    // 12. Financeiro & Taxas
    Financial.insert({
      condominium_id: condo1.id,
      unit_id: unit101.id,
      type: 'income',
      category: 'Cota Condominial',
      description: 'Taxa Ordinária + Fundo de Reserva - Mês Atual',
      amount: 680.50,
      due_date: `${today.substring(0, 7)}-10`,
      status: 'PAID',
      payment_date: `${today.substring(0, 7)}-08`
    });

    Financial.insert({
      condominium_id: condo1.id,
      unit_id: unit102.id,
      type: 'income',
      category: 'Cota Condominial',
      description: 'Taxa Ordinária + Fundo de Reserva - Mês Atual',
      amount: 680.50,
      due_date: `${today.substring(0, 7)}-10`,
      status: 'PENDING'
    });

    Financial.insert({
      condominium_id: condo1.id,
      type: 'expense',
      category: 'Manutenção',
      description: 'Manutenção preventiva mensal de elevadores Otis',
      amount: 1450.00,
      due_date: `${today.substring(0, 7)}-15`,
      status: 'PAID',
      payment_date: `${today.substring(0, 7)}-14`
    });

    Financial.insert({
      condominium_id: condo1.id,
      type: 'expense',
      category: 'Serviços Públicos',
      description: 'Conta de Energia Elétrica das Áreas Comuns - Copel',
      amount: 2180.40,
      due_date: `${today.substring(0, 7)}-20`,
      status: 'PENDING'
    });

    // 13. Mural de Avisos
    Announcements.insert({
      condominium_id: condo1.id,
      title: 'Manutenção Preventiva dos Elevadores - Torre A',
      content: 'Informamos que na próxima terça-feira das 09h às 12h os elevadores da Torre A passarão por inspeção técnica anual de segurança com testes de freio e cabos.',
      category: 'Manutenção',
      priority: 'alta',
      is_pinned: 1
    });

    Announcements.insert({
      condominium_id: condo1.id,
      title: 'Convocação para Assembleia Geral Extraordinária',
      content: 'Convidamos todos os proprietários para assembleia híbrida (presencial no Salão Nobre e via link) para deliberação da reforma da fachada e modernização da guarita.',
      category: 'Assembleia',
      priority: 'urgente',
      is_pinned: 1
    });

    Announcements.insert({
      condominium_id: condo1.id,
      title: 'Higienização Semestral dos Reservatórios de Água',
      content: 'A limpeza das caixas dágua ocorrerá nesta quinta-feira. Solicitamos o consumo consciente.',
      category: 'Geral',
      priority: 'normal',
      is_pinned: 0
    });

    // 14. Mercadinho Autônomo (Honest Market)
    const prodCoke = Products.insert({
      condominium_id: condo1.id,
      name: 'Coca-Cola Lata 350ml',
      category: 'Bebidas',
      price: 5.50,
      stock_quantity: 48,
      min_stock: 12,
      barcode: '7894900010015'
    });

    const prodChips = Products.insert({
      condominium_id: condo1.id,
      name: 'Batata Pringles Original 114g',
      category: 'Snacks',
      price: 14.90,
      stock_quantity: 18,
      min_stock: 6,
      barcode: '0038000138577'
    });

    const prodWater = Products.insert({
      condominium_id: condo1.id,
      name: 'Água Mineral Minalba 510ml',
      category: 'Bebidas',
      price: 3.00,
      stock_quantity: 60,
      min_stock: 20,
      barcode: '7896005800018'
    });

    const prodChoc = Products.insert({
      condominium_id: condo1.id,
      name: 'Chocolate Milka Alpino 100g',
      category: 'Doces',
      price: 16.50,
      stock_quantity: 8,
      min_stock: 5,
      barcode: '7622210987654'
    });

    // 15. Vendas no PDV
    const sale1 = Sales.insert({
      condominium_id: condo1.id,
      unit_id: unit101.id,
      resident_id: resident1.id,
      total_amount: 20.40,
      payment_method: 'PIX'
    });

    SaleItems.insert({
      sale_id: sale1.id,
      product_id: prodCoke.id,
      quantity: 1,
      unit_price: 5.50,
      subtotal: 5.50
    });

    SaleItems.insert({
      sale_id: sale1.id,
      product_id: prodChips.id,
      quantity: 1,
      unit_price: 14.90,
      subtotal: 14.90
    });

    // 16. Pets (Animais de Estimação)
    Pets.insert({
      condominium_id: condo1.id,
      unit_id: unit101.id,
      name: 'Thor',
      species: 'Cão',
      breed: 'Golden Retriever',
      size: 'Grande',
      vaccine_status: 'VACCINATED',
      vaccine_date: '2026-05-10',
      notes: 'Dócil e sociável. Porte grande.'
    });

    Pets.insert({
      condominium_id: condo1.id,
      unit_id: unit102.id,
      name: 'Luna',
      species: 'Gato',
      breed: 'Siamês',
      size: 'Pequeno',
      vaccine_status: 'VACCINATED',
      vaccine_date: '2026-08-15',
      notes: 'Não tem acesso à área externa.'
    });

    Pets.insert({
      condominium_id: condo1.id,
      unit_id: unit201.id,
      name: 'Pipoca',
      species: 'Cão',
      breed: 'Spitz Alemão',
      size: 'Pequeno',
      vaccine_status: 'PENDING',
      vaccine_date: '2025-09-01',
      notes: 'Vacina antirrábica anual vencendo.'
    });

    // 17. Ocorrências e Chamados de Manutenção
    Occurrences.insert({
      condominium_id: condo1.id,
      unit_id: unit101.id,
      title: 'Infiltração na junta de dilatação da garagem G1',
      category: 'Estrutural',
      priority: 'alta',
      status: 'OPEN',
      description: 'Gotejamento constante sobre a vaga G1-12 em dias de chuva torrencial.',
      resolution_notes: null
    });

    Occurrences.insert({
      condominium_id: condo1.id,
      unit_id: unit102.id,
      title: 'Barulho excessivo após as 22h na torre A',
      category: 'Convivência/Barulho',
      priority: 'media',
      status: 'RESOLVED',
      description: 'Música alta relatada no sábado após o horário de silêncio.',
      resolution_notes: 'Portaria acionou a unidade e a música foi encerrada às 22h25.',
      resolved_at: new Date(Date.now() - 86400000 * 2).toISOString()
    });

    Occurrences.insert({
      condominium_id: condo1.id,
      unit_id: unit201.id,
      title: 'Lâmpada tubular de LED queimada no hall do 2º andar',
      category: 'Elétrica',
      priority: 'baixa',
      status: 'IN_PROGRESS',
      description: 'Luminária próxima ao elevador social piscando.',
      resolution_notes: 'Equipe de zeladoria agendada para troca.'
    });

    // 18. Assembleias e Votações Virtuais
    const poll1 = Polls.insert({
      condominium_id: condo1.id,
      title: 'Aprovação da Reforma e Pintura da Fachada (Torres A e B)',
      description: 'Deliberação sobre a contratação da empresa Alpha Pinturas para revitalização completa das pastilhas e hidrojateamento.',
      category: 'Obras',
      quorum_type: 'TWO_THIRDS',
      status: 'OPEN',
      options: JSON.stringify(['Aprovar Orçamento A (R$ 145k)', 'Aprovar Orçamento B (R$ 128k)', 'Rejeitar Ambas']),
      start_date: '2026-10-01',
      end_date: '2026-10-31'
    });

    const poll2 = Polls.insert({
      condominium_id: condo1.id,
      title: 'Modernização do CFTV e Portaria Autônoma com Reconhecimento Facial',
      description: 'Instalação de câmeras 4K e catracas biométricas para pedestres.',
      category: 'Extraordinária',
      quorum_type: 'SIMPLE_MAJORITY',
      status: 'OPEN',
      options: JSON.stringify(['Favorável', 'Desfavorável', 'Abstenção']),
      start_date: '2026-10-10',
      end_date: '2026-11-05'
    });

    // 19. Votos Registrados
    PollVotes.insert({
      poll_id: poll1.id,
      unit_id: unit101.id,
      resident_id: resident1.id,
      selected_option: 'Aprovar Orçamento A (R$ 145k)',
      ip_address: '192.168.1.101',
      signature_hash: 'sha256$vote$unit101$alpha'
    });

    PollVotes.insert({
      poll_id: poll1.id,
      unit_id: unit102.id,
      resident_id: resident3.id,
      selected_option: 'Aprovar Orçamento B (R$ 128k)',
      ip_address: '192.168.1.102',
      signature_hash: 'sha256$vote$unit102$beta'
    });

    PollVotes.insert({
      poll_id: poll2.id,
      unit_id: unit101.id,
      resident_id: resident1.id,
      selected_option: 'Favorável',
      ip_address: '192.168.1.101',
      signature_hash: 'sha256$vote$unit101$fav'
    });

    // 20. Configurações Operacionais de Governança
    CondoSettings.insert({
      condominium_id: condo1.id,
      setting_key: 'quiet_hours_start',
      setting_value: '22:00',
      setting_type: 'string',
      description: 'Início do horário de silêncio rigoroso'
    });

    CondoSettings.insert({
      condominium_id: condo1.id,
      setting_key: 'quiet_hours_end',
      setting_value: '08:00',
      setting_type: 'string',
      description: 'Término do horário de silêncio'
    });

    CondoSettings.insert({
      condominium_id: condo1.id,
      setting_key: 'delivery_pin_required',
      setting_value: 'true',
      setting_type: 'boolean',
      description: 'Exigência de código PIN de 4 dígitos na retirada de encomendas'
    });

    CondoSettings.insert({
      condominium_id: condo1.id,
      setting_key: 'space_reservation_max_days_ahead',
      setting_value: '60',
      setting_type: 'number',
      description: 'Antecedência máxima (dias) para agendamento de áreas comuns'
    });

    // 21. Logs de Auditoria
    AuditLogs.insert({
      condominium_id: condo1.id,
      user_id: 1,
      user_role: 'ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      target_table: 'condominiums',
      target_id: condo1.id,
      new_values: JSON.stringify({ name: condo1.name, status: 'ACTIVE' }),
      ip_address: '127.0.0.1'
    });
  });

  console.log('[Seed] Banco de dados populado com sucesso em transação ACID!');
}
