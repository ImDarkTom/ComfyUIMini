import { WorkflowEditor } from '../modules/workflowEditor.js';

/**
 *
 * @param {string} selector The CSS selector of the element to get.
 * @returns {HTMLInputElement|HTMLTextAreaElement} The element found by the selector.
 */
function getElementOrThrow(selector) {
    const element = document.querySelector(selector);

    if (!element) {
        throw new Error(`Element not found: ${selector}`);
    }

    return element;
}

const workflowFileInput = getElementOrThrow('#file-input');
const workflowInputLabel = getElementOrThrow('.file-input-label');

const inputsContainer = getElementOrThrow('.inputs-container');

const titleInput = getElementOrThrow('#title-input');
const descriptionInput = getElementOrThrow('#description-input');

const saveToBrowserButton = getElementOrThrow('#save-to-browser');
const downloadWorkflowButton = getElementOrThrow('#download-workflow');

const workflowEditor = new WorkflowEditor(inputsContainer, {}, titleInput, descriptionInput);

workflowFileInput.addEventListener('change', () => {
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
                "<p>Could not import workflow as it was not saved with API Format, if you do not see the option or do not know how to export with API formatting you can look at the guide <a href='https://imgur.com/a/YsZQu83' target='_blank'>here (external link)</a>.</p>"
            );
            return;
        }

        workflowEditor.setWorkflowObject(importingWorkflowJson);

        workflowEditor.renderWorkflow();
    });
});

function isFileSelected() {
    return workflowFileInput.files.length > 0;
}

saveToBrowserButton.addEventListener('click', () => {
    if (!isFileSelected()) {
        return alert('No file selected.');
    }

    const newJson = workflowEditor.updateJsonWithUserInput();

    if (newJson == '') {
        return;
    }

    const workflows = JSON.parse(localStorage.getItem('workflows')) || [];
    workflows.push(JSON.stringify(newJson));

    localStorage.setItem('workflows', JSON.stringify(workflows));

    location.href = '/';
});

downloadWorkflowButton.addEventListener('click', () => {
    if (!isFileSelected) {
        return alert('No file selected.');
    }

    const newJson = workflowEditor.updateJsonWithUserInput();

    if (newJson == '') {
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
});

export function scrollToSaveButtons() {
    const saveButtons = getElementOrThrow('.export-buttons');

    saveButtons.scrollIntoView({ behavior: 'smooth' });
}
