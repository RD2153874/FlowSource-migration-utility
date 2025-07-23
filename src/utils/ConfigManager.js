// Config Manager - Handles configuration merging and validation
import fs from 'fs-extra';
import yaml from 'yaml';
import path from 'path';
import { Logger } from './Logger.js';

export class ConfigManager {
  constructor() {
    this.logger = Logger.getInstance();
  }

  async mergeConfig(sourcePath, destinationPath) {
    try {
      this.logger.debug(`🔄 Merging config: ${sourcePath} → ${destinationPath}`);
      
      const sourceExists = await fs.pathExists(sourcePath);
      const destExists = await fs.pathExists(destinationPath);
      
      if (!sourceExists) {
        this.logger.warn(`Source config not found: ${sourcePath}`);
        return;
      }
      
      const fileExt = path.extname(sourcePath).toLowerCase();
      
      if (fileExt === '.yaml' || fileExt === '.yml') {
        await this.mergeYamlConfig(sourcePath, destinationPath);
      } else if (fileExt === '.json') {
        await this.mergeJsonConfig(sourcePath, destinationPath);
      } else {
        // For other files, just copy
        await fs.copy(sourcePath, destinationPath, { overwrite: true });
        this.logger.info(`📄 Copied config file: ${path.basename(destinationPath)}`);
      }
      
    } catch (error) {
      this.logger.error(`Failed to merge config ${sourcePath}: ${error.message}`);
      throw error;
    }
  }

  async mergeYamlConfig(sourcePath, destinationPath) {
    try {
      const sourceContent = await fs.readFile(sourcePath, 'utf8');
      const sourceConfig = yaml.parse(sourceContent);
      
      let destConfig = {};
      if (await fs.pathExists(destinationPath)) {
        const destContent = await fs.readFile(destinationPath, 'utf8');
        destConfig = yaml.parse(destContent) || {};
      }
      
      // For app-config.yaml, we want to be careful not to override critical Backstage settings
      // Instead, we'll merge FlowSource-specific configurations
      const mergedConfig = this.smartMergeAppConfig(destConfig, sourceConfig);
      
      const mergedYaml = yaml.stringify(mergedConfig, {
        indent: 2,
        lineWidth: 120
      });
      
      await fs.writeFile(destinationPath, mergedYaml, 'utf8');
      this.logger.info(`🔄 Merged YAML config: ${path.basename(destinationPath)}`);
      
    } catch (error) {
      this.logger.error(`Failed to merge YAML config: ${error.message}`);
      throw error;
    }
  }

  async mergeJsonConfig(sourcePath, destinationPath) {
    try {
      const sourceConfig = await fs.readJson(sourcePath);
      
      let destConfig = {};
      if (await fs.pathExists(destinationPath)) {
        destConfig = await fs.readJson(destinationPath);
      }
      
      const mergedConfig = this.deepMerge(destConfig, sourceConfig);
      
      await fs.writeJson(destinationPath, mergedConfig, { spaces: 2 });
      this.logger.info(`🔄 Merged JSON config: ${path.basename(destinationPath)}`);
      
    } catch (error) {
      this.logger.error(`Failed to merge JSON config: ${error.message}`);
      throw error;
    }
  }

  smartMergeAppConfig(destConfig, sourceConfig) {
    // Create a copy of destination config
    const merged = JSON.parse(JSON.stringify(destConfig));
    
    // Preserve critical Backstage settings
    const preserveKeys = [
      'app.title',
      'app.baseUrl',
      'backend.baseUrl',
      'backend.listen',
      'backend.cors',
      'organization.name'
    ];
    
    // Only merge specific FlowSource configurations for Phase 1
    const allowedMergeKeys = [
      'app.title', // Allow title override for FlowSource
      'catalog',
      'scaffolder',
      'techdocs',
      'auth' // Will be used in later phases
    ];
    
    // Merge allowed configurations
    for (const key of allowedMergeKeys) {
      if (this.hasNestedProperty(sourceConfig, key)) {
        this.setNestedProperty(merged, key, this.getNestedProperty(sourceConfig, key));
      }
    }
    
    // Special handling for app title - use FlowSource if provided
    if (sourceConfig.app && sourceConfig.app.title) {
      if (!merged.app) merged.app = {};
      merged.app.title = sourceConfig.app.title;
    }
    
    return merged;
  }

  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (this.isObject(source[key]) && this.isObject(result[key])) {
          result[key] = this.deepMerge(result[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  hasNestedProperty(obj, path) {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return false;
      }
    }
    
    return true;
  }

  getNestedProperty(obj, path) {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }

  async validateConfig(configPath, schema = null) {
    try {
      const exists = await fs.pathExists(configPath);
      if (!exists) {
        return { valid: false, errors: [`Config file not found: ${configPath}`] };
      }
      
      const fileExt = path.extname(configPath).toLowerCase();
      let config;
      
      if (fileExt === '.yaml' || fileExt === '.yml') {
        const content = await fs.readFile(configPath, 'utf8');
        config = yaml.parse(content);
      } else if (fileExt === '.json') {
        config = await fs.readJson(configPath);
      } else {
        return { valid: true, errors: [] }; // Skip validation for non-config files
      }
      
      // Basic structure validation for Backstage configs
      if (path.basename(configPath).startsWith('app-config')) {
        return this.validateBackstageConfig(config);
      }
      
      // Package.json validation
      if (path.basename(configPath) === 'package.json') {
        return this.validatePackageJson(config);
      }
      
      return { valid: true, errors: [] };
      
    } catch (error) {
      return { 
        valid: false, 
        errors: [`Config validation failed: ${error.message}`] 
      };
    }
  }

  validateBackstageConfig(config) {
    const errors = [];
    const requiredFields = ['app', 'backend'];
    
    for (const field of requiredFields) {
      if (!config[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Validate app section
    if (config.app) {
      if (!config.app.title) {
        errors.push('Missing app.title');
      }
      if (!config.app.baseUrl) {
        errors.push('Missing app.baseUrl');
      }
    }
    
    // Validate backend section
    if (config.backend) {
      if (!config.backend.baseUrl) {
        errors.push('Missing backend.baseUrl');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  validatePackageJson(config) {
    const errors = [];
    const requiredFields = ['name', 'version'];
    
    for (const field of requiredFields) {
      if (!config[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Validate Backstage-specific fields
    if (config.backstage) {
      if (!config.backstage.role) {
        errors.push('Missing backstage.role');
      } else if (!['frontend', 'backend', 'common'].includes(config.backstage.role)) {
        errors.push(`Invalid backstage.role: ${config.backstage.role}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async createBackupConfig(configPath) {
    try {
      const backupPath = `${configPath}.backup.${Date.now()}`;
      await fs.copy(configPath, backupPath);
      this.logger.info(`💾 Config backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      this.logger.error(`Failed to create config backup: ${error.message}`);
      throw error;
    }
  }
}
