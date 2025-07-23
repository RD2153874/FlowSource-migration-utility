import yaml from 'js-yaml';
import fs from 'fs-extra';

/**
 * Utility class for merging YAML configurations without duplication
 */
export default class YamlConfigMerger {
  constructor(logger) {
    this.logger = logger;
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
          // Special handling for GitHub integrations - avoid duplicates
          const existingHosts = result[key].map(item => item.host);
          const newIntegrations = source[key].filter(item => !existingHosts.includes(item.host));
          result[key] = [...result[key], ...newIntegrations];
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
}
