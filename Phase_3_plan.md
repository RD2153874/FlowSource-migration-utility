As of now we only have till Phase 2 in utility
I want to implement Phase 3 in the FlowSource migration Utility.
- I want the Phase 3 to be handled in similar way we handled Phase 2
- The code files should be separated based on what we are handling
- Util files will be added, updated, refactored based on the requirements.

Before running Phase 3:

- The interactive mode should give option to choose Phase 3
- If the user chooses Phase 3, it should check if Phase 2 has executed or not
    -  if no, should exeucte the Phase 2 first. When all the Phase 2 steps done, it should start the actual Phase 3
    - If yes, should immediately start Phase 3.

During Phase 3:
    - The users should be given options to choose what they want to implement: Plugins OR Templates OR Both
    - When user chooses ONE the other option should be disabled
    - When user chooses BOTH the user should be prompted to ask which one first

    If user choose Templates:
    - The user should be asked which template they want to integrate
    - They should be able to choose from a list of templates [PDLC-templates] for now.
    - Then it should follow the corresponding markdown files for implementation of that template.

    If user choose Plugins:
    - Let them know it is coming soon
    - The user should be asked which plugin they want to integrate
    - They should be able to choose from a list of plugins.
    - Then it should follow the corresponding markdown files for implementation of that plugin.

    If user choose Both:
    - Get the order they want to implement.
    - Follow the above steps to implement Templates & Plugins.


Template Integration:
- Great, the infra setup for Phase 3 worked fine.

Now let's jump into the Template Integration.
Since we have the PDLC templates getting selected by the user. The utility should refer to the "Flowsource_Package_1_0_0\FlowSourceInstaller\FlowsourceSetupDoc\PDLC-template.md" file.

It has all the instructions required to integrate the PDLC templates for both the backend & frontend

flowsource-migration-utility/
├── src/
│   ├── core/
│   │   ├── FlowSourceAgent.js        # Add executePhase3()
│   │   ├── TemplateManager.js        # NEW - Template integration
│   │   ├── PluginManager.js          # NEW - Plugin integration  
│   │   ├── Phase3Orchestrator.js     # NEW - Phase 3 coordination
│   │   ├── AuthConfigure.js          # Existing
│   │   ├── GitHubAuth.js             # Existing
│   │   └── ...
│   ├── ui/
│   │   └── InteractiveMode.js        # Update with Phase 3 prompts
│   ├── utils/
│   │   ├── TemplateValidator.js      # NEW - Template validation
│   │   ├── PluginValidator.js        # NEW - Plugin validation
│   │   ├── YamlTemplateProcessor.js  # NEW - Template YAML processing
│   │   └── ConfigValidator.js        # Update for Phase 3
│   └── tests/
│       ├── phase3.test.js            # NEW - Phase 3 tests
│       └── ...
