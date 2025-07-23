// Config Validator - Validates prerequisites and system requirements
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { Logger } from './Logger.js';

export class ConfigValidator {
  constructor() {
    this.logger = Logger.getInstance();
  }

  async validatePrerequisites() {
    this.logger.info('🔍 Validating prerequisites...');
    
    const results = {
      passed: [],
      failed: [],
      warnings: []
    };

    // Check Node.js
    await this.checkNodeJs(results);
    
    // Check npm
    await this.checkNpm(results);
    
    // Check yarn
    await this.checkYarn(results);
    
    // Check Git
    await this.checkGit(results);
    
    // Check system requirements
    await this.checkSystemRequirements(results);
    
    // Report results
    this.reportPrerequisites(results);
    
    if (results.failed.length > 0) {
      throw new Error(`Prerequisites validation failed: ${results.failed.length} critical issues found`);
    }
    
    this.logger.info('✅ Prerequisites validation completed');
    return results;
  }

  async checkNodeJs(results) {
    try {
      const version = execSync('node --version', { encoding: 'utf8' }).trim();
      const versionNumber = version.replace('v', '');
      const [major, minor] = versionNumber.split('.').map(Number);
      
      if (major >= 20) {
        results.passed.push(`Node.js ${version} (✓ Compatible)`);
        this.logger.info(`✅ Node.js version: ${version}`);
      } else if (major >= 18) {
        results.warnings.push(`Node.js ${version} (Minimum supported, recommend v20+)`);
        this.logger.warn(`⚠️ Node.js version ${version} is minimum supported, recommend v20+`);
      } else {
        results.failed.push(`Node.js ${version} (❌ Requires v18+ or v20+)`);
        this.logger.error(`❌ Node.js version ${version} is not supported`);
      }
    } catch (error) {
      results.failed.push('Node.js not found or not accessible');
      this.logger.error('❌ Node.js not found');
    }
  }

  async checkNpm(results) {
    try {
      const version = execSync('npm --version', { encoding: 'utf8' }).trim();
      const [major] = version.split('.').map(Number);
      
      if (major >= 10) {
        results.passed.push(`npm ${version} (✓ Compatible)`);
        this.logger.info(`✅ npm version: ${version}`);
      } else if (major >= 8) {
        results.warnings.push(`npm ${version} (Works but recommend v10+)`);
        this.logger.warn(`⚠️ npm version ${version}, recommend v10+`);
      } else {
        results.failed.push(`npm ${version} (❌ Requires v8+)`);
        this.logger.error(`❌ npm version ${version} is not supported`);
      }
    } catch (error) {
      results.failed.push('npm not found or not accessible');
      this.logger.error('❌ npm not found');
    }
  }

  async checkYarn(results) {
    try {
      const version = execSync('yarn --version', { encoding: 'utf8' }).trim();
      
      // Check if it's Yarn 1.x or 4.x
      const [major] = version.split('.').map(Number);
      
      if (major >= 4 || (major === 1 && version.startsWith('1.22'))) {
        results.passed.push(`Yarn ${version} (✓ Compatible)`);
        this.logger.info(`✅ Yarn version: ${version}`);
      } else {
        results.warnings.push(`Yarn ${version} (May work but recommend 1.22.x or 4.x)`);
        this.logger.warn(`⚠️ Yarn version ${version}, recommend 1.22.x or 4.x`);
      }
    } catch (error) {
      results.warnings.push('Yarn not found - will attempt to install during migration');
      this.logger.warn('⚠️ Yarn not found - will install if needed');
    }
  }

  async checkGit(results) {
    try {
      const version = execSync('git --version', { encoding: 'utf8' }).trim();
      results.passed.push(`Git ${version.replace('git version ', '')} (✓ Available)`);
      this.logger.info(`✅ Git: ${version}`);
    } catch (error) {
      results.warnings.push('Git not found - recommended for version control');
      this.logger.warn('⚠️ Git not found');
    }
  }

  async checkSystemRequirements(results) {
    // Check available memory
    const totalMem = os.totalmem();
    const totalMemGB = Math.round(totalMem / (1024 * 1024 * 1024));
    
    if (totalMemGB >= 8) {
      results.passed.push(`System Memory: ${totalMemGB}GB (✓ Sufficient)`);
    } else if (totalMemGB >= 4) {
      results.warnings.push(`System Memory: ${totalMemGB}GB (Minimum, recommend 8GB+)`);
    } else {
      results.failed.push(`System Memory: ${totalMemGB}GB (❌ Insufficient, need 4GB+)`);
    }
    
    // Check free disk space in current directory
    try {
      const stats = await fs.stat(process.cwd());
      results.passed.push('File system access (✓ Working)');
    } catch (error) {
      results.failed.push('File system access (❌ Permission issues)');
    }
    
    // Check platform
    const platform = process.platform;
    if (['win32', 'darwin', 'linux'].includes(platform)) {
      results.passed.push(`Platform: ${platform} (✓ Supported)`);
    } else {
      results.warnings.push(`Platform: ${platform} (⚠️ Untested)`);
    }
  }

