/**
 * PluginReadmeParser - Generic file modification utilities for plugin integration
 * 
 * This class provides generic file modification methods for the 6 key files that
 * need modification during plugin integration. Plugin-specific parsing and content
 * generation should be handled by individual plugin handlers.
 * 
 * Key Files Handled:
 * 1. packages/app/src/components/catalog/EntityPage.tsx
 * 2. packages/app/src/App.tsx
 * 3. catalog-info.yaml
 * 4. packages/app/package.json
 * 5. packages/backend/package.json
 * 6. packages/backend/src/index.ts
 */

import { DocumentationParser } from '../utils/DocumentationParser.js';
import { FileManager } from '../utils/FileManager.js';
import YamlConfigMerger from '../utils/YamlConfigMerger.js';
import path from 'path';

class PluginReadmeParser {
    constructor(targetAppPath, logger) {
        this.targetAppPath = targetAppPath;
        this.logger = logger;
        this.documentationParser = new DocumentationParser();
        this.fileManager = new FileManager();
        this.yamlConfigMerger = new YamlConfigMerger(logger);
    }

    /**
     * Generic method to modify EntityPage.tsx file
     * @param {Object} entityPageData - EntityPage modification data
     * @param {string} entityPageData.imports - Import statements to add
     * @param {string} entityPageData.constants - Constants to add
     * @param {string} entityPageData.components - Component definitions to add
     * @param {string} entityPageData.serviceLayout - Service layout modifications
     * @param {string} entityPageData.websiteLayout - Website layout modifications
     */
    async modifyEntityPage(entityPageData) {
        this.logger.info('🔧 Modifying EntityPage.tsx...');
        
        try {
            const filePath = path.join(this.targetAppPath, 'packages/app/src/components/catalog/EntityPage.tsx');
            this.logger.debug(`📁 Target file path: ${filePath}`);
            
            if (!await this.fileManager.pathExists(filePath)) {
                this.logger.error(`❌ EntityPage.tsx not found at: ${filePath}`);
                throw new Error(`EntityPage.tsx not found at: ${filePath}`);
            }

            let content = await this.fileManager.readFile(filePath);
            this.logger.debug(`📖 Original file size: ${content.length} characters`);
            
            let modified = false;

            // Add imports if provided and not already present
            if (entityPageData.imports && !content.includes(entityPageData.imports.trim())) {
                this.logger.debug(`📥 Adding import: ${entityPageData.imports}`);
                content = this._addImportToFile(content, entityPageData.imports);
                modified = true;
            }

            // Add constants after imports if provided and not already present
            if (entityPageData.constants && !content.includes(entityPageData.constants.trim())) {
                this.logger.debug(`🔧 Adding constants: ${entityPageData.constants.length} characters`);
                content = this._addConstantsToEntityPage(content, entityPageData.constants);
                modified = true;
            }

            // Add components before entity page definitions if provided and not already present
            if (entityPageData.components && !content.includes(entityPageData.components.trim())) {
                this.logger.debug(`🧩 Adding components: ${entityPageData.components.length} characters`);
                content = this._addComponentsToEntityPage(content, entityPageData.components);
                modified = true;
            }

            // Add service layout route if provided and not already present
            if (entityPageData.serviceLayout && !content.includes(entityPageData.serviceLayout.trim())) {
                this.logger.debug(`🏗️ Adding service layout route`);
                content = this._addRouteToEntityLayout(content, entityPageData.serviceLayout, 'serviceEntityPage');
                modified = true;
            }

            // Add website layout route if provided and not already present
            if (entityPageData.websiteLayout && !content.includes(entityPageData.websiteLayout.trim())) {
                this.logger.debug(`🌐 Adding website layout route`);
                content = this._addRouteToEntityLayout(content, entityPageData.websiteLayout, 'websiteEntityPage');
                modified = true;
            }

            if (modified) {
                await this.fileManager.writeFile(filePath, content);
                this.logger.info(`✅ Successfully updated EntityPage.tsx`);
                this.logger.debug(`📝 Modified file size: ${content.length} characters`);
            } else {
                this.logger.info(`ℹ️ EntityPage.tsx - no changes needed (content already present)`);
            }

        } catch (error) {
            this.logger.error(`❌ Error modifying EntityPage.tsx: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generic method to modify App.tsx file
     * @param {Object} appData - App modification data
     * @param {string} appData.imports - Import statements to add
     * @param {string} appData.routes - Route definitions to add
     */
    async modifyApp(appData) {
        this.logger.info('🔧 Modifying App.tsx...');
        
        try {
            const filePath = path.join(this.targetAppPath, 'packages/app/src/App.tsx');
            this.logger.debug(`📁 Target file path: ${filePath}`);
            
            if (!await this.fileManager.pathExists(filePath)) {
                this.logger.error(`❌ App.tsx not found at: ${filePath}`);
                throw new Error(`App.tsx not found at: ${filePath}`);
            }

            let content = await this.fileManager.readFile(filePath);
            this.logger.debug(`📖 Original file size: ${content.length} characters`);
            
            let modified = false;

            // Add imports if provided and not already present
            if (appData.imports && !content.includes(appData.imports.trim())) {
                this.logger.debug(`📥 Adding import: ${appData.imports}`);
                content = this._addImportToFile(content, appData.imports);
                modified = true;
            }

            // Add routes if provided and not already present
            if (appData.routes && !content.includes(appData.routes.trim())) {
                this.logger.debug(`🛣️ Adding route: ${appData.routes}`);
                content = this._addRouteToApp(content, appData.routes);
                modified = true;
            }

            if (modified) {
                await this.fileManager.writeFile(filePath, content);
                this.logger.info(`✅ Successfully updated App.tsx`);
                this.logger.debug(`📝 Modified file size: ${content.length} characters`);
            } else {
                this.logger.info(`ℹ️ App.tsx - no changes needed (content already present)`);
            }

        } catch (error) {
            this.logger.error(`❌ Error modifying App.tsx: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generic method to modify catalog-info.yaml file
     * @param {Object} catalogData - Catalog modification data
     * @param {Object} catalogData.annotations - Annotations to add/merge
     */
    async modifyCatalog(catalogData) {
        this.logger.info('🔧 Modifying catalog-info.yaml...');
        
        try {
            const filePath = path.join(this.targetAppPath, 'catalog-info.yaml');
            this.logger.debug(`📁 Target file path: ${filePath}`);
            
            if (!await this.fileManager.pathExists(filePath)) {
                this.logger.error(`❌ catalog-info.yaml not found at: ${filePath}`);
                throw new Error(`catalog-info.yaml not found at: ${filePath}`);
            }

            // Use YamlConfigMerger to add annotations
            const catalogConfig = {
                metadata: {
                    annotations: catalogData.annotations
                }
            };

            this.logger.debug(`📝 Adding annotations: ${Object.keys(catalogData.annotations).join(', ')}`);
            
            await this.yamlConfigMerger.mergeIntoYamlFile(filePath, catalogConfig);
            this.logger.info(`✅ Successfully updated catalog-info.yaml`);

        } catch (error) {
            this.logger.error(`❌ Error modifying catalog-info.yaml: ${error.message}`);
            throw error;
        }
    }



    /**
     * Modify package.json file with plugin dependencies
     * @param {Object} packageData - Package modification data
     * @param {string} packageData.path - Path to package.json file
     * @param {Object} packageData.dependencies - Dependencies to add
     * @param {Object} packageData.devDependencies - Dev dependencies to add
     */
    async modifyPackageJson(packageData) {
        this.logger.info(`📦 Modifying package.json at: ${packageData.path}`);
        
        try {
            const filePath = path.join(this.targetAppPath, packageData.path);
            
            if (!await this.fileManager.pathExists(filePath)) {
                this.logger.error(`❌ Package.json file not found: ${filePath}`);
                throw new Error(`Package.json file not found: ${packageData.path}`);
            }
            
            const content = await this.fileManager.readFile(filePath);
            const packageJson = JSON.parse(content);
            
            let modified = false;
            
            // Add dependencies
            if (packageData.dependencies) {
                if (!packageJson.dependencies) {
                    packageJson.dependencies = {};
                }
                
                for (const [dep, version] of Object.entries(packageData.dependencies)) {
                    if (!packageJson.dependencies[dep]) {
                        packageJson.dependencies[dep] = version;
                        modified = true;
                        this.logger.debug(`➕ Added dependency: ${dep}@${version}`);
                    }
                }
            }
            
            // Add devDependencies
            if (packageData.devDependencies) {
                if (!packageJson.devDependencies) {
                    packageJson.devDependencies = {};
                }
                
                for (const [dep, version] of Object.entries(packageData.devDependencies)) {
                    if (!packageJson.devDependencies[dep]) {
                        packageJson.devDependencies[dep] = version;
                        modified = true;
                        this.logger.debug(`➕ Added devDependency: ${dep}@${version}`);
                    }
                }
            }
            
            if (modified) {
                await this.fileManager.writeFile(filePath, JSON.stringify(packageJson, null, 2));
                this.logger.info(`✅ Successfully modified package.json`);
            } else {
                this.logger.info(`ℹ️ No changes needed for package.json`);
            }
            
        } catch (error) {
            this.logger.error(`❌ Error modifying package.json: ${error.message}`);
            throw error;
        }
    }

    /**
     * Modify backend index.ts file with plugin integrations
     * @param {Object} backendData - Backend modification data
     * @param {string} backendData.path - Path to backend index.ts file
     * @param {string} backendData.imports - Import statements to add
     * @param {string} backendData.plugins - Plugin registrations to add
     */
    async modifyBackendIndex(backendData) {
        this.logger.info(`🔧 Modifying backend index.ts at: ${backendData.path}`);
        
        try {
            const filePath = path.join(this.targetAppPath, backendData.path);
            
            if (!await this.fileManager.pathExists(filePath)) {
                this.logger.error(`❌ Backend index file not found: ${filePath}`);
                throw new Error(`Backend index file not found: ${backendData.path}`);
            }
            
            let content = await this.fileManager.readFile(filePath);
            let modified = false;
            
            // Add backend plugin registrations (backend.add() statements)
            if (backendData.imports && !content.includes(backendData.imports.trim())) {
                if (backendData.imports.includes('backend.add(')) {
                    // This is a backend plugin registration, not a regular import
                    content = this._addBackendPluginRegistration(content, backendData.imports);
                } else {
                    // This is a regular import statement
                    content = this._addImportToFile(content, backendData.imports);
                }
                modified = true;
                this.logger.debug(`➕ Added backend plugin registration`);
            }
            
            // Add plugin registrations
            if (backendData.plugins && !content.includes(backendData.plugins.trim())) {
                content = this._addPluginToBackend(content, backendData.plugins);
                modified = true;
                this.logger.debug(`➕ Added plugin registration to backend`);
            }
            
            if (modified) {
                await this.fileManager.writeFile(filePath, content);
                this.logger.info(`✅ Successfully modified backend index.ts`);
            } else {
                this.logger.info(`ℹ️ No changes needed for backend index.ts`);
            }
            
        } catch (error) {
            this.logger.error(`❌ Error modifying backend index.ts: ${error.message}`);
            throw error;
        }
    }

    // =====================================
    // Private Helper Methods for File Modifications
    // =====================================

    /**
     * Add import statements to a file content
     * @param {string} content - File content
     * @param {string} importStatement - Import statement to add
     * @returns {string} Modified content
     */
    _addImportToFile(content, importStatement) {
        if (!importStatement || content.includes(importStatement.trim())) {
            return content;
        }

        // Clean the import statement by removing code block headers
        let cleanImport = importStatement.replace(/```typescript\s*/g, '').replace(/```\s*/g, '').trim();

        // Find existing imports and add after them
        const lines = content.split('\n');
        let lastImportIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ')) {
                lastImportIndex = i;
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
     * Add constants to EntityPage component
     * @param {string} content - File content
     * @param {string} constantsToAdd - Constants to add
     * @returns {string} Modified content
     */
    _addConstantsToEntityPage(content, constantsToAdd) {
        if (!constantsToAdd || content.includes(constantsToAdd.trim())) {
            return content;
        }

        // Clean constants by removing code block headers
        let cleanConstants = constantsToAdd.replace(/```typescript\s*/g, '').replace(/```\s*/g, '').trim();

        // Find the component definition and add constants before it
        const componentRegex = /const\s+EntityPage\s*=|export\s+const\s+EntityPage\s*=/;
        const match = content.match(componentRegex);
        
        if (match) {
            const insertIndex = match.index;
            return content.slice(0, insertIndex) + cleanConstants + '\n\n' + content.slice(insertIndex);
        }

        // If no component found, add at the end of imports section
        const lines = content.split('\n');
        let insertIndex = 0;
        
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i].trim().startsWith('import ') && lines[i].trim() !== '') {
                insertIndex = i;
                break;
            }
        }

        lines.splice(insertIndex, 0, constantsToAdd, '');
        return lines.join('\n');
    }

    /**
     * Add components to EntityPage component
     * @param {string} content - File content
     * @param {string} componentsToAdd - Components to add
     * @returns {string} Modified content
     */
    _addComponentsToEntityPage(content, componentsToAdd) {
        if (!componentsToAdd || content.includes(componentsToAdd.trim())) {
            return content;
        }

        // Look for the service entity case or overview content
        const serviceRegex = /<EntityLayout\.Route\s+path="\/"\s+title="Overview"[\s\S]*?<\/EntityLayout\.Route>/;
        const match = content.match(serviceRegex);
        
        if (match) {
            // Find the Grid container and add the component
            const gridRegex = /(<Grid\s+container\s+spacing[^>]*>)([\s\S]*?)(<\/Grid>)/;
            const gridMatch = content.match(gridRegex);
            
            if (gridMatch) {
                const beforeGrid = content.substring(0, gridMatch.index + gridMatch[1].length);
                const afterGrid = content.substring(gridMatch.index + gridMatch[1].length + gridMatch[2].length);
                return beforeGrid + gridMatch[2] + '\n' + componentsToAdd + '\n' + afterGrid;
            }
        }

        // If no specific location found, add before the closing of the service entity case
        const serviceCloseRegex = /(\s*<\/EntityLayout>[\s\S]*?case\s+'service':[\s\S]*?)(\s*break;)/;
        const serviceClose = content.match(serviceCloseRegex);
        
        if (serviceClose) {
            return content.replace(serviceCloseRegex, serviceClose[1] + '\n' + componentsToAdd + '\n' + serviceClose[2]);
        }

        // Fallback: add at the end of the file before the last closing bracket
        return content.replace(/(\s*)}\s*$/, '\n' + componentsToAdd + '\n$1}');
    }

