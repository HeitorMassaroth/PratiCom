// ====================================================
// PratiCom ERP - Standalone Client Data Engine
// Executa 100% no navegador (On-Click Instantâneo com Integridade Relacional)
// ====================================================

export function getActiveCondoId() {
  return localStorage.getItem('praticom_active_condo') || '1';
}

export function setActiveCondoId(id) {
  localStorage.setItem('praticom_active_condo', String(id));
  window.dispatchEvent(new Event('condo-changed'));
}

export function getActiveProfile() {
  return localStorage.getItem('praticom_active_profile') || 'admin';
}

export function setActiveProfile(profile) {
  localStorage.setItem('praticom_active_profile', profile);
  window.dispatchEvent(new Event('profile-changed'));
}

// ----------------------------------------------------
// Base de Dados Inicial Realista em Memória / LocalStorage
// ----------------------------------------------------
const INITIAL_DATA = {
  condominiums: [
    { 
      id: 1, 
      name: 'Condomínio Solar das Palmeiras', 
      cnpj: '12.345.678/0001-90', 
      address: 'Rua das Palmeiras, 500 - Batel', 
      city: 'Curitiba', 
      state: 'PR', 
      postal_code: '80420-000', 
      phone: '(41) 3222-1000', 
      status: 'ACTIVE' 
    },
    { 
      id: 2, 
      name: 'Residencial Jardins do Bosque', 
      cnpj: '98.765.432/0001-10', 
      address: 'Av. Cândido Hartmann, 1200 - Champagnat', 
      city: 'Curitiba', 
      state: 'PR', 
      postal_code: '80710-570', 
      phone: '(41) 3333-2000', 
      status: 'ACTIVE' 
    }
  ],
  condominium_modules: {
    1: { dashboard: true, deliveries: true, access: true, residents: true, reservations: true, financial: true, market: true, announcements: true },
    2: { dashboard: true, deliveries: true, access: true, residents: true, reservations: true, financial: false, market: true, announcements: true }
  },
  blocks: [
    { id: 1, condominium_id: 1, name: 'Torre A - Acácia', description: 'Torre residencial com 8 pavimentos' },
    { id: 2, condominium_id: 1, name: 'Torre B - Bromélia', description: 'Torre residencial com 8 pavimentos' },
    { id: 3, condominium_id: 2, name: 'Bloco 1 - Jacarandá', description: 'Bloco residencial com 4 pavimentos' }
  ],
  units: [
    { id: 1, block_id: 1, block_name: 'Torre A - Acácia', number: '101', floor: 1, type: 'Residencial', condominium_id: 1 },
    { id: 2, block_id: 1, block_name: 'Torre A - Acácia', number: '102', floor: 1, type: 'Residencial', condominium_id: 1 },
    { id: 3, block_id: 1, block_name: 'Torre A - Acácia', number: '201', floor: 2, type: 'Residencial', condominium_id: 1 },
    { id: 4, block_id: 1, block_name: 'Torre A - Acácia', number: '202', floor: 2, type: 'Residencial', condominium_id: 1 },
    { id: 5, block_id: 2, block_name: 'Torre B - Bromélia', number: '101', floor: 1, type: 'Residencial', condominium_id: 1 },
    { id: 6, block_id: 2, block_name: 'Torre B - Bromélia', number: '102', floor: 1, type: 'Residencial', condominium_id: 1 },
    { id: 7, block_id: 3, block_name: 'Bloco 1 - Jacarandá', number: '11', floor: 1, type: 'Residencial', condominium_id: 2 }
  ],
  residents: [
    { id: 1, condominium_id: 1, unit_id: 1, unit_number: '101', block_name: 'Torre A - Acácia', name: 'Mariana Silva Santos', email: 'mariana.silva@email.com', phone: '(41) 99111-2233', cpf: '123.456.789-00', role: 'Proprietário', emergency_contact: 'Irmã: (41) 98877-6655' },
    { id: 2, condominium_id: 1, unit_id: 1, unit_number: '101', block_name: 'Torre A - Acácia', name: 'Carlos Eduardo Santos', email: 'carlos.santos@email.com', phone: '(41) 99222-3344', cpf: '234.567.890-11', role: 'Proprietário', emergency_contact: 'Esposa: (41) 99111-2233' },
    { id: 3, condominium_id: 1, unit_id: 2, unit_number: '102', block_name: 'Torre A - Acácia', name: 'Ana Beatriz Oliveira', email: 'ana.oliveira@email.com', phone: '(41) 99333-4455', cpf: '345.678.901-22', role: 'Inquilino', emergency_contact: 'Mãe: (41) 97766-5544' },
    { id: 4, condominium_id: 1, unit_id: 3, unit_number: '201', block_name: 'Torre A - Acácia', name: 'Fernando Costa Lima', email: 'fernando.costa@email.com', phone: '(41) 99444-5566', cpf: '456.789.012-33', role: 'Proprietário', emergency_contact: 'Esposa: (41) 98811-2233' }
  ],
  vehicles: [
    { id: 1, condominium_id: 1, unit_id: 1, unit_number: '101', resident_id: 1, resident_name: 'Mariana Silva Santos', block_name: 'Torre A - Acácia', plate: 'ABC1D23', model: 'Jeep Compass', color: 'Prata', type: 'SUV', parking_spot: 'Vaga G1-01' },
    { id: 2, condominium_id: 1, unit_id: 1, unit_number: '101', resident_id: 2, resident_name: 'Carlos Eduardo Santos', block_name: 'Torre A - Acácia', plate: 'BRA2E45', model: 'Honda Civic', color: 'Preto', type: 'Carro', parking_spot: 'Vaga G1-02' },
    { id: 3, condominium_id: 1, unit_id: 2, unit_number: '102', resident_id: 3, resident_name: 'Ana Beatriz Oliveira', block_name: 'Torre A - Acácia', plate: 'PRK9F88', model: 'Hyundai HB20', color: 'Branco', type: 'Carro', parking_spot: 'Vaga G1-03' }
  ],
  pets: [
    { id: 1, condominium_id: 1, unit_id: 1, unit_number: '101', resident_name: 'Mariana Silva Santos', name: 'Thor', species: 'Cão', breed: 'Golden Retriever', size: 'Grande', vaccine_status: 'VACCINATED', vaccine_date: '2026-08-15', notes: 'Dócil, porte grande, vacina antirrábica em dia' },
    { id: 2, condominium_id: 1, unit_id: 2, unit_number: '102', resident_name: 'Ana Beatriz Oliveira', name: 'Mia', species: 'Gato', breed: 'Siamês', size: 'Pequeno', vaccine_status: 'VACCINATED', vaccine_date: '2026-06-20', notes: 'Animal caseiro, sem acesso ao corredor comum' },
    { id: 3, condominium_id: 1, unit_id: 3, unit_number: '201', resident_name: 'Fernando Costa Lima', name: 'Pipoca', species: 'Cão', breed: 'Spitz Alemão', size: 'Pequeno', vaccine_status: 'PENDING', vaccine_date: '2025-09-10', notes: 'Necessita reforço antirrábico anual' }
  ],
  deliveries: [
    { id: 101, condominium_id: 1, unit_id: 1, unit_number: '101', block_name: 'Torre A - Acácia', resident_name: 'Mariana Silva Santos', courier: 'Mercado Livre', tracking_code: 'MLB98412491', description: 'Caixa de papelão média', status: 'PENDING', pickup_code: '4821', received_at: '2026-10-16 09:30:00', picked_up_at: null, picked_up_by: null },
    { id: 102, condominium_id: 1, unit_id: 2, unit_number: '102', block_name: 'Torre A - Acácia', resident_name: 'Ana Beatriz Oliveira', courier: 'Amazon Prime', tracking_code: 'AMZ77182902', description: 'Envelope plástico bolha', status: 'PENDING', pickup_code: '1904', received_at: '2026-10-16 10:15:00', picked_up_at: null, picked_up_by: null },
    { id: 103, condominium_id: 1, unit_id: 3, unit_number: '201', block_name: 'Torre A - Acácia', resident_name: 'Fernando Costa Lima', courier: 'Correios SEDEX', tracking_code: 'QD192837465BR', description: 'Pacote pequeno', status: 'PICKED_UP', pickup_code: '3350', received_at: '2026-10-15 14:00:00', picked_up_at: '2026-10-15 18:45:00', picked_up_by: 'Fernando Costa Lima' }
  ],
  access_logs: [
    { id: 1, condominium_id: 1, destination_unit_id: 1, destination_unit: '101', destination_block: 'Torre A - Acácia', visitor_name: 'Lucas Ferreira Mendes', document: '48.912.441-2', type: 'Visitante', status: 'IN_PROPERTY', company: null, vehicle_plate: 'KLU8890', entered_at: '2026-10-16 10:30:00', exited_at: null },
    { id: 2, condominium_id: 1, destination_unit_id: 2, destination_unit: '102', destination_block: 'Torre A - Acácia', visitor_name: 'Roberto Alencar', document: '31.442.110-8', type: 'Prestador de Serviço', status: 'IN_PROPERTY', company: 'Claro Fibra', vehicle_plate: null, entered_at: '2026-10-16 11:00:00', exited_at: null },
    { id: 3, condominium_id: 1, destination_unit_id: 3, destination_unit: '201', destination_block: 'Torre A - Acácia', visitor_name: 'Juliana Pires', document: '50.123.987-1', type: 'Visitante', status: 'EXITED', company: null, vehicle_plate: null, entered_at: '2026-10-15 15:20:00', exited_at: '2026-10-15 18:10:00' }
  ],
  spaces: [
    { id: 1, condominium_id: 1, name: 'Salão Nobre de Festas', capacity: 60, description: 'Ambiente climatizado, cozinha industrial completa, mesas, cadeiras e churrasqueira integrada.' },
    { id: 2, condominium_id: 1, name: 'Espaço Gourmet & Churrasqueira', capacity: 25, description: 'Área com bancada gourmet, chopeira, fogão por indução e smart TV.' },
    { id: 3, condominium_id: 1, name: 'Quadra Poliesportiva', capacity: 20, description: 'Iluminação de LED, demarcação para futsal, basquete e vôlei.' }
  ],
  reservations: [
    { id: 1, condominium_id: 1, space_id: 1, space_name: 'Salão Nobre de Festas', resident_id: 1, resident_name: 'Mariana Silva Santos', unit_number: '101', reservation_date: new Date().toISOString().split('T')[0], start_time: '18:00', end_time: '23:00', status: 'CONFIRMED', notes: 'Aniversário infantil' },
    { id: 2, condominium_id: 1, space_id: 2, space_name: 'Espaço Gourmet & Churrasqueira', resident_id: 3, resident_name: 'Ana Beatriz Oliveira', unit_number: '102', reservation_date: '2026-10-20', start_time: '12:00', end_time: '17:00', status: 'CONFIRMED', notes: 'Almoço em família' }
  ],
  financial: [
    { id: 1, condominium_id: 1, unit_id: 1, type: 'income', category: 'Taxa Condominial', description: 'Cota Ordinária Outubro/2026 - Unidade 101', amount: 480.00, due_date: '2026-10-10', status: 'PAID', payment_date: '2026-10-09' },
    { id: 2, condominium_id: 1, unit_id: 2, type: 'income', category: 'Taxa Condominial', description: 'Cota Ordinária Outubro/2026 - Unidade 102', amount: 480.00, due_date: '2026-10-10', status: 'PENDING', payment_date: null },
    { id: 3, condominium_id: 1, unit_id: null, type: 'expense', category: 'Manutenção', description: 'Manutenção preventiva dos elevadores sociais', amount: 1250.00, due_date: '2026-10-15', status: 'PAID', payment_date: '2026-10-14' },
    { id: 4, condominium_id: 1, unit_id: null, type: 'expense', category: 'Segurança & Portaria', description: 'Serviço terceirizado de monitoramento e portaria remota', amount: 4500.00, due_date: '2026-10-25', status: 'PENDING', payment_date: null }
  ],
  market_products: [
    { id: 1, condominium_id: 1, name: 'Refrigerante Coca-Cola 350ml', category: 'Bebidas', price: 6.50, stock_quantity: 24, min_stock: 6 },
    { id: 2, condominium_id: 1, name: 'Água Mineral sem Gás 500ml', category: 'Bebidas', price: 3.50, stock_quantity: 30, min_stock: 10 },
    { id: 3, condominium_id: 1, name: 'Batata Pringles Original 114g', category: 'Snacks', price: 14.90, stock_quantity: 8, min_stock: 4 },
    { id: 4, condominium_id: 1, name: 'Chocolate Milka ao Leite 100g', category: 'Doces', price: 16.00, stock_quantity: 12, min_stock: 4 },
    { id: 5, condominium_id: 1, name: 'Cerveja Heineken Long Neck 330ml', category: 'Bebidas', price: 9.90, stock_quantity: 4, min_stock: 6 }
  ],
  announcements: [
    { id: 1, condominium_id: 1, title: 'Assembleia Geral Ordinária de Moradores', content: 'Convocação para AGO com prestação de contas no Salão de Festas neste sábado às 19h.', category: 'Assembleia', priority: 'alta', is_pinned: 1, created_at: '2026-10-16 08:00:00' },
    { id: 2, condominium_id: 1, title: 'Manutenção Preventiva das Bombas de Água', content: 'Haverá breve interrupção no fornecimento das 14h às 16h nesta quinta-feira.', category: 'Manutenção', priority: 'urgente', is_pinned: 1, created_at: '2026-10-15 16:30:00' },
    { id: 3, condominium_id: 1, title: 'Novas Regras de Uso da Quadra Poliesportiva', content: 'Uso liberado das 08h às 22h com respeito ao horário de silêncio.', category: 'Geral', priority: 'normal', is_pinned: 0, created_at: '2026-10-14 11:00:00' }
  ],
  users: [
    { id: 1, condominium_id: 1, name: 'Administrador PratiCom', email: 'admin@praticom.com.br', role: 'ADMIN', status: 'ACTIVE', phone: '(41) 98800-0001', last_login_at: '2026-10-16 11:42:10', created_at: '2026-01-01' },
    { id: 2, condominium_id: 1, name: 'Dr. Marcos Valente (Síndico)', email: 'sindico.solar@praticom.com.br', role: 'SINDICO', status: 'ACTIVE', phone: '(41) 98800-0002', last_login_at: '2026-10-16 09:15:30', created_at: '2026-01-10' },
    { id: 3, condominium_id: 1, name: 'Equipe Portaria 24h', email: 'portaria.solar@praticom.com.br', role: 'TRABALHADOR', status: 'ACTIVE', phone: '(41) 3222-1001', last_login_at: '2026-10-16 12:05:00', created_at: '2026-01-15' },
    { id: 4, condominium_id: 1, unit_id: 1, unit_number: '101', resident_id: 1, name: 'Mariana Silva Santos', email: 'mariana.silva@email.com', role: 'MORADOR', status: 'ACTIVE', phone: '(41) 99111-2233', last_login_at: '2026-10-15 19:30:12', created_at: '2026-02-01' },
    { id: 5, condominium_id: 1, unit_id: 1, unit_number: '101', resident_id: 2, name: 'Carlos Eduardo Santos', email: 'carlos.santos@email.com', role: 'MORADOR', status: 'ACTIVE', phone: '(41) 99222-3344', last_login_at: '2026-10-14 08:20:45', created_at: '2026-02-01' },
    { id: 6, condominium_id: 1, name: 'Zelador José da Silva', email: 'zelador.solar@praticom.com.br', role: 'TRABALHADOR', status: 'ACTIVE', phone: '(41) 98777-4433', last_login_at: '2026-10-16 07:45:00', created_at: '2026-02-15' },
    { id: 7, condominium_id: 1, name: 'Roberto Alencar (Ex-Prestador)', email: 'roberto.ex@praticom.com.br', role: 'TRABALHADOR', status: 'SUSPENDED', phone: '(41) 98111-0099', last_login_at: '2026-09-01 10:00:00', created_at: '2026-03-01' }
  ],
  audit_logs: [
    { id: 1, condominium_id: 1, user_name: 'Administrador PratiCom', user_role: 'ADMIN', action: 'INSERT', target_table: 'condominiums', details: 'Criação do condomínio Solar das Palmeiras', ip_address: '127.0.0.1', created_at: '2026-10-16 08:00:00' },
    { id: 2, condominium_id: 1, user_name: 'Equipe Portaria 24h', user_role: 'TRABALHADOR', action: 'INSERT', target_table: 'deliveries', details: 'Recebimento de encomenda Mercado Livre para Apto 101 (PIN gerado)', ip_address: '192.168.1.100', created_at: '2026-10-16 09:30:00' },
    { id: 3, condominium_id: 1, user_name: 'Dr. Marcos Valente', user_role: 'SINDICO', action: 'UPDATE', target_table: 'announcements', details: 'Publicação de comunicado urgente de manutenção de elevadores', ip_address: '192.168.1.15', created_at: '2026-10-16 10:15:00' },
    { id: 4, condominium_id: 1, user_name: 'Equipe Portaria 24h', user_role: 'TRABALHADOR', action: 'INSERT', target_table: 'access_logs', details: 'Entrada autorizada do visitante Lucas Ferreira para Apto 101', ip_address: '192.168.1.100', created_at: '2026-10-16 10:30:00' },
    { id: 5, condominium_id: 1, user_name: 'Equipe Portaria 24h', user_role: 'TRABALHADOR', action: 'UPDATE', target_table: 'deliveries', details: 'Baixa de pacote Sedex autenticado com PIN pelo morador Fernando Costa', ip_address: '192.168.1.100', created_at: '2026-10-16 11:10:00' }
  ],
  condo_settings: {
    1: {
      sindico_name: 'Dr. Marcos Valente',
      sindico_email: 'sindico.solar@praticom.com.br',
      sindico_phone: '(41) 98800-0002',
      mandate_start: '2025-01-01',
      mandate_end: '2026-12-31',
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      guest_limit_per_reservation: 30,
      require_pin_for_deliveries: true,
      visitor_tolerance_minutes: 15,
      auto_notify_whatsapp: true,
      auto_notify_email: true,
      rules_summary: 'Uso obrigatório de crachá para prestadores. Silêncio estrito após 22h. Mudanças apenas de segunda a sexta das 08h às 17h.'
    },
    2: {
      sindico_name: 'Patrícia Guimarães',
      sindico_email: 'patricia@bosque.com.br',
      sindico_phone: '(41) 98700-1122',
      mandate_start: '2025-06-01',
      mandate_end: '2027-05-31',
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
      guest_limit_per_reservation: 20,
      require_pin_for_deliveries: true,
      visitor_tolerance_minutes: 20,
      auto_notify_whatsapp: false,
      auto_notify_email: true,
      rules_summary: 'Condomínio fechado. Proibido som alto em áreas comuns.'
    }
  },
  occurrences: [
    {
      id: 1,
      condominium_id: 1,
      unit_id: 1,
      unit_number: '101',
      block_name: 'Torre A - Acácia',
      resident_name: 'Mariana Silva Santos',
      title: 'Infiltração no teto do banheiro da suíte',
      category: 'Hidráulica',
      priority: 'alta',
      status: 'IN_PROGRESS',
      description: 'Gotejamento contínuo surgindo pelo forro de gesso, aparentemente vindo da prumada do andar superior.',
      resolution_notes: 'Encaminhado encanador técnico para inspeção na unidade 201 nesta tarde.',
      created_at: '2026-10-15 14:20:00',
      resolved_at: null
    },
    {
      id: 2,
      condominium_id: 1,
      unit_id: 2,
      unit_number: '102',
      block_name: 'Torre A - Acácia',
      resident_name: 'Ana Beatriz Oliveira',
      title: 'Lâmpada do corredor do 1º andar queimada',
      category: 'Elétrica',
      priority: 'baixa',
      status: 'RESOLVED',
      description: 'Luminária próxima ao elevador de serviço está piscando e apagada.',
      resolution_notes: 'Substituição da lâmpada LED tubular realizada pela equipe de zeladoria.',
      created_at: '2026-10-14 09:00:00',
      resolved_at: '2026-10-14 11:30:00'
    },
    {
      id: 3,
      condominium_id: 1,
      unit_id: 3,
      unit_number: '201',
      block_name: 'Torre A - Acácia',
      resident_name: 'Fernando Costa Lima',
      title: 'Portão eletrônico da garagem G1 travando na abertura',
      category: 'Segurança',
      priority: 'urgente',
      status: 'OPEN',
      description: 'Motor do portão principal faz barulho metálico e desarmou o disjuntor de proteção.',
      resolution_notes: '',
      created_at: '2026-10-16 11:00:00',
      resolved_at: null
    }
  ],
  polls: [
    {
      id: 1,
      condominium_id: 1,
      title: 'Modernização da Portaria e Acesso por Reconhecimento Facial',
      category: 'Melhorias & Obras',
      description: 'Deliberação sobre a contratação de sistema biométrico facial para pedestres e cancelas, sem cota extra (utilização do fundo de reserva existente).',
      deadline: '2026-10-31',
      status: 'OPEN',
      votes_for: 18,
      votes_against: 3,
      votes_abstain: 2,
      voted_units: [1, 2, 3],
      created_at: '2026-10-10'
    },
    {
      id: 2,
      condominium_id: 1,
      title: 'Liberação de Pets de Médio Porte no Elevador Social em Manutenções',
      category: 'Convivência',
      description: 'Permitir o trânsito de animais domésticos de até 25kg no elevador social quando o elevador de serviço estiver em revisão técnica.',
      deadline: '2026-10-25',
      status: 'OPEN',
      votes_for: 14,
      votes_against: 9,
      votes_abstain: 1,
      voted_units: [1, 4],
      created_at: '2026-10-12'
    }
  ]
};

