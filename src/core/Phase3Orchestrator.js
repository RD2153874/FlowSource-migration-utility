// Phase3Orchestrator - Orchestrates Phase 3 integration execution
import path from "path";
import { Logger } from "../utils/Logger.js";
import { TemplateManager } from "./TemplateManager.js";
import { PluginManager } from "./PluginManager.js";

export class Phase3Orchestrator {
  constructor(config, logger, fileManager, sharedYamlMerger) {
    this.config = config;
    this.logger = logger || Logger.getInstance();
    this.fileManager = fileManager;
    this.sharedYamlMerger = sharedYamlMerger;
    this.templateManager = null;
    this.pluginManager = null;
  }

  async execute(executionContext) {
    this.logger.info("🚀 Phase3Orchestrator: Starting Phase 3 execution");
    
    try {
      // Validate execution context
      await this.validateExecutionContext(executionContext);

      // Validate prerequisites (source directories exist)
      await this.validatePrerequisites();

      // Initialize managers based on requirements
      await this.initializeManagers();

      // Execute based on integration type
      const results = await this.executeIntegrations(executionContext);

      // Aggregate and return results
      return this.aggregateResults(results);

    } catch (error) {
      this.logger.error(`❌ Phase3Orchestrator execution failed: ${error.message}`);
      throw error;
    }
  }

  async validateExecutionContext(context) {
    this.logger.info("🔍 Validating Phase 3 execution context...");
    
    if (!context.phase3Options) {
      throw new Error("Phase 3 options not provided in execution context");
    }

    if (!context.phase3Options.integrationType) {
      throw new Error("Integration type not specified in Phase 3 options");
    }

    const validTypes = ['templates', 'plugins', 'both'];
    if (!validTypes.includes(context.phase3Options.integrationType)) {
      throw new Error(`Invalid integration type: ${context.phase3Options.integrationType}`);
    }

    this.logger.info("✅ Execution context validation completed");
  }

  async initializeManagers() {
    this.logger.info("🔧 Initializing integration managers...");

    const integrationType = this.config.phase3Options?.integrationType;

    // Initialize TemplateManager if needed
    if (integrationType === 'templates' || integrationType === 'both') {
      this.templateManager = new TemplateManager(
        this.config,
        this.logger,
        this.fileManager,
        this.sharedYamlMerger
      );
      this.logger.info("✅ TemplateManager initialized");
    }

    // Initialize PluginManager if needed
    if (integrationType === 'plugins' || integrationType === 'both') {
      this.pluginManager = new PluginManager({
        config: this.config,
        logger: this.logger,
        fileManager: this.fileManager,
        sharedYamlMerger: this.sharedYamlMerger,
        workspacePath: this.config.sourcePath,
        pluginsPath: path.join(this.config.sourcePath, "plugins"),
        targetAppPath: this.config.destinationPath,
        appConfigPath: path.join(this.config.destinationPath, 'app-config.yaml'),
        // Pass complete phase3Options context including cached plugins
        phase3Options: this.config.phase3Options,
        // Pass catalog onboarding configuration
        catalogOnboarding: this.config.phase3Options?.catalogOnboarding || null,
        // Pass GitHub repository configuration for plugins that need it
        githubRepoOwner: this.config.githubRepoOwner || null,
        githubRepoName: this.config.githubRepoName || null
      });
      this.logger.info("✅ PluginManager initialized");
    }

    this.logger.info("🔧 Integration managers initialization completed");
  }

