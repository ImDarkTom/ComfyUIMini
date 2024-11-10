import { NormalisedInputInfo, ProcessedObjectInfo } from '@shared/types/ComfyObjectInfo';
import { AnyWorkflow, InputOption, WorkflowMetadata, WorkflowNode, WorkflowWithMetadata } from '@shared/types/Workflow';

interface InputConfig {
    nodeId: string;
    comfyMetadata: NormalisedInputInfo & { classType: string };
    inputName: string;
    title: string;
    default: string;
    disabled: boolean;
}

export class WorkflowEditor {
    containerElem: HTMLElement;
    workflowObject: AnyWorkflow;
    titleInput: HTMLInputElement;
    descriptionInput: HTMLTextAreaElement;
    inputCount: number;
    comfyInputsInfo: ProcessedObjectInfo | null;

    /**
     *
     * @param {HTMLElement} containerElem The container element in which all of the inputs will be renderered.
     * @param {AnyWorkflow} workflowObject The workflow object to render
     * @param {HTMLInputElement} titleInput The title input element.
     * @param {HTMLTextAreaElement} descriptionInput The description input element.
     */
    constructor(
        containerElem: HTMLElement,
        workflowObject: AnyWorkflow,
        titleInput: HTMLInputElement,
        descriptionInput: HTMLTextAreaElement
    ) {
        this.containerElem = containerElem;
        this.workflowObject = workflowObject;
        this.titleInput = titleInput;
        this.descriptionInput = descriptionInput;
        this.inputCount = 0;
        this.comfyInputsInfo = null;
    }

