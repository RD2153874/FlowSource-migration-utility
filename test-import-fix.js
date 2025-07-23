import fs from 'fs-extra';
import path from 'path';

async function testGithubAuthImportFix() {
  const appTsxPath = path.join(
    'c:\\FlowSource_Automation\\FlowSource-Agent\\genv3',
    'packages/app/src/App.tsx'
  );

  console.log('Reading App.tsx...');
  let appContent = await fs.readFile(appTsxPath, 'utf8');

  // Check if githubAuthApiRef import is missing
  if (!appContent.includes('githubAuthApiRef')) {
    console.log('❌ githubAuthApiRef import is missing');
    
    // Find the import line that contains discoveryApiRef, useApi, configApiRef
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+["']@backstage\/core-plugin-api["'];/;
    const match = appContent.match(importRegex);
    
    if (match) {
      console.log('Found core-plugin-api import:', match[0]);
      
      // Add githubAuthApiRef to the imports
      const currentImports = match[1];
      const newImports = currentImports.includes('githubAuthApiRef') 
        ? currentImports 
        : 'githubAuthApiRef,' + currentImports;
      
      const newImportLine = `import {${newImports}} from "@backstage/core-plugin-api";`;
      
      appContent = appContent.replace(match[0], newImportLine);
      
      await fs.writeFile(appTsxPath, appContent, 'utf8');
      console.log('✅ Added githubAuthApiRef to imports');
    } else {
      console.log('❌ Could not find core-plugin-api import line');
    }
  } else {
    console.log('✅ githubAuthApiRef import already exists');
  }
}

testGithubAuthImportFix().catch(console.error);
