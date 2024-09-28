// ---------
// Rendering
// ---------

const blankMetadata = {
    "title": "My Workflow",
    "description": ""
}

// export let workflowJson = null;

// let inputsContainerElem;

export class InputRenderer {
    constructor(containerElem, workflowObject) {
        this.containerElem = containerElem;
        this.workflowObject = workflowObject;
        this.inputCount = 0;
    }

    /**
     * Renders the workflow inputs.
     * 
     * @param {HTMLElement} titleInput The title input element.
     * @param {HTMLElement} descriptionInput The description input element.
     */
    async renderWorkflow(titleInput, descriptionInput) {
        const jsonMetadata = this.workflowObject["_comfyuimini_meta"] || blankMetadata;
    
        titleInput.removeAttribute('disabled');
        titleInput.value = jsonMetadata.title;

        descriptionInput.removeAttribute('disabled');
        descriptionInput.value = jsonMetadata.description;
    
        this.containerElem.innerHTML = "";
        await this.renderAllInputs();
    }

    async renderAllInputs() {
        if (this.workflowObject.version !== undefined) {
            return null;
        }
        
        for (const [nodeId, node] of Object.entries(this.workflowObject)) {
            if (nodeId.charAt(0) == "_") {
                continue;
            }

            this.renderNodeInputs(nodeId, node);
    
            // for (let [key, value] of Object.entries(node.inputs)) {
            //     if (Array.isArray(value)) {
            //         // Inputs that come from other nodes come as an array
            //         continue;
            //     }
    
            //     const inputConfig = this.getInputOptionConfig(nodeId, key);
    
            //     if (inputConfig && !inputConfig.disabled) {
            //         await this.renderInput({...inputConfig, inputName: key, nodeId: nodeId});
            //     } else {
            //         await this.renderInput({...inputConfig, default: value, nodeId: nodeId, inputName: key});
            //     }
            // }
        }
    
        this.startInputEventListeners();
    }

    renderNodeInputs(nodeId, node) {
        console.log(nodeId, node);

        for (const [key, value] of Object.entries(node.inputs)) {
            if (Array.isArray(value)) {
                // Inputs that come from other nodes come as an array
                continue;
            }

            console.log(key, value);

            const inputConfig = this.getInputOptionConfig(nodeId, )
        }
    }

    getInputOptionConfig(nodeId, inputName) {
        const cuiMiniMetadata = this.workflowObject["_comfyuimini_meta"];

        if (!cuiMiniMetadata) {
            return null;
        }

        const inputOptions = cuiMiniMetadata["input_options"];

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
        const options = ["text", "integer", "float", "select"];

        return options.map(
            type => `<option value="${type}" ${type === selectedInputType ? "selected" : ""}>${type === "select" ? "Select (from model list or builtin)" : type.charAt(0).toUpperCase() + type.slice(1)}</option>`
        ).join('');
    }

    async renderInput(workflowInputConfig) {
        console.log(workflowInputConfig);

        this.inputCount += 1;

        const nodeId = workflowInputConfig.nodeId;
        const inputNameInNode = workflowInputConfig.inputName;
        const inputTitle = workflowInputConfig.title || inputNameInNode;
        const inputType = workflowInputConfig.type || "";
        const inputDefault = workflowInputConfig.default || "";

        const predictedTypes = {
            seed: "integer",
            steps: "integer",
            cfg: "float",
            sampler_name: "select",
            scheduler: "select",
            denoise: "float",
            ckpt_name: "select",
            width: "integer",
            height: "integer",
            batch_size: "integer",
            text: "text",
            filename_prefix: "text",
            vae_name: "select"
        }
    
        if (!workflowInputConfig.type) {
            workflowInputConfig.type = predictedTypes[inputNameInNode] || "";
        }

        const selectedInputType = inputType || predictedTypes[inputNameInNode] || "";

        const idPrefix = `${nodeId}-${inputNameInNode}`;

        const html = `
            <div class="input-item" data-node-id="${nodeId}" data-node-input-name="${inputNameInNode}">
                <div class="options-container">
                    <div class="input-top-container">
                        <span class="input-counter">${this.inputCount}.</span>
                        <div class="icon eye hide-input-button" id="hide-button-${idPrefix}"></div>
                        <select class="input-type-select">
                            <option value="" disabled ${inputType === "" ? "selected" : ""}>(Choose input type)</option>
                            ${this.generateInputOptions(selectedInputType)}
                        </select>
                    </div>
                    <label for="${idPrefix}-title">Title</label>
                    <input type="text" id="${idPrefix}-title" placeholder="${inputTitle}" value="${inputTitle}" class="workflow-input workflow-input-title">
                    <label for="${idPrefix}-default">Default value</label>
                    <input type="text" id="${idPrefix}-default" placeholder="${inputDefault}" value="${inputDefault}" class="workflow-input workflow-input-default">
                    <div class="additional-input-options">${await this.renderAdditionalOptions(workflowInputConfig)}</div>
                </div>
                <div class="move-arrows-container">
                    <span class="move-arrow-up">&#x25B2;</span>
                    <span class="move-arrow-down">&#x25BC;</span>
                </div>
            </div>
        `;

        this.containerElem.innerHTML += html;

        if (workflowInputConfig.disabled) {
            this.hideInput(this.containerElem.querySelector(`#hide-button-${nodeId}-${inputName}`));
        }
    }

