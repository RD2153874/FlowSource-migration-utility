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
    this.interactiveMode = null;

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
      if (config.phase === 1) {
        await this.executePhase1(config, spinner);
      } else if (config.phase === 2) {
        await this.executePhase2(config, spinner);
      } else {
        throw new Error(
          `Unsupported phase: ${config.phase}. Supported phases: 1, 2`
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
    this.migrationState.totalSteps = 12; // Phase 1 (8) + Phase 2 (4) steps
    this.migrationState.errors = [];
    this.migrationState.warnings = [];

    // First, validate and execute Phase 1 if not already done
    await this.validateAndExecutePhase1(config, spinner);

    // Phase 2 specific steps - Authentication & Permissions
    this.logger.info("🔐 Starting Phase 2: Authentication & Permissions");

    // ADD: Collect GitHub credentials if in interactive mode
    if (this.interactiveMode && !config.githubAuth) {
      await this.executeStep(
        spinner,
        "Collecting GitHub authentication credentials...",
        async () => {
          await Promise.race([
            this.interactiveMode.collectGitHubAuthConfig(config),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('GitHub config timeout')), 120000)
            )
          ]);
        }
      );
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
  }

  // PHASE 1
  async executePhase1(config, spinner) {
    this.migrationState.totalSteps = 8;

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

    spinner.text = chalk.blue(`[${stepNumber}/${totalSteps}] ${message}`);
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
      // Update step counter to reflect completed Phase 1
      this.migrationState.currentStep = 8;
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

    // Initialize AuthConfigure class
    this.authConfigure = new AuthConfigure(
      config,
      this.logger,
      this.docParser,
      this.fileManager
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
        this.authConfigure
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
      console.log(
        "3. Configure GitHub OAuth App at: https://github.com/settings/applications/new"
      );
      console.log(
        "4. Update app-config.yaml with your GitHub OAuth credentials"
      );
      console.log("5. Run: yarn dev");
      console.log("6. Open: http://localhost:3000");
      console.log("\n" + chalk.cyan("🔐 Authentication Setup:"));
      console.log("- Homepage URL: http://localhost:3000");
      console.log(
        "- Authorization callback URL: http://localhost:3000/api/auth/github/handler/frame"
      );
    } else {
      console.log("3. Run: yarn dev");
      console.log("4. Open: http://localhost:3000");
    }
  }
}
