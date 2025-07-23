import fs from 'fs-extra';
import path from 'path';

async function testDirectImportFix() {
  const appTsxPath = path.join(
    'c:\\FlowSource_Automation\\FlowSource-Agent\\genv3',
    'packages/app/src/App.tsx'
  );

  console.log('Reading App.tsx...');
  let appContent = await fs.readFile(appTsxPath, 'utf8');

  // Check if githubAuthApiRef import is missing
  if (!appContent.includes('githubAuthApiRef')) {
    console.log('❌ githubAuthApiRef import is missing');
    
    // Look for existing core-plugin-api import line to extend it
    const corePluginApiImportRegex = /import\s+\{([^}]+)\}\s+from\s+["']@backstage\/core-plugin-api["'];/;
    const match = appContent.match(corePluginApiImportRegex);
    
    if (match) {
      console.log('Found core-plugin-api import:', match[0]);
      
      // Add githubAuthApiRef to existing import
      const currentImports = match[1];
      const newImports = 'githubAuthApiRef,' + currentImports;
      const newImportLine = `import {${newImports}} from "@backstage/core-plugin-api";`;
      
      appContent = appContent.replace(match[0], newImportLine);
      
      await fs.writeFile(appTsxPath, appContent, 'utf8');
      console.log('✅ Added githubAuthApiRef to existing core-plugin-api import');
    } else {
      console.log('❌ Could not find core-plugin-api import line');
    }
  } else {
    console.log('✅ githubAuthApiRef import already exists');
  }
  
  // Verify the fix
  appContent = await fs.readFile(appTsxPath, 'utf8');
  if (appContent.includes('githubAuthApiRef')) {
    console.log('✅ Verification: githubAuthApiRef import is now present');
  } else {
    console.log('❌ Verification: githubAuthApiRef import is still missing');
  }
}

testDirectImportFix().catch(console.error);
