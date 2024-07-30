import { renderWorkflow, updateJsonWithUserInput } from "./modules/sharedWorkflowUtils.js";

const inputsContainer = document.querySelector('.inputs-container');
const titleInput = document.getElementById('title-input');
const descriptionInput = document.getElementById('description-input');

const workflowTextAttrib = document.body.getAttribute('data-workflow-text');
const workflowTitle = document.body.getAttribute('data-workflow-title');
const workflowType = document.body.getAttribute('data-workflow-type');
const workflowFilename = document.body.getAttribute('data-workflow-filename') || "";

function loadWorkflow() {
    let workflowJson;
    if (workflowTextAttrib == "") {
        workflowJson = getWorkflowFromStorage(workflowTitle);
    } else {
        workflowJson = JSON.parse(workflowTextAttrib);
    }

    renderWorkflow(workflowJson, inputsContainer, titleInput, descriptionInput);
}

function getWorkflowFromStorage(workflowTitle) {
    const allWorkflows = JSON.parse(localStorage.getItem('workflows')) || [];

    const allWorkflowTitles = allWorkflows.map((item) => JSON.parse(item)["_comfyuimini_meta"].title);

    if (!allWorkflowTitles.includes(workflowTitle)) {
        alert(`Workflow with name '${workflowTitle}' not found in localStorage.`);
        return null;
    }

    const currentWorkflow = JSON.parse(allWorkflows.filter((item) => JSON.parse(item)["_comfyuimini_meta"].title == workflowTitle)[0]);

    return currentWorkflow;
}

document.getElementById('save').addEventListener('click', async () => {
    if (workflowType === "local") {
        const newJson = updateJsonWithUserInput();

        if (newJson == "") {
            return;
        }
        
        const workflows = JSON.parse(localStorage.getItem("workflows")) || [];

        const currentWorkflowIndex = workflows.findIndex(workflow => JSON.parse(workflow)["_comfyuimini_meta"].title === workflowTitle);

        if (currentWorkflowIndex == -1) {
            alert("An error occured when saving this workflow: Workflow not found in index.");
            return;
        }

        workflows[currentWorkflowIndex] = JSON.stringify(newJson);

        localStorage.setItem("workflows", JSON.stringify(workflows));

        location.href = "/";
    } else if (workflowType === "server") {
        const newJson = updateJsonWithUserInput();

        if (newJson == "") {
            return;
        }

        const response = await fetch(`/edit/${workflowFilename}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newJson)
        });

        if (response.status !== 200) {
            openPopupWindow(`An error occured while saving workflow: ${await response.text()}`);
            return;
        }

        location.href = "/";
    } else {
        alert("An error occured when saving this workflow: Invalid workflow type.")
    }
});

loadWorkflow();