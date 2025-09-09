// FlowSource Migration Agent - Core Logic
import path from "path";
import fs from "fs-extra";
import { Logger } from "../utils/Logger.js";
import { FileManager } from "../utils/FileManager.js";
import { DocumentationParser } from "../utils/DocumentationParser.js";
import { ConfigManager } from "../utils/ConfigManager.js";
import { BackstageGenerator } from "./BackstageGenerator.js";
import { FlowSourceTransformer } from "./FlowSourceTransformer.js";
import { ValidationEngine } from "./ValidationEngine.js";
import { AuthConfigure } from "./AuthConfigure.js";
import { GitHubAuth } from "./GitHubAuth.js";
import { TemplateManager } from "./TemplateManager.js";
import YamlConfigMerger from "../utils/YamlConfigMerger.js";
import { execSync } from "child_process";
import ora from "ora";
import chalk from "chalk";

export class FlowSourceAgent {
  constructor(options = {}) {
    this.logger = Logger.getInstance();
    this.fileManager = new FileManager();
    this.docParser = new DocumentationParser();
    this.configManager = new ConfigManager();
    this.backstageGenerator = new BackstageGenerator();
    this.transformer = new FlowSourceTransformer();
    this.validator = new ValidationEngine();
    this.templateManager = null; // Will be initialized when needed
    this.interactiveMode = null;

    // Create shared YamlConfigMerger instance for consolidating all config blocks
    this.sharedYamlMerger = new YamlConfigMerger(this.logger);

    this.options = {
      dryRun: false,
      verbose: false,
      phase: 1,
      ...options,
    };

    this.migrationState = {
      currentStep: 0,
      totalSteps: 0,
      errors: [],
      warnings: [],
      completed: false,
    };
  }

  async migrate(config) {
    const spinner = ora("🚀 Starting FlowSource migration...").start();

    try {
      // Store config for summary display
      this.migrationConfig = config;
      
      // Set default non-interactive mode if not specified
      if (config.nonInteractive === undefined) {
        config.nonInteractive = true; // Default to non-interactive mode to prevent hangs
        this.logger.info("🤖 Running in non-interactive mode (default)");
      }

      this.logger.info("🎯 Starting migration process...");
      this.logger.info(`📍 Source: ${config.sourcePath}`);
      this.logger.info(`📍 Destination: ${config.destinationPath}`);
      this.logger.info(`📍 Application: ${config.applicationName}`);
      this.logger.info(`📍 Phase: ${config.phase}`);

      // Phase 1: Basic migration without plugins, auth, and database
      // Phase 2: Migration with Authentication & Permissions
      // Phase 3: Full FlowSource with Templates & Plugins
      if (config.phase === 1) {
        // Reset migration state for Phase 1
        this.migrationState.currentStep = 0;
        this.migrationState.totalSteps = 0;
        this.migrationState.errors = [];
        this.migrationState.warnings = [];
        await this.executePhase1(config, spinner);
      } else if (config.phase === 2) {
        await this.executePhase2(config, spinner);
      } else if (config.phase === 3) {
        await this.executePhase3(config, spinner);
      } else {
        throw new Error(
          `Unsupported phase: ${config.phase}. Supported phases: 1, 2, 3`
        );
      }

      spinner.succeed(chalk.green("✅ Migration completed successfully!"));
      this.migrationState.completed = true;

      this.logger.info("🎉 FlowSource migration completed successfully!");
      this.displayMigrationSummary();
    } catch (error) {
      spinner.fail(chalk.red(`❌ Migration failed: ${error.message}`));
      this.logger.error(`Migration failed: ${error.message}`);
      if (this.options.verbose) {
        this.logger.error(error.stack);
      }
      throw error;
    }
  }

  // PHASE 2
  async executePhase2(config, spinner) {
    // Reset migration state for Phase 2
    this.migrationState.currentStep = 0;
    this.migrationState.totalSteps = this.calculatePhase2TotalSteps();
    this.migrationState.errors = [];
    this.migrationState.warnings = [];

    // First, validate and execute Phase 1 if not already done
    await this.validateAndExecutePhase1(config, spinner);

    // Phase 2 specific steps - Authentication & Permissions
    this.logger.info("🔐 Starting Phase 2: Authentication & Permissions");

    // Note: In interactive mode, authentication provider selection and credential collection
    // is handled in InteractiveMode.start() before calling migrate(). This step is only 
    // needed for CLI mode or when credentials weren't collected in interactive mode.
    if (this.interactiveMode && !config.githubAuth && config.selectedAuthProvider === 'github') {
      // Interactive mode should have already collected GitHub credentials
      this.logger.info("ℹ️ GitHub credentials should have been collected in interactive mode");
    } else if (!this.interactiveMode && !config.githubAuth) {
      // CLI mode - need to collect GitHub credentials (future enhancement)
      this.logger.info("ℹ️ CLI mode GitHub authentication not yet implemented");
    }

    // Step 9: Parse README and validate authentication requirements
    await this.executeStep(spinner, "Parsing documentation...", async () => {
      await this.parseAndValidateAuthRequirements(config);
    });

    // Step 10: Configure authentication using AuthConfigure class
    await this.executeStep(
      spinner,
      "Configuring authentication...",
      async () => {
        await this.configureAuthentication(config);
      }
    );

    // Step 11: Setup GitHub authentication if required
    await this.executeStep(
      spinner,
      "Setting up GitHub authentication...",
      async () => {
        await this.setupGitHubAuthentication(config);
      }
    );

    // Step 12: Validate authentication setup
    await this.executeStep(
      spinner,
      "Validating authentication configuration...",
      async () => {
        await this.validateAuthenticationSetup(config);
      }
    );

    // Step 13: Create dual configuration files
    await this.executeStep(
      spinner,
      "Creating dual configuration files...",
      async () => {
        await this.createDualConfigurationFiles(config);
      }
    );
  }

