// FlowSource Migration Agent - Main Entry Point
import { Command } from "commander";
import chalk from "chalk";
import figlet from "figlet";
import boxen from "boxen";
import { FlowSourceAgent } from "./core/FlowSourceAgent.js";
import { InteractiveMode } from "./ui/InteractiveMode.js";
import { Logger } from "./utils/Logger.js";
import { ConfigValidator } from "./utils/ConfigValidator.js";
import {
  showHelp,
  showQuickStart,
  showTroubleshooting,
  showExamples,
} from "./utils/CLIHelp.js";

const program = new Command();
const logger = Logger.getInstance();

// ASCII Art Header
function displayHeader() {
  console.log(
    chalk.cyanBright(
      figlet.textSync("FlowSource Migration Utility", {
        font: "Small",
        horizontalLayout: "default",
        verticalLayout: "default",
      })
    )
  );

  console.log(
    boxen(
      chalk.white("🚀 Automated Backstage to FlowSource Migration Tool\n") +
        chalk.gray(
          "Transform your Backstage application with FlowSource capabilities"
        ),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "blue",
        backgroundColor: "black",
      }
    )
  );
}

// CLI Configuration
program
  .name("flowsource-migration-utility")
  .description("Utility for automated migration from Backstage to FlowSource.")
  .version("1.0.0");

program
  .option("-s, --source <path>", "Source FlowSource package path")
  .option("-d, --destination <path>", "Destination path for new application")
  .option("-n, --name <name>", "Application name")
  .option("-i, --install", "Auto-install dependencies")
  .option("--mode <mode>", "Operation mode: interactive|cli", "interactive")
  .option("--phase <phase>", "Migration phase: 1|2|3", "1")
  .option("--dry-run", "Preview changes without executing")
  .option("--verbose", "Enable verbose logging")
  .option("--config <file>", "Custom configuration file")
  .option("--help-quick", "Show quick start guide")
  .option("--help-troubleshoot", "Show troubleshooting guide")
  .option("--help-examples", "Show usage examples");

program.action(async (options) => {
  try {
    // Handle help options
    if (options.helpQuick) {
      showQuickStart();
      return;
    }
    if (options.helpTroubleshoot) {
      showTroubleshooting();
      return;
    }
    if (options.helpExamples) {
      showExamples();
      return;
    }

    displayHeader();

    // Initialize logger with verbosity
    if (options.verbose) {
      logger.setLevel("debug");
    }

    logger.info("🤖 FlowSource Migration Utility initialized");
    logger.info(`📋 Mode: ${options.mode}`);
    logger.info(`🎯 Phase: ${options.phase}`);

    // Validate system prerequisites
    const validator = new ConfigValidator();
    await validator.validatePrerequisites();

    // Initialize the main agent
    const agent = new FlowSourceAgent({
      dryRun: options.dryRun || false,
      verbose: options.verbose || false,
      phase: parseInt(options.phase) || 1,
    });

    if (options.mode === "interactive") {
      // Interactive mode with UI
      const interactive = new InteractiveMode(agent);
      agent.interactiveMode = interactive;
      await interactive.start();
    } else {
      // CLI mode with direct parameters
      if (!options.source || !options.destination || !options.name) {
        logger.error(
          "❌ CLI mode requires --source, --destination, and --name parameters"
        );
        logger.info("💡 Use --help-examples to see usage examples");
        process.exit(1);
      }

      const migrationConfig = {
        sourcePath: options.source,
        destinationPath: options.destination,
        applicationName: options.name,
        autoInstall: options.install || false,
        phase: parseInt(options.phase) || 1,
      };

      await agent.migrate(migrationConfig);
    }
  } catch (error) {
    if (error.message.includes("authentication")) {
      logger.error(
        "🔐 Authentication setup failed. Check your GitHub OAuth configuration."
      );
      logger.info("💡 Use --help-troubleshoot for authentication issues");
    } else {
      logger.error(`💥 Migration failed: ${error.message}`);
    }

    if (options.verbose) {
      logger.error(error.stack);
    }
    process.exit(1);
  }
});

// Error handling
process.on("uncaughtException", (error) => {
  logger.error(`💥 Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`💥 Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Graceful shutdown
// Handler for SIGINT signal (Ctrl+C)
process.on("SIGINT", () => {
  logger.info("👋 Graceful shutdown initiated...");
  process.exit(0);
});

// Parses command-line arguments and starts execution
program.parse();
