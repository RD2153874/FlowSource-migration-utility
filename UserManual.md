# 📖 FlowSource Migration Utility - User Manual

**Version 1.0.0** | Complete setup guide for successfully migrating from Backstage to FlowSource

---

## 🎯 Quick Overview

The FlowSource Migration Utility transforms standard Backstage applications into fully-featured FlowSource platform with enhanced authentication, database integration, and enterprise-grade features. This manual provides step-by-step instructions to ensure a successful migration.

## 📋 Table of Contents

1. [System Prerequisites](#-system-prerequisites)
2. [Database Prerequisites](#-database-prerequisites)
3. [GitHub OAuth Prerequisites](#-github-oauth-prerequisites)
4. [FlowSource Package Prerequisites](#-flowsource-package-prerequisites)
5. [Environment Setup](#-environment-setup)
6. [Installation Guide](#-installation-guide)
7. [Migration Process](#-migration-process)
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
│       └── UI-Changes.md               # UI customization
├── configuration/                       # Base configuration files
│   ├── app-config.yaml
│   ├── package.json
│   ├── Dockerfile
│   └── ...
├── packages-core/                       # Core FlowSource code
│   ├── app/                            # Frontend application
│   └── backend/                        # Backend services
└── ...
```

### Package Verification

Before starting migration, verify your source package:

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
  --phase <phase>           Migration phase: 1|2|3 (default: "1")
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

### Configuration Files

Your generated application includes:

| File | Purpose | Location |
|------|---------|----------|
| `app-config.yaml` | Main configuration | Project root |
| `app-config.local.yaml` | Local development overrides | Project root |
| `packages/backend/src/plugins/auth.ts` | Authentication setup | Backend |
| `packages/app/src/App.tsx` | Frontend app configuration | Frontend |

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

### Environment Setup
- [ ] Migration workspace created
- [ ] FlowSource Migration Utility downloaded
- [ ] Dependencies installed (`npm install`)


---

**🎉 You're Ready to Migrate!**

With all prerequisites met, you can confidently run the FlowSource Migration Utility and transform your Backstage application into a powerful FlowSource platform.

For the best experience, start with **Phase 1** to verify basic functionality, then proceed to **Phase 2** for full authentication and database integration.

---

*FlowSource Migration Utility v1.0.0 - Created by FlowSource Team*
