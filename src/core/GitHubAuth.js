import path from "path";
import fs from "fs-extra";
import inquirer from "inquirer";
import YamlConfigMerger from "../utils/YamlConfigMerger.js";

export class GitHubAuth {
  constructor(config, logger, docParser, fileManager, authConfigure) {
    this.config = config;
    this.logger = logger;
    this.docParser = docParser;
    this.fileManager = fileManager;
    this.authConfigure = authConfigure;
    this.githubDocumentation = null;
    this.githubConfig = {};
    this.yamlMerger = new YamlConfigMerger(logger);
  }

  async setup() {
    // Check if credentials are pre-configured
    if (this.config.githubAuth) {
      this.logger.info("🤖 Using pre-configured GitHub credentials");
      await this.setupGitHubOnlyNonInteractive();
      return;
    }

    await this.setupGitHubOnly();
  }

  async setupGitHubOnly() {
    this.logger.info("🐙 Starting GitHub authentication setup...");

    // Step 1: Find and parse GithubAuth.md
    await this.findAndParseGitHubDoc();

    // Step 2: Extract GitHub-specific instructions
    await this.extractGitHubInstructions();

    // Step 3: Collect GitHub OAuth credentials
    await this.collectGitHubCredentials();

    // Step 4: Implement GitHub authentication instructions
    await this.implementGitHubInstructions();

    this.logger.info("✅ GitHub authentication setup completed");
  }

  async setupGitHubOnlyNonInteractive() {
    this.logger.info("🐙 Starting non-interactive GitHub authentication setup...");

    // Use default GitHub configuration without prompts
    this.githubConfig = {
      clientId: "YOUR_GITHUB_CLIENT_ID",
      clientSecret: "YOUR_GITHUB_CLIENT_SECRET",
      organization: "TheCognizantFoundry", 
      callbackUrl: "http://localhost:7007/api/auth/github/handler/frame",
      requiresManualSetup: true,
      personalAccessToken: "YOUR_GITHUB_TOKEN"
    };

    this.logger.info("📋 Using default GitHub configuration (manual setup required)");

    // Skip documentation parsing in non-interactive mode to avoid potential hanging
    this.githubInstructions = [];
    this.githubConfigBlocks = [];

    // Copy GitHub-specific authentication files
    await this.copyGitHubAuthFiles();

    // Configure frontend App.tsx with GitHub provider (Step 6 from GithubAuth.md)
    await this.setupFrontendGitHubProvider();

    // Update app configuration with GitHub settings
    await this.updateAppConfigWithGitHub();

    // Update package.json files with GitHub auth dependencies
    await this.updatePackageJsonForGitHub();

    this.logger.info("✅ Non-interactive GitHub authentication setup completed");
    this.logger.warn("⚠️ Manual configuration required:");
    this.logger.warn("   - Update GitHub OAuth credentials in app-config.yaml");
    this.logger.warn("   - Replace YOUR_GITHUB_TOKEN with actual Personal Access Token");
    this.logger.warn("   - Configure GitHub App credentials if using GitHub App integration");
  }

  getGitHubAuthReference() {
    return this.authConfigure.providerReferences.find(
      (ref) =>
        ref.name.toLowerCase().includes("github") ||
        ref.file.toLowerCase().includes("github")
    );
  }
  async findAndParseGitHubDoc() {
    try {
      // First try to find the referenced file from AuthConfigure
      const githubRef = this.authConfigure.getGitHubAuthReference();
      let githubDocPath;

      if (githubRef && githubRef.file) {
        githubDocPath = path.join(
          this.config.sourcePath,
          "FlowSourceInstaller",
          "FlowsourceSetupDoc",
          githubRef.file
        );
      } else {
        // Fallback to common naming conventions
        const possibleNames = [
          "GithubAuth.md",
          "GitHubAuth.md", 
          "github-auth.md",
        ];

        for (const name of possibleNames) {
          const testPath = path.join(
            this.config.sourcePath,
            "FlowSourceInstaller",
            "FlowsourceSetupDoc",
            name
          );
          if (await fs.pathExists(testPath)) {
            githubDocPath = testPath;
            break;
          }
        }
      }

      if (!githubDocPath || !(await fs.pathExists(githubDocPath))) {
        this.logger.warn(
          `⚠️ GitHub authentication documentation not found. Checked: ${githubDocPath || 'undefined'}`
        );
        this.logger.warn("⚠️ Skipping documentation parsing - using basic GitHub setup");
        this.githubDocumentation = null;
        return;
      }

      this.logger.info(
        `📄 Found GitHub auth documentation: ${path.basename(githubDocPath)}`
      );
      this.githubDocumentation = await this.docParser.parse(githubDocPath);
      this.logger.info("✅ GitHub authentication documentation parsed");
    } catch (error) {
      this.logger.warn(`⚠️ Failed to parse GitHub documentation: ${error.message}`);
      this.logger.warn("⚠️ Continuing with basic GitHub setup");
      this.githubDocumentation = null;
    }
  }

  async extractGitHubInstructions() {
    if (!this.githubDocumentation) {
      this.logger.warn("⚠️ GitHub documentation not loaded - using empty instructions");
      this.githubInstructions = [];
      this.githubConfigBlocks = [];
      return;
    }

    this.githubInstructions = [];
    this.githubConfigBlocks = [];

    try {
      // Extract instructions from sections
      if (this.githubDocumentation.sections) {
        this.githubDocumentation.sections.forEach((section) => {
          if (
            section.title &&
            (section.title.toLowerCase().includes("setup") ||
              section.title.toLowerCase().includes("config") ||
              section.title.toLowerCase().includes("step") ||
              section.title.toLowerCase().includes("github") ||
              section.title.toLowerCase().includes("implementation"))
          ) {
            this.githubInstructions.push({
              type: "section",
              title: section.title,
              content: section.content,
              steps: this.extractStepsFromContent(section.content),
            });
          }
        });
      }

      // Extract configuration blocks specific to GitHub
      if (this.githubDocumentation.codeBlocks) {
        this.githubConfigBlocks = this.githubDocumentation.codeBlocks.filter(
          (block) => {
            const blockContentText = this.docParser.contentToText(block.content).toLowerCase();
            return (
              blockContentText.includes("github") ||
              blockContentText.includes("clientid") ||
              blockContentText.includes("clientsecret") ||
              blockContentText.includes("githubauthapi")
            );
          }
        );
      }

      this.logger.info(
        `📋 Extracted ${this.githubInstructions.length} GitHub instruction sections`
      );
      this.logger.info(
        `⚙️ Found ${this.githubConfigBlocks.length} GitHub configuration blocks`
      );
    } catch (error) {
      this.logger.warn(`⚠️ Failed to extract GitHub instructions: ${error.message}`);
      this.logger.warn("⚠️ Using empty instructions");
      this.githubInstructions = [];
      this.githubConfigBlocks = [];
    }
  }

  extractStepsFromContent(content) {
    const steps = [];
    // Convert content array to text string
    const contentText = this.docParser.contentToText(content);
    const lines = contentText.split("\n");

    lines.forEach((line) => {
      // Look for numbered steps
      const numberedMatch = line.match(/^\s*(\d+)\.\s*(.+)/);
      if (numberedMatch) {
        steps.push({
          number: parseInt(numberedMatch[1]),
          instruction: numberedMatch[2].trim(),
        });
      }

      // Look for action bullet points
      const bulletMatch = line.match(/^\s*[-*]\s*(.+)/);
      if (bulletMatch && this.isGitHubActionInstruction(bulletMatch[1])) {
        steps.push({
          type: "action",
          instruction: bulletMatch[1].trim(),
        });
      }
    });

    return steps;
  }

