# Authentication Setup Guide

[Back to Readme.md 📁](./Readme.md)

This guide provides step-by-step instructions for setting up authentication in your FlowSource application.

## Index

1. [Backend Setup Instructions](#backend-setup-instructions)
2. [Frontend Setup Instructions](#frontend-setup-instructions)
3. [Configuration Setup Instructions](#configuration-setup-instructions)
4. [Authentication Providers](#authentication-providers)

---

## Backend Setup Instructions

### Step 1: Create Authentication Plugin

- Create the main authentication plugin file in `packages/backend/src/plugins/auth.ts`
- Add the required imports and module configuration

```javascript
import { initDatabase } from "./database/initDatabase.service";
import { createBackendModule,coreServices} from "@backstage/backend-plugin-api";
import { providers, OAuthResult } from "@backstage/plugin-auth-backend";
import { getUpdatedUserRefs, getUserRoles } from "./helper/auth-helper";
import { authProvidersExtensionPoint,createOAuthProviderFactory} from "@backstage/plugin-auth-node";
import {OAuthAuthenticatorResult,PassportProfile,SignInInfo} from "@backstage/plugin-auth-node";
import { Config } from "@backstage/config";
import { PluginDatabaseManager } from "@backstage/backend-common";
import { LoggerService,RootConfigService} from "@backstage/backend-plugin-api";
import {DEFAULT_NAMESPACE,stringifyEntityRef} from "@backstage/catalog-model";
import { Knex } from "knex";
import { decodeJwt } from "jose";
import { RoleMappingDatabaseService } from "./database/roleMappingDatabase.service";
import { EmailToRoleMappingDatabaseService } from "./database/emailToRoleMappingDatabase.service";

export const customAuthProvidersModule = createBackendModule({
  pluginId: "auth",
  moduleId: "custom-auth-providers-module",
  register(reg) {
    reg.registerInit({
      deps: {
        providers: authProvidersExtensionPoint,
        config: coreServices.rootConfig,
        database: coreServices.database,
        logger: coreServices.logger,
      },
      async init({ providers: authProviders, config, database, logger }) {
        await initDatabase({
          logger: logger,
          database: database,
        });
      },
    });
  },
});
```

### Step 2: Setup Authentication Helper

- Create the directory `packages\backend\src\plugins\helper`
- Copy the authentication helper file from `packages-core/backend/src/plugins/helper/auth-helper.ts` to `packages/backend/src/plugins/helper/auth-helper.ts`
- Update the auth-helper functions for user role management

### Step 3: Setup Database Services

- Create the directory `packages\backend\src\plugins\database`
- Copy the all the helper files from `packages-core/backend/src/plugins/database` to `packages-core\backend\src\plugins\database`
- Update the plugin directory with database utility functions

### Step 4: Setup Authentication Helper

- Copy the Permission Policy file from `packages-core\backend\src\plugins\permission.ts` to `packages\backend\src\plugins\permission.ts`

### Step 5: Update Backend Index

- Update the backend index file at `packages/backend/src/index.ts`
- Add import for authentication module to index.ts
- Add import for permission module to index.ts

```javascript
import { customAuthProvidersModule } from "./plugins/auth";
import { customCatalogAdminPermissionPolicyBackendModule } from "./plugins/permission";

// Add to backend
backend.add(customAuthProvidersModule);
backend.add(customCatalogAdminPermissionPolicyBackendModule);
```

### Step 6: Delete "allow-all" function call with dynamic import from index.ts

- Delete the import statement from `packages/backend/src/index.ts`
- Remove the following line completely

```javascript
// DELETE: Remove this line from index.ts
backend.add(import("@backstage/plugin-permission-backend-module-allow-all-policy"));
```

---

## Frontend Setup Instructions

### Step 7: Update App Component

- Update the main App component at `packages/app/src/App.tsx`
- Add authentication imports to App.tsx
- Add authentication providers configuration to App.tsx
- Configure sign-in providers in the main application

```javascript
import { SignInProviderConfig } from "@backstage/core-components";
import {discoveryApiRef,useApi,configApiRef} from "@backstage/core-plugin-api";
import type { IdentityApi } from "@backstage/core-plugin-api";
import { setTokenCookie } from "./cookieAuth";

type AuthProvider = "guest" | SignInProviderConfig;

const authProviders: AuthProvider[] = [
  // Auth providers will be added here
];
```

### Step 8: Update SignInPage functional component

- Update createApp function at `packages/app/src/App.tsx`
- Update the SignInPage component configuration.
- Add token cookie management for authentication to App.tsx
- Configure authentication success handler in App.tsx

```javascript
const app = createApp({
  apis,
  components: {
    SignInPage: (props) => {
      const discoveryApi = useApi(discoveryApiRef);
      const config = useApi(configApiRef);
      return (
        <SignInPage
          {...props}
          providers={authProviders}
          title="Select a sign-in method"
          align="center"
          onSignInSuccess={async (identityApi: IdentityApi) => {
            setTokenCookie(
              await discoveryApi.getBaseUrl("cookie"),
              identityApi
            );
            props.onSignInSuccess(identityApi);
          }}
        />
      );
    },
  },
});
```

### Step 9: Copy Cookie Authentication

- Copy the cookie authentication file from `packages-core/app/src/cookieAuth.ts` to `packages/app/src/cookieAuth.ts`
- Add cookie authentication logic to the application

---

## Configuration Setup Instructions

Generate secure secrets using: `crypto.randomBytes(24).toString('base64')`

### Step 10: Configure Database Connection

- Update the app configuration file `app-config.yaml`
- Configure PostgreSQL database connection
- Replace default SQLite with PostgreSQL settings

```yaml
backend:
  database:
    client: pg
    connection:
      host: ${DB_HOST}
      port: ${DB_PORT}
      user: ${DB_USER}
      password: ${DB_PASSWORD}
```

### Step 11: Update App Configuration

- Update the app configuration file `app-config.yaml`
- Add backend authentication secrets to app-config.yaml
- Configure session management in app-config.yaml

```yaml
backend:
  auth:
    keys:
      - secret: ${BACKEND_SECRET}

auth:
  environment: development
  session:
    secret: ${AUTH_SESSION_SECRET}
  providers:
    # Provider configurations will be added here
```


## Authentication Providers

The following authentication providers are available for setup:

- [GitHub Authentication](GithubAuth.md): Setup OAuth2.0 authentication with GitHub
- [Microsoft Azure Authentication](AzureAuth.md): Configure Azure AD for Single Sign-On
- [AWS Cognito Authentication](CognitoAuth.md): Setup user authentication with AWS Cognito
- [Keycloak Authentication](KeyclockAuth.md): Configure Keycloak identity management
- [OAuth2 Proxy Authentication](Oauth2Proxy.md): Setup OAuth2 Proxy forwarding
- [GCP IAP Authentication](GCP-IAP.md): Configure Google Cloud Identity-Aware Proxy
- [AWS ALB Authentication](AWS_ALB.md): Setup AWS ALB with Azure AD SSO

Choose your preferred authentication provider and follow the specific setup guide.

---

## Validation Steps

After completing the setup:

1. Verify authentication plugin files exist in `packages/backend/src/plugins/`
2. Check that helper files are properly copied and configured
3. Confirm backend index includes authentication modules
4. Validate frontend components include authentication imports
5. Test authentication configuration in `app-config.yaml`
6. Install and verify all required authentication packages

[Back to Index](#index)
