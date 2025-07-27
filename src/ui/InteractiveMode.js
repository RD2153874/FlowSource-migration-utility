// Interactive Mode - Provides user-friendly interface for migration
import inquirer from "inquirer";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import crypto from "crypto";
import { Logger } from "../utils/Logger.js";

export class InteractiveMode {
  constructor(agent) {
    this.agent = agent;
    this.logger = Logger.getInstance();
  }

  async start() {
    console.log(
      chalk.blue(
        "🤖 Welcome to FlowSource Migration Agent - Interactive Mode\n"
      )
    );

    try {
      // Collect user inputs
      const config = await this.collectUserInputs();

      // Collect authentication configuration for Phase 2
      if (config.phase === 2) {
        await this.collectDatabaseConfig(config);
        await this.collectAuthConfig(config);
        await this.collectGitHubAuthConfig(config);
      }

      // Confirm migration settings
      await this.confirmMigration(config);

      // Execute migration
      await this.agent.migrate(config);
    } catch (error) {
      if (error.message === "User cancelled") {
        console.log(chalk.yellow("\n👋 Migration cancelled by user"));
        return;
      }
      throw error;
    }
  }

  async collectUserInputs() {
    const questions = [
      {
        type: "input",
        name: "sourcePath",
        message: "📂 Enter the FlowSource package source path:",
        default: "C:\\Agent\\Flowsource_Package_1_0_0",
        validate: async (input) => {
          const normalizedPath = path.resolve(input);
          const exists = await fs.pathExists(normalizedPath);
          if (!exists) {
            return "Source path does not exist. Please enter a valid path.";
          }

          // Check for required directories
          const requiredPaths = [
            "FlowSourceInstaller/FlowsourceSetupDoc",
            "configuration",
            "packages-core",
          ];

          for (const requiredPath of requiredPaths) {
            const fullPath = path.join(normalizedPath, requiredPath);
            if (!(await fs.pathExists(fullPath))) {
              return `Required directory not found: ${requiredPath}`;
            }
          }

          return true;
        },
        filter: (input) => path.resolve(input),
      },
      {
        type: "input",
        name: "destinationPath",
        message: "🎯 Enter the destination path for the new application:",
        default: (answers) => path.join(process.cwd(), "my-flowsource-app"),
        validate: async (input) => {
          const normalizedPath = path.resolve(input);
          const parentDir = path.dirname(normalizedPath);

          // Check if parent directory exists
          if (!(await fs.pathExists(parentDir))) {
            return "Parent directory does not exist. Please enter a valid path.";
          }

          // Check if destination already exists
          if (await fs.pathExists(normalizedPath)) {
            const stat = await fs.stat(normalizedPath);
            if (stat.isDirectory()) {
              const contents = await fs.readdir(normalizedPath);
              if (contents.length > 0) {
                return "Destination directory already exists and is not empty. Please choose a different path.";
              }
            } else {
              return "Destination path exists but is not a directory.";
            }
          }

          return true;
        },
        filter: (input) => path.resolve(input),
      },
      {
        type: "input",
        name: "applicationName",
        message: "📝 Enter the application name:",
        default: "flowsource-app",
        validate: (input) => {
          if (!input.trim()) {
            return "Application name cannot be empty.";
          }
          if (!/^[a-z0-9-]+$/.test(input)) {
            return "Application name must contain only lowercase letters, numbers, and hyphens.";
          }
          return true;
        },
        filter: (input) => input.trim().toLowerCase(),
      },
      {
        type: "list",
        name: "phase",
        message: "🎯 Select migration phase:",
        choices: [
          {
            name: "Phase 1: Basic FlowSource theme and UI (No plugins, auth, or database)",
            value: 1,
          },
          {
            name: "Phase 2: Add authentication and permissions",
            value: 2,
          },
          {
            name: "Phase 3: Full FlowSource with plugins and database (Coming soon)",
            value: 3,
            disabled: "Available in future releases",
          },
        ],
        default: 1,
      },
      {
        type: "confirm",
        name: "autoInstall",
        message: "📦 Automatically install dependencies after migration?",
        default: true,
      },
      {
        type: "confirm",
        name: "verboseLogging",
        message: "📊 Enable verbose logging?",
        default: false,
      },
    ];

    const answers = await inquirer.prompt(questions);

    // Set additional options
    this.agent.options.verbose = answers.verboseLogging;
    this.agent.options.phase = answers.phase;

    if (answers.verboseLogging) {
      this.logger.setLevel("debug");
    }

    return {
      sourcePath: answers.sourcePath,
      destinationPath: answers.destinationPath,
      applicationName: answers.applicationName,
      phase: answers.phase,
      autoInstall: answers.autoInstall,
    };
  }