  isGitHubActionInstruction(text) {
    const githubActions = [
      "oauth",
      "client",
      "secret",
      "callback",
      "homepage",
      "authorize",
      "create",
      "configure",
      "setup",
      "add",
      "update",
      "install",
      "register",
    ];
    return githubActions.some((action) => text.toLowerCase().includes(action));
  }

  async collectGitHubCredentials() {
    this.logger.info("🔑 Collecting GitHub OAuth credentials...");

    // Check if credentials are already provided in config
    if (this.config.githubAuth) {
      this.githubConfig = this.config.githubAuth;
      this.logger.info("✅ Using provided GitHub credentials");
      return;
    }

    // Check if running in non-interactive mode
    if (this.config.nonInteractive) {
      this.logger.info("🤖 Non-interactive mode - using default placeholder credentials");
      this.githubConfig = {
        clientId: "YOUR_GITHUB_CLIENT_ID",
        clientSecret: "YOUR_GITHUB_CLIENT_SECRET",
        organization: "TheCognizantFoundry",
        callbackUrl: "http://localhost:7007/api/auth/github/handler/frame",
        requiresManualSetup: true,
        personalAccessToken: "YOUR_GITHUB_TOKEN"
      };
      return;
    }

    // Interactive prompts for GitHub OAuth credentials
    try {
      const oauthQuestions = [
        {
          type: "confirm",
          name: "hasOAuthApp",
          message: "Do you have a GitHub OAuth App created?",
          default: false,
        },
        {
          type: "input",
          name: "clientId",
          message: "Enter your GitHub OAuth App Client ID:",
          when: (answers) => answers.hasOAuthApp,
          validate: (input) => {
            if (!input || input.trim().length === 0) {
              return "Client ID is required";
            }
            return true;
          },
        },
        {
          type: "password",
          name: "clientSecret",
          message: "Enter your GitHub OAuth App Client Secret:",
          when: (answers) => answers.hasOAuthApp,
          validate: (input) => {
            if (!input || input.trim().length === 0) {
              return "Client Secret is required";
            }
            return true;
          },
        },
        {
          type: "input",
          name: "organization",
          message: "Enter your GitHub organization name (optional):",
          default: "TheCognizantFoundry",
          when: (answers) => answers.hasOAuthApp,
        },
        {
          type: "input",
          name: "callbackUrl",
          message: "Enter the authorization callback URL:",
          default: "http://localhost:7007/api/auth/github/handler/frame",
          when: (answers) => answers.hasOAuthApp,
        },
      ];

      const oauthAnswers = await inquirer.prompt(oauthQuestions);

      if (!oauthAnswers.hasOAuthApp) {
        this.logger.warn(
          "⚠️ GitHub OAuth App not configured. Manual setup required."
        );
        this.githubConfig = {
          clientId: "YOUR_GITHUB_CLIENT_ID",
          clientSecret: "YOUR_GITHUB_CLIENT_SECRET",
          organization: "TheCognizantFoundry",
          callbackUrl: "http://localhost:7007/api/auth/github/handler/frame",
          requiresManualSetup: true,
        };
      } else {
        this.githubConfig = {
          clientId: oauthAnswers.clientId.trim(),
          clientSecret: oauthAnswers.clientSecret.trim(),
          organization: oauthAnswers.organization?.trim() || "TheCognizantFoundry",
          callbackUrl: oauthAnswers.callbackUrl.trim(),
          requiresManualSetup: false,
        };
      }

      // Always collect GitHub integration credentials (PAT or GitHub App) - this is the important part!
      await this.collectGitHubIntegrationCredentials();
      
    } catch (error) {
      this.logger.warn("⚠️ OAuth credential collection failed, using defaults");
      this.logger.warn(`Error: ${error.message}`);
      this.githubConfig = {
        clientId: "YOUR_GITHUB_CLIENT_ID",
        clientSecret: "YOUR_GITHUB_CLIENT_SECRET",
        organization: "TheCognizantFoundry",
        callbackUrl: "http://localhost:7007/api/auth/github/handler/frame",
        requiresManualSetup: true,
        personalAccessToken: "YOUR_GITHUB_TOKEN"
      };
    }
  }

  async collectGitHubIntegrationCredentials() {
    this.logger.info("🔗 Collecting GitHub integration credentials...");

    // Skip integration credential collection if in non-interactive mode  
    if (this.config.nonInteractive) {
      this.logger.info("🤖 Non-interactive mode - using default PAT placeholder");
      this.githubConfig.personalAccessToken = "YOUR_GITHUB_TOKEN";
      return;
    }

    // First ask which integration method they prefer
    const methodQuestion = [
      {
        type: "list",
        name: "integrationMethod",
        message: "Choose your GitHub integration method:",
        choices: [
          {
            name: "Personal Access Token (PAT) - Simple setup, basic features",
            value: "pat"
          },
          {
            name: "GitHub App - Advanced features, better security, recommended for organizations",
            value: "github-app"
          }
        ],
        default: "pat"
      }
    ];

    try {
      const methodAnswer = await inquirer.prompt(methodQuestion);

      if (methodAnswer.integrationMethod === "github-app") {
        // GitHub App flow
        const githubAppQuestions = [
          {
            type: "confirm",
            name: "hasGitHubApp",
            message: "Do you have a GitHub App already created?",
            default: false,
          }
        ];

        const hasAppAnswer = await inquirer.prompt(githubAppQuestions);

        if (!hasAppAnswer.hasGitHubApp) {
          this.logger.info("📋 To create a GitHub App, visit: https://github.com/settings/apps/new");
          this.logger.info("📋 Required permissions: Contents (read), Metadata (read), Pull requests (read)");
          this.logger.info("📋 Callback URL: http://localhost:7007/api/auth/github/handler/frame");
          
          const continueQuestion = [{
            type: "confirm",
            name: "continue",
            message: "Have you created the GitHub App and want to continue with configuration?",
            default: false
          }];

          const continueAnswer = await inquirer.prompt(continueQuestion);
          if (!continueAnswer.continue) {
            this.logger.warn("⚠️ GitHub App setup cancelled. Using fallback PAT configuration.");
            await this.collectPATCredentials();
            return;
          }
        }

        await this.collectGitHubAppCredentials();
      } else {
        // PAT flow
        await this.collectPATCredentials();
      }
    } catch (error) {
      this.logger.warn("⚠️ Integration credential collection failed, using default PAT placeholder");
      this.logger.warn(`Error: ${error.message}`);
      this.githubConfig.personalAccessToken = "YOUR_GITHUB_TOKEN";
    }
  }

  async collectPATCredentials() {
    this.logger.info("🔑 Collecting Personal Access Token credentials...");
    
    try {
      const patQuestions = [
        {
          type: "input",
          name: "personalAccessToken",
          message: "Enter your GitHub Personal Access Token (for repository integration):",
          validate: (input) => {
            if (!input || input.trim().length === 0) {
              return "Personal Access Token is required for GitHub integration";
            }
            if (input.trim().length < 20) {
              return "GitHub Personal Access Token should be at least 20 characters long";
            }
            return true;
          },
        }
      ];

      const patAnswers = await inquirer.prompt(patQuestions);
      this.githubConfig.personalAccessToken = patAnswers.personalAccessToken.trim();
      this.logger.info("✅ Personal Access Token configured");
    } catch (error) {
      this.logger.warn("⚠️ PAT collection failed, using placeholder");
      this.logger.warn(`Error: ${error.message}`);
      this.githubConfig.personalAccessToken = "YOUR_GITHUB_TOKEN";
    }
  }

