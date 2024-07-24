const workflowFileInput = document.getElementById('file-input');
const submitWorkflowFile = document.getElementById('submit-file');

const inputsContainer = document.querySelector('.inputs-container')

const blankMetadata = {
    "title": "My Workflow",
    "description": ""
}

let workflowJson = null;

submitWorkflowFile.addEventListener('click', async () => {
    const titleInput = document.getElementById('title-input');
    const descriptionInput = document.getElementById('description-input');

    const file = workflowFileInput.files[0];

    if (!file) {
        return alert("No file selected.");
    }

    if (file.type != "application/json") {
        return alert("Please select a valid JSON file.");
    }

    const reader = new FileReader();
    reader.readAsText(file);

    reader.addEventListener('load', () => {
        const workflowText = reader.result;
        
        try {
            workflowJson = JSON.parse(workflowText);
        } catch (err) {
            return alert("Invalid JSON content.");
        }

        const jsonMetadata = workflowJson["_comfyuimini_meta"] || blankMetadata;

        titleInput.removeAttribute('disabled');
        titleInput.value = jsonMetadata.title;

        descriptionInput.removeAttribute('disabled');
        descriptionInput.value = jsonMetadata.description;

        renderAllInputs(workflowJson);
    });
});

function renderAllInputs(workflowJson) {
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
                renderInput({title: inputConfig.title, defaultValue: inputConfig.default, nodeId: nodeId, inputName: key, type: inputConfig.type});
            } else {
                renderInput({title: `${nodeId}_${key}`, defaultValue: value, nodeId: nodeId, inputName: key});
            }
        }
    }

    inputTypeEventListener();
}

function inputTypeEventListener() {
    document.querySelectorAll('.input-type-select').forEach(function (inputTypeInput) {
        inputTypeInput.addEventListener('change', async (e) => {
            const changedTo = e.target.value;

            const additionalInputOptionsContainer = e.target.parentNode.parentNode.querySelector('.additional-input-options');

            switch (changedTo) {
                case "text":
                    additionalInputOptionsContainer.innerHTML = "";
                    break;
                case "integer": 
                    additionalInputOptionsContainer.innerHTML = `
                    <div class="additional-option-wrapper">
                        <label for="min-value">Min</label>
                        <input type="number" id="min-value" data-key="min" class="additional-input-option">
                    </div>
                    <div class="additional-option-wrapper">
                        <label for="max-value">Max</label>
                        <input type="number" id="max-value" data-key="max" class="additional-input-option">
                    </div>
                    <div class="additional-option-wrapper">
                        <label for="show-random-toggle-value">Show randomise value toggle?</label>
                        <input type="checkbox" id="show-random-toggle-value" data-key="show_randomise_toggle" class="additional-input-option">
                    </div>
                    `;
                    break;
                case "float":
                    additionalInputOptionsContainer.innerHTML = `
                    <div class="additional-option-wrapper">
                        <label for="min-value">Min</label>
                        <input type="number" id="min-value" data-key="min" class="additional-input-option">
                    </div>
                    <div class="additional-option-wrapper">
                        <label for="max-value">Max</label>
                        <input type="number" id="max-value" data-key="max" class="additional-input-option">
                    </div>
                    <div class="additional-option-wrapper">
                        <label for="step-value">Step</label>
                        <input type="number" id="step-value" data-key="step" class="additional-input-option">
                    </div>
                    `;
                    break;
                case "select":
                    const response = await fetch("/comfyui/modeltypes");
                    const modelTypesList = await response.json();

                    let html = `
                    <div class="additional-option-wrapper">
                        <label for="model-list-value">Model list</label>
                        <select id="model-list-value" data-key="select_list" class="additional-input-option">`;

                    for (const type of modelTypesList) {
                        html += `<option value="${type}">${type}</option>`;
                    }

                    html += `</select>
                    </div>`;

                    additionalInputOptionsContainer.innerHTML = html;
                    break;
                default:
                    additionalInputOptionsContainer.innerHTML = "";
                    break;
            }
        })
    })
}

