// FlowSource Transformer - Handles UI customizations and theme application
import path from 'path';
import fs from 'fs-extra';
import { Logger } from '../utils/Logger.js';

export class FlowSourceTransformer {
  constructor() {
    this.logger = Logger.getInstance();
  }

  async applyUICustomizations(config) {
    this.logger.info('🎨 Applying FlowSource UI customizations...');
    
    // Apply theme customizations
    await this.applyThemeCustomizations(config);
    
    // Update React components
    await this.updateReactComponents(config);
    
    // Apply entity page customizations
    await this.updateEntityPage(config);
    
    // Update App.tsx with theme integration
    await this.updateAppComponent(config);
    
    // Clean up any duplicate or malformed structures
    await this.cleanupAppStructure(config);
    
    // Validate compliance with UI-Changes.md requirements
    await this.validateUIChangesCompliance(config);
    
    this.logger.info('✅ UI customizations applied successfully');
  }

  async applyThemeCustomizations(config) {
    const sourceTheme = path.join(config.sourcePath, 'packages-core', 'app', 'src', 'components', 'theme');
    const destTheme = path.join(config.destinationPath, 'packages', 'app', 'src', 'components', 'theme');
    
    if (await fs.pathExists(sourceTheme)) {
      await fs.copy(sourceTheme, destTheme, { overwrite: true });
      this.logger.info('🎨 FlowSource theme applied');
    }
  }

  async updateReactComponents(config) {
    // Update Root component with FlowSource styling
    await this.updateRootComponent(config);
    
    // Update Logo components
    await this.updateLogoComponents(config);
    
    // Update Search component
    await this.updateSearchComponent(config);
  }

  async updateRootComponent(config) {
    const sourceRoot = path.join(config.sourcePath, 'packages-core', 'app', 'src', 'components', 'Root');
    const destRoot = path.join(config.destinationPath, 'packages', 'app', 'src', 'components', 'Root');
    
    if (await fs.pathExists(sourceRoot)) {
      // Copy Root.tsx with FlowSource customizations
      const sourceRootTsx = path.join(sourceRoot, 'Root.tsx');
      const destRootTsx = path.join(destRoot, 'Root.tsx');
      
      if (await fs.pathExists(sourceRootTsx)) {
        // Read the FlowSource Root.tsx and apply Phase 1 modifications
        let rootContent = await fs.readFile(sourceRootTsx, 'utf8');
        
        // Remove plugin-specific imports and routes for Phase 1
        rootContent = this.removePluginSpecificContent(rootContent);
        
        await fs.writeFile(destRootTsx, rootContent, 'utf8');
        this.logger.info('🧭 Root component updated with FlowSource navigation');
      }
      
      // Copy logo components
      const logoFiles = ['LogoFull.tsx', 'LogoIcon.tsx', 'index.ts'];
      for (const logoFile of logoFiles) {
        const sourceLogo = path.join(sourceRoot, logoFile);
        const destLogo = path.join(destRoot, logoFile);
        
        if (await fs.pathExists(sourceLogo)) {
          await fs.copy(sourceLogo, destLogo, { overwrite: true });
        }
      }
    }
  }

  async updateLogoComponents(config) {
    // Logos are handled in updateRootComponent
    this.logger.info('🏷️ Logo components updated');
  }

  async updateSearchComponent(config) {
    const sourceSearch = path.join(config.sourcePath, 'packages-core', 'app', 'src', 'components', 'search');
    const destSearch = path.join(config.destinationPath, 'packages', 'app', 'src', 'components', 'search');
    
    if (await fs.pathExists(sourceSearch)) {
      await fs.copy(sourceSearch, destSearch, { overwrite: true });
      this.logger.info('🔍 Search component updated');
    }
  }

