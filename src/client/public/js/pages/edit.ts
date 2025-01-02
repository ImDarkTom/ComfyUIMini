import { WorkflowWithMetadata } from '@shared/types/Workflow';
import { getAllWorkflows, getLocalWorkflow } from '../modules/getLocalWorkflow.js';
import { WorkflowEditor } from '../modules/workflowEditor.js';
import { clearSavedInputValuesForWorkflow } from '../modules/savedInputValues.js';
import { WorkflowInstance } from '@shared/classes/Workflow.js';
import { openPopupWindow, PopupWindowType } from '../common/popupWindow.js';

const inputsContainer = document.querySelector('.inputs-container') as HTMLElement;
const titleInput = document.getElementById('title-input') as HTMLInputElement;
const descriptionInput = document.getElementById('description-input') as HTMLTextAreaElement;

const workflowTextAttrib = document.body.getAttribute('data-workflow-text') as string;
const workflowOriginalTitle = document.body.getAttribute('data-workflow-title') as string;
const workflowType = document.body.getAttribute('data-workflow-type') as string;
const workflowFilename = document.body.getAttribute('data-workflow-filename') || '';

const saveButton = document.getElementById('save') as HTMLButtonElement;

const workflowEditor = new WorkflowEditor(inputsContainer, null, titleInput, descriptionInput);

function loadWorkflow() {
    let workflowInstance;

    try {
        if (workflowTextAttrib == '') {
            const workflow = getLocalWorkflow(workflowOriginalTitle);

            if (!workflow) {
                console.error('Workflow not found');
                return;
            }

            workflowInstance = new WorkflowInstance(workflow);
        } else {
            const parsedWorkflowFromAttrib = JSON.parse(workflowTextAttrib);
            workflowInstance = new WorkflowInstance(parsedWorkflowFromAttrib);
        }

        if (!workflowInstance) {
            throw new Error('Could not get workflow to initialize editor');
        }

        workflowEditor.workflowObject = workflowInstance;
        workflowEditor.renderWorkflow();
    } catch (error) {
        openPopupWindow('An error occured while loading workflow', PopupWindowType.ERROR, error);
    }
}

export async function saveWorkflow() {
    const updatedWorkflowObject = workflowEditor.updateJsonWithUserInput();

    clearSavedInputValuesForWorkflow(workflowType, workflowFilename);

    if (workflowType === 'local') {
        const workflows: WorkflowWithMetadata[] = getAllWorkflows();

        const currentWorkflowIndex = workflows.findIndex(
            (workflow) => workflow['_comfyuimini_meta'].title === workflowOriginalTitle
        );

        if (currentWorkflowIndex == -1) {
            alert('An error occured when saving this workflow: Workflow not found in saved workflows.');
            return;
        }

        workflows[currentWorkflowIndex] = updatedWorkflowObject;

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
            openPopupWindow('An error occured while saving workflow', PopupWindowType.ERROR, await response.text());
            return;
        }

        location.href = '/';
    } else {
        alert('An error occured when saving this workflow: Invalid workflow type.');
    }
}

saveButton.addEventListener('click', async () => saveWorkflow());

loadWorkflow();
