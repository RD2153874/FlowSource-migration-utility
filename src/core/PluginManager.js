// PluginManager - Handles FlowSource plugin integration
import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import { GithubPluginHandler } from '../plugin_handlers/GithubPluginHandler.js';
import { FileManager } from '../utils/FileManager.js';
import YamlConfigMerger from '../utils/YamlConfigMerger.js';
import { DocumentationParser } from '../utils/DocumentationParser.js';

export class PluginManager {
    constructor(context = {}) {
        this.context = context;
        this.logger = context.logger || console;
        this.pluginsPath = context.pluginsPath || '';
        this.catalogOnboarded = false;
        
        // Initialize utility classes
        this.fileManager = new FileManager();
        this.yamlMerger = new YamlConfigMerger(this.logger);
        this.docParser = new DocumentationParser();
        
        // Enhanced context for target application paths
        this.targetAppPath = context.targetAppPath;
        this.appConfigPath = context.appConfigPath || 
            (context.targetAppPath ? path.join(context.targetAppPath, 'app-config.yaml') : null);
        
        // Source and target plugin directories
        this.sourcePluginsPath = context.workspacePath ? 
            path.join(context.workspacePath, 'plugins') : null;
        this.targetPluginsPath = context.targetAppPath ? 
            path.join(context.targetAppPath, 'plugins') : null;
        
        // Store phase3Options in context for caching support
        if (context.phase3Options) {
            this.context.phase3Options = context.phase3Options;
        }
        
        // Store catalog onboarding configuration from context
        if (context.catalogOnboarding) {
            this.context.catalogOnboarding = context.catalogOnboarding;
        }
        
        // Store GitHub repository configuration for plugin handlers that need it
        if (context.githubRepoOwner && context.githubRepoName) {
            this.context.githubRepoOwner = context.githubRepoOwner;
            this.context.githubRepoName = context.githubRepoName;
            this.logger.debug(`PluginManager: GitHub repository configuration available: ${context.githubRepoOwner}/${context.githubRepoName}`);
        }
        
        // Log the paths for debugging
        if (context.workspacePath) {
            this.logger.debug(`PluginManager: Using source package path: ${context.workspacePath}`);
            this.logger.debug(`PluginManager: Source plugins directory: ${this.sourcePluginsPath}`);
        } else {
            this.logger.debug('PluginManager: No workspacePath provided, using current working directory');
        }
        
        if (this.targetAppPath) {
            this.logger.debug(`PluginManager: Target application path: ${this.targetAppPath}`);
            this.logger.debug(`PluginManager: Target plugins directory: ${this.targetPluginsPath}`);
            this.logger.debug(`PluginManager: Target app-config.yaml: ${this.appConfigPath}`);
        } else {
            this.logger.warn('PluginManager: No targetAppPath provided - plugin copying will not be available');
        }
        
        if (context.catalogOnboarding) {
            // Handle both old and new structures for backward compatibility
            const catalogInfo = context.catalogOnboarding.choices ? 
                context.catalogOnboarding.choices.join(', ') : 
                context.catalogOnboarding.choice || 'unknown';
            this.logger.debug(`PluginManager: Catalog onboarding configuration loaded: ${catalogInfo}`);
        }
        
        // Log cached plugin metadata if available
        if (context.phase3Options?.discoveredPlugins) {
            this.logger.debug(`PluginManager: Cached plugin metadata available for ${context.phase3Options.discoveredPlugins.length} plugins`);
        }
    }

