import DatabaseSingleton from './DatabaseSingleton.js';

const DEFAULT_FEATURES = {
  ENABLE_MARKETPLACE: true,
  ENABLE_ADVANCED_DELIVERIES: true
};

/**
 * Padrão de Projeto: SINGLETON (2/2)
 * Classe AppConfigSingleton gerencia as configurações globais e Feature Flags da LPS.
 */
class AppConfigSingleton {
  constructor() {
    if (AppConfigSingleton.instance) {
      return AppConfigSingleton.instance;
    }

    this.db = DatabaseSingleton.getDb();
    this.ensureFeatures();

    AppConfigSingleton.instance = this;
  }

  /**
   * Padrão GoF Singleton: Ponto de acesso global estático canônico.
   */
  static getInstance() {
    if (!AppConfigSingleton.instance) {
      new AppConfigSingleton();
    }
    return AppConfigSingleton.instance;
  }

  ensureFeatures() {
    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO app_features (feature, enabled)
      VALUES (?, ?)
    `);

    for (const [feature, enabled] of Object.entries(DEFAULT_FEATURES)) {
      insert.run(feature, enabled ? 1 : 0);
    }
  }

  isFeatureEnabled(featureName) {
    const row = this.db.prepare('SELECT enabled FROM app_features WHERE feature = ?').get(featureName);
    return !!row?.enabled;
  }

  getFeatures() {
    return Object.fromEntries(
      this.db.prepare('SELECT feature, enabled FROM app_features ORDER BY feature').all()
        .map(({ feature, enabled }) => [feature, Boolean(enabled)])
    );
  }

  updateFeature(featureName, enabled) {
    if (!Object.hasOwn(DEFAULT_FEATURES, featureName)) {
      throw new Error(`Feature desconhecida: ${featureName}`);
    }

    this.db.prepare(`
      UPDATE app_features
      SET enabled = ?, updated_at = CURRENT_TIMESTAMP
      WHERE feature = ?
    `).run(enabled ? 1 : 0, featureName);
  }
}

const instance = new AppConfigSingleton();
Object.freeze(instance);

export const appConfig = instance;
export { AppConfigSingleton };
export default instance;
