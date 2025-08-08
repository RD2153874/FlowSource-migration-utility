# FlowSource Migration Utility

🚀 Intelligent utility tool that automates the conversion

1. **📦 Dependencies Download**: npm downloads all required packages (chalk, inquirer, etc.)
2. **⚡ Auto-Setup Trigger**: npm automatically runs our setup script after installation
3. **📁 Environment Setup**: Creates logs directory and .env file from template
4. **🔧 Platform Configuration**: Makes scripts executable on Unix-like systems
5. **🎉 Ready to Use**: You're immediately ready to start migrations!

**💡 This means your team members only need one command: `npm install` - everything else is automatic!**

### 📋 **Before You Start Migration**

After running `npm install`, your environment is automatically configured and ready. The setup process ensures:

- ✅ **Dependencies Installed**: All required packages availableapplications into FlowSource applications using official documentation and configuration files.

### 🔧 Configuration

### Enhanced Documentation Files

The utility includes an enhanced `DOCS/` folder containing updated FlowSource documentation files that provide:
- **Structured Parsing**: Formatted for automated parsing by `DocumentationParser.js`
- **Enhanced Instructions**: More detailed setup steps and configuration examples
- **Phase 2 Support**: Complete authentication and database setup guidance
- **Validation Patterns**: Specific formats that enable automated configuration validation

**DOCS Folder Contents:**
- `DOCS/Readme.md` - Enhanced main setup guide with structured authentication detection
- `DOCS/UI-Changes.md` - Enhanced UI customization patterns and validation logic
- `DOCS/Auth.md` - Complete authentication configuration with parsing-friendly format
- `DOCS/GithubAuth.md` - Detailed GitHub OAuth setup with automated configuration support

### Source Package Structure Overview

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

### Installation & Setup

#### Recommended: Automatic Setup (npm install) ⚡
```bash
# Clone or download the utility
cd flowsource-migration-utility

# One command does everything!
npm install

# What happens automatically:
# 1. Downloads all dependencies
# 2. Creates logs directory
# 3. Sets up environment files (.env)
# 4. Configures scripts for your platform
# ✅ Ready to migrate immediately!
```

#### Alternative: Manual Setup Script
```bash
# If you need to re-run setup later
npm run setup

# Or run directly
node setup.js
```

#### Traditional: Manual Setup (Step-by-step)
```bash
# Install dependencies manually
npm install

# Install Yarn (if needed)
npm install -g yarn

# Create logs directory
mkdir logs

# Copy environment file
copy .env.example .env    # Windows
cp .env.example .env      # Mac/Linux
```

### 🎯 **How Automatic Setup Works:**

When you run `npm install`, here's what happens behind the scenes:

1. **📦 Dependencies Download**: npm downloads all required packages (chalk, inquirer, etc.)
2. **� Auto-Setup Trigger**: npm automatically runs our setup script after installation
3. **✅ Environment Validation**: Checks Node.js versions, Yarn availability, and system requirements
4. **📁 Directory Creation**: Creates necessary folders and files (logs/, .env)
5. **🎉 Ready to Use**: You're immediately ready to start migrations!

**💡 This means your team members only need one command: `npm install` - everything else is automatic!**

### 📋 **Before You Start Migration**

After running `npm install`, your environment is automatically configured and ready. The setup process ensures:

- ✅ **Dependencies Installed**: All required packages available
- ✅ **Environment Ready**: Logs directory and configuration files created
- ✅ **Cross-Platform Setup**: Scripts configured for Windows/Mac/Linux
- ✅ **Immediate Readiness**: No additional setup steps required

**You can now proceed directly to migration!**

### Usage

#### Interactive Mode (Recommended)

```bash
# Start interactive migration
npm start

# Or directly with node
node src/index.js
```

#### CLI Mode (Phase 1 Only)

```bash
# Direct migration with parameters (Phase 1 only)
npm run migrate -- \
  --source "C:\Agent\Flowsource_Package_1_0_0" \
  --destination "C:\my-flowsource-app" \
  --name "my-app" \
  --install \
  --phase 1
```

**⚠️ Note**: CLI mode currently supports Phase 1 only. For Phase 2 & 3, use Interactive Mode.