  // PHASE 3
  async executePhase3(config, spinner) {
    // Reset migration state for Phase 3
    this.migrationState.currentStep = 0;
    this.migrationState.errors = [];
    this.migrationState.warnings = [];

    // First, validate and execute Phase 2 if not already done
    await this.validateAndExecutePhase2(config, spinner);

    // Phase 3 specific steps - Templates & Plugins Integration via Orchestrator
    this.logger.info("🚀 Starting Phase 3: Templates & Plugins Integration via Orchestrator");

    // Validate that Phase 3 orchestrator and execution context are available
    if (!config.phase3Orchestrator || !config.phase3ExecutionContext) {
      throw new Error("Phase 3 orchestrator not initialized. Please use interactive mode or ensure proper configuration.");
    }

    // Calculate dynamic total steps based on user selections
    this.migrationState.totalSteps = this.calculatePhase3TotalSteps(config);

    // Step 14: Validate Phase 3 prerequisites
    await this.executeStep(spinner, "Validating Phase 3 prerequisites...", async () => {
      await config.phase3Orchestrator.validatePrerequisites();
    });

    // Step 15: Execute Phase 3 integration via orchestrator
    await this.executeStep(spinner, "Executing Phase 3 integrations...", async () => {
      const results = await config.phase3Orchestrator.execute(config.phase3ExecutionContext);
      
      // Store results for summary display
      this.migrationState.phase3Results = results;
      
      if (!results.success) {
        // Build comprehensive error message
        let errorMessage = 'Phase 3 integration failed';
        
        if (results.summary?.errors && results.summary.errors.length > 0) {
          errorMessage = `Phase 3 integration failed: ${results.summary.errors.join(', ')}`;
        } else {
          // Provide additional debugging information
          errorMessage += ` - Check details: Templates(${results.templates?.success ? 'OK' : 'FAILED'}), Plugins(${results.plugins?.success ? 'OK' : 'FAILED'})`;
        }
        
        // Log the full results for debugging
        this.logger.error('📋 Full Phase 3 results for debugging:', JSON.stringify(results, null, 2));
        
        throw new Error(errorMessage);
      }
      
      this.logger.info(`✅ Phase 3 integration completed successfully`);
      this.logger.info(`   📊 Total integrations: ${results.totalIntegrations}`);
      this.logger.info(`   ✅ Successful: ${results.successfulIntegrations}`);
      this.logger.info(`   ❌ Failed: ${results.failedIntegrations}`);
    });

    // Step 16: Final validation and cleanup
    await this.executeStep(spinner, "Final Phase 3 validation...", async () => {
      await this.finalizePhase3Setup(config);
    });
  }

  // PHASE 1
  async executePhase1(config, spinner) {
    // Set totalSteps if not already set (for standalone Phase 1 or Phase 2 that needs Phase 1)
    if (this.migrationState.totalSteps === 0) {
      this.migrationState.totalSteps = 8;
    }

    // Step 1: Validate source paths and documentation
    await this.executeStep(
      spinner,
      "Validating source paths and documentation...",
      async () => {
        await this.validateSourcePaths(config);
        await this.loadDocumentation(config);
      }
    );

    // Step 2: Generate Backstage skeleton
    await this.executeStep(
      spinner,
      "Generating Backstage skeleton...",
      async () => {
        await this.backstageGenerator.generate(
          config.destinationPath,
          config.applicationName
        );
      }
    );

    // Step 3: Apply base configuration files
    await this.executeStep(
      spinner,
      "Applying base configuration files...",
      async () => {
        await this.applyBaseConfiguration(config);
      }
    );

    // Step 4: Override package.json files
    await this.executeStep(
      spinner,
      "Updating package configurations...",
      async () => {
        await this.updatePackageConfigurations(config);
      }
    );

    // Step 5: Apply UI customizations and FlowSource theme
    await this.executeStep(
      spinner,
      "Applying FlowSource UI customizations...",
      async () => {
        await this.transformer.applyUICustomizations(config);
      }
    );

    // Step 6: Copy and configure packages-core
    await this.executeStep(
      spinner,
      "Configuring packages-core...",
      async () => {
        await this.configurePackagesCore(config);
      }
    );

    // Step 7: Validate configuration integrity
    await this.executeStep(
      spinner,
      "Validating configuration integrity...",
      async () => {
        await this.validator.validateMigration(config);
      }
    );

    // Step 8: Optional dependency installation
    if (config.autoInstall) {
      await this.executeStep(
        spinner,
        "Installing dependencies...",
        async () => {
          await this.installDependencies(config);
        }
      );
    }
  }

