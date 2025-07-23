// Interactive Mode - Provides user-friendly interface for migration
import inquirer from "inquirer";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
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

      // ADD: Collect GitHub auth config for Phase 2
      if (config.phase === 2) {
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
  // collectGitHubAuthConfig
  // Method to collect Github Auth config
  // Add this method to InteractiveMode class

  async collectGitHubAuthConfig(config) {
    if (config.phase < 2) {
      return;
    }

    console.log("\n" + chalk.cyan("🔐 Phase 2: Authentication Configuration"));
    console.log(chalk.gray("Debug: process.stdin.isTTY =", process.stdin.isTTY));
    console.log(chalk.gray("Debug: process.platform =", process.platform));

    const questions = [
      {
        type: "confirm",
        name: "setupGitHubAuth",
        message: "Do you want to configure GitHub authentication?",
        default: true,
      },
      {
        type: "confirm",
        name: "hasGitHubOAuth",
        message: "Do you have a GitHub OAuth App already created?",
        when: (answers) => answers.setupGitHubAuth,
        default: false,
      },
      {
        type: "input",
        name: "githubClientId",
        message: "Enter your GitHub OAuth App Client ID:",
        when: (answers) => answers.setupGitHubAuth && answers.hasGitHubOAuth,
        validate: (input) => input.length > 0 || "Client ID is required",
      },
      {
        type: "password",
        name: "githubClientSecret",
        message: "Enter your GitHub OAuth App Client Secret:",
        when: (answers) => answers.setupGitHubAuth && answers.hasGitHubOAuth,
        validate: (input) => input.length > 0 || "Client Secret is required",
      },
    ];

    const answers = await Promise.race([
      inquirer.prompt(questions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Input timeout")), 300000)
      ),
    ]);

    if (answers.setupGitHubAuth && answers.hasGitHubOAuth) {
      config.githubAuth = {
        clientId: answers.githubClientId,
        clientSecret: answers.githubClientSecret,
        callbackUrl: "http://localhost:3000/api/auth/github/handler/frame",
      };
    } else if (answers.setupGitHubAuth) {
      console.log("\n" + chalk.yellow("⚠️ GitHub OAuth App setup required:"));
      console.log("1. Go to: https://github.com/settings/applications/new");
      console.log("2. Application name: Your App Name");
      console.log("3. Homepage URL: http://localhost:3000");
      console.log(
        "4. Authorization callback URL: http://localhost:3000/api/auth/github/handler/frame"
      );
      console.log(
        "5. Update app-config.yaml with your credentials after migration\n"
      );
    }
  }
}
