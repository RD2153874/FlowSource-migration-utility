// FlowSource Migration Agent - Diagnostic Tool
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { execSync } from 'child_process';

async function diagnose() {
  console.log(chalk.blue.bold('🔍 FlowSource Migration Agent Diagnostic Tool\n'));
  
  // Check environment
  console.log(chalk.blue('📋 Checking environment...'));
  
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js: ${nodeVersion}`);
    
    // Check if Node.js version is >= 20.18.3
    const versionParts = nodeVersion.replace('v', '').split('.').map(Number);
    const requiredVersion = [20, 18, 3];
    
    let versionOk = false;
    if (versionParts[0] > requiredVersion[0]) {
      versionOk = true;
    } else if (versionParts[0] === requiredVersion[0]) {
      if (versionParts[1] > requiredVersion[1]) {
        versionOk = true;
      } else if (versionParts[1] === requiredVersion[1]) {
        versionOk = versionParts[2] >= requiredVersion[2];
      }
    }
    
    if (!versionOk) {
      console.log(chalk.red(`❌ Node.js version is less than required (20.18.3). Please upgrade Node.js.`));
    }
    
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ npm: ${npmVersion}`);
  } catch (error) {
    console.error(chalk.red(`❌ Error checking Node.js version: ${error.message}`));
  }
  
  // Check for package.json
  console.log(chalk.blue('\n📋 Checking package.json...'));
  try {
    const packagePath = path.resolve('package.json');
    if (await fs.pathExists(packagePath)) {
      const packageJson = await fs.readJson(packagePath);
      console.log(`✅ package.json found (version ${packageJson.version})`);
      
      // Check dependencies
      console.log(chalk.blue('\n📋 Checking dependencies...'));
      const dependencies = Object.keys(packageJson.dependencies || {});
      const criticalDeps = ['inquirer', 'fs-extra', 'commander', 'winston', 'chalk'];
      
      for (const dep of criticalDeps) {
        if (dependencies.includes(dep)) {
          console.log(`✅ Dependency: ${dep}`);
        } else {
          console.log(chalk.red(`❌ Missing critical dependency: ${dep}`));
        }
      }
    } else {
      console.log(chalk.red('❌ package.json not found'));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error checking package.json: ${error.message}`));
  }
  
  // Check for node_modules
  console.log(chalk.blue('\n📋 Checking node_modules...'));
  const nodeModulesPath = path.resolve('node_modules');
  if (await fs.pathExists(nodeModulesPath)) {
    console.log(`✅ node_modules directory exists`);
  } else {
    console.log(chalk.red(`❌ node_modules directory not found. Run 'npm install' or 'yarn install' to install dependencies.`));
  }
  
  // Check log files
  console.log(chalk.blue('\n📋 Checking log files...'));
  const logsDir = path.resolve('logs');
  
  if (await fs.pathExists(logsDir)) {
    console.log(`✅ logs directory exists`);
    
    const errorLogPath = path.join(logsDir, 'error.log');
    const combinedLogPath = path.join(logsDir, 'combined.log');
    
    if (await fs.pathExists(errorLogPath)) {
      const errorLogStats = await fs.stat(errorLogPath);
      console.log(`✅ error.log exists (size: ${errorLogStats.size} bytes)`);
      
      if (errorLogStats.size > 0) {
        console.log(chalk.yellow(`⚠️ error.log contains errors. Check the content for details.`));
        const errorContent = await fs.readFile(errorLogPath, 'utf8');
        const lastErrors = errorContent.split('\n')
          .filter(line => line.trim())
          .slice(-5)
          .map(line => JSON.parse(line));
        
        console.log(chalk.yellow('\nLast 5 errors:'));
        lastErrors.forEach(error => {
          console.log(chalk.red(`${error.timestamp} - ${error.message}`));
        });
      }
    } else {
      console.log(chalk.yellow(`⚠️ error.log does not exist`));
    }
    
    if (await fs.pathExists(combinedLogPath)) {
      const combinedLogStats = await fs.stat(combinedLogPath);
      console.log(`✅ combined.log exists (size: ${combinedLogStats.size} bytes)`);
      
      if (combinedLogStats.size > 0) {
        console.log(chalk.blue(`📋 combined.log contains logs. Check the content for details.`));
        const combinedContent = await fs.readFile(combinedLogPath, 'utf8');
        const lastLogs = combinedContent.split('\n')
          .filter(line => line.trim())
          .slice(-5)
          .map(line => JSON.parse(line));
        
        console.log(chalk.blue('\nLast 5 logs:'));
        lastLogs.forEach(log => {
          console.log(`${log.timestamp} - [${log.level}] ${log.message}`);
        });
      }
    } else {
      console.log(chalk.yellow(`⚠️ combined.log does not exist`));
    }
  } else {
    console.log(chalk.red(`❌ logs directory does not exist`));
  }
  
  // Check source path from arguments
  console.log(chalk.blue('\n📋 Checking FlowSource package source path...'));
  
  const defaultSourcePath = 'C:\\FlowSource Automation\\FlowSource-Agent\\Flowsource_Package_1_0_0';
  
  try {
    if (await fs.pathExists(defaultSourcePath)) {
      console.log(`✅ Default source path exists: ${defaultSourcePath}`);
      
      // Check required paths
      const requiredPaths = [
        path.join(defaultSourcePath, "FlowSourceInstaller", "FlowsourceSetupDoc", "Readme.md"),
        path.join(defaultSourcePath, "FlowSourceInstaller", "FlowsourceSetupDoc", "UI-Changes.md"),
        path.join(defaultSourcePath, "configuration"),
        path.join(defaultSourcePath, "packages-core", "app"),
        path.join(defaultSourcePath, "packages-core", "backend")
      ];
      
      console.log(chalk.blue('\n📋 Checking required paths in source directory...'));
      
      for (const requiredPath of requiredPaths) {
        if (await fs.pathExists(requiredPath)) {
          console.log(`✅ Required path exists: ${requiredPath}`);
        } else {
          console.log(chalk.red(`❌ Required path not found: ${requiredPath}`));
        }
      }
    } else {
      console.log(chalk.red(`❌ Default source path does not exist: ${defaultSourcePath}`));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error checking source path: ${error.message}`));
  }
  
  console.log(chalk.blue('\n📋 Testing file creation and write permissions...'));
  
  try {
    const testFilePath = path.join('logs', 'test_write.txt');
    await fs.writeFile(testFilePath, 'Test write permission', 'utf8');
    console.log(`✅ Successfully wrote to test file: ${testFilePath}`);
    
    await fs.unlink(testFilePath);
    console.log(`✅ Successfully deleted test file: ${testFilePath}`);
  } catch (error) {
    console.error(chalk.red(`❌ Error testing file system permissions: ${error.message}`));
  }
  
  // Test destination directory creation
  console.log(chalk.blue('\n📋 Testing destination directory creation...'));
  
  try {
    const testDestPath = path.resolve('test-destination');
    
    if (await fs.pathExists(testDestPath)) {
      await fs.remove(testDestPath);
      console.log(`✅ Removed existing test destination directory`);
    }
    
    await fs.ensureDir(testDestPath);
    console.log(`✅ Successfully created test destination directory: ${testDestPath}`);
    
    await fs.remove(testDestPath);
    console.log(`✅ Successfully removed test destination directory: ${testDestPath}`);
  } catch (error) {
    console.error(chalk.red(`❌ Error testing destination directory: ${error.message}`));
  }
  
  console.log(chalk.blue.bold('\n🔍 Diagnostic check completed.'));
  console.log(chalk.yellow('For detailed troubleshooting, check the log files in the "logs" directory.'));
}

diagnose();