  async collectGitHubAppCredentials() {
    this.logger.info("🔧 Collecting GitHub App credentials...");

    try {
      const githubAppQuestions = [
        {
          type: "input",
          name: "appId",
          message: "Enter your GitHub App ID:",
          validate: (input) => {
            if (!input || input.trim().length === 0) {
              return "GitHub App ID is required";
            }
            if (!/^\d+$/.test(input.trim())) {
              return "GitHub App ID should be a number";
            }
            return true;
          },
        },
        {
          type: "input",
          name: "appClientId", 
          message: "Enter your GitHub App Client ID:",
          validate: (input) => {
            if (!input || input.trim().length === 0) {
              return "GitHub App Client ID is required";
            }
            return true;
          },
        },
        {
          type: "password",
          name: "appClientSecret",
          message: "Enter your GitHub App Client Secret:",
          validate: (input) => {
            if (!input || input.trim().length === 0) {
              return "GitHub App Client Secret is required";
            }
            return true;
          },
        },
        {
          type: "editor",
          name: "privateKey",
          message: "Enter your GitHub App Private Key (paste the entire key including headers):",
          validate: (input) => {
            if (!input || input.trim().length === 0) {
              return "GitHub App Private Key is required";
            }
            if (!input.includes("BEGIN") || !input.includes("END")) {
              return "Please provide a valid private key with BEGIN and END headers";
            }
            return true;
          },
        },
      ];

      const githubAppAnswers = await inquirer.prompt(githubAppQuestions);

      this.githubConfig.githubApp = {
        appId: githubAppAnswers.appId.trim(),
        clientId: githubAppAnswers.appClientId.trim(),
        clientSecret: githubAppAnswers.appClientSecret.trim(),
        privateKey: githubAppAnswers.privateKey.trim(),
      };

      this.logger.info("✅ GitHub App credentials collected");
      this.logger.info("✅ GitHub integration credentials collected");
    } catch (error) {
      this.logger.warn("⚠️ GitHub App credential collection failed, falling back to PAT");
      this.logger.warn(`Error: ${error.message}`);
      await this.collectPATCredentials();
    }
  }

  async implementGitHubInstructions() {
    this.logger.info("⚙️ Implementing GitHub authentication instructions...");

    // Process each GitHub instruction section
    for (const instruction of this.githubInstructions) {
      await this.processGitHubInstructionSection(instruction);
    }

    // Apply GitHub configuration blocks
    for (const configBlock of this.githubConfigBlocks) {
      await this.applyGitHubConfigurationBlock(configBlock);
    }

    // Copy GitHub-specific authentication files
    await this.copyGitHubAuthFiles();

    // Configure frontend App.tsx with GitHub provider (Step 6 from GithubAuth.md)
    await this.setupFrontendGitHubProvider();

    // Update app configuration with GitHub settings
    await this.updateAppConfigWithGitHub();

    // Update package.json files with GitHub auth dependencies
    await this.updatePackageJsonForGitHub();

    this.logger.info("✅ GitHub authentication instructions implemented");
  }

  async processGitHubInstructionSection(instruction) {
    this.logger.info(`📝 Processing GitHub instruction: ${instruction.title}`);

    for (const step of instruction.steps) {
      await this.executeGitHubInstruction(step);
    }
  }

  async executeGitHubInstruction(step) {
    const instruction = step.instruction.toLowerCase();

    try {
      if (instruction.includes("create") && instruction.includes("oauth")) {
        await this.handleOAuthAppCreation(step);
      } else if (
        instruction.includes("configure") &&
        instruction.includes("callback")
      ) {
        await this.handleCallbackConfiguration(step);
      } else if (
        instruction.includes("update") &&
        instruction.includes("app-config")
      ) {
        await this.handleAppConfigUpdate(step);
      } else if (
        instruction.includes("add") &&
        instruction.includes("import")
      ) {
        await this.handleImportAddition(step);
      } else if (
        instruction.includes("register") &&
        instruction.includes("provider")
      ) {
        await this.handleProviderRegistration(step);
      } else if (
        instruction.includes("install") &&
        instruction.includes("package")
      ) {
        await this.handlePackageInstallation(step);
      } else {
        this.logger.info(`ℹ️ Generic GitHub instruction: ${step.instruction}`);
        await this.handleGenericGitHubInstruction(step);
      }
    } catch (error) {
      this.logger.warn(
        `⚠️ Failed to execute GitHub instruction: ${step.instruction} - ${error.message}`
      );
    }
  }

  async handleAuthFileCopy(step) {
    // Copy authentication-related files
    const authSourcePath = path.join(
      this.config.sourcePath,
      "packages-core",
      "backend",
      "src",
      "plugins"
    );
    const authDestPath = path.join(
      this.config.destinationPath,
      "packages",
      "backend",
      "src",
      "plugins"
    );

    if (await fs.pathExists(authSourcePath)) {
      await fs.copy(authSourcePath, authDestPath, { overwrite: true });
      this.logger.info("📄 Copied authentication plugin files");
    }
  }

  async handleBackendUpdate(step) {
    // Update backend index.ts to include auth plugin
    const backendIndexPath = path.join(
      this.config.destinationPath,
      "packages",
      "backend",
      "src",
      "index.ts"
    );

    if (await fs.pathExists(backendIndexPath)) {
      let indexContent = await fs.readFile(backendIndexPath, "utf8");

      // Add auth plugin import and registration
      if (!indexContent.includes("auth")) {
        const authImport = `import auth from './plugins/auth';`;
        const authBackend = `  backend.add(import('./plugins/auth'));`;

        // Add import
        const importRegex = /(import.*from.*plugins.*;\n)/g;
        const matches = indexContent.match(importRegex);
        if (matches) {
          const lastImport = matches[matches.length - 1];
          indexContent = indexContent.replace(
            lastImport,
            lastImport + "\n" + authImport
          );
        }

        // Add backend registration
        const backendStartRegex = /(backend\.start\(\);)/;
        indexContent = indexContent.replace(
          backendStartRegex,
          `${authBackend}\n\n  $1`
        );

        await fs.writeFile(backendIndexPath, indexContent, "utf8");
        this.logger.info("📄 Updated backend index.ts with auth plugin");
      }
    }
  }

  async handleSignInPageSetup(step) {
    // Copy and setup SignInPage component
    const signInSourcePath = path.join(
      this.config.sourcePath,
      "packages-core",
      "app",
      "src",
      "components",
      "SignInPage"
    );
    const signInDestPath = path.join(
      this.config.destinationPath,
      "packages",
      "app",
      "src",
      "components",
      "SignInPage"
    );

    if (await fs.pathExists(signInSourcePath)) {
      await fs.copy(signInSourcePath, signInDestPath, { overwrite: true });
      this.logger.info("📄 Copied SignInPage component");

      // Update App.tsx to use SignInPage
      await this.updateAppWithSignInPage();
    }
  }

