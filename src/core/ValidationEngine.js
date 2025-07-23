// Validation Engine - Validates migration success and configuration integrity
import path from 'path';
import fs from 'fs-extra';
import { Logger } from '../utils/Logger.js';

export class ValidationEngine {
  constructor() {
    this.logger = Logger.getInstance();
    this.validationResults = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  async validateMigration(config) {
    this.logger.info('🔍 Validating migration integrity...');
    
    // Validate file structure
    await this.validateFileStructure(config);
    
    // Validate package.json files
    await this.validatePackageConfigurations(config);
    
    // Validate theme integration
    await this.validateThemeIntegration(config);
    
    // Validate App.tsx structure
    await this.validateAppTsxStructure(config);
    
    // Validate assets
    await this.validateAssets(config);
    
    // Report validation results
    this.reportValidationResults();
    
    if (this.validationResults.failed.length > 0) {
      throw new Error(`Validation failed: ${this.validationResults.failed.length} issues found`);
    }
    
    this.logger.info('✅ Migration validation completed successfully');
  }

  async validateFileStructure(config) {
    const requiredFiles = [
      'package.json',
      'app-config.yaml',
      'Dockerfile',
      '.dockerignore',
      '.gitignore',
      'packages/app/package.json',
      'packages/backend/package.json',
      'packages/app/src/App.tsx',
      'packages/app/src/components/Root/Root.tsx',
      'packages/app/src/components/theme/FlowsourceTheme.js'
    ];

    // Files that should NOT exist in Phase 1
    const excludedFiles = [
      'packages/backend/Dockerfile' // Should be removed as per requirements
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(config.destinationPath, file);
      if (await fs.pathExists(filePath)) {
        this.validationResults.passed.push(`File exists: ${file}`);
      } else {
        this.validationResults.failed.push(`Missing file: ${file}`);
      }
    }
    
    // Validate that certain files are properly removed
    for (const file of excludedFiles) {
      const filePath = path.join(config.destinationPath, file);
      if (await fs.pathExists(filePath)) {
        this.validationResults.failed.push(`File should be removed: ${file}`);
      } else {
        this.validationResults.passed.push(`File correctly removed: ${file}`);
      }
    }
  }

  async validatePackageConfigurations(config) {
    // Validate root package.json
    await this.validateRootPackageJson(config);
    
    // Validate app package.json
    await this.validateAppPackageJson(config);
    
    // Validate backend package.json
    await this.validateBackendPackageJson(config);
  }

  async validateRootPackageJson(config) {
    const packagePath = path.join(config.destinationPath, 'package.json');
    
    try {
      const packageJson = await fs.readJson(packagePath);
      
      // Check for required fields
      const requiredFields = ['name', 'version', 'workspaces'];
      for (const field of requiredFields) {
        if (packageJson[field]) {
          this.validationResults.passed.push(`Root package.json has ${field}`);
        } else {
          this.validationResults.failed.push(`Root package.json missing ${field}`);
        }
      }
      
      // Check for FlowSource-specific dependencies
      if (packageJson.devDependencies && packageJson.devDependencies['@backstage/cli']) {
        this.validationResults.passed.push('Backstage CLI dependency found');
      } else {
        this.validationResults.warnings.push('Backstage CLI dependency not found in root package.json');
      }
      
    } catch (error) {
      this.validationResults.failed.push(`Invalid root package.json: ${error.message}`);
    }
  }

  async validateAppPackageJson(config) {
    const packagePath = path.join(config.destinationPath, 'packages', 'app', 'package.json');
    
    try {
      const packageJson = await fs.readJson(packagePath);
      
      // Check for Backstage frontend role
      if (packageJson.backstage && packageJson.backstage.role === 'frontend') {
        this.validationResults.passed.push('App package has correct Backstage role');
      } else {
        this.validationResults.failed.push('App package missing or incorrect Backstage role');
      }
      
      // Check for essential dependencies
      const requiredDeps = [
        '@backstage/core-app-api',
        '@backstage/core-components',
        '@backstage/theme'
      ];
      
      for (const dep of requiredDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.validationResults.passed.push(`App has dependency: ${dep}`);
        } else {
          this.validationResults.failed.push(`App missing dependency: ${dep}`);
        }
      }
      
    } catch (error) {
      this.validationResults.failed.push(`Invalid app package.json: ${error.message}`);
    }
  }

