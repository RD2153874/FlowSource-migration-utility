import YamlConfigMerger from './src/utils/YamlConfigMerger.js';

// Test the YAML merger functionality
async function testYamlMerger() {
  const logger = {
    info: console.log,
    warn: console.warn,
    error: console.error
  };
  
  const merger = new YamlConfigMerger(logger);
  
  // Test merging GitHub authentication config
  const testConfig = {
    auth: {
      environment: 'development',
      providers: {
        github: {
          development: {
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            githubOrganization: 'TestOrg'
          }
        }
      }
    },
    integrations: {
      github: [
        {
          host: 'github.com',
          token: 'test-token'
        }
      ]
    }
  };
  
  console.log('🧪 Testing YAML merger...');
  
  // Test merging into app-config.yaml
  const appConfigPath = '../flwsrc-gen-v2/app-config.yaml';
  const success = await merger.mergeIntoYamlFile(appConfigPath, testConfig, 'Test GitHub Configuration');
  
  if (success) {
    console.log('✅ YAML merge test successful');
    
    // Validate the result
    const mergedConfig = await merger.loadYamlFile(appConfigPath);
    const validation = merger.validateConfiguration(mergedConfig);
    
    console.log('Validation result:', validation);
  } else {
    console.log('❌ YAML merge test failed');
  }
}

testYamlMerger().catch(console.error);