  async confirmMigration(config) {
    console.log("\n" + chalk.blue("📋 Migration Configuration:"));
    console.log(`${chalk.gray("Source Path:")} ${config.sourcePath}`);
    console.log(`${chalk.gray("Destination:")} ${config.destinationPath}`);
    console.log(`${chalk.gray("Application Name:")} ${config.applicationName}`);
    console.log(`${chalk.gray("Phase:")} ${config.phase}`);
    console.log(
      `${chalk.gray("Auto Install:")} ${config.autoInstall ? "Yes" : "No"}`
    );
    
    // Show Phase 2 specific configuration
    if (config.phase === 2) {
      console.log("\n" + chalk.blue("🔐 Authentication & Database Configuration:"));
      
      // Database configuration
      if (config.databaseConfig) {
        if (config.databaseConfig.usePostgreSQL) {
          console.log(`${chalk.gray("Database:")} PostgreSQL`);
          console.log(`${chalk.gray("DB Host:")} ${config.databaseConfig.host}:${config.databaseConfig.port}`);
          console.log(`${chalk.gray("DB User:")} ${config.databaseConfig.user}`);
        } else {
          console.log(`${chalk.gray("Database:")} SQLite (development)`);
        }
      }
      
      // Backend authentication
      if (config.backendAuth) {
        console.log(`${chalk.gray("Backend Secret:")} [CONFIGURED]`);
        console.log(`${chalk.gray("Session Secret:")} ${config.backendAuth.hasCustomSessionSecret ? '[CONFIGURED]' : '[PLACEHOLDER]'}`);
      }
      
      // GitHub authentication
      if (config.githubAuth && config.githubAuth.setupGitHubAuth) {
        console.log(`${chalk.gray("GitHub Auth:")} Enabled`);
        console.log(`${chalk.gray("GitHub App ID:")} ${config.githubAuth.appId}`);
        console.log(`${chalk.gray("Client ID:")} ${config.githubAuth.clientId}`);
      } else {
        console.log(`${chalk.gray("GitHub Auth:")} Disabled`);
      }
    }

    const { proceed } = await inquirer.prompt([
      {
        type: "confirm",
        name: "proceed",
        message: "🚀 Proceed with migration?",
        default: true,
      },
    ]);

    if (!proceed) {
      throw new Error("User cancelled");
    }
  }

  async showProgress(step, total, message) {
    const progress = Math.round((step / total) * 100);
    const bar = "█".repeat(Math.round(progress / 5));
    const empty = "░".repeat(20 - Math.round(progress / 5));

    console.log(`\n${chalk.blue(`[${step}/${total}]`)} ${message}`);
    console.log(`${chalk.green(bar)}${chalk.gray(empty)} ${progress}%`);
  }

  async displaySuccess() {
    console.log("\n" + chalk.green("🎉 Migration completed successfully!"));
    console.log("\n" + chalk.blue("Next steps:"));
    console.log("1. Navigate to your application directory");
    console.log(
      "2. Run: " + chalk.yellow("yarn install") + " (if not auto-installed)"
    );
    console.log("3. Run: " + chalk.yellow("yarn dev"));
    console.log("4. Open: " + chalk.cyan("http://localhost:3000"));
    console.log("\n" + chalk.gray("Enjoy your new FlowSource application! 🚀"));
  }
  // collectAuthConfig
  // Method to collect authentication configuration including backend secrets
  async collectAuthConfig(config) {
    if (config.phase < 2) {
      return;
    }

    console.log("\n" + chalk.cyan("🔐 Phase 2: Authentication Configuration"));
    
    // Collect backend secrets
    await this.collectBackendSecrets(config);
  }


