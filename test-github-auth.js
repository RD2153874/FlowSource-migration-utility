import { GitHubAuth } from './src/core/GitHubAuth.js';
import { DocumentationParser } from './src/core/DocumentationParser.js';
import { FileManager } from './src/core/FileManager.js';
import { AuthConfigure } from './src/core/AuthConfigure.js';
import { Logger } from './src/utils/Logger.js';

const logger = new Logger('test');

async function testGitHubAuth() {
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
    // Test Step 1: Find and parse GitHub documentation
    await githubAuth.findAndParseGitHubDoc();
    logger.info('✅ GitHub documentation found and parsed');

    // Test Step 2: Extract GitHub instructions
    await githubAuth.extractGitHubInstructions();
    logger.info('✅ GitHub instructions extracted');
    logger.info(`Found ${githubAuth.githubConfigBlocks.length} GitHub configuration blocks`);

    // Test if githubAuthApiRef is found in any blocks
    const githubAuthApiRefBlocks = githubAuth.githubConfigBlocks.filter(block => {
      const content = docParser.contentToText(block.content);
      return content.includes('githubAuthApiRef');
    });

    logger.info(`Found ${githubAuthApiRefBlocks.length} blocks containing githubAuthApiRef`);
    
    if (githubAuthApiRefBlocks.length > 0) {
      logger.info('✅ githubAuthApiRef blocks detected correctly');
      githubAuthApiRefBlocks.forEach((block, index) => {
        logger.info(`Block ${index + 1}: ${docParser.contentToText(block.content).substring(0, 100)}...`);
      });
    } else {
      logger.error('❌ githubAuthApiRef blocks not detected');
    }

    // Test Step 3: Process GitHub configuration blocks
    for (const configBlock of githubAuth.githubConfigBlocks) {
      const content = configBlock.content;
      const contentText = docParser.contentToText(content);
      
      if (contentText.includes("githubAuthApiRef")) {
        logger.info('🔍 Processing githubAuthApiRef block...');
        await githubAuth.addGitHubAuthImport(configBlock);
        logger.info('✅ addGitHubAuthImport executed');
      }
    }

  } catch (error) {
    logger.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testGitHubAuth();
