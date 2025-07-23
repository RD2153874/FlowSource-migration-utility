import YamlConfigMerger from './src/utils/YamlConfigMerger.js';
import fs from 'fs-extra';
import path from 'path';

// Utility script to clean up and restructure app-config.yaml
async function cleanupAppConfig() {
  const yamlMerger = new YamlConfigMerger(console);
  const appConfigPath = path.join(process.cwd(), '../flwsrc-gen-v2/app-config.yaml');
  
  console.log('🧹 Cleaning up app-config.yaml...');
  
  // Load and parse the current configuration
  const currentConfig = await yamlMerger.loadYamlFile(appConfigPath);
  
  // Clean up GitHub integrations - remove duplicates
  if (currentConfig.integrations && currentConfig.integrations.github) {
    const uniqueIntegrations = [];
    const seenHosts = new Set();
    
    for (const integration of currentConfig.integrations.github) {
      const key = integration.host + (integration.token ? '-token' : '-app');
      if (!seenHosts.has(key)) {
        seenHosts.add(key);
        uniqueIntegrations.push(integration);
      }
    }
    
    currentConfig.integrations.github = uniqueIntegrations;
  }
  
  // Ensure proper structure
  const cleanConfig = {
    app: currentConfig.app,
    organization: currentConfig.organization,
    backend: {
      baseUrl: currentConfig.backend.baseUrl,
      listen: currentConfig.backend.listen,
      csp: currentConfig.backend.csp,
      cors: currentConfig.backend.cors,
      database: currentConfig.backend.database,
      auth: currentConfig.backend.auth
    },
    integrations: currentConfig.integrations,
    proxy: currentConfig.proxy,
    techdocs: currentConfig.techdocs,
    auth: currentConfig.auth,
    scaffolder: currentConfig.scaffolder,
    catalog: currentConfig.catalog,
    kubernetes: currentConfig.kubernetes,
    permission: currentConfig.permission
  };
  
  // Write cleaned configuration
  const success = await yamlMerger.mergeIntoYamlFile(appConfigPath, cleanConfig);
  
  if (success) {
    console.log('✅ app-config.yaml cleaned up successfully');
  } else {
    console.log('❌ Failed to clean up app-config.yaml');
  }
}

cleanupAppConfig().catch(console.error);