  async executeStep(spinner, message, stepFunction) {
    this.migrationState.currentStep++;
    const stepNumber = this.migrationState.currentStep;
    const totalSteps = this.migrationState.totalSteps;

    // Safety check: Ensure step counter doesn't exceed total steps
    if (stepNumber > totalSteps) {
      this.logger.warn(`⚠️ Step counter (${stepNumber}) exceeds total steps (${totalSteps}). This may indicate an issue with dynamic step calculation.`);
      this.migrationState.totalSteps = stepNumber;
    }

    spinner.text = chalk.blue(`[${stepNumber}/${this.migrationState.totalSteps}] ${message}`);
    this.logger.info(`Step ${stepNumber}: ${message}`);

    try {
      await stepFunction();
      this.logger.info(`✅ Step ${stepNumber} completed successfully`);
    } catch (error) {
      this.logger.error(`❌ Step ${stepNumber} failed: ${error.message}`);
      this.migrationState.errors.push({
        step: stepNumber,
        message: error.message,
        error: error,
      });
      throw error;
    }
  }

  // Utility methods
  async validateSourcePaths(config) {
    const requiredPaths = [
      path.join(
        config.sourcePath,
        "FlowSourceInstaller",
        "FlowsourceSetupDoc",
        "Readme.md"
      ),
      path.join(
        config.sourcePath,
        "FlowSourceInstaller",
        "FlowsourceSetupDoc",
        "UI-Changes.md"
      ),
      path.join(config.sourcePath, "configuration"),
      path.join(config.sourcePath, "packages-core", "app"),
      path.join(config.sourcePath, "packages-core", "backend"),
    ];

    for (const requiredPath of requiredPaths) {
      if (!(await fs.pathExists(requiredPath))) {
        throw new Error(`Required path not found: ${requiredPath}`);
      }
    }

    this.logger.info("✅ Source path validation completed");
  }

  async loadDocumentation(config) {
    const readmePath = path.join(
      config.sourcePath,
      "FlowSourceInstaller",
      "FlowsourceSetupDoc",
      "Readme.md"
    );
    const uiChangesPath = path.join(
      config.sourcePath,
      "FlowSourceInstaller",
      "FlowsourceSetupDoc",
      "UI-Changes.md"
    );

    this.documentation = {
      readme: await this.docParser.parse(readmePath),
      uiChanges: await this.docParser.parse(uiChangesPath),
    };

    this.logger.info("✅ Documentation loaded and parsed");
  }

