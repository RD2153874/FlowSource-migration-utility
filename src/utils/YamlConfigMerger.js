import yaml from 'js-yaml';
import fs from 'fs-extra';
import path from 'path';

/**
 * Utility class for merging YAML configurations without duplication
 */
export default class YamlConfigMerger {
  constructor(logger) {
    this.logger = logger;
    
    // Dual configuration tracking
    this.dualMode = false;
    this.templateBlocks = []; // Configurations with placeholders
    this.valueBlocks = [];    // Configurations with real values
  }

  /**
   * Load and parse a YAML file
   * @param {string} filePath - Path to the YAML file
   * @returns {object} Parsed YAML object
   */
  async loadYamlFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return yaml.load(content) || {};
    } catch (error) {
      this.logger.warn(`Failed to load YAML file ${filePath}:`, error.message);
      return {};
    }
  }

  /**
   * Deep merge two objects, with special handling for arrays and auth providers
   * @param {object} target - Target object to merge into
   * @param {object} source - Source object to merge from
   * @returns {object} Merged object
   */
  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (key === 'providers' && result[key] && typeof result[key] === 'object') {
          // Special handling for auth providers - merge provider objects
          result[key] = { ...result[key], ...source[key] };
        } else if (key === 'github' && Array.isArray(source[key]) && Array.isArray(result[key])) {
          // Special handling for GitHub integrations - replace existing entries for same host
          const resultIntegrations = [...result[key]];
          
          source[key].forEach(sourceIntegration => {
            const existingIndex = resultIntegrations.findIndex(item => item.host === sourceIntegration.host);
            if (existingIndex !== -1) {
              // Replace existing integration for the same host (this allows real tokens to overwrite placeholders)
              resultIntegrations[existingIndex] = sourceIntegration;
            } else {
              // Add new integration for different host
              resultIntegrations.push(sourceIntegration);
            }
          });
          
          result[key] = resultIntegrations;
        } else if (
          typeof source[key] === 'object' && 
          source[key] !== null && 
          !Array.isArray(source[key]) &&
          result[key] && 
          typeof result[key] === 'object' && 
          !Array.isArray(result[key])
        ) {
          // Recursively merge nested objects
          result[key] = this.deepMerge(result[key], source[key]);
        } else if (Array.isArray(source[key]) && Array.isArray(result[key])) {
          // For arrays, merge unique items (special handling for keys array)
          if (key === 'keys') {
            // For backend.auth.keys, merge unique secrets
            const existingSecrets = result[key].map(item => item.secret);
            const newKeys = source[key].filter(item => 
              !existingSecrets.includes(item.secret)
            );
            result[key] = [...result[key], ...newKeys];
          } else if (key === 'locations') {
            // For catalog.locations, merge unique targets
            const existingTargets = result[key].map(item => item.target);
            const newLocations = source[key].filter(item => 
              !existingTargets.includes(item.target)
            );
            result[key] = [...result[key], ...newLocations];
          } else {
            // For other arrays, append unique items
            const combined = [...result[key], ...source[key]];
            result[key] = [...new Set(combined)]; // Remove duplicates for primitive arrays
          }
        } else {
          // Overwrite primitive values or when target doesn't have the key
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * Merge a new configuration into an existing YAML file
   * @param {string} filePath - Path to the target YAML file
   * @param {object} newConfig - New configuration to merge
   * @param {string} comment - Optional comment to add before the merged section
   */
  async mergeIntoYamlFile(filePath, newConfig, comment = null) {
    try {
      // Load existing configuration
      const existingConfig = await this.loadYamlFile(filePath);

      // Merge configurations
      const mergedConfig = this.deepMerge(existingConfig, newConfig);

      // Convert back to YAML
      let yamlContent = yaml.dump(mergedConfig, {
        lineWidth: -1, // Prevent line wrapping
        noRefs: true,  // Prevent references
        sortKeys: false // Preserve key order
      });

      // Add comment if provided
      if (comment) {
        yamlContent = `# ${comment}\n` + yamlContent;
      }

      // Write merged configuration
      await fs.writeFile(filePath, yamlContent, 'utf8');
      this.logger.info(`📄 Successfully merged configuration into ${filePath}`);

      return true;
    } catch (error) {
      this.logger.error(`Failed to merge YAML configuration:`, error.message);
      return false;
    }
  }

  /**
   * Convenient alias for mergeIntoYamlFile
   * @param {string} filePath - Path to the target YAML file
   * @param {object} newConfig - New configuration to merge
   * @param {string} comment - Optional comment to add before the merged section
   */
  async mergeConfig(filePath, newConfig, comment = null) {
    return await this.mergeIntoYamlFile(filePath, newConfig, comment);
  }

  /**
   * Extract YAML configuration from markdown code blocks
   * @param {string} markdownContent - Markdown content containing YAML blocks
   * @returns {object} Parsed YAML configuration
   */
  extractYamlFromMarkdown(markdownContent) {
    const yamlBlocks = [];
    const yamlRegex = /```ya?ml\n([\s\S]*?)\n```/g;
    let match;

    while ((match = yamlRegex.exec(markdownContent)) !== null) {
      try {
        const yamlContent = match[1];
        const parsed = yaml.load(yamlContent);
        if (parsed && typeof parsed === 'object') {
          yamlBlocks.push(parsed);
        }
      } catch (error) {
        this.logger.warn('Failed to parse YAML block:', error.message);
      }
    }

    // Merge all YAML blocks into a single configuration
    let mergedConfig = {};
    for (const block of yamlBlocks) {
      mergedConfig = this.deepMerge(mergedConfig, block);
    }

    return mergedConfig;
  }

  /**
   * Validate that a configuration doesn't have duplicate sections
   * @param {object} config - Configuration to validate
   * @returns {object} Validation result with warnings
   */
  validateConfiguration(config) {
    const warnings = [];
    
    // Check for common duplication issues
    if (config.auth && config.auth.providers) {
      const providerKeys = Object.keys(config.auth.providers);
      const duplicateProviders = providerKeys.filter(
        (key, index) => providerKeys.indexOf(key) !== index
      );
      
      if (duplicateProviders.length > 0) {
        warnings.push(`Duplicate auth providers found: ${duplicateProviders.join(', ')}`);
      }
    }

    if (config.backend && config.backend.auth && config.backend.auth.keys) {
      const secretValues = config.backend.auth.keys.map(k => k.secret);
      const duplicateSecrets = secretValues.filter(
        (secret, index) => secretValues.indexOf(secret) !== index
      );
      
      if (duplicateSecrets.length > 0) {
        warnings.push(`Duplicate backend auth secrets found: ${duplicateSecrets.join(', ')}`);
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Enable dual configuration mode for creating both template and local config files
   */
  enableDualMode() {
    this.dualMode = true;
    this.templateBlocks = [];
    this.valueBlocks = [];
    this.logger.info('📄 Dual configuration mode enabled');
  }

  /**
   * Disable dual configuration mode
   */
  disableDualMode() {
    this.dualMode = false;
    this.templateBlocks = [];
    this.valueBlocks = [];
    this.logger.info('📄 Dual configuration mode disabled');
  }

  /**
   * Get summary of dual configuration status
   * @returns {object} Summary of configuration files and their status
   */
  getDualConfigSummary() {
    return {
      dualModeEnabled: this.dualMode,
      templateBlocksCount: this.templateBlocks ? this.templateBlocks.length : 0,
      valueBlocksCount: this.valueBlocks ? this.valueBlocks.length : 0,
      message: this.dualMode 
        ? `Dual mode enabled with ${this.templateBlocks.length} template blocks and ${this.valueBlocks.length} value blocks`
        : "Dual mode not enabled"
    };
  }

  /**
   * Add configuration block with placeholders (template version)
   * @param {object} configBlock - Configuration block with placeholders
   */
  addTemplateBlock(configBlock) {
    if (this.dualMode && configBlock && typeof configBlock === 'object') {
      this.templateBlocks.push(JSON.parse(JSON.stringify(configBlock))); // Deep clone
      this.logger.debug('📝 Added template configuration block');
    }
  }

  /**
   * Add configuration block with real values (local version)
   * @param {object} configBlock - Configuration block with real values
   */
  addValueBlock(configBlock) {
    if (this.dualMode && configBlock && typeof configBlock === 'object') {
      this.valueBlocks.push(JSON.parse(JSON.stringify(configBlock))); // Deep clone
      this.logger.debug('📝 Added value configuration block');
    }
  }

  /**
   * Build dual configuration files from accumulated blocks
   * Strategy: 
   * - app-config.yaml gets template version (with placeholders)
   * - app-config.local.yaml gets value version (with real values)
   * @param {string} destinationPath - Base path where config files should be created
   */
  async buildDualConfigFiles(destinationPath) {
    if (!this.dualMode) {
      this.logger.warn('⚠️ Dual mode not enabled, skipping dual config creation');
      return { success: false, reason: 'Dual mode not enabled' };
    }

    try {
      const appConfigPath = path.join(destinationPath, 'app-config.yaml');
      const localConfigPath = path.join(destinationPath, 'app-config.local.yaml');

      // Get the current config (which currently has real values from the migration process)
      let currentConfig = {};
      if (await fs.pathExists(appConfigPath)) {
        currentConfig = await this.loadYamlFile(appConfigPath);
      }

      // Build template config (with placeholders) - START CLEAN to avoid real values
      let templateConfig = this.createCleanBaseConfig(); // Start with clean base
      for (const block of this.templateBlocks) {
        templateConfig = this.deepMerge(templateConfig, block);
      }

      // Build local config (with real values) from value blocks  
      let localConfig = currentConfig; // Start with base config
      for (const block of this.valueBlocks) {
        localConfig = this.deepMerge(localConfig, block);
      }

      // Write the template version (with placeholders) to app-config.yaml
      await this.writeYamlFile(appConfigPath, templateConfig, 'Main configuration for deployment - uses environment variables and placeholders');
      
      // Write the local version (with real values) to app-config.local.yaml
      await this.writeYamlFile(localConfigPath, localConfig, 'Local development configuration - contains your actual values (add to .gitignore)');

      this.logger.info('✅ Successfully created dual configuration files');
      this.logger.info(`   📄 app-config.yaml (template with placeholders for deployment)`);
      this.logger.info(`   📄 app-config.local.yaml (your actual values for local development)`);

      return { 
        success: true, 
        templatePath: appConfigPath,
        localPath: localConfigPath 
      };

    } catch (error) {
      this.logger.error(`❌ Failed to build dual configuration files: ${error.message}`);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Write YAML configuration to file with optional comment
   * @param {string} filePath - Path to write the YAML file
   * @param {object} config - Configuration object to write
   * @param {string} comment - Optional comment to add at the top
   */
  async writeYamlFile(filePath, config, comment = null) {
    try {
      // Convert to YAML
      let yamlContent = yaml.dump(config, {
        lineWidth: -1, // Prevent line wrapping
        noRefs: true,  // Prevent references
        sortKeys: false // Preserve key order
      });

      // Add comment if provided
      if (comment) {
        yamlContent = `# ${comment}\n` + yamlContent;
      }

      // Write file
      await fs.writeFile(filePath, yamlContent, 'utf8');
      this.logger.debug(`📄 Successfully wrote YAML file: ${filePath}`);

      return true;
    } catch (error) {
      this.logger.error(`Failed to write YAML file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Validate that dual configuration files have the same structure
   * @param {string} destinationPath - Path containing both config files
   * @returns {object} Validation result
   */
  async validateDualConfigStructure(destinationPath) {
    try {
      const appConfigPath = path.join(destinationPath, 'app-config.yaml');
      const localConfigPath = path.join(destinationPath, 'app-config.local.yaml');

      const templateConfig = await this.loadYamlFile(appConfigPath);
      const localConfig = await this.loadYamlFile(localConfigPath);

      // Extract structure (keys only, not values)
      const templateStructure = this.extractStructure(templateConfig);
      const localStructure = this.extractStructure(localConfig);

      const structureMatch = JSON.stringify(templateStructure) === JSON.stringify(localStructure);

      return {
        isValid: structureMatch,
        templateStructure,
        localStructure,
        message: structureMatch 
          ? 'Configuration structures match perfectly' 
          : 'Configuration structures differ'
      };

    } catch (error) {
      return {
        isValid: false,
        message: `Validation failed: ${error.message}`
      };
    }
  }

  /**
   * Extract the structure (keys) from a configuration object
   * @param {object} obj - Configuration object
   * @returns {object} Structure with same keys but null values
   */
  extractStructure(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.length > 0 ? [this.extractStructure(obj[0])] : [];
    }

    const structure = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        structure[key] = this.extractStructure(obj[key]);
      }
    }
    return structure;
  }

  /**
   * Create a clean base configuration with only non-sensitive defaults
   * This ensures the template config doesn't accidentally include real secrets
   * @returns {object} Clean base configuration
   */
  createCleanBaseConfig() {
    return {
      app: {
        title: 'Scaffolded Backstage App',
        baseUrl: 'http://localhost:3000'
      },
      organization: {
        name: 'My Company'
      },
      backend: {
        baseUrl: 'http://localhost:7007',
        listen: {
          port: 7007
        },
        csp: {
          'connect-src': ["'self'", 'http:', 'https:']
        },
        cors: {
          origin: 'http://localhost:3000',
          methods: ['GET', 'HEAD', 'PATCH', 'POST', 'PUT', 'DELETE'],
          credentials: true
        },
        database: {
          client: 'pg',
          connection: {
            host: '${DB_HOST}',
            port: '${DB_PORT}',
            user: '${DB_USER}',
            password: '${DB_PASSWORD}'
          }
        },
        auth: {
          keys: [
            { secret: '${BACKEND_SECRET}' }
          ]
        }
      },
      proxy: null,
      techdocs: {
        builder: 'local',
        generator: {
          runIn: 'docker'
        },
        publisher: {
          type: 'local'
        }
      },
      auth: {
        environment: 'development',
        providers: {
          guest: {}
        },
        session: {
          secret: '${AUTH_SESSION_SECRET}'
        }
      },
      scaffolder: null,
      catalog: {
        import: {
          entityFilename: 'catalog-info.yaml',
          pullRequestBranchName: 'backstage-integration'
        },
        rules: [
          {
            allow: ['Component', 'System', 'API', 'Resource', 'Location']
          }
        ],
        locations: [
          {
            type: 'file',
            target: '../../examples/entities.yaml'
          },
          {
            type: 'file',
            target: '../../examples/template/template.yaml',
            rules: [{ allow: ['Template'] }]
          },
          {
            type: 'file',
            target: '../../examples/org.yaml',
            rules: [{ allow: ['User', 'Group'] }]
          }
        ],
        useUrlReadersSearch: false
      },
      kubernetes: null,
      permission: {
        enabled: true
      }
    };
  }
}
