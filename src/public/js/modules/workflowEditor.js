//@ts-check

export class WorkflowEditor {
    /**
     *
     * @param {HTMLElement} containerElem The container element in which all of the inputs will be renderered.
     * @param {object} workflowObject The workflow object to render
     * @param {HTMLInputElement} titleInput The title input element.
     * @param {HTMLTextAreaElement} descriptionInput The description input element.
     */
    constructor(containerElem, workflowObject, titleInput, descriptionInput) {
        this.containerElem = containerElem;
        this.workflowObject = workflowObject;
        this.titleInput = titleInput;
        this.descriptionInput = descriptionInput;
        this.inputCount = 0;
    }

    /**
     *
     * @param {object} newWorkflowObject The new workflow object to set.
     */
    setWorkflowObject(newWorkflowObject) {
        this.workflowObject = newWorkflowObject;
    }

    /**
     * Renders the workflow inputs.
     */
    async renderWorkflow() {
        this.inputCount = 0;

        const blankMetadata = {
            title: 'My Workflow',
            description: '',
        };

        const jsonMetadata = this.workflowObject['_comfyuimini_meta'] || blankMetadata;

        this.titleInput.removeAttribute('disabled');
        this.titleInput.value = jsonMetadata.title || 'My Workflow';

        this.descriptionInput.removeAttribute('disabled');
        this.descriptionInput.value = jsonMetadata.description || '';

        this.containerElem.innerHTML = '';
        await this.renderAllInputs();
    }

    /**
     * Loops through every node and renders each input.
     */
    async renderAllInputs() {
        if (this.workflowObject.version !== undefined) {
            return null;
        }

        for (const [nodeId, node] of Object.entries(this.workflowObject)) {
            await this.renderNodeInputs(nodeId, node);
        }

        this.startInputEventListeners();
    }

    /**
     * Loop through each input in a node and render it.
     *
     * @param {string} nodeId The ID of the node in the workflow.
     * @param {object} node The node object.
     */
    async renderNodeInputs(nodeId, node) {
        if (nodeId.charAt(0) == '_') {
            return;
        }

        for (const [inputName, inputValue] of Object.entries(node.inputs)) {
            if (Array.isArray(inputValue)) {
                // Inputs that come from other nodes come as an array
                continue;
            }

            const inputConfig = this.getInputOptionConfig(nodeId, inputName);
            const renderConfig = this.buildRenderConfig(inputConfig, inputValue, nodeId, inputName);

            await this.renderInput(renderConfig);
        }
    }

    /**
     * Create a config to pass to renderInput, any values in inputConfig will override the other arguments here.
     *
     * @param {object} inputConfig A input's config from the ComfyUIMini metadata object.
     * @param {string} defaultValue The default value of the input.
     * @param {string} nodeId The ID of the node in the workflow.
     * @param {string} inputName The name of the input in the node.
     * @returns {InputConfig} A config object to pass to renderInput.
     */
    buildRenderConfig(inputConfig, defaultValue, nodeId, inputName) {
        const predictedTypes = {
            seed: 'integer',
            steps: 'integer',
            cfg: 'float',
            sampler_name: 'select',
            scheduler: 'select',
            denoise: 'float',
            ckpt_name: 'select',
            width: 'integer',
            height: 'integer',
            batch_size: 'integer',
            text: 'text',
            filename_prefix: 'text',
            vae_name: 'select',
        };

        const generatedConfig = {
            nodeId: nodeId,
            inputName: inputName,
            title: inputName,
            type: null,
            default: defaultValue,
            disabled: false,
            ...inputConfig,
        };

        if (!generatedConfig.type) {
            generatedConfig.type = predictedTypes[inputName] || '';
        }

        return generatedConfig;
    }

    /**
     * Attempts to get any associated metadata for an input from the ComfyUIMini metadata object.
     *
     * @param {string} nodeId The ID of the node in the workflow.
     * @param {string} inputName The name of the input in the node.
     * @returns {object} Returns an empty object if no metadata is found, otherwise returns said additional metadata.
     */
    getInputOptionConfig(nodeId, inputName) {
        const cuiMiniMetadata = this.workflowObject['_comfyuimini_meta'];

        if (!cuiMiniMetadata) {
            return null;
        }

        const inputOptions = cuiMiniMetadata['input_options'];

        if (!inputOptions) {
            return null;
        }

        for (const option of inputOptions) {
            if (option.node_id == nodeId && option.input_name_in_node == inputName) {
                return option;
            }
        }
    }