function getStore() {
  const saved = localStorage.getItem('praticom_standalone_db');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.condominium_modules) {
        parsed.condominium_modules = INITIAL_DATA.condominium_modules;
      }
      if (!parsed.users) {
        parsed.users = INITIAL_DATA.users;
      }
      if (!parsed.audit_logs) {
        parsed.audit_logs = INITIAL_DATA.audit_logs;
      }
      if (!parsed.condo_settings) {
        parsed.condo_settings = INITIAL_DATA.condo_settings;
      }
      if (!parsed.occurrences) {
        parsed.occurrences = INITIAL_DATA.occurrences;
      }
      if (!parsed.polls) {
        parsed.polls = INITIAL_DATA.polls;
      }
      if (!parsed.pets) {
        parsed.pets = INITIAL_DATA.pets;
      }
      return parsed;
    } catch {
      // fallback
    }
  }
  localStorage.setItem('praticom_standalone_db', JSON.stringify(INITIAL_DATA));
  return JSON.parse(JSON.stringify(INITIAL_DATA));
}

function saveStore(data) {
  localStorage.setItem('praticom_standalone_db', JSON.stringify(data));
}

// ----------------------------------------------------
// Mock Engine - Respostas Instantâneas On-Click com Integridade Relacional
// ----------------------------------------------------
export const api = {
  get: async (endpoint) => {
    const store = getStore();
    const condoId = Number(getActiveCondoId());

    // 1. Condomínios
    if (endpoint === '/condominiums') {
      return store.condominiums;
    }

    if (endpoint.startsWith('/condominiums/') && endpoint.endsWith('/blocks')) {
      const id = Number(endpoint.split('/')[2]);
      return store.blocks.filter((b) => b.condominium_id === id);
    }

    if (endpoint.startsWith('/condominiums/') && endpoint.endsWith('/modules')) {
      const id = Number(endpoint.split('/')[2]);
      return store.condominium_modules[id] || { dashboard: true, deliveries: true, access: true, residents: true, reservations: true, financial: true, market: true, announcements: true };
    }

    if (endpoint.startsWith('/condominiums/')) {
      const id = Number(endpoint.split('/')[2]);
      return store.condominiums.find((c) => c.id === id) || null;
    }

    // 2. Blocos
    if (endpoint.startsWith('/blocks')) {
      const url = new URL(`http://localhost${endpoint}`);
      const cId = url.searchParams.get('condominium_id') ? Number(url.searchParams.get('condominium_id')) : condoId;
      return store.blocks.filter((b) => b.condominium_id === cId);
    }

    // 3. Unidades
    if (endpoint.startsWith('/units')) {
      const url = new URL(`http://localhost${endpoint}`);
      const bId = url.searchParams.get('block_id');
      let uList = store.units.filter((u) => u.condominium_id === condoId);
      if (bId) {
        uList = uList.filter((u) => u.block_id === Number(bId));
      }
      return uList;
    }

    // 4. Dashboard Consolidado
    if (endpoint === '/dashboard') {
      const pendingDeliveries = store.deliveries.filter((d) => d.condominium_id === condoId && d.status === 'PENDING').length;
      const activeVisitors = store.access_logs.filter((a) => a.condominium_id === condoId && a.status === 'IN_PROPERTY').length;
      const today = new Date().toISOString().split('T')[0];
      const todayReservations = store.reservations.filter((r) => r.condominium_id === condoId && r.reservation_date === today && r.status === 'CONFIRMED').length;
      const lowStockItems = store.market_products.filter((p) => p.condominium_id === condoId && p.stock_quantity <= p.min_stock).length;

      const condoFin = store.financial.filter((f) => f.condominium_id === condoId);
      let incomePaid = 0;
      let incomePending = 0;
      let expensePaid = 0;
      for (const t of condoFin) {
        const val = Number(t.amount || 0);
        if (t.type === 'income') {
          if (t.status === 'PAID') incomePaid += val;
          else incomePending += val;
        } else if (t.type === 'expense' && t.status === 'PAID') {
          expensePaid += val;
        }
      }
      const balance = incomePaid - expensePaid;

      const urgentAnnouncements = store.announcements
        .filter((a) => a.condominium_id === condoId && (a.priority === 'urgente' || a.priority === 'alta' || a.is_pinned === 1))
        .sort((a, b) => b.is_pinned - a.is_pinned);

      return {
        metrics: {
          pendingDeliveries,
          activeVisitors,
          balance,
          todayReservations,
          lowStockItems
        },
        urgentAnnouncements
      };
    }

    // 5. Encomendas
    if (endpoint.startsWith('/deliveries')) {
      return store.deliveries.filter((d) => d.condominium_id === condoId);
    }

    // 6. Portaria / Controle de Acessos
    if (endpoint.startsWith('/access')) {
      const url = new URL(`http://localhost${endpoint}`);
      const search = (url.searchParams.get('search') || '').toLowerCase();
      let logs = store.access_logs.filter((a) => a.condominium_id === condoId);
      if (search) {
        logs = logs.filter((l) =>
          l.visitor_name.toLowerCase().includes(search) ||
          l.document.includes(search) ||
          (l.vehicle_plate && l.vehicle_plate.toLowerCase().includes(search))
        );
      }
      return logs;
    }

    // 7. Moradores
    if (endpoint.startsWith('/residents')) {
      return store.residents.filter((r) => r.condominium_id === condoId);
    }

    // 8. Veículos
    if (endpoint.startsWith('/vehicles')) {
      return store.vehicles.filter((v) => v.condominium_id === condoId);
    }

    // 8.1 Animais de Estimação (Pets)
    if (endpoint.startsWith('/pets')) {
      return (store.pets || []).filter((p) => p.condominium_id === condoId);
    }

    // 9. Espaços Comuns
    if (endpoint === '/spaces') {
      return store.spaces.filter((s) => s.condominium_id === condoId);
    }

    // 10. Reservas
    if (endpoint === '/reservations') {
      return store.reservations.filter((r) => r.condominium_id === condoId);
    }

    // 11. Financeiro: Resumo
    if (endpoint === '/financial/summary') {
      const condoFin = store.financial.filter((f) => f.condominium_id === condoId);
      let incomePaid = 0;
      let incomePending = 0;
      let expensePaid = 0;

      for (const t of condoFin) {
        const val = Number(t.amount || 0);
        if (t.type === 'income') {
          if (t.status === 'PAID') incomePaid += val;
          else incomePending += val;
        } else if (t.type === 'expense') {
          if (t.status === 'PAID') expensePaid += val;
        }
      }

      const totalIncome = incomePaid + incomePending;
      const defaultRate = totalIncome > 0 ? Number(((incomePending / totalIncome) * 100).toFixed(1)) : 0;

      return {
        currentBalance: incomePaid - expensePaid,
        incomePaid,
        incomePending,
        expensePaid,
        totalIncome,
        defaultRate
      };
    }

    // 12. Financeiro: Transações
    if (endpoint === '/financial/transactions') {
      return store.financial.filter((f) => f.condominium_id === condoId);
    }

    // 13. Mercadinho Autônomo: Produtos
    if (endpoint === '/market/products') {
      return store.market_products.filter((p) => p.condominium_id === condoId);
    }

    // 14. Mural de Comunicados
    if (endpoint === '/announcements') {
      return store.announcements
        .filter((a) => a.condominium_id === condoId)
        .sort((a, b) => b.is_pinned - a.is_pinned);
    }

    // 15. Usuários do Sistema (RBAC)
    if (endpoint.startsWith('/users')) {
      const url = new URL(`http://localhost${endpoint}`);
      const roleFilter = url.searchParams.get('role');
      let users = store.users.filter((u) => !u.condominium_id || u.condominium_id === condoId || u.role === 'ADMIN');
      if (roleFilter && roleFilter !== 'ALL') {
        users = users.filter((u) => u.role === roleFilter);
      }
      return users;
    }

    // 16. Logs de Auditoria & Compliance
    if (endpoint.startsWith('/audit_logs')) {
      return store.audit_logs
        .filter((a) => !a.condominium_id || a.condominium_id === condoId)
        .sort((a, b) => b.id - a.id);
    }

    // 17. Configurações e Parâmetros do Condomínio
    if (endpoint.startsWith('/condominiums/') && endpoint.endsWith('/settings')) {
      const id = Number(endpoint.split('/')[2]);
      return store.condo_settings[id] || store.condo_settings[1] || {};
    }

    // 18. Chamados e Ocorrências de Manutenção
    if (endpoint.startsWith('/occurrences')) {
      const url = new URL(`http://localhost${endpoint}`);
      const statusFilter = url.searchParams.get('status');
      let occs = store.occurrences.filter((o) => o.condominium_id === condoId);
      if (statusFilter && statusFilter !== 'ALL') {
        occs = occs.filter((o) => o.status === statusFilter);
      }
      return occs;
    }

    // 19. Assembleias e Votações Virtuais
    if (endpoint.startsWith('/polls')) {
      return store.polls.filter((p) => p.condominium_id === condoId);
    }

    return [];
  },

  post: async (endpoint, payload) => {
    const store = getStore();
    const condoId = Number(getActiveCondoId());

    // Cadastrar Condomínio
    if (endpoint === '/condominiums') {
      if (!payload.name || !payload.name.trim()) throw new Error('O nome do condomínio é obrigatório.');
      const newCondo = {
        id: Date.now() % 100000,
        name: payload.name.trim(),
        cnpj: payload.cnpj || '',
        address: payload.address || '',
        city: payload.city || '',
        state: payload.state || '',
        postal_code: payload.postal_code || '',
        phone: payload.phone || '',
        status: payload.status || 'ACTIVE'
      };
      store.condominiums.push(newCondo);
      store.condominium_modules[newCondo.id] = { dashboard: true, deliveries: true, access: true, residents: true, reservations: true, financial: true, market: true, announcements: true };
      saveStore(store);
      return newCondo;
    }

    // Cadastrar Bloco
    if (endpoint === '/blocks' || (endpoint.startsWith('/condominiums/') && endpoint.endsWith('/blocks'))) {
      const cId = endpoint.startsWith('/condominiums/') ? Number(endpoint.split('/')[2]) : Number(payload.condominium_id || condoId);
      if (!payload.name || !payload.name.trim()) throw new Error('O nome do bloco é obrigatório.');
      
      const duplicate = store.blocks.some((b) => b.condominium_id === cId && b.name.toLowerCase() === payload.name.trim().toLowerCase());
      if (duplicate) throw new Error(`Já existe um bloco chamado "${payload.name.trim()}" neste condomínio.`);

      const newBlock = {
        id: Date.now() % 100000,
        condominium_id: cId,
        name: payload.name.trim(),
        description: payload.description || ''
      };
      store.blocks.push(newBlock);
      saveStore(store);
      return newBlock;
    }

    // Cadastrar Unidade
    if (endpoint === '/units') {
      const cId = Number(payload.condominium_id || condoId);
      const bId = Number(payload.block_id);
      const block = store.blocks.find((b) => b.id === bId);
      if (!block) throw new Error('O bloco selecionado não foi localizado.');

      const duplicate = store.units.some((u) => u.block_id === bId && u.number.toLowerCase() === payload.number.trim().toLowerCase());
      if (duplicate) throw new Error(`Já existe uma unidade "${payload.number.trim()}" no bloco ${block.name}.`);

      const newUnit = {
        id: Date.now() % 100000,
        condominium_id: cId,
        block_id: bId,
        block_name: block.name,
        number: payload.number.trim(),
        floor: Number(payload.floor || 1),
        type: payload.type || 'Residencial'
      };
      store.units.push(newUnit);
      saveStore(store);
      return newUnit;
    }

    // Criar Encomenda
    if (endpoint === '/deliveries') {
      const unit = store.units.find((u) => u.id === Number(payload.unit_id));
      const res = store.residents.find((r) => r.unit_id === Number(payload.unit_id));
      const pickup_code = String(Math.floor(1000 + Math.random() * 9000));
      const newDel = {
        id: Date.now() % 100000,
        condominium_id: condoId,
        unit_id: Number(payload.unit_id),
        unit_number: unit ? unit.number : '—',
        block_name: unit ? unit.block_name : '',
        resident_name: res ? res.name : 'Morador',
        courier: payload.courier,
        tracking_code: payload.tracking_code || '',
        description: payload.description || '',
        status: 'PENDING',
        pickup_code,
        received_at: new Date().toISOString()
      };
      store.deliveries.unshift(newDel);
      saveStore(store);
      return newDel;
    }

    // Registrar Entrada de Portaria
    if (endpoint === '/access/entry') {
      const unit = store.units.find((u) => u.id === Number(payload.destination_unit_id));
      const newLog = {
        id: Date.now() % 100000,
        condominium_id: condoId,
        destination_unit_id: Number(payload.destination_unit_id),
        destination_unit: unit ? unit.number : '—',
        destination_block: unit ? unit.block_name : '',
        visitor_name: payload.visitor_name,
        document: payload.document,
        type: payload.type || 'Visitante',
        company: payload.company || '',
        vehicle_plate: payload.vehicle_plate || '',
        status: 'IN_PROPERTY',
        entered_at: new Date().toISOString(),
        exited_at: null
      };
      store.access_logs.unshift(newLog);
      saveStore(store);
      return newLog;
    }

    // Cadastrar Morador
    if (endpoint === '/residents') {
      const unit = store.units.find((u) => u.id === Number(payload.unit_id));
      const newRes = {
        id: Date.now() % 100000,
        condominium_id: condoId,
        unit_id: Number(payload.unit_id),
        unit_number: unit ? unit.number : '—',
        block_name: unit ? unit.block_name : '',
        name: payload.name,
        email: payload.email || '',
        phone: payload.phone || '',
        cpf: payload.cpf || '',
        role: payload.role || 'Proprietário',
        emergency_contact: payload.emergency_contact || ''
      };
      store.residents.unshift(newRes);
      saveStore(store);
      return newRes;
    }

    // Cadastrar Veículo
    if (endpoint === '/vehicles') {
      const unit = store.units.find((u) => u.id === Number(payload.unit_id));
      const res = store.residents.find((r) => r.unit_id === Number(payload.unit_id));
      const newVeh = {
        id: Date.now() % 100000,
        condominium_id: condoId,
        unit_id: Number(payload.unit_id),
        unit_number: unit ? unit.number : '—',
        block_name: unit ? unit.block_name : '',
        resident_name: res ? res.name : '',
        plate: payload.plate.toUpperCase(),
        model: payload.model,
        color: payload.color || '',
        type: payload.type || 'Carro',
        parking_spot: payload.parking_spot || ''
      };
      store.vehicles.unshift(newVeh);
      saveStore(store);
      return newVeh;
    }

    // Cadastrar Pet
    if (endpoint === '/pets') {
      const unit = store.units.find((u) => u.id === Number(payload.unit_id));
      const res = store.residents.find((r) => r.unit_id === Number(payload.unit_id));
      const newPet = {
        id: Date.now() % 100000,
        condominium_id: condoId,
        unit_id: Number(payload.unit_id),
        unit_number: unit ? unit.number : '—',
        resident_name: res ? res.name : (payload.resident_name || 'Morador'),
        name: payload.name,
        species: payload.species || 'Cão',
        breed: payload.breed || 'SRD',
        size: payload.size || 'Médio',
        vaccine_status: payload.vaccine_status || 'VACCINATED',
        vaccine_date: payload.vaccine_date || new Date().toISOString().split('T')[0],
        notes: payload.notes || ''
      };
      if (!store.pets) store.pets = [];
      store.pets.unshift(newPet);
      saveStore(store);
      return newPet;
    }

    // Cadastrar Reserva
    if (endpoint === '/reservations') {
      const space = store.spaces.find((s) => s.id === Number(payload.space_id));
      const res = store.residents.find((r) => r.id === Number(payload.resident_id));

      const hasConflict = store.reservations.some((r) =>
        r.condominium_id === condoId &&
        r.space_id === Number(payload.space_id) &&
        r.reservation_date === payload.reservation_date &&
        r.status === 'CONFIRMED' &&
        !(payload.end_time <= r.start_time || payload.start_time >= r.end_time)
      );

      if (hasConflict) {
        throw new Error('Já existe uma reserva confirmada para este espaço no horário selecionado.');
      }

      const newRes = {
        id: Date.now() % 100000,
        condominium_id: condoId,
        space_id: Number(payload.space_id),
        space_name: space ? space.name : 'Espaço Comum',
        resident_id: Number(payload.resident_id),
        resident_name: res ? res.name : 'Morador',
        unit_number: res ? res.unit_number : '—',
        reservation_date: payload.reservation_date,
        start_time: payload.start_time,
        end_time: payload.end_time,
        status: 'CONFIRMED',
        notes: payload.notes || ''
      };
      store.reservations.unshift(newRes);
      saveStore(store);
      return newRes;
    }

    // Cadastrar Lançamento Financeiro
    if (endpoint === '/financial/transactions') {
      const newTx = {
        id: Date.now() % 100000,
        condominium_id: condoId,
        type: payload.type,
        category: payload.category,
        description: payload.description,
        amount: Number(payload.amount),
        due_date: payload.due_date,
        status: 'PENDING',
        payment_date: null
      };
      store.financial.unshift(newTx);
      saveStore(store);
      return newTx;
    }

    // Cadastrar Produto no Mercadinho
    if (endpoint === '/market/products') {
      const newProd = {
        id: Date.now() % 100000,
        condominium_id: condoId,
        name: payload.name,
        category: payload.category || 'Geral',
        price: Number(payload.price),
        stock_quantity: Number(payload.stock_quantity || 10),
        min_stock: Number(payload.min_stock || 5)
      };
      store.market_products.unshift(newProd);
      saveStore(store);
      return newProd;
    }

    // Checkout PDV Mercadinho
    if (endpoint === '/market/checkout') {
      for (const item of payload.items) {
        const prod = store.market_products.find((p) => p.id === item.product_id);
        if (!prod) throw new Error('Produto não localizado.');
        if (prod.stock_quantity < item.quantity) {
          throw new Error(`Estoque insuficiente para ${prod.name}.`);
        }
        prod.stock_quantity -= item.quantity;
      }
      saveStore(store);
      return {
        sale_id: Date.now(),
        status: 'PAID',
        payment_method: payload.payment_method || 'PIX'
      };
    }

    // Publicar Comunicado
    if (endpoint === '/announcements') {
      const newAnn = {
        id: Date.now() % 100000,
        condominium_id: condoId,
        title: payload.title,
        content: payload.content,
        category: payload.category || 'Geral',
        priority: payload.priority || 'normal',
        is_pinned: Number(payload.is_pinned || 0),
        created_at: new Date().toISOString()
      };
      store.announcements.unshift(newAnn);
      saveStore(store);
      return newAnn;
    }

    // Cadastrar Usuário
    if (endpoint === '/users') {
      if (!payload.name || !payload.name.trim()) throw new Error('Nome do usuário é obrigatório.');
      if (!payload.email || !payload.email.trim()) throw new Error('E-mail é obrigatório.');
      const exists = store.users.some((u) => u.email.toLowerCase() === payload.email.trim().toLowerCase());
      if (exists) throw new Error('Já existe um usuário cadastrado com este e-mail.');

      const newUser = {
        id: Date.now() % 100000,
        condominium_id: payload.condominium_id ? Number(payload.condominium_id) : condoId,
        unit_id: payload.unit_id ? Number(payload.unit_id) : null,
        unit_number: payload.unit_number || '',
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        role: payload.role || 'MORADOR',
        status: payload.status || 'ACTIVE',
        phone: payload.phone || '',
        last_login_at: null,
        created_at: new Date().toISOString()
      };
      store.users.unshift(newUser);

      // Trilha de Auditoria
      store.audit_logs.unshift({
        id: Date.now() % 100000,
        condominium_id: condoId,
        user_name: 'Administrador Ativo',
        user_role: 'ADMIN',
        action: 'INSERT',
        target_table: 'users',
        details: `Criação do usuário ${newUser.name} (${newUser.role})`,
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString()
      });

      saveStore(store);
      return newUser;
    }

    // Registrar Evento de Auditoria
    if (endpoint === '/audit_logs') {
      const newLog = {
        id: Date.now() % 100000,
        condominium_id: condoId,
        user_name: payload.user_name || 'Operador',
        user_role: payload.user_role || 'ADMIN',
        action: payload.action || 'INSERT',
        target_table: payload.target_table || 'system',
        details: payload.details || '',
        ip_address: payload.ip_address || '127.0.0.1',
        created_at: new Date().toISOString()
      };
      store.audit_logs.unshift(newLog);
      saveStore(store);
      return newLog;
    }

    // Criar Chamado / Ocorrência de Manutenção
    if (endpoint === '/occurrences') {
      const unit = store.units.find((u) => u.id === Number(payload.unit_id));
      const res = store.residents.find((r) => r.unit_id === Number(payload.unit_id));
      const newOcc = {
        id: Date.now() % 100000,
        condominium_id: condoId,
        unit_id: payload.unit_id ? Number(payload.unit_id) : 1,
        unit_number: unit ? unit.number : '101',
        block_name: unit ? unit.block_name : 'Torre A',
        resident_name: res ? res.name : (payload.resident_name || 'Morador'),
        title: payload.title.trim(),
        category: payload.category || 'Geral',
        priority: payload.priority || 'media',
        status: 'OPEN',
        description: payload.description || '',
        resolution_notes: '',
        created_at: new Date().toISOString(),
        resolved_at: null
      };
      store.occurrences.unshift(newOcc);
      store.audit_logs.unshift({
        id: Date.now() % 100000,
        condominium_id: condoId,
        user_name: newOcc.resident_name,
        user_role: 'MORADOR',
        action: 'INSERT',
        target_table: 'occurrences',
        details: `Abertura do chamado #${newOcc.id}: ${newOcc.title} (${newOcc.category})`,
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString()
      });
      saveStore(store);
      return newOcc;
    }

    // Criar Enquete / Pauta de Assembleia
    if (endpoint === '/polls') {
      const newPoll = {
        id: Date.now() % 100000,
        condominium_id: condoId,
        title: payload.title.trim(),
        category: payload.category || 'Geral',
        description: payload.description || '',
        deadline: payload.deadline || '2026-12-31',
        status: 'OPEN',
        votes_for: 0,
        votes_against: 0,
        votes_abstain: 0,
        voted_units: [],
        created_at: new Date().toISOString().split('T')[0]
      };
      store.polls.unshift(newPoll);
      store.audit_logs.unshift({
        id: Date.now() % 100000,
        condominium_id: condoId,
        user_name: 'Síndico / Admin',
        user_role: 'SINDICO',
        action: 'INSERT',
        target_table: 'polls',
        details: `Criação de nova pauta de votação: ${newPoll.title}`,
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString()
      });
      saveStore(store);
      return newPoll;
    }

    // Registrar Voto na Assembleia Virtual
    if (endpoint.includes('/polls/') && endpoint.endsWith('/vote')) {
      const id = Number(endpoint.split('/')[2]);
      const poll = store.polls.find((p) => p.id === id);
      if (!poll) throw new Error('Deliberação não localizada.');
      if (poll.status !== 'OPEN') throw new Error('Esta votação já está encerrada.');

      const unitId = Number(payload.unit_id || 1);
      if (poll.voted_units.includes(unitId)) {
        throw new Error('Sua unidade já registrou um voto nesta pauta.');
      }

      if (payload.vote === 'for') poll.votes_for += 1;
      else if (payload.vote === 'against') poll.votes_against += 1;
      else if (payload.vote === 'abstain') poll.votes_abstain += 1;
      else throw new Error('Opção de voto inválida.');

      poll.voted_units.push(unitId);
      store.audit_logs.unshift({
        id: Date.now() % 100000,
        condominium_id: condoId,
        user_name: `Unidade ${unitId}`,
        user_role: 'MORADOR',
        action: 'INSERT',
        target_table: 'poll_votes',
        details: `Voto registrado na deliberação #${poll.id} (${poll.title})`,
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString()
      });
      saveStore(store);
      return poll;
    }

    return {};
  },

  patch: async (endpoint, payload) => {
    const store = getStore();

    // Atualizar Condomínio
    if (endpoint.startsWith('/condominiums/') && !endpoint.includes('/modules')) {
      const id = Number(endpoint.split('/')[2]);
      const condo = store.condominiums.find((c) => c.id === id);
      if (!condo) throw new Error('Condomínio não localizado.');
      Object.assign(condo, payload);
      saveStore(store);
      return condo;
    }

    // Atualizar Módulos do Condomínio
    if (endpoint.startsWith('/condominiums/') && endpoint.endsWith('/modules')) {
      const id = Number(endpoint.split('/')[2]);
      store.condominium_modules[id] = { ...store.condominium_modules[id], ...payload };
      saveStore(store);
      return store.condominium_modules[id];
    }

    // Atualizar Bloco
    if (endpoint.startsWith('/blocks/')) {
      const id = Number(endpoint.split('/')[2]);
      const block = store.blocks.find((b) => b.id === id);
      if (!block) throw new Error('Bloco não localizado.');
      if (payload.name) block.name = payload.name.trim();
      if (payload.description !== undefined) block.description = payload.description;
      saveStore(store);
      return block;
    }

    // Atualizar Unidade
    if (endpoint.startsWith('/units/')) {
      const id = Number(endpoint.split('/')[2]);
      const unit = store.units.find((u) => u.id === id);
      if (!unit) throw new Error('Unidade não localizada.');
      if (payload.block_id) {
        const b = store.blocks.find((blk) => blk.id === Number(payload.block_id));
        if (b) {
          unit.block_id = b.id;
          unit.block_name = b.name;
        }
      }
      if (payload.number) unit.number = payload.number.trim();
      if (payload.floor !== undefined) unit.floor = Number(payload.floor);
      if (payload.type) unit.type = payload.type;
      saveStore(store);
      return unit;
    }

    // Baixa de Encomenda via PIN
    if (endpoint.includes('/deliveries/') && endpoint.endsWith('/pickup')) {
      const id = Number(endpoint.split('/')[2]);
      const del = store.deliveries.find((d) => d.id === id);
      if (!del) throw new Error('Encomenda não localizada.');
      if (del.pickup_code !== String(payload.pickup_code)) {
        throw new Error('PIN incorreto. Verifique o código de 4 dígitos informado pelo morador.');
      }
      del.status = 'PICKED_UP';
      del.picked_up_at = new Date().toISOString();
      del.picked_up_by = payload.picked_up_by || 'Titular';
      saveStore(store);
      return del;
    }

    // Cancelar Encomenda
    if (endpoint.includes('/deliveries/') && endpoint.endsWith('/cancel')) {
      const id = Number(endpoint.split('/')[2]);
      const del = store.deliveries.find((d) => d.id === id);
      if (del) {
        del.status = 'CANCELLED';
        saveStore(store);
      }
      return del;
    }

    // Registrar Saída de Visitante
    if (endpoint.includes('/access/') && endpoint.endsWith('/exit')) {
      const id = Number(endpoint.split('/')[2]);
      const log = store.access_logs.find((a) => a.id === id);
      if (log) {
        log.status = 'EXITED';
        log.exited_at = new Date().toISOString();
        saveStore(store);
      }
      return log;
    }

    // Cancelar Reserva
    if (endpoint.includes('/reservations/') && endpoint.endsWith('/cancel')) {
      const id = Number(endpoint.split('/')[2]);
      const res = store.reservations.find((r) => r.id === id);
      if (res) {
        res.status = 'CANCELLED';
        saveStore(store);
      }
      return res;
    }

    // Quitar Lançamento Financeiro
    if (endpoint.includes('/financial/transactions/') && endpoint.endsWith('/pay')) {
      const id = Number(endpoint.split('/')[3]);
      const tx = store.financial.find((f) => f.id === id);
      if (tx) {
        tx.status = 'PAID';
        tx.payment_date = new Date().toISOString().split('T')[0];
        saveStore(store);
      }
      return tx;
    }

    // Atualizar Usuário
    if (endpoint.startsWith('/users/')) {
      const id = Number(endpoint.split('/')[2]);
      const user = store.users.find((u) => u.id === id);
      if (!user) throw new Error('Usuário não localizado.');
      Object.assign(user, payload);
      store.audit_logs.unshift({
        id: Date.now() % 100000,
        condominium_id: user.condominium_id || 1,
        user_name: 'Administrador Ativo',
        user_role: 'ADMIN',
        action: 'UPDATE',
        target_table: 'users',
        details: `Atualização cadastral do usuário ${user.name} (${user.role})`,
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString()
      });
      saveStore(store);
      return user;
    }

    // Atualizar Configurações do Condomínio
    if (endpoint.startsWith('/condominiums/') && endpoint.endsWith('/settings')) {
      const id = Number(endpoint.split('/')[2]);
      store.condo_settings[id] = { ...(store.condo_settings[id] || {}), ...payload };
      store.audit_logs.unshift({
        id: Date.now() % 100000,
        condominium_id: id,
        user_name: 'Administrador/Síndico',
        user_role: 'ADMIN',
        action: 'UPDATE',
        target_table: 'condo_settings',
        details: 'Atualização das configurações e regras operacionais do condomínio',
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString()
      });
      saveStore(store);
      return store.condo_settings[id];
    }

    // Atualizar Chamado / Ocorrência de Manutenção
    if (endpoint.startsWith('/occurrences/')) {
      const id = Number(endpoint.split('/')[2]);
      const occ = store.occurrences.find((o) => o.id === id);
      if (!occ) throw new Error('Ocorrência não localizada.');
      Object.assign(occ, payload);
      if (payload.status === 'RESOLVED' && !occ.resolved_at) {
        occ.resolved_at = new Date().toISOString();
      }
      store.audit_logs.unshift({
        id: Date.now() % 100000,
        condominium_id: occ.condominium_id,
        user_name: 'Equipe de Manutenção / Síndico',
        user_role: 'TRABALHADOR',
        action: 'UPDATE',
        target_table: 'occurrences',
        details: `Chamado #${occ.id} (${occ.title}) atualizado para ${occ.status}`,
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString()
      });
      saveStore(store);
      return occ;
    }

    // Encerrar Pauta de Votação
    if (endpoint.includes('/polls/') && endpoint.endsWith('/close')) {
      const id = Number(endpoint.split('/')[2]);
      const poll = store.polls.find((p) => p.id === id);
      if (poll) {
        poll.status = 'CLOSED';
        saveStore(store);
      }
      return poll;
    }

    return {};
  },

  delete: async (endpoint) => {
    const store = getStore();

    // 1. Excluir Condomínio (com integridade relacional estrita)
    if (endpoint.startsWith('/condominiums/')) {
      const id = Number(endpoint.split('/')[2]);
      const hasBlocks = store.blocks.some((b) => b.condominium_id === id);
      const hasUnits = store.units.some((u) => u.condominium_id === id);
      const hasResidents = store.residents.some((r) => r.condominium_id === id);

      if (hasBlocks || hasUnits || hasResidents) {
        throw new Error('Não é possível excluir o condomínio: existem blocos, unidades ou moradores vinculados.');
      }

      store.condominiums = store.condominiums.filter((c) => c.id !== id);
      saveStore(store);
      return { success: true };
    }

    // 2. Excluir Bloco (com integridade relacional estrita)
    if (endpoint.startsWith('/blocks/')) {
      const id = Number(endpoint.split('/')[2]);
      const hasUnits = store.units.some((u) => u.block_id === id);
      if (hasUnits) {
        throw new Error('Não é possível excluir o bloco: existem apartamentos vinculados a ele.');
      }
      store.blocks = store.blocks.filter((b) => b.id !== id);
      saveStore(store);
      return { success: true };
    }

    // 3. Excluir Unidade (com integridade relacional estrita)
    if (endpoint.startsWith('/units/')) {
      const id = Number(endpoint.split('/')[2]);
      const hasResidents = store.residents.some((r) => r.unit_id === id);
      const hasVehicles = store.vehicles.some((v) => v.unit_id === id);
      const hasDeliveries = store.deliveries.some((d) => d.unit_id === id && d.status === 'PENDING');

      if (hasResidents) throw new Error('Não é possível excluir a unidade: existem moradores ativos vinculados.');
      if (hasVehicles) throw new Error('Não é possível excluir a unidade: existem veículos vinculados à sua vaga.');
      if (hasDeliveries) throw new Error('Não é possível excluir a unidade: há encomendas aguardando retirada para este apartamento.');

      store.units = store.units.filter((u) => u.id !== id);
      saveStore(store);
      return { success: true };
    }

    // 4. Excluir Usuário
    if (endpoint.startsWith('/users/')) {
      const id = Number(endpoint.split('/')[2]);
      const user = store.users.find((u) => u.id === id);
      if (user && user.role === 'ADMIN' && store.users.filter((u) => u.role === 'ADMIN').length <= 1) {
        throw new Error('Operação negada: não é permitido excluir o único administrador do sistema.');
      }
      store.users = store.users.filter((u) => u.id !== id);
      if (user) {
        store.audit_logs.unshift({
          id: Date.now() % 100000,
          condominium_id: user.condominium_id || 1,
          user_name: 'Administrador Ativo',
          user_role: 'ADMIN',
          action: 'DELETE',
          target_table: 'users',
          details: `Exclusão permanente do usuário ${user.name} (${user.email})`,
          ip_address: '127.0.0.1',
          created_at: new Date().toISOString()
        });
      }
      saveStore(store);
      return { success: true };
    }

    // 5. Excluir Ocorrência
    if (endpoint.startsWith('/occurrences/')) {
      const id = Number(endpoint.split('/')[2]);
      store.occurrences = store.occurrences.filter((o) => o.id !== id);
      saveStore(store);
      return { success: true };
    }

    // 6. Excluir Enquete
    if (endpoint.startsWith('/polls/')) {
      const id = Number(endpoint.split('/')[2]);
      store.polls = store.polls.filter((p) => p.id !== id);
      saveStore(store);
      return { success: true };
    }

    if (endpoint.startsWith('/residents/')) {
      const id = Number(endpoint.split('/')[2]);
      store.residents = store.residents.filter((r) => r.id !== id);
      saveStore(store);
      return { success: true };
    }

    if (endpoint.startsWith('/vehicles/')) {
      const id = Number(endpoint.split('/')[2]);
      store.vehicles = store.vehicles.filter((v) => v.id !== id);
      saveStore(store);
      return { success: true };
    }

    if (endpoint.startsWith('/pets/')) {
      const id = Number(endpoint.split('/')[2]);
      if (store.pets) {
        store.pets = store.pets.filter((p) => p.id !== id);
      }
      saveStore(store);
      return { success: true };
    }

    if (endpoint.startsWith('/announcements/')) {
      const id = Number(endpoint.split('/')[2]);
      store.announcements = store.announcements.filter((a) => a.id !== id);
      saveStore(store);
      return { success: true };
    }

    return { success: true };
  }
};

export default api;
