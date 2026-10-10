import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const featuresPath = path.join(__dirname, 'features.json');

/**
 * Padrão de Projeto: SINGLETON (2/2)
 * Classe AppConfigSingleton gerencia as configurações globais e Feature Flags da LPS.
 */
class AppConfigSingleton {
  constructor() {
    if (AppConfigSingleton.instance) {
      return AppConfigSingleton.instance;
    }

    this.features = {
      ENABLE_MARKETPLACE: true,
      ENABLE_ADVANCED_DELIVERIES: true
    };
    this.loadFeatures();

    AppConfigSingleton.instance = this;
  }

  loadFeatures() {
    try {
      if (fs.existsSync(featuresPath)) {
        const data = fs.readFileSync(featuresPath, 'utf-8');
        this.features = JSON.parse(data);
        console.log('⚙️ Configurações LPS de Feature Flags carregadas:', this.features);
      }
    } catch (err) {
      console.error('Erro ao carregar features.json:', err);
    }
  }

  isFeatureEnabled(featureName) {
    return !!this.features[featureName];
  }

  getFeatures() {
    return { ...this.features };
  }

  updateFeature(featureName, enabled) {
    this.features[featureName] = enabled;
    try {
      fs.writeFileSync(featuresPath, JSON.stringify(this.features, null, 2), 'utf-8');
    } catch (err) {
      console.error('Erro ao salvar features.json:', err);
    }
  }
}

const instance = new AppConfigSingleton();
Object.freeze(instance);

export default instance;