    generateInputOptions(selectedInputType) {
        const options = ['text', 'integer', 'float', 'select'];

        return options
            .map(
                (type) =>
                    `<option value="${type}" ${type === selectedInputType ? 'selected' : ''}>${type === 'select' ? 'Select (from model list or builtin)' : type.charAt(0).toUpperCase() + type.slice(1)}</option>`
            )
            .join('');
    }

    /**
     * @typedef {object} InputConfig
     * The minimum config required to render an input.
     *
     * @property {string} nodeId The ID of the node in the workflow.
     * @property {string} inputName The name of the input in the node.
     * @property {string} title The title of the input.
     * @property {string} type The type of the input.
     * @property {string} default The default value of the input.
     * @property {boolean} disabled Whether the input is disabled.
     */

    /**
     * @typedef {object} ExpandedInputConfig
     * Any additional properties that may come with an input config.
     *
     * @property {string} nodeId The ID of the node in the workflow.
     * @property {string} inputName The name of the input in the node.
     * @property {string} title The title of the input.
     * @property {string} type The type of the input.
     * @property {string} default The default value of the input.
     * @property {boolean} disabled Whether the input is disabled.
     *
     * @property {boolean} show_randomise_toggle Whether to show the randomise toggle for the input.
     * @property {string} select_list The name of the list to get select options from.
     * @property {number} min The minimum value for the input.
     * @property {number} max The maximum value for the input.
     * @property {number} step The step value for the input.
     */

    /**
     * Renders an input based off an input config.
     *
     * @param {InputConfig} inputConfig The config for the input to render.
     */
    async renderInput(inputConfig) {
        this.inputCount += 1;

        const nodeId = inputConfig.nodeId;
        const inputNameInNode = inputConfig.inputName;
        const inputTitle = inputConfig.title;
        const inputType = inputConfig.type || '';
        const inputDefault = inputConfig.default || '';

        const idPrefix = `${nodeId}-${inputNameInNode}`;

        const html = `
            <div class="input-item" data-node-id="${nodeId}" data-node-input-name="${inputNameInNode}">
                <div class="options-container">
                    <div class="input-top-container">
                        <span class="input-counter">${this.inputCount}.</span>
                        <div class="icon eye hide-input-button" id="hide-button-${idPrefix}"></div>
                        <select class="input-type-select">
                            <option value="" disabled ${inputType === '' ? 'selected' : ''}>(Choose input type)</option>
                            ${this.generateInputOptions(inputType)}
                        </select>
                    </div>
                    <label for="${idPrefix}-title">Title</label>
                    <input type="text" id="${idPrefix}-title" placeholder="${inputTitle}" value="${inputTitle}" class="workflow-input workflow-input-title">
                    <label for="${idPrefix}-default">Default value</label>
                    <input type="text" id="${idPrefix}-default" placeholder="${inputDefault}" value="${inputDefault}" class="workflow-input workflow-input-default">
                    <div class="additional-input-options">${
            //@ts-ignore
            await this.renderAdditionalOptions(inputConfig)
            }</div>
                </div>
                <div class="move-arrows-container">
                    <span class="move-arrow-up">&#x25B2;</span>
                    <span class="move-arrow-down">&#x25BC;</span>
                </div>
            </div>
        `;

        this.containerElem.innerHTML += html;

        if (inputConfig.disabled) {
            const hideButtonElement = this.containerElem.querySelector(`#hide-button-${idPrefix}`);

            if (!hideButtonElement) {
                return;
            }

            this.hideInput(hideButtonElement);
        }
    }

    /**
     * Renders a number input in the additional input options.
     *
     * @param {string} label The label for the additional input option.
     * @param {string} id The ID of the additional input option.
     * @param {string} key The key to save the additional input option as when the workflow is being exported. e.g. `min, max, step`
     * @param {number|null} defaultValue The default value for the additional input option.
     * @returns {string} The HTML for the number input.
     */
    createNumberInput(label, id, key, defaultValue = null) {
        return `
        <div class="additional-option-wrapper">
            <label for="${id}">${label}</label>
            <input type="number" id="${id}" data-key="${key}" class="additional-input-option" value="${defaultValue}">
        </div>
        `;
    }

    /**
     * Renders a checkbox input in the additional input options.
     *
     * @param {string} label The label for the additional input option.
     * @param {string} id The ID of the additional input option.
     * @param {string} key The key to save the additional input option as when the workflow is being exported. e.g. `show_randomise_toggle`
     * @param {boolean} checked If the checkbox should be checked or not when rendered.
     * @returns {string} The HTML for the checkbox input.
     */
    createCheckboxInput(label, id, key, checked = false) {
        return `
        <div class="additional-option-wrapper">
            <label for="${id}">${label}</label>
            <input type="checkbox" id="${id}" data-key="${key}" class="additional-input-option" ${checked ? 'checked' : ''}> 
        </div>
        `;
    }

