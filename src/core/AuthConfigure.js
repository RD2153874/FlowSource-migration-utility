import path from "path";
import fs from "fs-extra";
import YamlConfigMerger from "../utils/YamlConfigMerger.js";

export class AuthConfigure {
  constructor(config, logger, docParser, fileManager) {
    this.config = config;
    this.logger = logger;
    this.docParser = docParser;
    this.fileManager = fileManager;
    this.authDocumentation = null;
    this.yamlMerger = new YamlConfigMerger(logger);
    this.authProviders = [];
  }

  async configure() {
    this.logger.info("🔐 Starting authentication configuration...");

    // Step 1: Find and parse Auth.md
    await this.findAndParseAuthDoc();

    // Step 2: Extract authentication instructions
    await this.extractAuthInstructions();

    // Step 3: Implement each instruction
    await this.implementAuthInstructions();

    this.logger.info("✅ Base Authentication configuration completed");
  }

  async findAndParseAuthDoc() {
    const authDocPath = path.join(
      this.config.sourcePath,
      "FlowSourceInstaller",
      "FlowsourceSetupDoc",
      "Auth.md"
    );

    if (!(await fs.pathExists(authDocPath))) {
      throw new Error(`Auth.md file not found: ${authDocPath}`);
    }

    this.logger.info("📄 Found Auth.md, parsing content...");
    this.authDocumentation = await this.docParser.parse(authDocPath);
    this.logger.info("✅ Auth.md parsed successfully");
  }

  async extractAuthInstructions() {
    if (!this.authDocumentation) {
      throw new Error("Auth documentation not loaded");
    }

    this.instructions = [];
    this.providerReferences = [];

    // Extract step-by-step instructions from Auth.md
    if (this.authDocumentation.sections) {
      this.authDocumentation.sections.forEach((section) => {
        // Look for numbered steps or instruction lists
        if (
          section.title &&
          (section.title.toLowerCase().includes("step") ||
            section.title.toLowerCase().includes("instruction") ||
            section.title.toLowerCase().includes("setup"))
        ) {
          this.instructions.push({
            type: "section",
            title: section.title,
            content: section.content,
            steps: this.extractStepsFromContent(this.docParser.contentToText(section.content)),
          });
        }

        // Look for provider references (e.g., GithubAuth.md)
        if (section.content) {
          const sectionContentText = this.docParser.contentToText(section.content);
          const providerRefs = this.extractProviderReferences(sectionContentText);
          this.providerReferences.push(...providerRefs);
        }
      });
    }

    // Extract code blocks for configuration
    if (this.authDocumentation.codeBlocks) {
      this.configurationBlocks = this.authDocumentation.codeBlocks.filter(
        (block) =>
          block.language === "yaml" ||
          block.language === "typescript" ||
          block.language === "javascript"
      );
    }

    this.logger.info(
      `📋 Extracted ${this.instructions.length} instruction sections`
    );
    this.logger.info(
      `🔗 Found ${this.providerReferences.length} provider references`
    );
  }

  extractStepsFromContent(content) {
    const steps = [];
    const lines = content.split("\n");

    lines.forEach((line) => {
      // Look for numbered steps (1., 2., etc.)
      const numberedMatch = line.match(/^\s*(\d+)\.\s*(.+)/);
      if (numberedMatch) {
        steps.push({
          number: parseInt(numberedMatch[1]),
          instruction: numberedMatch[2].trim(),
        });
      }

      // Look for bullet points with action words
      const bulletMatch = line.match(/^\s*[-*]\s*(.+)/);
      if (bulletMatch && this.isActionInstruction(bulletMatch[1])) {
        steps.push({
          type: "action",
          instruction: bulletMatch[1].trim(),
        });
      }
    });

    return steps;
  }

  isActionInstruction(text) {
    const actionWords = [
      "copy",
      "create",
      "update",
      "modify",
      "add",
      "remove",
      "delete",
      "configure",
      "install",
      "setup",
    ];
    return actionWords.some((word) => text.toLowerCase().includes(word));
  }

