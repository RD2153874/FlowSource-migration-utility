// Template Manager - Handles intelligent template integration
import path from "path";
import fs from "fs-extra";
import { DocumentationParser } from "../utils/DocumentationParser.js";
import YamlConfigMerger from "../utils/YamlConfigMerger.js";

export class TemplateManager {
  constructor(config, logger, fileManager, sharedYamlMerger = null) {
    this.config = config;
    this.logger = logger;
    this.fileManager = fileManager;
    this.docParser = new DocumentationParser();
    // Use shared YamlMerger from FlowSourceAgent if provided, otherwise create new one
    this.yamlMerger = sharedYamlMerger || new YamlConfigMerger(logger);
  }

  async integrateSelectedTemplates(selectedTemplates) {
    this.logger.info("🚀 Starting intelligent template integration...");
    
    try {
      // Parse the PDLC template documentation
      const templateInstructions = await this.parseTemplateInstructions();
      
      const integratedTemplates = [];
      const failedTemplates = [];
      
      // Execute template integration based on user selections
      for (const template of selectedTemplates) {
        this.logger.info(`📄 Integrating template: ${template}`);
        try {
          await this.integrateTemplate(template, templateInstructions);
          integratedTemplates.push(template);
        } catch (templateError) {
          this.logger.error(`❌ Failed to integrate template ${template}: ${templateError.message}`);
          failedTemplates.push({ name: template, error: templateError.message });
        }
      }

      // Update app configuration with template catalog entries for successful integrations
      if (integratedTemplates.length > 0) {
        await this.updateAppConfigForTemplates(integratedTemplates);
      }

      const success = failedTemplates.length === 0;
      this.logger.info(`✅ Template integration completed: ${integratedTemplates.length} successful, ${failedTemplates.length} failed`);
      
      return { 
        success: success, 
        integratedTemplates: integratedTemplates,
        failedTemplates: failedTemplates,
        message: success ? "All templates integrated successfully" : `${failedTemplates.length} templates failed to integrate`
      };

    } catch (error) {
      this.logger.error(`❌ Template integration failed at framework level: ${error.message}`);
      this.logger.error(`❌ Template integration error details:`, error);
      
      const errorDetails = `Framework error during template integration: ${error.message}`;
      return {
        success: false,
        integratedTemplates: [],
        failedTemplates: selectedTemplates.map(t => ({ name: t, error: `Framework error: ${error.message}` })),
        error: errorDetails,
        message: `Template integration failed at framework level: ${error.message}`
      };
    }
  }

  async parseTemplateInstructions() {
    this.logger.info("📖 Parsing PDLC template documentation...");
    
    const instructionsPath = path.join(
      this.config.sourcePath,
      "FlowSourceInstaller",
      "FlowsourceSetupDoc",
      "PDLC-template.md"
    );

    if (!(await fs.pathExists(instructionsPath))) {
      throw new Error(`Template instructions not found: ${instructionsPath}`);
    }

    // Parse the markdown documentation
    const documentation = await this.docParser.parse(instructionsPath);
    
    // Extract template-specific instructions
    const instructions = this.extractTemplateInstructions(documentation);
    
    this.logger.info("✅ Template instructions parsed successfully");
    return instructions;
  }

  extractTemplateInstructions(documentation) {
    const instructions = {
      general: {},
      templates: {
        "PDLC-Backend": {},
        "PDLC-Frontend": {}
      },
      configuration: {}
    };

    if (documentation.sections) {
      documentation.sections.forEach(section => {
        const title = section.title?.toLowerCase() || '';
        const content = this.docParser.contentToText(section.content);

        if (title.includes('template setup instructions')) {
          instructions.general = this.parseGeneralInstructions(content);
        } else if (title.includes('pdlc-backend')) {
          instructions.templates["PDLC-Backend"] = this.parseTemplateSpecificInstructions(content, 'backend');
        } else if (title.includes('pdlc-frontend')) {
          instructions.templates["PDLC-Frontend"] = this.parseTemplateSpecificInstructions(content, 'frontend');
        } else if (title.includes('configuration setup')) {
          instructions.configuration = this.parseConfigurationInstructions(content);
        }
      });
    }

    return instructions;
  }