  async updateAppWithSignInPage() {
    const appTsxPath = path.join(
      this.config.destinationPath,
      "packages",
      "app",
      "src",
      "App.tsx"
    );

    if (await fs.pathExists(appTsxPath)) {
      let appContent = await fs.readFile(appTsxPath, "utf8");

      // Add SignInPage import
      const signInImport = `import { SignInPage } from './components/SignInPage';`;

      if (!appContent.includes("SignInPage")) {
        const componentImportRegex = /(import.*from.*components.*;\n)/g;
        const matches = appContent.match(componentImportRegex);
        if (matches) {
          const lastImport = matches[matches.length - 1];
          appContent = appContent.replace(
            lastImport,
            lastImport + "\n" + signInImport
          );
        }

        // Update createApp configuration
        const createAppRegex = /(createApp\(\{[\s\S]*?)\}\)/;
        const createAppMatch = appContent.match(createAppRegex);

        if (createAppMatch) {
          const existingConfig = createAppMatch[1];
          const signInPageComponent = `  components: { SignInPage: props => <SignInPage {...props} /> },\n`;
          const providerConfig = `  providers: ['github'],\n`;

          if (!existingConfig.includes("components:")) {
            const updatedConfig =
              existingConfig + `,\n${signInPageComponent}${providerConfig}`;
            appContent = appContent.replace(
              createAppRegex,
              updatedConfig + "})"
            );
          }
        }

        await fs.writeFile(appTsxPath, appContent, "utf8");
        this.logger.info(
          "📄 Updated App.tsx with SignInPage and GitHub provider"
        );
      }
    }
  }

  async handleAppConfigUpdate(step) {
    // Handle app-config.yaml updates specific to GitHub
    await this.updateAppConfigWithGitHub();
  }

  async handleGenericGitHubInstruction(step) {
    this.logger.info(
      `📋 Processing generic GitHub instruction: ${step.instruction}`
    );
  }

  async applyGitHubConfigurationBlock(configBlock) {
    this.logger.info(
      `⚙️ Applying GitHub ${configBlock.language} configuration`
    );

    if (configBlock.language === "yaml") {
      await this.applyGitHubYamlConfig(configBlock);
    } else if (
      configBlock.language === "typescript" ||
      configBlock.language === "javascript"
    ) {
      await this.applyGitHubCodeConfig(configBlock);
    }
  }

  async applyGitHubYamlConfig(configBlock) {
    const appConfigPath = path.join(
      this.config.destinationPath,
      "app-config.yaml"
    );

    if (await fs.pathExists(appConfigPath)) {
      // Extract YAML configuration from the markdown block
      const blockContentText = this.docParser.contentToText(configBlock.content);
      let configContent = blockContentText;

      // Replace placeholders with actual values
      configContent = configContent
        // Handle environment variable style placeholders
        .replace(/\$\{GITHUB_CLIENT_ID\}/g, this.githubConfig.clientId)
        .replace(/\$\{GITHUB_CLIENT_SECRET\}/g, this.githubConfig.clientSecret)
        .replace(/\$\{AUTH_GITHUB_CLIENT_ID\}/g, this.githubConfig.clientId)
        .replace(/\$\{AUTH_GITHUB_CLIENT_SECRET\}/g, this.githubConfig.clientSecret)
        // Handle angle bracket style placeholders from documentation
        .replace(/<GitHub client ID>/g, this.githubConfig.clientId)
        .replace(/<GitHub client secret>/g, this.githubConfig.clientSecret)
        .replace(/<GITHUB_CLIENT_ID>/g, this.githubConfig.clientId)
        .replace(/<GITHUB_CLIENT_SECRET>/g, this.githubConfig.clientSecret)
        .replace(/<GITHUB_APP_CLIENT_ID>/g, this.githubConfig.clientId)
        .replace(/<GITHUB_APP_CLIENT_SECRET>/g, this.githubConfig.clientSecret)
        // Handle other common placeholders
        .replace(/<add your github personal access token>/g, '${GITHUB_TOKEN}')
        .replace(/<GITHUB_APP_APP_ID>/g, '${GITHUB_APP_APP_ID}')
        .replace(/<GITHUB_APP_PRIVATE_KEY>/g, '${GITHUB_APP_PRIVATE_KEY}');

      try {
        // Parse the YAML configuration from the content
        const yamlConfig = this.yamlMerger.extractYamlFromMarkdown('```yaml\n' + configContent + '\n```');
        
        if (Object.keys(yamlConfig).length > 0) {
          // Merge into existing app-config.yaml using the YAML merger
          const success = await this.yamlMerger.mergeIntoYamlFile(
            appConfigPath, 
            yamlConfig, 
            "GitHub Authentication Configuration from GithubAuth.md"
          );
          
          if (success) {
            this.logger.info("📄 Applied GitHub YAML configuration to app-config.yaml");
          } else {
            this.logger.error("❌ Failed to merge GitHub YAML configuration");
          }
        } else {
          this.logger.warn("⚠️ No valid YAML configuration found in GitHub documentation block");
        }
      } catch (error) {
        this.logger.error("❌ Failed to parse GitHub YAML configuration:", error.message);
      }
    }
  }

  async applyGitHubCodeConfig(configBlock) {
    const content = configBlock.content;

    if (content.includes("authProviders.registerProvider")) {
      await this.addProviderRegistration(configBlock);
    } else if (content.includes("githubResolver")) {
      await this.addGitHubResolver(configBlock);
    } else if (content.includes("githubAuthProvider")) {
      await this.addFrontendProvider(configBlock);
    } else if (content.includes("githubAuthApiRef")) {
      // Handle Step 6: GitHub auth API import
      await this.addGitHubAuthImport(configBlock);
    }
  }

  // Add to GitHubAuth.js
  async addGitHubResolver(configBlock) {
    const authFilePath = path.join(
      this.config.destinationPath,
      "packages/backend/src/plugins/auth.ts"
    );

    if (await fs.pathExists(authFilePath)) {
      let authContent = await fs.readFile(authFilePath, "utf8");

      // Add GitHub resolver function
      if (!authContent.includes("githubResolver")) {
        const resolverCode = configBlock.content;
        authContent += "\n\n" + resolverCode;
        await fs.writeFile(authFilePath, authContent, "utf8");
        this.logger.info("📄 Added GitHub resolver to auth.ts");
      }
    }
  }

  async addGitHubAuthImport(configBlock) {
    const appTsxPath = path.join(
      this.config.destinationPath,
      "packages/app/src/App.tsx"
    );

    if (await fs.pathExists(appTsxPath)) {
      let appContent = await fs.readFile(appTsxPath, "utf8");
      let modified = false;

      // Add GitHub auth API import
      if (!appContent.includes('githubAuthApiRef')) {
        // Look for existing core-plugin-api import line to extend it
        const corePluginApiImportRegex = /import\s+\{([^}]+)\}\s+from\s+["']@backstage\/core-plugin-api["'];/;
        const match = appContent.match(corePluginApiImportRegex);
        
        if (match) {
          // Add githubAuthApiRef to existing import
          const currentImports = match[1];
          const newImports = 'githubAuthApiRef,' + currentImports;
          const newImportLine = `import {${newImports}} from "@backstage/core-plugin-api";`;
          
          appContent = appContent.replace(match[0], newImportLine);
          modified = true;
          this.logger.info('📄 Added githubAuthApiRef to existing core-plugin-api import in App.tsx');
        } else {
          // Add new import line if no existing core-plugin-api import found
          const configContentText = this.docParser.contentToText(configBlock.content);
          const importMatch = configContentText.match(/import\s+.*githubAuthApiRef.*?;/);
          
          if (importMatch) {
            const lastImportMatch = appContent.match(/import[^;]*;(?=\s*\n\s*(?!import))/g);
            if (lastImportMatch) {
              const lastImport = lastImportMatch[lastImportMatch.length - 1];
              const insertIndex = appContent.indexOf(lastImport) + lastImport.length;
              appContent = appContent.slice(0, insertIndex) + '\n' + importMatch[0] + appContent.slice(insertIndex);
              modified = true;
              this.logger.info('📄 Added new GitHub auth import to App.tsx');
            }
          }
        }
      }

      if (modified) {
        await fs.writeFile(appTsxPath, appContent, "utf8");
      }
    }
  }