    /**
     *
     * @param {AnyWorkflow} newWorkflowObject The new workflow object to set.
     */
    setWorkflowObject(newWorkflowObject: AnyWorkflow) {
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

        const jsonMetadata = (this.workflowObject['_comfyuimini_meta'] as WorkflowMetadata) || blankMetadata;

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
     * @param {WorkflowNode} node The node object.
     */
    async renderNodeInputs(nodeId: string, node: WorkflowNode) {
        if (nodeId.charAt(0) == '_') {
            return;
        }

        for (const [inputName, inputValue] of Object.entries(node.inputs)) {
            if (Array.isArray(inputValue)) {
                // Inputs that come from other nodes come as an array
                continue;
            }

            const userInputConfig = this.getUserInputConfig(nodeId, inputName);
            const renderConfig = await this.buildRenderConfig(
                userInputConfig,
                inputValue.toString(),
                nodeId,
                inputName
            );

            if (!renderConfig) {
                continue;
            }

            await this.renderInput(renderConfig);
        }
    }

    /**
     * Gets the `/objectinfo` metadata for a given input id and node id.
     *
     * @param {string} inputType The type of input in the node. e.g. `seed`, `scheduler`, `ckpt_name`.
     * @param {string} nodeId The ID of the node in the workflow.
     * @returns {Promise<NormalisedInputInfo & { classType: string } | null>} The metadata for the input type.
     */
    async getComfyMetadataForInputType(
        inputType: string,
        nodeId: string
    ): Promise<(NormalisedInputInfo & { classType: string }) | null> {
        if (!this.comfyInputsInfo) {
            const comfyObjectMetadata = await fetch('/comfyui/inputsinfo');
            const comfyObjectMetadataJson: ProcessedObjectInfo = await comfyObjectMetadata.json();

            this.comfyInputsInfo = comfyObjectMetadataJson;
        }

        const nodeClassType = this.workflowObject[nodeId].class_type;

        const comfyInputTypeInfo = this.comfyInputsInfo[nodeClassType][inputType];

        if (comfyInputTypeInfo) {
            return { classType: nodeClassType, ...comfyInputTypeInfo };
        } else {
            return null;
        }
    }

    /**
     * Create a config to pass to renderInput, any values in inputConfig will override the other arguments here.
     *
     * @param {InputOption|{}} inputConfig A input's config from the ComfyUIMini metadata object.
     * @param {string} defaultValue The default value of the input.
     * @param {string} nodeId The ID of the node in the workflow.
     * @param {string} inputName The name of the input in the node.
     * @returns {Promise<InputConfig|null>} A config object to pass to renderInput or null if the input doesn't have metadata.
     */
    async buildRenderConfig(
        inputConfig: InputOption | {},
        defaultValue: string,
        nodeId: string,
        inputName: string
    ): Promise<InputConfig | null> {
        const comfyMetadataForInput = await this.getComfyMetadataForInputType(inputName, nodeId);

        if (!comfyMetadataForInput) {
            return null;
        }

        const generatedConfig = {
            nodeId: nodeId,
            inputName: inputName,
            title: inputName,
            comfyMetadata: comfyMetadataForInput,
            default: defaultValue,
            disabled: false,
            ...inputConfig,
        };

        return generatedConfig;
    }

    /**
     * Attempts to get any associated metadata for an input from the ComfyUIMini metadata object.
     *
     * @param {string} nodeId The ID of the node in the workflow.
     * @param {string} inputName The name of the input in the node.
     * @returns {InputOption|{}} Returns an empty object if no metadata is found, otherwise returns said additional metadata.
     */
    getUserInputConfig(nodeId: string, inputName: string): InputOption | {} {
        const cuiMiniMetadata = this.workflowObject['_comfyuimini_meta'] as WorkflowMetadata;

        if (!cuiMiniMetadata) {
            return {};
        }

        const inputOptions = cuiMiniMetadata['input_options'];

        if (!inputOptions) {
            return {};
        }

        for (const option of inputOptions) {
            if (option.node_id == nodeId && option.input_name_in_node == inputName) {
                return option;
            }
        }

        return {};
    }

    /**
     * Renders an input based off an input config.
     *
     * @param {InputConfig} inputConfig The config for the input to render.
     */
    async renderInput(inputConfig: InputConfig) {
        this.inputCount += 1;

        const nodeId = inputConfig.nodeId;
        const inputNameInNode = inputConfig.inputName;
        const inputTitle = inputConfig.title;

        const inputNodeClass = inputConfig.comfyMetadata.classType;

        const idPrefix = `${nodeId}-${inputNameInNode}`;

        const html = `
            <div class="input-item" data-node-id="${nodeId}" data-node-input-name="${inputNameInNode}">
                <div class="options-container">
                    <div class="input-top-container">
                        <span class="input-counter">${this.inputCount}.</span>
                        <div class="icon eye hide-input-button" id="hide-button-${idPrefix}"></div>
                        <span class="input-type-text">[${nodeId}] ${inputNodeClass}: ${inputNameInNode}</span>
                    </div>
                    <label for="${idPrefix}-title">Title</label>
                    <input type="text" id="${idPrefix}-title" placeholder="${inputTitle}" value="${inputTitle}" class="workflow-input workflow-input-title">
                    ${this.renderDefaultValueInput(inputConfig, idPrefix)}
                </div>
                <div class="move-arrows-container">
                    <span class="move-arrow-up">&#x25B2;</span>
                    <span class="move-arrow-down">&#x25BC;</span>
                </div>
            </div>
        `;

        this.containerElem.innerHTML += html;

        if (inputConfig.disabled) {
            const hideButtonElement = this.containerElem.querySelector(`#hide-button-${idPrefix}`) as HTMLElement;

            if (!hideButtonElement) {
                return;
            }

            this.hideInput(hideButtonElement);
        }
    }

    /**
     * Renders a default value input for a input, differs based on input type.
     *
     * @param {InputConfig} inputConfig The config for the input.
     * @param {string} idPrefix The id prefix for each element in the input.
     * @returns {string} The rendered HTML for the default value input.
     */
    renderDefaultValueInput(inputConfig: InputConfig, idPrefix: string) {
        const inputDefault = inputConfig.default || '';

        let inputHTML = `<label for="${idPrefix}-default">Default</label>`;

        switch (inputConfig.comfyMetadata.type) {
            case 'ARRAY':
                const optionsList = inputConfig.comfyMetadata.list;

                inputHTML += `<select id="${idPrefix}-default" class="workflow-input workflow-input-default">`;

                for (const option of optionsList) {
                    inputHTML += `<option value="${option}" ${inputDefault == option ? 'selected' : ''}>${option}</option>`;
                }

                inputHTML += '</select>';

                break;
            case 'INT':
            case 'FLOAT':
                inputHTML += `
                    <input type="number" id="${idPrefix}-default" placeholder="${inputDefault}" value="${inputDefault}" class="workflow-input workflow-input-default">
                `;
                break;
            case `STRING`:
            default:
                inputHTML += `<input type="text" id="${idPrefix}-default" placeholder="${inputDefault}" value="${inputDefault}" class="workflow-input workflow-input-default">`;
                break;
        }

        return inputHTML;
    }

    /**
     * Hides an input after the eye icon is clicked.
     *
     * @param {Element} hideButtonElement The hide button element.
     */
    hideInput(hideButtonElement: HTMLElement) {
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
    updateJsonWithUserInput(): WorkflowWithMetadata {
        const inputOptionsList = [];

        const modifiedWorkflow = this.workflowObject;

        const allInputs = this.containerElem.querySelectorAll('.input-item');
        for (const inputContainer of allInputs) {
            const inputNodeId = inputContainer.getAttribute('data-node-id');
            if (!inputNodeId) {
                continue;
            }

            const inputNameInNode = inputContainer.getAttribute('data-node-input-name');
            if (!inputNameInNode) {
                continue;
            }

            let inputOptions: InputOption = {} as InputOption;
            inputOptions['node_id'] = inputNodeId;
            inputOptions['input_name_in_node'] = inputNameInNode;

            if (inputContainer.classList.contains('disabled')) {
                inputOptions['disabled'] = true;
                inputOptionsList.push(inputOptions);
                continue;
            }

            const inputTitleElement = inputContainer.querySelector('.workflow-input-title') as HTMLInputElement;

            if (!inputTitleElement) {
                alert(`Error while saving workflow, input title element not found for ${inputNameInNode}`);
                continue;
            }

            inputOptions['title'] = inputTitleElement.value;

            const defaultValueElement = inputContainer.querySelector('.workflow-input-default') as HTMLInputElement;

            if (!defaultValueElement) {
                alert(`Error while saving workflow, default value element not found for ${inputNameInNode}`);
                continue;
            }

            modifiedWorkflow[inputNodeId].inputs[inputNameInNode] = defaultValueElement.value;

            inputOptionsList.push(inputOptions);
        }

        modifiedWorkflow['_comfyuimini_meta'] = {} as WorkflowMetadata;
        modifiedWorkflow['_comfyuimini_meta']['title'] = this.titleInput.value || 'Unnamed Workflow';
        modifiedWorkflow['_comfyuimini_meta']['description'] = this.descriptionInput.value || '';
        modifiedWorkflow['_comfyuimini_meta']['format_version'] = '2';

        modifiedWorkflow['_comfyuimini_meta']['input_options'] = inputOptionsList;

        return modifiedWorkflow as WorkflowWithMetadata;
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
function moveUp(item: HTMLElement) {
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
function moveDown(item: HTMLElement) {
    if (!item.parentNode) {
        return;
    }

    const nextItem = item.nextElementSibling;

    if (nextItem) {
        item.parentNode.insertBefore(nextItem, item);
    }
}