  // collectBackendSecrets: Method to collect backend authentication secrets
  async collectBackendSecrets(config) {
    console.log("\n" + chalk.yellow("🔑 Backend Authentication Secrets"));
    console.log(chalk.gray("Backend secret is required for authentication. Session secret is optional."));

    const secretQuestions = [
      {
        type: "input",
        name: "backendSecret",
        message: "Enter backend authentication secret (or press Enter to use auto-generated):",
        default: () => this.generateSecureSecret(),
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return "Backend secret is required";
          }
          return true;
        },
      },
      {
        type: "confirm",
        name: "provideSessionSecret",
        message: "Do you want to provide a custom session secret?",
        default: false,
      },
      {
        type: "input",
        name: "sessionSecret",
        message: "Enter session secret (or press Enter to use auto-generated):",
        when: (answers) => answers.provideSessionSecret,
        default: () => this.generateSecureSecret(),
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return "Session secret cannot be empty if you choose to provide one";
          }
          return true;
        },
      }
    ];

    const secretAnswers = await Promise.race([
      inquirer.prompt(secretQuestions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Backend secrets input timeout")), 300000)
      ),
    ]);

    // Store backend secrets in config
    config.backendAuth = {
      backendSecret: secretAnswers.backendSecret.trim(),
      sessionSecret: secretAnswers.provideSessionSecret ? secretAnswers.sessionSecret.trim() : null,
      hasCustomSessionSecret: secretAnswers.provideSessionSecret || false
    };

    console.log("\n" + chalk.green("✅ Backend authentication secrets configured"));
    if (config.backendAuth.hasCustomSessionSecret) {
      console.log(chalk.gray("✓ Custom session secret provided"));
    } else {
      console.log(chalk.gray("✓ Session secret will remain as placeholder"));
    }
  }

  // Generate secure secret using the specified crypto function
  generateSecureSecret() {
    return crypto.randomBytes(24).toString('base64');
  }


  // collectGitHubAuthConfig: Method to collect Github Auth config

  async collectGitHubAuthConfig(config) {
    if (config.phase < 2) {
      return;
    }

    console.log("\n" + chalk.cyan("🔐 Phase 2: Authentication Configuration"));
    console.log(chalk.gray("Debug: process.stdin.isTTY =", process.stdin.isTTY));
    console.log(chalk.gray("Debug: process.platform =", process.platform));

    // Step 1: Ask if they want GitHub authentication
    const setupQuestion = await inquirer.prompt([
      {
        type: "confirm",
        name: "setupGitHubAuth",
        message: "Do you want to configure GitHub authentication?",
        default: true,
      }
    ]);

    if (!setupQuestion.setupGitHubAuth) {
      return;
    }

    // Step 2: Collect OAuth credentials
    const oauthAnswers = await this.collectOAuthCredentials();
    
    if (!oauthAnswers.hasOAuthApp) {
      console.log("\n" + chalk.yellow("⚠️ GitHub OAuth App setup required:"));
      console.log("1. Go to: https://github.com/settings/applications/new");
      console.log("2. Application name: Your App Name");
      console.log("3. Homepage URL: http://localhost:3000");
      console.log("4. Authorization callback URL: http://localhost:7007/api/auth/github/handler/frame");
      console.log("5. Update app-config.yaml with your credentials after migration\n");
      
      config.githubAuth = {
        clientId: "YOUR_GITHUB_CLIENT_ID",
        clientSecret: "YOUR_GITHUB_CLIENT_SECRET",
        organization: "TheCognizantFoundry",
        callbackUrl: "http://localhost:7007/api/auth/github/handler/frame",
        requiresManualSetup: true,
        personalAccessToken: "YOUR_GITHUB_TOKEN"
      };
      return;
    }

    // Step 3: Collect Integration credentials (PAT or GitHub App)
    const integrationAnswers = await this.collectIntegrationCredentials();

    // Step 4: Build complete config object
    config.githubAuth = {
      // OAuth credentials
      clientId: oauthAnswers.clientId,
      clientSecret: oauthAnswers.clientSecret,
      organization: oauthAnswers.organization || "",
      callbackUrl: oauthAnswers.callbackUrl || "http://localhost:7007/api/auth/github/handler/frame",
      
      // Integration credentials
      integrationMethod: integrationAnswers.method,
      personalAccessToken: integrationAnswers.personalAccessToken,
      githubApp: integrationAnswers.githubApp,
      
      // Metadata
      requiresManualSetup: false // All real credentials collected
    };

    console.log("\n" + chalk.green("✅ GitHub authentication fully configured"));
  }

  async collectOAuthCredentials() {
    const questions = [
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

    return await Promise.race([
      inquirer.prompt(questions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("OAuth input timeout")), 300000)
      ),
    ]);
  }

  async collectIntegrationCredentials() {
    // Step 1: Choose integration method
    const methodQuestion = await inquirer.prompt([
      {
        type: "list",
        name: "method",
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
    ]);

    if (methodQuestion.method === "github-app") {
      return await this.collectGitHubAppCredentials();
    } else {
      return await this.collectPATCredentials();
    }
  }

  async collectPATCredentials() {
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

    const patAnswers = await Promise.race([
      inquirer.prompt(patQuestions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("PAT input timeout")), 300000)
      ),
    ]);

    return {
      method: "pat",
      personalAccessToken: patAnswers.personalAccessToken.trim(),
      githubApp: null
    };
  }

  async collectGitHubAppCredentials() {
    // Step 1: Check if they have GitHub App
    const hasAppQuestion = await inquirer.prompt([
      {
        type: "confirm",
        name: "hasGitHubApp",
        message: "Do you have a GitHub App already created?",
        default: false,
      }
    ]);

    if (!hasAppQuestion.hasGitHubApp) {
      console.log("\n" + chalk.blue("📋 To create a GitHub App, visit: https://github.com/settings/apps/new"));
      console.log("📋 Required permissions: Contents (read), Metadata (read), Pull requests (read)");
      console.log("📋 Callback URL: http://localhost:7007/api/auth/github/handler/frame");
      
      const continueQuestion = await inquirer.prompt([{
        type: "confirm",
        name: "continue",
        message: "Have you created the GitHub App and want to continue with configuration?",
        default: false
      }]);

      if (!continueQuestion.continue) {
        console.log(chalk.yellow("⚠️ GitHub App setup cancelled. Using fallback PAT configuration."));
        return await this.collectPATCredentials();
      }
    }

    // Step 2: Collect GitHub App credentials
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

    const githubAppAnswers = await Promise.race([
      inquirer.prompt(githubAppQuestions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("GitHub App input timeout")), 600000)
      ),
    ]);

    return {
      method: "github-app",
      personalAccessToken: null,
      githubApp: {
        appId: githubAppAnswers.appId.trim(),
        clientId: githubAppAnswers.appClientId.trim(),
        clientSecret: githubAppAnswers.appClientSecret.trim(),
        privateKey: githubAppAnswers.privateKey.trim(),
      }
    };
  }

  // collectDatabaseConfig: Method to collect database configuration (PostgreSQL or SQLite)
  async collectDatabaseConfig(config) {
    if (config.phase < 2) {
      return;
    }

    console.log("\n" + chalk.cyan("🗄️  Database Configuration"));
    console.log(chalk.gray("FlowSource supports PostgreSQL for production use or SQLite for development."));

    const databaseTypeQuestion = [
      {
        type: "list",
        name: "databaseType",
        message: "Which database would you like to configure?",
        choices: [
          {
            name: "PostgreSQL (Recommended for production)",
            value: "postgresql",
          },
          {
            name: "SQLite (Development/testing only)",
            value: "sqlite",
          },
        ],
        default: "postgresql",
      }
    ];

    const databaseTypeAnswer = await inquirer.prompt(databaseTypeQuestion);
    
    if (databaseTypeAnswer.databaseType === "postgresql") {
      await this.collectPostgreSQLConfig(config);
    } else {
      // For SQLite, we just set a flag to indicate no PostgreSQL config needed
      config.databaseConfig = {
        type: "sqlite",
        usePostgreSQL: false
      };
      console.log("\n" + chalk.green("✅ SQLite database configured (no additional setup required)"));
      console.log(chalk.gray("Note: SQLite is suitable for development but PostgreSQL is recommended for production"));
    }
  }

  // collectPostgreSQLConfig: Method to collect PostgreSQL connection details
  async collectPostgreSQLConfig(config) {
    console.log("\n" + chalk.yellow("🐘 PostgreSQL Configuration"));
    console.log(chalk.gray("Enter your PostgreSQL connection details. Press Enter to use defaults where available."));

    const postgresQuestions = [
      {
        type: "input",
        name: "host",
        message: "PostgreSQL host:",
        default: "localhost",
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return "Database host is required";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "port",
        message: "PostgreSQL port:",
        default: "5432",
        validate: (input) => {
          const port = parseInt(input);
          if (isNaN(port) || port < 1 || port > 65535) {
            return "Please enter a valid port number (1-65535)";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "user",
        message: "PostgreSQL username:",
        default: "postgres",
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return "Database username is required";
          }
          return true;
        },
      },
      {
        type: "password",
        name: "password",
        message: "PostgreSQL password:",
        mask: "*",
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return "Database password is required";
          }
          return true;
        },
      }
    ];

    const postgresAnswers = await Promise.race([
      inquirer.prompt(postgresQuestions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("PostgreSQL configuration input timeout")), 300000)
      ),
    ]);

    // Store database configuration
    config.databaseConfig = {
      type: "postgresql",
      usePostgreSQL: true,
      host: postgresAnswers.host.trim(),
      port: parseInt(postgresAnswers.port.trim(), 10),
      user: postgresAnswers.user.trim(),
      password: postgresAnswers.password.trim()
    };

    console.log("\n" + chalk.green("✅ PostgreSQL database configuration collected"));
    console.log(chalk.gray(`✓ Host: ${config.databaseConfig.host}:${config.databaseConfig.port}`));
    console.log(chalk.gray(`✓ User: ${config.databaseConfig.user}`));
    console.log(chalk.gray("✓ Password: [HIDDEN]"));
  }
}
