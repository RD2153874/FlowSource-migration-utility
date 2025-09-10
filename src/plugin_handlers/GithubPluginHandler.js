// GithubPluginHandler - Handles GitHub plugin specific integration
import path from 'path';
import fs from 'fs';
import PluginReadmeParser from '../parsers/PluginReadmeParser.js';
import YamlConfigMerger from '../utils/YamlConfigMerger.js';
import { FileManager } from '../utils/FileManager.js';

export class GithubPluginHandler {
    constructor(pluginMetadata, context = {}) {
        this.pluginName = pluginMetadata.name;
        this.pluginDisplayName = pluginMetadata.displayName;
        this.frontendReadmePath = pluginMetadata.frontendPath;
        this.backendReadmePath = pluginMetadata.backendPath;
        this.context = context;
        this.logger = context.logger || console;
        this.targetAppPath = context.targetAppPath;
        
        // Use shared utilities from context instead of re-initializing
        this.pluginReadmeParser = context.pluginReadmeParser || new PluginReadmeParser(this.targetAppPath, this.logger);
        this.yamlConfigMerger = context.yamlConfigMerger || new YamlConfigMerger(this.logger);
        this.fileManager = context.fileManager || new FileManager();
        
        // GitHub-specific metadata storage
        this.githubMetadata = {
            catalog: {},
            frontend: {},
            backend: {},
            config: {}
        };
    }

    async integrate(context) {
        this.logger.info(`🔧 Starting ${this.pluginDisplayName} plugin integration...`);
        this.logger.info(`  - Frontend README: ${this.frontendReadmePath}`);
        this.logger.info(`  - Backend README: ${this.backendReadmePath}`);
        this.logger.info(`  - Target app path: ${this.targetAppPath}`);
        
        try {
            // Step 1: Use existing catalog configuration from shared context (use the passed context)
            this.logger.info('Using catalog configuration from shared context...');
            const catalogConfig = this.getCatalogConfigFromContext(context);
            
            // Step 2: Parse GitHub-specific README content
            this.logger.info('Parsing GitHub-specific README files...');
            const frontendMetadata = await this.parseGithubFrontendReadme(this.frontendReadmePath);
            const backendMetadata = await this.parseGithubBackendReadme(this.backendReadmePath);
            
            // Step 3: Handle backend configuration files (app-config.yaml)
            if (backendMetadata && backendMetadata.config) {
                this.logger.info('Handling GitHub integration configuration...');
                await this.handleGithubIntegrationConfig(backendMetadata.config);
            }
            
            // Step 4: Apply file modifications using shared PluginReadmeParser
            this.logger.info('Applying catalog modifications...');
            await this.applyCatalogChanges(catalogConfig);
            
            if (frontendMetadata) {
                this.logger.info('Applying frontend modifications...');
                await this.applyFrontendChanges(frontendMetadata);
            }
            
            if (backendMetadata) {
                this.logger.info('Applying backend modifications...');
                await this.applyBackendChanges(backendMetadata);
            }
            
            // Step 5: Validate modifications were applied correctly
            this.logger.info('Validating integration results...');
            const validationData = {
                catalog: { annotations: catalogConfig },
                entityPage: frontendMetadata ? {
                    imports: frontendMetadata.imports,
                    constants: frontendMetadata.constants,
                    components: frontendMetadata.components,
                    serviceLayout: frontendMetadata.serviceLayout,
                    websiteLayout: frontendMetadata.websiteLayout
                } : null,
                app: frontendMetadata ? {
                    imports: frontendMetadata.appImports,
                    routes: frontendMetadata.appRoutes
                } : null,
                packageJsonFrontend: frontendMetadata ? {
                    dependencies: frontendMetadata.dependencies
                } : null,
                packageJsonBackend: backendMetadata ? {
                    dependencies: backendMetadata.dependencies
                } : null,
                backendIndex: backendMetadata ? {
                    imports: backendMetadata.imports
                } : null
            };
            
            const validation = await this.pluginReadmeParser.validateModifications(validationData);
            
            this.logger.info(`✅ ${this.pluginDisplayName} plugin integration completed successfully`);
            
            return {
                message: `${this.pluginDisplayName} plugin integration completed`,
                catalogProcessed: true,
                frontendProcessed: frontendMetadata ? true : false,
                backendProcessed: backendMetadata ? true : false,
                configFilesUpdated: backendMetadata && backendMetadata.config ? true : false,
                validationResults: validation,
                githubMetadata: this.githubMetadata
            };
            
        } catch (error) {
            this.logger.error(`❌ ${this.pluginDisplayName} plugin integration failed:`, error);
            throw error;
        }
    }