  async addFrontendProvider(configBlock) {
    const appTsxPath = path.join(
      this.config.destinationPath,
      "packages/app/src/App.tsx"
    );

    if (await fs.pathExists(appTsxPath)) {
      let appContent = await fs.readFile(appTsxPath, "utf8");
      const configContentText = this.docParser.contentToText(configBlock.content);
      let modified = false;

      // Add GitHub auth API import
      if (!appContent.includes('githubAuthApiRef')) {
        const importMatch = configContentText.match(/import\s+.*githubAuthApiRef.*?;/);
        if (importMatch) {
          const lastImportMatch = appContent.match(/import[^;]*;(?=\s*\n\s*(?!import))/g);
          if (lastImportMatch) {
            const lastImport = lastImportMatch[lastImportMatch.length - 1];
            const insertIndex = appContent.indexOf(lastImport) + lastImport.length;
            appContent = appContent.slice(0, insertIndex) + '\n' + importMatch[0] + appContent.slice(insertIndex);
            modified = true;
            this.logger.info('📄 Added GitHub auth import to App.tsx');
          }
        }
      }

      // Add GitHub provider configuration
      if (!appContent.includes('githubAuthProvider')) {
        const githubProviderConfig = `
const githubAuthProvider: SignInProviderConfig = {
  id: 'github-auth-provider',
  title: 'GitHub',
  message: 'Sign in using GitHub',
  apiRef: githubAuthApiRef,
};
`;

        // Insert before authProviders array or createApp call
        let insertPoint = appContent.indexOf('const authProviders');
        if (insertPoint === -1) {
          insertPoint = appContent.indexOf('const app = createApp(');
        }
        
        if (insertPoint !== -1) {
          appContent = appContent.slice(0, insertPoint) + githubProviderConfig + '\n' + appContent.slice(insertPoint);
          modified = true;
          this.logger.info('📄 Added GitHub provider configuration to App.tsx');
        }
      }

      // Update existing authProviders array to include GitHub if not already present
      if (!appContent.includes('const authProviders')) {
        const authProvidersConfig = `
const authProviders: AuthProvider[] = [
  githubAuthProvider,
];
`;
        
        const createAppIndex = appContent.indexOf('const app = createApp(');
        if (createAppIndex !== -1) {
          appContent = appContent.slice(0, createAppIndex) + authProvidersConfig + '\n' + appContent.slice(createAppIndex);
          modified = true;
          this.logger.info('📄 Added authProviders array to App.tsx');
        }
      } else {
        // Update existing authProviders array to include GitHub
        if (!appContent.includes('githubAuthProvider,') && !appContent.includes('githubAuthProvider]')) {
          // Find the authProviders array and add GitHub provider
          const authProvidersRegex = /const authProviders:\s*AuthProvider\[\]\s*=\s*\[([\s\S]*?)\];/;
          const match = appContent.match(authProvidersRegex);
          
          if (match) {
            const existingProviders = match[1].trim();
            const newProviders = existingProviders ? `githubAuthProvider,\n  ${existingProviders}` : 'githubAuthProvider,';
            const newArray = `const authProviders: AuthProvider[] = [
  ${newProviders}
];`;
            appContent = appContent.replace(match[0], newArray);
            modified = true;
            this.logger.info('📄 Added GitHub provider to existing authProviders array');
          }
        }
      }

      // Step 6.4: Ensure App.tsx uses the authProviders in createApp if not already present
      if (!appContent.includes('providers:') && appContent.includes('const authProviders')) {
        const createAppRegex = /const app = createApp\(\{([\s\S]*?)\}\);/;
        const match = appContent.match(createAppRegex);
        
        if (match) {
          const existingConfig = match[1].trim();
          const newConfig = existingConfig ? 
            `${existingConfig},\n  providers: authProviders,` : 
            '\n  providers: authProviders,\n';
          
          const newCreateApp = `const app = createApp({${newConfig}
});`;
          appContent = appContent.replace(match[0], newCreateApp);
          modified = true;
          this.logger.info('📄 Added providers configuration to createApp call');
        }
      }

      if (modified) {
        await fs.writeFile(appTsxPath, appContent, "utf8");
        this.logger.info("✅ Frontend GitHub provider setup completed in App.tsx");
      } else {
        this.logger.info("ℹ️ GitHub provider already configured in App.tsx");
      }
    }
  }

  async copyGitHubAuthFiles() {
    const authSourcePath = path.join(
      this.config.sourcePath,
      "packages-core",
      "backend",
      "src",
      "plugins",
      "auth.ts"
    );

    const authDestPath = path.join(
      this.config.destinationPath,
      "packages",
      "backend",
      "src",
      "plugins",
      "auth.ts"
    );

    if (await fs.pathExists(authSourcePath)) {
      await fs.ensureDir(path.dirname(authDestPath));
      
      // Read the template and apply selective commenting to activate only GitHub by default
      let authContent = await fs.readFile(authSourcePath, "utf8");
      authContent = this.commentNonGitHubProviders(authContent);
      
      await fs.writeFile(authDestPath, authContent, "utf8");
      this.logger.info("✅ Created auth.ts with GitHub provider enabled by default");
    } else {
      throw new Error(`Auth template not found at ${authSourcePath}`);
    }
  }

