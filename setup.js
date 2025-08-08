#!/usr/bin/env node

// Post-install setup for FlowSource Migration Agent
// This script handles environment setup that npm cannot do automatically
import fs from 'fs';

async function ensureDir(dirPath) {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function pathExists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function setup() {
  console.log('🚀 FlowSource Migration Agent - Environment Setup\n');

  try {
    // Create logs directory if needed
    if (!await pathExists('logs')) {
      await ensureDir('logs');
      console.log('✅ Logs directory created');
    } else {
      console.log('✅ Logs directory already exists');
    }

    // Set up environment file from example
    const envPath = '.env';
    if (!await pathExists(envPath)) {
      await fs.promises.copyFile('.env.example', envPath);
      console.log('✅ Environment file created (.env)');
    } else {
      console.log('✅ Environment file already exists');
    }

    // Make scripts executable on Unix-like systems
    if (process.platform !== 'win32') {
      try {
        const { execSync } = await import('child_process');
        execSync('chmod +x src/index.js', { stdio: 'pipe' });
        console.log('✅ Scripts made executable');
      } catch {
        // Ignore if chmod fails
      }
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n� Quick Start:');
    console.log('  npm start              # Interactive migration');
    console.log('  npm run migrate        # CLI migration mode');
    console.log('  npm start -- --help    # Show help');

  } catch (error) {
    console.error(`❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}

setup();