    // =====================================
    // Shared Context Configuration
    // =====================================

    getCatalogConfigFromContext(context = null) {
        // Use the passed context or fallback to constructor context
        const contextToUse = context || this.context;
        
        this.logger.info('Extracting GitHub catalog configuration from shared context...');
        
        try {
            // Extract GitHub-specific configuration from shared context
            // The main interactive flow should have already collected this data
            const githubRepoOwner = contextToUse.githubRepoOwner || 
                                  contextToUse.pluginConfigs?.github?.repoOwner ||
                                  contextToUse.userConfig?.github?.repoOwner;
                                  
            const githubRepoName = contextToUse.githubRepoName || 
                                 contextToUse.pluginConfigs?.github?.repoName ||
                                 contextToUse.userConfig?.github?.repoName;
            
            if (!githubRepoOwner || !githubRepoName) {
                throw new Error('GitHub repository configuration not found in shared context. ' +
                              'Please ensure the main interactive flow has collected this data.');
            }
            
            const catalogConfig = {
                'flowsource/github-repo-owner': githubRepoOwner,
                'flowsource/github-repo-name': githubRepoName
            };
            
            // Store in metadata for tracking
            this.githubMetadata.catalog = catalogConfig;
            
            this.logger.info(`📋 Catalog configuration extracted:`, {
                owner: githubRepoOwner,
                repo: githubRepoName
            });
            
            return catalogConfig;
            
        } catch (error) {
            this.logger.error('❌ Failed to extract catalog configuration from context:', error.message);
            this.logger.error('Available context keys:', Object.keys(contextToUse));
            throw error;
        }
    }

    // =====================================
    // GitHub-Specific README Parsing
    // =====================================

    async parseGithubFrontendReadme(readmePath) {
        if (!readmePath) {
            this.logger.warn('Frontend README path not provided');
            return null;
        }
        
        try {
            // Resolve relative paths from FlowsourceSetupDoc directory (where Plugin-Integration.md is located)
            let absolutePath;
            if (path.isAbsolute(readmePath)) {
                absolutePath = readmePath;
            } else {
                // Relative paths in Plugin-Integration.md are relative to FlowsourceSetupDoc directory
                const sourcePackagePath = this.context.workspacePath || process.cwd();
                const pluginIntegrationDir = path.join(sourcePackagePath, 'FlowSourceInstaller', 'FlowsourceSetupDoc');
                absolutePath = path.resolve(pluginIntegrationDir, readmePath);
            }
            this.logger.info(`Parsing GitHub frontend README: ${absolutePath}`);
            
            if (!fs.existsSync(absolutePath)) {
                this.logger.warn(`Frontend README not found: ${absolutePath}`);
                return null;
            }
            
            const content = fs.readFileSync(absolutePath, 'utf8');
            const frontendMetadata = this.extractGithubFrontendMetadata(content);
            
            this.githubMetadata.frontend = frontendMetadata;
            return frontendMetadata;
            
        } catch (error) {
            this.logger.error('Failed to parse GitHub frontend README:', error);
            return null;
        }
    }

    async parseGithubBackendReadme(readmePath) {
        if (!readmePath) {
            this.logger.warn('Backend README path not provided');
            return null;
        }
        
        try {
            // Resolve relative paths from FlowsourceSetupDoc directory (where Plugin-Integration.md is located)
            let absolutePath;
            if (path.isAbsolute(readmePath)) {
                absolutePath = readmePath;
            } else {
                // Relative paths in Plugin-Integration.md are relative to FlowsourceSetupDoc directory
                const sourcePackagePath = this.context.workspacePath || process.cwd();
                const pluginIntegrationDir = path.join(sourcePackagePath, 'FlowSourceInstaller', 'FlowsourceSetupDoc');
                absolutePath = path.resolve(pluginIntegrationDir, readmePath);
            }
            this.logger.info(`Parsing GitHub backend README: ${absolutePath}`);
            
            if (!fs.existsSync(absolutePath)) {
                this.logger.warn(`Backend README not found: ${absolutePath}`);
                return null;
            }
            
            const content = fs.readFileSync(absolutePath, 'utf8');
            const backendMetadata = this.extractGithubBackendMetadata(content);
            
            this.githubMetadata.backend = backendMetadata;
            return backendMetadata;
            
        } catch (error) {
            this.logger.error('Failed to parse GitHub backend README:', error);
            return null;
        }
    }

