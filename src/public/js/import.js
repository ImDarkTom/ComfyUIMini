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

        inputsContainer.innerHTML = `<h2 class="category-title">Inputs</h2>`;

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
                // Inputs from other nodes come in an array
                continue;
            }

            const inputConfig = getInputConfig(nodeId, key);

            if (inputConfig) {
                renderInput(inputConfig.title, inputConfig.default, nodeId, key);
            } else {
                renderInput(`${nodeId}_${key}`, value, nodeId, key);
            }
        }
    }
}

function renderInput(defaultLabel, defaultValue, nodeId, inputName) {
    const html = `
    <div class="input-item" data-node-id="${nodeId}" data-node-input-name="${inputName}">
        <div class="input-title-container">
            <div class="icon hide hide-input-button" onclick="hideInput(this)"></div>
            <input type="text" placeholder="${defaultLabel}" value="${defaultLabel}" id="label-${defaultLabel}" class="workflow-input workflow-input-title">
        </div>
        <label for="input-${defaultLabel}">Default value</label>
        <input type="text" placeholder="${defaultValue}" value="${defaultValue}" id="input-${defaultLabel}" class="workflow-input workflow-input-default">
    </div>
    `;

    inputsContainer.innerHTML += html;
}

function hideInput(hideButtonElement) {
    if (hideButtonElement.classList.contains("disabled")) {
        hideButtonElement.classList.remove("disabled");

        const inputOptionsContainer = hideButtonElement.parentNode.parentNode;
        inputOptionsContainer.classList.remove("disabled");

        const subInputsForInput = inputOptionsContainer.querySelectorAll("input");
        subInputsForInput.forEach(element => {
            element.removeAttribute("disabled");
        });
    } else {
        hideButtonElement.classList.add("disabled");

        const inputOptionsContainer = hideButtonElement.parentNode.parentNode;
        inputOptionsContainer.classList.add("disabled");

        const subInputsForInput = inputOptionsContainer.querySelectorAll("input");
        subInputsForInput.forEach(element => {
            element.setAttribute("disabled", true);
        })
    }
}

function downloadModifiedJson() {
    if (!workflowJson) {
        return alert("No file selected.")
    }
    
    const newJson = updateJsonWithUserInput();

    const jsonString = JSON.stringify(newJson, null, 2);

    const blob = new Blob([jsonString], { type: 'application/json' });

    const link = document.createElement('a');
    link.download = 'workflow.json';
    link.href = window.URL.createObjectURL(blob);

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
}

function updateJsonWithUserInput() {
    const inputOptionsList = [];

    const allInputs = inputsContainer.querySelectorAll('.input-item');

    allInputs.forEach(inputContainer => {
        const inputNodeId = inputContainer.getAttribute("data-node-id");
        const inputNameInNode = inputContainer.getAttribute("data-node-input-name");

        let inputOptions = {};

        if (inputContainer.classList.contains('disabled')) {
            inputOptions["disabled"] = true;
        }

        const inputTitleElement = inputContainer.querySelector('.workflow-input-title');
        const defaultValueElement = inputContainer.querySelector('.workflow-input-default');

        inputOptions["node_id"] = inputNodeId;
        inputOptions["input_name_in_node"] = inputNameInNode;
        inputOptions["title"] = inputTitleElement.value;
        inputOptions["default"] = defaultValueElement.value;

        inputOptionsList.push(inputOptions);
    });

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

    const workflows = JSON.parse(localStorage.getItem("workflows")) || [];
    workflows.push(JSON.stringify(newJson))

    localStorage.setItem("workflows", JSON.stringify(workflows));

    location.href = "/";
}