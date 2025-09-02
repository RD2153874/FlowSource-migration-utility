# 📖 FlowSource Migration Utility - User Manual

**Version 1.0.0** | Complete setup guide for successfully migrating from Backstage to FlowSource

---

## 🎯 Quick Overview

The FlowSource Migration Utility transforms standard Backstage applications into fully-featured FlowSource platform with enhanced authentication, database integration, template integration, and enterprise-grade features. This manual provides step-by-step instructions to ensure a successful migration through all three phases:

- **Phase 1**: Basic FlowSource UI and theming
- **Phase 2**: Authentication, database integration, and permissions  
- **Phase 3**: Template / Plugin integration and development platform capabilities

The utility supports intelligent template integration with PDLC templates, automated catalog configuration, and plugin infrastructure preparation for a complete development platform experience.

## 📋 Table of Contents

1. [System Prerequisites](#-system-prerequisites)
2. [Database Prerequisites](#-database-prerequisites)
3. [GitHub OAuth Prerequisites](#-github-oauth-prerequisites)
4. [FlowSource Package Prerequisites](#-flowsource-package-prerequisites)
5. [Environment Setup](#-environment-setup)
6. [Installation Guide](#-installation-guide)
7. [Migration Process](#-migration-process)
   - [Phase 1: Basic FlowSource Setup](#phase-1-basic-flowsource-setup)
   - [Phase 2: Authentication & Database Integration](#phase-2-authentication--database-integration)
   - [Phase 3: Templates & Plugins Integration](#phase-3-templates--plugins-integration-)
8. [Post-Migration Configuration](#-post-migration-configuration)
9. [Troubleshooting](#-troubleshooting)
10. [Support](#-support)

---

## 💻 System Prerequisites

### Required Software

| Software | Minimum Version | Recommended Version | Installation |
|----------|----------------|-------------------|--------------|
| **Node.js** | 20.18.3 | 22.14.0+ | [Download from nodejs.org](https://nodejs.org/) |
| **npm** | 10.1.0 | 10.9.2+ | Included with Node.js |
| **Git** | Latest | Latest | [Download from git-scm.com](https://git-scm.com/) |
| **PowerShell** | 5.1+ | 7.0+ (Windows) | Pre-installed on Windows |

### System Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Storage**: 5GB free space for migration files
- **Network**: Internet connection for package downloads and GitHub access

### Verification Commands

Run these commands to verify your system:

```powershell
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Git version
git --version

# Check available memory (Windows)
wmic computersystem get TotalPhysicalMemory

# Check available disk space (Windows)
dir C:\ | findstr "bytes free"
```

**✅ Expected Output Example:**
```
v22.14.0
10.9.2
git version 2.43.0.windows.1
```

---

## 🗄️ Database Prerequisites

### PostgreSQL Setup (Recommended for Production)

FlowSource requires a database for authentication, permissions, and catalog storage. PostgreSQL is the recommended choice for production environments.

#### Windows Installation

1. **Download PostgreSQL**:
   - Visit [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
   - Download the Windows installer (version 14+ recommended)

2. **Install PostgreSQL**:
   - Run the installer as Administrator
   - Set superuser password (remember this!)
   - Default port: `5432`
   - Remember the installation directory

3. **Verify Installation**:
   ```powershell
   # Test PostgreSQL connection
   psql -U postgres -h localhost -p 5432
   ```


#### Connection Information Needed

During migration, you'll need:

| Field | Example Value | Description |
|-------|---------------|-------------|
| **Host** | `localhost` | Database server address |
| **Port** | `5432` | PostgreSQL default port |
| **Username** | `postgres` | Database user |
| **Password** | `root` | User password |

### SQLite Alternative (Development Only)

For development/testing purposes, you can use SQLite:

- ✅ **Pros**: No setup required, file-based storage
- ❌ **Cons**: Not suitable for production, limited concurrent access

The migration utility will automatically configure SQLite if you choose this option.

---

## 🐙 GitHub OAuth Prerequisites

FlowSource uses GitHub OAuth for authentication and repository integration. You must set up a GitHub OAuth Application before running the migration.

### GitHub Account Requirements

- **GitHub Account**: Personal or Organization account
- **Admin Access**: If using an organization, you need admin permissions
- **Repository Access**: Permissions to create OAuth applications

### Creating GitHub OAuth Application

#### Step 1: Access Developer Settings

1. **Login to GitHub** with your admin account
2. **Navigate to Settings**:
   - Click your profile icon → **Settings**
   - Scroll down → **Developer settings**
   - Click **OAuth Apps**

#### Step 2: Create New OAuth App

1. **Click "New OAuth App"**

2. **Fill Application Details**:

   | Field | Value | Notes |
   |-------|-------|-------|
   | **Application Name** | `FlowSource-YourCompany` | Choose a descriptive name |
   | **Homepage URL** | `http://localhost:3000` | Your FlowSource frontend URL |
   | **Authorization Callback URL** | `http://localhost:7007/api/auth/github/handler/frame` | **Critical**: Must be exact |
   | **Application Description** | `FlowSource Platform Authentication` | Optional but recommended |

3. **Register Application**

#### Step 3: Generate Client Secret

1. **After registration**, click **"Generate a new client secret"**
2. **📋 IMPORTANT**: Copy and securely store both:
   - **Client ID** (visible)
   - **Client Secret** (shown only once!)

#### Step 4: Configure Organization Access (If Using Organization)

1. **In OAuth App settings**, scroll to **Organization access**
2. **Request access** or **Grant access** for your organization
3. **Ensure permissions include**:
   - `read:org` (team information)
   - `read:user` (user profile)
   - `user:email` (user email)

### Credentials Needed During Migration

The migration utility will ask for:

| Field | Example | Where to Find |
|-------|---------|---------------|
| **Client ID** | `Iv1.a629723c3b0b4567` | OAuth App settings page |
| **Client Secret** | `abc123def456...` | Generated during setup (save immediately!) |
| **Organization Name** | `your-company` | GitHub organization name (if applicable) |

### Security Best Practices

- ✅ **Store secrets securely** - Never commit to version control
- ✅ **Use environment variables** for production
- ✅ **Regularly rotate secrets** (recommended: every 90 days)
- ✅ **Monitor OAuth app usage** in GitHub settings

---

## 📦 FlowSource Package Prerequisites

### Required Package Structure

The migration utility requires the official FlowSource package with this structure:

```
Flowsource_Package_1_0_0/
├── FlowSourceInstaller/
│   └── FlowsourceSetupDoc/
│       ├── Readme.md                    # Main setup guide
│       ├── Auth.md                      # Authentication setup
│       ├── GithubAuth.md               # GitHub OAuth guide
│       ├── UI-Changes.md               # UI customization
│       └── PDLC-template.md            # Template integration guide (Phase 3)
├── configuration/                       # Base configuration files
│   ├── app-config.yaml
│   ├── package.json
│   ├── Dockerfile
│   └── ...
├── packages-core/                       # Core FlowSource code
│   ├── app/                            # Frontend application
│   └── backend/                        # Backend services
├── Flowsource-templates/               # Templates for Phase 3 integration
│   ├── PDLC-Backend/                   # Backend development template
│   │   ├── template.yaml               # Template definition
│   │   ├── skeleton/                   # Template files
│   │   └── docs/                       # Template documentation
│   ├── PDLC-Frontend/                  # Frontend development template
│   │   ├── template.yaml               # Template definition
│   │   ├── skeleton/                   # Template files
│   │   └── docs/                       # Template documentation
│   └── ...                             # Additional templates
└── ...
```

### Package Verification

Before starting migration, verify your source package:

**Phase 1 & 2 Requirements:**
```powershell
# Navigate to your FlowSource package
cd "C:\path\to\Flowsource_Package_1_0_0"

# Check required directories exist
dir FlowSourceInstaller\FlowsourceSetupDoc
dir configuration
dir packages-core

# Verify key files exist
dir FlowSourceInstaller\FlowsourceSetupDoc\*.md
dir configuration\app-config.yaml
dir packages-core\app
dir packages-core\backend
```

**Additional Phase 3 Requirements:**
```powershell
# Check Phase 3 template directories exist
dir Flowsource-templates
dir Flowsource-templates\PDLC-Backend
dir Flowsource-templates\PDLC-Frontend

# Verify Phase 3 documentation exists
dir FlowSourceInstaller\FlowsourceSetupDoc\PDLC-template.md

# Verify template.yaml files exist
dir Flowsource-templates\PDLC-Backend\template.yaml
dir Flowsource-templates\PDLC-Frontend\template.yaml
```

### Package Download

If you don't have the FlowSource package:

1. **Contact FlowSource Support** for access to the official package
2. **Extract the package** to a accessible location
3. **Note the full path** - you'll need it during migration

---

## 🔧 Environment Setup

### Workspace Preparation

1. **Create Migration Workspace**:
   
   # Create a dedicated workspace
   ```powershell
   mkdir C:\FlowSource-Migration
   cd C:\FlowSource-Migration
   ```
   
   # Create directories for organised structure
   Clone the repo from this link `https://github.com/TheCognizantFoundry/flowsource-migration-utility.git`.

   - Directory `flowsource-migration-utility` will be created.
   - For setting up the utility refer the [README.md](README.md) for detailed installation and setup instructions.

   # Copy/Move the Source package
   - Copy/Move the source package - `Flowsource_Package_1_0_0` to the FlowSource-Migration directory

   # Create directory generated-apps
   ```powershell
   mkdir generated-apps
   ```
   - This directory will be autogenerated by the utility if not found - But only in Interactive Mode. 
   - In CLI mode, user can give anything for `--destination` flag.
   - [Recommened] Create this directory manually.
   

2. **Organize Your Files**:
   ```
   C:\FlowSource-Migration\
   ├── Flowsource_Package_1_0_0\   # FlowSource package
   ├── flowsource-migration-utility\    # Cloned utility
   └── generated-apps\                  # Migration outputs
   ```

---

## 🚀 Installation Guide

### Step 1: Download Migration Utility

```powershell
# Clone or download the utility to your workspace
cd C:\FlowSource-Migration

git clone https://github.com/TheCognizantFoundry/flowsource-migration-utility.git

cd flowsource-migration-utility
```

### Step 2: Install Dependencies

```powershell
# Install all required packages
npm install

# Verify installation
npm list --depth=0
```

### Step 3: Test and Explore the Utility

```powershell
# Verify installation by checking version
node src/index.js --version

# View available commands and options
node src/index.js --help

# See usage examples and common workflows
node src/index.js --help-examples

# Test interactive mode (you can exit with Ctrl+C)
npm start
```

**✅ Expected Output for Help:**
```
Usage: flowsource-migration-utility [options]
Utility for automated migration from Backstage to FlowSource.

Options:
  -V, --version             output the version number
  -s, --source <path>       Source FlowSource package path
  -d, --destination <path>  Destination path for new application
  -n, --name <name>         Application name
  -i, --install             Auto-install dependencies
  --mode <mode>             Operation mode: interactive|cli (default: "interactive")
  --phase <phase>           Migration phase: 1|2|3 (default: "3")
  --dry-run                 Preview changes without executing
  --verbose                 Enable verbose logging
  --config <file>           Custom configuration file
  --help-quick              Show quick start guide
  --help-troubleshoot       Show troubleshooting guide
  --help-examples           Show usage examples
  -h, --help                display help for command
```

---

## 🔄 Migration Process

### Phase 1: Basic FlowSource Setup

Phase 1 creates a basic FlowSource application with UI customizations but no authentication or database.

#### Interactive Mode (Recommended for First-Time Users)

```powershell
# Start interactive migration
npm start
```

**You'll be prompted for:**

1. **Source Path**: Path to your `Flowsource_Package_1_0_0` directory
2. **Destination Path**: Where to create your new FlowSource app
3. **Application Name**: Name for your application (e.g., "my-flowsource-app")
4. **Migration Phase**: Choose `1` for basic setup

#### CLI Mode (Advanced Users)

```powershell
npm run migrate -- \
  --source "C:\FlowSource-Migration\source-packages\Flowsource_Package_1_0_0" \
  --destination "C:\FlowSource-Migration\generated-apps\my-flowsource-app" \
  --name "my-flowsource-app" \
  --phase 1 \
  --install \
  --verbose
```

### Phase 2: Authentication & Database Integration

Phase 2 adds authentication, database integration, and permissions.

#### Prerequisites Check

Before running Phase 2, ensure:

- ✅ **PostgreSQL is running** and accessible
- ✅ **GitHub OAuth App is created** and you have credentials
- ✅ **Phase 1 completed successfully**

#### Interactive Mode

```powershell
# Start Phase 2 migration
npm start
```

**📋 Detailed Interactive Process:During Migration you will be prompted for**

**1: Basic Configuration**
- **Source Path**: Enter path to your `Flowsource_Package_1_0_0` directory
- **Destination Path**: Where to create/update your FlowSource app
- **Application Name**: Confirm or update your application name

**2: Migration Phase Selection**
- **Choose Phase**: Select `2` for Authentication & Database Integration
- **Confirmation**: Phase 2 reviews that Phase 1 prerequisites are met if not, will execute the Phase 1 first.

**3: Auto install & Verbose logging**
- **Automatic dependency install**: Select `N` since we will do it post migration. Choosing `Y` will immediately start installing dependencies after the migration steps are done. The dependencies will get installed in the root of the generated app.
- **Verbose Logging**: Choose `Y` for enabling Verbose logging.

**4: Database Configuration**
- **Database Type**: Choose between:
  - `PostgreSQL` (recommended for production)
  - `SQLite` (development/testing only)

**5: Database Connection Details** (if PostgreSQL selected)
- **Host**: Database server address (e.g., `localhost`)
- **Port**: Database port (default: `5432`)
- **Username**: Database user (e.g., `postgres`)
- **Password**: Database password (secure input)

**6: Backend Authentication**
- **Backend authentication secrets (required)** This will be autogenerated each time the migration runs, you can use your own as well.
- **Session secrets (optional)** This will be a placeholder for now. Choose `N`.

**7: Authentication Provider Selection**
- **Provider Type**: Choose `GitHub OAuth` from the available providers. One can choose multiple providers
- **Organization Setup**: Confirm if using personal or organization account

**8: GitHub OAuth Configuration**
- **Client ID**: Enter your GitHub OAuth App Client ID
- **Client Secret**: Enter your GitHub OAuth App Client Secret (secure input). 
- This will not be visible, so you need to copy it and do a right click [mouse or touchpad] only once, anything more than once will result in duplication in *.config.yaml files.
- **Organization Name**: Enter GitHub organization name (if applicable)
- **Callback URL Verification**: Utility confirms correct callback URL setup
- **PAT or GithubApp integration**: Utility will ask to choose either PAT or GithubAPP. Choose PAT for now as GithubAPP is in testing mode.
- Choosing PAT will auto disable the GithubApp and none of it's configuration block will be pushed in *.config.yaml file

**8: Configuration Review & Confirmation**
- **Settings Summary**: Review all entered configuration
- **Validation Check**: Utility validates all prerequisites
- **Final Confirmation**: Confirm to start Phase 2 migration


### Migration Progress

During migration, you'll see:

```
🤖 FlowSource Migration Utility initialized
2025-08-27 17:56:36 info: 📋 Mode: interactive
2025-08-27 17:56:36 info: 🎯 Phase: 1
2025-08-27 17:56:36 info: 🔍 Validating prerequisites...
2025-08-27 17:56:37 info: ✅ Node.js version: v22.15.0
2025-08-27 17:56:40 info: ✅ npm version: 10.9.2
2025-08-27 17:56:41 info: ✅ Yarn version: 1.22.22
2025-08-27 17:56:42 info: ✅ Git: git version 2.37.3.windows.1

📋 Prerequisites Check Results:

✅ Passed:
  - Node.js v22.15.0 (✓ Compatible)
  - npm 10.9.2 (✓ Compatible)
  - Yarn 1.22.22 (✓ Compatible)
  - Git 2.37.3.windows.1 (✓ Available)
  - System Memory: 16GB (✓ Sufficient)
  - File system access (✓ Working)
  - Platform: win32 (✓ Supported)
✅ Prerequisites validation completed
🤖 Welcome to FlowSource Migration Utility - Interactive Mode
```

### Phase 3: Templates & Plugins Integration ✅

Phase 3 transforms your FlowSource application into a comprehensive development platform with template integration and plugin support infrastructure.

#### Prerequisites Check

Before running Phase 3, ensure:

- ✅ **Phase 2 completed successfully** (Authentication & Database configured)
- ✅ **FlowSource package contains Flowsource-templates/** directory
- ✅ **PDLC-template.md** exists in FlowSourceInstaller/FlowsourceSetupDoc/
- ✅ **Template directories** (PDLC-Backend, PDLC-Frontend) contain template.yaml files

#### Phase 3 Features Overview

**🚀 What Phase 3 Provides:**
- **📄 Template Integration**: Intelligent PDLC template integration with automated catalog configuration
- **🔍 Dynamic Discovery**: Automatic template scanning and discovery from FlowSource package
- **📖 Documentation-Driven**: Parses PDLC-template.md for automated integration instructions
- **🎯 User Selection**: Interactive template selection with descriptions and validation
- **⚙️ Smart Configuration**: Automatic catalog entry creation in both app-config files
- **🔌 Plugin Infrastructure**: Ready for plugin integration (coming soon)

#### Interactive Mode (Only Supported Mode)

```powershell
# Start Phase 3 migration
npm start
```

**📋 Detailed Interactive Process: Phase 3 Template Integration**

**1: Basic Configuration**
- **Source Path**: Enter path to your `Flowsource_Package_1_0_0` directory
- **Destination Path**: Path to your existing FlowSource app (from Phase 1/2)
- **Application Name**: Confirm your application name

**2: Migration Phase Selection**
- **Choose Phase**: Select `3` for Templates & Plugins Integration
- **Automatic Prerequisites**: Phase 3 automatically validates Phase 2 completion
- **Auto-Execution**: If Phase 2 not completed, Phase 3 will execute Phase 2 first

**3: Auto Install & Verbose Logging**
- **Automatic dependency install**: Select `N` (recommended - install manually post-migration)
- **Verbose Logging**: Choose `Y` for detailed progress tracking

**4: Phase 2 Prerequisites Collection** (If Phase 2 not completed)
- Phase 3 will automatically collect Phase 2 configuration:
  - Database configuration (PostgreSQL/SQLite)
  - Authentication provider selection
  - GitHub OAuth configuration
  - Backend authentication secrets

**5: Phase 3 Integration Type Selection**
- **Integration Choice**: Select what to integrate:
  
  ```
  🔧 What would you like to integrate?
  ❯ 📄 Templates only - Add FlowSource templates
    🔌 Plugins only - Add FlowSource plugins (Coming Soon)
    🎯 Both Templates and Plugins (Available when plugins ready)
  ```

**6: Template Selection** (If Templates chosen)
- **Available Templates**: Utility automatically discovers available templates
- **Template List**: Choose from discovered templates:
  
  ```
  📄 Select templates to integrate:
  ❯ ◯ PDLC-Backend - Backend development template with best practices
    ◯ PDLC-Frontend - Frontend development template with best practices
    ◯ [Additional templates if available]
  ```
  
- **Multi-Selection**: Use space bar to select multiple templates
- **Validation**: Must select at least one template

**7: Configuration Review & Confirmation**
- **Phase 3 Summary**: Review selected integration type and templates
- **Phase 2 Configuration**: Review authentication and database settings (if collected)
- **Final Confirmation**: Confirm to start Phase 3 migration

#### Phase 3 Migration Progress

During Phase 3 migration, you'll see detailed progress:

```
🚀 Starting Phase 3: Templates & Plugins Integration
[14/19] 🔍 Validating Phase 3 prerequisites...
✅ Phase 2 already completed, proceeding with Phase 3
✅ Flowsource-templates directory found
✅ PDLC-template.md found and accessible

[15/19] 📋 Processing integration selections...
🎯 Integration type: templates
📄 Selected templates: PDLC-Backend, PDLC-Frontend

[16/19] 📄 Integrating templates...
🚀 Starting intelligent template integration...
📖 Parsing PDLC template documentation...
✅ Template instructions parsed successfully
📄 Integrating template: PDLC-Backend
🔧 Processing PDLC-Backend integration...
📁 Created templates directory
📄 Copied PDLC-Backend from Flowsource-templates/PDLC-Backend to templates/PDLC-Backend
✅ Verified template.yaml exists for PDLC-Backend
✅ PDLC-Backend integrated successfully
📄 Integrating template: PDLC-Frontend
🔧 Processing PDLC-Frontend integration...
📄 Copied PDLC-Frontend from Flowsource-templates/PDLC-Frontend to templates/PDLC-Frontend
✅ Verified template.yaml exists for PDLC-Frontend
✅ PDLC-Frontend integrated successfully

[17/19] ⚙️ Updating configuration files...
⚙️ Updating app-config files with template catalog entries...
✅ Updated app-config.yaml with template catalog entries
✅ Updated app-config.local.yaml with template catalog entries
🔄 Dual configuration maintained: template entries synchronized

[18/19] 🔍 Validating integrations...
🔍 Validating template integration...
✅ All template integrations validated successfully

[19/19] 🎁 Final validation and cleanup...
✅ Phase 3 setup finalized
```

#### Template Integration Details

**📄 What Happens During Template Integration:**

1. **Documentation Parsing**: 
   - Reads `PDLC-template.md` for integration instructions
   - Extracts template-specific copy instructions
   - Identifies source and target paths

2. **Directory Creation**:
   - Creates `templates/` directory in your application
   - Ensures proper directory structure

3. **File Operations**:
   - Copies template files from `Flowsource-templates/PDLC-Backend/` to `templates/PDLC-Backend/`
   - Copies template files from `Flowsource-templates/PDLC-Frontend/` to `templates/PDLC-Frontend/`
   - Preserves template.yaml and all supporting files

4. **Configuration Updates**:
   - Updates `app-config.yaml` with catalog entries:
     ```yaml
     catalog:
       locations:
         - type: file
           target: ../../templates/PDLC-Backend/template.yaml
           rules:
             - allow: [Template]
         - type: file
           target: ../../templates/PDLC-Frontend/template.yaml
           rules:
             - allow: [Template]
     ```
   - Maintains dual configuration by updating both config files

5. **Validation**:
   - Verifies template directories exist
   - Validates template.yaml structure
   - Confirms catalog configuration accuracy

#### Plugin Integration (Coming Soon)

**🔌 Plugin Infrastructure Ready:**
- Plugin integration framework implemented
- Interactive selection system prepared
- Configuration management ready
- Currently shows "Coming Soon" message

**Future Plugin Capabilities:**
- 50+ DevOps plugins
- Infrastructure provisioning
- Monitoring and observability
- AI-powered features

#### Phase 3 CLI Mode Limitation

**❌ CLI Mode Not Supported for Phase 3:**
Phase 3 requires complex user interactions that CLI mode cannot handle:
- Template discovery and selection
- Multi-choice integration options
- Dynamic configuration based on user selections
- Plugin selection interface (when available)

**✅ Solution**: Always use Interactive Mode for Phase 3:
```powershell
npm start
# Select Phase 3 in the interactive interface
```

#### Post-Phase 3 Application Structure

After successful Phase 3 migration, your application will have:

```
my-flowsource-app/
├── app-config.yaml              # Updated with template catalog entries
├── app-config.local.yaml        # Updated with template catalog entries
├── templates/                   # NEW: Template directory
│   ├── PDLC-Backend/           # Backend development template
│   │   ├── template.yaml       # Template definition
│   │   ├── skeleton/           # Template files
│   │   └── docs/               # Template documentation
│   └── PDLC-Frontend/          # Frontend development template
│       ├── template.yaml       # Template definition
│       ├── skeleton/           # Template files
│       └── docs/               # Template documentation
├── packages/
│   ├── app/                    # Frontend with authentication
│   └── backend/                # Backend with auth & database
└── ...
```

---

## ⚙️ Post-Migration Configuration

### Verify Your Application

1. **Navigate to Generated App**:
   ```powershell
   cd "C:\FlowSource-Migration\generated-apps\my-flowsource-app"
   ```

2. **Install Dependencies**:
   ```powershell
   # Installing Dependencies
   cd my-flowsource-app
   yarn install
   ```

3. **Start the Application**:
   ```powershell
   # Start both backend & frontend (in one terminal)
   cd my-flowsource-app
   yarn dev
   ```

4. **Access Your Application**:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:7007

### Phase 3 Template Verification

If you completed Phase 3, verify template integration:

1. **Check Templates Directory**:
   ```powershell
   # Verify templates directory exists
   dir templates
   
   # Check integrated templates
   dir templates\PDLC-Backend
   dir templates\PDLC-Frontend
   
   # Verify template.yaml files
   dir templates\PDLC-Backend\template.yaml
   dir templates\PDLC-Frontend\template.yaml
   ```

2. **Verify Catalog Configuration**:
   ```powershell
   # Check catalog entries in config files
   findstr /C:"templates/" app-config.yaml
   findstr /C:"templates/" app-config.local.yaml
   ```

3. **Access Templates in Backstage**:
   - **Navigate to**: http://localhost:3000/create
   - **Verify**: PDLC-Backend and PDLC-Frontend templates appear in the catalog
   - **Test**: Try creating a new project using one of the templates

### Configuration Files

Your generated application includes:

| File | Purpose | Location |
|------|---------|----------|
| `app-config.yaml` | Main configuration with template catalog entries | Project root |
| `app-config.local.yaml` | Local development overrides with template catalog entries | Project root |
| `packages/backend/src/plugins/auth.ts` | Authentication setup | Backend |
| `packages/app/src/App.tsx` | Frontend app configuration | Frontend |
| `templates/PDLC-Backend/template.yaml` | Backend template definition (Phase 3) | Templates |
| `templates/PDLC-Frontend/template.yaml` | Frontend template definition (Phase 3) | Templates |

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Migration Fails: "Source package not found"

**Problem**: FlowSource package path is incorrect

**Solution**:
```powershell
# Verify package structure
dir "C:\path\to\Flowsource_Package_1_0_0\FlowSourceInstaller"
dir "C:\path\to\Flowsource_Package_1_0_0\configuration"
dir "C:\path\to\Flowsource_Package_1_0_0\packages-core"
```

#### 2. Database Connection Failed

**Problem**: PostgreSQL not accessible

**Solutions**:
```powershell
# Check PostgreSQL service is running
Get-Service postgresql*

# Test connection manually
psql -U flowsource_user -h localhost -p 5432 -d flowsource_db_name

# Verify user permissions
psql -U postgres -c "\du"
```

#### 3. GitHub OAuth Authentication Failed

**Problem**: OAuth configuration incorrect

**Solutions**:
- ✅ **Verify Callback URL**: Must be exactly `http://localhost:7007/api/auth/github/handler/frame`
- ✅ **Check Client Secret**: Regenerate if lost
- ✅ **Organization Access**: Ensure OAuth app has organization permissions
- ✅ **Scope Permissions**: Verify `read:org`, `read:user`, `user:email` are enabled

#### 4. Application Starts But Login Fails

**Problem**: Authentication configuration mismatch

**Solutions**:
```yaml
# Verify app-config.yaml
auth:
  providers:
    github:
      development:
        clientId: ${GITHUB_CLIENT_ID}
        clientSecret: ${GITHUB_CLIENT_SECRET}
```

#### 5. Migration Hangs During Interactive Mode

**Problem**: Timeout or input validation

**Solutions**:
- ✅ **Use non-interactive mode** if available
- ✅ **Check terminal encoding** (use UTF-8)
- ✅ **Restart PowerShell** as Administrator
- ✅ **Verify all prerequisites** are met

#### 6. Phase 3: Template Integration Failed

**Problem**: Templates not found or integration fails

**Solutions**:
```powershell
# Verify Phase 3 prerequisites
dir "C:\path\to\Flowsource_Package_1_0_0\Flowsource-templates"
dir "C:\path\to\Flowsource_Package_1_0_0\FlowSourceInstaller\FlowsourceSetupDoc\PDLC-template.md"

# Check template directories exist
dir "C:\path\to\Flowsource_Package_1_0_0\Flowsource-templates\PDLC-Backend"
dir "C:\path\to\Flowsource_Package_1_0_0\Flowsource-templates\PDLC-Frontend"

# Verify template.yaml files
dir "C:\path\to\Flowsource_Package_1_0_0\Flowsource-templates\PDLC-Backend\template.yaml"
dir "C:\path\to\Flowsource_Package_1_0_0\Flowsource-templates\PDLC-Frontend\template.yaml"
```

#### 7. Phase 3: Templates Not Appearing in Catalog

**Problem**: Templates integrated but not visible in Backstage catalog

**Solutions**:
```powershell
# Verify catalog configuration
findstr /C:"templates/" app-config.yaml
findstr /C:"templates/" app-config.local.yaml

# Check templates directory in generated app
dir "C:\FlowSource-Migration\generated-apps\my-flowsource-app\templates"

# Verify template.yaml content
type "C:\FlowSource-Migration\generated-apps\my-flowsource-app\templates\PDLC-Backend\template.yaml"
```

**Additional Checks**:
- ✅ **Restart Application**: After template integration, restart with `yarn dev`
- ✅ **Clear Browser Cache**: Templates may be cached
- ✅ **Check Console Errors**: Open browser dev tools for error messages
- ✅ **Verify File Permissions**: Ensure template files are readable

#### 8. Phase 3: "Phase 2 Not Completed" Error

**Problem**: Phase 3 detects Phase 2 is incomplete

**Solutions**:
- ✅ **Let Phase 3 Auto-Execute**: Phase 3 will automatically run Phase 2 if needed
- ✅ **Run Phase 2 First**: Complete Phase 2 migration before attempting Phase 3
- ✅ **Check Phase 2 Indicators**: Verify authentication files exist:
  ```powershell
  dir "packages\backend\src\plugins\auth.ts"
  dir "app-config.local.yaml"
  findstr /C:"auth:" app-config.yaml
  ```

#### 9. Phase 3: CLI Mode Error

**Problem**: Attempting to run Phase 3 in CLI mode

**Error Message**: 
```
Phase 3 requires interactive mode for template selection
```

**Solution**:
- ✅ **Use Interactive Mode Only**: Phase 3 only supports interactive mode
- ✅ **Command**: Always use `npm start` for Phase 3
- ✅ **Reason**: Template selection requires complex user interaction

### Debug Mode

Enable verbose logging:

```powershell
# Run with detailed logs
npm start -- --verbose
```

### Log Files

Migration logs are stored in:
- **Migration Utility Logs**: `flowsource-migration-utility\logs\`
- Execute the following commands from the `flowsource-migration-utility` directory

```powershell
# Check migration logs directory
dir logs\

# View recent migration logs (combined log with all output)
Get-Content logs\combined.log -Tail 50

# View error logs only
Get-Content logs\error.log -Tail 20

# Monitor logs in real-time (during migration)
Get-Content logs\combined.log -Wait -Tail 10
```


---

## 📞 Support

### Getting Help

1. **Check Logs**: Always review migration logs for specific error messages
2. **Verify Prerequisites**: Ensure all prerequisites are met before contacting support
3. **Gather Information**: Prepare system info, error messages, and configuration details
4. **Reach out to DEV team**: Reach out to the "FlowSource migration Utility" dev team.

### Information to Provide When Seeking Support

- **Migration Utility Version**: 1.0.0
- **Node.js Version**: Output of `node --version`
- **Operating System**: Windows version, macOS version, or Linux distribution
- **Migration Phase**: Phase 1 or Phase 2
- **Error Messages**: Complete error text from logs
- **Configuration**: Sanitized configuration files (remove secrets!)

### Documentation References

- **Migration Utility Overview**: [README.md](README.md) - Quick start, features, and basic usage
- **Detailed Setup & Installation**: [UserManual.md](UserManual.md) - Complete installation and configuration guide
- **Troubleshooting Guide**: [UserManual.md#troubleshooting](UserManual.md#-troubleshooting) - Common issues and solutions

---

## ✅ Pre-Migration Checklist

Before starting your migration, verify all prerequisites:

### System Requirements
- [ ] Node.js 20.18.3+ installed
- [ ] npm 10.1.0+ available
- [ ] Git installed and accessible
- [ ] 5GB+ free disk space
- [ ] Internet connection available

### Database Prerequisites (Phase 2)
- [ ] PostgreSQL 14+ installed and running
- [ ] Database user created with proper permissions
- [ ] Connection details documented (host, port, user, password, database)

### GitHub OAuth Prerequisites (Phase 2)
- [ ] GitHub OAuth Application created
- [ ] Client ID and Client Secret obtained
- [ ] Callback URL configured correctly
- [ ] Organization access granted (if applicable)
- [ ] Credentials securely stored

### FlowSource Package
- [ ] Official FlowSource package downloaded
- [ ] Package extracted to accessible location
- [ ] Required directory structure verified
- [ ] Full path to package documented

### Phase 3 Additional Prerequisites (Templates & Plugins)
- [ ] `Flowsource-templates/` directory exists in source package
- [ ] `PDLC-template.md` exists in FlowSourceInstaller/FlowsourceSetupDoc/
- [ ] PDLC-Backend template directory contains template.yaml
- [ ] PDLC-Frontend template directory contains template.yaml
- [ ] Phase 2 completed (or will be auto-executed by Phase 3)

### Environment Setup
- [ ] Migration workspace created
- [ ] FlowSource Migration Utility downloaded
- [ ] Dependencies installed (`npm install`)


---

**🎉 You're Ready to Migrate!**

With all prerequisites met, you can confidently run the FlowSource Migration Utility and transform your Backstage application into a powerful FlowSource platform.

For the best experience, start with **Phase 1** to verify basic functionality, then proceed to **Phase 2** for full authentication and database integration, and finally **Phase 3** for complete template integration and development platform capabilities.

---

*FlowSource Migration Utility v1.0.0 - Created by FlowSource Team*
