const workflowTitle = document.body.getAttribute('data-workflow-title');

const inputsContainer = document.querySelector('.inputs-container');
const outputImagesContainer = document.querySelector('.output-images-container')


function loadWorkflow() {
    const currentWorkflow = getCurrentWorkflowJson();

    document.body.setAttribute('data-workflowtext', JSON.stringify(currentWorkflow));

    if (!currentWorkflow) {
        return;
    }

    const workflowInputs = currentWorkflow["_comfyuimini_meta"].input_options;

    renderInputs(workflowInputs);
}

function renderInputs(workflowInputs) {
    for (const inputJson of workflowInputs) {
        const inputHtml = renderInput(inputJson);

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

function renderInput(inputJson) {
    if (inputJson.disabled) {
        return "";
    }

    const html = `
    <div class="workflow-input-container">
        <label for="input-${inputJson.node_id}-${inputJson.input_name_in_node}">${inputJson.title}</label>
        <input type="text" placeholder="${inputJson.default}" id="input-${inputJson.node_id}-${inputJson.input_name_in_node}" class="workflow-input" value="${inputJson.default}">
    </div>
    `;

    return html;
}

async function runWorkflow() {
    outputImagesContainer.innerHTML = "";

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

    for (const imageJson of generatedImagesJson) {
        const imageHtml = jsonToImageElem(imageJson);

        outputImagesContainer.innerHTML += imageHtml;
    }
}

function jsonToImageElem(imageJson) {
    const imageUrl = generateImageUrl(imageJson.filename, imageJson.subfolder, imageJson.type);

    return `<img src="${imageUrl}">`;
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