    /**
     * Add route to App component
     * @param {string} content - File content
     * @param {string} routeToAdd - Route to add
     * @returns {string} Modified content
     */
    _addRouteToApp(content, routeToAdd) {
        if (!routeToAdd || content.includes(routeToAdd.trim())) {
            return content;
        }

        // Clean the route by removing code block headers
        let cleanRoute = routeToAdd.replace(/```typescript\s*/g, '').replace(/```\s*/g, '').trim();

        // Look for existing routes and add the new route
        const routesRegex = /<FlatRoutes>([\s\S]*?)<\/FlatRoutes>/;
        const match = content.match(routesRegex);
        
        if (match) {
            const routesContent = match[1];
            // Get proper indentation by looking at existing routes
            const routeLines = routesContent.split('\n');
            let indent = '    '; // default indentation
            
            // Find indentation from existing routes
            for (let line of routeLines) {
                if (line.trim().startsWith('<Route')) {
                    const leadingSpaces = line.match(/^(\s*)/)[1];
                    if (leadingSpaces.length > 0) {
                        indent = leadingSpaces;
                        break;
                    }
                }
            }
            
            // Add proper indentation to the new route
            const indentedRoute = indent + cleanRoute;
            const newRoutesContent = routesContent + '\n' + indentedRoute;
            return content.replace(routesRegex, `<FlatRoutes>${newRoutesContent}\n</FlatRoutes>`);
        }

        // If no FlatRoutes found, look for Route components
        const routeRegex = /(<Route[^>]*\/>|<Route[^>]*>[\s\S]*?<\/Route>)/g;
        const routes = content.match(routeRegex);
        
        if (routes && routes.length > 0) {
            // Add after the last route
            const lastRoute = routes[routes.length - 1];
            const lastRouteIndex = content.lastIndexOf(lastRoute);
            const insertIndex = lastRouteIndex + lastRoute.length;
            return content.slice(0, insertIndex) + '\n' + cleanRoute + content.slice(insertIndex);
        }

        // Fallback: add before the closing of the App component
        return content.replace(/(\s*<\/.*>[\s\S]*?function\s+App\(\)[\s\S]*?)(\s*}\s*export)/, '$1\n' + cleanRoute + '\n$2');
    }

    /**
     * Add route to Entity Layout (service or website entity page)
     * @param {string} content - File content
     * @param {string} routeToAdd - Route layout to add
     * @param {string} entityPageType - Type of entity page (serviceEntityPage or websiteEntityPage)
     * @returns {string} Modified content
     */
    _addRouteToEntityLayout(content, routeToAdd, entityPageType) {
        if (!routeToAdd || content.includes(routeToAdd.trim())) {
            return content;
        }

        // Find the specific entity page (serviceEntityPage or websiteEntityPage)
        const entityPageRegex = new RegExp(`const\\s+${entityPageType}\\s*=\\s*\\([\\s\\S]*?<EntityLayout>([\\s\\S]*?)<\\/EntityLayout>[\\s\\S]*?\\);?`, 'i');
        const match = content.match(entityPageRegex);
        
        if (match) {
            const entityLayoutContent = match[1];
            
            // Look for existing EntityLayout.Route elements to insert between them
            const routeRegex = /<EntityLayout\.Route[\s\S]*?<\/EntityLayout\.Route>/g;
            const existingRoutes = [...entityLayoutContent.matchAll(routeRegex)];
            
            if (existingRoutes.length > 0) {
                // Find a good insertion point (after the first route or before the last route)
                const firstRoute = existingRoutes[0];
                const insertionPoint = match.index + match[0].indexOf(firstRoute[0]) + firstRoute[0].length;
                
                return content.slice(0, insertionPoint) + '\n\n    ' + routeToAdd + '\n' + content.slice(insertionPoint);
            } else {
                // No existing routes found, add after the opening EntityLayout tag
                const entityLayoutStart = match.index + match[0].indexOf('<EntityLayout>') + '<EntityLayout>'.length;
                
                return content.slice(0, entityLayoutStart) + '\n    ' + routeToAdd + '\n' + content.slice(entityLayoutStart);
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
                const lastRoute = routes[routes.length - 1];
                const insertionPoint = genericMatch.index + genericMatch[0].indexOf(lastRoute[0]) + lastRoute[0].length;
                
                return content.slice(0, insertionPoint) + '\n\n    ' + routeToAdd + '\n' + content.slice(insertionPoint);
            }
        }

        // Final fallback: add before the end of the file
        return content.replace(/(\s*)}\s*$/, '\n' + routeToAdd + '\n$1}');
    }

    /**
     * Add backend plugin registration to backend index
     * Ensures proper placement before backend.start()
     * @param {string} content - File content
     * @param {string} pluginRegistration - Backend plugin registration statement
     * @returns {string} Modified content
     */
    _addBackendPluginRegistration(content, pluginRegistration) {
        if (!pluginRegistration || content.includes(pluginRegistration.trim())) {
            return content;
        }

        const lines = content.split('\n');
        let backendStartIndex = -1;
        
        // Find the backend.start() line
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === 'backend.start();') {
                backendStartIndex = i;
                break;
            }
        }

        if (backendStartIndex >= 0) {
            // Insert before backend.start(), after an empty line if needed
            const insertIndex = backendStartIndex;
            
            // Check if there's already an empty line before backend.start()
            if (insertIndex > 0 && lines[insertIndex - 1].trim() !== '') {
                lines.splice(insertIndex, 0, '', pluginRegistration);
            } else {
                lines.splice(insertIndex, 0, pluginRegistration);
            }
        } else {
            // If backend.start() not found, add at the end
            this.logger.warn('backend.start() not found, adding plugin registration at end of file');
            lines.push('', pluginRegistration);
        }

        return lines.join('\n');
    }

    // =====================================
    // Private Validation Methods
    // =====================================

    async _validateCatalogModifications(catalogData) {
        try {
            const filePath = path.join(this.targetAppPath, 'catalog-info.yaml');
            const content = await this.fileManager.readFile(filePath);
            
            let validCount = 0;
            let totalCount = 0;
            const missingAnnotations = [];

            for (const [key, value] of Object.entries(catalogData.annotations)) {
                totalCount++;
                if (content.includes(`${key}:`) && content.includes(value)) {
                    validCount++;
                } else {
                    missingAnnotations.push(key);
                }
            }

            const isValid = validCount === totalCount;
            const details = isValid 
                ? `All ${totalCount} annotations found` 
                : `Missing annotations: ${missingAnnotations.join(', ')}`;

            return { valid: isValid, details };
        } catch (error) {
            return { valid: false, details: `Validation error: ${error.message}` };
        }
    }

    async _validateEntityPageModifications(entityPageData) {
        try {
            const filePath = path.join(this.targetAppPath, 'packages/app/src/components/catalog/EntityPage.tsx');
            const content = await this.fileManager.readFile(filePath);
            
            const checks = [];
            if (entityPageData.imports) checks.push({ name: 'imports', content: entityPageData.imports });
            if (entityPageData.constants) checks.push({ name: 'constants', content: entityPageData.constants });
            if (entityPageData.components) checks.push({ name: 'components', content: entityPageData.components });
            if (entityPageData.serviceLayout) checks.push({ name: 'serviceLayout', content: entityPageData.serviceLayout });
            if (entityPageData.websiteLayout) checks.push({ name: 'websiteLayout', content: entityPageData.websiteLayout });

            let validCount = 0;
            const missing = [];

            for (const check of checks) {
                if (content.includes(check.content.trim())) {
                    validCount++;
                } else {
                    missing.push(check.name);
                }
            }

            const isValid = validCount === checks.length;
            const details = isValid 
                ? `All ${checks.length} modifications found` 
                : `Missing: ${missing.join(', ')}`;

            return { valid: isValid, details };
        } catch (error) {
            return { valid: false, details: `Validation error: ${error.message}` };
        }
    }

    async _validateAppModifications(appData) {
        try {
            const filePath = path.join(this.targetAppPath, 'packages/app/src/App.tsx');
            const content = await this.fileManager.readFile(filePath);
            
            const checks = [];
            if (appData.imports) checks.push({ name: 'imports', content: appData.imports });
            if (appData.routes) checks.push({ name: 'routes', content: appData.routes });

            let validCount = 0;
            const missing = [];

            for (const check of checks) {
                if (content.includes(check.content.trim())) {
                    validCount++;
                } else {
                    missing.push(check.name);
                }
            }

            const isValid = validCount === checks.length;
            const details = isValid 
                ? `All ${checks.length} modifications found` 
                : `Missing: ${missing.join(', ')}`;

            return { valid: isValid, details };
        } catch (error) {
            return { valid: false, details: `Validation error: ${error.message}` };
        }
    }

    async _validatePackageJsonModifications(packagePath, packageData) {
        try {
            const filePath = path.join(this.targetAppPath, packagePath);
            const content = await this.fileManager.readFile(filePath);
            const packageJson = JSON.parse(content);
            
            let validCount = 0;
            let totalCount = 0;
            const missing = [];

            for (const [dep, version] of Object.entries(packageData.dependencies)) {
                totalCount++;
                if (packageJson.dependencies && packageJson.dependencies[dep]) {
                    validCount++;
                } else {
                    missing.push(dep);
                }
            }

            const isValid = validCount === totalCount;
            const details = isValid 
                ? `All ${totalCount} dependencies found` 
                : `Missing dependencies: ${missing.join(', ')}`;

            return { valid: isValid, details };
        } catch (error) {
            return { valid: false, details: `Validation error: ${error.message}` };
        }
    }

    async _validateBackendIndexModifications(backendData) {
        try {
            const filePath = path.join(this.targetAppPath, 'packages/backend/src/index.ts');
            const content = await this.fileManager.readFile(filePath);
            
            const isValid = content.includes(backendData.imports.trim());
            const details = isValid 
                ? 'Backend import found' 
                : 'Backend import not found';

            return { valid: isValid, details };
        } catch (error) {
            return { valid: false, details: `Validation error: ${error.message}` };
        }
    }

    /**
     * Validate all modifications were applied correctly
     * @param {Object} validationData - Data to validate against
     * @returns {Object} Validation results with overall success and details
     */
    async validateModifications(validationData) {
        this.logger.info('🔍 Validating all plugin modifications...');
        
        const results = {
            overall: true,
            details: {},
            summary: ''
        };

        try {
            // Validate catalog modifications
            if (validationData.catalog) {
                const catalogResult = await this._validateCatalogModifications(validationData.catalog);
                results.details.catalog = catalogResult;
                if (!catalogResult.valid) results.overall = false;
            }

            // Validate EntityPage modifications
            if (validationData.entityPage) {
                const entityPageResult = await this._validateEntityPageModifications(validationData.entityPage);
                results.details.entityPage = entityPageResult;
                if (!entityPageResult.valid) results.overall = false;
            }

            // Validate App modifications
            if (validationData.app) {
                const appResult = await this._validateAppModifications(validationData.app);
                results.details.app = appResult;
                if (!appResult.valid) results.overall = false;
            }

            // Validate frontend package.json modifications
            if (validationData.frontendPackage) {
                const frontendPackageResult = await this._validatePackageJsonModifications(
                    'package.json', 
                    validationData.frontendPackage
                );
                results.details.frontendPackage = frontendPackageResult;
                if (!frontendPackageResult.valid) results.overall = false;
            }

            // Validate backend package.json modifications
            if (validationData.backendPackage) {
                const backendPackageResult = await this._validatePackageJsonModifications(
                    'packages/backend/package.json', 
                    validationData.backendPackage
                );
                results.details.backendPackage = backendPackageResult;
                if (!backendPackageResult.valid) results.overall = false;
            }

            // Validate backend index modifications
            if (validationData.backendIndex) {
                const backendIndexResult = await this._validateBackendIndexModifications(validationData.backendIndex);
                results.details.backendIndex = backendIndexResult;
                if (!backendIndexResult.valid) results.overall = false;
            }

            // Create summary
            const successCount = Object.values(results.details).filter(r => r.valid).length;
            const totalCount = Object.keys(results.details).length;
            
            results.summary = results.overall 
                ? `✅ All ${totalCount} validations passed` 
                : `❌ ${totalCount - successCount}/${totalCount} validations failed`;

            this.logger.info(`🔍 Validation complete: ${results.summary}`);
            
            // Log detailed results
            for (const [component, result] of Object.entries(results.details)) {
                const status = result.valid ? '✅' : '❌';
                this.logger.info(`  ${status} ${component}: ${result.details}`);
            }

            return results;
        } catch (error) {
            this.logger.error(`❌ Validation failed: ${error.message}`);
            return {
                overall: false,
                details: { error: { valid: false, details: error.message } },
                summary: `❌ Validation error: ${error.message}`
            };
        }
    }

    // =====================================
    // Utility Methods
    // =====================================

    /**
     * Check if a file exists in the target app
     * @param {string} relativePath - Relative path from target app root
     * @returns {boolean} File exists
     */
    async pathExists(relativePath) {
        const filePath = path.join(this.targetAppPath, relativePath);
        return await this.fileManager.pathExists(filePath);
    }

    /**
     * Read a file from the target app
     * @param {string} relativePath - Relative path from target app root
     * @returns {string} File content
     */
    async readFile(relativePath) {
        const filePath = path.join(this.targetAppPath, relativePath);
        return await this.fileManager.readFile(filePath);
    }

    /**
     * Write a file to the target app
     * @param {string} relativePath - Relative path from target app root
     * @param {string} content - File content
     */
    async writeFile(relativePath, content) {
        const filePath = path.join(this.targetAppPath, relativePath);
        await this.fileManager.writeFile(filePath, content);
    }
}

export default PluginReadmeParser;