  /**
   * Setup frontend GitHub provider configuration in App.tsx (Step 6 from GithubAuth.md)
   * Adds the GitHub authentication provider to the frontend application
   */
  async setupFrontendGitHubProvider() {
    this.logger.info("🎨 Setting up frontend GitHub provider in App.tsx...");

    const appTsxPath = path.join(
      this.config.destinationPath,
      "packages",
      "app",
      "src",
      "App.tsx"
    );

    if (!(await fs.pathExists(appTsxPath))) {
      this.logger.warn("⚠️ App.tsx not found, skipping frontend provider setup");
      return;
    }

    let appContent = await fs.readFile(appTsxPath, "utf8");
    let modified = false;

    // Step 6.1: Add GitHub auth API import and required types
    if (!appContent.includes('githubAuthApiRef')) {
      // Look for existing @backstage/core-plugin-api import to extend it
      const corePluginApiImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@backstage\/core-plugin-api['"];/;
      const match = appContent.match(corePluginApiImportRegex);
      
      if (match) {
        // Add githubAuthApiRef to existing import
        const currentImports = match[1].trim();
        const newImports = currentImports ? `githubAuthApiRef, ${currentImports}` : 'githubAuthApiRef';
        const newImportLine = `import { ${newImports} } from '@backstage/core-plugin-api';`;
        
        appContent = appContent.replace(match[0], newImportLine);
        modified = true;
        this.logger.info('📄 Added githubAuthApiRef to existing @backstage/core-plugin-api import');
      } else {
        // Add new import line if no existing @backstage/core-plugin-api import found
        const importMatch = appContent.match(/import[^;]*;(?=\s*\n\s*(?!import))/g);
        if (importMatch) {
          const lastImport = importMatch[importMatch.length - 1];
          const insertIndex = appContent.indexOf(lastImport) + lastImport.length;
          const newImport = "\nimport { githubAuthApiRef } from '@backstage/core-plugin-api';";
          appContent = appContent.slice(0, insertIndex) + newImport + appContent.slice(insertIndex);
          modified = true;
          this.logger.info('📄 Added new githubAuthApiRef import to App.tsx');
        }
      }
    }

    // Add required auth types import if not present
    if (!appContent.includes('SignInProviderConfig') || !appContent.includes('AuthProvider')) {
      const authTypesImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@backstage\/core-app-api['"];/;
      const match = appContent.match(authTypesImportRegex);
      
      const requiredTypes = [];
      if (!appContent.includes('SignInProviderConfig')) requiredTypes.push('SignInProviderConfig');
      if (!appContent.includes('AuthProvider')) requiredTypes.push('AuthProvider');
      
      if (requiredTypes.length > 0) {
        if (match) {
          // Add to existing @backstage/core-app-api import
          const currentImports = match[1].trim();
          const newTypes = requiredTypes.filter(type => !currentImports.includes(type));
          if (newTypes.length > 0) {
            const newImports = currentImports ? `${currentImports}, ${newTypes.join(', ')}` : newTypes.join(', ');
            const newImportLine = `import { ${newImports} } from '@backstage/core-app-api';`;
            appContent = appContent.replace(match[0], newImportLine);
            modified = true;
            this.logger.info(`📄 Added ${newTypes.join(', ')} to existing @backstage/core-app-api import`);
          }
        } else {
          // Add new import for auth types
          const importMatch = appContent.match(/import[^;]*;(?=\s*\n\s*(?!import))/g);
          if (importMatch) {
            const lastImport = importMatch[importMatch.length - 1];
            const insertIndex = appContent.indexOf(lastImport) + lastImport.length;
            const newImport = `\nimport { ${requiredTypes.join(', ')} } from '@backstage/core-app-api';`;
            appContent = appContent.slice(0, insertIndex) + newImport + appContent.slice(insertIndex);
            modified = true;
            this.logger.info(`📄 Added new ${requiredTypes.join(', ')} import to App.tsx`);
          }
        }
      }
    }

    // Step 6.2: Add GitHub provider configuration
    if (!appContent.includes('githubAuthProvider')) {
      const githubProviderConfig = `
const githubAuthProvider: SignInProviderConfig = {
  id: 'github-auth-provider',
  title: 'GitHub',
  message: 'Sign in using GitHub',
  apiRef: githubAuthApiRef,
};
`;

      // Insert before authProviders array or createApp call
      let insertPoint = appContent.indexOf('const authProviders');
      if (insertPoint === -1) {
        insertPoint = appContent.indexOf('const app = createApp(');
      }
      
      if (insertPoint !== -1) {
        appContent = appContent.slice(0, insertPoint) + githubProviderConfig + '\n' + appContent.slice(insertPoint);
        modified = true;
        this.logger.info('📄 Added GitHub provider configuration to App.tsx');
      }
    }

    // Step 6.3: Create or update authProviders array
    if (!appContent.includes('const authProviders')) {
      const authProvidersConfig = `
const authProviders: AuthProvider[] = [
  githubAuthProvider,
];
`;
      
      const createAppIndex = appContent.indexOf('const app = createApp(');
      if (createAppIndex !== -1) {
        appContent = appContent.slice(0, createAppIndex) + authProvidersConfig + '\n' + appContent.slice(createAppIndex);
        modified = true;
        this.logger.info('📄 Added authProviders array to App.tsx');
      }
    } else {
      // Update existing authProviders array to include GitHub if not already present
      if (!appContent.includes('githubAuthProvider,') && !appContent.includes('githubAuthProvider]')) {
        // Find the authProviders array and add GitHub provider
        const authProvidersRegex = /const authProviders:\s*AuthProvider\[\]\s*=\s*\[([\s\S]*?)\];/;
        const match = appContent.match(authProvidersRegex);
        
        if (match) {
          const existingProviders = match[1].trim();
          const newProviders = existingProviders ? `githubAuthProvider,\n  ${existingProviders}` : 'githubAuthProvider,';
          const newArray = `const authProviders: AuthProvider[] = [
  ${newProviders}
];`;
          appContent = appContent.replace(match[0], newArray);
          modified = true;
          this.logger.info('📄 Added GitHub provider to existing authProviders array');
        }
      }
    }

    // Step 6.4: Ensure App.tsx uses the authProviders in createApp if not already present
    if (!appContent.includes('providers:') && appContent.includes('const authProviders')) {
      const createAppRegex = /const app = createApp\(\{([\s\S]*?)\}\);/;
      const match = appContent.match(createAppRegex);
      
      if (match) {
        const existingConfig = match[1].trim();
        const newConfig = existingConfig ? 
          `${existingConfig},\n  providers: authProviders,` : 
          '\n  providers: authProviders,\n';
        
        const newCreateApp = `const app = createApp({${newConfig}
});`;
        appContent = appContent.replace(match[0], newCreateApp);
        modified = true;
        this.logger.info('📄 Added providers configuration to createApp call');
      }
    }

    if (modified) {
      await fs.writeFile(appTsxPath, appContent, "utf8");
      this.logger.info("✅ Frontend GitHub provider setup completed in App.tsx");
    } else {
      this.logger.info("ℹ️ GitHub provider already configured in App.tsx");
    }
  }

  async updateAppConfigWithGitHub() {
    const appConfigPath = path.join(
      this.config.destinationPath,
      "app-config.yaml"
    );

    if (await fs.pathExists(appConfigPath)) {
      // Check if GitHub config is already present
      const existingConfig = await fs.readFile(appConfigPath, "utf8");
      if (existingConfig.includes("clientId: " + this.githubConfig.clientId)) {
        this.logger.info("ℹ️ GitHub authentication already configured in app-config.yaml");
        return;
      }

      // Always use actual values if they are real credentials (not placeholders)
      // Only use environment variables for placeholder values
      const isRealClientId = this.githubConfig.clientId && 
                            this.githubConfig.clientId !== "YOUR_GITHUB_CLIENT_ID" &&
                            !this.githubConfig.clientId.startsWith('${');
      
      const isRealClientSecret = this.githubConfig.clientSecret && 
                                this.githubConfig.clientSecret !== "YOUR_GITHUB_CLIENT_SECRET" &&
                                !this.githubConfig.clientSecret.startsWith('${');

      const clientId = isRealClientId ? this.githubConfig.clientId : '${AUTH_GITHUB_CLIENT_ID}';
      const clientSecret = isRealClientSecret ? this.githubConfig.clientSecret : '${AUTH_GITHUB_CLIENT_SECRET}';

      this.logger.info(`🔧 Using clientId: ${isRealClientId ? 'actual value' : 'environment variable'}`);
      this.logger.info(`🔧 Using clientSecret: ${isRealClientSecret ? 'actual value' : 'environment variable'}`);

      // Create GitHub authentication configuration object
      const githubAuthConfig = {
        auth: {
          environment: 'development',
          providers: {
            github: {
              development: {
                clientId: clientId,
                clientSecret: clientSecret,
                callbackUrl: this.githubConfig.callbackUrl
              }
            }
          }
        }
      };

      // Add GitHub organization if provided
      if (this.githubConfig.organization) {
        githubAuthConfig.auth.providers.github.development.githubOrganization = this.githubConfig.organization;
      }

      // Configure GitHub integrations based on user choice
      if (this.githubConfig.githubApp) {
        // Use GitHub App configuration - use actual values if provided, env vars for placeholders
        const isRealAppSecret = this.githubConfig.githubApp.clientSecret && 
                               this.githubConfig.githubApp.clientSecret !== "YOUR_GITHUB_APP_CLIENT_SECRET" &&
                               !this.githubConfig.githubApp.clientSecret.startsWith('${');
        
        const isRealPrivateKey = this.githubConfig.githubApp.privateKey && 
                                this.githubConfig.githubApp.privateKey !== "YOUR_GITHUB_APP_PRIVATE_KEY" &&
                                !this.githubConfig.githubApp.privateKey.startsWith('${');
        
        const actualAppSecret = isRealAppSecret ? this.githubConfig.githubApp.clientSecret : '${GITHUB_APP_CLIENT_SECRET}';
        const actualPrivateKey = isRealPrivateKey ? this.githubConfig.githubApp.privateKey : '${GITHUB_APP_PRIVATE_KEY}';

        githubAuthConfig.integrations = {
          github: [
            {
              host: 'github.com',
              apps: [
                {
                  appId: this.githubConfig.githubApp.appId,
                  clientId: this.githubConfig.githubApp.clientId,
                  clientSecret: actualAppSecret,
                  privateKey: actualPrivateKey
                }
              ]
            }
          ]
        };
        
        this.logger.info("🔧 Configured GitHub App integration with appId: " + this.githubConfig.githubApp.appId);
      } else if (this.githubConfig.personalAccessToken) {
        // Use Personal Access Token configuration - use actual value if provided, env var for placeholder
        const isRealToken = this.githubConfig.personalAccessToken && 
                           this.githubConfig.personalAccessToken !== "YOUR_GITHUB_TOKEN" &&
                           !this.githubConfig.personalAccessToken.startsWith('${');
        
        const actualToken = isRealToken ? this.githubConfig.personalAccessToken : '${GITHUB_TOKEN}';

        githubAuthConfig.integrations = {
          github: [
            {
              host: 'github.com',
              token: actualToken
            }
          ]
        };
        
        this.logger.info("🔧 Configured Personal Access Token integration");
      }

      // Merge the GitHub configuration into the existing app-config.yaml
      const success = await this.yamlMerger.mergeIntoYamlFile(
        appConfigPath, 
        githubAuthConfig, 
        "GitHub Authentication Configuration"
      );

      if (success) {
        this.logger.info("📄 Updated app-config.yaml with GitHub authentication");

        // Validate the merged configuration
        const validation = this.yamlMerger.validateConfiguration(
          await this.yamlMerger.loadYamlFile(appConfigPath)
        );
        
        if (!validation.isValid) {
          this.logger.warn("⚠️ Configuration validation warnings:");
          validation.warnings.forEach(warning => this.logger.warn(`   - ${warning}`));
        }

        if (this.githubConfig.requiresManualSetup) {
          this.logger.warn(
            "⚠️ Manual GitHub OAuth setup required - update credentials in app-config.yaml"
          );
        }

        // Log integration method used
        if (this.githubConfig.githubApp) {
          this.logger.info("🔧 ✅ GitHub App integration configured successfully");
          this.logger.info(`   📋 App ID: ${this.githubConfig.githubApp.appId}`);
          this.logger.info(`   📋 Client ID: ${this.githubConfig.githubApp.clientId}`);
          if (this.githubConfig.requiresManualSetup) {
            this.logger.warn("   ⚠️ Remember to set GITHUB_APP_CLIENT_SECRET and GITHUB_APP_PRIVATE_KEY environment variables");
          }
        } else if (this.githubConfig.personalAccessToken) {
          this.logger.info("🔧 ✅ Personal Access Token integration configured successfully");
          if (this.githubConfig.requiresManualSetup) {
            this.logger.warn("   ⚠️ Remember to set GITHUB_TOKEN environment variable");
          }
        }
      } else {
        this.logger.error("❌ Failed to update app-config.yaml with GitHub authentication");
      }
    }
  }

  async updatePackageJsonForGitHub() {
    // Update app package.json
    const appPackagePath = path.join(
      this.config.destinationPath,
      "packages",
      "app",
      "package.json"
    );
    if (await fs.pathExists(appPackagePath)) {
      const appPackage = await fs.readJson(appPackagePath);

      const authDependencies = {
        "@backstage/plugin-auth": "^1.4.0",
        "@backstage/plugin-auth-react": "^0.1.0",
      };

      appPackage.dependencies = {
        ...appPackage.dependencies,
        ...authDependencies,
      };
      await fs.writeJson(appPackagePath, appPackage, { spaces: 2 });
      this.logger.info("📦 Updated app package.json with auth dependencies");
    }

    // Update backend package.json with provider-specific dependencies
    const backendPackagePath = path.join(
      this.config.destinationPath,
      "packages",
      "backend",
      "package.json"
    );
    if (await fs.pathExists(backendPackagePath)) {
      const backendPackage = await fs.readJson(backendPackagePath);

      let authBackendDependencies = {
        "@backstage/plugin-auth-backend": "^0.18.0",
        "@backstage/plugin-auth-node": "^0.2.0",
        "@backstage/plugin-auth-backend-module-github-provider": "^0.1.0",
      };

      backendPackage.dependencies = {
        ...backendPackage.dependencies,
        ...authBackendDependencies,
      };
      await fs.writeJson(backendPackagePath, backendPackage, { spaces: 2 });
      this.logger.info(
        "📦 Updated backend package.json with auth dependencies"
      );
    }
  }

  async handleOAuthAppCreation(step) {
    this.logger.info("🔧 OAuth App creation guidance provided");
    // Log instructions for manual OAuth app creation
  }

  async handleCallbackConfiguration(step) {
    // Extract callback URL from instruction
    const callbackMatch = step.instruction.match(/`([^`]*callback[^`]*)`/i);
    if (callbackMatch) {
      this.githubConfig.callbackUrl = callbackMatch[1];
      this.logger.info(
        `📋 Callback URL configured: ${this.githubConfig.callbackUrl}`
      );
    }
  }

  async handleProviderRegistration(step) {
    // Handle provider registration in auth.ts
    const authFilePath = path.join(
      this.config.destinationPath,
      "packages",
      "backend",
      "src",
      "plugins",
      "auth.ts"
    );

    if (await fs.pathExists(authFilePath)) {
      let authContent = await fs.readFile(authFilePath, "utf8");

      // Add GitHub provider registration if not present
      if (
        !authContent.includes("github") &&
        !authContent.includes("registerProvider")
      ) {
        // Add provider registration code
        this.logger.info("📄 Added GitHub provider registration to auth.ts");
      }
    }
  }

  async handleImportAddition(step) {
    const importMatch = step.instruction.match(/import.*from.*['"@][^'"]+['"]/);
    if (importMatch) {
      const importStatement = importMatch[0];

      // Determine target file based on instruction context
      if (step.instruction.includes("auth.ts")) {
        await this.addImportToFile(
          "packages/backend/src/plugins/auth.ts",
          importStatement
        );
      } else if (step.instruction.includes("App.tsx")) {
        await this.addImportToFile("packages/app/src/App.tsx", importStatement);
      }
    }
  }

  async addProviderRegistration(configBlock) {
    const authFilePath = path.join(
      this.config.destinationPath,
      "packages",
      "backend",
      "src",
      "plugins",
      "auth.ts"
    );

    if (await fs.pathExists(authFilePath)) {
      let authContent = await fs.readFile(authFilePath, "utf8");

      // Add provider registration code if not present
      if (!authContent.includes("authProviders.registerProvider")) {
        const registrationCode = configBlock.content;

        // Find the right place to insert the registration
        const moduleRegex =
          /async init\(\{ providers: authProviders[^}]+\}\) \{([^}]+)\}/;
        const match = authContent.match(moduleRegex);

        if (match) {
          const initBody = match[1];
          const newInitBody = initBody + "\n" + registrationCode;
          authContent = authContent.replace(
            moduleRegex,
            match[0].replace(initBody, newInitBody)
          );

          await fs.writeFile(authFilePath, authContent, "utf8");
          this.logger.info("📄 Added GitHub provider registration to auth.ts");
        }
      }
    }
  }

