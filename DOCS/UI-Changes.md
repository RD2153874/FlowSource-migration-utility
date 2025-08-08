# UI Changes

### Public

- Navigate to `packages\app\public` and add the following files
- `catalog-banner.png`
- `cognizant-logo-flowsource.svg`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `favicon.ico`

### Themes

- Navigate to `packages\app\src\components\` and create a folder `theme`.

- Copy `FlowsourceTheme.js` from the unzipped directory and paste it in the `theme` folder.

*`FlowsourceTheme.js` customizes the Material-UI theme for the FlowSource application by defining color palettes and default page themes.*

### Root

- Navigate to `packages\app\src\components\Root\Root.tsx` and add the following code.

    ``` javascript
    import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
    import {CodeCompanionPng} from '../../assets/icons/CodeCompanionIcon';
    import {InfraProvisionPng } from '../../assets/icons/InfraProvisionIcon';
    import DashboardRoundedIcon from '@material-ui/icons/DashboardRounded';
    ```

    ```javascript
    const useSidebarStyles = makeStyles({
    sb1: {
        backgroundColor: '#000048 !important',
        color: 'white !important',
        height: '100vh !important',
        width: '100% !important'
    },
    });
    ```

- Add `useSidebarStyles` inside `Root`.

- Wrap the contents of `<sidebar>` with a `<div className={classes.sb1}>`
<!-- Following changes made: earlier <sidebar>❌ was there, No such html element exists
<Sidebar>✅ is a backstage-core-component which should be used.
🚩 -->
 
    ```javascript
    export const Root = ({ children }: PropsWithChildren<{}>) =>  {
        const classes = useSidebarStyles();
        return(
            <Sidebar>
                <div className={classes.sb1}>

                </div>
            </Sidebar>
        )
    }
    ```

- Add the below code snippet inside `<SidebarGroup label="Menu">`

    ```javascript
    <SidebarItem icon={InfraProvisionPng} to="flowsource-infra-provision" text="Provisioning" />
    <SidebarItem icon={CloudDownloadIcon} to="flowsource-core" text="Downloads" />
    <SidebarItem icon={CodeCompanionPng} to="flowsource-github-copilot" text="Code Companion" />
    <SidebarItem icon={DashboardRoundedIcon} to="flowsource-dashboard" text="Dashboard" /> 
    ```

*`Root.tsx` sets up the main layout of the FlowSource application, including the sidebar with navigation items and settings.*

- Replace `LogoFull.tsx` and `LogoIcon.tsx` with the corresponding unzipped directory files.


### Assets

- Navigate to `packages\app\src\` and create a folder `assets`.

- Now copy the contents of the corresponding folder from the unzipped repository and paste them under the `assets` folder.

### Catalog

 - Navigate to `packages\app\src\components\catalog\` and create a folder `customcatalog`.
 
 - Copy th files `FlowsourceHome.tsx` and `FlowsourceHomeThemeCss.tsx` from the unzipped directory and paste it inside `customcatalog`.

 *It sets up the home page layout for the FlowSource application, including various entity filters and a catalog table to display filtered entities.*

### App.tsx

- Navigate to `packages\app\src\App.tsx`.

- Import the dependencies

  ```javascript
  import { FlowsourceTheme } from './components/theme/FlowsourceTheme';
  import { UnifiedThemeProvider } from '@backstage/theme';
  import { FlowsourceHome } from './components/catalog/customcatalog/FlowsourceHome';
  ```

- Add the below code under `createApp()`.

  ```javascript
  themes: [
      {
        id: 'flowsource-theme',
        title: 'Flowsource Theme',
        variant: 'light',
        Provider: ({ children }) => (
          <UnifiedThemeProvider theme={FlowsourceTheme} children={children} />
        ),
      },
    ],
  ```

- Update the routes

  ```javascript
      <Route path="/catalog" element={<CatalogIndexPage />}>
        <FlowsourceHome />
      </Route>
  ```