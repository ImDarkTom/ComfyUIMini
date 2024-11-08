import { getAllWorkflows } from "../modules/getLocalWorkflow.js";

declare global {
    interface Window {
        editWorkflow: (type: string, title: string) => void;
        renameWorkflow: (name: string) => void;
        deleteWorkflow: (name: string) => void;
        downloadWorkflow: (workflowTitle: string) => void;
    }
}

window.editWorkflow = editWorkflow;
function editWorkflow(type: string, title: string) {
    window.location.href = `/edit/${type}/${title}`;
}

window.renameWorkflow = renameWorkflow;
export function renameWorkflow(name: string) {
    const workflowsList = getAllWorkflows();

    const workflowNames = workflowsList.map((workflow) => {
        return workflow['_comfyuimini_meta'].title;
    });

    if (!workflowNames.includes(name)) {
        return;
    }

    const newName = prompt('Rename workflow: ', name);

    if (!newName || newName == null || newName == undefined) {
        return;
    }

    const selectedWorkflow = workflowsList.find((workflow) => workflow['_comfyuimini_meta'].title === name);

    if (!selectedWorkflow) {
        alert('Unable to find workflow with name ' + name);
        return;
    }

    selectedWorkflow['_comfyuimini_meta'].title = newName;

    const updatedWorkflowsList = workflowsList.map((workflow) => {
        return JSON.stringify(workflow);
    });

    localStorage.setItem('workflows', JSON.stringify(updatedWorkflowsList));

    location.reload();
}

window.deleteWorkflow = deleteWorkflow;
export function deleteWorkflow(name: string) {
    const workflowsList = getAllWorkflows();

    const selectedWorkflowIndex = workflowsList.findIndex((workflow) => {
        return workflow['_comfyuimini_meta'].title === name;
    });

    if (selectedWorkflowIndex === -1) {
        return;
    }

    if (confirm(`Are you sure you want to delete '${name}'?`)) {
        workflowsList.splice(selectedWorkflowIndex, 1);

        localStorage.setItem('workflows', JSON.stringify(workflowsList));

        location.reload();
    }
}

function loadLocalWorkflows() {
    const workflowsGridElem = document.querySelector('.workflow-grid') as HTMLElement;

    const workflowsList = getAllWorkflows();

    for (const workflow of workflowsList) {
        const title = workflow['_comfyuimini_meta'].title;

        const bottomSheetOptions = [
            {
                icon: '🏷️',
                text: 'Rename',
                function: `renameWorkflow`,
                functionParams: [title],
            },
            {
                icon: '✏',
                text: 'Edit',
                function: 'editWorkflow',
                functionParams: ['local', title],
            },
            {
                icon: '💾',
                text: 'Download',
                function: 'downloadWorkflow',
                functionParams: [title],
            },
            {
                icon: '❌',
                text: 'Delete workflow',
                function: `deleteWorkflow`,
                functionParams: [title],
            },
        ];

        const gridItemHtml = `
        <a href="/workflow/local/${title}" class="workflow-grid-link">
            <div class="workflow-grid-item">
                <div class="workflow-icon-container">
                    <div class="icon phone workflow-icon"></div>
                </div>
                <div class="workflow-text-info">
                    <span class="workflow-title">${title}</span>
                    <span class="workflow-description">${workflow['_comfyuimini_meta'].description}</span>
                </div>
                <span class="workflow-settings-icon icon settings" onclick='loadBottomSheet(${JSON.stringify(bottomSheetOptions)}, event)'></span>
            </div>
        </a>
        `;

        workflowsGridElem.innerHTML += gridItemHtml;
    }
}

window.downloadWorkflow = downloadWorkflow;
function downloadWorkflow(workflowTitle: string) {
    function sanitizeFilename(filename: string) {
        const sanitized = filename
            .replace(/[/\\?%*:|"<>]/g, '_')
            .replace(/^\s+|\s+$/g, '')
            .replace(/\s+/g, '_');

        return sanitized;
    }

    const workflowsList = getAllWorkflows();

    const workflowNames = workflowsList.map((workflow) => {
        return workflow['_comfyuimini_meta'].title;
    });

    if (!workflowNames.includes(workflowTitle)) {
        return;
    }

    const selectedWorkflow = workflowsList.find((workflow) => workflow['_comfyuimini_meta'].title === workflowTitle);

    if (!selectedWorkflow) {
        alert('Unable to find workflow with name ' + workflowTitle);
        return;
    }

    const workflowString = JSON.stringify(selectedWorkflow, null, 2);

    const blob = new Blob([workflowString], { type: 'application/json' });

    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = `${sanitizeFilename(selectedWorkflow['_comfyuimini_meta'].title)}.json`;

    link.click();

    URL.revokeObjectURL(link.href);
}

loadLocalWorkflows();
