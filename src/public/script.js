const imgContainer = document.querySelector('#img-container');
const genBtn = document.querySelector('button#gen');
const workflowSelect = document.querySelector('select#workflow');
const workflowContainer = document.querySelector('div#workflow-container');

async function loadWorkflows() {
    const response = await fetch('/workflows');
    const workflows = await response.json();

    for (const workflowName of workflows) {
        const option = document.createElement('option');
        option.textContent = workflowName;
        option.value = workflowName;

        workflowSelect.appendChild(option);
    }
}

function displayImage(imgData) {
    const data = imgData.images[0];
    const url = `/imgProxy?filename=${data.filename}&subfolder=${data.subfolder}&type=${data.type}`;

    const imgElem = document.createElement('img');
    imgElem.src = url;
    imgElem.classList.add('result');

    imgContainer.appendChild(imgElem);
}

async function sendRequest() {
    let url = `/imgReq?workflowName=${workflowSelect.value}`;

    const params = document.querySelectorAll('input.workflow-input');

    for (const param of params) {
        url = url.concat("&", param.placeholder, "=", param.value);
    }

    const response = await fetch(url);
    const data = await response.json();

    imgContainer.innerHTML = "";
    displayImage(data[0]);
}

function loadUiForWorkflow(workflowConfig) {
    workflowContainer.innerHTML = "";

    for (const input of workflowConfig) {
        const element = document.createElement("input");

        switch (input.input_type) {
            case "str":
                element.type = "text";
                break;

            case "int":
                element.type = "number";
                break;
        }

        element.id = input.input_id;
        element.placeholder = input.input_id;

        if (input.default) {
            element.value = input.default;
        }

        element.classList.add('workflow-input');

        const labelElem = document.createElement('label');
        labelElem.setAttribute('for', input.input_id);
        labelElem.textContent = input.input_id;

        workflowContainer.appendChild(labelElem);
        workflowContainer.appendChild(element);
    }
}

genBtn.addEventListener('click', async (e) => {
    genBtn.textContent = "Awaiting completion...";
    await sendRequest();
    genBtn.textContent = "Run";
});

workflowSelect.addEventListener('change', async (event) => {
    genBtn.removeAttribute('disabled');
    const value = event.target.value;

    const response = await fetch(`/workflowConfig/${value}`);
    const workflowConfig = await response.json();

    loadUiForWorkflow(workflowConfig);
});

loadWorkflows();