    // =====================================
    // GitHub-Specific Content Extraction
    // =====================================

    extractGithubFrontendMetadata(content) {
        const metadata = {
            imports: '',
            constants: '',
            components: '',
            serviceLayout: '',
            websiteLayout: '',
            appImports: '',
            appRoutes: '',
            dependencies: {}
        };

        // Extract EntityPage imports (Step 1)
        const entityPageImportMatch = content.match(/```typescript\s*\n(import\s+{\s*FlowsourceGithubPage\s*}\s+from\s+'@flowsource\/plugin-flowsource-github';)\s*\n```/);
        if (entityPageImportMatch) {
            metadata.imports = entityPageImportMatch[1];
        }

        // Extract complete Step 2 block (Constants + repoPage component)
        const step2Match = content.match(/```typescript\s*\n(\/\/ Github Plugin[\s\S]*?const\s+repoPage\s*=[\s\S]*?<\/EntitySwitch>\s*\);?\s*)\n```/);
        if (step2Match) {
            const fullStep2Block = step2Match[1].trim();
            
            // Split into constants and components
            const repoPageIndex = fullStep2Block.indexOf('const repoPage =');
            if (repoPageIndex > 0) {
                metadata.constants = fullStep2Block.substring(0, repoPageIndex).trim();
                metadata.components = fullStep2Block.substring(repoPageIndex).trim();
            } else {
                // If we can't split, store the whole block as components
                metadata.components = fullStep2Block;
            }
        }

        // Extract Service Entity Layout (Step 3)
        const serviceLayoutMatch = content.match(/\{\s*\/\*\s*GitHub Plugin\s*\*\/\s*\}[\s\S]*?<EntityLayout\.Route\s+path="\/code-repository"[\s\S]*?<\/EntityLayout\.Route>/);
        if (serviceLayoutMatch) {
            metadata.serviceLayout = serviceLayoutMatch[0].trim();
        }

        // Extract Website Entity Layout (Step 4)  
        const websiteLayoutMatch = content.match(/\{\s*\/\*\s*Github CodeRepository\s*\*\/\s*\}[\s\S]*?<EntityLayout\.Route\s+path="\/pull-requests"[\s\S]*?<\/EntityLayout\.Route>/);
        if (websiteLayoutMatch) {
            metadata.websiteLayout = websiteLayoutMatch[0].trim();
        }

        // Extract App.tsx imports (Step 5)
        const appImportMatch = content.match(/```typescript\s*\nimport\s+{\s*FlowsourceGithubPage\s*}\s+from\s+'@flowsource\/plugin-flowsource-github';\s*\n/);
        if (appImportMatch) {
            metadata.appImports = appImportMatch[0].trim();
        }

        // Extract routes (Step 5)
        const routeMatch = content.match(/<Route\s+path="\/flowsource-github"\s+element={<FlowsourceGithubPage\s*\/>}\s*\/>/);
        if (routeMatch) {
            metadata.appRoutes = routeMatch[0];
        }

        // Extract dependencies (Step 6)
        const depMatch = content.match(/"dependencies":\s*{\s*\n\s*"(@flowsource\/plugin-flowsource-github)"\s*:\s*"([^"]+)"\s*\n\s*}/);
        if (depMatch) {
            metadata.dependencies[depMatch[1]] = depMatch[2];
        }

        return metadata;
    }

    extractGithubBackendMetadata(content) {
        const metadata = {
            config: {},
            imports: '',
            dependencies: {}
        };

        // Extract GitHub integration config (Step 1)
        const githubIntegrationMatch = content.match(/```yaml\s*\n(integrations:\s*\n\s*github:[\s\S]*?token:\s*\${GITHUB_PAT_TOKEN})\s*\n```/);
        if (githubIntegrationMatch) {
            metadata.config.githubIntegration = githubIntegrationMatch[1];
        }

        // Extract PR Cycle Time config (Step 2)
        const prCycleTimeMatch = content.match(/```yaml\s*\n(githubPRCycleTime:[\s\S]*?PRMergeCycleTimeMax:\s*\d+[\s\S]*?)\n```/);
        if (prCycleTimeMatch) {
            metadata.config.prCycleTime = prCycleTimeMatch[1];
        }

        // Extract backend imports (Step 3)
        const backendImportMatch = content.match(/backend\.add\(import\('(@flowsource\/plugin-flowsource-github-backend)'\)\);/);
        if (backendImportMatch) {
            metadata.imports = `backend.add(import('${backendImportMatch[1]}'));`;
        }

        // Extract dependencies (Step 4)
        const depMatch = content.match(/"dependencies":\s*{\s*\n\s*"(@flowsource\/plugin-flowsource-github-backend)"\s*:\s*"([^"]+)"\s*\n\s*}/);
        if (depMatch) {
            metadata.dependencies[depMatch[1]] = depMatch[2];
        }

        return metadata;
    }

    // =====================================
    // Configuration Management
    // =====================================

    async handleGithubIntegrationConfig(backendConfig) {
        this.logger.info('Handling GitHub integration configuration...');
        
        try {
            const configFiles = [
                'app-config.yaml',
                'app-config.local.yaml'
            ];

            for (const configFile of configFiles) {
                const configPath = path.join(this.targetAppPath, configFile);
                
                if (await this.fileManager.pathExists(configPath)) {
                    this.logger.info(`Updating ${configFile}...`);
                    
                    // Check if GitHub integration already exists
                    const hasExistingConfig = await this.checkExistingGithubConfig(configPath);
                    
                    if (!hasExistingConfig) {
                        // Merge GitHub integration config
                        if (backendConfig.githubIntegration) {
                            const integrationConfig = this.parseYamlBlock(backendConfig.githubIntegration);
                            await this.yamlConfigMerger.mergeIntoYamlFile(configPath, integrationConfig);
                        }
                        
                        // Merge PR Cycle Time config
                        if (backendConfig.prCycleTime) {
                            const cycleTimeConfig = this.parseYamlBlock(backendConfig.prCycleTime);
                            await this.yamlConfigMerger.mergeIntoYamlFile(configPath, cycleTimeConfig);
                        }
                        
                        this.logger.info(`Successfully updated ${configFile}`);
                    } else {
                        this.logger.info(`GitHub configuration already exists in ${configFile}, skipping...`);
                    }
                } else {
                    this.logger.warn(`Configuration file not found: ${configFile}`);
                }
            }
            
        } catch (error) {
            this.logger.error('Failed to handle GitHub integration config:', error);
            throw error;
        }
    }

    async checkExistingGithubConfig(configPath) {
        try {
            const content = await this.fileManager.readFile(configPath);
            return content.includes('integrations:') && content.includes('github:');
        } catch (error) {
            this.logger.warn(`Could not check existing config in ${configPath}:`, error.message);
            return false;
        }
    }

    parseYamlBlock(yamlString) {
        // Convert YAML string to object structure
        const lines = yamlString.split('\n');
        const result = {};
        
        let currentObj = result;
        const stack = [result];
        let lastIndent = 0;
        
        for (const line of lines) {
            if (line.trim() === '') continue;
            
            const indent = line.search(/\S/);
            const trimmedLine = line.trim();
            
            if (trimmedLine.includes(':')) {
                const [key, value] = trimmedLine.split(':').map(s => s.trim());
                
                // Handle indentation changes
                while (indent < lastIndent && stack.length > 1) {
                    stack.pop();
                    lastIndent -= 2;
                }
                
                currentObj = stack[stack.length - 1];
                
                if (value === '' || value === undefined) {
                    // This is a parent key
                    currentObj[key] = {};
                    stack.push(currentObj[key]);
                    lastIndent = indent;
                } else {
                    // This is a key-value pair
                    currentObj[key] = value.startsWith('${') ? value : value;
                }
            }
        }
        
        return result;
    }

    // =====================================
    // File Modification Application
    // =====================================

    async applyCatalogChanges(catalogConfig) {
        this.logger.info('Applying catalog configuration changes...');
        
        try {
            // Add GitHub-specific optional annotations (from README Step 7)
            const optionalGithubAnnotations = {
                'flowsource/durationInDays': '120',
                'flowsource/github-PRCycleTimeMin': '8',
                'flowsource/github-PRCycleTimeMax': '9', 
                'flowsource/github-PRReviewCycleTimeMin': '3',
                'flowsource/github-PRReviewCycleTimeMax': '6',
                'flowsource/github-PRMergeCycleTimeMin': '0',
                'flowsource/github-PRMergeCycleTimeMax': '1'
            };
            
            // Combine base catalog config with GitHub-specific optional annotations
            const allAnnotations = { ...catalogConfig, ...optionalGithubAnnotations };
            
            this.logger.debug(`📝 Adding ${Object.keys(optionalGithubAnnotations).length} GitHub-specific annotations`);
            
            // Use the generic catalog modification method
            await this.pluginReadmeParser.modifyCatalog({
                annotations: allAnnotations
            });
            
            this.logger.info('Catalog changes applied successfully');
        } catch (error) {
            this.logger.error('Failed to apply catalog changes:', error);
            throw error;
        }
    }

    async applyFrontendChanges(frontendMetadata) {
        this.logger.info('Applying frontend changes...');
        
        try {
            // Step 1, 2, 3, 4: Update EntityPage.tsx with GitHub-specific modifications
            if (frontendMetadata.imports || frontendMetadata.constants || frontendMetadata.components || 
                frontendMetadata.serviceLayout || frontendMetadata.websiteLayout) {
                await this.modifyEntityPageForGithub({
                    imports: frontendMetadata.imports,
                    constants: frontendMetadata.constants,
                    components: frontendMetadata.components,
                    serviceLayout: frontendMetadata.serviceLayout,
                    websiteLayout: frontendMetadata.websiteLayout
                });
            }
            
            // Step 5: Update App.tsx (using generic method - no GitHub-specific logic needed)
            if (frontendMetadata.appImports || frontendMetadata.appRoutes) {
                await this.pluginReadmeParser.modifyApp({
                    imports: frontendMetadata.appImports,
                    routes: frontendMetadata.appRoutes
                });
            }
            
            // Step 6: Update frontend package.json
            if (Object.keys(frontendMetadata.dependencies).length > 0) {
                await this.pluginReadmeParser.modifyPackageJson({
                    path: 'packages/app/package.json',
                    dependencies: frontendMetadata.dependencies
                });
            }
            
            this.logger.info('Frontend changes applied successfully');
        } catch (error) {
            this.logger.error('Failed to apply frontend changes:', error);
            throw error;
        }
    }

    async applyBackendChanges(backendMetadata) {
        this.logger.info('Applying backend changes...');
        
        try {
            // Step 3: Update backend index.ts
            if (backendMetadata.imports) {
                await this.pluginReadmeParser.modifyBackendIndex({
                    path: 'packages/backend/src/index.ts',
                    imports: backendMetadata.imports
                });
            }
            
            // Step 4: Update backend package.json
            if (Object.keys(backendMetadata.dependencies).length > 0) {
                await this.pluginReadmeParser.modifyPackageJson({
                    path: 'packages/backend/package.json',
                    dependencies: backendMetadata.dependencies
                });
            }
            
            this.logger.info('Backend changes applied successfully');
        } catch (error) {
            this.logger.error('Failed to apply backend changes:', error);
            throw error;
        }
    }

    // =====================================
    // GitHub-Specific File Modification Methods
    // =====================================

    /**
     * GitHub-specific EntityPage modification with proper placement logic
     * @param {Object} entityPageData - EntityPage modification data
     */
    async modifyEntityPageForGithub(entityPageData) {
        this.logger.info('🔧 Applying GitHub-specific EntityPage modifications...');
        
        try {
            const filePath = path.join(this.targetAppPath, 'packages/app/src/components/catalog/EntityPage.tsx');
            
            if (!await this.fileManager.pathExists(filePath)) {
                throw new Error(`EntityPage.tsx not found at: ${filePath}`);
            }

            let content = await this.fileManager.readFile(filePath);
            let modified = false;

            // Add imports if provided and not already present
            if (entityPageData.imports && !content.includes(entityPageData.imports.trim())) {
                this.logger.debug(`📥 Adding GitHub import`);
                content = this._addGithubImportToFile(content, entityPageData.imports);
                modified = true;
            }

            // Add constants after imports if provided and not already present  
            if (entityPageData.constants && !content.includes(entityPageData.constants.trim())) {
                this.logger.debug(`🔧 Adding GitHub constants`);
                content = this._addGithubConstantsToEntityPage(content, entityPageData.constants);
                modified = true;
            }

            // Add components after overviewContent if provided and not already present
            if (entityPageData.components && !content.includes(entityPageData.components.trim())) {
                this.logger.debug(`🧩 Adding GitHub components`);
                content = this._addGithubComponentsToEntityPage(content, entityPageData.components);
                modified = true;
            }

            // Add service layout route if provided and not already present
            if (entityPageData.serviceLayout && !content.includes(entityPageData.serviceLayout.trim())) {
                this.logger.debug(`🏗️ Adding GitHub service layout route`);
                content = this._addGithubRouteToEntityLayout(content, entityPageData.serviceLayout, 'serviceEntityPage');
                modified = true;
            }

            // Add website layout route if provided and not already present
            if (entityPageData.websiteLayout && !content.includes(entityPageData.websiteLayout.trim())) {
                this.logger.debug(`🌐 Adding GitHub website layout route`);
                content = this._addGithubRouteToEntityLayout(content, entityPageData.websiteLayout, 'websiteEntityPage');
                modified = true;
            }

            if (modified) {
                await this.fileManager.writeFile(filePath, content);
                this.logger.info(`✅ Successfully updated EntityPage.tsx with GitHub modifications`);
            } else {
                this.logger.info(`ℹ️ EntityPage.tsx - no changes needed (GitHub content already present)`);
            }

        } catch (error) {
            this.logger.error(`❌ Error applying GitHub EntityPage modifications: ${error.message}`);
            throw error;
        }
    }

    /**
     * Add GitHub import with improved detection for multi-line imports
     */
    _addGithubImportToFile(content, importStatement) {
        if (!importStatement || content.includes(importStatement.trim())) {
            return content;
        }

        // Clean the import statement by removing code block headers
        let cleanImport = importStatement.replace(/```typescript\s*/g, '').replace(/```\s*/g, '').trim();

        // Find existing imports with better multi-line support
        const lines = content.split('\n');
        let lastImportIndex = -1;
        let inMultiLineImport = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check for import statements
            if (line.startsWith('import ')) {
                lastImportIndex = i;
                // Check if it's a multi-line import
                if (!line.includes(';') && line.includes('{') && !line.includes('}')) {
                    inMultiLineImport = true;
                }
            } else if (inMultiLineImport && line.includes('}')) {
                // End of multi-line import
                lastImportIndex = i;
                inMultiLineImport = false;
            } else if (inMultiLineImport) {
                // Still inside multi-line import
                lastImportIndex = i;
            } else if (line.startsWith('const ') || line.startsWith('function ') || 
                      line.startsWith('export ') || line.includes('= (')) {
                // Hit actual code, stop looking for imports
                break;
            }
        }

        if (lastImportIndex >= 0) {
            // Insert after last import
            lines.splice(lastImportIndex + 1, 0, cleanImport);
        } else {
            // No imports found, add at the beginning
            lines.unshift(cleanImport);
        }

        return lines.join('\n');
    }

    /**
     * Add GitHub constants after imports with proper spacing
     */
    _addGithubConstantsToEntityPage(content, constantsToAdd) {
        if (!constantsToAdd || content.includes(constantsToAdd.trim())) {
            return content;
        }

        // Clean constants by removing code block headers
        let cleanConstants = constantsToAdd.replace(/```typescript\s*/g, '').replace(/```\s*/g, '').trim();

        // Find the end of all imports to place constants after them
        const lines = content.split('\n');
        let lastImportIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('import ') || 
                (line.includes('} from ') && !line.includes('const ')) || 
                line === '}') {
                lastImportIndex = i;
            } else if (line.startsWith('const ') || line.startsWith('export ') || 
                      line.startsWith('function ') || line.includes('= (')) {
                // Stop when we hit actual code definitions
                break;
            }
        }

        if (lastImportIndex >= 0) {
            // Insert constants after the last import with proper spacing
            lines.splice(lastImportIndex + 1, 0, '', cleanConstants, '');
        } else {
            // Fallback: add at beginning of file
            lines.unshift(cleanConstants, '');
        }

        return lines.join('\n');
    }

    /**
     * Add GitHub components after overviewContent with GitHub-specific placement logic
     */
    _addGithubComponentsToEntityPage(content, componentsToAdd) {
        if (!componentsToAdd || content.includes(componentsToAdd.trim())) {
            return content;
        }

        // Clean components by removing code block headers
        let cleanComponents = componentsToAdd.replace(/```typescript\s*/g, '').replace(/```\s*/g, '').trim();

        // Look for the overviewContent definition closing and add the component after it
        const overviewContentRegex = /const\s+overviewContent\s*=\s*\(([\s\S]*?)\);/;
        const match = content.match(overviewContentRegex);
        
        if (match) {
            const insertIndex = match.index + match[0].length;
            return content.slice(0, insertIndex) + '\n\n' + cleanComponents + content.slice(insertIndex);
        }

        // Alternative: Look for any const definition that ends with a Grid/JSX structure
        const componentDefRegex = /const\s+\w+Content\s*=\s*\(([\s\S]*?)\);\s*\n/;
        const componentMatch = content.match(componentDefRegex);
        
        if (componentMatch) {
            const insertIndex = componentMatch.index + componentMatch[0].length;
            return content.slice(0, insertIndex) + '\n' + cleanComponents + '\n' + content.slice(insertIndex);
        }

        // Fallback: add before the first const declaration that looks like a page component
        const serviceEntityRegex = /const\s+serviceEntityPage\s*=/;
        const serviceMatch = content.match(serviceEntityRegex);
        
        if (serviceMatch) {
            return content.slice(0, serviceMatch.index) + cleanComponents + '\n\n' + content.slice(serviceMatch.index);
        }

        // Final fallback: add at the end of the file before the last closing bracket
        return content.replace(/(\s*)}\s*$/, '\n' + cleanComponents + '\n$1}');
    }

    /**
     * Add GitHub route to EntityLayout with JSX comment fixing
     */
    _addGithubRouteToEntityLayout(content, routeToAdd, entityPageType) {
        if (!routeToAdd || content.includes(routeToAdd.trim())) {
            return content;
        }

        // Clean the route by removing code block headers
        let cleanRoute = routeToAdd.replace(/```typescript\s*/g, '').replace(/```\s*/g, '').trim();

        // Find the specific entity page definition
        const entityPageRegex = new RegExp(`const\\s+${entityPageType}\\s*=\\s*\\([\\s\\S]*?<EntityLayout>([\\s\\S]*?)<\\/EntityLayout>[\\s\\S]*?\\);`, 'i');
        const match = content.match(entityPageRegex);
        
        if (match) {
            const entityLayoutContent = match[1];
            
            // Look for the Overview route to insert after it
            const overviewRouteRegex = /<EntityLayout\.Route\s+path="\/"\s+title="Overview"[\s\S]*?<\/EntityLayout\.Route>/;
            const overviewMatch = entityLayoutContent.match(overviewRouteRegex);
            
            if (overviewMatch) {
                // Insert after the Overview route
                const overviewEnd = match.index + match[0].indexOf(overviewMatch[0]) + overviewMatch[0].length;
                return content.slice(0, overviewEnd) + '\n\n    ' + cleanRoute + '\n' + content.slice(overviewEnd);
            } else {
                // No overview route found, insert after opening EntityLayout tag
                const entityLayoutStart = match.index + match[0].indexOf('<EntityLayout>') + '<EntityLayout>'.length;
                return content.slice(0, entityLayoutStart) + '\n    ' + cleanRoute + '\n' + content.slice(entityLayoutStart);
            }
        }

        // Fallback: if we can't find the specific entity page, try to find any EntityLayout and add there
        const genericLayoutRegex = /<EntityLayout>([\s\S]*?)<\/EntityLayout>/;
        const genericMatch = content.match(genericLayoutRegex);
        
        if (genericMatch) {
            const layoutContent = genericMatch[1];
            const routeRegex = /<EntityLayout\.Route[\s\S]*?<\/EntityLayout\.Route>/g;
            const routes = [...layoutContent.matchAll(routeRegex)];
            
            if (routes.length > 0) {
                const firstRoute = routes[0];
                const insertionPoint = genericMatch.index + genericMatch[0].indexOf(firstRoute[0]) + firstRoute[0].length;
                return content.slice(0, insertionPoint) + '\n\n    ' + cleanRoute + '\n' + content.slice(insertionPoint);
            }
        }

        // Final fallback: add before the end of the file
        return content.replace(/(\s*)}\s*$/, '\n' + cleanRoute + '\n$1}');
    }
}