let inputCount = 0;
function renderInput(inputData) {
    // title, defaultValue, nodeId, inputName, type
    inputCount += 1;

    const html = `
    <div class="input-item" data-node-id="${inputData.nodeId}" data-node-input-name="${inputData.inputName}">
        <div class="options-container">
            <div class="input-top-container">
                <span class="input-counter">${inputCount}.</span>
                <div class="icon eye hide-input-button" onclick="hideInput(this)"></div>
                <select class="input-type-select">
                    <option value="" disabled selected>(Choose input type)</option>
                    <option value="text">Text</option>
                    <option value="integer">Integer</option>
                    <option value="float">Float</option>
                    <option value="select">Select</option>
                </select>
            </div>
            <label for="label-${inputData.title}">Title</label>
            <input type="text" placeholder="${inputData.title}" value="${inputData.title}" id="label-${inputData.title}" class="workflow-input workflow-input-title">
            <label for="input-${inputData.title}">Default value</label>
            <input type="text" placeholder="${inputData.defaultValue}" value="${inputData.defaultValue}" id="input-${inputData.title}" class="workflow-input workflow-input-default">
            <div class="additional-input-options"></div>
        </div>
        <div class="move-arrows-container">
            <span onclick="moveUp(this)" class="move-arrow-up">&#x25B2;</span>
            <span onclick="moveDown(this)" class="move-arrow-down">&#x25BC;</span>
        </div>
    </div>
    `;

    inputsContainer.innerHTML += html;
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

function updateJsonWithUserInput() {
    const inputOptionsList = [];

    const allInputs = inputsContainer.querySelectorAll('.input-item');

    for (const inputContainer of allInputs) {
        const inputNodeId = inputContainer.getAttribute("data-node-id");
        const inputNameInNode = inputContainer.getAttribute("data-node-input-name");

        const inputTitleElement = inputContainer.querySelector('.workflow-input-title');
        const defaultValueElement = inputContainer.querySelector('.workflow-input-default');

        let inputOptions = {};
        inputOptions["node_id"] = inputNodeId;
        inputOptions["input_name_in_node"] = inputNameInNode;

        if (inputContainer.classList.contains('disabled')) {
            inputOptions["disabled"] = true;
            inputOptionsList.push(inputOptions);
            continue;
        }

        inputOptions["title"] = inputTitleElement.value;
        inputOptions["default"] = defaultValueElement.value;

        const inputTypeSelect = inputContainer.querySelector('.input-type-select');

        if (inputTypeSelect.value == "") {
            alert(`Input type for "${inputTitleElement.value}" not selected.`);
            return "";
        }

        if (inputTypeSelect.value == "integer" || inputTypeSelect.value == "float") {
            if (isNaN(defaultValueElement.value)) {
                alert(`Default value for "${inputTitleElement.value}" is not a number.`);
                return "";
            }
        } 
        
        if (inputTypeSelect.value == "integer") {
            if (Number.isInteger(defaultValueElement.value)) {
                alert(`Default value for "${inputTitleElement.value}" is not an integer.`);
                return "";
            }
        }

        inputOptions["type"] = inputTypeSelect.value;

        const additionalInputOptions = inputContainer.querySelectorAll(".additional-input-options .additional-option-wrapper");

        for (const inputOptionContainer of additionalInputOptions) {
            const inputOptionElem = inputOptionContainer.querySelector('.additional-input-option');

            if (inputOptionElem.value === null || 
                inputOptionElem.value === "" || 
                !inputOptionElem.checked) {
                continue;
            }

            if (inputOptionElem.type === "checkbox") {
                // We have already skipped if checkbox value is false, therefore it can only be true
                inputOptions[inputOptionElem.getAttribute('data-key')] = true;
                continue;
            }

            inputOptions[inputOptionElem.getAttribute('data-key')] = inputOptionElem.value;
        }

        inputOptionsList.push(inputOptions);
    };

    workflowJson["_comfyuimini_meta"] = {};
    workflowJson["_comfyuimini_meta"]["title"] = document.getElementById('title-input').value || "Unnamed";
    workflowJson["_comfyuimini_meta"]["description"] = document.getElementById('description-input').value || "";

    workflowJson["_comfyuimini_meta"]["input_options"] = inputOptionsList;

    return workflowJson;
}

function saveToLocalStorage() {
    if (!workflowJson) {
        return alert("No file selected.")
    }

    const newJson = updateJsonWithUserInput();

    if (newJson == "") {
        return;
    }
    
    const workflows = JSON.parse(localStorage.getItem("workflows")) || [];
    workflows.push(JSON.stringify(newJson))

    localStorage.setItem("workflows", JSON.stringify(workflows));

    location.href = "/";
}

function downloadModifiedJson() {
    if (!workflowJson) {
        return alert("No file selected.")
    }
    
    const newJson = updateJsonWithUserInput();

    if (newJson == "") {
        return;
    }

    const jsonString = JSON.stringify(newJson, null, 2);

    const blob = new Blob([jsonString], { type: 'application/json' });

    const link = document.createElement('a');
    link.download = 'workflow.json';
    link.href = window.URL.createObjectURL(blob);

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
}

function moveUp(element) {
    let item = element.closest('.input-item');
    let previousItem = item.previousElementSibling;
    if (previousItem) {
        item.parentNode.insertBefore(item, previousItem);
    }
}

function moveDown(element) {
    let item = element.closest('.input-item');
    let nextItem = item.nextElementSibling;
    if (nextItem) {
        item.parentNode.insertBefore(nextItem, item);
    }
}