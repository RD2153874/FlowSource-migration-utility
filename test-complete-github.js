import { GitHubAuth } from './src/core/GitHubAuth.js';
import { DocumentationParser } from './src/core/DocumentationParser.js';
import { FileManager } from './src/core/FileManager.js';
import { AuthConfigure } from './src/core/AuthConfigure.js';
import { Logger } from './src/utils/Logger.js';
import fs from 'fs-extra';
import path from 'path';

const logger = new Logger('test');

async function testCompleteGitHubFlow() {
  console.log('🧪 Testing complete GitHub authentication flow...');
  
  const config = {
    sourcePath: 'c:\\FlowSource_Automation\\FlowSource-Agent\\Flowsource_Package_1_0_0',
    destinationPath: 'c:\\FlowSource_Automation\\FlowSource-Agent\\genv3',
    githubAuth: {
      clientId: 'test_client_id',
      clientSecret: 'test_client_secret',
      githubOrganization: 'TheCognizantFoundry'
    }
  };

  const docParser = new DocumentationParser(logger);
  const fileManager = new FileManager(config, logger);
  const authConfigure = new AuthConfigure(config, logger, docParser, fileManager);
  
  const githubAuth = new GitHubAuth(config, logger, docParser, fileManager, authConfigure);

  try {
    // First, reset the App.tsx to remove githubAuthApiRef import to test
    const appTsxPath = path.join(config.destinationPath, 'packages/app/src/App.tsx');
    let appContent = await fs.readFile(appTsxPath, 'utf8');
    
    // Remove githubAuthApiRef from import if it exists
    appContent = appContent.replace(/githubAuthApiRef,/g, '');
    await fs.writeFile(appTsxPath, appContent, 'utf8');
    
    console.log('🔧 Reset App.tsx - removed githubAuthApiRef import');
    
    // Test Step 1: Find and parse GitHub documentation
    await githubAuth.findAndParseGitHubDoc();
    console.log('✅ Step 1: GitHub documentation found and parsed');

    // Test Step 2: Extract GitHub instructions
    await githubAuth.extractGitHubInstructions();
    console.log('✅ Step 2: GitHub instructions extracted');
    console.log(`   Found ${githubAuth.githubConfigBlocks.length} GitHub configuration blocks`);

    // Test if Step 6 content is detected
    const step6Blocks = githubAuth.githubConfigBlocks.filter(block => {
      const content = docParser.contentToText(block.content);
      return content.includes('githubAuthApiRef') && content.includes('import');
    });

    console.log(`   Found ${step6Blocks.length} blocks for Step 6 (githubAuthApiRef import)`);
    
    if (step6Blocks.length > 0) {
      console.log('✅ Step 6: githubAuthApiRef import block detected');
      
      // Test the processing function
      for (const block of step6Blocks) {
        console.log('🔧 Processing Step 6 block...');
        await githubAuth.addGitHubAuthImport(block);
      }
      
      // Verify the import was added
      appContent = await fs.readFile(appTsxPath, 'utf8');
      if (appContent.includes('githubAuthApiRef')) {
        console.log('✅ Step 6: githubAuthApiRef import successfully added to App.tsx');
      } else {
        console.log('❌ Step 6: githubAuthApiRef import was not added');
      }
    } else {
      console.log('❌ Step 6: githubAuthApiRef import block not detected');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testCompleteGitHubFlow();