  async validateSourcePaths(sourcePath) {
    this.logger.info('🔍 Validating source paths...');
    
    const requiredPaths = [
      {
        path: 'FlowSourceInstaller/FlowsourceSetupDoc/Readme.md',
        description: 'Main setup documentation'
      },
      {
        path: 'FlowSourceInstaller/FlowsourceSetupDoc/UI-Changes.md',
        description: 'UI customization guide'
      },
      {
        path: 'configuration',
        description: 'Configuration files directory'
      },
      {
        path: 'configuration/app-config.yaml',
        description: 'Application configuration'
      },
      {
        path: 'configuration/package.json',
        description: 'Root package configuration'
      },
      {
        path: 'packages-core',
        description: 'Core packages directory'
      },
      {
        path: 'packages-core/app',
        description: 'Frontend application'
      },
      {
        path: 'packages-core/backend',
        description: 'Backend application'
      }
    ];

    const results = {
      passed: [],
      failed: [],
      warnings: []
    };

    for (const item of requiredPaths) {
      const fullPath = path.join(sourcePath, item.path);
      
      try {
        const exists = await fs.pathExists(fullPath);
        if (exists) {
          results.passed.push(`${item.description}: ${item.path}`);
        } else {
          results.failed.push(`Missing: ${item.description} (${item.path})`);
        }
      } catch (error) {
        results.failed.push(`Access error: ${item.description} (${error.message})`);
      }
    }

    // Report source validation results
    this.logger.info(`📊 Source validation: ${results.passed.length} found, ${results.failed.length} missing`);
    
    if (results.failed.length > 0) {
      this.logger.error('❌ Missing required source files:');
      results.failed.forEach(failure => this.logger.error(`  - ${failure}`));
      throw new Error(`Source validation failed: ${results.failed.length} required files missing`);
    }

    this.logger.info('✅ Source path validation completed');
    return results;
  }

  async validateDestinationPath(destinationPath) {
    this.logger.info('🔍 Validating destination path...');
    
    const parentDir = path.dirname(destinationPath);
    
    // Check if parent directory exists and is writable
    try {
      const parentExists = await fs.pathExists(parentDir);
      if (!parentExists) {
        throw new Error(`Parent directory does not exist: ${parentDir}`);
      }
      
      // Check if destination already exists
      const destExists = await fs.pathExists(destinationPath);
      if (destExists) {
        const stat = await fs.stat(destinationPath);
        if (stat.isDirectory()) {
          const contents = await fs.readdir(destinationPath);
          if (contents.length > 0) {
            throw new Error(`Destination directory is not empty: ${destinationPath}`);
          }
        } else {
          throw new Error(`Destination path exists but is not a directory: ${destinationPath}`);
        }
      }
      
      // Test write permissions by creating a temporary file
      const testFile = path.join(parentDir, '.flowsource-test-write');
      await fs.writeFile(testFile, 'test');
      await fs.remove(testFile);
      
      this.logger.info('✅ Destination path validation completed');
      return true;
      
    } catch (error) {
      this.logger.error(`❌ Destination validation failed: ${error.message}`);
      throw error;
    }
  }

  reportPrerequisites(results) {
    console.log('\n📋 Prerequisites Check Results:');
    
    if (results.passed.length > 0) {
      console.log('\n✅ Passed:');
      results.passed.forEach(item => console.log(`  - ${item}`));
    }
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      results.warnings.forEach(item => console.log(`  - ${item}`));
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed:');
      results.failed.forEach(item => console.log(`  - ${item}`));
    }
  }

  async installMissingPrerequisites() {
    this.logger.info('🔧 Attempting to install missing prerequisites...');
    
    try {
      // Try to install Yarn if missing
      try {
        execSync('yarn --version', { stdio: 'pipe' });
      } catch {
        this.logger.info('📦 Installing Yarn...');
        execSync('npm install -g yarn', { stdio: 'pipe' });
        this.logger.info('✅ Yarn installed successfully');
      }
      
    } catch (error) {
      this.logger.warn(`⚠️ Could not install some prerequisites: ${error.message}`);
    }
  }
}
