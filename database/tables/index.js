import { MigrationsTable } from './MigrationsTable.js';
import { CondominiumsTable } from './CondominiumsTable.js';
import { CondominiumModulesTable } from './CondominiumModulesTable.js';
import { CondoSettingsTable } from './CondoSettingsTable.js';
import { BlocksTable } from './BlocksTable.js';
import { UnitsTable } from './UnitsTable.js';
import { ResidentsTable } from './ResidentsTable.js';
import { UsersTable } from './UsersTable.js';
import { VehiclesTable } from './VehiclesTable.js';
import { PetsTable } from './PetsTable.js';
import { DeliveriesTable } from './DeliveriesTable.js';
import { AccessLogsTable } from './AccessLogsTable.js';
import { SpacesTable } from './SpacesTable.js';
import { ReservationsTable } from './ReservationsTable.js';
import { OccurrencesTable } from './OccurrencesTable.js';
import { PollsTable } from './PollsTable.js';
import { PollVotesTable } from './PollVotesTable.js';
import { FinancialTransactionsTable } from './FinancialTransactionsTable.js';
import { AnnouncementsTable } from './AnnouncementsTable.js';
import { MarketProductsTable } from './MarketProductsTable.js';
import { MarketSalesTable } from './MarketSalesTable.js';
import { MarketSaleItemsTable } from './MarketSaleItemsTable.js';
import { AuditLogsTable } from './AuditLogsTable.js';

export {
  MigrationsTable,
  CondominiumsTable,
  CondominiumModulesTable,
  CondoSettingsTable,
  BlocksTable,
  UnitsTable,
  ResidentsTable,
  UsersTable,
  VehiclesTable,
  PetsTable,
  DeliveriesTable,
  AccessLogsTable,
  SpacesTable,
  ReservationsTable,
  OccurrencesTable,
  PollsTable,
  PollVotesTable,
  FinancialTransactionsTable,
  AnnouncementsTable,
  MarketProductsTable,
  MarketSalesTable,
  MarketSaleItemsTable,
  AuditLogsTable
};

/**
 * Lista ordenada de todas as classes de tabelas respeitando estritamente
 * a hierarquia de integridade referencial e chaves estrangeiras
 */
export const ALL_TABLE_CLASSES = [
  MigrationsTable,
  CondominiumsTable,
  CondominiumModulesTable,
  CondoSettingsTable,
  BlocksTable,
  UnitsTable,
  ResidentsTable,
  UsersTable,
  VehiclesTable,
  PetsTable,
  DeliveriesTable,
  AccessLogsTable,
  SpacesTable,
  ReservationsTable,
  OccurrencesTable,
  PollsTable,
  PollVotesTable,
  FinancialTransactionsTable,
  AnnouncementsTable,
  MarketProductsTable,
  MarketSalesTable,
  MarketSaleItemsTable,
  AuditLogsTable
];