    createNumberInput(label, id, key, value = "") {
        return `
        <div class="additional-option-wrapper">
            <label for="${id}">${label}</label>
            <input type="number" id="${id}" data-key="${key}" class="additional-input-option" value="${value}">
        </div>
        `;
    }

    createCheckboxInput(label, id, key, checked = false) {
        return `
        <div class="additional-option-wrapper">
            <label for="${id}">${label}</label>
            <input type="checkbox" id="${id}" data-key="${key}" class="additional-input-option" ${checked ? "checked" : ""}> 
        </div>
        `;
    }

    createSelectInput(label, id, key, options, selected = "") {
        return `
        <div class="additional-option-wrapper">
            <label for="${id}">${label}</label>
            <select id="${id}" data-key="${key}" class="additional-input-option">
                ${options.map(option => `<option value="${option}" ${option === selected ? "selected" : ""}>${option}</option>`).join('')}
            </select>
        </div>

        `;
    }

    async renderAdditionalOptions(workflowInputConfig) {
        switch (workflowInputConfig.type) {
            case "text":
                return "";

            case "integer": 
                return this.createNumberInput("Min", "min-value", "min", workflowInputConfig.min) +
                    this.createNumberInput("Max", "max-value", "max", workflowInputConfig.max) +
                    this.createCheckboxInput("Show randomise toggle?", "show-random-toggle-value", "show_randomise_toggle", workflowInputConfig.show_randomise_toggle);

            case "float":
                return this.createNumberInput("Min", "min-value", "min", workflowInputConfig.min) +
                    this.createNumberInput("Max", "max-value", "max", workflowInputConfig.max) +
                    this.createNumberInput("Step", "step-value", "step", workflowInputConfig.step);

            case "select":
                const response = await fetch("/comfyui/modeltypes");
                const modelTypesList = await response.json();

                return this.createSelectInput("Model list", "model-list-value", "select_list", modelTypesList, workflowInputConfig.select_list);

            default:
                return "";
        }
    }

    hideInput(hideButtonElement) {
        if (hideButtonElement.classList.contains("hide")) {
            hideButtonElement.classList.add("eye");
            hideButtonElement.classList.remove("hide");
    
            const inputOptionsContainer = hideButtonElement.closest('.input-item');
            inputOptionsContainer.classList.remove("disabled");
    
            const subInputsForInput = inputOptionsContainer.querySelectorAll("input, select");
            subInputsForInput.forEach(element => {
                element.removeAttribute("disabled");
            });
        } else {
            hideButtonElement.classList.remove("eye");
            hideButtonElement.classList.add("hide");
    
            const inputOptionsContainer = hideButtonElement.closest('.input-item');
            inputOptionsContainer.classList.add("disabled");
    
            const subInputsForInput = inputOptionsContainer.querySelectorAll("input, select");
            subInputsForInput.forEach(element => {
                element.setAttribute("disabled", true);
            })
        }
    }

