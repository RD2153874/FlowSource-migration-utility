# FlowSource Migration Utility

🚀 Intelligent utility tool that automates the conversion of Backstage applications into FlowSource applications using official documentation and configuration files.

## 🎯 Overview

The FlowSource Migration Utility is a Node.js-based automation tool that transforms standard Backstage installations into fully-featured FlowSource platforms. It follows the official FlowSource documentation to ensure accurate and complete migrations.

## ✨ Features

- **📚 Documentation-Driven**: Follows official FlowSource setup guides automatically
- **🎨 UI Customization**: Applies FlowSource themes, branding, and custom components
- **🔧 Smart Configuration**: Intelligently merges configurations without breaking existing setups
- **✅ Validation Engine**: Comprehensive validation of migration success
- **🖥️ Interactive Interface**: User-friendly prompts for easy configuration
- **📊 Progress Tracking**: Real-time progress reporting with detailed logging

## 🛠️ Prerequisites

| Software | Tested Versions | Installation |
|----------|----------------|--------------|
| **Node.js** | 20.18.3, 22.14.0 | [Download](https://nodejs.org/) |
| **npm** | 10.1.0, 10.9.2 | Included with Node.js |
| **yarn** | 1.22.22, 4.7.0 | `npm install -g yarn` |
| **Git** | Latest | [Download](https://git-scm.com/) |

## 🚀 Quick Start

### Installation

```bash
# Clone or download the utility
cd flowsource-migration-utility

# Install dependencies
npm install

# Make executable (optional)
npm link
```

### Usage

#### Interactive Mode (Recommended)

```bash
# Start interactive migration
npm start

# Or directly with node
node src/index.js
```

#### CLI Mode

```bash
# Direct migration with parameters
npm run migrate -- \
  --source "C:\Agent\Flowsource_Package_1_0_0" \
  --destination "C:\my-flowsource-app" \
  --name "my-app" \
  --install \
  --phase 1
```

### Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--source <path>` | FlowSource package source path | Required |
| `--destination <path>` | Destination for new application | Required |
| `--name <name>` | Application name | Required |
| `--phase <1\|2\|3>` | Migration phase | 1 |
| `--install` | Auto-install dependencies | false |
| `--verbose` | Enable verbose logging | false |
| `--dry-run` | Preview changes without executing | false |

## 📋 Migration Phases

### Phase 1: Basic FlowSource Theme and UI ✅
- ✅ Backstage skeleton generation
- ✅ FlowSource theme application
- ✅ Custom branding and assets
- ✅ Enhanced navigation and components
- ✅ Configuration file management
- ❌ No plugins, authentication, or database

### Phase 2: Authentication & Permissions ✅
- ✅ Multi-provider authentication setup
- ✅ Role-based access control configuration  
- ✅ Database integration and services
- ✅ Permission management and policies
- ✅ GitHub OAuth provider setup
- ✅ Cookie-based authentication

### Phase 3: Full FlowSource Platform (Coming Soon)
- 🔌 50+ DevOps plugins
- 🏗️ Infrastructure provisioning
- 📊 Monitoring and observability
- 🤖 AI-powered features

## 🗂️ Project Structure

```
flowsource-migration-utility/
├── src/
│   ├── index.js                    # Main entry point
│   ├── core/
│   │   ├── FlowSourceAgent.js      # Main migration logic
│   │   ├── BackstageGenerator.js   # Backstage skeleton generation
│   │   ├── FlowSourceTransformer.js # UI customization engine
│   │   ├── AuthConfigure.js        # Authentication configuration
│   │   ├── GitHubAuth.js           # GitHub OAuth provider setup
│   │   └── ValidationEngine.js     # Migration validation
│   ├── ui/
│   │   └── InteractiveMode.js      # User interface
│   ├── utils/
│   │   ├── Logger.js               # Centralized logging
│   │   ├── FileManager.js          # File operations
│   │   ├── DocumentationParser.js  # Markdown parsing
│   │   ├── ConfigManager.js        # Configuration handling
│   │   ├── ConfigValidator.js      # Prerequisites validation
│   │   ├── YamlConfigMerger.js     # YAML configuration merging
│   │   └── CLIHelp.js              # Command line help
│   └── tests/
│       └── agent.test.js           # Test suite
├── logs/                           # Application logs
├── .env.example                    # Environment variables template
├── setup.js                       # Setup and initialization
├── package.json                    # Dependencies and scripts
└── README.md                       # This file
```

## � Dependencies

The FlowSource Migration Utility leverages several carefully selected packages to provide a robust and user-friendly migration experience:

### Core Dependencies

| Package | Purpose | Used In | Why We Use It |
|---------|---------|---------|---------------|
| **boxen** | Terminal output formatting | `index.js`, `CLIHelp.js` | Creates beautiful boxed terminal messages for help display and status information |
| **chalk** | Terminal color formatting | 7+ files (FlowSourceAgent, InteractiveMode, Logger, etc.) | Provides colored and styled terminal output for better user experience |
| **commander** | CLI argument parsing | `index.js` | Handles command-line arguments and options parsing professionally |
| **figlet** | ASCII art generation | `index.js` | Creates the stylized FlowSource banner for brand identity |
| **fs-extra** | Enhanced file operations | 14+ files across codebase | Essential for all file system operations with additional utilities beyond Node.js built-in `fs` |
| **glob** | File pattern matching | `FileManager.js` | Enables powerful file search and pattern matching for migration tasks |
| **inquirer** | Interactive CLI prompts | `InteractiveMode.js` | Provides the interactive question-answer interface for user configuration |
| **js-yaml** | YAML parsing and manipulation | `YamlConfigMerger.js` | Handles YAML configuration file parsing and merging operations |
| **markdown-it** | Markdown processing | `DocumentationParser.js` | Parses FlowSource documentation markdown files for automated migration guidance |
| **ora** | Loading spinners | `FlowSourceAgent.js` | Displays animated progress indicators during long-running operations |
| **winston** | Professional logging | `Logger.js` | Provides structured logging with multiple levels and file output |
| **yaml** | YAML file operations | `ConfigManager.js` | Handles YAML file reading, writing, and configuration management |

### Package Usage Details

**Most Critical Dependencies:**
- **fs-extra**: Used in 14+ files, handles all file operations including copying, moving, and directory management
- **chalk**: Used in 7+ files, essential for the colorful and user-friendly terminal interface
- **inquirer**: Powers the entire interactive mode experience with professional CLI prompts

**User Experience Enhancers:**
- **boxen + chalk + figlet**: Create the polished terminal interface that makes the utility professional and easy to use
- **ora**: Provides visual feedback during long operations like file copying and npm installations

**Technical Core:**
- **js-yaml + yaml**: Handle all YAML configuration file operations, crucial for Backstage/FlowSource config management
- **markdown-it**: Processes documentation files to automatically extract setup instructions
- **glob**: Enables powerful file searching and pattern matching for migration tasks

## �🔧 Configuration

### Source Package Structure

The utility expects the FlowSource package to have this structure:

```
Flowsource_Package_1_0_0/
├── FlowSourceInstaller/
│   └── FlowsourceSetupDoc/
│       ├── Readme.md               # Main setup guide
│       ├── UI-Changes.md           # UI customization guide
│       ├── Auth.md                 # Authentication setup guide
│       └── GithubAuth.md           # GitHub OAuth provider guide
├── configuration/                  # Configuration files
│   ├── app-config.yaml
│   ├── package.json
│   ├── Dockerfile
│   └── ...
└── packages-core/                  # Core application code
    ├── app/                        # Frontend
    └── backend/                    # Backend
```

### Environment Variables

```bash
# Optional configuration
NODE_ENV=development
LOG_LEVEL=info
MIGRATION_TIMEOUT=300000
```

## 📊 Logging

The utility provides comprehensive logging:

- **Console Output**: Real-time progress and status
- **File Logging**: Detailed logs in `logs/` directory
- **Verbose Mode**: Extended debugging information

### Log Files

- `logs/combined.log` - All log levels
- `logs/error.log` - Errors only

## ✅ Validation

The utility performs extensive validation:

### Prerequisites Validation
- ✅ Node.js version compatibility
- ✅ Package manager availability
- ✅ System requirements
- ✅ Source package structure

### Migration Validation
- ✅ File structure integrity
- ✅ Configuration validity
- ✅ Theme integration
- ✅ Asset availability
- ✅ Package dependencies
- ✅ Authentication setup
- ✅ Database services integration
- ✅ Permission policies configuration

## 🐛 Troubleshooting

### Common Issues

**Permission Errors**
```bash
# Windows: Run as Administrator
# macOS/Linux: Check directory permissions
sudo chown -R $USER:$GROUP /path/to/destination
```

**Node.js Version Issues**
```bash
# Use Node Version Manager
nvm install 20.18.3
nvm use 20.18.3
```

**Yarn Installation Issues**
```bash
# Clear cache and reinstall
npm cache clean --force
npm install -g yarn
```

**Source Path Not Found**
- Verify the FlowSource package is extracted completely
- Check path separators (use forward slashes or escape backslashes)
- Ensure all required directories exist

### Debug Mode

```bash
# Enable verbose logging
node src/index.js --verbose

# Dry run to preview changes
node src/index.js --dry-run

# Check logs
tail -f logs/combined.log
```

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♀️ Support

- **Documentation**: Check the official FlowSource documentation
- **Issues**: Report bugs and feature requests
- **Discussions**: Join the community discussions

## 🎉 Success Stories

After successful migration, you'll have:

- 🎨 **Professional FlowSource UI** with custom theming
- 🏷️ **Branded Assets** including logos and favicons
- 🧭 **Enhanced Navigation** with FlowSource-specific menu items
- 📦 **Optimized Dependencies** with all required packages
- ✅ **Validated Configuration** ensuring everything works correctly

Start your FlowSource journey today! 🚀