  async executeIntegrations(context) {
    this.logger.info("⚡ Executing integrations based on user selections...");
    
    const integrationType = context.phase3Options.integrationType;
    this.logger.info(`🎯 Integration type: ${integrationType}`);
    
    // Initialize results object based on integration type
    const results = {};

    try {
      switch (integrationType) {
        case 'templates':
          this.logger.info("📄 Starting template-only integration...");
          results.templates = await this.executeTemplateIntegration(context);
          this.logger.info(`📄 Template integration result: ${results.templates.success ? 'SUCCESS' : 'FAILED'}`);
          break;

        case 'plugins':
          this.logger.info("🔌 Starting plugin-only integration...");
          results.plugins = await this.executePluginIntegration(context);
          this.logger.info(`🔌 Plugin integration result: ${results.plugins.success ? 'SUCCESS' : 'FAILED'}`);
          break;

        case 'both':
          this.logger.info("🎯 Starting both template and plugin integrations...");
          const bothResults = await this.executeBothIntegrations(context);
          results.templates = bothResults.templates;
          results.plugins = bothResults.plugins;
          this.logger.info(`🎯 Both integrations result - Templates: ${results.templates?.success ? 'SUCCESS' : 'FAILED'}, Plugins: ${results.plugins?.success ? 'SUCCESS' : 'FAILED'}`);
          break;

        default:
          throw new Error(`Unsupported integration type: ${integrationType}`);
      }

      this.logger.info("✅ Integration execution completed successfully");
      this.logger.info(`📊 Final results overview - Templates: ${results.templates?.success || false}, Plugins: ${results.plugins?.success || false}`);
      return results;

    } catch (error) {
      this.logger.error(`❌ Integration execution failed for type '${integrationType}': ${error.message}`);
      this.logger.error(`❌ Integration execution error details:`, error);
      throw error;
    }
  }

  async executeTemplateIntegration(context) {
    this.logger.info("📄 Executing template integration...");
    
    if (!this.templateManager) {
      throw new Error("TemplateManager not initialized for template integration");
    }

    const selectedTemplates = context.phase3Options.selectedTemplates || [];
    
    if (selectedTemplates.length === 0) {
      this.logger.warn("⚠️ No templates selected for integration");
      return { success: true, details: { integratedTemplates: [] } };
    }

    try {
      const result = await this.templateManager.integrateSelectedTemplates(selectedTemplates);
      this.logger.info(`✅ Template integration completed: ${result.integratedTemplates?.length || 0} templates processed`);
      
      return {
        success: result.success,
        details: result
      };
    } catch (error) {
      this.logger.error(`❌ Template integration failed: ${error.message}`);
      this.logger.error(`❌ Template integration error details:`, error);
      
      // Return structured error response instead of throwing
      return {
        success: false,
        details: { 
          error: error.message, 
          integratedTemplates: [],
          failureDetails: error.stack || error.toString()
        }
      };
    }
  }

  async executePluginIntegration(context) {
    this.logger.info("🔌 Executing plugin integration...");
    
    if (!this.pluginManager) {
      throw new Error("PluginManager not initialized for plugin integration");
    }

    const selectedPlugins = context.phase3Options.selectedPlugins || [];
    
    if (selectedPlugins.length === 0) {
      this.logger.warn("⚠️ No plugins selected for integration");
      return { success: true, details: { integratedPlugins: [] } };
    }

    try {
      // Get catalog onboarding choices from context (now supports multiple methods)
      const catalogChoices = context.phase3Options.catalogOnboarding?.choices || [];
      
      const result = await this.pluginManager.integratePlugins(selectedPlugins, catalogChoices);
      this.logger.info(`✅ Plugin integration completed: ${result.results?.length || 0} plugins processed`);
      
      return {
        success: result.success,
        details: {
          integratedPlugins: result.results?.filter(r => r.success).map(r => r.plugin) || [],
          failedPlugins: result.results?.filter(r => !r.success) || [],
          catalogOnboarded: result.catalogOnboarded,
          totalProcessed: result.results?.length || 0
        }
      };
    } catch (error) {
      this.logger.error(`❌ Plugin integration failed: ${error.message}`);
      this.logger.error(`❌ Plugin integration error details:`, error);
      
      // Return structured error response instead of throwing
      return {
        success: false,
        details: { 
          error: error.message, 
          integratedPlugins: [],
          failureDetails: error.stack || error.toString()
        }
      };
    }
  }

