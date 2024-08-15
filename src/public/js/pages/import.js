import { renderWorkflow, updateJsonWithUserInput, workflowJson } from "../modules/sharedWorkflowUtils.js";

const workflowFileInput = document.getElementById('file-input');
const workflowInputLabel = document.querySelector('.file-input-label');

const inputsContainer = document.querySelector('.inputs-container')

workflowFileInput.addEventListener('change', () => {
    const titleInput = document.getElementById('title-input');
    const descriptionInput = document.getElementById('description-input');

    const file = workflowFileInput.files[0];

    if (!file) {
        return alert("No file selected.");
    }

    if (file.type != "application/json") {
        return alert("Please select a valid JSON file.");
    }

    workflowInputLabel.textContent = `Selected file: ${file.name}`;

    const reader = new FileReader();
    reader.readAsText(file);

    reader.addEventListener('load', () => {
        const workflowText = reader.result;

        const importingWorkflowJson = JSON.parse(workflowText);

        if (importingWorkflowJson.version !== undefined) {
            openPopupWindow("<p>Could not import workflow as it was not saved with API Format, if you do not see the option or do not know how to export with API formatting you can look at the guide <a href='https://imgur.com/a/YsZQu83' target='_blank'>here (external link)</a>.</p>");
            return;
        }
        
        renderWorkflow(importingWorkflowJson, inputsContainer, titleInput, descriptionInput);
    });
});

document.getElementById('save-to-browser').addEventListener('click', () => {
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
});

document.getElementById('download-workflow').addEventListener('click', () => {
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
});