  async validateBackendPackageJson(config) {
    const packagePath = path.join(config.destinationPath, 'packages', 'backend', 'package.json');
    
    try {
      const packageJson = await fs.readJson(packagePath);
      
      // Check for Backstage backend role
      if (packageJson.backstage && packageJson.backstage.role === 'backend') {
        this.validationResults.passed.push('Backend package has correct Backstage role');
      } else {
        this.validationResults.failed.push('Backend package missing or incorrect Backstage role');
      }
      
      // For Phase 1, only check for essential backend dependencies that should exist
      const essentialDeps = [
        '@backstage/backend-defaults'
      ];
      
      for (const dep of essentialDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.validationResults.passed.push(`Backend has dependency: ${dep}`);
        } else {
          this.validationResults.warnings.push(`Backend missing optional dependency: ${dep}`);
        }
      }
      
      // Check if backend has any dependencies at all
      if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
        this.validationResults.passed.push('Backend package has dependencies');
      } else {
        this.validationResults.warnings.push('Backend package has no dependencies');
      }
      
    } catch (error) {
      this.validationResults.failed.push(`Invalid backend package.json: ${error.message}`);
    }
  }

  async validateThemeIntegration(config) {
    // Check if FlowSource theme file exists
    const themePath = path.join(config.destinationPath, 'packages', 'app', 'src', 'components', 'theme', 'FlowsourceTheme.js');
    
    if (await fs.pathExists(themePath)) {
      this.validationResults.passed.push('FlowSource theme file exists');
      
      // Check if App.tsx imports the theme
      const appPath = path.join(config.destinationPath, 'packages', 'app', 'src', 'App.tsx');
      if (await fs.pathExists(appPath)) {
        const appContent = await fs.readFile(appPath, 'utf8');
        
        if (appContent.includes('FlowsourceTheme')) {
          this.validationResults.passed.push('App.tsx imports FlowSource theme');
        } else {
          this.validationResults.warnings.push('App.tsx does not import FlowSource theme');
        }
        
        if (appContent.includes('flowsource-theme')) {
          this.validationResults.passed.push('App.tsx configures FlowSource theme');
        } else {
          this.validationResults.warnings.push('App.tsx does not configure FlowSource theme');
        }
      }
    } else {
      this.validationResults.failed.push('FlowSource theme file missing');
    }
  }

  async validateAssets(config) {
    const requiredAssets = [
      'packages/app/public/favicon.ico',
      'packages/app/public/cognizant-logo-flowsource.svg',
      'packages/app/public/catalog-banner.png',
      'packages/app/src/assets',
      'packages/app/src/components/Root/LogoFull.tsx',
      'packages/app/src/components/Root/LogoIcon.tsx'
    ];

    for (const asset of requiredAssets) {
      const assetPath = path.join(config.destinationPath, asset);
      if (await fs.pathExists(assetPath)) {
        this.validationResults.passed.push(`Asset exists: ${asset}`);
      } else {
        this.validationResults.warnings.push(`Asset missing: ${asset}`);
      }
    }
  }

  async validateAppTsxStructure(config) {
    const appPath = path.join(config.destinationPath, 'packages', 'app', 'src', 'App.tsx');
    
    if (await fs.pathExists(appPath)) {
      const appContent = await fs.readFile(appPath, 'utf8');
      
      // Check for required FlowSource imports
      const requiredImports = [
        'FlowsourceTheme',
        'UnifiedThemeProvider',
        'Mermaid'
      ];
      
      for (const importName of requiredImports) {
        if (appContent.includes(importName)) {
          this.validationResults.passed.push(`App.tsx imports ${importName}`);
        } else {
          this.validationResults.warnings.push(`App.tsx missing import: ${importName}`);
        }
      }
      
      // Check for theme configuration
      if (appContent.includes('flowsource-theme')) {
        this.validationResults.passed.push('App.tsx configures FlowSource theme ID');
      } else {
        this.validationResults.failed.push('App.tsx missing FlowSource theme configuration');
      }
      
      // Check for proper bindRoutes structure
      if (appContent.includes('bindRoutes({ bind })')) {
        this.validationResults.passed.push('App.tsx has proper bindRoutes structure');
      } else {
        this.validationResults.warnings.push('App.tsx bindRoutes structure may need verification');
      }
      
      // Check for SignInPage configuration
      if (appContent.includes('SignInPage') && appContent.includes("providers={['guest']}")) {
        this.validationResults.passed.push('App.tsx configures guest authentication');
      } else {
        this.validationResults.warnings.push('App.tsx guest authentication configuration missing');
      }
      
      // Check for FlowsourceHome in catalog route
      if (appContent.includes('<FlowsourceHome />') && appContent.includes('path="/catalog"')) {
        this.validationResults.passed.push('App.tsx includes FlowsourceHome in catalog route');
      } else {
        this.validationResults.warnings.push('App.tsx FlowsourceHome not properly configured in catalog route');
      }
      
      // Check for Mermaid in TechDocsAddons
      if (appContent.includes('<Mermaid') && appContent.includes('TechDocsAddons')) {
        this.validationResults.passed.push('App.tsx includes Mermaid in TechDocsAddons');
      } else {
        this.validationResults.warnings.push('App.tsx Mermaid not configured in TechDocsAddons');
      }
      
    } else {
      this.validationResults.failed.push('App.tsx file missing');
    }
  }

  reportValidationResults() {
    this.logger.info('\n📊 Validation Results:');
    this.logger.info(`✅ Passed: ${this.validationResults.passed.length}`);
    this.logger.info(`❌ Failed: ${this.validationResults.failed.length}`);
    this.logger.info(`⚠️ Warnings: ${this.validationResults.warnings.length}`);
    
    if (this.validationResults.failed.length > 0) {
      this.logger.error('\n❌ Failed Validations:');
      this.validationResults.failed.forEach((failure, index) => {
        this.logger.error(`${index + 1}. ${failure}`);
      });
    }
    
    if (this.validationResults.warnings.length > 0) {
      this.logger.warn('\n⚠️ Warnings:');
      this.validationResults.warnings.forEach((warning, index) => {
        this.logger.warn(`${index + 1}. ${warning}`);
      });
    }
  }
}