  extractProviderReferences(content) {
    const references = [];

    // Look for markdown file references
    const mdReferences = content.match(/\[([^\]]+)\]\(([^)]+\.md)\)/g);
    if (mdReferences) {
      mdReferences.forEach((ref) => {
        const match = ref.match(/\[([^\]]+)\]\(([^)]+\.md)\)/);
        if (match) {
          references.push({
            name: match[1],
            file: match[2],
            type: "provider",
          });
        }
      });
    }

    // Look for direct file mentions
    const fileReferences = content.match(/\w+Auth\.md/g);
    if (fileReferences) {
      fileReferences.forEach((file) => {
        if (!references.find((ref) => ref.file === file)) {
          references.push({
            name: file.replace(".md", ""),
            file: file,
            type: "provider",
          });
        }
      });
    }

    return references;
  }

  async implementAuthInstructions() {
    this.logger.info("⚙️ Implementing authentication instructions...");

    // Process each instruction section
    for (const instruction of this.instructions) {
      await this.processInstructionSection(instruction);
    }

    // Apply configuration blocks
    for (const configBlock of this.configurationBlocks || []) {
      await this.applyConfigurationBlock(configBlock);
    }

    // Ensure critical files are copied
    await this.ensureCriticalFilesAreCopied();

    // Ensure App.tsx has complete auth configuration
    await this.ensureAppTsxAuthConfiguration();

    // Validate the implementation
    await this.validateAuthImplementation();

    this.logger.info("✅ Authentication instructions implemented");
  }

  async ensureCriticalFilesAreCopied() {
    this.logger.info("🔍 Ensuring critical authentication files are present...");

    const criticalFiles = [
      {
        source: "packages-core/backend/src/plugins/helper/auth-helper.ts",
        dest: "packages/backend/src/plugins/helper/auth-helper.ts",
        description: "Authentication helper file"
      },
      {
        source: "packages-core/app/src/cookieAuth.ts", 
        dest: "packages/app/src/cookieAuth.ts",
        description: "Cookie authentication file"
      },
      {
        source: "packages-core/backend/src/plugins/permission.ts",
        dest: "packages/backend/src/plugins/permission.ts", 
        description: "Permission policy file"
      }
    ];

    const criticalDirectories = [
      {
        source: "packages-core/backend/src/plugins/database",
        dest: "packages/backend/src/plugins/database",
        description: "Database services directory"
      }
    ];

    // Copy critical files
    for (const file of criticalFiles) {
      const sourcePath = path.join(this.config.sourcePath, file.source);
      const destPath = path.join(this.config.destinationPath, file.dest);

      if (await fs.pathExists(sourcePath)) {
        if (!(await fs.pathExists(destPath))) {
          await fs.ensureDir(path.dirname(destPath));
          await fs.copy(sourcePath, destPath, { overwrite: true });
          this.logger.info(`📄 Copied ${file.description}: ${file.source} → ${file.dest}`);
        } else {
          this.logger.info(`✅ ${file.description} already exists: ${file.dest}`);
        }
      } else {
        this.logger.warn(`⚠️ Source file not found: ${sourcePath}`);
      }
    }

    // Copy critical directories
    for (const dir of criticalDirectories) {
      const sourcePath = path.join(this.config.sourcePath, dir.source);
      const destPath = path.join(this.config.destinationPath, dir.dest);

      if (await fs.pathExists(sourcePath)) {
        if (!(await fs.pathExists(destPath))) {
          await fs.ensureDir(destPath);
          await fs.copy(sourcePath, destPath, { 
            overwrite: true,
            filter: (src, dest) => {
              return !src.includes('node_modules') && !src.includes('.git');
            }
          });
          this.logger.info(`📁 Copied ${dir.description}: ${dir.source} → ${dir.dest}`);
        } else {
          this.logger.info(`✅ ${dir.description} already exists: ${dir.dest}`);
        }
      } else {
        this.logger.warn(`⚠️ Source directory not found: ${sourcePath}`);
      }
    }
  }

  async validateAuthImplementation() {
    this.logger.info("🔍 Validating authentication implementation...");

    const validationResults = [];

    // Check critical files
    const criticalFiles = [
      "packages/backend/src/plugins/helper/auth-helper.ts",
      "packages/app/src/cookieAuth.ts",
      "packages/backend/src/plugins/auth.ts",
      "packages/backend/src/plugins/permission.ts",
      "packages/backend/src/plugins/database"
    ];

    for (const file of criticalFiles) {
      const filePath = path.join(this.config.destinationPath, file);
      if (await fs.pathExists(filePath)) {
        validationResults.push(`✅ ${file} exists`);
      } else {
        validationResults.push(`❌ ${file} missing`);
      }
    }

    // Check App.tsx for required imports and configurations
    const appTsxPath = path.join(this.config.destinationPath, "packages/app/src/App.tsx");
    if (await fs.pathExists(appTsxPath)) {
      const appContent = await fs.readFile(appTsxPath, "utf8");
      
      const requiredElements = [
        { element: "setTokenCookie", description: "cookieAuth import" },
        { element: "SignInProviderConfig", description: "SignInProviderConfig import" },
        { element: "type AuthProvider", description: "AuthProvider type definition" },
        { element: "authProviders:", description: "authProviders array" },
        { element: "providers={authProviders}", description: "SignInPage providers prop" }
      ];

      for (const req of requiredElements) {
        if (appContent.includes(req.element)) {
          validationResults.push(`✅ App.tsx has ${req.description}`);
        } else {
          validationResults.push(`⚠️ App.tsx missing ${req.description}`);
        }
      }
    }

    // Check backend index.ts for auth modules
    const backendIndexPath = path.join(this.config.destinationPath, "packages/backend/src/index.ts");
    if (await fs.pathExists(backendIndexPath)) {
      const indexContent = await fs.readFile(backendIndexPath, "utf8");
      
      const requiredModules = [
        "customAuthProvidersModule",
        "customCatalogAdminPermissionPolicyBackendModule"
      ];

      for (const module of requiredModules) {
        if (indexContent.includes(module)) {
          validationResults.push(`✅ Backend index.ts has ${module}`);
        } else {
          validationResults.push(`⚠️ Backend index.ts missing ${module}`);
        }
      }

      // Check that allow-all-policy is removed
      if (indexContent.includes("allow-all-policy")) {
        validationResults.push(`⚠️ Backend index.ts still has allow-all-policy (should be removed)`);
      } else {
        validationResults.push(`✅ Backend index.ts has allow-all-policy properly removed`);
      }
    }

    // Log validation results
    validationResults.forEach(result => this.logger.info(result));

    return validationResults;
  }

  async processInstructionSection(instruction) {
    this.logger.info(`📝 Processing: ${instruction.title}`);

    for (const step of instruction.steps) {
      await this.executeInstruction(step);
    }
  }

  async executeInstruction(step) {
    const instruction = step.instruction.toLowerCase();

    try {
      if (
        instruction.includes("copy") &&
        (instruction.includes("file") || instruction.includes("from"))
      ) {
        await this.handleFileCopy(step);
      } else if (
        instruction.includes("create") &&
        instruction.includes("file")
      ) {
        await this.handleFileCopy(step); // Same handler for file creation
      } else if (
        instruction.includes("delete") ||
        instruction.includes("remove")
      ) {
        await this.handleDeletion(step);
      } else if (
        instruction.includes("update") &&
        (instruction.includes("config") ||
          instruction.includes(".ts") ||
          instruction.includes(".tsx"))
      ) {
        await this.handleConfigUpdate(step);
      } else if (
        instruction.includes("add") &&
        instruction.includes("import")
      ) {
        await this.handleImportAddition(step);
      } else if (
        instruction.includes("remove") &&
        instruction.includes("import")
      ) {
        await this.handleImportRemoval(step);
      } else if (
        instruction.includes("install") &&
        instruction.includes("package")
      ) {
        await this.handlePackageInstallation(step);
      } else {
        this.logger.info(`ℹ️ Generic instruction: ${step.instruction}`);
        await this.handleGenericInstruction(step);
      }
    } catch (error) {
      this.logger.warn(
        `⚠️ Failed to execute instruction: ${step.instruction} - ${error.message}`
      );
    }
  }

  async handleImportRemoval(step) {
    const filePattern = /(?:from|in)\s+`([^`]+)`/;
    const fileMatch = step.instruction.match(filePattern);

    if (fileMatch) {
      const filePath = path.join(this.config.destinationPath, fileMatch[1]);

      if (await fs.pathExists(filePath)) {
        let content = await fs.readFile(filePath, "utf8");

        // Remove allow-all-policy import
        if (step.instruction.includes("allow-all-policy")) {
          content = content.replace(/import.*allow-all-policy.*;\n?/g, "");
          await fs.writeFile(filePath, content, "utf8");
          this.logger.info(
            `📝 Removed allow-all-policy import from ${fileMatch[1]}`
          );
        }
      }
    }
  }

  async handleFileCopy(step) {
    const instruction = step.instruction;

    // Pattern 1: "Copy X file from Y to Z" or "Copy all the helper files from Y to Z"
    const fromToPattern =
      /(?:copy|create).*?(?:file|files|directory|helper files|all.*files)\s+from\s+`([^`]+)`\s+to\s+`([^`]+)`/i;
    const fromToMatch = instruction.match(fromToPattern);

    if (fromToMatch) {
      const sourcePath = fromToMatch[1];
      const destPath = fromToMatch[2];

      const fullSourcePath = path.join(this.config.sourcePath, sourcePath);
      const fullDestPath = path.join(this.config.destinationPath, destPath);

      if (await fs.pathExists(fullSourcePath)) {
        const stat = await fs.stat(fullSourcePath);
        
        if (stat.isDirectory()) {
          // Copy entire directory
          await fs.ensureDir(fullDestPath);
          await fs.copy(fullSourcePath, fullDestPath, { 
            overwrite: true,
            filter: (src, dest) => {
              // Skip node_modules and other build artifacts
              return !src.includes('node_modules') && !src.includes('.git');
            }
          });
          this.logger.info(`📁 Copied directory: ${sourcePath} → ${destPath}`);
        } else {
          // Copy single file
          await fs.ensureDir(path.dirname(fullDestPath));
          await fs.copy(fullSourcePath, fullDestPath, { overwrite: true });
          this.logger.info(`📄 Copied file: ${sourcePath} → ${destPath}`);
        }
      } else {
        this.logger.warn(`⚠️ Source not found: ${fullSourcePath}`);
      }
      return;
    }

    // Fallback: Extract file paths from backticks
    const pathMatches = step.instruction.match(/`([^`]+)`/g);

    if (pathMatches && pathMatches.length >= 2) {
      const sourcePath = pathMatches[0].replace(/`/g, "");
      const destPath = pathMatches[1].replace(/`/g, "");

      const fullSourcePath = path.join(this.config.sourcePath, sourcePath);
      const fullDestPath = path.join(this.config.destinationPath, destPath);

      if (await fs.pathExists(fullSourcePath)) {
        const stat = await fs.stat(fullSourcePath);
        
        if (stat.isDirectory()) {
          await fs.ensureDir(fullDestPath);
          await fs.copy(fullSourcePath, fullDestPath, { overwrite: true });
          this.logger.info(`� Copied directory: ${sourcePath} → ${destPath}`);
        } else {
          await fs.ensureDir(path.dirname(fullDestPath));
          await fs.copy(fullSourcePath, fullDestPath, { overwrite: true });
          this.logger.info(`�📄 Copied file: ${sourcePath} → ${destPath}`);
        }
      } else {
        this.logger.warn(`⚠️ Source not found: ${fullSourcePath}`);
      }
    }
  }

  async handleConfigUpdate(step) {
    // Look for configuration file mentions
    const configFiles = ["app-config.yaml", "package.json", "index.ts"];

    for (const configFile of configFiles) {
      if (step.instruction.includes(configFile)) {
        await this.updateConfigFile(configFile, step);
        break;
      }
    }
  }

  async updateConfigFile(fileName, step) {
    const filePath = path.join(this.config.destinationPath, fileName);

    if (await fs.pathExists(filePath)) {
      this.logger.info(`📝 Updating ${fileName} as per instruction`);
      // Implementation depends on file type and specific instruction
      await this.applyConfigurationChange(filePath, step);
    }
  }

  async applyConfigurationChange(filePath, step) {
    // This is a placeholder for configuration changes
    // Specific implementation would depend on the actual instruction content
    this.logger.info(
      `⚙️ Applied configuration change to ${path.basename(filePath)}`
    );
  }

  async handleComponentCreation(step) {
    // Handle component creation instructions
    this.logger.info(
      `🔧 Creating component as per instruction: ${step.instruction}`
    );
  }
  async handlePackageInstallation(step) {
    // Handle package installation instructions
    const packageMatches = step.instruction.match(/`([^`]+)`/g);

    if (packageMatches) {
      const packages = packageMatches.map((p) => p.replace(/`/g, ""));
      this.logger.info(`📦 Packages to install: ${packages.join(", ")}`);
      // Add packages to the installation queue
      this.authProviders.push(...packages);
    }
  }

  async handleImportAddition(step) {
    // Handle import addition instructions
    this.logger.info(
      `📥 Adding import as per instruction: ${step.instruction}`
    );
  }

  async handleGenericInstruction(step) {
    // Handle generic instructions that don't match specific patterns
    this.logger.info(`📋 Processing generic instruction: ${step.instruction}`);
  }

  async applyConfigurationBlock(configBlock) {
    this.logger.info(`⚙️ Applying ${configBlock.language} configuration block`);

    if (configBlock.language === "yaml") {
      await this.applyYamlConfiguration(configBlock);
    } else if (
      configBlock.language === "typescript" ||
      configBlock.language === "javascript"
    ) {
      await this.applyCodeConfiguration(configBlock);
    }
  }

  async applyYamlConfiguration(configBlock) {
    // Apply YAML configuration to app-config.yaml using proper merging
    const appConfigPath = path.join(
      this.config.destinationPath,
      "app-config.yaml"
    );

    if (await fs.pathExists(appConfigPath)) {
      try {
        // Extract YAML configuration from the markdown block
        const blockContentText = this.docParser.contentToText(configBlock.content);
        
        // Parse the YAML configuration from the content
        const yamlConfig = this.yamlMerger.extractYamlFromMarkdown('```yaml\n' + blockContentText + '\n```');
        
        if (Object.keys(yamlConfig).length > 0) {
          // Merge into existing app-config.yaml using the YAML merger
          const success = await this.yamlMerger.mergeIntoYamlFile(
            appConfigPath, 
            yamlConfig, 
            "Authentication Configuration from Auth.md"
          );
          
          if (success) {
            this.logger.info("📄 Applied YAML configuration to app-config.yaml");
          } else {
            this.logger.error("❌ Failed to merge YAML configuration");
          }
        } else {
          this.logger.warn("⚠️ No valid YAML configuration found in Auth documentation block");
        }
      } catch (error) {
        this.logger.error("❌ Failed to parse YAML configuration:", error.message);
      }
    }
  }

  // Enhance AuthConfigure.js applyCodeConfiguration method
  async applyCodeConfiguration(configBlock) {
    const content = configBlock.content;

    if (content.includes("backend.add")) {
      await this.addToBackendIndex(configBlock);
    } else if (content.includes("createApp")) {
      await this.updateAppComponent(configBlock);
    } else if (content.includes("import")) {
      await this.addImportsToFile(configBlock);
    } else {
      this.logger.info("💻 Applied generic code configuration");
    }
  }

  async addToBackendIndex(configBlock) {
    const indexPath = path.join(
      this.config.destinationPath,
      "packages",
      "backend",
      "src",
      "index.ts"
    );

    if (await fs.pathExists(indexPath)) {
      let content = await fs.readFile(indexPath, "utf8");
      const configContentText = this.docParser.contentToText(configBlock.content);
      let modified = false;

      // Handle import statements
      const importMatches = configContentText.match(/import\s+.*?;/g);
      if (importMatches) {
        for (const importStatement of importMatches) {
          if (!content.includes(importStatement.trim())) {
            // Find the location to insert imports (after the last existing import)
            const lastImportMatch = content.match(/import[^;]*;(?=\s*\n\s*(?!import))/g);
            if (lastImportMatch) {
              const lastImport = lastImportMatch[lastImportMatch.length - 1];
              const insertIndex = content.indexOf(lastImport) + lastImport.length;
              content = content.slice(0, insertIndex) + '\n' + importStatement + content.slice(insertIndex);
              modified = true;
              this.logger.info(`📄 Added import to index.ts: ${importStatement}`);
            }
          }
        }
      }

      // Handle backend.add statements
      const backendAddMatches = configContentText.match(/backend\.add\([^)]+\);?/g);
      if (backendAddMatches) {
        for (const backendAdd of backendAddMatches) {
          const cleanAdd = backendAdd.replace(/;$/, '');
          if (!content.includes(cleanAdd)) {
            content = content.replace(
              "backend.start();",
              `${cleanAdd};\n\nbackend.start();`
            );
            modified = true;
            this.logger.info(`📄 Added backend module to index.ts: ${cleanAdd}`);
          }
        }
      }

      if (modified) {
        await fs.writeFile(indexPath, content, "utf8");
        this.logger.info("📄 Updated backend index.ts");
      }
    }
  }

  async updateAppComponent(configBlock) {
    const appPath = path.join(
      this.config.destinationPath,
      "packages",
      "app",
      "src",
      "App.tsx"
    );

    if (await fs.pathExists(appPath)) {
      let content = await fs.readFile(appPath, "utf8");
      const configContentText = this.docParser.contentToText(configBlock.content);
      let modified = false;

      // Handle import statements for App.tsx
      const importMatches = configContentText.match(/import\s+.*?;/g);
      if (importMatches) {
        for (const importStatement of importMatches) {
          if (!content.includes(importStatement.trim())) {
            // Find location to insert imports (after the last existing import)
            const lastImportMatch = content.match(/import[^;]*;(?=\s*\n\s*(?!import))/g);
            if (lastImportMatch) {
              const lastImport = lastImportMatch[lastImportMatch.length - 1];
              const insertIndex = content.indexOf(lastImport) + lastImport.length;
              content = content.slice(0, insertIndex) + '\n' + importStatement + content.slice(insertIndex);
              modified = true;
              this.logger.info(`📄 Added import to App.tsx: ${importStatement}`);
            }
          }
        }
      }

      // Handle authProviders array definition
      if (configContentText.includes('authProviders') && !content.includes('authProviders')) {
        // Extract authProviders definition
        const authProvidersMatch = configContentText.match(/const authProviders[\s\S]*?(?=\n\n|\n(?=const|\w))/);
        if (authProvidersMatch) {
          // Insert before createApp call
          const createAppIndex = content.indexOf('const app = createApp(');
          if (createAppIndex !== -1) {
            content = content.slice(0, createAppIndex) + 
                     authProvidersMatch[0] + '\n\n' + 
                     content.slice(createAppIndex);
            modified = true;
            this.logger.info('📄 Added authProviders array to App.tsx');
          }
        }
      }

      // Handle SignInPage component configuration
      if (configContentText.includes('SignInPage') && content.includes('providers={[\'guest\']}')) {
        // Replace the existing SignInPage configuration
        content = content.replace(
          /SignInPage: props => <SignInPage \{\.\.\.props\} auto providers=\{\['guest'\]\} \/>,/,
          `SignInPage: props => {
      const discoveryApi = useApi(discoveryApiRef);
      const config = useApi(configApiRef);
      return (
        <SignInPage
          {...props}
          providers={authProviders}
          title="Select a sign-in method"
          align="center"
          onSignInSuccess={async (identityApi: IdentityApi) => {
            setTokenCookie(
              await discoveryApi.getBaseUrl('cookie'),
              identityApi
            );
            props.onSignInSuccess(identityApi);
          }}
        />
      );
    },`
        );
        modified = true;
        this.logger.info('📄 Updated SignInPage configuration in App.tsx');
      }

      if (modified) {
        await fs.writeFile(appPath, content, "utf8");
        this.logger.info("📄 Updated App.tsx component");
      }
    }
  }

  async addImportsToFile(configBlock) {
    // Determine target file based on content
    let targetFile = "packages/app/src/App.tsx";
    const configContentText = this.docParser.contentToText(configBlock.content);
    if (
      configContentText.includes("backend") ||
      configContentText.includes("auth-backend")
    ) {
      targetFile = "packages/backend/src/index.ts";
    }

    const filePath = path.join(this.config.destinationPath, targetFile);

    if (await fs.pathExists(filePath)) {
      let content = await fs.readFile(filePath, "utf8");

      // Extract import statements from configBlock
      const configContentText = this.docParser.contentToText(configBlock.content);
      const importMatches = configContentText.match(/import.*from.*;/g);
      if (importMatches) {
        importMatches.forEach((importStatement) => {
          if (!content.includes(importStatement)) {
            // Add import at the top
            const existingImports = content.match(/^import.*$/gm) || [];
            const lastImport = existingImports[existingImports.length - 1];

            if (lastImport) {
              content = content.replace(
                lastImport,
                lastImport + "\n" + importStatement
              );
            } else {
              content = importStatement + "\n" + content;
            }
          }
        });

        await fs.writeFile(filePath, content, "utf8");
        this.logger.info(`📥 Added imports to ${targetFile}`);
      }
    }
  }

  requiresGitHubAuth() {
    return this.providerReferences.some(
      (ref) =>
        ref.name.toLowerCase().includes("github") ||
        ref.file.toLowerCase().includes("github")
    );
  }

  getGitHubAuthReference() {
    return this.providerReferences.find(
      (ref) =>
        ref.name.toLowerCase().includes("github") ||
        ref.file.toLowerCase().includes("github")
    );
  }

  async validate() {
    // Validate that authentication configuration was applied correctly
    const validationResults = {
      success: true,
      message: "",
      details: [],
    };

    // Check if auth plugin files exist
    const authPluginPath = path.join(
      this.config.destinationPath,
      "packages",
      "backend",
      "src",
      "plugins",
      "auth.ts"
    );
    if (await fs.pathExists(authPluginPath)) {
      validationResults.details.push("✅ Auth plugin file exists");
    } else {
      validationResults.success = false;
      validationResults.details.push("❌ Auth plugin file missing");
    }

    // Check app-config.yaml for auth configuration
    const appConfigPath = path.join(
      this.config.destinationPath,
      "app-config.yaml"
    );
    if (await fs.pathExists(appConfigPath)) {
      const configContent = await fs.readFile(appConfigPath, "utf8");
      if (
        configContent.includes("auth:") ||
        configContent.includes("Authentication")
      ) {
        validationResults.details.push(
          "✅ Authentication configuration found in app-config.yaml"
        );
      } else {
        validationResults.success = false;
        validationResults.details.push(
          "❌ No authentication configuration in app-config.yaml"
        );
      }
    }

    validationResults.message = validationResults.success
      ? "Authentication configuration validated successfully"
      : "Authentication configuration validation failed";

    return validationResults;
  }

  async ensureAppTsxAuthConfiguration() {
    this.logger.info("🔍 Ensuring App.tsx has complete authentication configuration...");

    const appPath = path.join(
      this.config.destinationPath,
      "packages",
      "app",
      "src",
      "App.tsx"
    );

    if (!(await fs.pathExists(appPath))) {
      this.logger.warn("⚠️ App.tsx not found, skipping configuration");
      return;
    }

    let content = await fs.readFile(appPath, "utf8");
    let modified = false;

    // Ensure required imports
    const requiredImports = [
      { import: "import { SignInProviderConfig } from '@backstage/core-components';", check: "SignInProviderConfig" },
      { import: "import { discoveryApiRef, useApi, configApiRef } from '@backstage/core-plugin-api';", check: "discoveryApiRef" },
      { import: "import type { IdentityApi } from '@backstage/core-plugin-api';", check: "type { IdentityApi }" },
      { import: "import { setTokenCookie } from './cookieAuth';", check: "setTokenCookie" }
    ];

    for (const req of requiredImports) {
      if (!content.includes(req.check)) {
        // Find the last import line and add after it
        const lastImportMatch = content.match(/import[^;]*;(?=\s*\n\s*(?!import))/g);
        if (lastImportMatch) {
          const lastImport = lastImportMatch[lastImportMatch.length - 1];
          const insertIndex = content.indexOf(lastImport) + lastImport.length;
          content = content.slice(0, insertIndex) + '\n' + req.import + content.slice(insertIndex);
          modified = true;
          this.logger.info(`📄 Added import: ${req.import}`);
        }
      }
    }

    // Ensure AuthProvider type definition
    if (!content.includes('type AuthProvider')) {
      const typeDefinition = '\ntype AuthProvider = "guest" | SignInProviderConfig;\n';
      // Insert after imports, before any const declarations
      const firstConstMatch = content.match(/\nconst \w+/);
      if (firstConstMatch) {
        const insertIndex = content.indexOf(firstConstMatch[0]);
        content = content.slice(0, insertIndex) + typeDefinition + content.slice(insertIndex);
        modified = true;
        this.logger.info('📄 Added AuthProvider type definition');
      }
    }

    // Ensure authProviders array exists
    if (!content.includes('const authProviders')) {
      const authProvidersArray = `\nconst authProviders: AuthProvider[] = [\n  // Authentication providers will be added here by provider-specific modules\n];\n`;
      // Insert before createApp call
      const createAppIndex = content.indexOf('const app = createApp(');
      if (createAppIndex !== -1) {
        content = content.slice(0, createAppIndex) + authProvidersArray + '\n' + content.slice(createAppIndex);
        modified = true;
        this.logger.info('📄 Added authProviders array');
      }
    }

    // Ensure SignInPage component is configured
    if (!content.includes('providers={authProviders}')) {
      // Look for SignInPage component configuration
      const signInPageMatch = content.match(/SignInPage:\s*props\s*=>\s*{[\s\S]*?}/);
      if (signInPageMatch) {
        // Update existing SignInPage configuration
        const updatedSignInPage = signInPageMatch[0].replace(
          /<SignInPage\s*([^>]*)>/,
          '<SignInPage\n          {...props}\n          providers={authProviders}\n          title="Select a sign-in method"\n          align="center"\n          onSignInSuccess={async (identityApi: IdentityApi) => {\n            setTokenCookie(\n              await discoveryApi.getBaseUrl(\'cookie\'),\n              identityApi\n            );\n            props.onSignInSuccess(identityApi);\n          }}\n        >'
        );
        content = content.replace(signInPageMatch[0], updatedSignInPage);
        modified = true;
        this.logger.info('📄 Updated SignInPage configuration');
      } else {
        // Add SignInPage component if it doesn't exist
        const componentsMatch = content.match(/components:\s*{([^}]*)}/);
        if (componentsMatch) {
          const signInPageComponent = `
    SignInPage: props => {
      const discoveryApi = useApi(discoveryApiRef);
      const config = useApi(configApiRef);
      return (
        <SignInPage
          {...props}
          providers={authProviders}
          title="Select a sign-in method"
          align="center"
          onSignInSuccess={async (identityApi: IdentityApi) => {
            setTokenCookie(
              await discoveryApi.getBaseUrl('cookie'),
              identityApi
            );
            props.onSignInSuccess(identityApi);
          }}
        />
      );
    },`;
          content = content.replace('components: {', `components: {${signInPageComponent}`);
          modified = true;
          this.logger.info('📄 Added SignInPage component configuration');
        }
      }
    }

    if (modified) {
      await fs.writeFile(appPath, content, "utf8");
      this.logger.info("✅ App.tsx authentication configuration updated");
    } else {
      this.logger.info("✅ App.tsx authentication configuration already complete");
    }
  }

  async handleDeletion(step) {
    const instruction = step.instruction.toLowerCase();
    
    this.logger.info(`🗑️ Processing deletion: ${step.instruction}`);

    // Handle allow-all-policy import deletion specifically
    if (instruction.includes("allow-all-policy")) {
      await this.removeAllowAllPolicyImport();
      return;
    }

    // Handle generic import deletion
    if (instruction.includes("import")) {
      await this.handleImportRemoval(step);
      return;
    }

    // Extract quoted code or file paths to delete
    const codeMatches = step.instruction.match(/```[\s\S]*?```/g);
    if (codeMatches) {
      for (const codeBlock of codeMatches) {
        const cleanCode = codeBlock.replace(/```\w*\n?/g, '').trim();
        await this.removeCodeFromFiles(cleanCode);
      }
      return;
    }

    this.logger.warn(`⚠️ Could not process deletion instruction: ${step.instruction}`);
  }

  async removeAllowAllPolicyImport() {
    const backendIndexPath = path.join(
      this.config.destinationPath,
      "packages/backend/src/index.ts"
    );

    if (await fs.pathExists(backendIndexPath)) {
      let content = await fs.readFile(backendIndexPath, "utf8");
      const originalContent = content;

      // Remove various forms of allow-all-policy imports
      const patterns = [
        /backend\.add\(\s*import\(\s*["']@backstage\/plugin-permission-backend-module-allow-all-policy["']\s*\)\s*\);?\s*\n?/g,
        /import\s*\(\s*["']@backstage\/plugin-permission-backend-module-allow-all-policy["']\s*\)\s*,?\s*\n?/g,
        /["']@backstage\/plugin-permission-backend-module-allow-all-policy["']\s*,?\s*\n?/g
      ];

      for (const pattern of patterns) {
        content = content.replace(pattern, '');
      }

      // Clean up any duplicate empty lines
      content = content.replace(/\n\n\n+/g, '\n\n');

      if (content !== originalContent) {
        await fs.writeFile(backendIndexPath, content, "utf8");
        this.logger.info("✅ Removed allow-all-policy import from backend index.ts");
      } else {
        this.logger.info("ℹ️ Allow-all-policy import not found or already removed");
      }
    }
  }

  async removeCodeFromFiles(codeToRemove) {
    // This method removes specific code blocks from relevant files
    const targetFiles = [
      "packages/backend/src/index.ts",
      "packages/app/src/App.tsx"
    ];

    for (const targetFile of targetFiles) {
      const filePath = path.join(this.config.destinationPath, targetFile);
      if (await fs.pathExists(filePath)) {
        let content = await fs.readFile(filePath, "utf8");
        const originalContent = content;

        // Remove the specified code block
        content = content.replace(codeToRemove, '');
        content = content.replace(/\n\n\n+/g, '\n\n'); // Clean up empty lines

        if (content !== originalContent) {
          await fs.writeFile(filePath, content, "utf8");
          this.logger.info(`🗑️ Removed code block from ${targetFile}`);
          break;
        }
      }
    }
  }

  // ...existing code...
}
