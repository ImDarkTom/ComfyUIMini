import { WorkflowInstance } from '@shared/classes/Workflow.js';
import { getAllWorkflows } from '../modules/getLocalWorkflow.js';
import { WorkflowEditor } from '../modules/workflowEditor.js';
import { openPopupWindow, PopupWindowType } from '../common/popupWindow.js';

/**
 *
 * @param {string} selector The CSS selector of the element to get.
 * @returns {HTMLElement} The element found by the selector.
 */
function getElementOrThrow(selector: string): HTMLElement {
    const element = document.querySelector(selector) as HTMLElement;

    if (!element) {
        throw new Error(`Element not found: ${selector}`);
    }

    return element;
}

const workflowFileInput = getElementOrThrow('#file-input') as HTMLInputElement;
const workflowInputLabel = getElementOrThrow('.file-input-label') as HTMLElement;

const inputsContainer = getElementOrThrow('.inputs-container') as HTMLElement;

const titleInput = getElementOrThrow('#title-input') as HTMLInputElement;
const descriptionInput = getElementOrThrow('#description-input') as HTMLTextAreaElement;

const saveToBrowserButton = getElementOrThrow('#save-to-browser') as HTMLButtonElement;
const downloadWorkflowButton = getElementOrThrow('#download-workflow') as HTMLButtonElement;

const workflowEditor = new WorkflowEditor(inputsContainer, null, titleInput, descriptionInput);

workflowFileInput.addEventListener('change', () => {
    if (!workflowFileInput.files) {
        return alert('No files selected.');
    }

    const file = workflowFileInput.files[0];

    if (!file) {
        return alert('No file selected.');
    }

    if (file.type != 'application/json') {
        return alert('Please select a valid JSON file.');
    }

    workflowInputLabel.textContent = `Selected file: ${file.name}`;

    const reader = new FileReader();
    reader.readAsText(file);

    reader.addEventListener('load', () => {
        const resultText = String(reader.result);

        const importingWorkflowJson = JSON.parse(resultText);

        if (importingWorkflowJson.version !== undefined) {
            openPopupWindow(
                "<p>Could not import workflow as it was not saved with API Format, if you do not see the option or do not know how to export with API formatting you can look at the guide <a href='https://imgur.com/a/YsZQu83' target='_blank'>here (external link)</a>.</p>",
                PopupWindowType.WARNING
            );
            return;
        }

        try {
            workflowEditor.workflowObject = new WorkflowInstance(importingWorkflowJson);
        } catch (error) {
            openPopupWindow('Could not import workflow', PopupWindowType.WARNING, error);
            return;
        }

        workflowEditor.renderWorkflow();
    });
});

function isFileSelected() {
    if (!workflowFileInput.files) {
        return false;
    }

    return workflowFileInput.files.length > 0;
}

saveToBrowserButton.addEventListener('click', () => {
    if (!isFileSelected()) {
        return alert('No file selected.');
    }

    const newJson = workflowEditor.updateJsonWithUserInput();

    const workflows = getAllWorkflows();
    workflows.push(newJson);

    localStorage.setItem('workflows', JSON.stringify(workflows));

    location.href = '/';
});

downloadWorkflowButton.addEventListener('click', () => {
    if (!isFileSelected) {
        return alert('No file selected.');
    }

    const newJson = workflowEditor.updateJsonWithUserInput();

    const jsonString = JSON.stringify(newJson, null, 2);

    const blob = new Blob([jsonString], { type: 'application/json' });

    const link = document.createElement('a');
    link.download = 'workflow.json';
    link.href = window.URL.createObjectURL(blob);

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
});

export function scrollToSaveButtons() {
    const saveButtons = getElementOrThrow('.export-buttons');

    saveButtons.scrollIntoView({ behavior: 'smooth' });
}
