// CLI Help System for FlowSource Migration Agent
import chalk from "chalk";
import boxen from "boxen";

export class CLIHelp {
  static showHelp() {
    const helpText = `
${chalk.blue.bold("FlowSource Migration Agent")}
${chalk.gray("Automated Backstage to FlowSource application migration")}

${chalk.yellow.bold("USAGE:")}
  ${chalk.cyan("flowsource-agent")} [options]
  ${chalk.cyan("node src/index.js")} [options]

${chalk.yellow.bold("OPTIONS:")}
  ${chalk.green("-s, --source <path>")}         Source FlowSource package path
  ${chalk.green(
    "-d, --destination <path>"
  )}    Destination path for new application
  ${chalk.green("-n, --name <name>")}           Application name
  ${chalk.green("-i, --install")}               Auto-install dependencies
  ${chalk.green(
    "--mode <mode>"
  )}               Operation mode: interactive|cli (default: interactive)
  ${chalk.green(
    "--phase <phase>"
  )}             Migration phase: 1|2|3 (default: 1)
  ${chalk.green(
    "--dry-run"
  )}                   Preview changes without executing
  ${chalk.green("--verbose")}                   Enable verbose logging
  ${chalk.green("--config <file>")}             Custom configuration file
  ${chalk.green("-h, --help")}                  Show this help message
  ${chalk.green("-V, --version")}               Show version number

${chalk.yellow.bold("EXAMPLES:")}
  ${chalk.gray("# Interactive mode (recommended)")}
  ${chalk.cyan("flowsource-agent")}

  ${chalk.gray("# CLI mode with all parameters")}
  ${chalk.cyan("flowsource-agent")} --mode cli \\
    --source "C:\\Agent\\Flowsource_Package_1_0_0" \\
    --destination "C:\\my-app" \\
    --name "my-flowsource-app" \\
    --install

  ${chalk.gray("# Dry run to preview changes")}
  ${chalk.cyan("flowsource-agent")} --dry-run --verbose

  ${chalk.gray("# Phase 1 migration only")}
  ${chalk.cyan("flowsource-agent")} --phase 1

${chalk.yellow.bold("MIGRATION PHASES:")}
  ${chalk.green("Phase 1:")} Basic FlowSource theme and UI (Available)
           ✅ Backstage skeleton generation
           ✅ FlowSource theme application
           ✅ Custom branding and assets
           ✅ Enhanced navigation
           ❌ No plugins, auth, or database

  ${chalk.gray("Phase 2:")} Authentication & Permissions (Coming Soon)
           🔒 Multi-provider authentication
           👥 Role-based access control
           🗄️ Database integration

  ${chalk.gray("Phase 3:")} Full FlowSource Platform (Coming Soon)
           🔌 50+ DevOps plugins
           🏗️ Infrastructure provisioning
           📊 Monitoring and observability

${chalk.yellow.bold("PREREQUISITES:")}
  ${chalk.green("Node.js:")}    v20.18.3+ or v22.14.0+
  ${chalk.green("npm:")}        v10.1.0+
  ${chalk.green("yarn:")}       v1.22.22 or v4.7.0+
  ${chalk.green("Git:")}        Latest (recommended)

${chalk.yellow.bold("SOURCE STRUCTURE:")}
  The source package should contain:
  📁 FlowSourceInstaller/FlowsourceSetupDoc/
    ├── Readme.md
    └── UI-Changes.md
  📁 configuration/
    ├── app-config.yaml
    ├── package.json
    └── Dockerfile
  📁 packages-core/
    ├── app/
    └── backend/

${chalk.yellow.bold("MORE INFO:")}
  ${chalk.cyan("Documentation:")} https://github.com/flowsource/migration-agent
  ${chalk.cyan(
    "Issues:"
  )}        https://github.com/flowsource/migration-agent/issues
  ${chalk.cyan("License:")}       MIT
`;

    console.log(helpText);
  }