    startInputEventListeners() {
        document.querySelectorAll('.input-type-select').forEach(function (inputTypeInput) {
            inputTypeInput.addEventListener('change', async (e) => {
                const changedTo = e.target.value;
    
                const additionalInputOptionsContainer = e.target.parentNode.parentNode.querySelector('.additional-input-options');
    
                additionalInputOptionsContainer.innerHTML = await this.renderAdditionalOptions({type: changedTo});
            })
        });
    
        this.containerElem.addEventListener('click', (e) => {
            const targetHasClass = (className) => e.target.classList.contains(className);
    
            if (targetHasClass('move-arrow-up')) {
                moveUp(e.target.closest('.input-item'));
    
            } else if (targetHasClass('move-arrow-down')) {
                moveDown(e.target.closest('.input-item'));
    
            } else if (targetHasClass('hide-input-button')) {
                this.hideInput(e.target); 
    
            }
        });
    }
}

// -------
// Editing
// -------

function moveUp(item) {
    const previousItem = item.previousElementSibling;

    if (previousItem) {
        item.parentNode.insertBefore(item, previousItem);
    }
}

function moveDown(item) {
    const nextItem = item.nextElementSibling;

    if (nextItem) {
        item.parentNode.insertBefore(nextItem, item);
    }
}

// ---------
// Exporting
// ---------

export function updateJsonWithUserInput() {
    const inputOptionsList = [];

    const allInputs = inputsContainerElem.querySelectorAll('.input-item');

    for (const inputContainer of allInputs) {
        const inputNodeId = inputContainer.getAttribute("data-node-id");
        const inputNameInNode = inputContainer.getAttribute("data-node-input-name");

        let inputOptions = {};
        inputOptions["node_id"] = inputNodeId;
        inputOptions["input_name_in_node"] = inputNameInNode;

        if (inputContainer.classList.contains('disabled')) {
            inputOptions["disabled"] = true;
            inputOptionsList.push(inputOptions);
            continue;
        }

        const inputTitleElement = inputContainer.querySelector('.workflow-input-title');
        const defaultValueElement = inputContainer.querySelector('.workflow-input-default');

        inputOptions["title"] = inputTitleElement.value;
        inputOptions["default"] = defaultValueElement.value;

        const inputTypeSelect = inputContainer.querySelector('.input-type-select');
        const inputType = inputTypeSelect.value;

        if (inputType == "") {
            alert(`Input type for "${inputTitleElement.value}" not selected.`);
            return "";
        }

        if (inputType == "integer" || inputType == "float") {
            if (isNaN(defaultValueElement.value)) {
                alert(`Default value for "${inputTitleElement.value}" is not a number.`);
                return "";
            }
        } 
        
        if (inputType == "integer") {
            if (Number.isInteger(defaultValueElement.value)) {
                alert(`Default value for "${inputTitleElement.value}" is not an integer.`);
                return "";
            }
        }

        inputOptions["type"] = inputType;


        const additionalInputOptions = inputContainer.querySelectorAll(".additional-input-options .additional-input-option");

        for (const additionalInputOption of additionalInputOptions) {

            const additionalInputOptionValue = additionalInputOption.value;
            const additionalInputOptionKey = additionalInputOption.getAttribute('data-key');
            const additionalInputType = additionalInputOption.type;

            if (additionalInputOptionValue === null || additionalInputOptionValue === "") {
                continue;
            }

            if (additionalInputType === "checkbox" && !additionalInputOption.checked) {
                continue;
            }

            if (additionalInputOption.type === "checkbox") {
                // We have already skipped if checkbox value is false, therefore it can only be true
                inputOptions[additionalInputOptionKey] = true;
                continue;
            }

            inputOptions[additionalInputOptionKey] = additionalInputOptionValue;
        }

        inputOptionsList.push(inputOptions);
    };

    workflowJson["_comfyuimini_meta"] = {};
    workflowJson["_comfyuimini_meta"]["title"] = document.getElementById('title-input').value || "Unnamed";
    workflowJson["_comfyuimini_meta"]["description"] = document.getElementById('description-input').value || "";
    workflowJson["_comfyuimini_meta"]["format_version"] = "1";

    workflowJson["_comfyuimini_meta"]["input_options"] = inputOptionsList;

    return workflowJson;
}