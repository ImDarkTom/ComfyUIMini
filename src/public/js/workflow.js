const workflowTitle = document.body.getAttribute('data-workflow-title');

const inputsContainer = document.querySelector('.inputs-container');
const outputImagesContainer = document.querySelector('.output-images-container')


function loadWorkflow() {
    let currentWorkflow = "";
    const workflowTextAttrib = document.body.getAttribute('data-workflowtext');

    if (workflowTextAttrib !== "") { // Workflow sent by server aka pc-hosted
        currentWorkflow = JSON.parse(workflowTextAttrib);
    } else {
        currentWorkflow = getCurrentWorkflowJson();

        document.body.setAttribute('data-workflowtext', JSON.stringify(currentWorkflow));

        if (!currentWorkflow) {
            return;
        }
    }

    const workflowInputs = currentWorkflow["_comfyuimini_meta"].input_options;

    renderInputs(workflowInputs);
}

async function renderInputs(workflowInputs) {
    for (const inputJson of workflowInputs) {
        const inputHtml = await renderInput(inputJson);

        inputsContainer.innerHTML += inputHtml;
    }
}

function getCurrentWorkflowJson() {
    const allWorkflows = JSON.parse(localStorage.getItem('workflows')) || [];

    const allWorkflowTitles = allWorkflows.map((item) => JSON.parse(item)["_comfyuimini_meta"].title);

    if (!allWorkflowTitles.includes(workflowTitle)) {
        inputsContainer.textContent = `Workflow with name '${workflowTitle}' not found in localStorage.`;
        return null;
    }

    const currentWorkflow = JSON.parse(allWorkflows.filter((item) => JSON.parse(item)["_comfyuimini_meta"].title == workflowTitle)[0]);

    return currentWorkflow;
}

async function renderInput(inputOptions) {
    if (inputOptions.disabled) {
        return "";
    }

    let html;
    if (inputOptions.type === "select") {
        const listResponse = await fetch(`/proxy/listmodels/${inputOptions.select_list}`);
        const listJson = await listResponse.json();

        html = `
        <div class="workflow-input-container">
            <label for="input-${inputOptions.node_id}-${inputOptions.input_name_in_node}">${inputOptions.title}</label>
            <select id="input-${inputOptions.node_id}-${inputOptions.input_name_in_node}" class="workflow-input">
        `;

        for (const item of listJson) {
            html += `<option value="${item}">${item}</option>`;
        }

        html += "</select>"

        return html;
    }

    let stepAttribute;
    let type;
    switch (inputOptions.type) {
        case "integer":
            stepAttribute = 'step="1"';
            type = "number"
            break;
        case "float":
            stepAttribute = 'step="any"';
            type = "number"
            break;
        case "text":
        default:
            stepAttribute = '';
            type = "text"
            break;
    }

    html = `
    <div class="workflow-input-container">
        <label for="input-${inputOptions.node_id}-${inputOptions.input_name_in_node}">${inputOptions.title}</label>
        <input 
            id="input-${inputOptions.node_id}-${inputOptions.input_name_in_node}" 
            type="${type}" 
            placeholder="${inputOptions.default}" 
            class="workflow-input" 
            value="${inputOptions.default}"
            ${stepAttribute}
            ${inputOptions !== undefined ? `min="${inputOptions.min}"` : ''} 
            ${inputOptions.max !== undefined ? `max="${inputOptions.max}"` : ''}
            ${inputOptions.type == "select" ? `select="${inputOptions.modelSuggestionType}"` : ""}>
    `;

    if (inputOptions.show_randomise_toggle) {
        html += `
        <button class="randomise-input" type="button" onclick="randomiseInput('input-${inputOptions.node_id}-${inputOptions.input_name_in_node}')">🎲</button>
        `;
    }

    html += `</div>`;

    return html;
}

function randomiseInput(inputId) {
    const input = document.getElementById(inputId);

    input.value = (Math.floor(Math.random() * 1e16)).toString().padStart(16, '0');;
}

async function runWorkflow() {
    outputImagesContainer.innerHTML = "Waiting...";

    const workflow = JSON.parse(document.body.getAttribute('data-workflowtext'));

    // ComfyUI can't process the workflow if it contains the additional metadata.
    delete workflow["_comfyuimini_meta"];

    const allInputContainers = document.querySelectorAll('.workflow-input-container');

    for (const inputContainer of allInputContainers) {
        const inputElem = inputContainer.querySelector('.workflow-input');
        
        const [_, nodeId, nodeInputName] = inputElem.id.split('-');
        const inputValue = inputElem.value;

        workflow[nodeId].inputs[nodeInputName] = inputValue;
    }

    const response = await fetch('/proxy/prompt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflow)
    });

    const promptId = (await response.json())["prompt_id"];

    const generatedImagesJson = await generationFinish(promptId);

    outputImagesContainer.innerHTML = "";

    for (const imageJson of generatedImagesJson) {
        const imageHtml = jsonToImageElem(imageJson);

        outputImagesContainer.innerHTML += imageHtml;
    }
}

function jsonToImageElem(imageJson) {
    const imageUrl = generateImageUrl(imageJson.filename, imageJson.subfolder, imageJson.type);

    return `<a href="${imageUrl}" target="_blank"><img src="${imageUrl}" class="output-image"></a>`;
}

function generateImageUrl(filename, subfolder = "", type) {
    return `/proxy/image?filename=${filename}&subfolder=${subfolder}&type=${type}`
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function generationFinish(promptId) {
    // Redo with WS e.g https://github.com/comfyanonymous/ComfyUI/blob/master/script_examples/websockets_api_example_ws_images.py
    while (true) {
        const response = await fetch(`/proxy/history/${promptId}`, {
            method: 'GET'
        });

        const historyJson = (await response.json())[promptId];

        if (!historyJson) {
            await sleep(250);
            continue;
        }

        const completed = historyJson["status"]["completed"];

        if (completed) {
            const outputs = historyJson["outputs"];

            const allImagesJson = Object.values(outputs).flatMap(item => 
                item.images.map(image => image)
            );

            return allImagesJson;
        }
    }
}

loadWorkflow();