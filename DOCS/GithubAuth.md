# GitHub Authentication Setup Guide

[Back to Authentication 📁](./Auth.md)

_(**Note:** Please complete the steps mentioned in [Authentication](./Auth.md) file before proceeding)_

## Index
1. [GitHub OAuth Configuration Setup](#github-oauth-configuration-setup)
2. [Backend Implementation Setup](#backend-implementation-setup)
3. [Frontend Configuration Setup](#frontend-configuration-setup)
4. [GitHub Integration Setup](#github-integration-setup)

---

## GitHub OAuth Configuration Setup

Follow the below steps to configure GitHub OAuth2.0 for local environment.

### Step 1: Create GitHub OAuth Application

1. Login to GitHub and navigate to OAuth Apps
2. Click on profile icon → `Settings` → `Developer Settings` → `OAuth Apps` → click on `New OAuth App` button
3. Configure OAuth application with required details
4. Register the OAuth application
5. Generate and copy client credentials

- Create GitHub OAuth App with application name `FlowsourceAuth`
- Configure homepage URL as `http://localhost:3000`
- Configure authorization callback URL as `http://localhost:7007/api/auth/github/handler/frame`
- Copy and save the client ID and client secret

### Step 2: Configure App Settings

- Update app-config.yaml file with GitHub OAuth credentials
- Add GitHub client ID to configuration
- Add GitHub client secret to configuration
- Configure GitHub organization settings

```yaml
auth:
  environment: development
  providers:
    github:
      development:
        clientId: ${GITHUB_CLIENT_ID}
        clientSecret: ${GITHUB_CLIENT_SECRET}
        githubOrganization: ${GITHUB_ORGANIZATION}
```

---

## Backend Implementation Setup

### Step 3: Setup Authentication Dependencies

- Add GitHub authentication imports to auth.ts
- Configure GitHub authenticator module
- Setup GitHub OAuth provider registration

```javascript
import { GithubOAuthResult } from '@backstage/plugin-auth-backend';
import { githubAuthenticator } from '@backstage/plugin-auth-backend-module-github-provider';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from "@octokit/auth-app";
```

### Step 4: Register GitHub Provider

- Register GitHub provider in auth module
- Configure GitHub OAuth factory
- Setup GitHub sign-in resolver

```javascript
authProviders.registerProvider({
  providerId: 'github',
  factory: createOAuthProviderFactory({
    authenticator: githubAuthenticator,
    async signInResolver(info, ctx) {
      return githubResolver(info, ctx, config, database, logger);
    },
  }),
});
```

### Step 5: Implement GitHub Resolver

- Create GitHub resolver function for authentication
- Configure user identity resolution
- Setup token issuance for authenticated users

```javascript
export async function githubResolver(info: SignInInfo<GithubOAuthResult> | SignInInfo<OAuthAuthenticatorResult<PassportProfile>>,
  ctx: AuthResolverContext,
  config: Config | RootConfigService,
  database: PluginDatabaseManager,
  logger: LoggerService) {

  let username: any = info?.result?.fullProfile?.username;

  const usernameEntityRef = stringifyEntityRef({
    kind: 'User',
    name: username,
    namespace: DEFAULT_NAMESPACE,
  });

  logger.info(`Resolved user ${username}`);

  return ctx.issueToken({
    claims: {
      sub: usernameEntityRef // The user's own identity
    },
  });
}
```

---

## Frontend Configuration Setup


### Step 6: Setup GitHub Provider in App

- Add GitHub authentication provider configuration
- Add GitHub provider to authProviders array

```javascript
import { githubAuthApiRef } from '@backstage/core-plugin-api';

const githubAuthProvider: SignInProviderConfig = {
  id: 'github-auth-provider',
  title: 'GitHub',
  message: 'Sign in using GitHub',
  apiRef: githubAuthApiRef,
};


const authProviders: AuthProvider[] = [
  githubAuthProvider,
]
```

### Step 7: Install Required Packages

- Install GitHub authentication packages for frontend
- Install GitHub authentication packages for backend
- Update package.json with GitHub dependencies


Backend packages to install:
- `@backstage/plugin-auth-backend-module-github-provider`
- `@octokit/rest`
- `@octokit/auth-app`

---

## GitHub Integration Setup

### Step 8: Configure Advanced GitHub Integration in auth.ts file

- Update the githubResolver function definition.
- Add the getGithubTeamsOfUser function
- Add the getGithubOctokitClient function
- Add fetchInstallationId function

```javascript
export async function githubResolver(info: SignInInfo<GithubOAuthResult> | SignInInfo<OAuthAuthenticatorResult<PassportProfile>>,
    ctx: AuthResolverContext,
    config: Config | RootConfigService,
    database: PluginDatabaseManager,
    logger: LoggerService) {
    let username: any = info?.result?.fullProfile?.username;
    let teams: any = await getGithubTeamsOfUser(config, username);

    const db: Knex = await database.getClient();
    const roleMappingDatabaseService = new RoleMappingDatabaseService(db);

    const userRefs = await getUpdatedUserRefs(teams, 'github', roleMappingDatabaseService); // Fetch the updated user references
    const usernameEntityRef = stringifyEntityRef({
      kind: 'User',
      name: username,
      namespace: DEFAULT_NAMESPACE,
    });
    logger.info(`Resolved user ${username} with ${userRefs.length} userRefs entities`);

    return ctx.issueToken({
      claims: {
        sub: usernameEntityRef, // The user's own identity
        ent: userRefs
      },
    });
  }

async function getGithubTeamsOfUser(config: Config, username: any) {
  let teams: any = [];
  let octokit: Octokit;
  octokit = await getGithubOctokitClient(config);
  try {
    let environment = config.getString('auth.environment');
    const organization = config.getString('auth.providers.github.' + environment + '.githubOrganization');
    const query = `query($cursor: String, $org: String!, $userLogins: [String!], $username: String!)  {
          user(login: $username) {
              id
          }
          organization(login: $org) {
            teams (first:1, userLogins: $userLogins, after: $cursor) { 
                nodes {
                  name
              }
              pageInfo {
                hasNextPage
                endCursor
              }        
            }
          }
      }`;
    let data: any;
    let cursor = null;
    // We need to check if the user exists, because if it doesn't exist then all teams in the org
    // are returned. If user doesn't exist graphql will throw an exception
    // Paginate
    do {
      data = await octokit.graphql(query, {
        "cursor": cursor,
        "org": organization,
        "userLogins": [username],
        "username": username
      });
      teams = teams.concat(data.organization.teams.nodes.map((val: any) => {
        return val.name;
      }));
      cursor = data.organization.teams.pageInfo.endCursor;
    } while (data.organization.teams.pageInfo.hasNextPage);
  } catch (error) {
    console.log(error);
  }
  return teams;
}

async function getGithubOctokitClient(config: Config): Promise<Octokit> {
  const gitTokenArray: any[] = config.getConfigArray('integrations.github');
  //The first github token from the Integration is taken from the app-config.yaml
  const gitPersonalAccessToken = gitTokenArray[0].data.token;
  const githubAppTokenArray = gitTokenArray[0].data.apps;
  let octokit: Octokit;
  if (gitPersonalAccessToken != null && gitPersonalAccessToken != undefined) {
    //Create a Octokit client using the GitHub Personal Access token
    octokit = new Octokit({
      auth: gitPersonalAccessToken,
    });
  } else if (githubAppTokenArray != null && githubAppTokenArray != undefined) {
    //Create a Octokit client using the GitHub App configuration data
    const installationId = await fetchInstallationId(config);
    octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: getGithubAppConfig(config).appId,
        privateKey: getGithubAppConfig(config).privatekey,
        clientId: getGithubAppConfig(config).clientId,
        clientSecret: getGithubAppConfig(config).clientSecret,
        installationId: installationId,
      },
    });
  } else {
    //GitApp or GitHub Personal Access token configuration is not found
    const exceptionMessage = 'GitApp or GitHub Personal Access token configuration in app-config.yaml is not found';
    throw new Error(exceptionMessage);
  }
  return octokit;
}

let gitHubInstalltionId: number;

async function fetchInstallationId(config: Config) {
  if (gitHubInstalltionId != null && gitHubInstalltionId != undefined) {
    return gitHubInstalltionId;
  } else {
    const appOctokit: any = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: getGithubAppConfig(config).appId,
        privateKey: getGithubAppConfig(config).privatekey,
        clientId: getGithubAppConfig(config).clientId,
        clientSecret: getGithubAppConfig(config).clientSecret,
      },
    });
    const { data: installations } = await appOctokit.apps.listInstallations();
    if (installations.length === 0) {
      throw new Error('No installations found for this app.');
    }
    // Assuming you want the first installation ID
    return installations[0].id;
  }
}

function getGithubAppConfig(config: Config) {
  const gitTokenArray: any[] = config.getOptionalConfigArray('integrations.github') || [];
  const githubTokenIndex: number = 0;
  const appIdIndex: number = 0;
  let githubConfigData = {
    appId: gitTokenArray[githubTokenIndex].data.apps[appIdIndex].appId,
    privatekey: gitTokenArray[githubTokenIndex].data.apps[appIdIndex].privateKey,
    clientId: gitTokenArray[githubTokenIndex].data.apps[appIdIndex].clientId,
    clientSecret: gitTokenArray[githubTokenIndex].data.apps[appIdIndex].clientSecret
  };
  return githubConfigData;
}
```

### Step 9: Configure GitHub Integration Settings

- Update app-config.yaml with GitHub integration settings
- Choose between Personal Access Token (PAT) or GitHub App authentication
- Setup GitHub organization access

#### Option A: Personal Access Token (Recommended for getting started)

```yaml
integrations:
  github:
    - host: github.com
      token: ${GITHUB_PAT_TOKEN}
```

#### Option B: GitHub App Configuration (Advanced - for production environments)

```yaml
integrations:
  github:
    - host: github.com
      apps:
        - appId: ${GITHUB_APP_ID}
          clientId: ${GITHUB_APP_CLIENT_ID}
          clientSecret: ${GITHUB_APP_CLIENT_SECRET}
          privateKey: ${GITHUB_APP_PRIVATE_KEY}
```

**Note:** Choose either Option A (PAT) or Option B (GitHub App), not both. For most users, Option A with a Personal Access Token is sufficient for development and testing.

---

## Validation Steps

After completing the GitHub authentication setup:

1. Verify GitHub OAuth App is properly configured
2. Check that app-config.yaml contains correct GitHub credentials
3. Confirm backend auth.ts includes GitHub provider registration
4. Validate frontend App.tsx includes GitHub authentication provider
5. Test GitHub authentication flow works correctly
6. Verify GitHub integration (PAT or GitHub App) is properly configured
7. Test GitHub repository access and team synchronization (if configured)

[Back to Index](#index)

<!-- The Step 6 from GithubAuth.md file was skipped and I am unable to see import for githubAuthApiRef -->
<!-- auth.ts also has other resolvers, I do not want any other resolver. I want to put resolver and registerProvider only when I setup that Authentication provider -->

<!--
Just provide possible solutions for these cases.
1 - how we can update the updateAppConfigWithGitHub to check for both sections and real values.
2 - How can we fix the applyGitHubYamlConfig to actually write the PAT and replace the ${GITHUB_TOKEN} with user provided value 
2 - What if we skip the applyGitHubYamlConfig, could you guarantee that updateAppConfigWithGitHub can write and merge the values in sections properly.
-->