## 🚨 Important: CLI Mode Limitations

**Current CLI Mode Support:**
- ✅ **Phase 1**: Full support - Basic FlowSource theme and UI migration
- ❌ **Phase 2**: Not supported - Requires Interactive Mode for credentials collection
- ❌ **Phase 3**: Not supported - Future enhancement

**Why Phase 2+ Requires Interactive Mode:**
Phase 2 requires collecting sensitive credentials that CLI mode cannot handle:
- GitHub OAuth App credentials (Client ID, Client Secret)
- Personal Access Tokens or GitHub App authentication
- Database connection details (host, port, username, password)
- Backend authentication secrets
- Authentication provider selection

**For Phase 2 Migration:**
```bash
# Use Interactive Mode for Phase 2
npm start
# Select Phase 2 and follow the prompts for credential collection
```

### Command Options

| Option | Description | Default | CLI Support |
|--------|-------------|---------|-------------|
| `--source <path>` | FlowSource package source path | Required | ✅ Phase 1 |
| `--destination <path>` | Destination for new application | Required | ✅ Phase 1 |
| `--name <name>` | Application name | Required | ✅ Phase 1 |
| `--phase <1\|2\|3>` | Migration phase | 1 | ✅ Phase 1, ❌ Phase 2-3 |
| `--install` | Auto-install dependencies | false | ✅ Phase 1 |
| `--verbose` | Enable verbose logging | false | ✅ All phases |
| `--dry-run` | Preview changes without executing (Coming Soon) | false | ⏳ Coming Soon |

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
- ⚠️ **Interactive Mode Only** (CLI mode coming soon)

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
│       └── utility.test.js           # Test suite
├── DOCS/                           # Updated FlowSource documentation
│   ├── Auth.md                     # Enhanced authentication setup guide
│   ├── GithubAuth.md               # Enhanced GitHub OAuth provider guide
│   ├── Readme.md                   # Enhanced main setup guide
│   └── UI-Changes.md               # Enhanced UI customization guide
├── .github/                        # GitHub repository configuration
│   └── pull_request_template.md    # PR template for contributors
├── logs/                           # Application logs
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore patterns
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

### ⚠️ Important: Documentation File Requirements

**CRITICAL SETUP STEP**: Before running the migration utility, you **MUST** replace the authentication documentation files in your FlowSource package with the updated versions provided with this utility:

#### Required File Replacements:

1. **Replace `Readme.md`**:
   - **Source**: `DOCS/Readme.md` (from this utility)
   - **Destination**: `Flowsource_Package_1_0_0/FlowSourceInstaller/FlowsourceSetupDoc/Readme.md`
   - **Why**: Contains structured setup instructions that the utility parses for authentication detection and migration flow control

2. **Replace `UI-Changes.md`**:
   - **Source**: `DOCS/UI-Changes.md` (from this utility)
   - **Destination**: `Flowsource_Package_1_0_0/FlowSourceInstaller/FlowsourceSetupDoc/UI-Changes.md`
   - **Why**: Contains enhanced UI transformation patterns and validation logic that the utility uses for Phase 1 compliance checking

3. **Replace `Auth.md`**:
   - **Source**: `DOCS/Auth.md` (from this utility)
   - **Destination**: `Flowsource_Package_1_0_0/FlowSourceInstaller/FlowsourceSetupDoc/Auth.md`
   - **Why**: Contains updated authentication logic and configuration patterns that the utility can parse and implement

4. **Replace `GithubAuth.md`**:
   - **Source**: `DOCS/GithubAuth.md` (from this utility)  
   - **Destination**: `Flowsource_Package_1_0_0/FlowSourceInstaller/FlowsourceSetupDoc/GithubAuth.md`
   - **Why**: Contains structured GitHub OAuth setup instructions with specific formatting that enables automated configuration



#### How to Replace:

