import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import DatabaseSingleton from './config/DatabaseSingleton.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonPath = path.join(__dirname, 'condo_store.json');

function runMigration() {
  console.log('🚀 Iniciando processo de migração do JSON para SQLite...');

  if (!fs.existsSync(jsonPath)) {
    console.log('⚠️ Arquivo condo_store.json não encontrado. A migração foi ignorada.');
    return;
  }

  const db = DatabaseSingleton.getDb();
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const jsonData = JSON.parse(rawData);

  // Executa migração em uma transação ACID
  const migrateTx = db.transaction(() => {
    let counts = {};

    // 1. Units
    if (jsonData.units && jsonData.units.length > 0) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO units (id, block, number, floor, type, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const u of jsonData.units) {
        stmt.run(u.id, u.block, u.number, u.floor || null, u.type || 'Residencial', u.created_at || new Date().toISOString());
      }
      counts.units = jsonData.units.length;
    }

    // 2. Residents
    if (jsonData.residents && jsonData.residents.length > 0) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO residents (id, unit_id, name, email, phone, cpf, role, emergency_contact, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of jsonData.residents) {
        stmt.run(r.id, r.unit_id, r.name, r.email || null, r.phone || null, r.cpf || null, r.role || 'Proprietário', r.emergency_contact || null, r.created_at || new Date().toISOString());
      }
      counts.residents = jsonData.residents.length;
    }

    // 3. Vehicles
    if (jsonData.vehicles && jsonData.vehicles.length > 0) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO vehicles (id, unit_id, resident_id, plate, model, color, type, parking_spot)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const v of jsonData.vehicles) {
        stmt.run(v.id, v.unit_id, v.resident_id || null, v.plate, v.model, v.color || '', v.type || 'Carro', v.parking_spot || '');
      }
      counts.vehicles = jsonData.vehicles.length;
    }

    // 4. Pets
    if (jsonData.pets && jsonData.pets.length > 0) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO pets (id, unit_id, resident_id, name, species, breed, size)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of jsonData.pets) {
        stmt.run(p.id, p.unit_id, p.resident_id || null, p.name, p.type || p.species || 'Cachorro', p.breed || '', p.size || '');
      }
      counts.pets = jsonData.pets.length;
    }

    // 5. Deliveries
    if (jsonData.deliveries && jsonData.deliveries.length > 0) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO deliveries (id, unit_id, resident_id, courier, tracking_code, description, status, pickup_code, notes, received_at, picked_up_at, picked_up_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const d of jsonData.deliveries) {
        stmt.run(d.id, d.unit_id, d.resident_id || null, d.courier, d.tracking_code || null, d.description || '', d.status || 'pending', d.pickup_code || '1234', d.notes || '', d.received_at || new Date().toISOString(), d.picked_up_at || null, d.picked_up_by || null);
      }
      counts.deliveries = jsonData.deliveries.length;
    }

    // 6. Access Logs
    if (jsonData.access_logs && jsonData.access_logs.length > 0) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO access_logs (id, visitor_name, document, type, destination_unit_id, entry_time, exit_time, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const a of jsonData.access_logs) {
        stmt.run(
          a.id,
          a.visitor_name,
          a.document,
          a.type || 'Visitante',
          a.destination_unit_id || a.unit_id || 1,
          a.entered_at || a.entry_time || new Date().toISOString(),
          a.exited_at || a.exit_time || null,
          a.status || 'IN_PROPERTY',
          a.notes || ''
        );
      }
      counts.access_logs = jsonData.access_logs.length;
    }

    // 7. Spaces
    if (jsonData.spaces && jsonData.spaces.length > 0) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO spaces (id, name, description, capacity, price_per_hour, rules)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const s of jsonData.spaces) {
        stmt.run(s.id, s.name, s.description || '', s.capacity, s.price_per_hour || s.fee || 0, s.rules || '');
      }
      counts.spaces = jsonData.spaces.length;
    }

    // 8. Reservations
    if (jsonData.reservations && jsonData.reservations.length > 0) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO reservations (id, space_id, unit_id, resident_id, reservation_date, start_time, end_time, total_price, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of jsonData.reservations) {
        stmt.run(r.id, r.space_id, r.unit_id, r.resident_id, r.reservation_date, r.start_time, r.end_time, r.total_price || 0, r.status || 'CONFIRMED', r.created_at || new Date().toISOString());
      }
      counts.reservations = jsonData.reservations.length;
    }

    // 9. Financial Transactions
    if (jsonData.financial_transactions && jsonData.financial_transactions.length > 0) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO financial_transactions (id, unit_id, description, amount, type, category, status, due_date, paid_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const f of jsonData.financial_transactions) {
        stmt.run(f.id, f.unit_id || null, f.description, f.amount, f.type, f.category, f.status || 'PENDING', f.due_date, f.paid_at || f.payment_date || null);
      }
      counts.financial_transactions = jsonData.financial_transactions.length;
    }

    // 10. Announcements
    if (jsonData.announcements && jsonData.announcements.length > 0) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO announcements (id, title, content, category, priority, author, target_block, is_pinned, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const a of jsonData.announcements) {
        stmt.run(
          a.id,
          a.title,
          a.content,
          a.category || 'Geral',
          a.priority || 'normal',
          a.author || a.created_by || 'Síndico Geral',
          a.target_block || 'Todos',
          a.is_pinned ? 1 : 0,
          a.created_at || new Date().toISOString(),
          a.expires_at || null
        );
      }
      counts.announcements = jsonData.announcements.length;
    }

    // 11. Market Products
    if (jsonData.market_products && jsonData.market_products.length > 0) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO market_products (id, name, category, price, stock_quantity, barcode)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const m of jsonData.market_products) {
        stmt.run(m.id, m.name, m.category, m.price || m.sale_price, m.stock_quantity, m.barcode || null);
      }
      counts.market_products = jsonData.market_products.length;
    }

    // 12. Market Sales
    if (jsonData.market_sales && jsonData.market_sales.length > 0) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO market_sales (id, unit_id, resident_id, total_amount, payment_method, created_at, items_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const ms of jsonData.market_sales) {
        const itemsStr = typeof ms.items_json === 'string' ? ms.items_json : JSON.stringify(ms.items || []);
        stmt.run(ms.id, ms.unit_id, ms.resident_id || 1, ms.total_amount, ms.payment_method, ms.created_at || new Date().toISOString(), itemsStr);
      }
      counts.market_sales = jsonData.market_sales.length;
    }

    return counts;
  });

  const res = migrateTx();
  console.log('✅ Migração transacional concluída com sucesso no SQLite!');
  console.log('📊 Resumo de registros migrados:', res);
}

runMigration();