    /**
     * Renders a select input in the additional input options.
     *
     * @param {string} label The label for the additional input option.
     * @param {string} id The ID of the additional input option.
     * @param {string} key The key to save the additional input option as when the workflow is being exported. e.g. `select_list`
     * @param {string[]} options The list of options to select from.
     * @param {string} selected The default selected option.
     * @returns {string} The HTML for the select input.
     */
    createSelectInput(label, id, key, options, selected = '') {
        return `
        <div class="additional-option-wrapper">
            <label for="${id}">${label}</label>
            <select id="${id}" data-key="${key}" class="additional-input-option">
                ${options.map((option) => `<option value="${option}" ${option === selected ? 'selected' : ''}>${option}</option>`).join('')}
            </select>
        </div>

        `;
    }

    /**
     *
     * @param {ExpandedInputConfig|object} workflowInputConfig
     * @returns
     */
    async renderAdditionalOptions(workflowInputConfig) {
        switch (workflowInputConfig.type) {
            case 'text':
                return '';

            case 'integer':
                return (
                    this.createNumberInput('Min', 'min-value', 'min', workflowInputConfig.min) +
                    this.createNumberInput('Max', 'max-value', 'max', workflowInputConfig.max) +
                    this.createCheckboxInput(
                        'Show randomise toggle?',
                        'show-random-toggle-value',
                        'show_randomise_toggle',
                        workflowInputConfig.show_randomise_toggle
                    )
                );

            case 'float':
                return (
                    this.createNumberInput('Min', 'min-value', 'min', workflowInputConfig.min) +
                    this.createNumberInput('Max', 'max-value', 'max', workflowInputConfig.max) +
                    this.createNumberInput('Step', 'step-value', 'step', workflowInputConfig.step)
                );

            case 'select':
                const response = await fetch('/comfyui/selectoptions');
                const selectTypesList = await response.json();

                const compiledSelectOptions = Object.values(selectTypesList).flat();

                return this.createSelectInput(
                    'Model list',
                    'model-list-value',
                    'select_list',
                    compiledSelectOptions,
                    workflowInputConfig.select_list
                );

            default:
                return '';
        }
    }

    /**
     * Hides an input after the eye icon is clicked.
     *
     * @param {Element} hideButtonElement The hide button element.
     */
    hideInput(hideButtonElement) {
        if (hideButtonElement.classList.contains('hide')) {
            hideButtonElement.classList.add('eye');
            hideButtonElement.classList.remove('hide');

            const inputOptionsContainer = hideButtonElement.closest('.input-item');

            if (!inputOptionsContainer) {
                return;
            }

            inputOptionsContainer.classList.remove('disabled');

            const subInputsForInput = inputOptionsContainer.querySelectorAll('input, select');
            subInputsForInput.forEach((element) => {
                element.removeAttribute('disabled');
            });
        } else {
            hideButtonElement.classList.remove('eye');
            hideButtonElement.classList.add('hide');

            const inputOptionsContainer = hideButtonElement.closest('.input-item');

            if (!inputOptionsContainer) {
                return;
            }

            inputOptionsContainer.classList.add('disabled');

            const subInputsForInput = inputOptionsContainer.querySelectorAll('input, select');
            subInputsForInput.forEach((element) => {
                element.setAttribute('disabled', 'disabled');
            });
        }
    }

    startInputEventListeners() {
        document.querySelectorAll('.input-type-select').forEach((selectInput) => {
            selectInput.addEventListener('change', async (e) => {
                // @ts-ignore
                const changedTo = e.target.value;

                // @ts-ignore
                const additionalInputOptionsContainer = e.target
                    // @ts-ignore
                    .closest('.options-container')
                    .querySelector('.additional-input-options');

                additionalInputOptionsContainer.innerHTML = await this.renderAdditionalOptions({ type: changedTo });
            });
        });

        this.containerElem.addEventListener('click', (e) => {
            // @ts-ignore
            const targetHasClass = (/** @type {string} */ className) => e.target.classList.contains(className);

            if (targetHasClass('move-arrow-up')) {
                // @ts-ignore
                moveUp(e.target.closest('.input-item'));
            } else if (targetHasClass('move-arrow-down')) {
                // @ts-ignore
                moveDown(e.target.closest('.input-item'));
            } else if (targetHasClass('hide-input-button')) {
                // @ts-ignore
                this.hideInput(e.target);
            }
        });
    }

