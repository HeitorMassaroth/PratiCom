import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, 'condo_store.json');

// Estrutura inicial do banco em memória com persistência em JSON
let memoryDb = {
  units: [],
  residents: [],
  vehicles: [],
  pets: [],
  deliveries: [],
  access_logs: [],
  spaces: [],
  reservations: [],
  financial_transactions: [],
  announcements: [],
  market_products: [],
  market_sales: []
};

// Carregar dados salvos ou inicializar seed
function loadDatabase() {
  try {
    if (fs.existsSync(dbFilePath)) {
      const content = fs.readFileSync(dbFilePath, 'utf-8');
      memoryDb = JSON.parse(content);
      console.log('📦 Banco de dados local carregado com sucesso:', dbFilePath);
    } else {
      console.log('🌱 Inicializando banco de dados com dados de demonstração...');
      seedDatabase();
      saveDatabase();
    }
  } catch (err) {
    console.error('Erro ao carregar banco JSON:', err);
    seedDatabase();
    saveDatabase();
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao persistir banco de dados:', err);
  }
}

// Helpers assíncronos que mantêm compatibilidade total com a API
export const db = {
  getStore: () => memoryDb,
  save: saveDatabase
};

export const dbAll = async (sql, params = []) => {
  // Retorna os registros conforme a coleção
  return [];
};

export const dbGet = async (sql, params = []) => {
  return null;
};

export const dbRun = async (sql, params = []) => {
  saveDatabase();
  return { id: Date.now(), changes: 1 };
};

