// Test script for Backstage generator
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';

async function testBackstageGeneration() {
  console.log('🧪 Testing Backstage skeleton generation...');
  
  try {
    const destinationPath = path.resolve('./test-backstage');
    const applicationName = 'test-app';
    
    // Ensure parent directory exists and destination is empty
    await fs.ensureDir(path.dirname(destinationPath));
    
    // Clean up previous test if it exists
    if (await fs.pathExists(destinationPath)) {
      console.log(`Removing existing directory: ${destinationPath}`);
      await fs.remove(destinationPath);
    }
    
    await fs.ensureDir(destinationPath);
    
    console.log(`📝 Destination path: ${destinationPath}`);
    console.log(`📝 Application name: ${applicationName}`);
    
    // Try the latest version
    const command = 'npx';
    const args = ['@backstage/create-app@latest', '--path', destinationPath, '--skip-install'];
    
    console.log(`📝 Executing: ${command} ${args.join(' ')}`);
    console.log('Waiting for command to complete (this may take a few minutes)...');
    
    const result = spawnSync(command, args, {
      stdio: 'inherit', // Use inherit to show real-time output
      input: `${applicationName}\n`,
      encoding: 'utf8',
      timeout: 300000, // 5 minutes timeout
      shell: true
    });
    
    if (result.error) {
      console.error(`❌ Command execution error: ${result.error.message}`);
      return;
    }
    
    if (result.status !== 0) {
      console.error(`❌ Command failed with exit code ${result.status}`);
      return;
    }
    
    console.log('✅ Command completed successfully');
    
    // Verify the structure was created
    const requiredPaths = [
      'package.json',
      'packages/app',
      'packages/backend',
      'app-config.yaml'
    ];
    
    console.log('Verifying structure...');
    
    for (const requiredPath of requiredPaths) {
      const fullPath = path.join(destinationPath, requiredPath);
      if (!await fs.pathExists(fullPath)) {
        console.error(`❌ Required path not found: ${requiredPath}`);
        return;
      }
      console.log(`✅ Found: ${requiredPath}`);
    }
    
    console.log('✅ Backstage skeleton structure verified');
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

testBackstageGeneration();