```bash
# Navigate to your FlowSource package directory
cd "C:\Path\To\Your\Flowsource_Package_1_0_0\FlowSourceInstaller\FlowsourceSetupDoc"

# Backup original files (optional)
copy Readme.md Readme.md.backup
copy UI-Changes.md UI-Changes.md.backup
copy Auth.md Auth.md.backup
copy GithubAuth.md GithubAuth.md.backup

# Copy updated files from utility DOCS folder
copy "C:\Path\To\flowsource-migration-utility\DOCS\Readme.md" Readme.md
copy "C:\Path\To\flowsource-migration-utility\DOCS\UI-Changes.md" UI-Changes.md
copy "C:\Path\To\flowsource-migration-utility\DOCS\Auth.md" Auth.md
copy "C:\Path\To\flowsource-migration-utility\DOCS\GithubAuth.md" GithubAuth.md
```

#### Why This is Required:

- **Enhanced Parsing**: The utility's `DocumentationParser.js` requires specific formatting and structure to extract configuration details
- **Complex Logic Support**: Updated files contain authentication patterns and YAML configurations that the utility can automatically implement
- **Phase 2 Authentication**: Essential for proper GitHub OAuth, backend secrets, and database configuration in Phase 2 migrations
- **Automated Setup**: Enables the utility to generate both template and local configuration files with correct authentication blocks

**⚠️ Migration will fail** if you skip this step, as the utility cannot parse the authentication requirements from the original documentation format.

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

**Setup and Prerequisites Issues**
```bash
# If you encounter any setup issues:

# Re-run automatic setup
npm install

# Or manually run setup script
npm run setup

# Or run setup directly
node setup.js

# This validates and fixes:
# - Node.js version compatibility
# - Yarn installation
# - Dependencies installation
# - Directory and file setup
```

**Permission Errors**
```bash
# Windows: Run as Administrator
# macOS/Linux: Check directory permissions
sudo chown -R $USER:$GROUP /path/to/destination
```

**Node.js Version Issues**
```bash
# Verify the Node versions installed
node -v 
```
- It should give the version installed on your machine. 
- Node 22.14.0 [Recommended]

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

**CLI Mode Phase 2 Errors**
```bash
# Error: CLI mode GitHub authentication not yet implemented
# Error: Phase 2 requires credential collection
```
- **Solution**: Use Interactive Mode for Phase 2 migrations
- **CLI Mode**: Currently supports Phase 1 only
- **Command**: `npm start` then select Phase 2

### Debug Mode

```bash
# Enable verbose logging
node src/index.js --verbose

# Preview mode (Coming Soon)
# node src/index.js --dry-run

# Check logs
tail -f logs/combined.log
```

**Note**: The `--dry-run` feature is planned for a future release. Currently, all operations will execute normally even when this flag is used.

## 👥 Team Distribution & Setup

### For FlowSource Development Teams

When sharing this utility with fellow FlowSource developers:

#### **Recommended Team Onboarding (Super Simple):**
```bash
# 1. Developer receives/clones the utility
cd flowsource-migration-utility

# 2. ONE command setup (everything automatic!)
npm install

# 3. Start using immediately
npm start
```

#### **How It Works - Automatic Setup:**
When team members run `npm install`:
1. **Dependencies Install**: All packages downloaded first
2. **Auto-Setup Runs**: `setup.js` automatically executes after install
3. **Environment Ready**: Logs directory and .env file created
4. **Platform Setup**: Scripts configured for Windows/Mac/Linux
5. **Ready to Migrate**: No additional steps needed!

#### **Why This Approach is Perfect for Teams:**
- **✅ Zero Extra Steps**: Just `npm install` - that's it!
- **✅ Dependencies Available**: Setup runs AFTER packages are installed
- **✅ Consistent Environment**: Every team member gets identical setup
- **✅ Minimal Setup**: Only handles what npm can't (directories, env files)
- **✅ Professional Experience**: Smooth, automatic onboarding
- **✅ Fallback Available**: Can run `npm run setup` if needed

#### **Team Benefits:**
- **2-second onboarding**: Download → `npm install` → Ready!
- **No setup confusion**: Everything happens automatically
- **Reduced support tickets**: Automatic validation prevents common issues
- **Professional impression**: Shows well-engineered tooling

**🎯 Result**: Team members go from clone to first migration in under 1 minute!

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

- **Note**: ⚠️ "npm test" is still in improvement, running it will fail. The complete Test-Suite is not yet pushed.

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