  async executeBothIntegrations(context) {
    this.logger.info("🎯 Executing both template and plugin integrations...");
    
    const results = {
      templates: { success: false, details: null },
      plugins: { success: false, details: null }
    };

    // Determine execution order based on user preference
    const executionOrder = context.phase3Options.executionOrder || ['templates', 'plugins'];
    this.logger.info(`📋 Execution order: ${executionOrder.join(' → ')}`);

    try {
      for (const integrationType of executionOrder) {
        if (integrationType === 'templates') {
          results.templates = await this.executeTemplateIntegration(context);
        } else if (integrationType === 'plugins') {
          results.plugins = await this.executePluginIntegration(context);
        }

        // Stop execution if current integration fails
        if (!results[integrationType].success) {
          this.logger.error(`❌ ${integrationType} integration failed, stopping execution`);
          break;
        }
      }

      this.logger.info("✅ Both integrations execution completed");
      return results;

    } catch (error) {
      this.logger.error(`❌ Both integrations execution failed: ${error.message}`);
      throw error;
    }
  }

  aggregateResults(results) {
    this.logger.info("📊 Aggregating Phase 3 execution results...");
    
    const aggregatedResults = {
      success: true,
      totalIntegrations: 0,
      successfulIntegrations: 0,
      failedIntegrations: 0,
      templates: results.templates || null,
      plugins: results.plugins || null,
      summary: {
        integratedTemplates: [],
        integratedPlugins: [],
        errors: [],
        warnings: []
      }
    };

    // Process template results only if templates were attempted
    if (results.templates !== undefined) {
      if (results.templates.success) {
        aggregatedResults.successfulIntegrations++;
        aggregatedResults.summary.integratedTemplates = results.templates.details?.integratedTemplates || [];
        this.logger.info(`✅ Template integration successful: ${aggregatedResults.summary.integratedTemplates.length} templates`);
      } else {
        aggregatedResults.failedIntegrations++;
        aggregatedResults.success = false;
        
        // Enhanced error capture logic
        let errorMessage = 'Template integration failed';
        let failureDetails = '';
        
        if (results.templates.details) {
          // Check for general error message
          if (results.templates.details.error) {
            errorMessage = results.templates.details.error;
          } else if (results.templates.details.message) {
            errorMessage = results.templates.details.message;
          }
          
          // Check for failure details/stack trace
          if (results.templates.details.failureDetails) {
            failureDetails = results.templates.details.failureDetails;
          }
          
          // Check for failed template details
          if (results.templates.details.failedTemplates && results.templates.details.failedTemplates.length > 0) {
            const templateErrors = results.templates.details.failedTemplates.map(
              t => `${t.name}: ${t.error || 'Unknown error'}`
            ).join('; ');
            errorMessage = `Template failures - ${templateErrors}`;
          }
        }
        
        aggregatedResults.summary.errors.push(`Template integration: ${errorMessage}`);
        
        if (failureDetails) {
          this.logger.error(`📋 Template integration failure details: ${failureDetails}`);
        }
        
        this.logger.error(`❌ Template integration failed: ${errorMessage}`);
      }
    }

    // Process plugin results only if plugins were attempted
    if (results.plugins !== undefined) {
      if (results.plugins.success) {
        aggregatedResults.successfulIntegrations++;
        aggregatedResults.summary.integratedPlugins = results.plugins.details?.integratedPlugins || [];
        this.logger.info(`✅ Plugin integration successful: ${aggregatedResults.summary.integratedPlugins.length} plugins`);
      } else {
        aggregatedResults.failedIntegrations++;
        aggregatedResults.success = false;
        
        // Enhanced error capture for plugins
        let pluginError = 'Plugin integration failed';
        if (results.plugins.details?.error) {
          pluginError = results.plugins.details.error;
        } else if (results.plugins.details?.message) {
          pluginError = results.plugins.details.message;
        }
        
        aggregatedResults.summary.errors.push(`Plugin integration: ${pluginError}`);
        this.logger.error(`❌ Plugin integration failed: ${pluginError}`);
      }
    }

    aggregatedResults.totalIntegrations = aggregatedResults.successfulIntegrations + aggregatedResults.failedIntegrations;

    // Ensure we have at least one error message if the overall result failed
    if (!aggregatedResults.success && aggregatedResults.summary.errors.length === 0) {
      aggregatedResults.summary.errors.push('Integration failed with unspecified error - check logs for details');
      this.logger.warn('⚠️ Integration failed but no specific error messages were captured');
    }

    // Log summary
    this.logger.info(`📊 Phase 3 Results Summary:`);
    this.logger.info(`   ✅ Successful: ${aggregatedResults.successfulIntegrations}/${aggregatedResults.totalIntegrations}`);
    this.logger.info(`   ❌ Failed: ${aggregatedResults.failedIntegrations}/${aggregatedResults.totalIntegrations}`);
    
    if (aggregatedResults.summary.integratedTemplates.length > 0) {
      this.logger.info(`   📄 Templates: ${aggregatedResults.summary.integratedTemplates.join(', ')}`);
    }
    
    if (aggregatedResults.summary.integratedPlugins.length > 0) {
      this.logger.info(`   🔌 Plugins: ${aggregatedResults.summary.integratedPlugins.join(', ')}`);
    }

    return aggregatedResults;
  }

