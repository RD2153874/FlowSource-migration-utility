#!/usr/bin/env node

// Installation and Setup Script for FlowSource Migration Agent
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

async function setup() {
  console.log(chalk.blue.bold('🚀 FlowSource Migration Agent Setup\n'));

  try {
    // Check Node.js version
    console.log(chalk.blue('📋 Checking prerequisites...'));
    
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js: ${nodeVersion}`);
    
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ npm: ${npmVersion}`);

    // Check if yarn is installed
    try {
      const yarnVersion = execSync('yarn --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Yarn: ${yarnVersion}`);
    } catch {
      console.log(chalk.yellow('⚠️  Yarn not found, installing...'));
      execSync('npm install -g yarn', { stdio: 'inherit' });
      console.log('✅ Yarn installed successfully');
    }

    // Install dependencies
    console.log(chalk.blue('\n📦 Installing dependencies...'));
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');

    // Create logs directory
    await fs.ensureDir('logs');
    console.log('✅ Logs directory created');

    // Set up environment file
    const envPath = '.env';
    if (!await fs.pathExists(envPath)) {
      await fs.copy('.env.example', envPath);
      console.log('✅ Environment file created');
    }

    // Make script executable (Unix-like systems)
    if (process.platform !== 'win32') {
      try {
        execSync('chmod +x src/index.js', { stdio: 'pipe' });
        execSync('chmod +x example.js', { stdio: 'pipe' });
        console.log('✅ Scripts made executable');
      } catch {
        // Ignore if chmod fails
      }
    }

    console.log(chalk.green('\n🎉 Setup completed successfully!\n'));
    
    console.log(chalk.blue.bold('🚀 Quick Start:'));
    console.log(`${chalk.gray('1.')} Run the agent: ${chalk.cyan('npm start')}`);
    console.log(`${chalk.gray('2.')} Or try the example: ${chalk.cyan('node example.js')}`);
    console.log(`${chalk.gray('3.')} For help: ${chalk.cyan('npm start -- --help')}`);
    
    console.log(chalk.blue.bold('\n📖 Available Commands:'));
    console.log(`${chalk.cyan('npm start')}           - Interactive migration`);
    console.log(`${chalk.cyan('npm run dev')}         - Development mode`);
    console.log(`${chalk.cyan('npm test')}            - Run tests`);
    console.log(`${chalk.cyan('npm run migrate')}     - CLI migration mode`);
    console.log(`${chalk.cyan('node example.js')}     - Run example migration`);

  } catch (error) {
    console.error(chalk.red(`❌ Setup failed: ${error.message}`));
    process.exit(1);
  }
}

setup();