  async addImportToFile(filePath, importStatement) {
    const fullPath = path.join(this.config.destinationPath, filePath);

    if (await fs.pathExists(fullPath)) {
      let content = await fs.readFile(fullPath, "utf8");

      if (!content.includes(importStatement)) {
        // Add import at the top of the file
        const importSection = content.match(/^(import.*\n)*/)[0] || "";
        const restOfFile = content.substring(importSection.length);

        content = importSection + importStatement + "\n" + restOfFile;
        await fs.writeFile(fullPath, content, "utf8");
        this.logger.info(`📥 Added import to ${filePath}`);
      }
    }
  }
  async handlePackageInstallation(step) {
    // Extract package names from instruction
    const packageMatches = step.instruction.match(/`([^`]+)`/g);

    if (packageMatches) {
      const packages = packageMatches.map((p) => p.replace(/`/g, ""));
      this.logger.info(`📦 GitHub packages to install: ${packages.join(", ")}`);

      // Add to installation queue
      if (!this.githubPackages) this.githubPackages = [];
      this.githubPackages.push(...packages);
    }
  }

  async validate() {
    const validationResults = {
      success: true,
      message: "",
      details: [],
    };

    // Check if GitHub auth files exist
    const authFilePath = path.join(
      this.config.destinationPath,
      "packages",
      "backend",
      "src",
      "plugins",
      "auth.ts"
    );
    
    if (await fs.pathExists(authFilePath)) {
      validationResults.details.push("✅ GitHub auth plugin file exists");
      
      // Basic check for GitHub configuration in auth.ts
      try {
        const authContent = await fs.readFile(authFilePath, "utf8");
        
        if (authContent.includes('github') && authContent.includes('resolver')) {
          validationResults.details.push("✅ GitHub authentication code found in auth.ts");
        } else {
          validationResults.success = false;
          validationResults.details.push("❌ GitHub authentication code not found in auth.ts");
        }
      } catch (error) {
        validationResults.details.push(`⚠️ Could not read auth file: ${error.message}`);
      }
    } else {
      validationResults.success = false;
      validationResults.details.push("❌ GitHub auth plugin file missing");
    }

    // Check SignInPage component (optional for modern authentication)
    const signInPagePath = path.join(
      this.config.destinationPath,
      "packages",
      "app",
      "src",
      "components",
      "SignInPage"
    );
    if (await fs.pathExists(signInPagePath)) {
      validationResults.details.push("✅ SignInPage component exists");
    } else {
      // SignInPage is optional in modern Backstage authentication
      validationResults.details.push("ℹ️ SignInPage component not found (optional)");
    }

    // Check app-config.yaml for GitHub configuration
    const appConfigPath = path.join(
      this.config.destinationPath,
      "app-config.yaml"
    );
    if (await fs.pathExists(appConfigPath)) {
      const configContent = await fs.readFile(appConfigPath, "utf8");
      
      // Check for basic GitHub auth configuration
      if (configContent.includes("github:") && configContent.includes("clientId")) {
        validationResults.details.push("✅ GitHub authentication configuration found in app-config.yaml");
        
        // Check for integration type
        if (configContent.includes("apps:") && configContent.includes("appId")) {
          validationResults.details.push("✅ GitHub App integration configured");
          if (configContent.includes("privateKey")) {
            validationResults.details.push("✅ GitHub App private key configured");
          } else {
            validationResults.details.push("⚠️ GitHub App private key missing");
          }
        } else if (configContent.includes("token:")) {
          validationResults.details.push("✅ Personal Access Token integration configured");
        } else {
          validationResults.details.push("⚠️ No GitHub integration method found (missing both GitHub App and PAT)");
        }
      } else {
        validationResults.success = false;
        validationResults.details.push("❌ No GitHub configuration in app-config.yaml");
      }
    } else {
      validationResults.success = false;
      validationResults.details.push("❌ app-config.yaml file not found");
    }

    validationResults.message = validationResults.success
      ? "GitHub authentication validation successful"
      : "GitHub authentication validation failed";

    return validationResults;
  }

  /**
   * Comments out non-GitHub authentication providers in auth.ts content
   * This ensures only GitHub is active by default while keeping other providers
   * available for easy uncommenting later
   * @param {string} content - Original auth.ts content
   * @returns {string} Modified content with non-GitHub providers commented out
   */
  commentNonGitHubProviders(content) {
    let modifiedContent = content;
    
    // Define the providers to comment out (all except GitHub)
    const providersToComment = [
      'MICROSOFT AUTHENTICATION',
      'AWS COGNITO AUTHENTICATION', 
      'KEYCLOAK AUTHENTICATION',
      'OAUTH2 PROXY AUTHENTICATION',
      'AWS ALB AUTHENTICATION',
      'GCP IAP AUTHENTICATION'
    ];

    // Comment out each non-GitHub provider section
    for (const provider of providersToComment) {
      modifiedContent = this.commentProviderSection(modifiedContent, provider);
    }

    return modifiedContent;
  }

  /**
   * Comments out a specific provider section in auth.ts
   * @param {string} content - File content
   * @param {string} providerName - Name of the provider to comment out
   * @returns {string} Modified content
   */
  commentProviderSection(content, providerName) {
    const startMarker = `// ${providerName} - START`;
    const endMarker = `// ${providerName} - END`;
    
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);
    
    if (startIndex !== -1 && endIndex !== -1) {
      // Find the actual code block (after the START marker, before the END marker)
      const beforeSection = content.substring(0, startIndex);
      const sectionContent = content.substring(startIndex, endIndex + endMarker.length);
      const afterSection = content.substring(endIndex + endMarker.length);
      
      // Check if already commented
      if (!sectionContent.includes('/* COMMENTED OUT')) {
        // Add block comment markers
        const commentedSection = sectionContent.replace(
          startMarker,
          `${startMarker}\n/* COMMENTED OUT FOR SELECTIVE PROVIDER SETUP`
        ).replace(
          endMarker,
          `*/\n${endMarker}`
        );
        
        return beforeSection + commentedSection + afterSection;
      }
    }
    
    return content;
  }

  /**
   * Utility function to uncomment a specific provider in auth.ts
   * This can be used later to enable additional providers
   * @param {string} authFilePath - Path to the auth.ts file
   * @param {string} providerName - Name of the provider to uncomment
   */
  async uncommentProvider(authFilePath, providerName) {
    if (!(await fs.pathExists(authFilePath))) {
      throw new Error(`Auth file not found at: ${authFilePath}`);
    }

    let content = await fs.readFile(authFilePath, "utf8");
    const startMarker = `// ${providerName} - START`;
    const endMarker = `// ${providerName} - END`;
    
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);
    
    if (startIndex !== -1 && endIndex !== -1) {
      const sectionContent = content.substring(startIndex, endIndex + endMarker.length);
      
      // Remove comment markers if present
      const uncommentedSection = sectionContent
        .replace('/* COMMENTED OUT FOR SELECTIVE PROVIDER SETUP', '')
        .replace('*/', '');
      
      const beforeSection = content.substring(0, startIndex);
      const afterSection = content.substring(endIndex + endMarker.length);
      
      const modifiedContent = beforeSection + uncommentedSection + afterSection;
      await fs.writeFile(authFilePath, modifiedContent, "utf8");
      
      this.logger.info(`✅ Uncommented ${providerName} provider`);
      return true;
    }
    
    this.logger.warn(`⚠️ Provider section not found: ${providerName}`);
    return false;
  }

}
