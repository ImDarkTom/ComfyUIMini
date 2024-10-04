import { handleError } from '../common/errorHandler.js';
import { getLocalWorkflow } from '../modules/getLocalWorkflow.js';
import { WorkflowEditor } from '../modules/sharedWorkflowUtils.js';

const inputsContainer = document.querySelector('.inputs-container');
const titleInput = document.getElementById('title-input');
const descriptionInput = document.getElementById('description-input');

const workflowTextAttrib = document.body.getAttribute('data-workflow-text');
const workflowOriginalTitle = document.body.getAttribute('data-workflow-title');
const workflowType = document.body.getAttribute('data-workflow-type');
const workflowFilename = document.body.getAttribute('data-workflow-filename') || '';

const saveButton = document.getElementById('save');

const workflowEditor = new WorkflowEditor(inputsContainer, {}, titleInput, descriptionInput);

function loadWorkflow() {
    try {
        if (workflowTextAttrib == '') {
            workflowEditor.setWorkflowObject(getLocalWorkflow(workflowOriginalTitle));
        } else {
            workflowEditor.setWorkflowObject(JSON.parse(workflowTextAttrib));
        }

        workflowEditor.renderWorkflow();
    } catch (error) {
        handleError(error);
    }
}

export async function saveWorkflow() {
    const updatedWorkflowObject = workflowEditor.updateJsonWithUserInput();

    if (workflowType === 'local') {
        const workflows = JSON.parse(localStorage.getItem('workflows')) || [];

        const currentWorkflowIndex = workflows.findIndex(
            (workflow) => JSON.parse(workflow)['_comfyuimini_meta'].title === workflowOriginalTitle
        );

        if (currentWorkflowIndex == -1) {
            alert('An error occured when saving this workflow: Workflow not found in saved workflows.');
            return;
        }

        workflows[currentWorkflowIndex] = JSON.stringify(updatedWorkflowObject);

        localStorage.setItem('workflows', JSON.stringify(workflows));

        location.href = '/';
    } else if (workflowType === 'server') {
        const response = await fetch(`/edit/${workflowFilename}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedWorkflowObject),
        });

        if (response.status !== 200) {
            openPopupWindow(`An error occured while saving workflow: ${await response.text()}`);
            return;
        }

        location.href = '/';
    } else {
        alert('An error occured when saving this workflow: Invalid workflow type.');
    }
}

saveButton.addEventListener('click', async () => saveWorkflow());

loadWorkflow();