  async updateEntityPage(config) {
    const destEntityPage = path.join(config.destinationPath, 'packages', 'app', 'src', 'components', 'catalog', 'EntityPage.tsx');
    
    if (await fs.pathExists(destEntityPage)) {
      let entityContent = await fs.readFile(destEntityPage, 'utf8');
      
      // Add required imports if not present
      const requiredImports = [
        "import { Button, Grid } from '@material-ui/core';",
        "import { Mermaid } from 'backstage-plugin-techdocs-addon-mermaid';"
      ];
      
      for (const importStatement of requiredImports) {
        if (!entityContent.includes(importStatement)) {
          // Find the last import statement and add after it
          const importRegex = /(import.*from.*['"];?\n)/g;
          const imports = entityContent.match(importRegex) || [];
          
          if (imports.length > 0) {
            const lastImport = imports[imports.length - 1];
            const lastImportIndex = entityContent.lastIndexOf(lastImport) + lastImport.length;
            entityContent = entityContent.slice(0, lastImportIndex) + importStatement + '\n' + entityContent.slice(lastImportIndex);
          }
        }
      }
      
      // Add Mermaid to TechDocsAddons if not present
      if (entityContent.includes('<TechDocsAddons>') && !entityContent.includes('<Mermaid')) {
        const techDocsAddonsPattern = /(<TechDocsAddons>\s*<ReportIssue \/>)\s*(<\/TechDocsAddons>)/;
        if (techDocsAddonsPattern.test(entityContent)) {
          entityContent = entityContent.replace(
            techDocsAddonsPattern,
            `$1
          <Mermaid config={{ theme: 'forest', themeVariables: { lineColor: '#000000' } }} />
        $2`
          );
          this.logger.info('📊 Added Mermaid to EntityPage TechDocsAddons');
        }
      }
      
      await fs.writeFile(destEntityPage, entityContent, 'utf8');
      this.logger.info('📋 Entity page updated with required imports and Mermaid support');
    }
  }

  async updateAppComponent(config) {
    const destApp = path.join(config.destinationPath, 'packages', 'app', 'src', 'App.tsx');
    
    if (await fs.pathExists(destApp)) {
      let appContent = await fs.readFile(destApp, 'utf8');
      
      // Add FlowSource theme imports if not present (from UI-Changes.md documentation)
      const themeImports = [
        `import { FlowsourceTheme } from './components/theme/FlowsourceTheme';`,
        `import { UnifiedThemeProvider } from '@backstage/theme';`,
        `import { FlowsourceHome } from './components/catalog/customcatalog/FlowsourceHome';`,
        `import { Mermaid } from 'backstage-plugin-techdocs-addon-mermaid';`
      ];
      
      // Add imports after the last existing import
      themeImports.forEach(importStatement => {
        const importName = importStatement.match(/import\s+\{\s*([^}]+)\s*\}\s+from/)[1].trim();
        // Check if the specific import name is already present in the file
        if (!appContent.includes(`import { ${importName} }`)) {
          const importRegex = /(import.*from.*['"];?\n)/g;
          const imports = appContent.match(importRegex) || [];
          if (imports.length > 0) {
            const lastImportIndex = appContent.lastIndexOf(imports[imports.length - 1]) + imports[imports.length - 1].length;
            appContent = appContent.slice(0, lastImportIndex) + importStatement + '\n' + appContent.slice(lastImportIndex);
            this.logger.info(`📦 Added import: ${importName}`);
          }
        } else {
          this.logger.info(`✅ Import already exists: ${importName}`);
        }
      });
      
      // Ensure FlowsourceHome integration according to UI-Changes.md
      appContent = await this.ensureFlowsourceHomeIntegration(appContent);
      
      // Fix catalog route to include FlowsourceHome properly
      if (appContent.includes('<FlowsourceHome />') && appContent.includes('<Route path="/catalog" element={<CatalogIndexPage />} />')) {
        // Fix malformed catalog route
        const malformedRoute = /<Route path="\/catalog" element={<CatalogIndexPage \/>} \/>\s*<FlowsourceHome \/>\s*<Route/;
        if (malformedRoute.test(appContent)) {
          appContent = appContent.replace(
            malformedRoute,
            `<Route path="/catalog" element={<CatalogIndexPage />}>
      <FlowsourceHome />
    </Route>
    <Route`
          );
          this.logger.info('🔧 Fixed catalog route with FlowsourceHome');
        }
      } else if (!appContent.includes('<FlowsourceHome />')) {
        // Add FlowsourceHome to catalog route if not present
        const catalogRoutePattern = /<Route path="\/catalog" element={<CatalogIndexPage \/>} \/>/;
        if (catalogRoutePattern.test(appContent)) {
          appContent = appContent.replace(
            catalogRoutePattern,
            `<Route path="/catalog" element={<CatalogIndexPage />}>
      <FlowsourceHome />
    </Route>`
          );
          this.logger.info('✅ Added FlowsourceHome to catalog route');
        }
      }
      
      // Add Mermaid to TechDocsAddons if not present
      if (appContent.includes('<TechDocsAddons>') && !appContent.includes('<Mermaid')) {
        const techDocsAddonsPattern = /(<TechDocsAddons>\s*<ReportIssue \/>)\s*(<\/TechDocsAddons>)/;
        if (techDocsAddonsPattern.test(appContent)) {
          appContent = appContent.replace(
            techDocsAddonsPattern,
            `$1
        <Mermaid config={{ theme: 'forest', themeVariables: { lineColor: '#000000' } }} />
      $2`
          );
          this.logger.info('📊 Added Mermaid to TechDocsAddons');
        }
      }
      
      // Only modify the createApp structure if FlowSource theme is not already configured
      if (!appContent.includes('flowsource-theme')) {
        // Find the createApp call
        const createAppMatch = appContent.match(/(const app = createApp\(\{[\s\S]*?\}\);)/);
        
        if (createAppMatch) {
          const existingConfig = createAppMatch[1];
          
          // Extract existing apis section
          const apisMatch = existingConfig.match(/(apis[^,]*)/);
          const apis = apisMatch ? apisMatch[1] : 'apis';
          
          // Check if themes array already exists
          let newCreateApp;
          if (existingConfig.includes('themes:')) {
            // If themes already exist, just add our FlowSource theme to it
            newCreateApp = existingConfig.replace(
              /themes:\s*\[([^\]]*)\]/,
              `themes: [
    {
      id: 'flowsource-theme',
      title: 'Flowsource Theme',
      variant: 'light',
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={FlowsourceTheme} children={children} />
      ),
    },
    $1
  ]`
            );
          } else {
            // Extract existing bindRoutes and components sections to preserve them
            const bindRoutesMatch = existingConfig.match(/(bindRoutes\([^{]*\{[^}]*\}[^}]*\}[^,]*)/);
            const componentsMatch = existingConfig.match(/(components:\s*\{[^}]*\})/);
            
            let bindRoutes = '';
            let components = `components: {
    SignInPage: props => <SignInPage {...props} auto providers={['guest']} />,
  }`;
            
            if (bindRoutesMatch) {
              bindRoutes = bindRoutesMatch[1];
            } else {
              // Create the required bindRoutes structure as specified in the requirements
              bindRoutes = `bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
      createFromTemplate: scaffolderPlugin.routes.selectedTemplate,
    });
    bind(apiDocsPlugin.externalRoutes, {
      registerApi: catalogImportPlugin.routes.importPage,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
  }`;
            }
            
            if (componentsMatch) {
              components = componentsMatch[1];
            }
            
            // Create the new createApp structure - NO EXTRA COMMAS
            newCreateApp = `const app = createApp({
  ${apis},
  themes: [
    {
      id: 'flowsource-theme',
      title: 'Flowsource Theme',
      variant: 'light',
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={FlowsourceTheme} children={children} />
      ),
    },
  ],
  ${bindRoutes},
  ${components},
});`;
          }
          
          appContent = appContent.replace(createAppMatch[1], newCreateApp);
        }
      }
      
      await fs.writeFile(destApp, appContent, 'utf8');
      this.logger.info('📱 App component updated with FlowSource theme and proper structure');
    }
  }