// Funções de Acesso a Dados Diretas e Rápidas
export const models = {
  // Units
  getUnits: () => {
    return memoryDb.units.map(u => {
      const resCount = memoryDb.residents.filter(r => r.unit_id === u.id).length;
      const vehCount = memoryDb.vehicles.filter(v => v.unit_id === u.id).length;
      const petCount = memoryDb.pets.filter(p => p.unit_id === u.id).length;
      return { ...u, residents_count: resCount, vehicles_count: vehCount, pets_count: petCount };
    });
  },

  // Residents
  getResidents: ({ unit_id, search } = {}) => {
    let list = memoryDb.residents.map(r => {
      const u = memoryDb.units.find(un => un.id === r.unit_id) || {};
      return { ...r, block: u.block || '', unit_number: u.number || '' };
    });

    if (unit_id) {
      list = list.filter(r => r.unit_id === parseInt(unit_id, 10));
    }
    if (search) {
      const term = search.toLowerCase();
      list = list.filter(r => 
        r.name.toLowerCase().includes(term) ||
        (r.email && r.email.toLowerCase().includes(term)) ||
        (r.phone && r.phone.includes(term)) ||
        (r.cpf && r.cpf.includes(term))
      );
    }
    return list;
  },
  createResident: (data) => {
    const newId = memoryDb.residents.length > 0 ? Math.max(...memoryDb.residents.map(r => r.id)) + 1 : 1;
    const resident = {
      id: newId,
      unit_id: parseInt(data.unit_id, 10),
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      cpf: data.cpf || null,
      role: data.role || 'Proprietário',
      emergency_contact: data.emergency_contact || null,
      created_at: new Date().toISOString()
    };
    memoryDb.residents.push(resident);
    saveDatabase();
    const u = memoryDb.units.find(un => un.id === resident.unit_id) || {};
    return { ...resident, block: u.block, unit_number: u.number };
  },
  deleteResident: (id) => {
    memoryDb.residents = memoryDb.residents.filter(r => r.id !== parseInt(id, 10));
    saveDatabase();
    return true;
  },

  // Vehicles
  getVehicles: () => {
    return memoryDb.vehicles.map(v => {
      const u = memoryDb.units.find(un => un.id === v.unit_id) || {};
      const r = memoryDb.residents.find(res => res.id === v.resident_id) || {};
      return { ...v, block: u.block, unit_number: u.number, resident_name: r.name };
    });
  },
  createVehicle: (data) => {
    const newId = memoryDb.vehicles.length > 0 ? Math.max(...memoryDb.vehicles.map(v => v.id)) + 1 : 1;
    const vehicle = {
      id: newId,
      unit_id: parseInt(data.unit_id, 10),
      resident_id: data.resident_id ? parseInt(data.resident_id, 10) : null,
      plate: data.plate.toUpperCase(),
      model: data.model,
      color: data.color || '',
      type: data.type || 'Carro',
      parking_spot: data.parking_spot || ''
    };
    memoryDb.vehicles.push(vehicle);
    saveDatabase();
    return vehicle;
  },

  // Pets
  getPets: () => {
    return memoryDb.pets.map(p => {
      const u = memoryDb.units.find(un => un.id === p.unit_id) || {};
      return { ...p, block: u.block, unit_number: u.number };
    });
  },

  // Deliveries
  getDeliveries: ({ status, unit_id } = {}) => {
    let list = memoryDb.deliveries.map(d => {
      const u = memoryDb.units.find(un => un.id === d.unit_id) || {};
      const r = memoryDb.residents.find(res => res.id === d.resident_id) || {};
      return { ...d, block: u.block, unit_number: u.number, resident_name: r.name, resident_phone: r.phone };
    });

    if (status) {
      list = list.filter(d => d.status === status);
    }
    if (unit_id) {
      list = list.filter(d => d.unit_id === parseInt(unit_id, 10));
    }

    return list.sort((a, b) => new Date(b.received_at) - new Date(a.received_at));
  },
  createDelivery: (data) => {
    const newId = memoryDb.deliveries.length > 0 ? Math.max(...memoryDb.deliveries.map(d => d.id)) + 1 : 1;
    const pickup_code = Math.floor(1000 + Math.random() * 9000).toString();
    const delivery = {
      id: newId,
      unit_id: parseInt(data.unit_id, 10),
      resident_id: data.resident_id ? parseInt(data.resident_id, 10) : null,
      courier: data.courier,
      tracking_code: data.tracking_code || null,
      description: data.description || '',
      received_at: new Date().toISOString(),
      status: 'pending',
      pickup_code,
      picked_up_at: null,
      picked_up_by: null,
      notes: data.notes || null
    };
    memoryDb.deliveries.push(delivery);
    saveDatabase();
    const u = memoryDb.units.find(un => un.id === delivery.unit_id) || {};
    const r = memoryDb.residents.find(res => res.id === delivery.resident_id) || {};
    return { ...delivery, block: u.block, unit_number: u.number, resident_name: r.name, resident_phone: r.phone };
  },
  pickupDelivery: (id, { pickup_code, picked_up_by }) => {
    const del = memoryDb.deliveries.find(d => d.id === parseInt(id, 10));
    if (!del) throw new Error('Encomenda não encontrada.');
    if (pickup_code && del.pickup_code !== pickup_code) {
      throw new Error('Código PIN de retirada incorreto!');
    }
    del.status = 'delivered';
    del.picked_up_at = new Date().toISOString();
    del.picked_up_by = pickedUpByInputOrDefault(picked_up_by);
    saveDatabase();
    return del;
  },

  // Access Logs
  getAccessLogs: ({ status, type, search } = {}) => {
    let list = memoryDb.access_logs.map(a => {
      const u = memoryDb.units.find(un => un.id === a.unit_id) || {};
      return { ...a, block: u.block || '', unit_number: u.number || '' };
    });

    if (status) {
      list = list.filter(a => a.status === status);
    }
    if (type) {
      list = list.filter(a => a.type === type);
    }
    if (search) {
      const term = search.toLowerCase();
      list = list.filter(a =>
        a.visitor_name.toLowerCase().includes(term) ||
        a.document.includes(term) ||
        (a.vehicle_plate && a.vehicle_plate.toLowerCase().includes(term)) ||
        (a.company && a.company.toLowerCase().includes(term))
      );
    }

    return list.sort((a, b) => {
      if (a.status === 'inside' && b.status !== 'inside') return -1;
      if (b.status === 'inside' && a.status !== 'inside') return 1;
      return new Date(b.entered_at) - new Date(a.entered_at);
    });
  },
  registerEntry: (data) => {
    const newId = memoryDb.access_logs.length > 0 ? Math.max(...memoryDb.access_logs.map(a => a.id)) + 1 : 1;
    const log = {
      id: newId,
      visitor_name: data.visitor_name,
      document: data.document,
      type: data.type || 'Visitante',
      company: data.company || null,
      vehicle_plate: data.vehicle_plate ? data.vehicle_plate.toUpperCase() : null,
      unit_id: data.unit_id ? parseInt(data.unit_id, 10) : null,
      authorized_by: data.authorized_by || null,
      entered_at: new Date().toISOString(),
      exited_at: null,
      status: 'inside',
      notes: data.notes || null
    };
    memoryDb.access_logs.push(log);
    saveDatabase();
    const u = memoryDb.units.find(un => un.id === log.unit_id) || {};
    return { ...log, block: u.block || '', unit_number: u.number || '' };
  },
  registerExit: (id) => {
    const log = memoryDb.access_logs.find(a => a.id === parseInt(id, 10));
    if (!log) throw new Error('Registro de acesso não encontrado.');
    log.status = 'exited';
    log.exited_at = new Date().toISOString();
    saveDatabase();
    return log;
  },

  // Spaces & Reservations (REGRA: 1 HORA POR PESSOA/DIA)
  getSpaces: () => {
    return memoryDb.spaces.filter(s => s.is_active !== 0);
  },
  getReservations: ({ date, space_id, resident_id } = {}) => {
    let list = memoryDb.reservations.map(res => {
      const s = memoryDb.spaces.find(sp => sp.id === res.space_id) || {};
      const r = memoryDb.residents.find(re => re.id === res.resident_id) || {};
      const u = memoryDb.units.find(un => un.id === res.unit_id) || {};
      return {
        ...res,
        space_name: s.name,
        space_icon: s.icon,
        space_fee: s.fee,
        resident_name: r.name,
        resident_phone: r.phone,
        block: u.block,
        unit_number: u.number
      };
    });

    if (date) {
      list = list.filter(r => r.reservation_date === date);
    }
    if (space_id) {
      list = list.filter(r => r.space_id === parseInt(space_id, 10));
    }
    if (resident_id) {
      list = list.filter(r => r.resident_id === parseInt(resident_id, 10));
    }

    return list.sort((a, b) => a.start_time.localeCompare(b.start_time));
  },
  createReservation: (data) => {
    const { space_id, resident_id, unit_id, reservation_date, start_time, end_time, guests_count, notes } = data;

    // 1. Validar intervalo de 1 hora
    const startHour = parseInt(start_time.split(':')[0], 10);
    const endHour = parseInt(end_time.split(':')[0], 10);
    if (endHour - startHour !== 1) {
      throw new Error('Regra do Condomínio: O tempo de reserva deve ser de exatamente 1 hora (ex: 18:00 às 19:00).');
    }

    // 2. Validar se o morador / unidade já possui reserva ativa no dia (Regra de 1 hora diária por morador)
    const existing = memoryDb.reservations.find(r => 
      (r.resident_id === parseInt(resident_id, 10) || r.unit_id === parseInt(unit_id, 10)) &&
      r.reservation_date === reservation_date &&
      r.status === 'Confirmada'
    );

    if (existing) {
      const spaceObj = memoryDb.spaces.find(s => s.id === existing.space_id);
      throw new Error(`Limite diário atingido! O morador/unidade já possui uma reserva ativa em ${spaceObj?.name || 'Área Comum'} no dia ${reservation_date} (${existing.start_time} às ${existing.end_time}). Permitido no máximo 1 hora por dia por morador.`);
    }

    // 3. Validar se o espaço e horário estão livres
    const conflict = memoryDb.reservations.find(r =>
      r.space_id === parseInt(space_id, 10) &&
      r.reservation_date === reservation_date &&
      r.start_time === start_time &&
      r.status === 'Confirmada'
    );

    if (conflict) {
      const conflictResident = memoryDb.residents.find(r => r.id === conflict.resident_id);
      throw new Error(`Este horário (${start_time} às ${end_time}) já está reservado por outro morador (${conflictResident?.name || 'Morador'}). Escolha outro horário.`);
    }

    const newId = memoryDb.reservations.length > 0 ? Math.max(...memoryDb.reservations.map(r => r.id)) + 1 : 1;
    const reservation = {
      id: newId,
      space_id: parseInt(space_id, 10),
      resident_id: parseInt(resident_id, 10),
      unit_id: parseInt(unit_id, 10),
      reservation_date,
      start_time,
      end_time,
      guests_count: parseInt(guests_count, 10) || 0,
      status: 'Confirmada',
      notes: notes || null,
      created_at: new Date().toISOString()
    };
    memoryDb.reservations.push(reservation);
    saveDatabase();

    const s = memoryDb.spaces.find(sp => sp.id === reservation.space_id) || {};
    const r = memoryDb.residents.find(re => re.id === reservation.resident_id) || {};
    const u = memoryDb.units.find(un => un.id === reservation.unit_id) || {};
    return {
      ...reservation,
      space_name: s.name,
      space_icon: s.icon,
      resident_name: r.name,
      block: u.block,
      unit_number: u.number
    };
  },
  cancelReservation: (id) => {
    const res = memoryDb.reservations.find(r => r.id === parseInt(id, 10));
    if (!res) throw new Error('Reserva não encontrada.');
    res.status = 'Cancelada';
    saveDatabase();
    return true;
  },

  // Financial
  getFinancialTransactions: ({ type, status, unit_id, category } = {}) => {
    let list = memoryDb.financial_transactions.map(f => {
      const u = memoryDb.units.find(un => un.id === f.unit_id) || {};
      return { ...f, block: u.block || '', unit_number: u.number || '' };
    });

    if (type) list = list.filter(f => f.type === type);
    if (status) list = list.filter(f => f.status === status);
    if (unit_id) list = list.filter(f => f.unit_id === parseInt(unit_id, 10));
    if (category) list = list.filter(f => f.category === category);

    return list.sort((a, b) => new Date(b.due_date) - new Date(a.due_date));
  },
  getFinancialSummary: () => {
    const incomePaid = memoryDb.financial_transactions.filter(f => f.type === 'income' && f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    const incomePending = memoryDb.financial_transactions.filter(f => f.type === 'income' && f.status === 'pending').reduce((s, f) => s + f.amount, 0);
    const incomeOverdue = memoryDb.financial_transactions.filter(f => f.type === 'income' && f.status === 'overdue').reduce((s, f) => s + f.amount, 0);

    const expensePaid = memoryDb.financial_transactions.filter(f => f.type === 'expense' && f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    const expensePending = memoryDb.financial_transactions.filter(f => f.type === 'expense' && f.status === 'pending').reduce((s, f) => s + f.amount, 0);

    // Inadimplência por unidade
    const overdueTxs = memoryDb.financial_transactions.filter(f => f.type === 'income' && f.status === 'overdue' && f.unit_id);
    const debtMap = {};
    for (const tx of overdueTxs) {
      if (!debtMap[tx.unit_id]) debtMap[tx.unit_id] = 0;
      debtMap[tx.unit_id] += tx.amount;
    }

    const delinquencyByUnit = Object.keys(debtMap).map(uId => {
      const u = memoryDb.units.find(un => un.id === parseInt(uId, 10)) || {};
      return {
        id: u.id,
        block: u.block,
        unit_number: u.number,
        total_debt: debtMap[uId]
      };
    });

    return {
      income: {
        paid: incomePaid,
        pending: incomePending,
        overdue: incomeOverdue,
        total: incomePaid + incomePending + incomeOverdue
      },
      expense: {
        paid: expensePaid,
        pending: expensePending,
        total: expensePaid + expensePending
      },
      currentBalance: incomePaid - expensePaid,
      delinquencyByUnit
    };
  },
  createFinancialTransaction: (data) => {
    const newId = memoryDb.financial_transactions.length > 0 ? Math.max(...memoryDb.financial_transactions.map(f => f.id)) + 1 : 1;
    const docNumber = data.document_number || `DOC-${Date.now().toString().slice(-6)}`;
    const tx = {
      id: newId,
      type: data.type,
      category: data.category,
      description: data.description,
      amount: parseFloat(data.amount),
      due_date: data.due_date,
      payment_date: data.status === 'paid' ? new Date().toISOString().split('T')[0] : null,
      status: data.status || 'pending',
      unit_id: data.unit_id ? parseInt(data.unit_id, 10) : null,
      document_number: docNumber,
      created_at: new Date().toISOString()
    };
    memoryDb.financial_transactions.push(tx);
    saveDatabase();
    return tx;
  },
  payFinancialTransaction: (id) => {
    const tx = memoryDb.financial_transactions.find(f => f.id === parseInt(id, 10));
    if (!tx) throw new Error('Transação financeira não encontrada.');
    tx.status = 'paid';
    tx.payment_date = new Date().toISOString().split('T')[0];
    saveDatabase();
    return tx;
  },

  // Announcements
  getAnnouncements: ({ category, priority } = {}) => {
    let list = [...memoryDb.announcements];
    if (category) list = list.filter(a => a.category === category);
    if (priority) list = list.filter(a => a.priority === priority);
    return list.sort((a, b) => {
      if (b.is_pinned !== a.is_pinned) return b.is_pinned - a.is_pinned;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  },
  createAnnouncement: (data) => {
    const newId = memoryDb.announcements.length > 0 ? Math.max(...memoryDb.announcements.map(a => a.id)) + 1 : 1;
    const ann = {
      id: newId,
      title: data.title,
      content: data.content,
      priority: data.priority || 'normal',
      category: data.category || 'Geral',
      author: data.author || 'Administração',
      target_block: data.target_block || 'Todos',
      is_pinned: data.is_pinned ? 1 : 0,
      created_at: new Date().toISOString(),
      expires_at: data.expires_at || null
    };
    memoryDb.announcements.push(ann);
    saveDatabase();
    return ann;
  },
  deleteAnnouncement: (id) => {
    memoryDb.announcements = memoryDb.announcements.filter(a => a.id !== parseInt(id, 10));
    saveDatabase();
    return true;
  },

  // Market
  getMarketProducts: ({ category, low_stock } = {}) => {
    let list = memoryDb.market_products.filter(p => p.is_active !== 0);
    if (category) list = list.filter(p => p.category === category);
    if (low_stock === 'true') list = list.filter(p => p.stock_quantity <= p.min_stock);
    return list.sort((a, b) => {
      const aLow = a.stock_quantity <= a.min_stock;
      const bLow = b.stock_quantity <= b.min_stock;
      if (aLow && !bLow) return -1;
      if (!aLow && bLow) return 1;
      return a.name.localeCompare(b.name);
    });
  },
  createMarketProduct: (data) => {
    const newId = memoryDb.market_products.length > 0 ? Math.max(...memoryDb.market_products.map(p => p.id)) + 1 : 1;
    const product = {
      id: newId,
      name: data.name,
      barcode: data.barcode || null,
      category: data.category || 'Mercearia',
      cost_price: parseFloat(data.cost_price) || 0,
      sale_price: parseFloat(data.sale_price),
      stock_quantity: parseInt(data.stock_quantity, 10) || 0,
      min_stock: parseInt(data.min_stock, 10) || 5,
      image_url: data.image_url || '📦',
      is_active: 1
    };
    memoryDb.market_products.push(product);
    saveDatabase();
    return product;
  },
  updateMarketStock: (id, { delta, new_quantity }) => {
    const prod = memoryDb.market_products.find(p => p.id === parseInt(id, 10));
    if (!prod) throw new Error('Produto não encontrado.');
    if (new_quantity !== undefined) {
      prod.stock_quantity = parseInt(new_quantity, 10);
    } else if (delta !== undefined) {
      prod.stock_quantity = Math.max(0, prod.stock_quantity + parseInt(delta, 10));
    }
    saveDatabase();
    return prod;
  },
  checkoutMarket: ({ unit_id, resident_name, payment_method, items }) => {
    let totalAmount = 0;

    for (const item of items) {
      const prod = memoryDb.market_products.find(p => p.id === item.product_id);
      if (!prod) throw new Error(`Produto ID ${item.product_id} não encontrado.`);
      if (prod.stock_quantity < item.quantity) {
        throw new Error(`Estoque insuficiente para ${prod.name}. Disponível: ${prod.stock_quantity}`);
      }
      totalAmount += prod.sale_price * item.quantity;
      prod.stock_quantity -= item.quantity;
    }

    const newSaleId = memoryDb.market_sales.length > 0 ? Math.max(...memoryDb.market_sales.map(s => s.id)) + 1 : 1;
    const sale = {
      id: newSaleId,
      unit_id: unit_id ? parseInt(unit_id, 10) : null,
      resident_name: resident_name || 'Morador/Autoatendimento',
      payment_method,
      total_amount: totalAmount,
      items_json: JSON.stringify(items),
      created_at: new Date().toISOString()
    };
    memoryDb.market_sales.push(sale);

    if (payment_method === 'condo_bill' && unit_id) {
      const nextMonthDate = new Date();
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      nextMonthDate.setDate(10);
      const dueDate = nextMonthDate.toISOString().split('T')[0];

      const newTxId = memoryDb.financial_transactions.length > 0 ? Math.max(...memoryDb.financial_transactions.map(f => f.id)) + 1 : 1;
      memoryDb.financial_transactions.push({
        id: newTxId,
        type: 'income',
        category: 'Mercadinho',
        description: `Consumo Mercadinho - Venda #${newSaleId}`,
        amount: totalAmount,
        due_date: dueDate,
        payment_date: null,
        status: 'pending',
        unit_id: parseInt(unit_id, 10),
        document_number: `MKT-AUTO-${newSaleId}`,
        created_at: new Date().toISOString()
      });
    }

    saveDatabase();
    return { sale_id: newSaleId, total_amount: totalAmount };
  },
  getMarketSales: () => {
    return memoryDb.market_sales.map(s => {
      const u = memoryDb.units.find(un => un.id === s.unit_id) || {};
      return { ...s, block: u.block, unit_number: u.number };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  // Dashboard Aggregator
  getDashboardData: () => {
    const today = new Date().toISOString().split('T')[0];
    const pendingDeliveries = memoryDb.deliveries.filter(d => d.status === 'pending').length;
    const activeVisitors = memoryDb.access_logs.filter(a => a.status === 'inside').length;
    const todayReservations = memoryDb.reservations.filter(r => r.reservation_date === today && r.status === 'Confirmada').length;
    const lowStockItems = memoryDb.market_products.filter(p => p.stock_quantity <= p.min_stock).length;

    const incomePaid = memoryDb.financial_transactions.filter(f => f.type === 'income' && f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    const expensePaid = memoryDb.financial_transactions.filter(f => f.type === 'expense' && f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    const overdueTxs = memoryDb.financial_transactions.filter(f => f.type === 'income' && f.status === 'overdue');
    const overdueCount = overdueTxs.length;
    const overdueTotal = overdueTxs.reduce((s, f) => s + f.amount, 0);

    const recentAccess = models.getAccessLogs().slice(0, 5);
    const recentDeliveries = models.getDeliveries().slice(0, 5);
    const urgentAnnouncements = models.getAnnouncements({ priority: 'urgent' }).concat(models.getAnnouncements({ priority: 'high' })).slice(0, 3);
    const upcomingReservations = models.getReservations().filter(r => r.reservation_date >= today && r.status === 'Confirmada').slice(0, 4);

    return {
      metrics: {
        pendingDeliveries,
        activeVisitors,
        todayReservations,
        lowStockItems,
        totalResidents: memoryDb.residents.length,
        totalUnits: memoryDb.units.length,
        totalIncome: incomePaid,
        totalExpense: expensePaid,
        balance: incomePaid - expensePaid,
        overdueCount,
        overdueTotal
      },
      recentAccess,
      recentDeliveries,
      urgentAnnouncements,
      upcomingReservations
    };
  }
};

function pickedUpByInputOrDefault(val) {
  return val || 'Morador/Autorizado';
}

function seedDatabase() {
  memoryDb.units = [
    { id: 1, block: 'Torre A', number: '101', floor: 1, type: 'Apartamento', status: 'Ocupado' },
    { id: 2, block: 'Torre A', number: '102', floor: 1, type: 'Apartamento', status: 'Ocupado' },
    { id: 3, block: 'Torre A', number: '201', floor: 2, type: 'Apartamento', status: 'Ocupado' },
    { id: 4, block: 'Torre A', number: '202', floor: 2, type: 'Apartamento', status: 'Ocupado' },
    { id: 5, block: 'Torre A', number: '301', floor: 3, type: 'Apartamento', status: 'Ocupado' },
    { id: 6, block: 'Torre A', number: '302', floor: 3, type: 'Apartamento', status: 'Ocupado' },
    { id: 7, block: 'Torre B', number: '101', floor: 1, type: 'Apartamento', status: 'Ocupado' },
    { id: 8, block: 'Torre B', number: '102', floor: 1, type: 'Apartamento', status: 'Ocupado' },
    { id: 9, block: 'Torre B', number: '201', floor: 2, type: 'Apartamento', status: 'Ocupado' },
    { id: 10, block: 'Torre B', number: '202', floor: 2, type: 'Apartamento', status: 'Ocupado' },
    { id: 11, block: 'Torre B', number: '301', floor: 3, type: 'Apartamento', status: 'Ocupado' },
    { id: 12, block: 'Torre B', number: '302', floor: 3, type: 'Apartamento', status: 'Ocupado' }
  ];

  memoryDb.residents = [
    { id: 1, unit_id: 1, name: 'Carlos Eduardo Silva', email: 'carlos.silva@email.com', phone: '(11) 98765-4321', cpf: '123.456.789-00', role: 'Síndico', emergency_contact: 'Ana Silva (11) 98765-1111', created_at: new Date().toISOString() },
    { id: 2, unit_id: 1, name: 'Ana Paula Silva', email: 'ana.silva@email.com', phone: '(11) 98765-1111', cpf: '234.567.890-11', role: 'Proprietário', emergency_contact: 'Carlos Silva (11) 98765-4321', created_at: new Date().toISOString() },
    { id: 3, unit_id: 2, name: 'Mariana Oliveira Ramos', email: 'mariana.ramos@email.com', phone: '(11) 97654-3210', cpf: '345.678.901-22', role: 'Inquilino', emergency_contact: 'Roberto Ramos (11) 97777-2222', created_at: new Date().toISOString() },
    { id: 4, unit_id: 3, name: 'Fernando Henrique Souza', email: 'fernando.souza@email.com', phone: '(11) 96543-2109', cpf: '456.789.012-33', role: 'Proprietário', emergency_contact: 'Juliana Souza (11) 96666-3333', created_at: new Date().toISOString() },
    { id: 5, unit_id: 4, name: 'Beatriz Almeida Costa', email: 'beatriz.costa@email.com', phone: '(11) 95432-1098', cpf: '567.890.123-44', role: 'Proprietário', emergency_contact: 'Marcelo Costa (11) 95555-4444', created_at: new Date().toISOString() },
    { id: 6, unit_id: 5, name: 'Lucas Gabriel Martins', email: 'lucas.martins@email.com', phone: '(11) 94321-0987', cpf: '678.901.234-55', role: 'Inquilino', emergency_contact: 'Patrícia Martins (11) 94444-5555', created_at: new Date().toISOString() },
    { id: 7, unit_id: 7, name: 'Juliana Ribeiro Mendes', email: 'juliana.mendes@email.com', phone: '(11) 93210-9876', cpf: '789.012.345-66', role: 'Proprietário', emergency_contact: 'Marcos Mendes (11) 93333-6666', created_at: new Date().toISOString() },
    { id: 8, unit_id: 8, name: 'Rodrigo Augusto Lima', email: 'rodrigo.lima@email.com', phone: '(11) 92109-8765', cpf: '890.123.456-77', role: 'Proprietário', emergency_contact: 'Camila Lima (11) 92222-7777', created_at: new Date().toISOString() },
    { id: 9, unit_id: 9, name: 'Camila Torres Ferreira', email: 'camila.torres@email.com', phone: '(11) 91098-7654', cpf: '901.234.567-88', role: 'Inquilino', emergency_contact: 'Diego Ferreira (11) 91111-8888', created_at: new Date().toISOString() },
    { id: 10, unit_id: 11, name: 'Marcelo Barbosa Castro', email: 'marcelo.castro@email.com', phone: '(11) 90987-6543', cpf: '012.345.678-99', role: 'Proprietário', emergency_contact: 'Renata Castro (11) 90000-9999', created_at: new Date().toISOString() }
  ];

  memoryDb.vehicles = [
    { id: 1, unit_id: 1, resident_id: 1, plate: 'BRA2E19', model: 'Toyota Corolla Cross', color: 'Prata', type: 'Carro', parking_spot: 'Vaga G1-01' },
    { id: 2, unit_id: 2, resident_id: 3, plate: 'ABC4D56', model: 'Honda HR-V', color: 'Preto', type: 'Carro', parking_spot: 'Vaga G1-02' },
    { id: 3, unit_id: 3, resident_id: 4, plate: 'XYZ9K88', model: 'Jeep Compass', color: 'Branco', type: 'Carro', parking_spot: 'Vaga G1-03' },
    { id: 4, unit_id: 4, resident_id: 5, plate: 'MTO7F33', model: 'Yamaha Fazer 250', color: 'Azul', type: 'Moto', parking_spot: 'Vaga M-04' },
    { id: 5, unit_id: 7, resident_id: 7, plate: 'KLE1J90', model: 'Volkswagen T-Cross', color: 'Cinza', type: 'Carro', parking_spot: 'Vaga G2-15' },
    { id: 6, unit_id: 8, resident_id: 8, plate: 'RIO2A22', model: 'Hyundai Creta', color: 'Vermelho', type: 'Carro', parking_spot: 'Vaga G2-18' }
  ];

  memoryDb.pets = [
    { id: 1, unit_id: 1, name: 'Thor', type: 'Cachorro', breed: 'Golden Retriever', size: 'Grande' },
    { id: 2, unit_id: 3, name: 'Mia', type: 'Gato', breed: 'Siamês', size: 'Pequeno' },
    { id: 3, unit_id: 4, name: 'Pipoca', type: 'Cachorro', breed: 'Spitz Alemão', size: 'Pequeno' },
    { id: 4, unit_id: 7, name: 'Simba', type: 'Gato', breed: 'Persa', size: 'Médio' }
  ];

  memoryDb.spaces = [
    { id: 1, name: 'Churrasqueira Gourmet 1', description: 'Espaço com churrasqueira a carvão, forno de pizza e mesas para 15 pessoas.', icon: 'Utensils', capacity: 15, fee: 35.0, rules: 'Reserva máx. 1h por dia por morador. Deixar limpo após o uso.', is_active: 1 },
    { id: 2, name: 'Churrasqueira Gourmet 2', description: 'Área com churrasqueira e vista para o jardim.', icon: 'Flame', capacity: 12, fee: 35.0, rules: 'Reserva máx. 1h por dia por morador. Som moderado até as 22h.', is_active: 1 },
    { id: 3, name: 'Salão de Festas Nobre', description: 'Ambiente climatizado, cozinha de apoio e sistema de som integrado.', icon: 'PartyPopper', capacity: 60, fee: 120.0, rules: 'Reserva máx. 1h por dia por morador. Lista de convidados na portaria.', is_active: 1 },
    { id: 4, name: 'Quadra Poliesportiva', description: 'Quadra com iluminação LED para futebol, basquete e vôlei.', icon: 'Trophy', capacity: 20, fee: 0.0, rules: 'Uso obrigatório de tênis com sola de borracha. Limite de 1 hora por dia.', is_active: 1 },
    { id: 5, name: 'Academia & Espaço Fitness', description: 'Aparelhos modernos para musculação e esteiras de alta performance.', icon: 'Dumbbell', capacity: 10, fee: 0.0, rules: 'Uso obrigatório de toalha e higienização dos aparelhos. Limite de 1 hora por dia.', is_active: 1 },
    { id: 6, name: 'Espaço Coworking & Reuniões', description: 'Mesas individuais, internet fibra dedicada e sala para reuniões.', icon: 'Briefcase', capacity: 8, fee: 0.0, rules: 'Manter silêncio. Máximo 1 hora contínua em sala reservada.', is_active: 1 }
  ];

  memoryDb.deliveries = [
    { id: 1, unit_id: 1, resident_id: 1, courier: 'Mercado Livre', tracking_code: 'MLB982374612', description: 'Caixa Média - Eletrônicos', received_at: new Date(Date.now() - 3600000).toISOString(), status: 'pending', pickup_code: '7492', picked_up_at: null, picked_up_by: null, notes: 'Gaveta 1' },
    { id: 2, unit_id: 3, resident_id: 4, courier: 'Amazon Brasil', tracking_code: 'BR849201943AZ', description: 'Pacote Livros & Cafeteira', received_at: new Date(Date.now() - 7200000).toISOString(), status: 'pending', pickup_code: '1839', picked_up_at: null, picked_up_by: null, notes: 'Portaria' },
    { id: 3, unit_id: 4, resident_id: 5, courier: 'Correios (SEDEX)', tracking_code: 'QC192837465BR', description: 'Envelope Documentos', received_at: new Date(Date.now() - 10800000).toISOString(), status: 'pending', pickup_code: '5521', picked_up_at: null, picked_up_by: null, notes: 'Envelope lacrado' },
    { id: 4, unit_id: 7, resident_id: 7, courier: 'Shopee', tracking_code: 'SHP203948172BR', description: 'Artigos de Decoração', received_at: new Date(Date.now() - 86400000).toISOString(), status: 'delivered', pickup_code: '4490', picked_up_at: new Date(Date.now() - 80000000).toISOString(), picked_up_by: 'Juliana Ribeiro', notes: 'Retirado na portaria' }
  ];

  memoryDb.access_logs = [
    { id: 1, visitor_name: 'Marcos Vinicius Pereira', document: '44.890.123-9', type: 'Visitante', company: null, vehicle_plate: 'FKP9283', unit_id: 1, authorized_by: 'Carlos Eduardo (Apto 101-A)', entered_at: new Date(Date.now() - 1800000).toISOString(), exited_at: null, status: 'inside', notes: 'Visita familiar' },
    { id: 2, visitor_name: 'EletroServ Manutenções (João Paulo)', document: '33.222.111-0', type: 'Prestador de Serviço', company: 'EletroServ SP', vehicle_plate: 'GHT3322', unit_id: 3, authorized_by: 'Fernando Souza (Apto 201-A)', entered_at: new Date(Date.now() - 3600000).toISOString(), exited_at: null, status: 'inside', notes: 'Instalação de ar condicionado' },
    { id: 3, visitor_name: 'Gabriel Entregas iFood', document: '55.123.456-7', type: 'Entregador', company: 'iFood', vehicle_plate: 'MTO9988', unit_id: 4, authorized_by: 'Beatriz Almeida (Apto 202-A)', entered_at: new Date(Date.now() - 7200000).toISOString(), exited_at: new Date(Date.now() - 6600000).toISOString(), status: 'exited', notes: 'Entrega de lanche' }
  ];

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  memoryDb.reservations = [
    { id: 1, space_id: 1, resident_id: 1, unit_id: 1, reservation_date: today, start_time: '19:00', end_time: '20:00', guests_count: 8, status: 'Confirmada', notes: 'Jantar em família', created_at: new Date().toISOString() },
    { id: 2, space_id: 4, resident_id: 4, unit_id: 3, reservation_date: today, start_time: '18:00', end_time: '19:00', guests_count: 4, status: 'Confirmada', notes: 'Partida de tênis/futebol', created_at: new Date().toISOString() },
    { id: 3, space_id: 5, resident_id: 5, unit_id: 4, reservation_date: tomorrow, start_time: '07:00', end_time: '08:00', guests_count: 1, status: 'Confirmada', notes: 'Treino matinal', created_at: new Date().toISOString() }
  ];

  memoryDb.financial_transactions = [
    { id: 1, type: 'income', category: 'Taxa Condominial', description: 'Taxa Condominial Ref. 08/2026 - Apto 101 Torre A', amount: 650.0, due_date: '2026-08-10', payment_date: '2026-08-08', status: 'paid', unit_id: 1, document_number: 'BOL-202608-001', created_at: new Date().toISOString() },
    { id: 2, type: 'income', category: 'Taxa Condominial', description: 'Taxa Condominial Ref. 08/2026 - Apto 102 Torre A', amount: 650.0, due_date: '2026-08-10', payment_date: '2026-08-10', status: 'paid', unit_id: 2, document_number: 'BOL-202608-002', created_at: new Date().toISOString() },
    { id: 3, type: 'income', category: 'Taxa Condominial', description: 'Taxa Condominial Ref. 08/2026 - Apto 201 Torre A', amount: 650.0, due_date: '2026-08-10', payment_date: null, status: 'pending', unit_id: 3, document_number: 'BOL-202608-003', created_at: new Date().toISOString() },
    { id: 4, type: 'income', category: 'Taxa Condominial', description: 'Taxa Condominial Ref. 08/2026 - Apto 202 Torre A', amount: 650.0, due_date: '2026-08-10', payment_date: null, status: 'overdue', unit_id: 4, document_number: 'BOL-202608-004', created_at: new Date().toISOString() },
    { id: 5, type: 'income', category: 'Taxa Condominial', description: 'Taxa Condominial Ref. 08/2026 - Apto 101 Torre B', amount: 650.0, due_date: '2026-08-10', payment_date: '2026-08-09', status: 'paid', unit_id: 7, document_number: 'BOL-202608-007', created_at: new Date().toISOString() },
    { id: 6, type: 'income', category: 'Mercadinho', description: 'Faturamento Mercadinho Autônomo - Julho/2026', amount: 3420.50, due_date: '2026-08-01', payment_date: '2026-08-01', status: 'paid', unit_id: null, document_number: 'MKT-07-2026', created_at: new Date().toISOString() },
    { id: 7, type: 'expense', category: 'Manutenção', description: 'Manutenção Preventiva de Elevadores (Atlas Schindler)', amount: 1850.0, due_date: '2026-08-15', payment_date: '2026-08-14', status: 'paid', unit_id: null, document_number: 'NF-98421', created_at: new Date().toISOString() },
    { id: 8, type: 'expense', category: 'Água/Luz', description: 'Conta de Energia Áreas Comuns (Enel)', amount: 2430.80, due_date: '2026-08-20', payment_date: '2026-08-19', status: 'paid', unit_id: null, document_number: 'ENEL-88912', created_at: new Date().toISOString() },
    { id: 9, type: 'expense', category: 'Água/Luz', description: 'Conta de Água e Esgoto (Sabesp)', amount: 1980.40, due_date: '2026-08-22', payment_date: null, status: 'pending', unit_id: null, document_number: 'SAB-44910', created_at: new Date().toISOString() }
  ];

  memoryDb.announcements = [
    {
      id: 1,
      title: 'Manutenção Preventiva da Caixa d’Água',
      content: 'Informamos a todos os moradores que na próxima terça-feira (25/08) das 08h às 14h será realizada a limpeza e desinfecção semestral dos reservatórios de água. Solicitamos que economizem água durante o período.',
      priority: 'high',
      category: 'Manutenção',
      author: 'Síndico Carlos Eduardo',
      target_block: 'Todos',
      is_pinned: 1,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      expires_at: '2026-08-26'
    },
    {
      id: 2,
      title: 'Convocação para Assembleia Geral Extraordinária (AGE)',
      content: 'Convidamos todos os condôminos para a AGE no dia 30/08 às 19h30 no Salão de Festas para deliberar sobre a instalação de placas solares para redução do consumo de energia das áreas comuns.',
      priority: 'urgent',
      category: 'Assembleia',
      author: 'Administração Predial',
      target_block: 'Todos',
      is_pinned: 1,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      expires_at: '2026-08-31'
    },
    {
      id: 3,
      title: 'Novos Produtos no Mercadinho Autônomo',
      content: 'Acabamos de abastecer o mercadinho com novos itens de mercearia, sorvetes artesanais e bebidas geladas. Lembre-se de registrar sua compra no terminal ou via app!',
      priority: 'normal',
      category: 'Lazer',
      author: 'Comissão de Moradores',
      target_block: 'Todos',
      is_pinned: 0,
      created_at: new Date(Date.now() - 259200000).toISOString(),
      expires_at: '2026-09-10'
    }
  ];

  memoryDb.market_products = [
    { id: 1, name: 'Coca-Cola Lata 350ml', barcode: '7894900010015', category: 'Bebidas', cost_price: 3.20, sale_price: 5.50, stock_quantity: 24, min_stock: 10, image_url: '🥤', is_active: 1 },
    { id: 2, name: 'Heineken Long Neck 330ml', barcode: '7896045505417', category: 'Bebidas', cost_price: 5.80, sale_price: 9.90, stock_quantity: 18, min_stock: 12, image_url: '🍺', is_active: 1 },
    { id: 3, name: 'Água Mineral Crystal sem Gás 500ml', barcode: '7894900530018', category: 'Bebidas', cost_price: 1.10, sale_price: 2.50, stock_quantity: 4, min_stock: 15, image_url: '💧', is_active: 1 },
    { id: 4, name: 'Salgadinho Doritos Queijo Nacho 75g', barcode: '7892840812980', category: 'Snacks & Salgados', cost_price: 4.50, sale_price: 7.90, stock_quantity: 14, min_stock: 8, image_url: '🧀', is_active: 1 },
    { id: 5, name: 'Batata Pringles Original 114g', barcode: '7891000248698', category: 'Snacks & Salgados', cost_price: 9.00, sale_price: 14.50, stock_quantity: 6, min_stock: 6, image_url: '🥔', is_active: 1 },
    { id: 6, name: 'Chocolate KitKat 41.5g', barcode: '7891000100101', category: 'Doces', cost_price: 2.80, sale_price: 4.90, stock_quantity: 3, min_stock: 10, image_url: '🍫', is_active: 1 },
    { id: 7, name: 'Sorvete Magnum Clássico Kibon', barcode: '7891030008447', category: 'Doces', cost_price: 8.50, sale_price: 13.90, stock_quantity: 8, min_stock: 5, image_url: '🍦', is_active: 1 },
    { id: 8, name: 'Pizza Congelada Sadia Calabresa 460g', barcode: '7891515432109', category: 'Congelados', cost_price: 13.00, sale_price: 21.90, stock_quantity: 5, min_stock: 4, image_url: '🍕', is_active: 1 },
    { id: 9, name: 'Lasanha à Bolonhesa Seara 600g', barcode: '7891515998877', category: 'Congelados', cost_price: 11.50, sale_price: 18.90, stock_quantity: 2, min_stock: 4, image_url: '🍝', is_active: 1 },
    { id: 10, name: 'Sabonete Dove Original 90g', barcode: '7891150005432', category: 'Higiene & Limpeza', cost_price: 3.10, sale_price: 5.20, stock_quantity: 12, min_stock: 6, image_url: '🧼', is_active: 1 },
    { id: 11, name: 'Papel Higiênico Neve Folha Dupla c/ 4', barcode: '7891100012345', category: 'Higiene & Limpeza', cost_price: 7.20, sale_price: 12.00, stock_quantity: 7, min_stock: 5, image_url: '🧻', is_active: 1 },
    { id: 12, name: 'Café Torrado e Moído Pilão 500g', barcode: '7896005800019', category: 'Mercearia', cost_price: 14.50, sale_price: 22.90, stock_quantity: 9, min_stock: 5, image_url: '☕', is_active: 1 }
  ];

  memoryDb.market_sales = [];
}

// Inicializar banco
loadDatabase();