  // Helper method to validate prerequisites
  async validatePrerequisites() {
    this.logger.info("🔍 Validating Phase 3 prerequisites...");
    
    // Validate source paths exist
    const sourcePath = this.config.sourcePath;
    
    // Check for templates directory if needed
    if (this.config.phase3Options?.integrationType === 'templates' || 
        this.config.phase3Options?.integrationType === 'both') {
      const templatesPath = path.join(sourcePath, "Flowsource-templates");
      if (!await this.fileManager.pathExists(templatesPath)) {
        throw new Error(`Flowsource-templates directory not found: ${templatesPath}`);
      }
    }

    // Check for plugins directory if needed
    if (this.config.phase3Options?.integrationType === 'plugins' || 
        this.config.phase3Options?.integrationType === 'both') {
      const pluginsPath = path.join(sourcePath, "plugins");
      if (!await this.fileManager.pathExists(pluginsPath)) {
        throw new Error(`Plugins directory not found: ${pluginsPath}`);
      }
    }

    this.logger.info("✅ Prerequisites validation completed");
  }

  // Helper method to discover available templates (called from InteractiveMode)
  async discoverAvailableTemplates() {
    this.logger.info("🔍 Discovering available templates...");
    
    try {
      // Initialize TemplateManager temporarily for discovery
      const tempTemplateManager = new TemplateManager(
        this.config,
        this.logger,
        this.fileManager,
        this.sharedYamlMerger
      );

      const availableTemplates = await tempTemplateManager.getAvailableTemplates();
      this.logger.info(`✅ Found ${availableTemplates.length} available templates`);
      
      return availableTemplates;

    } catch (error) {
      this.logger.warn(`⚠️ Template discovery failed: ${error.message}, using fallback templates`);
      
      // Return fallback templates
      return [
        { 
          name: "PDLC-Backend", 
          description: "Backend development template with best practices"
        },
        { 
          name: "PDLC-Frontend", 
          description: "Frontend development template with best practices"
        }
      ];
    }
  }

  // Helper method to discover available plugins (for future use)
  async discoverAvailablePlugins() {
    this.logger.info("🔍 Discovering available plugins...");
    
    try {
      // Initialize PluginManager temporarily for discovery
      if (!this.pluginManager) {
        const tempPluginManager = new PluginManager({
          config: this.config,
          logger: this.logger,
          fileManager: this.fileManager,
          sharedYamlMerger: this.sharedYamlMerger,
          workspacePath: this.config.sourcePath,
          pluginsPath: path.join(this.config.sourcePath, "plugins")
        });
        
        const availablePlugins = await tempPluginManager.discoverPlugins();
        this.logger.info(`✅ Found ${availablePlugins.length} available plugins`);
        
        // Return full plugin metadata (don't strip it down)
        return availablePlugins.map(plugin => ({
          name: plugin.name,
          displayName: plugin.displayName,
          description: plugin.description || `${plugin.displayName} plugin`,
          frontendPath: plugin.frontendPath,
          backendPath: plugin.backendPath
        }));
      }

    } catch (error) {
      this.logger.warn(`⚠️ Plugin discovery failed: ${error.message}`);
      return [];
    }
  }
}
