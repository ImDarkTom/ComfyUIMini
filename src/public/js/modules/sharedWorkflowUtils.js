// ---------
// Rendering
// ---------

const blankMetadata = {
    "title": "My Workflow",
    "description": ""
}

export let workflowJson = null;

let inputsContainerElem;

export async function renderWorkflow(passedWorkflowJson, inputsContainer, titleInput, descriptionInput) {
    inputsContainerElem = inputsContainer;

    try {
        workflowJson = passedWorkflowJson;
    } catch (err) {
        return alert("Invalid JSON content.");
    }

    const jsonMetadata = workflowJson["_comfyuimini_meta"] || blankMetadata;

    titleInput.removeAttribute('disabled');
    titleInput.value = jsonMetadata.title;

    descriptionInput.removeAttribute('disabled');
    descriptionInput.value = jsonMetadata.description;

    inputsContainerElem.innerHTML = "";
    inputCount = 0;

    renderAllInputs(workflowJson);
}

async function renderAllInputs(workflowJson) {
    function getInputConfig(nodeId, inputName) {
        const cuiMiniMetadata = workflowJson["_comfyuimini_meta"];

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

        return null;
    }

    if (workflowJson.version !== undefined) {
        return null;
    }
    
    for (const [nodeId, node] of Object.entries(workflowJson)) {
        if (nodeId.charAt(0) == "_") {
            continue;
        }

        for (let [key, value] of Object.entries(node.inputs)) {
            if (Array.isArray(value)) {
                // Inputs that come from other nodes come as an array
                continue;
            }

            const inputConfig = getInputConfig(nodeId, key);

            if (inputConfig && !inputConfig.disabled) {
                await renderInput({...inputConfig, inputName: key, nodeId: nodeId});
            } else {
                await renderInput({...inputConfig, title: `${nodeId}_${key}`, default: value, nodeId: nodeId, inputName: key});
            }
        }
    }

    startInputEventListeners();
}


let inputCount = 0;
async function renderInput(inputData) {
    // title, defaultValue, nodeId, inputName, type
    inputCount += 1;

    const isSelected = (type) => inputData.type == type ? "selected" : "";

    const html = `
    <div class="input-item" data-node-id="${inputData.nodeId}" data-node-input-name="${inputData.inputName}">
        <div class="options-container">
            <div class="input-top-container">
                <span class="input-counter">${inputCount}.</span>
                <div class="icon eye hide-input-button" id="hide-button-${inputData.nodeId}-${inputData.inputName}" onclick="hideInput(this)"></div>
                <select class="input-type-select">
                    <option value="" disabled selected>(Choose input type)</option>
                    <option value="text" ${isSelected("text")}>Text</option>
                    <option value="integer" ${isSelected("integer")}>Integer</option>
                    <option value="float" ${isSelected("float")}>Float</option>
                    <option value="select" ${isSelected("select")}>Select</option>
                </select>
            </div>
            <label for="label-${inputData.title}">Title</label>
            <input type="text" placeholder="${inputData.title}" value="${inputData.title}" id="label-${inputData.title}" class="workflow-input workflow-input-title">
            <label for="input-${inputData.title}">Default value</label>
            <input type="text" placeholder="${inputData.default}" value="${inputData.default}" id="input-${inputData.title}" class="workflow-input workflow-input-default">
            <div class="additional-input-options">${await renderAdditionalOptions(inputData.type, inputData)}</div>
        </div>
        <div class="move-arrows-container">
            <span class="move-arrow-up">&#x25B2;</span>
            <span class="move-arrow-down">&#x25BC;</span>
        </div>
    </div>
    `;

    inputsContainerElem.innerHTML += html;

    if (inputData.disabled) {
        hideInput(inputsContainerElem.querySelector(`#hide-button-${inputData.nodeId}-${inputData.inputName}`));
    }
}

async function renderAdditionalOptions(type, data) {
    switch (type) {
        case "text":
            return "";
        case "integer": 
            const showRandomiseChecked = data.show_randomise_toggle === "on" || data.show_randomise_toggle === true ? "checked" : "" || "";

            return `
            <div class="additional-option-wrapper">
                <label for="min-value">Min</label>
                <input type="number" id="min-value" data-key="min" class="additional-input-option" value="${data.min || ""}">
            </div>
            <div class="additional-option-wrapper">
                <label for="max-value">Max</label>
                <input type="number" id="max-value" data-key="max" class="additional-input-option" value="${data.max || ""}">
            </div>
            <div class="additional-option-wrapper">
                <label for="show-random-toggle-value">Show randomise value toggle?</label>
                <input type="checkbox" id="show-random-toggle-value" data-key="show_randomise_toggle" class="additional-input-option" ${showRandomiseChecked}>
            </div>
            `;
        case "float":
            return `
            <div class="additional-option-wrapper">
                <label for="min-value">Min</label>
                <input type="number" id="min-value" data-key="min" class="additional-input-option" value="${data.min || ""}">
            </div>
            <div class="additional-option-wrapper">
                <label for="max-value">Max</label>
                <input type="number" id="max-value" data-key="max" class="additional-input-option" value="${data.max || ""}">
            </div>
            <div class="additional-option-wrapper">
                <label for="step-value">Step</label>
                <input type="number" id="step-value" data-key="step" class="additional-input-option" value="${data.step || ""}">
            </div>
            `;
        case "select":
            const response = await fetch("/comfyui/modeltypes");
            const modelTypesList = await response.json();

            let html = `
            <div class="additional-option-wrapper">
                <label for="model-list-value">Model list</label>
                <select id="model-list-value" data-key="select_list" class="additional-input-option">`;

            const isSelected = (listType) => data.select_list == listType ? "selected" : "";

            for (const type of modelTypesList) {
                html += `<option value="${type}" ${isSelected(type)}>${type}</option>`;
            }

            html += `</select>
            </div>`;

            return html;
        default:
            return "";
    }
}

// -------
// Editing
// -------

function startInputEventListeners() {
    document.querySelectorAll('.input-type-select').forEach(function (inputTypeInput) {
        inputTypeInput.addEventListener('change', async (e) => {
            const changedTo = e.target.value;

            const additionalInputOptionsContainer = e.target.parentNode.parentNode.querySelector('.additional-input-options');

            additionalInputOptionsContainer.innerHTML = await renderAdditionalOptions(changedTo, {});
        })
    });

    inputsContainerElem.addEventListener('click', (e) => {
        const targetHasClass = (className) => e.target.classList.contains(className);

        if (targetHasClass('move-arrow-up')) {
            moveUp(e.target.closest('.input-item'));

        } else if (targetHasClass('move-arrow-down')) {
            moveDown(e.target.closest('.input-item'));

        } else if (targetHasClass('hide-input-button')) {
            hideInput(e.target); 

        }
    });
}

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

function hideInput(hideButtonElement) {
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