    /**
     * Updates a workflow object with data from the inputs.
     *
     * @returns {object} The exported workflow object.
     */
    updateJsonWithUserInput() {
        const inputOptionsList = [];

        const allInputs = this.containerElem.querySelectorAll('.input-item');

        for (const inputContainer of allInputs) {
            const inputNodeId = inputContainer.getAttribute('data-node-id');
            const inputNameInNode = inputContainer.getAttribute('data-node-input-name');

            let inputOptions = {};
            inputOptions['node_id'] = inputNodeId;
            inputOptions['input_name_in_node'] = inputNameInNode;

            if (inputContainer.classList.contains('disabled')) {
                inputOptions['disabled'] = true;
                inputOptionsList.push(inputOptions);
                continue;
            }

            const inputTitleElement = /** @type {HTMLInputElement} */ (
                inputContainer.querySelector('.workflow-input-title')
            );

            if (!inputTitleElement) {
                alert(`Error while saving workflow, input title element not found for ${inputNameInNode}`);
                return '';
            }

            const defaultValueElement = /** @type {HTMLInputElement} */ (
                inputContainer.querySelector('.workflow-input-default')
            );

            if (!defaultValueElement) {
                alert(`Error while saving workflow, default value element not found for ${inputNameInNode}`);
                return '';
            }

            inputOptions['title'] = inputTitleElement.value;
            inputOptions['default'] = defaultValueElement.value;

            const inputTypeSelect = /** @type {HTMLSelectElement} */ (
                inputContainer.querySelector('.input-type-select')
            );

            if (!inputTypeSelect) {
                alert(`Error while saving workflow, input type select not found for ${inputNameInNode}`);
                return '';
            }

            const inputType = inputTypeSelect.value;

            if (inputType == '') {
                alert(`Input type for "${inputTitleElement.value}" not selected.`);
                return '';
            }

            if (inputType == 'integer' || inputType == 'float') {
                if (isNaN(Number(defaultValueElement.value))) {
                    alert(`Default value for "${inputTitleElement.value}" is not a number.`);
                    return '';
                }
            }

            if (inputType == 'integer') {
                if (Number.isInteger(defaultValueElement.value)) {
                    alert(`Default value for "${inputTitleElement.value}" is not an integer.`);
                    return '';
                }
            }

            inputOptions['type'] = inputType;

            /** @type {NodeListOf<HTMLInputElement|HTMLInputElement>} */
            const additionalInputOptions = inputContainer.querySelectorAll(
                '.additional-input-options .additional-input-option'
            );

            for (const additionalInputOption of additionalInputOptions) {
                const additionalInputOptionValue = additionalInputOption.value;
                const additionalInputOptionKey = additionalInputOption.getAttribute('data-key');
                const additionalInputType = additionalInputOption.type;

                if (additionalInputOptionValue === null || additionalInputOptionValue === '') {
                    continue;
                }

                if (additionalInputType === 'checkbox' && !additionalInputOption.checked) {
                    continue;
                }

                if (additionalInputOption.type === 'checkbox') {
                    // We have already skipped if checkbox value is false, therefore it can only be true
                    inputOptions[additionalInputOptionKey] = true;
                    continue;
                }

                inputOptions[additionalInputOptionKey] = additionalInputOptionValue;
            }

            inputOptionsList.push(inputOptions);
        }

        const modifiedWorkflow = this.workflowObject;

        modifiedWorkflow['_comfyuimini_meta'] = {};
        modifiedWorkflow['_comfyuimini_meta']['title'] = this.titleInput.value || 'Unnamed Workflow';
        modifiedWorkflow['_comfyuimini_meta']['description'] = this.descriptionInput.value || '';
        modifiedWorkflow['_comfyuimini_meta']['format_version'] = '1';

        modifiedWorkflow['_comfyuimini_meta']['input_options'] = inputOptionsList;

        return modifiedWorkflow;
    }
}

// -------
// Editing
// -------

/**
 * Move an input up.
 *
 * @param {HTMLElement} item The input container.
 */
function moveUp(item) {
    if (!item.parentNode) {
        return;
    }

    const previousItem = item.previousElementSibling;

    if (previousItem) {
        item.parentNode.insertBefore(item, previousItem);
    }
}

/**
 * Move an input down.
 *
 * @param {HTMLElement} item The input container.
 */
function moveDown(item) {
    if (!item.parentNode) {
        return;
    }

    const nextItem = item.nextElementSibling;

    if (nextItem) {
        item.parentNode.insertBefore(nextItem, item);
    }
}
