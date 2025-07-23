// Backstage Generator - Handles Backstage skeleton creation
import { execSync, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { Logger } from '../utils/Logger.js';
import chalk from 'chalk';

export class BackstageGenerator {
  constructor() {
    this.logger = Logger.getInstance();
  }

  async generate(destinationPath, applicationName) {
    this.logger.info('🏗️ Generating Backstage skeleton...');
    
    try {
      // Ensure parent directory exists
      await fs.ensureDir(path.dirname(destinationPath));
      
      // Generate Backstage application
      // Fix for Windows paths - use simple relative path for the CLI
      const relativeDestPath = './backstage-temp';
      const absoluteDestPath = path.resolve(relativeDestPath);
      
      const command = `npx`;
      const args = [
        `@backstage/create-app@0.5.25`,
        `--path`,
        relativeDestPath,
        `--skip-install`
      ];
      
      this.logger.info(`📝 Executing: ${command} ${args.join(' ')}`);
      this.logger.info(`📍 Application name: ${applicationName}`);
      this.logger.info(`📍 Temporary path: ${relativeDestPath} (${absoluteDestPath})`);
      this.logger.info(`📍 Final destination: ${destinationPath}`);
      
      // Execute the command with better handling of stdio
      // Using stdio: ['pipe', 'pipe', 'pipe'] to properly handle stdin, stdout, stderr
      this.logger.info('Attempting to execute Backstage creation command...');
      
      const result = spawnSync(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        input: `${applicationName}\n`,
        encoding: 'utf8',
        timeout: 300000, // 5 minutes timeout
        shell: true,
        windowsHide: true // Prevent command window from showing on Windows
      });
      
      this.logger.info(`Command completed with status: ${result.status !== null ? result.status : 'null'}`);
      
      if (result.error) {
        this.logger.error(`Command execution error type: ${result.error.name}`);
        this.logger.error(`Command execution error message: ${result.error.message}`);
        if (result.error.code) {
          this.logger.error(`Command execution error code: ${result.error.code}`);
        }
        throw new Error(`Command execution error: ${result.error.message}`);
      }
      
      if (result.status !== 0) {
        this.logger.error(`Command stdout (first 1000 chars): ${result.stdout ? result.stdout.substring(0, 1000) : 'No stdout'}`);
        this.logger.error(`Command stderr (first 1000 chars): ${result.stderr ? result.stderr.substring(0, 1000) : 'No stderr'}`);
        throw new Error(`Command failed with exit code ${result.status}: ${result.stderr || 'Unknown error'}`);
      }
      
      this.logger.debug(`Command stdout: ${result.stdout}`);
      
      // Verify the temporary structure was created
      await this.verifySkeletonStructure(absoluteDestPath);
      
      // Now copy from temporary location to final destination
      this.logger.info(`Copying from temporary location ${absoluteDestPath} to ${destinationPath}`);
      await fs.ensureDir(destinationPath);
      await fs.copy(absoluteDestPath, destinationPath);
      
      // Clean up temporary directory - but don't fail if it can't be removed
      try {
        this.logger.info(`Cleaning up temporary directory ${absoluteDestPath}`);
        await fs.remove(absoluteDestPath);
      } catch (error) {
        this.logger.warn(`⚠️ Could not remove temporary directory: ${error.message}`);
        this.logger.warn(`⚠️ This is not a critical error, the migration will continue`);
      }
      
      this.logger.info('✅ Backstage skeleton generated successfully');
      
    } catch (error) {
      this.logger.error(`❌ Failed to generate Backstage skeleton: ${error.message}`);
      throw new Error(`Backstage generation failed: ${error.message}`);
    }
  }

  async verifySkeletonStructure(destinationPath) {
    const requiredPaths = [
      'package.json',
      'packages/app',
      'packages/backend',
      'app-config.yaml'
    ];

    for (const requiredPath of requiredPaths) {
      const fullPath = path.join(destinationPath, requiredPath);
      if (!await fs.pathExists(fullPath)) {
        throw new Error(`Required structure missing: ${requiredPath}`);
      }
    }

    this.logger.info('✅ Backstage skeleton structure verified');
  }

  async checkPrerequisites() {
    try {
      // Check Node.js version
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      this.logger.info(`📋 Node.js version: ${nodeVersion}`);
      
      // Check npm version
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.logger.info(`📋 npm version: ${npmVersion}`);
      
      // Check yarn version
      try {
        const yarnVersion = execSync('yarn --version', { encoding: 'utf8' }).trim();
        this.logger.info(`📋 Yarn version: ${yarnVersion}`);
      } catch {
        this.logger.warn('⚠️ Yarn not found, installing...');
        execSync('npm install -g yarn', { stdio: 'pipe' });
      }
      
      return true;
    } catch (error) {
      this.logger.error(`❌ Prerequisites check failed: ${error.message}`);
      return false;
    }
  }
}
