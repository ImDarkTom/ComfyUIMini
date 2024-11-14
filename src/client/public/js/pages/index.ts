import { getAllWorkflows } from "../modules/getLocalWorkflow.js";

declare global {
    interface Window {
        editWorkflow: (type: string, workflowTitle: string) => void;
        deleteWorkflow: (type: string, workflowTitle: string) => void;
        downloadWorkflow: (type: string, workflowTitle: string) => void;
        openActionSheet: (buttonElement: HTMLElement, event: Event) => void;    
    }
}

window.editWorkflow = editWorkflow;
function editWorkflow(type: string, workflowTitle: string) {
    window.location.href = `/edit/${type}/${workflowTitle}`;
}

window.deleteWorkflow = deleteWorkflow;
export async function deleteWorkflow(type: string, workflowTitle: string) {
    if (!confirm(`Are you sure you want to delete ${type} workflow '${workflowTitle}'?`)) {
        return;
    }

    if (type === 'local') {
        deleteLocalWorkflow(workflowTitle);
    } else if (type === 'server') {
        await deleteServerWorkflow(workflowTitle);
    } else {
        alert(`Error when deleting workflow. Invalid workflow type: ${type}`);
        return;
    }

    location.reload();
}

function deleteLocalWorkflow(workflowTitle: string) {
    const workflowsList = getAllWorkflows();

    const selectedWorkflowIndex = workflowsList.findIndex((workflow) => {
        return workflow['_comfyuimini_meta'].title === workflowTitle;
    });

    if (selectedWorkflowIndex === -1) {
        return;
    }

    workflowsList.splice(selectedWorkflowIndex, 1);

    localStorage.setItem('workflows', JSON.stringify(workflowsList));
}

async function deleteServerWorkflow(workflowTitle: string) {
    const response = await fetch(`/edit/${workflowTitle}`, {
        method: 'DELETE'
    });

    if (response.status !== 200) {
        alert(`Error when deleting server workflow: Status code ${response.status}, check logs for more info.`);
        return;
    }
}

window.downloadWorkflow = downloadWorkflow;
async function downloadWorkflow(type: string,workflowTitle: string) {
    if (type === 'local') {
        downloadLocalWorkflow(workflowTitle);
    } else if (type === 'server') {
        await downloadServerWorkflow(workflowTitle);
    } else {
        alert(`Error when downloading workflow. Invalid workflow type: ${type}`);
        return;
    }
}

function sanitizeFilename(filename: string) {
    const sanitized = filename
        .replace(/[/\\?%*:|"<>]/g, '_')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\s+/g, '_');

    return sanitized;
}

async function downloadServerWorkflow(workflowTitle: string) {
    const response = await fetch(`/download/${workflowTitle}`);

    if (response.status !== 200) {
        alert(`Error when downloading server workflow: ${response.status}: ${await response.text()}`);
        return;
    }

    const blob = await response.blob();

    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = workflowTitle;

    link.click();

    URL.revokeObjectURL(link.href);
}

function downloadLocalWorkflow(workflowTitle: string) {
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

window.openActionSheet = openActionSheet;
function openActionSheet(buttonElement: HTMLElement, event: Event) {
    event.preventDefault();

    const cardWrapperElem = buttonElement.closest('.card-wrapper');

    if (!cardWrapperElem) {
        console.error('Could not find card element');
        return;
    }

    const workflowType = cardWrapperElem.getAttribute('data-type');
    if (!workflowType) {
        console.error('Could not find workflow type');
        return;
    }
    
    const workflowFilename = cardWrapperElem.getAttribute('data-filename');
    if (!workflowFilename) {
        console.error('Could not find workflow filename');
        return;
    }

    const bottomSheetOptions: Entry[] = [
        {
            icon: '✏',
            text: 'Edit',
            function: 'editWorkflow',
            functionParams: [workflowType, workflowFilename],
        },
        {
            icon: '💾',
            text: 'Download',
            function: 'downloadWorkflow',
            functionParams: [workflowType, workflowFilename],
        },
        {
            icon: '❌',
            text: 'Delete workflow',
            function: 'deleteWorkflow',
            functionParams: [workflowType, workflowFilename],
        },
    ];

    loadBottomSheet(bottomSheetOptions, event);
}

async function loadLocalWorkflows() {
    const workflowsGridElem = document.querySelector('.workflow-grid') as HTMLElement;

    const workflowsList = getAllWorkflows();

    const workflowInfo = workflowsList.map((workflow) => ({
        title: workflow._comfyuimini_meta.title,
        filename: workflow._comfyuimini_meta.title,
        description: workflow._comfyuimini_meta.description,
        type: 'local', 
        icon: 'phone',
    }));

    const response = await fetch('/render/home/workflow-list', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowInfo),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch workflow list');
    }

    const workflowListHtml = await response.text();

    workflowsGridElem.innerHTML += workflowListHtml;
}

loadLocalWorkflows();
