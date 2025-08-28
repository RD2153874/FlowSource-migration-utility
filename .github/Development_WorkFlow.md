# 🚀 FlowSource Migration Utility - Development Workflow & Project Plan

**Version 1.0.0** | Complete guide for developers working on the FlowSource Migration Utility

---

## 📋 Table of Contents

1. [Development Workflow Overview](#-development-workflow-overview)
2. [Git Branching Strategy](#-git-branching-strategy)
3. [Developer Setup Process](#-developer-setup-process)
4. [Feature Development Workflow](#-feature-development-workflow)
5. [Pull Request Process](#-pull-request-process)
6. [Release Management](#-release-management)
7. [Current Project Status](#-current-project-status)
8. [Development Priorities](#-development-priorities)
9. [Code Standards & Guidelines](#-code-standards--guidelines)
10. [Testing Requirements](#-testing-requirements)

---

## 🔄 Development Workflow Overview

The FlowSource Migration Utility follows a structured development workflow designed to ensure code quality, thorough testing, and smooth collaboration across the development team.

### Core Principles

- **Branch-based Development**: All features developed in isolated branches
- **Code Review Required**: All changes go through pull request review
- **Testing First**: Manual and automated testing for all migration phases
- **Documentation Driven**: Keep docs updated with all changes
- **Backwards Compatibility**: Maintain compatibility with existing migrations

---

## 🌳 Git Branching Strategy

### Branch Structure
```
main (production-ready, stable releases)
├── development (active development, integration branch)
│   ├── feature/auth-enhancement
│   ├── feature/phase3-implementation
│   ├── feature/enhanced-error-handling
│   ├── feature/automated-testing
│   ├── bugfix/cli-mode-fixes
│   ├── bugfix/interactive-mode-validation
│   ├── docs/user-manual-updates
│   └── hotfix/critical-migration-issue
└── release/v1.1.0 (release preparation)
```

### Branch Naming Conventions

| Branch Type | Pattern | Example | Purpose |
|-------------|---------|---------|---------|
| **Feature** | `feature/brief-description` | `feature/phase3-implementation` | New functionality |
| **Bug Fix** | `bugfix/brief-description` | `bugfix/cli-mode-validation` | Bug fixes |
| **Documentation** | `docs/brief-description` | `docs/user-manual-updates` | Documentation updates |
| **Hotfix** | `hotfix/brief-description` | `hotfix/critical-migration-issue` | Critical production fixes |
| **Release** | `release/version` | `release/v1.1.0` | Release preparation |

### Branch Protection Rules

- **Main Branch**: Protected, requires PR approval
- **Development Branch**: Protected, requires PR approval
- **Feature Branches**: Open for individual development
- **Release Branches**: Protected during release process

---

## 🛠️ Developer Setup Process

### Initial Repository Setup

```powershell
# 1. Clone the repository
git clone https://github.com/TheCognizantFoundry/flowsource-migration-utility.git
cd flowsource-migration-utility

# 2. Switch to development branch (primary working branch)
git checkout development
git pull origin development

# 3. Install dependencies
npm install

# 4. Run setup script (creates logs directory and .env file)
npm run setup

# 5. Verify installation
node src/index.js --version
npm start -- --help
```

### Environment Verification

```powershell
# Check Node.js version (20.18.3+ required)
node --version

# Check npm version (10.1.0+ required)
npm --version

# Check Git version
git --version

# Test interactive mode (exit with Ctrl+C)
npm start

# Test CLI mode
npm run migrate -- --help
```

### Development Tools Setup

```powershell
# Optional: Install useful development tools
npm install -g nodemon  # For auto-restart during development

# Optional: Set up IDE/Editor extensions
# - ESLint for code linting
# - Prettier for code formatting
# - GitLens for enhanced Git integration
```

---

## 🔧 Feature Development Workflow

### Step 1: Create Feature Branch

```powershell
# Always start from the latest development branch
git checkout development
git pull origin development

# Create and switch to new feature branch
git checkout -b feature/your-feature-name

# Examples:
git checkout -b feature/phase3-implementation
git checkout -b feature/enhanced-error-handling
git checkout -b bugfix/cli-mode-validation
git checkout -b docs/api-documentation
```

### Step 2: Development Process

```powershell
# Make your changes using your preferred editor
# Follow the project structure:
# src/
# ├── core/           # Core migration logic
# ├── ui/             # User interface (interactive mode)
# ├── utils/          # Utility functions
# └── index.js        # Main entry point

# Test your changes frequently
npm start                       # Test interactive mode
node src/index.js --help        # Test CLI mode help
node src/index.js --help-examples  # Test CLI examples
node src/index.js --verbose     # Test with verbose logging
```

### Step 3: Testing Your Changes

```powershell
# Manual Testing Checklist:

# 1. Test Interactive Mode
npm start
# - Test Phase 1 migration
# - Test Phase 2 migration
# - Test error handling
# - Test user input validation

# 2. Test CLI Mode
node src/index.js \
  --mode cli \
  --source "C:\path\to\Flowsource_Package_1_0_0" \
  --destination "C:\path\to\test-output" \
  --name "test-app" \
  --phase 1 \
  --verbose

# 3. Test Help Commands
node src/index.js --help
node src/index.js --help-examples
node src/index.js --help-quick
node src/index.js --help-troubleshoot

# 4. Test Prerequisites Validation
# Ensure your changes don't break existing validation

# 5. Test Backwards Compatibility
# Ensure existing migrations still work
```

### Step 4: Commit Your Changes

```powershell
# Stage your changes
git add .

# Commit with descriptive message following conventional commits
git commit -m "feat: add Phase 3 full platform migration support"
git commit -m "fix: resolve CLI mode validation issues"
git commit -m "docs: update user manual with new features"
git commit -m "refactor: improve error handling in interactive mode"

# Push your feature branch
git push origin feature/your-feature-name
```

---

## 📝 Pull Request Process

### Step 1: Create Pull Request

1. **Navigate to GitHub Repository**
2. **Create PR**: From your feature branch → `development` branch
3. **Fill PR Template**: Use the provided template (`.github/pull_request_template.md`)

### Step 2: PR Template Checklist

```markdown
## Type of Change
- [ ] Bug fix (migration issue or error)
- [ ] New feature (Phase enhancement or new capability)
- [ ] Documentation update
- [ ] Performance improvement

## Migration Phase Impact
- [ ] Phase 1 (Basic FlowSource Theme and UI)
- [ ] Phase 2 (Authentication & Permissions)
- [ ] Phase 3 (Full FlowSource Platform)
- [ ] CLI Mode
- [ ] Interactive Mode

## Testing Completed
- [ ] Manual migration testing completed (Phase 1)
- [ ] Manual migration testing completed (Phase 2)
- [ ] CLI mode testing (if applicable)
- [ ] Interactive mode testing (if applicable)
- [ ] All existing migrations still work
- [ ] No regression in previous phases

## Validation
- [ ] Prerequisites validation still works
- [ ] File structure validation passes
- [ ] Configuration validation passes
- [ ] YAML merging functions properly

## Checklist
- [ ] Code follows FlowSource utility patterns
- [ ] Error handling and logging implemented
- [ ] Documentation updated (README.md if needed)
- [ ] Backwards compatibility maintained
```

### Step 3: Code Review Process

1. **Self Review**: Review your own code before requesting review
2. **Peer Review**: At least one team member reviews the code
3. **Testing Verification**: Reviewer tests the changes locally
4. **Documentation Check**: Ensure all docs are updated
5. **Approval & Merge**: Approved PRs merged to development

---

## 🚀 Release Management

### Release Branch Creation

```powershell
# Create release branch from development
git checkout development
git pull origin development
git checkout -b release/v1.1.0
```

### Release Preparation

```powershell
# 1. Update version in package.json
npm version patch  # or minor/major
# This creates: 1.0.0 → 1.0.1 (patch)

# 2. Update CHANGELOG.md
# Add new version section with all changes

# 3. Final testing
npm start  # Test all migration phases
node src/index.js --help  # Test all CLI commands

# 4. Commit release changes
git add .
git commit -m "chore: prepare release v1.1.0"
git push origin release/v1.1.0
```

### Release Deployment

```powershell
# 1. Merge to main branch
git checkout main
git pull origin main
git merge release/v1.1.0

# 2. Create and push tag
git tag v1.1.0
git push origin main --tags

# 3. Merge back to development
git checkout development
git merge release/v1.1.0
git push origin development

# 4. Clean up release branch
git branch -d release/v1.1.0
git push origin --delete release/v1.1.0
```

---

## 📊 Current Project Status

### ✅ Completed Tasks

| Component | Status | Description |
|-----------|--------|-------------|
| **Environment Setup** | ✅ Complete | Automated setup.js with logs/.env creation |
| **Documentation** | ✅ Complete | Comprehensive README.md and UserManual.md |
| **CLI Mode** | ✅ Complete | Phase 1 support with all CLI options |
| **Interactive Mode** | ✅ Complete | Phase 1 & 2 with full user guidance |
| **Migration Phase 1** | ✅ Complete | Basic FlowSource theme and UI setup |
| **Migration Phase 2** | ✅ Complete | Authentication & database integration |
| **Troubleshooting** | ✅ Complete | PowerShell commands and log viewing |
| **Team Onboarding** | ✅ Complete | Complete setup workflow documentation |

### 🔄 Current Architecture

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
├── UserManual.md                  # Comprehensive user guide
└── DEVELOPMENT_WORKFLOW.md        # This file
└── README.md                       # Main file for Utility

```

---

## 🎯 Development Priorities

### High Priority Features

#### 1. **Phase 3 Implementation**
```powershell
git checkout -b feature/phase3-full-platform
```

**Objectives:**
- Complete FlowSource platform transformation
- Enterprise-grade Plugins
- Full catalog integration and scaffolding
- Advanced permissions and RBAC

**Deliverables:**
- Phase 3 migration logic in `MigrationPhases.js`
- Interactive mode support for Phase 3
- Updated documentation and user guides

#### 2. **Enhanced Error Handling**
```powershell
git checkout -b feature/enhanced-error-handling
```

**Objectives:**
- Better error messages for common migration issues
- Improved validation feedback with suggestions
- Recovery mechanisms for partially failed migrations
- Rollback capabilities for failed migrations

**Deliverables:**
- Enhanced error classes and handling
- User-friendly error messages
- Recovery workflows
- Updated troubleshooting documentation

### Medium Priority Features

#### 3. **Automated Testing Framework**
```powershell
git checkout -b feature/automated-testing
```

**Objectives:**
- Unit tests for core migration logic
- Integration tests for database connections
- Mock testing for interactive mode scenarios
- CI/CD pipeline setup

**Deliverables:**
- Jest or similar testing framework setup
- Test coverage for critical migration paths
- GitHub Actions workflow for automated testing
- Test documentation and guidelines

#### 4. **Performance Optimization**
```powershell
git checkout -b feature/performance-optimization
```

**Objectives:**
- Parallel file processing for large migrations
- Optimized dependency installation
- Enhanced progress tracking and user feedback
- Memory usage optimization

**Deliverables:**
- Parallel processing implementation
- Progress bars and timing information
- Performance benchmarks
- Optimization documentation

### Low Priority Enhancements

#### 5. **Configuration Management**
```powershell
git checkout -b feature/config-management
```

**Objectives:**
- Support for custom configuration files
- Environment-specific configurations
- Configuration validation and templates
- Migration profiles for different scenarios

#### 6. **Logging & Monitoring**
```powershell
git checkout -b feature/enhanced-logging
```

**Objectives:**
- Structured logging with different levels
- Log rotation and archival
- Performance metrics collection
- Debug mode enhancements

---

## 📋 Code Standards & Guidelines

### File Structure Standards

```javascript
// Standard file header
/**
 * FlowSource Migration Utility
 * Component: [ComponentName]
 * Purpose: [Brief description]
 * Author: FlowSource Team
 * Version: 1.0.0
 */

// Standard imports
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { Logger } from "../utils/Logger.js";
```

### Error Handling Patterns

```javascript
// Standard error handling
try {
    const result = await migrationOperation();
    logger.info('✅ Migration operation completed successfully');
    return result;
} catch (error) {
    logger.error('❌ Migration operation failed:', error.message);
    throw new Error(`Migration failed: ${error.message}`);
}
```

### Logging Standards

```javascript
// Standard logging patterns
logger.info('🔍 Starting migration phase validation...');
logger.warn('⚠️ PostgreSQL not found, falling back to SQLite');
logger.error('❌ Migration failed:', error.message);
logger.debug('🔧 Debug info:', debugData);
```


---

## 🧪 Testing Requirements

### Manual Testing Checklist

#### **For Every PR:**
- [ ] Interactive mode launches without errors
- [ ] CLI mode help commands work (`--help`, `--help-examples`)
- [ ] Phase 1 migration completes successfully
- [ ] Generated applications start without errors
- [ ] All existing functionality still works (no regression)

#### **For Phase 2 Changes:**
- [ ] Database connection validation works
- [ ] GitHub OAuth configuration validates correctly
- [ ] Authentication flow works in generated app
- [ ] All database types (PostgreSQL, SQLite) supported

#### **For CLI Mode Changes:**
- [ ] All CLI flags work as documented
- [ ] Error messages are clear and actionable
- [ ] Verbose logging provides useful information
- [ ] Dry-run mode works correctly

#### **For Interactive Mode Changes:**
- [ ] All prompts display correctly
- [ ] Input validation provides helpful feedback
- [ ] Progress indicators work properly
- [ ] User can exit gracefully at any point

### Testing Commands

```powershell
# Basic functionality test
npm start

# CLI mode comprehensive test
node src/index.js \
  --mode cli \
  --source "C:\FlowSource-Migration\Flowsource_Package_1_0_0" \
  --destination "C:\FlowSource-Migration\test-output" \
  --name "test-migration" \
  --phase 1 \
  --install \
  --verbose \
  --dry-run

# Help system test
node src/index.js --help
node src/index.js --help-examples
node src/index.js --help-quick
node src/index.js --help-troubleshoot

# Version test
node src/index.js --version
```

**📝 Note on npm scripts:**
- `npm start` - Launches interactive mode
- `npm run migrate` - Launches CLI mode but requires parameters
- For CLI commands with arguments, use `node src/index.js` directly instead of npm scripts

---

## 🔄 Continuous Integration

### Pre-commit Checklist

```powershell
# Before committing changes:
# 1. Run manual tests
npm start  # Quick interactive test
node src/index.js --help  # CLI help test

# 2. Check for linting issues (if ESLint is set up)
npm run lint

# 3. Verify documentation is updated
# Check if README.md or UserManual.md need updates

# 4. Test backwards compatibility
# Ensure existing migrations still work
```

### Branch Protection

- **Development Branch**: Requires PR approval before merge
- **Main Branch**: Requires PR approval and successful testing
- **No Direct Commits**: All changes must go through pull requests
- **Linear History**: Prefer squash merging for clean history

---

## 📞 Development Support

### Getting Help

1. **Check Documentation**: Review README.md and UserManual.md
2. **Review Existing Code**: Look at similar implementations
3. **Test Thoroughly**: Use both CLI and interactive modes
4. **Ask Questions**: Create GitHub issues for clarification

### Development Environment Issues

```powershell
# Clean install if dependencies are corrupted
rm -rf node_modules
rm package-lock.json
npm install

# Reset to clean state
git checkout development
git pull origin development
git clean -fd  # Remove untracked files
```

### Common Development Tasks

```powershell
# Add new CLI option
# Edit src/index.js and add to commander.js options

# Add new interactive prompt
# Edit src/ui/InteractiveMode.js and add to inquirer prompts

# Add new migration step
# Edit src/core/MigrationPhases.js and add to appropriate phase

# Update configuration merging
# Edit src/utils/YamlConfigMerger.js
```

---

## 🎉 Success Metrics

### Development Goals

- **Code Quality**: All PRs reviewed and tested
- **User Experience**: Clear documentation and helpful error messages
- **Reliability**: Backwards compatibility maintained
- **Performance**: Migration completes in reasonable time
- **Maintainability**: Clean, well-documented code

### Release Criteria

- [ ] All planned features implemented and tested
- [ ] Documentation updated and accurate
- [ ] No critical bugs or regressions
- [ ] Performance meets expectations
- [ ] User feedback incorporated

---

*FlowSource Migration Utility v1.0.0 - Development Workflow Guide*
*Created by FlowSource Development Team - Last Updated: August 28, 2025*.
*Reach Out to Rishu.Dutta@cognizant.com for development related concerns*