    async integratePlugins(selectedPlugins = [], catalogChoices = []) {
        try {
            this.logger.info('Starting plugin integration...');

            // Configure catalog onboarding first (only once per session)
            if (!this.catalogOnboarded && catalogChoices.length > 0) {
                await this.configureCatalogOnboarding(catalogChoices);
                this.catalogOnboarded = true;
            }

            // Use cached plugin discovery if available, otherwise discover plugins
            let availablePlugins = this.context.phase3Options?.discoveredPlugins;
            
            if (!availablePlugins || availablePlugins.length === 0) {
                this.logger.info('No cached plugin metadata found, discovering plugins...');
                availablePlugins = await this.discoverPlugins();
            } else {
                this.logger.info(`♻️  Using cached plugin metadata for ${availablePlugins.length} plugins`);
            }
            
            // Copy plugin directories first (Step 2 from Plugin-Integration.md)
            const pluginsToCopy = selectedPlugins.map(pluginName => 
                availablePlugins.find(p => p.name === pluginName)
            ).filter(plugin => plugin); // Remove any undefined plugins
            
            let copyResults = [];
            if (pluginsToCopy.length > 0) {
                copyResults = await this.copyPluginDirectories(pluginsToCopy);
            }
            
            // Integrate each selected plugin
            const results = [];
            for (const pluginName of selectedPlugins) {
                // Find plugin metadata by name
                const pluginMetadata = availablePlugins.find(p => p.name === pluginName);
                
                if (pluginMetadata) {
                    const result = await this.integratePlugin(pluginMetadata);
                    results.push(result);
                } else {
                    this.logger.warn(`Plugin ${pluginName} not found in available plugins`);
                    results.push({ plugin: pluginName, success: false, error: 'Plugin not found' });
                }
            }

            this.logger.info('Plugin integration completed');
            return {
                success: true,
                catalogOnboarded: this.catalogOnboarded,
                copyResults: copyResults,
                results: results
            };

        } catch (error) {
            this.logger.error('Plugin integration failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async configureCatalogOnboarding(choices) {
        this.logger.info(`Configuring catalog onboarding for: ${choices.join(', ')}`);
        
        try {
            // Apply catalog configuration for each selected method
            for (const choice of choices) {
                await this.applyCatalogConfig(choice);
            }
            
            // Store reference for context
            this.context.catalogOnboarding = { types: choices };
            
            this.logger.info(`Catalog onboarding configuration completed for: ${choices.join(', ')}`);
        } catch (error) {
            this.logger.error(`Failed to configure catalog onboarding: ${error.message}`);
            throw error;
        }
    }

    async applyCatalogConfig(choice) {
        this.logger.info(`Applying catalog configuration for: ${choice}`);
        
        switch (choice) {
            case 'manual':
                this.logger.info('Catalog will be registered manually via FlowSource UI');
                this.logger.info('No configuration file changes required');
                // No config changes needed - user will handle manually
                break;
                
            case 'remote':
                await this.applyRemoteCatalogConfigMerge();
                break;
                
            case 'local':
                await this.applyLocalCatalogConfigMerge();
                break;
                
            default:
                throw new Error(`Unknown catalog onboarding choice: ${choice}`);
        }
    }

    async applyRemoteCatalogConfigMerge() {
        this.logger.info('Setting up remote catalog location configuration...');
        
        // Collect user input for remote repositories
        const remoteConfig = await this.collectRemoteCatalogInput();
        
        // Create template configuration (with numbered placeholders for deployment)
        const templateCatalogConfig = {
            catalog: {
                locations: remoteConfig.repositories.map((repo, index) => ({
                    type: 'url',
                    target: `\${CATALOG_REPO_${index + 1}_URL}`,
                    rules: [{
                        allow: `\${CATALOG_REPO_${index + 1}_RULES}`
                    }]
                })),
                useUrlReadersSearch: false
            }
        };
        
        // Create value configuration (with actual values for local development)
        const valueCatalogConfig = {
            catalog: {
                locations: remoteConfig.repositories.map(repo => ({
                    type: 'url',
                    target: repo.url,
                    rules: [{
                        allow: repo.rules
                    }]
                })),
                useUrlReadersSearch: false
            }
        };
        
        // Merge template config into main app-config.yaml (preserves existing Phase 2 config)
        const appConfigPath = path.join(this.targetAppPath, 'app-config.yaml');
        await this.yamlMerger.mergeIntoYamlFile(
            appConfigPath, 
            templateCatalogConfig, 
            'Plugin Integration - Remote Catalog Onboarding'
        );
        this.logger.info('✅ Updated app-config.yaml with remote catalog locations (placeholders)');
        
        // Merge value config into app-config.local.yaml (preserves existing Phase 2 config)
        const localConfigPath = path.join(this.targetAppPath, 'app-config.local.yaml');
        if (await fsExtra.pathExists(localConfigPath)) {
            await this.yamlMerger.mergeIntoYamlFile(
                localConfigPath, 
                valueCatalogConfig, 
                'Plugin Integration - Remote Catalog Onboarding'
            );
            this.logger.info('✅ Updated app-config.local.yaml with remote catalog locations (actual values)');
            this.logger.info('🔄 Dual configuration maintained: remote catalog entries synchronized');
        } else {
            this.logger.info('ℹ️ app-config.local.yaml not found - single configuration mode');
        }
        
        this.logger.info(`Successfully configured ${remoteConfig.repositories.length} remote catalog location(s) via merge-aware updates`);
    }

    async applyLocalCatalogConfigMerge() {
        this.logger.info('Setting up local catalog configuration...');
        
        // Local catalog configuration - same for both files (no credentials involved)
        const catalogConfig = {
            catalog: {
                locations: [{
                    type: 'file',
                    target: '../../catalog-info.yaml'
                }]
            }
        };
        
        // Merge into main app-config.yaml (preserves existing Phase 2 config)
        const appConfigPath = path.join(this.targetAppPath, 'app-config.yaml');
        await this.yamlMerger.mergeIntoYamlFile(
            appConfigPath, 
            catalogConfig, 
            'Plugin Integration - Local Catalog Onboarding'
        );
        this.logger.info('✅ Updated app-config.yaml with local catalog location');
        
        // Merge into app-config.local.yaml (preserves existing Phase 2 config)
        const localConfigPath = path.join(this.targetAppPath, 'app-config.local.yaml');
        if (await fsExtra.pathExists(localConfigPath)) {
            // For catalog locations, copy exact same config to both files (no placeholders needed)
            await this.yamlMerger.mergeIntoYamlFile(
                localConfigPath, 
                catalogConfig, 
                'Plugin Integration - Local Catalog Onboarding'
            );
            this.logger.info('✅ Updated app-config.local.yaml with local catalog location');
            this.logger.info('🔄 Dual configuration maintained: local catalog entries synchronized');
        } else {
            this.logger.info('ℹ️ app-config.local.yaml not found - single configuration mode');
        }
        
        this.logger.info('Successfully configured local catalog location via merge-aware updates');
    }

    async collectRemoteCatalogInput() {
        // Get remote catalog configuration from interactive mode context
        if (!this.context.catalogOnboarding || !this.context.catalogOnboarding.configs || !this.context.catalogOnboarding.configs.remote) {
            throw new Error('Remote catalog configuration not found in context');
        }
        
        const config = this.context.catalogOnboarding.configs.remote;
        
        if (!config.repositories || !Array.isArray(config.repositories)) {
            throw new Error('Invalid remote catalog configuration: repositories array not found');
        }
        
        this.logger.info(`Processing ${config.repositories.length} remote catalog repositories`);
        
        return {
            repositories: config.repositories
        };
    }

    async discoverPlugins() {
        try {
            // Use workspacePath (which contains sourcePath) from context instead of hardcoded package name
            const pluginIntegrationPath = path.join(
                this.context.workspacePath || process.cwd(),
                'FlowSourceInstaller',
                'FlowsourceSetupDoc',
                'Plugin-Integration.md'
            );
            
            if (fs.existsSync(pluginIntegrationPath)) {
                const content = fs.readFileSync(pluginIntegrationPath, 'utf8');
                return await this.parsePluginsFromDoc(content);
            } else {
                this.logger.warn(`Plugin-Integration.md not found at ${pluginIntegrationPath}, using fallback list`);
                return await this.getFallbackPluginList();
            }
        } catch (error) {
            this.logger.warn('Error discovering plugins, using fallback:', error.message);
            return await this.getFallbackPluginList();
        }
    }

    async parsePluginsFromDoc(content) {
        const plugins = [];
        const lines = content.split('\n');
        
        let currentPlugin = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Look for plugin headers: ### AppDynamics Plugin, ### CI/CD GitHub Plugin, etc.
            if (line.startsWith('###') && line.includes('Plugin') && line !== '### Plugin Directory Setup') {
                // If we had a previous plugin being processed, add it first
                if (currentPlugin && (currentPlugin.frontendPath || currentPlugin.backendPath)) {
                    plugins.push({...currentPlugin});
                    this.logger.debug(`Added previous plugin: ${currentPlugin.name} (Frontend: ${currentPlugin.frontendPath ? 'Yes' : 'No'}, Backend: ${currentPlugin.backendPath ? 'Yes' : 'No'})`);
                }
                
                // Extract everything between ### and "Plugin" to get the full plugin name
                const match = line.match(/^###\s+(.+?)\s+Plugin\s*$/i);
                if (match) {
                    const displayName = match[1].trim();
                    
                    // Convert plugin name to lowercase and replace spaces/special chars with hyphens
                    const pluginName = displayName.toLowerCase()
                        .replace(/\s+/g, '-')           // Replace spaces with hyphens
                        .replace(/[\/\\]/g, '-')        // Replace slashes with hyphens
                        .replace(/[^\w-]/g, '')         // Remove other special characters
                        .replace(/-+/g, '-')            // Replace multiple hyphens with single
                        .replace(/^-+|-+$/g, '');       // Remove leading/trailing hyphens
                    
                    // Start new plugin
                    currentPlugin = {
                        name: pluginName,
                        displayName: displayName,
                        frontendPath: null,
                        backendPath: null
                    };
                    this.logger.debug(`Found plugin: "${displayName}" -> "${pluginName}"`);
                }
                continue;
            }
            
            // Look for frontend/backend README links
            if (currentPlugin) {
                if (line.includes('- **Frontend**:') && line.includes('[') && line.includes('README](')) {
                    const frontendMatch = line.match(/\[.*?README\]\((.*?\.md)\)/);
                    if (frontendMatch) {
                        const readmePath = frontendMatch[1];
                        const isValidPath = await this.validateReadmePath(readmePath);
                        if (isValidPath) {
                            currentPlugin.frontendPath = readmePath;
                            this.logger.debug(`Found valid frontend README: ${readmePath}`);
                        } else {
                            this.logger.warn(`Frontend README path does not exist: ${readmePath} for plugin ${currentPlugin.displayName}`);
                        }
                    }
                } else if (line.includes('- **Backend**:') && line.includes('[') && line.includes('README](')) {
                    const backendMatch = line.match(/\[.*?README\]\((.*?\.md)\)/);
                    if (backendMatch) {
                        const readmePath = backendMatch[1];
                        const isValidPath = await this.validateReadmePath(readmePath);
                        if (isValidPath) {
                            currentPlugin.backendPath = readmePath;
                            this.logger.debug(`Found valid backend README: ${readmePath}`);
                        } else {
                            this.logger.warn(`Backend README path does not exist: ${readmePath} for plugin ${currentPlugin.displayName}`);
                        }
                    }
                }
            }
        }
        
        // Handle the last plugin
        if (currentPlugin && (currentPlugin.frontendPath || currentPlugin.backendPath)) {
            plugins.push(currentPlugin);
            this.logger.debug(`Added final plugin: ${currentPlugin.name} (Frontend: ${currentPlugin.frontendPath ? 'Yes' : 'No'}, Backend: ${currentPlugin.backendPath ? 'Yes' : 'No'})`);
        }
        
        this.logger.info(`Discovered ${plugins.length} plugins from Plugin-Integration.md`);
        return plugins.length > 0 ? plugins : await this.getFallbackPluginList();
    }

    findNextNonEmptyLine(lines, currentIndex) {
        for (let i = currentIndex + 1; i < lines.length; i++) {
            if (lines[i].trim() !== '') {
                return i;
            }
        }
        return -1;
    }

    async validateReadmePath(readmePath) {
        try {
            // Handle relative paths by resolving them from the Plugin-Integration.md location
            let fullPath;
            
            if (path.isAbsolute(readmePath)) {
                // Absolute path - use as is
                fullPath = readmePath;
            } else {
                // Relative path - resolve from FlowsourceSetupDoc directory using workspacePath (sourcePath)
                const pluginIntegrationDir = path.join(
                    this.context.workspacePath || process.cwd(),
                    'FlowSourceInstaller',
                    'FlowsourceSetupDoc'
                );
                fullPath = path.resolve(pluginIntegrationDir, readmePath);
            }
            
            // Check if file exists using FileManager
            const exists = await this.fileManager.pathExists(fullPath);
            if (exists) {
                this.logger.debug(`README path validation successful: ${fullPath}`);
            } else {
                this.logger.debug(`README path validation failed: ${fullPath} (does not exist)`);
            }
            
            return exists;
        } catch (error) {
            this.logger.warn(`Error validating README path ${readmePath}:`, error.message);
            return false;
        }
    }

    async parseGenericReadme(readmePath, component) {
        const steps = [];
        
        try {
            // Resolve full path for reading using workspacePath (sourcePath)
            let fullPath;
            if (path.isAbsolute(readmePath)) {
                fullPath = readmePath;
            } else {
                const pluginIntegrationDir = path.join(
                    this.context.workspacePath || process.cwd(),
                    'FlowSourceInstaller',
                    'FlowsourceSetupDoc'
                );
                fullPath = path.resolve(pluginIntegrationDir, readmePath);
            }
            
            if (!await this.fileManager.pathExists(fullPath)) {
                throw new Error(`README file not found at ${fullPath}`);
            }
            
            // Use DocumentationParser for enhanced README parsing
            const parsedDoc = await this.docParser.parse(fullPath);
            
            // Extract integration steps from parsed documentation
            if (parsedDoc.steps && parsedDoc.steps.length > 0) {
                parsedDoc.steps.forEach(step => {
                    steps.push({
                        component: component,
                        step: step.text || step.content,
                        type: 'documentation_step'
                    });
                });
            }
            
            // Extract configuration and setup steps from code blocks (excluding package installations)
            if (parsedDoc.codeBlocks && parsedDoc.codeBlocks.length > 0) {
                parsedDoc.codeBlocks.forEach(block => {
                    // Focus on configuration files, not package installations or basic imports
                    if (['yaml', 'yml', 'json'].includes(block.language)) {
                        steps.push({
                            component: component,
                            step: `Configuration required: ${block.language.toUpperCase()} snippet found`,
                            type: 'configuration',
                            content: block.content
                        });
                    } else if (['typescript', 'javascript', 'ts', 'js'].includes(block.language)) {
                        // Only extract meaningful code snippets (not simple imports)
                        const lines = block.content.split('\n');
                        const meaningfulLines = lines.filter(line => {
                            const trimmed = line.trim();
                            return trimmed && 
                                   !trimmed.startsWith('//') && 
                                   !trimmed.startsWith('import ') && 
                                   trimmed.length > 10; // Filter out simple statements
                        });
                        
                        if (meaningfulLines.length > 2) { // Only meaningful code blocks
                            steps.push({
                                component: component,
                                step: `Code integration required: ${meaningfulLines.length} lines of setup code`,
                                type: 'code_integration',
                                preview: meaningfulLines.slice(0, 2).join('\n') + (meaningfulLines.length > 2 ? '...' : '')
                            });
                        }
                    }
                });
            }
            
            // Look for requirements
            if (parsedDoc.requirements && parsedDoc.requirements.length > 0) {
                parsedDoc.requirements.forEach(req => {
                    steps.push({
                        component: component,
                        step: `Requirement: ${req}`,
                        type: 'requirement'
                    });
                });
            }
            
            // If no specific steps found, add general integration step
            if (steps.length === 0) {
                steps.push({
                    component: component,
                    step: 'Follow README instructions for manual integration',
                    type: 'manual_integration'
                });
            }
            
        } catch (error) {
            this.logger.debug(`Error parsing README ${readmePath}:`, error.message);
            throw error;
        }
        
        return steps;
    }

    async getFallbackPluginList() {
        // Return basic plugin metadata for fallback with multi-word plugin examples
        this.logger.info('Using fallback plugin list with path validation...');
        
        const fallbackPlugins = [
            {
                name: 'appdynamics',
                displayName: 'AppDynamics',
                frontendPath: '../../plugins/flowsource-appdynamics/README.md',
                backendPath: '../../plugins/flowsource-appdynamics-backend/README.md'
            },
            {
                name: 'aws-fault-injection',
                displayName: 'AWS Fault Injection',
                frontendPath: '../../plugins/flowsource-aws-fault-injection/README.md',
                backendPath: '../../plugins/flowsource-aws-fault-injection-backend/README.md'
            },
            {
                name: 'azure-devops-work-items',
                displayName: 'Azure DevOps Work Items',
                frontendPath: '../../plugins/flowsource-azure-devops-workitems/README.md',
                backendPath: '../../plugins/flowsource-azure-devops-workitems-backend/README.md'
            },
            {
                name: 'cicd-aws',
                displayName: 'CI/CD AWS',
                frontendPath: '../../plugins/flowsource-cicd-aws/README.md',
                backendPath: '../../plugins/flowsource-cicd-aws-backend/README.md'
            },
            {
                name: 'cicd-github',
                displayName: 'CI/CD GitHub',
                frontendPath: '../../plugins/flowsource-cicd-github-frontend/README.md',
                backendPath: '../../plugins/flowsource-cicd-github-backend/README.md'
            },
            {
                name: 'github',
                displayName: 'GitHub',
                frontendPath: '../../plugins/flowsource-github/README.md',
                backendPath: '../../plugins/flowsource-github-backend/README.md'
            },
            {
                name: 'github-copilot',
                displayName: 'GitHub Copilot',
                frontendPath: '../../plugins/flowsource-github-copilot/README.md',
                backendPath: '../../plugins/flowsource-github-copilot-backend/README.md'
            },
            {
                name: 'jira',
                displayName: 'Jira',
                frontendPath: '../../plugins/flowsource-jira/README.md',
                backendPath: '../../plugins/flowsource-jira-backend/README.md'
            },
            {
                name: 'datadog',
                displayName: 'Datadog',
                frontendPath: '../../plugins/flowsource-datadog/README.md',
                backendPath: '../../plugins/flowsource-datadog-backend/README.md'
            },
            {
                name: 'dashboard',
                displayName: 'Dashboard',
                frontendPath: '../../plugins/flowsource-dashboard/README.md',
                backendPath: null  // Dashboard plugin has no backend
            },
            {
                name: 'infra-provision',
                displayName: 'Infrastructure Provision',
                frontendPath: '../../plugins/flowsource-infra-provision/README.md',
                backendPath: null  // Infrastructure Provision plugin has no backend
            },
            {
                name: 'testing',
                displayName: 'Testing',
                frontendPath: '../../plugins/flowsource-testing/README.md',
                backendPath: null  // Testing plugin has no backend
            }
        ];

        // Validate README paths for fallback plugins
        const validatedPlugins = [];
        for (const plugin of fallbackPlugins) {
            const validatedPlugin = { ...plugin };
            
            if (plugin.frontendPath && !(await this.validateReadmePath(plugin.frontendPath))) {
                this.logger.warn(`Fallback plugin ${plugin.displayName}: Frontend README not found at ${plugin.frontendPath}`);
                validatedPlugin.frontendPath = null;
            }
            
            if (plugin.backendPath && !(await this.validateReadmePath(plugin.backendPath))) {
                this.logger.warn(`Fallback plugin ${plugin.displayName}: Backend README not found at ${plugin.backendPath}`);
                validatedPlugin.backendPath = null;
            }
            
            if (validatedPlugin.frontendPath || validatedPlugin.backendPath) {
                validatedPlugins.push(validatedPlugin);
            }
        }
        
        return validatedPlugins;
    }

    async integratePlugin(pluginMetadata) {
        try {
            this.logger.info(`Integrating plugin: ${pluginMetadata.name}`);
            
            // Use existing external plugin handler with metadata references
            const handler = this.createPluginHandler(pluginMetadata);
            
            // Execute plugin integration
            const result = await handler.integrate(this.context);
            
            this.logger.info(`Plugin ${pluginMetadata.name} integrated successfully`);
            return {
                plugin: pluginMetadata.name,
                success: true,
                result: result
            };
            
        } catch (error) {
            this.logger.error(`Failed to integrate plugin ${pluginMetadata.name}:`, error);
            return {
                plugin: pluginMetadata.name,
                success: false,
                error: error.message
            };
        }
    }

    createPluginHandler(pluginMetadata) {
        // Use existing external handler and pass plugin references
        switch (pluginMetadata.name.toLowerCase()) {
            case 'github':
                this.logger.info(`🔧 GithubPluginHandler called for ${pluginMetadata.displayName} plugin`);
                this.logger.info(`  - Frontend path: ${pluginMetadata.frontendPath}`);
                this.logger.info(`  - Backend path: ${pluginMetadata.backendPath}`);
                this.logger.info(`  - Context workspace: ${this.context.workspacePath}`);

                // Create and return the actual GithubPluginHandler with full context
                return new GithubPluginHandler(pluginMetadata, this.context);
            default:
                // Enhanced generic handler with README parsing and sophisticated integration
                this.logger.warn(`No specific handler found for ${pluginMetadata.name}, using enhanced generic integration`);
                return {
                    integrate: async (context) => {
                        this.logger.info(`Enhanced generic integration for ${pluginMetadata.displayName} plugin:`);
                        this.logger.info(`  - Plugin name: ${pluginMetadata.name}`);
                        this.logger.info(`  - Display name: ${pluginMetadata.displayName}`);
                        
                        const integrationSteps = [];
                        
                        // Process frontend component if available
                        if (pluginMetadata.frontendPath) {
                            this.logger.info(`  - Frontend README: ${pluginMetadata.frontendPath}`);
                            try {
                                const frontendSteps = await this.parseGenericReadme(pluginMetadata.frontendPath, 'Frontend');
                                integrationSteps.push(...frontendSteps);
                            } catch (error) {
                                this.logger.warn(`    Failed to parse frontend README: ${error.message}`);
                                integrationSteps.push({
                                    component: 'Frontend',
                                    step: 'Manual integration required',
                                    reason: 'README parsing failed',
                                    path: pluginMetadata.frontendPath
                                });
                            }
                        }
                        
                        // Process backend component if available
                        if (pluginMetadata.backendPath) {
                            this.logger.info(`  - Backend README: ${pluginMetadata.backendPath}`);
                            try {
                                const backendSteps = await this.parseGenericReadme(pluginMetadata.backendPath, 'Backend');
                                integrationSteps.push(...backendSteps);
                            } catch (error) {
                                this.logger.warn(`    Failed to parse backend README: ${error.message}`);
                                integrationSteps.push({
                                    component: 'Backend',
                                    step: 'Manual integration required',
                                    reason: 'README parsing failed',
                                    path: pluginMetadata.backendPath
                                });
                            }
                        }
                        
                        // Log integration steps
                        if (integrationSteps.length > 0) {
                            this.logger.info(`  - Integration steps identified:`);
                            integrationSteps.forEach((step, index) => {
                                this.logger.info(`    ${index + 1}. [${step.component}] ${step.step}`);
                            });
                        }
                        
                        // Return comprehensive result
                        return {
                            message: `Enhanced generic integration completed for ${pluginMetadata.displayName} plugin`,
                            metadata: pluginMetadata,
                            status: 'completed',
                            integrationSteps: integrationSteps,
                            componentsProcessed: {
                                frontend: pluginMetadata.frontendPath ? true : false,
                                backend: pluginMetadata.backendPath ? true : false
                            },
                            recommendedAction: integrationSteps.length > 0 ? 
                                'Review integration steps and implement manually' : 
                                'Plugin metadata logged, manual integration required'
                        };
                    }
                };
        }
    }

    async copyPluginDirectories(pluginsMetadata) {
        this.logger.info('Starting plugin directory copying (Step 2: Plugin Directory Setup)...');
        
        // Validate paths
        if (!this.sourcePluginsPath) {
            throw new Error('Source plugins path not available - workspacePath required in context');
        }
        
        if (!this.targetPluginsPath) {
            throw new Error('Target plugins path not available - targetAppPath required in context');
        }
        
        // Ensure target plugins directory exists
        await this.fileManager.ensureDir(this.targetPluginsPath);
        
        const copyResults = [];
        
        for (const plugin of pluginsMetadata) {
            this.logger.info(`Copying plugin directories for: ${plugin.displayName}`);
            
            const pluginCopyResult = {
                plugin: plugin.name,
                displayName: plugin.displayName,
                frontend: { attempted: false, success: false, source: null, destination: null },
                backend: { attempted: false, success: false, source: null, destination: null }
            };
            
            // Copy frontend plugin directory if it has frontend component
            if (plugin.frontendPath) {
                const frontendDirName = this.extractPluginDirNameFromPath(plugin.frontendPath, 'frontend');
                if (frontendDirName) {
                    const sourceFrontend = path.join(this.sourcePluginsPath, frontendDirName);
                    const targetFrontend = path.join(this.targetPluginsPath, frontendDirName);
                    
                    pluginCopyResult.frontend.attempted = true;
                    pluginCopyResult.frontend.source = sourceFrontend;
                    pluginCopyResult.frontend.destination = targetFrontend;
                    
                    try {
                        // Check if source directory exists
                        if (await this.fileManager.pathExists(sourceFrontend)) {
                            await this.fileManager.copyDirectory(sourceFrontend, targetFrontend);
                            pluginCopyResult.frontend.success = true;
                            this.logger.info(`  ✅ Frontend copied: ${frontendDirName}`);
                        } else {
                            this.logger.warn(`  ⚠️  Frontend directory not found: ${sourceFrontend}`);
                        }
                    } catch (error) {
                        this.logger.error(`  ❌ Failed to copy frontend: ${error.message}`);
                    }
                }
            }
            
            // Copy backend plugin directory if it has backend component
            if (plugin.backendPath) {
                const backendDirName = this.extractPluginDirNameFromPath(plugin.backendPath, 'backend');
                if (backendDirName) {
                    const sourceBackend = path.join(this.sourcePluginsPath, backendDirName);
                    const targetBackend = path.join(this.targetPluginsPath, backendDirName);
                    
                    pluginCopyResult.backend.attempted = true;
                    pluginCopyResult.backend.source = sourceBackend;
                    pluginCopyResult.backend.destination = targetBackend;
                    
                    try {
                        // Check if source directory exists
                        if (await this.fileManager.pathExists(sourceBackend)) {
                            await this.fileManager.copyDirectory(sourceBackend, targetBackend);
                            pluginCopyResult.backend.success = true;
                            this.logger.info(`  ✅ Backend copied: ${backendDirName}`);
                        } else {
                            this.logger.warn(`  ⚠️  Backend directory not found: ${sourceBackend}`);
                        }
                    } catch (error) {
                        this.logger.error(`  ❌ Failed to copy backend: ${error.message}`);
                    }
                }
            }
            
            copyResults.push(pluginCopyResult);
        }
        
        // Log summary
        const totalAttempted = copyResults.reduce((sum, result) => 
            sum + (result.frontend.attempted ? 1 : 0) + (result.backend.attempted ? 1 : 0), 0);
        const totalSuccessful = copyResults.reduce((sum, result) => 
            sum + (result.frontend.success ? 1 : 0) + (result.backend.success ? 1 : 0), 0);
        
        this.logger.info(`Plugin directory copying completed: ${totalSuccessful}/${totalAttempted} directories copied successfully`);
        
        return copyResults;
    }

    extractPluginDirNameFromPath(readmePath, component) {
        // Extract plugin directory name from README path
        // e.g., "../../plugins/flowsource-jira/README.md" -> "flowsource-jira"
        // e.g., "../../plugins/flowsource-jira-backend/README.md" -> "flowsource-jira-backend"
        
        try {
            const normalizedPath = readmePath.replace(/\\/g, '/');
            const pathParts = normalizedPath.split('/');
            
            // Find the part that contains the plugin directory name
            const pluginDirIndex = pathParts.findIndex(part => part.includes('flowsource-'));
            
            if (pluginDirIndex !== -1) {
                return pathParts[pluginDirIndex];
            }
            
            // Fallback: try to extract from the second-to-last part (assuming README.md is last)
            if (pathParts.length >= 2) {
                const dirName = pathParts[pathParts.length - 2];
                if (dirName.includes('flowsource-')) {
                    return dirName;
                }
            }
            
            this.logger.warn(`Could not extract plugin directory name from path: ${readmePath}`);
            return null;
        } catch (error) {
            this.logger.error(`Error extracting plugin directory name from ${readmePath}: ${error.message}`);
            return null;
        }
    }
}