  async cleanupAppStructure(config) {
    const destApp = path.join(config.destinationPath, 'packages', 'app', 'src', 'App.tsx');
    
    if (await fs.pathExists(destApp)) {
      let appContent = await fs.readFile(destApp, 'utf8');
      
      // Fix the specific comma issue after bindRoutes
      appContent = appContent.replace(/(\}\);),(\s*components:)/g, '$1$2');
      
      // Remove duplicate bindRoutes sections that might exist outside createApp
      const duplicateBindRoutesPattern = /\n\s*bind\(apiDocsPlugin\.externalRoutes[\s\S]*?\}\);[\s\S]*?\n/g;
      appContent = appContent.replace(duplicateBindRoutesPattern, '\n');
      
      // Remove any duplicate components sections
      const duplicateComponentsPattern = /\n\s*components:\s*\{[\s\S]*?SignInPage[\s\S]*?\},[\s\S]*?\}\);/g;
      const matches = appContent.match(duplicateComponentsPattern);
      if (matches && matches.length > 1) {
        // Keep only the first components section
        for (let i = 1; i < matches.length; i++) {
          appContent = appContent.replace(matches[i], '');
        }
      }
      
      // Clean up extra semicolons and malformed structures
      appContent = appContent.replace(/\}\);[\s\n]*\}\);/g, '});');
      appContent = appContent.replace(/,[\s\n]*,/g, ',');
      
      // Ensure FlowsourceHome is properly integrated (per UI-Changes.md documentation)
      appContent = await this.ensureFlowsourceHomeIntegration(appContent);
      
      await fs.writeFile(destApp, appContent, 'utf8');
      this.logger.info('🧹 App structure cleaned up - fixed comma issues and ensured FlowsourceHome integration');
    }
  }

  removePluginSpecificContent(content) {
    // Remove plugin-specific imports and routes for Phase 1
    const pluginPatterns = [
      /import.*flowsource-.*plugin.*/g,
      /import.*@flowsource\/plugin.*/g,
      /<Route.*flowsource-.*\/>/g,
      /<SidebarItem.*flowsource-.*/g,
      // Keep only essential FlowSource UI components
    ];

    let cleanContent = content;
    pluginPatterns.forEach(pattern => {
      cleanContent = cleanContent.replace(pattern, '');
    });

    return cleanContent;
  }

  removePluginSpecificContentFromEntity(content) {
    // Remove plugin-specific content from Entity page for Phase 1
    const pluginPatterns = [
      /import.*@flowsource\/plugin.*/g,
      /import.*flowsource-.*plugin.*/g,
      /<.*FlowSource.*Component.*\/>/g,
    ];

    let cleanContent = content;
    pluginPatterns.forEach(pattern => {
      cleanContent = cleanContent.replace(pattern, '');
    });

    return cleanContent;
  }

  async ensureFlowsourceHomeIntegration(appContent) {
    // According to UI-Changes.md Step 3: Update Catalog Route
    // Replace the standard catalog route with FlowsourceHome integration
    if (!appContent.includes('<FlowsourceHome />')) {
      // Handle different possible catalog route formats
      const catalogRoutePatterns = [
        /<Route path="\/catalog" element={<CatalogIndexPage \/>} \/>/,
        /<Route path="\/catalog" element={<CatalogIndexPage \/>}>/,
        /<Route path='\/catalog' element={<CatalogIndexPage \/>} \/>/,
        /<Route path='\/catalog' element={<CatalogIndexPage \/>}>/
      ];
      
      for (const pattern of catalogRoutePatterns) {
        if (pattern.test(appContent)) {
          appContent = appContent.replace(
            pattern,
            `<Route path="/catalog" element={<CatalogIndexPage />}>
      <FlowsourceHome />
    </Route>`
          );
          this.logger.info('📋 Added FlowsourceHome to catalog route');
          break;
        }
      }
    } else {
      this.logger.info('✅ FlowsourceHome already integrated in catalog route');
    }
    
    return appContent;
  }

  async validateUIChangesCompliance(config) {
    const destApp = path.join(config.destinationPath, 'packages', 'app', 'src', 'App.tsx');
    
    if (await fs.pathExists(destApp)) {
      const appContent = await fs.readFile(destApp, 'utf8');
      
      // Check required imports from UI-Changes.md Step 1
      const requiredImports = [
        'FlowsourceTheme',
        'UnifiedThemeProvider', 
        'FlowsourceHome',
        'Mermaid'
      ];
      
      const missingImports = [];
      requiredImports.forEach(importName => {
        if (!appContent.includes(`import { ${importName} }`)) {
          missingImports.push(importName);
        }
      });
      
      // Check theme configuration from UI-Changes.md Step 2
      const hasThemeConfig = appContent.includes('flowsource-theme') && 
                           appContent.includes('UnifiedThemeProvider theme={FlowsourceTheme}');
      
      // Check catalog route integration from UI-Changes.md Step 3
      const hasFlowsourceHomeRoute = appContent.includes('<FlowsourceHome />');
      
      if (missingImports.length > 0) {
        this.logger.warn(`⚠️ Missing required imports: ${missingImports.join(', ')}`);
      }
      
      if (!hasThemeConfig) {
        this.logger.warn('⚠️ FlowSource theme configuration may be incomplete');
      }
      
      if (!hasFlowsourceHomeRoute) {
        this.logger.warn('⚠️ FlowsourceHome not integrated in catalog route');
      }
      
      if (missingImports.length === 0 && hasThemeConfig && hasFlowsourceHomeRoute) {
        this.logger.info('✅ App.tsx complies with UI-Changes.md requirements');
        return true;
      }
    }
    
    return false;
  }
}