  async applyBaseConfiguration(config) {
    const configSource = path.join(config.sourcePath, "configuration");
    const destRoot = config.destinationPath;

    // Configuration files to copy/replace
    const configFiles = [
      // Don't merge/modify app-config.yaml - users should configure manually
      { source: "Dockerfile", dest: "Dockerfile", action: "replace" },
      { source: ".dockerignore", dest: ".dockerignore", action: "replace" },
      { source: ".gitignore", dest: ".gitignore", action: "replace" },
      { source: ".yarnrc.yml", dest: ".yarnrc.yml", action: "replace" },
      { source: "yarn.lock", dest: "yarn.lock", action: "replace" },
    ];

    for (const file of configFiles) {
      const sourcePath = path.join(configSource, file.source);
      const destPath = path.join(destRoot, file.dest);

      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, destPath, { overwrite: true });
        this.logger.info(`📄 Replaced: ${file.dest}`);
      }
    }

    // Fix .gitignore to not ignore /packages directory
    await this.fixGitignore(destRoot);

    // Copy .yarn directory if it exists
    const yarnDir = path.join(configSource, ".yarn");
    if (await fs.pathExists(yarnDir)) {
      await fs.copy(yarnDir, path.join(destRoot, ".yarn"), { overwrite: true });
      this.logger.info("📁 Copied .yarn directory");
    }
  }

  async updatePackageConfigurations(config) {
    const configSource = path.join(config.sourcePath, "configuration");
    const destRoot = config.destinationPath;

    // Override root package.json completely
    const rootPackageSource = path.join(configSource, "package.json");
    const rootPackageDest = path.join(destRoot, "package.json");

    if (await fs.pathExists(rootPackageSource)) {
      await fs.copy(rootPackageSource, rootPackageDest, { overwrite: true });
      this.logger.info(
        "📦 Root package.json overridden with FlowSource configuration"
      );
    }

    // Update app package.json
    await this.updateAppPackageJson(config);

    // Update backend package.json
    await this.updateBackendPackageJson(config);
  }

  async updateAppPackageJson(config) {
    // For Phase 1: Do not include any FlowSource plugin-related dependencies
    // Only add essential UI/theme dependencies for FlowSource branding
    const destAppPackage = path.join(
      config.destinationPath,
      "packages",
      "app",
      "package.json"
    );

    if (await fs.pathExists(destAppPackage)) {
      const existingConfig = await fs.readJson(destAppPackage);

      // Essential dependencies for FlowSource theme (no plugins for Phase 1)
      const essentialDependencies = {
        // Theme-related dependencies with correct versions
        "backstage-plugin-techdocs-addon-mermaid": "^0.16.0",
        // Add other essential theme dependencies as needed
      };

      // Remove any FlowSource plugin dependencies that might conflict
      const filteredDependencies = { ...existingConfig.dependencies };
      Object.keys(filteredDependencies).forEach((dep) => {
        if (dep.startsWith("@flowsource/plugin-")) {
          delete filteredDependencies[dep];
          this.logger.info(`🗑️ Removed plugin dependency for Phase 1: ${dep}`);
        }
      });

      const mergedConfig = {
        ...existingConfig,
        dependencies: {
          ...filteredDependencies,
          ...essentialDependencies,
        },
      };

      await fs.writeJson(destAppPackage, mergedConfig, { spaces: 2 });
      this.logger.info(
        "📦 App package.json updated with essential FlowSource dependencies (plugins removed for Phase 1)"
      );
    }
  }

  async updateBackendPackageJson(config) {
    // For Phase 1: Do not include any FlowSource plugin-related dependencies
    const destBackendPackage = path.join(
      config.destinationPath,
      "packages",
      "backend",
      "package.json"
    );

    if (await fs.pathExists(destBackendPackage)) {
      const existingConfig = await fs.readJson(destBackendPackage);

      // Only add essential dependencies for backend (no plugins for Phase 1)
      const essentialDependencies = {
        // Add any essential backend dependencies here if needed
        // For Phase 1, we primarily use existing Backstage dependencies
      };

      const mergedConfig = {
        ...existingConfig,
        dependencies: {
          ...existingConfig.dependencies,
          ...essentialDependencies,
        },
      };

      await fs.writeJson(destBackendPackage, mergedConfig, { spaces: 2 });
      this.logger.info(
        "📦 Backend package.json updated with essential FlowSource dependencies"
      );
    }
  }

  async configurePackagesCore(config) {
    // Copy essential files from packages-core without plugin-specific content
    await this.copyEssentialAppFiles(config);
    await this.copyEssentialBackendFiles(config);

    // Remove backend Dockerfile as it's not required
    await this.removeBackendDockerfile(config);
  }

  async removeBackendDockerfile(config) {
    const backendDockerfile = path.join(
      config.destinationPath,
      "packages",
      "backend",
      "Dockerfile"
    );

    if (await fs.pathExists(backendDockerfile)) {
      await fs.remove(backendDockerfile);
      this.logger.info("📄 Removed unnecessary backend Dockerfile");
    }
  }

  async copyEssentialAppFiles(config) {
    const sourceApp = path.join(config.sourcePath, "packages-core", "app");
    const destApp = path.join(config.destinationPath, "packages", "app");

    // Essential files for UI customization (Phase 1)
    const essentialFiles = [
      "src/assets",
      "src/components/theme",
      "src/components/Root",
      "src/components/catalog/customcatalog",
      "src/components/search",
      "public/android-chrome-192x192.png",
      "public/apple-touch-icon.png",
      "public/catalog-banner.png",
      "public/cognizant-logo-flowsource.svg",
      "public/favicon-16x16.png",
      "public/favicon-32x32.png",
      "public/favicon.ico",
      "public/safari-pinned-tab.svg",
      "src/global.css",
    ];

    for (const file of essentialFiles) {
      const sourcePath = path.join(sourceApp, file);
      const destPath = path.join(destApp, file);

      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, destPath, { overwrite: true });
        this.logger.info(`📄 Copied: ${file}`);
      } else {
        // Log when file is not found but don't fail
        this.logger.info(`⚠️ File not found (optional): ${file}`);
      }
    }
  }

  async copyEssentialBackendFiles(config) {
    const sourceBackend = path.join(
      config.sourcePath,
      "packages-core",
      "backend"
    );
    const destBackend = path.join(
      config.destinationPath,
      "packages",
      "backend"
    );

    // Essential files for basic backend functionality (Phase 1 - no auth/db plugins)
    const essentialFiles = ["src/types.ts"];

    for (const file of essentialFiles) {
      const sourcePath = path.join(sourceBackend, file);
      const destPath = path.join(destBackend, file);

      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, destPath, { overwrite: true });
        this.logger.info(`📄 Copied: ${file}`);
      }
    }
  }

  async installDependencies(config) {
    try {
      this.logger.info("📦 Installing dependencies with yarn...");
      execSync("yarn install", {
        cwd: config.destinationPath,
        stdio: this.options.verbose ? "inherit" : "pipe",
      });
      this.logger.info("✅ Dependencies installed successfully");
    } catch (error) {
      this.logger.warn(
        "⚠️ Dependency installation failed, can be installed manually later"
      );
      this.migrationState.warnings.push("Dependency installation failed");
    }
  }

  async fixGitignore(destRoot) {
    const gitignorePath = path.join(destRoot, ".gitignore");

    if (await fs.pathExists(gitignorePath)) {
      let gitignoreContent = await fs.readFile(gitignorePath, "utf8");

      // Remove the line that ignores /packages directory
      gitignoreContent = gitignoreContent
        .split("\n")
        .filter((line) => line.trim() !== "/packages")
        .join("\n");

      await fs.writeFile(gitignorePath, gitignoreContent, "utf8");
      this.logger.info("📄 Fixed .gitignore - removed /packages exclusion");
    }
  }

  /**
   * Dynamic Step Calculation System
   * 
   * This system calculates the total number of steps for each phase based on:
   * - Phase 1: Fixed 8 steps (base migration)
   * - Phase 2: Fixed 5 steps + Phase 1 (authentication & dual config)
   * - Phase 3: Variable steps based on user selections:
   *   - Base: 4 steps (validate, process, update config, finalize)
   *   - +1 step if templates selected
   *   - +1 step if plugins selected
   *   - +2 steps if both selected
   * 
   * This eliminates the step counter warnings that occurred with fixed counts.
   */

  //Utility methods
  async validateAndExecutePhase1(config, spinner) {
    // Check if Phase 1 has been completed
    const phase1Indicators = [
      path.join(
        config.destinationPath,
        "packages",
        "app",
        "src",
        "components",
        "Root"
      ),
      path.join(
        config.destinationPath,
        "packages",
        "app",
        "src",
        "components",
        "theme"
      ),
      path.join(config.destinationPath, "packages", "app", "src", "assets"),
      path.join(config.destinationPath, "app-config.yaml"),
    ];

    let phase1Completed = true;
    const missingItems = [];

    for (const indicator of phase1Indicators) {
      if (!(await fs.pathExists(indicator))) {
        phase1Completed = false;
        missingItems.push(indicator);
      }
    }

    if (!phase1Completed) {
      this.logger.warn("⚠️ Phase 1 not completed. Missing items:");
      missingItems.forEach((item) => this.logger.warn(`   - ${item}`));
      this.logger.info("🔄 Executing Phase 1 first...");

      // Execute Phase 1 steps
      await this.executePhase1(config, spinner);
    } else {
      this.logger.info("✅ Phase 1 already completed, proceeding with Phase 2");
      // Update step counter to reflect completed Phase 1 steps
      this.migrationState.currentStep = 8; // Phase 1 has fixed 8 steps
    }
  }

  async validateAndExecutePhase2(config, spinner) {
    // Check if Phase 2 has been completed
    const phase2Indicators = [
      path.join(config.destinationPath, "packages", "backend", "src", "plugins", "auth.ts"),
      path.join(config.destinationPath, "app-config.local.yaml"),
      path.join(config.destinationPath, "packages", "backend", "src", "plugins", "helper", "auth-helper.ts"),
      path.join(config.destinationPath, "packages", "backend", "src", "plugins", "database"),
    ];

    let phase2Completed = true;
    const missingItems = [];

    for (const indicator of phase2Indicators) {
      if (!(await fs.pathExists(indicator))) {
        phase2Completed = false;
        missingItems.push(indicator);
      }
    }

    // Additional check: Verify auth section exists in app-config.yaml
    const appConfigPath = path.join(config.destinationPath, "app-config.yaml");
    if (await fs.pathExists(appConfigPath)) {
      const configContent = await fs.readFile(appConfigPath, 'utf8');
      if (!configContent.includes('auth:') || !configContent.includes('providers:')) {
        phase2Completed = false;
        missingItems.push("Authentication configuration in app-config.yaml");
      }
    }

    if (!phase2Completed) {
      this.logger.warn("⚠️ Phase 2 not completed. Missing items:");
      missingItems.forEach((item) => this.logger.warn(`   - ${item}`));
      
      // Check if we're in CLI mode and Phase 2 is incomplete
      if (!this.interactiveMode) {
        throw new Error("Phase 2 not completed and CLI mode cannot collect credentials. Please run Phase 2 first or use interactive mode for Phase 3.");
      }
      
      this.logger.info("🔄 Executing Phase 2 first...");

      // Execute Phase 2 steps
      await this.executePhase2(config, spinner);
    } else {
      this.logger.info("✅ Phase 2 already completed, proceeding with Phase 3");
      // Update step counter to reflect completed Phase 1 + Phase 2 steps
      this.migrationState.currentStep = this.calculatePhase2TotalSteps();
    }
  }

  async parseAndValidateAuthRequirements(config) {
    // Parse the main README file to understand authentication requirements
    const readmePath = path.join(
      config.sourcePath,
      "FlowSourceInstaller",
      "FlowsourceSetupDoc",
      "Readme.md"
    );

    if (!(await fs.pathExists(readmePath))) {
      throw new Error(`README file not found: ${readmePath}`);
    }

    // Parse README to find authentication references
    this.readmeDocumentation = await this.docParser.parse(readmePath);

    // Look for references to Auth.md in the README
    const authReference = this.findAuthenticationReference(
      this.readmeDocumentation
    );

    if (authReference) {
      this.logger.info("✅ Authentication setup required as per README.md");
      config.requiresAuthentication = true;
      config.authDocumentPath = authReference;
    } else {
      this.logger.info("ℹ️ No authentication setup found in README.md");
      config.requiresAuthentication = false;
    }
  }

  findAuthenticationReference(documentation) {
    // Search for references to Auth.md in the parsed documentation
    const authReferences = [];

    // Check sections for authentication mentions
    if (documentation.sections) {
      documentation.sections.forEach((section) => {
        // Convert content to searchable text using the parser's utility method
        const contentText = this.docParser.contentToText(section.content).toLowerCase();

        if (
          contentText &&
          (contentText.includes("auth.md") ||
            contentText.includes("authentication") ||
            contentText.includes("github auth"))
        ) {
          authReferences.push(section);
        }
      });
    }

    // Check links for Auth.md references
    if (documentation.links) {
      const authLinks = documentation.links.filter(
        (link) => link.href && link.href.includes("Auth.md")
      );
      authReferences.push(...authLinks);
    }

    return authReferences.length > 0 ? authReferences[0] : null;
  }

  async configureAuthentication(config) {
    if (!config.requiresAuthentication) {
      this.logger.info("ℹ️ Skipping authentication configuration");
      return;
    }

    // Initialize AuthConfigure class with shared YamlConfigMerger
    this.authConfigure = new AuthConfigure(
      config,
      this.logger,
      this.docParser,
      this.fileManager,
      this.sharedYamlMerger
    );

    // Execute authentication configuration
    await this.authConfigure.configure();
  }

  async setupGitHubAuthentication(config) {
    if (!config.requiresAuthentication) {
      this.logger.info("ℹ️ Skipping GitHub authentication setup");
      return;
    }

    // Check if GitHub authentication is required
    if (this.authConfigure && this.authConfigure.requiresGitHubAuth()) {
      this.gitHubAuth = new GitHubAuth(
        config,
        this.logger,
        this.docParser,
        this.fileManager,
        this.authConfigure,
        this.sharedYamlMerger
      );
      await this.gitHubAuth.setup();
    }
  }

  async validateAuthenticationSetup(config) {
    if (!config.requiresAuthentication) {
      this.logger.info("ℹ️ No authentication to validate");
      return;
    }

    // Validate that authentication files are properly configured
    const validationResults = [];

    if (this.authConfigure) {
      const authValidation = await this.authConfigure.validate();
      validationResults.push(authValidation);
    }

    if (this.gitHubAuth) {
      const githubValidation = await this.gitHubAuth.validate();
      validationResults.push(githubValidation);
    }

    const failedValidations = validationResults.filter(
      (result) => !result.success
    );

    if (failedValidations.length > 0) {
      const errorMessage = failedValidations.map((v) => v.message).join(", ");
      throw new Error(`Authentication validation failed: ${errorMessage}`);
    }

    this.logger.info("✅ Authentication configuration validated successfully");
  }

  async createDualConfigurationFiles(config) {
    if (!config.requiresAuthentication) {
      this.logger.info("ℹ️ No authentication configured - skipping dual config file creation");
      return;
    }

    this.logger.info("🔄 Creating dual configuration files...");
    
    // Check if dual mode is enabled on the shared yaml merger
    const dualSummary = this.sharedYamlMerger.getDualConfigSummary();
    this.logger.info(`📊 Shared YamlMerger dual config status: ${dualSummary.message}`);
    
    if (!dualSummary.dualModeEnabled) {
      this.logger.info("ℹ️ Dual mode not enabled - no user-provided values detected across all components");
      return;
    }

    try {
      // Create dual configuration files using the shared merger with all consolidated blocks
      const result = await this.sharedYamlMerger.buildDualConfigFiles(config.destinationPath);
      
      if (result.success) {
        this.logger.info("🎉 Dual configuration files created successfully!");
        this.logger.info("📄 The following configuration files are now available:");
        
        if (result.templatePath && await fs.pathExists(result.templatePath)) {
          this.logger.info("   📄 app-config.yaml - Main configuration for deployment (with placeholders)");
        }
        
        if (result.localPath && await fs.pathExists(result.localPath)) {
          this.logger.info("   📄 app-config.local.yaml - Local configuration with your actual values");
        }

        this.logger.info("💡 Usage recommendations:");
        this.logger.info("   � Use app-config.yaml for deployment environments (contains placeholders)");
        this.logger.info("   🔹 Use app-config.local.yaml for local development (contains actual values)");
        this.logger.info("   🔹 Add app-config.local.yaml to .gitignore to protect secrets");
        
        // Update migration summary
        this.migrationState.configFiles = {
          template: result.templatePath,
          local: result.localPath,
          dualModeEnabled: true
        };
      } else {
        this.logger.warn(`⚠️ Dual configuration creation failed: ${result.reason || result.error}`);
        this.migrationState.warnings.push(`Dual configuration creation failed: ${result.reason || result.error}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error creating dual configuration files: ${error.message}`);
      this.migrationState.warnings.push(`Dual configuration creation failed: ${error.message}`);
    }
  }

  async validateDualConfigStructure(destinationPath) {
    try {
      const templatePath = path.join(destinationPath, "app-config.yaml");
      const localPath = path.join(destinationPath, "app-config.local.yaml");
      
      if (await fs.pathExists(templatePath) && await fs.pathExists(localPath)) {
        // Use YamlConfigMerger validation if available through authConfigure
        if (this.authConfigure && this.authConfigure.yamlMerger && 
            typeof this.authConfigure.yamlMerger.validateDualConfigStructure === 'function') {
          
          const validation = await this.authConfigure.yamlMerger.validateDualConfigStructure(destinationPath);
          
          if (validation.isValid) {
            this.logger.info("✅ Dual configuration structure validation passed");
            this.logger.info("   🔹 Both app-config.yaml and app-config.local.yaml have identical structure");
          } else {
            this.logger.warn("⚠️ Dual configuration structure validation failed:");
            this.logger.warn(`   🔹 ${validation.message}`);
            this.migrationState.warnings.push(`Dual config structure mismatch: ${validation.message}`);
          }
        } else {
          this.logger.info("ℹ️ Basic dual config files exist - detailed validation not available");
        }
      }
    } catch (error) {
      this.logger.warn(`⚠️ Could not validate dual config structure: ${error.message}`);
    }
  }

  // Migration summary display for Phase 1 & 2
  displayMigrationSummary() {
    console.log("\n" + chalk.green("🎉 Migration Summary:"));
    console.log(
      chalk.blue(`📊 Total Steps: ${this.migrationState.totalSteps}`)
    );
    console.log(
      chalk.green(`✅ Completed Steps: ${this.migrationState.currentStep}`)
    );
    console.log(chalk.red(`❌ Errors: ${this.migrationState.errors.length}`));
    console.log(
      chalk.yellow(`⚠️ Warnings: ${this.migrationState.warnings.length}`)
    );

    if (this.migrationState.errors.length > 0) {
      console.log("\n" + chalk.red("❌ Errors:"));
      this.migrationState.errors.forEach((error, index) => {
        console.log(`${index + 1}. Step ${error.step}: ${error.message}`);
      });
    }

    if (this.migrationState.warnings.length > 0) {
      console.log("\n" + chalk.yellow("⚠️ Warnings:"));
      this.migrationState.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    console.log("\n" + chalk.blue("🚀 Next Steps:"));
    console.log("1. Navigate to your application directory");
    console.log("2. Run: yarn install (if not auto-installed)");

    if (this.options.phase >= 2) {
      // Check if Phase 2 configuration is complete
      const hasBackendAuth = this.migrationConfig && this.migrationConfig.backendAuth;
      const hasDatabaseConfig = this.migrationConfig && this.migrationConfig.databaseConfig;
      const hasGitHubAuth = this.migrationConfig && this.migrationConfig.githubAuth && !this.migrationConfig.githubAuth.requiresManualSetup;
      
      // Display dual configuration information if available
      if (this.dualConfigResults && this.dualConfigResults.anyCreated) {
        console.log("\n" + chalk.green("📄 Dual Configuration Files:"));
        console.log("   ✅ Created both main and local configuration files");
        console.log("   📄 app-config.yaml - Main configuration for deployment (with placeholders)");
        console.log("   📄 app-config.local.yaml - Local configuration with your actual values");
        console.log("\n" + chalk.blue("💡 Configuration Usage:"));
        console.log("   🔹 Use app-config.yaml for deployment (contains placeholders like ${ENV_VAR})");
        console.log("   🔹 Use app-config.local.yaml for local development (contains your actual values)");
        console.log("   🔹 Add app-config.local.yaml to .gitignore to protect credentials");
      }
      
      if (hasBackendAuth && hasDatabaseConfig && hasGitHubAuth) {
        console.log("\n3. ✅ app-config.yaml setup already completed with:");
        console.log("   - Database configuration");
        console.log("   - Backend authentication secrets");
        console.log("   - GitHub authentication & PAT integration");
        
        if (this.dualConfigResults && this.dualConfigResults.anyCreated) {
          console.log("   - Dual configuration files for deployment flexibility");
        }
        
        console.log("4. Run: yarn dev");
        console.log("5. Open: http://localhost:3000");
      } else {
        console.log("\n3. Manually update app-config.yaml with missing configuration:");
        if (!hasBackendAuth) {
          console.log("   - Backend authentication secrets (BACKEND_SECRET, AUTH_SESSION_SECRET)");
        }
        if (!hasDatabaseConfig) {
          console.log("   - Database connection details (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD)");
        }
        if (!hasGitHubAuth) {
          console.log("   - GitHub OAuth credentials and Personal Access Token");
        }
        console.log("4. Run: yarn dev");
        console.log("5. Open: http://localhost:3000");
      }
      
      // Display Phase 3 specific results if available
      if (this.options.phase >= 3 && this.migrationState.phase3Results) {
        console.log("\n" + chalk.magenta("🚀 Phase 3: Integration Results:"));
        const results = this.migrationState.phase3Results;
        
        console.log(`   📊 Total integrations: ${results.totalIntegrations}`);
        console.log(`   ✅ Successful: ${results.successfulIntegrations}`);
        console.log(`   ❌ Failed: ${results.failedIntegrations}`);
        
        if (results.summary?.integratedTemplates?.length > 0) {
          console.log("\n" + chalk.blue("📄 Integrated Templates:"));
          results.summary.integratedTemplates.forEach(template => {
            console.log(`   ✓ ${template}`);
          });
        }
        
        if (results.summary?.integratedPlugins?.length > 0) {
          console.log("\n" + chalk.blue("🔌 Integrated Plugins:"));
          results.summary.integratedPlugins.forEach(plugin => {
            console.log(`   ✓ ${plugin}`);
          });
        }
        
        if (results.summary?.errors?.length > 0) {
          console.log("\n" + chalk.red("❌ Integration Errors:"));
          results.summary.errors.forEach(error => {
            console.log(`   • ${error}`);
          });
        }
        
        console.log("\n" + chalk.blue("🎯 Phase 3 Next Steps:"));
        console.log("   1. Review integrated templates and plugins");
        console.log("   2. Test new functionality in your application");
        console.log("   3. Customize templates as needed for your use case");
      }
      
    } else {
      console.log("3. Run: yarn dev");
      console.log("4. Open: http://localhost:3000");
    }
  }

  // ===== PHASE 3 METHODS =====

  async validatePhase3Prerequisites(config) {
    this.logger.info("🔍 Validating Phase 3 prerequisites...");
    
    // Validate that Phase 2 is completed
    // Validate source package structure for templates
    const templatesPath = path.join(config.sourcePath, "Flowsource-templates");
    if (!(await fs.pathExists(templatesPath))) {
      throw new Error(`Flowsource-templates directory not found: ${templatesPath}`);
    }

    this.logger.info("✅ Phase 3 prerequisites validated");
  }

  async processPhase3Selections(config) {
    this.logger.info("📋 Processing Phase 3 integration selections...");
    
    if (!config.phase3Options) {
      throw new Error("Phase 3 options not configured - should be set in interactive mode");
    }

    this.logger.info(`🎯 Integration type: ${config.phase3Options.integrationType}`);
    
    if (config.phase3Options.selectedTemplates) {
      this.logger.info(`📄 Selected templates: ${config.phase3Options.selectedTemplates.join(', ')}`);
    }
    
    if (config.phase3Options.selectedPlugins) {
      this.logger.info(`🔌 Selected plugins: ${config.phase3Options.selectedPlugins.join(', ')}`);
    }
  }

  async integrateTemplates(config) {
    this.logger.info("📄 Starting intelligent template integration...");
    
    // Initialize TemplateManager with shared YamlMerger for dual configuration consistency
    if (!this.templateManager) {
      this.templateManager = new TemplateManager(
        config, 
        this.logger, 
        this.fileManager, 
        this.sharedYamlMerger // Pass shared instance for dual config alignment
      );
    }

    // Get selected templates from config
    const selectedTemplates = config.phase3Options?.selectedTemplates || [];
    
    if (selectedTemplates.length === 0) {
      this.logger.warn("⚠️ No templates selected for integration");
      return;
    }

    try {
      // Integrate templates using the intelligent parser
      const result = await this.templateManager.integrateSelectedTemplates(selectedTemplates);
      
      if (result.success) {
        this.logger.info(`✅ Successfully integrated ${result.integratedTemplates.length} templates`);
        result.integratedTemplates.forEach(template => {
          this.logger.info(`   📄 ${template}`);
        });
      }
    } catch (error) {
      this.logger.error(`❌ Template integration failed: ${error.message}`);
      throw error;
    }
  }

  async integratePlugins(config) {
    this.logger.info("🔌 Starting plugin integration...");
    
    // TODO: Implement plugin integration using PluginManager
    // For now, show "coming soon" message
    this.logger.info("🔌 Plugin integration is coming soon!");
    
    if (config.phase3Options?.selectedPlugins) {
      config.phase3Options.selectedPlugins.forEach(plugin => {
        this.logger.info(`🔌 Plugin ${plugin} integration coming soon`);
      });
    }
    
    this.logger.info("✅ Plugins integration completed (stub implementation)");
  }

  async updateConfigurationForPhase3(config) {
    this.logger.info("⚙️ Updating configuration files for Phase 3...");
    
    // Configuration updates are handled automatically by TemplateManager
    // during template integration via YamlConfigMerger
    
    // Additional Phase 3 configuration updates can be added here
    // For example: updating package.json with plugin dependencies when implemented
    
    this.logger.info("✅ Configuration files updated for Phase 3");
  }

  async validatePhase3Integrations(config) {
    this.logger.info("🔍 Validating Phase 3 integrations...");
    
    // Validate template integrations if templates were selected
    if (config.phase3Options?.selectedTemplates && config.phase3Options.selectedTemplates.length > 0) {
      if (!this.templateManager) {
        this.templateManager = new TemplateManager(
          config, 
          this.logger, 
          this.fileManager, 
          this.sharedYamlMerger // Pass shared instance for consistency
        );
      }
      
      try {
        await this.templateManager.validateTemplateIntegration(config.phase3Options.selectedTemplates);
        this.logger.info("✅ Template integrations validated successfully");
      } catch (error) {
        this.logger.error(`❌ Template validation failed: ${error.message}`);
        throw error;
      }
    }

    // TODO: Validate plugin integrations when implemented
    
    this.logger.info("✅ Phase 3 integrations validated successfully");
  }

  async finalizePhase3Setup(config) {
    this.logger.info("🎁 Finalizing Phase 3 setup...");
    
    // Validate the final integrations without rebuilding dual config files
    // Dual config files were already built at the end of Phase 2
    await this.validateDualConfigStructure(config.destinationPath);
    
    this.logger.info("✅ Phase 3 setup finalized");
  }

  // Calculate dynamic total steps for Phase 3 based on user selections
  calculatePhase3TotalSteps(config) {
    let baseSteps = 14; // Phase 1 (8) + Phase 2 (6) steps
    let phase3Steps = 3; // Simplified Phase 3 steps via orchestrator: validate, execute integrations, finalize
    
    // Note: The orchestrator handles the complexity internally, but FlowSourceAgent 
    // only needs to track the high-level steps
    const totalSteps = baseSteps + phase3Steps;
    this.logger.info(`📊 Calculated total steps for Phase 3: ${totalSteps} (base: ${baseSteps}, phase3: ${phase3Steps})`);
    this.logger.info(`📋 Phase 3 integration type: ${config.phase3Options?.integrationType || 'unknown'}`);
    
    return totalSteps;
  }

  // Calculate dynamic total steps for Phase 2
  calculatePhase2TotalSteps() {
    const baseSteps = 8; // Phase 1 steps
    const phase2Steps = 6; // Phase 2: validate auth, process credentials, create dual config, validate setup, finalize
    const totalSteps = baseSteps + phase2Steps;
    
    this.logger.info(`📊 Calculated total steps for Phase 2: ${totalSteps} (phase1: ${baseSteps}, phase2: ${phase2Steps})`);
    return totalSteps;
  }
}