  parseGeneralInstructions(content) {
    return {
      createTemplatesDir: content.includes('Create the `templates` directory'),
      templatesPath: 'templates'
    };
  }

  parseTemplateSpecificInstructions(content, type) {
    const instructions = {
      type: type,
      sourcePath: null,
      targetPath: null
    };

    // Extract source and target paths from content
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes('Copy the PDLC-') && line.includes('from') && line.includes('to')) {
        const sourceMatch = line.match(/from `([^`]+)`/);
        const targetMatch = line.match(/to `([^`]+)`/);
        
        if (sourceMatch) {
          instructions.sourcePath = sourceMatch[1];
        }
        if (targetMatch) {
          instructions.targetPath = targetMatch[1];
        }
      }
    }

    return instructions;
  }

  parseConfigurationInstructions(content) {
    const config = {
      catalogEntries: []
    };

    // Extract YAML configuration blocks
    const yamlMatches = content.match(/```yaml([\s\S]*?)```/g);
    if (yamlMatches) {
      yamlMatches.forEach(yamlBlock => {
        const yamlContent = yamlBlock.replace(/```yaml\n?/, '').replace(/```$/, '').trim();
        config.catalogEntries.push(yamlContent);
      });
    }

    return config;
  }

  async integrateTemplate(templateName, instructions) {
    this.logger.info(`🔧 Processing ${templateName} integration...`);

    // Step 1: Ensure templates directory exists
    await this.ensureTemplatesDirectory();

    // Step 2: Copy template files
    await this.copyTemplateFiles(templateName, instructions);

    this.logger.info(`✅ ${templateName} integrated successfully`);
  }

  async ensureTemplatesDirectory() {
    const templatesDir = path.join(this.config.destinationPath, 'templates');
    
    if (!(await fs.pathExists(templatesDir))) {
      await fs.ensureDir(templatesDir);
      this.logger.info("📁 Created templates directory");
    } else {
      this.logger.info("📁 Templates directory already exists");
    }
  }

  async copyTemplateFiles(templateName, instructions) {
    const templateInstructions = instructions.templates[templateName];
    
    if (!templateInstructions || !templateInstructions.sourcePath) {
      throw new Error(`No copy instructions found for template: ${templateName}`);
    }

    // Build full source path
    const sourcePath = path.join(this.config.sourcePath, templateInstructions.sourcePath);
    
    // Build target path
    const targetPath = path.join(this.config.destinationPath, templateInstructions.targetPath);

    // Verify source exists
    if (!(await fs.pathExists(sourcePath))) {
      throw new Error(`Template source not found: ${sourcePath}`);
    }

    // Copy template directory
    await fs.copy(sourcePath, targetPath, { overwrite: true });
    this.logger.info(`📄 Copied ${templateName} from ${sourcePath} to ${targetPath}`);

    // Verify template.yaml exists
    const templateYaml = path.join(targetPath, 'template.yaml');
    if (await fs.pathExists(templateYaml)) {
      this.logger.info(`✅ Verified template.yaml exists for ${templateName}`);
    } else {
      this.logger.warn(`⚠️ template.yaml not found for ${templateName} at ${templateYaml}`);
    }
  }

  async updateAppConfigForTemplates(selectedTemplates) {
    this.logger.info("⚙️ Updating app-config files with template catalog entries...");

    // Check if both config files exist (dual configuration from Phase 2)
    const appConfigPath = path.join(this.config.destinationPath, 'app-config.yaml');
    const appConfigLocalPath = path.join(this.config.destinationPath, 'app-config.local.yaml');
    
    if (!(await fs.pathExists(appConfigPath))) {
      throw new Error(`app-config.yaml not found: ${appConfigPath}`);
    }

    // Build catalog entries for selected templates
    const catalogEntries = this.buildCatalogEntries(selectedTemplates);

    // Create catalog configuration block
    const catalogConfig = {
      catalog: {
        locations: catalogEntries
      }
    };

    try {
      // Update main app-config.yaml
      await this.yamlMerger.mergeIntoYamlFile(appConfigPath, catalogConfig, 'Template Integration');
      this.logger.info("✅ Updated app-config.yaml with template catalog entries");

      // Update app-config.local.yaml if it exists (dual configuration mode)
      if (await fs.pathExists(appConfigLocalPath)) {
        // For catalog locations, copy exact same config to both files (no placeholders needed)
        await this.yamlMerger.mergeIntoYamlFile(appConfigLocalPath, catalogConfig, 'Template Integration');
        this.logger.info("✅ Updated app-config.local.yaml with template catalog entries");
        this.logger.info("🔄 Dual configuration maintained: template entries synchronized");
      } else {
        this.logger.info("ℹ️ app-config.local.yaml not found - single configuration mode");
      }

    } catch (error) {
      this.logger.error(`❌ Failed to update app configuration files: ${error.message}`);
      throw error;
    }
  }

  buildCatalogEntries(selectedTemplates) {
    const entries = [];

    selectedTemplates.forEach(template => {
      if (template === 'PDLC-Backend') {
        entries.push({
          type: 'file',
          target: '../../templates/PDLC-Backend/template.yaml',
          rules: [{ allow: ['Template'] }]
        });
      } else if (template === 'PDLC-Frontend') {
        entries.push({
          type: 'file',
          target: '../../templates/PDLC-Frontend/template.yaml',
          rules: [{ allow: ['Template'] }]
        });
      }
    });

    return entries;
  }

  async validateTemplateIntegration(selectedTemplates) {
    this.logger.info("🔍 Validating template integration...");

    const validationResults = [];

    for (const template of selectedTemplates) {
      const result = await this.validateSingleTemplate(template);
      validationResults.push(result);
    }

    const failedValidations = validationResults.filter(r => !r.success);
    
    if (failedValidations.length > 0) {
      const errors = failedValidations.map(r => r.error).join(', ');
      throw new Error(`Template validation failed: ${errors}`);
    }

    this.logger.info("✅ All template integrations validated successfully");
    return { success: true, validationResults };
  }

  async validateSingleTemplate(templateName) {
    try {
      // Check if template directory exists
      const templatePath = path.join(this.config.destinationPath, 'templates', templateName);
      if (!(await fs.pathExists(templatePath))) {
        return { success: false, template: templateName, error: 'Template directory not found' };
      }

      // Check if template.yaml exists
      const templateYaml = path.join(templatePath, 'template.yaml');
      if (!(await fs.pathExists(templateYaml))) {
        return { success: false, template: templateName, error: 'template.yaml not found' };
      }

      // Validate template.yaml structure (basic check)
      const templateContent = await fs.readFile(templateYaml, 'utf8');
      if (!templateContent.includes('apiVersion') || !templateContent.includes('kind: Template')) {
        return { success: false, template: templateName, error: 'Invalid template.yaml structure' };
      }

      return { success: true, template: templateName };
    } catch (error) {
      return { success: false, template: templateName, error: error.message };
    }
  }

  async getAvailableTemplates() {
    this.logger.info("🔍 Scanning for available templates...");
    
    const templatesPath = path.join(this.config.sourcePath, 'Flowsource-templates');
    
    if (!(await fs.pathExists(templatesPath))) {
      this.logger.warn("⚠️ Flowsource-templates directory not found");
      return [];
    }

    const availableTemplates = [];
    const templateDirs = await fs.readdir(templatesPath);

    for (const dir of templateDirs) {
      const templatePath = path.join(templatesPath, dir);
      const templateYaml = path.join(templatePath, 'template.yaml');
      
      if (await fs.pathExists(templateYaml)) {
        availableTemplates.push({
          name: dir,
          path: templatePath,
          description: await this.getTemplateDescription(templateYaml)
        });
      }
    }

    this.logger.info(`📄 Found ${availableTemplates.length} available templates`);
    return availableTemplates;
  }

  async getTemplateDescription(templateYamlPath) {
    try {
      const content = await fs.readFile(templateYamlPath, 'utf8');
      const descriptionMatch = content.match(/description:\s*(.+)/);
      return descriptionMatch ? descriptionMatch[1].replace(/['"]/g, '').trim() : 'No description available';
    } catch (error) {
      return 'No description available';
    }
  }
}
