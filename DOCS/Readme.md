# FlowSource-Core Setup Guide

Follow the steps below to set up the FlowSource-Core application:

## Index
1. [Pre-requisites](#pre-requisites)
2. [Setting up the Flowsource-Core application](#setting-up-the-flowsource-core-application)
    - [Generating Flowsource core - backstage's skeleton](#generating-flowsource-core---backstages-skeleton)
    - [Revert specific git changes](#revert-specific-git-changes)
    - [Authentication](#authentication)
    - [Database](#database)
    - [UI changes](#ui-changes)
    - [Permission](#permission)
    - [Install the dependencies](#install-the-dependencies)
    - [Run Flowsource](#run-flowsource)
    - [Enable catalog-admin role to access flowsource](#enable-catalog-admin-role-to-access-flowsource)
    

## Pre-requisites

- Ensure that the necessary software is installed on your machine. The versions of npm and yarn are dependent on the installed node version. The versions listed below have been tested and confirmed to work.

    Software | Tested on Versions  
    -------- |  ----------  
    node     | ~20.18.3, 22.14.0
    npm      | ~10.1.0, 10.9.2
    yarn     | 4.7.0
    Postgres | 15, 17.2
    Python   | 2.7.16, 3.9, 3.13.0

- Unzip the code and store it in a separate location. This unzipped code repository will serve as a reference for setting up our new application. 

## Setting up the Flowsource-Core application

### Generating Flowsource core - backstage's skeleton

- Run the below command (to generate backstage core v1.36)

    ```shell
    npx @backstage/create-app@0.5.25 --path ./ --skip-install
    ```

- When prompted with `Enter a name for the app [required]`, enter the name `flowsource`.

### Revert specific git changes


- Add the below code in `.gitignore` file _(located at the root of the project)_.

    ```bash
    ### IntelliJ IDEA 
    .idea
    *.iws
    *.iml
    *.ipr

    # backstage-core files and folders
    /examples
    /.prettierignore
    /README.md
    /tsconfig.json
    /playwright.config.ts
    /lerna.json
    /.eslintignore
    /.eslintrc.js
    /backstage.json
    /catalog-info.yaml
    ```

 
- Replace the current contents of the below files with the contents from the unzipped directory.
    - `.dockerignore`
    - `app-config.yaml`
    - `yarn.lock`
    - `package.json` [Replace it with Root "package.json"]
    - `yarnrc.yml`
    - `Dockerfile`
    - `gitignore`
    - `.yarn` [folder]

- Delete `app-config.production.yaml` file.

### Authentication

- The instructions for setting up authentication in the application is provided [`here`](Auth.md).

### Database

- Navigate to `packages\backend\src\plugins` and  create a folder `database`.

- Now copy the below files from the unzipped directory and paste them in the `database` folder. <br>_(**Note:** The files can be found inside `packages-core\backend\src\plugins\database`.)_

    - `initDatabase.service.ts`
    - `constants.ts`
    - `emailToUserRoleMappingColumns.ts`
    - `roleMappingColumns.ts`
    - `roleMappingDatabase.service.ts`
    - `emailToUserRoleMappingColumns.ts`

*These files are used to manage role mappings and email-to-role mappings in the FlowSource-Core application. They include scripts for initializing the database, defining table schemas, and providing services to interact with the role mappings.*

### UI changes
- The steps to customise the UI of the application is provided [`here`](UI-Changes.md).

### Permission
   
- Navigate to `packages\backend\src\plugins\` and create `permission.ts` file.

- Now copy the contents from the corresponding file in the unzipped directory and paste them into `permission.ts`. <br>_(**Note:** The file is available under `packages-core\backend\src\plugins\permission.ts`.)_

*The file defines a custom permission policy for the FlowSource-Core application,  specifically for managing catalog entities. The policy checks if a user has the `catalog-admin` role and grants permissions for reading, creating, and deleting catalog entities based on the user's role.*

### Install the dependencies

```shell
yarn install
```

### Run Flowsource

```shell
yarn dev
```

### Enable catalog-admin role to access flowsource

- Open `pgAdmin` and connect to your PostgreSQL server.

- Navigate to `backstage_plugin_auth` database and select `Query Tool`.

- Execute the below sql command: 

    ```sql
    INSERT INTO public.role_mappings(flowsource_role, auth_provider, auth_provider_role) VALUES ('catalog-admin', 'github', '<team name>');
    ```

    **Note:** The `github user` must belong to the team  provided in the `auth_provider_role` column in the insert statement.