  static showQuickStart() {
    const quickStartText = `
${chalk.blue.bold("🚀 FlowSource Migration Agent - Quick Start")}

${chalk.yellow.bold("1. PREPARE:")}
   • Extract FlowSource package to a known location
   • Ensure Node.js v20+ is installed
   • Install yarn: ${chalk.cyan("npm install -g yarn")}

${chalk.yellow.bold("2. RUN:")}
   • Interactive mode: ${chalk.cyan("npm start")}
   • CLI mode: ${chalk.cyan(
     "npm run migrate -- --source <path> --destination <path> --name <name>"
   )}

${chalk.yellow.bold("3. FOLLOW PROMPTS:")}
   • Enter source FlowSource package path
   • Choose destination for new application
   • Provide application name
   • Select migration phase (recommend Phase 1)

${chalk.yellow.bold("4. VERIFY:")}
   • Check migration logs for any issues
   • Navigate to destination directory
   • Run: ${chalk.cyan("yarn install && yarn dev")}
   • Open: ${chalk.cyan("http://localhost:3000")}

${chalk.green.bold("🎉 Enjoy your new FlowSource application!")}
`;

    console.log(
      boxen(quickStartText, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "blue",
      })
    );
  }

  static showTroubleshooting() {
    const troubleshootingText = `
${chalk.red.bold("🔧 FlowSource Migration Agent - Troubleshooting")}

${chalk.yellow.bold("COMMON ISSUES:")}

${chalk.green("1. Prerequisites Not Met")}
   ${chalk.gray("Error:")} Node.js version incompatible
   ${chalk.cyan("Solution:")} Install Node.js v20.18.3+ from nodejs.org

${chalk.green("2. Source Path Not Found")}
   ${chalk.gray("Error:")} Required path not found
   ${chalk.cyan("Solution:")} Verify FlowSource package is extracted completely
              Check path format (use forward slashes or escape backslashes)

${chalk.green("3. Permission Denied")}
   ${chalk.gray("Error:")} EACCES or permission errors
   ${chalk.cyan(
     "Solution:"
   )} Run as administrator (Windows) or check directory permissions
              ${chalk.cyan("chmod 755 /path/to/destination")} (macOS/Linux)

${chalk.green("4. Yarn Not Found")}
   ${chalk.gray("Error:")} yarn command not found
   ${chalk.cyan("Solution:")} Install yarn globally: ${chalk.cyan(
      "npm install -g yarn"
    )}

${chalk.green("5. Migration Validation Failed")}
   ${chalk.gray("Error:")} Validation failed: X issues found
   ${chalk.cyan("Solution:")} Check logs/error.log for details
              Run with --verbose for more information
              Verify source package structure

${chalk.green("6. Destination Directory Not Empty")}
   ${chalk.gray("Error:")} Destination directory already exists
   ${chalk.cyan("Solution:")} Choose empty directory or remove existing files
              Use --dry-run to preview without executing

${chalk.yellow.bold("DEBUG COMMANDS:")}
   ${chalk.cyan("# Check prerequisites")}
   ${chalk.gray("node src/index.js --verbose")}

   ${chalk.cyan("# Preview changes without executing")}
   ${chalk.gray("node src/index.js --dry-run")}

   ${chalk.cyan("# Check detailed logs")}
   ${chalk.gray("tail -f logs/combined.log")}

   ${chalk.cyan("# Validate Node.js version")}
   ${chalk.gray("node --version")}

${chalk.yellow.bold("GET HELP:")}
   • Check README.md for detailed documentation
   • Review logs in logs/ directory
   • Run with --verbose for detailed output
   • Use --dry-run to preview changes safely
`;

    console.log(troubleshootingText);
  }

  static showExamples() {
    const examplesText = `
${chalk.blue.bold("📝 FlowSource Migration Agent - Examples")}

${chalk.yellow.bold("INTERACTIVE MODE (Recommended):")}
${chalk.cyan("npm start")}
${chalk.gray("# Provides guided setup with prompts")}

${chalk.yellow.bold("CLI MODE - BASIC:")}
${chalk.cyan("npm run migrate -- \\")}
${chalk.cyan('  --source "C:\\Agent\\Flowsource_Package_1_0_0" \\')}
${chalk.cyan('  --destination "C:\\my-flowsource-app" \\')}
${chalk.cyan('  --name "my-app"')}

${chalk.yellow.bold("CLI MODE - FULL OPTIONS:")}
${chalk.cyan("node src/index.js \\")}
${chalk.cyan("  --mode cli \\")}
${chalk.cyan('  --source "C:\\Agent\\Flowsource_Package_1_0_0" \\')}
${chalk.cyan('  --destination "C:\\my-flowsource-app" \\')}
${chalk.cyan('  --name "my-flowsource-app" \\')}
${chalk.cyan("  --phase 1 \\")}
${chalk.cyan("  --install \\")}
${chalk.cyan("  --verbose")}

${chalk.yellow.bold("DRY RUN (Preview Only):")}
${chalk.cyan("npm start -- --dry-run")}
${chalk.gray("# Preview changes without executing")}

${chalk.yellow.bold("PHASE-SPECIFIC MIGRATION:")}
${chalk.cyan("# Phase 1: UI and Theme Only")}
${chalk.cyan("npm start -- --phase 1")}

${chalk.cyan("# Phase 2: Add Authentication (Coming Soon)")}
${chalk.gray("npm start -- --phase 2")}

${chalk.cyan("# Phase 3: Full Platform (Coming Soon)")}
${chalk.gray("npm start -- --phase 3")}

${chalk.yellow.bold("DEBUGGING:")}
${chalk.cyan("# Verbose logging")}
${chalk.cyan("npm start -- --verbose")}

${chalk.cyan("# Check logs")}
${chalk.cyan("tail -f logs/combined.log")}

${chalk.cyan("# Test prerequisites")}
${chalk.cyan(
  "node -e \"console.log(process.version); console.log(require('child_process').execSync('yarn --version', {encoding:'utf8'}).trim())\""
)}

${chalk.yellow.bold("POST-MIGRATION:")}
${chalk.cyan("# Navigate to app")}
${chalk.cyan("cd my-flowsource-app")}

${chalk.cyan("# Install dependencies (if not auto-installed)")}
${chalk.cyan("yarn install")}

${chalk.cyan("# Start development server")}
${chalk.cyan("yarn dev")}

${chalk.cyan("# Open in browser")}
${chalk.cyan("open http://localhost:3000")}
`;

    console.log(examplesText);
  }
}

// Export help functions for use in main CLI
export function showHelp() {
  CLIHelp.showHelp();
}

export function showQuickStart() {
  CLIHelp.showQuickStart();
}

export function showTroubleshooting() {
  CLIHelp.showTroubleshooting();
}

export function showExamples() {
  CLIHelp.showExamples();
}
