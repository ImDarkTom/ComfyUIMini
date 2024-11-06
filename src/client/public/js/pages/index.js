function editWorkflow(type, title) {
    window.location.href = `/edit/${type}/${title}`;
}

function renameWorkflow(name) {
    const workflowsList = JSON.parse(localStorage.getItem('workflows')) || [];

    const workflowNames = workflowsList.map((workflow) => {
        return JSON.parse(workflow)['_comfyuimini_meta'].title;
    });

    if (!workflowNames.includes(name)) {
        return;
    }

    const newName = prompt('Rename workflow: ', name);

    if (!newName || newName == null || newName == undefined) {
        return;
    }

    const workflowListJson = workflowsList.map((workflow) => {
        return JSON.parse(workflow);
    });

    const selectedWorkflow = workflowListJson.find((workflow) => workflow['_comfyuimini_meta'].title === name);

    selectedWorkflow['_comfyuimini_meta'].title = newName;

    const updatedWorkflowsList = workflowListJson.map((workflow) => {
        return JSON.stringify(workflow);
    });

    localStorage.setItem('workflows', JSON.stringify(updatedWorkflowsList));

    location.reload();
}

function deleteWorkflow(name) {
    const workflowsList = JSON.parse(localStorage.getItem('workflows')) || [];

    const selectedWorkflowIndex = workflowsList.findIndex((workflowText) => {
        const workflow = JSON.parse(workflowText);
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
    const workflowsGridElem = document.querySelector('.workflow-grid');

    const workflowsList = JSON.parse(localStorage.getItem('workflows')) || [];

    for (const workflowText of workflowsList) {
        const workflowJson = JSON.parse(workflowText);

        const title = workflowJson['_comfyuimini_meta'].title;

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
                    <span class="workflow-description">${workflowJson['_comfyuimini_meta'].description}</span>
                </div>
                <span class="workflow-settings-icon icon settings" onclick='loadBottomSheet(${JSON.stringify(bottomSheetOptions)}, event)'></span>
            </div>
        </a>
        `;

        workflowsGridElem.innerHTML += gridItemHtml;
    }
}

function downloadWorkflow(workflowTitle) {
    function sanitizeFilename(filename) {
        const sanitized = filename
            .replace(/[/\\?%*:|"<>]/g, '_')
            .replace(/^\s+|\s+$/g, '')
            .replace(/\s+/g, '_');

        return sanitized;
    }

    const workflowsList = JSON.parse(localStorage.getItem('workflows')) || [];

    const workflowNames = workflowsList.map((workflow) => {
        return JSON.parse(workflow)['_comfyuimini_meta'].title;
    });

    if (!workflowNames.includes(workflowTitle)) {
        return;
    }

    const workflowListJson = workflowsList.map((workflow) => {
        return JSON.parse(workflow);
    });

    const selectedWorkflow = workflowListJson.find((workflow) => workflow['_comfyuimini_meta'].title === workflowTitle);

    const workflowString = JSON.stringify(selectedWorkflow, null, 2);

    const blob = new Blob([workflowString], { type: 'application/json' });

    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = `${sanitizeFilename(selectedWorkflow['_comfyuimini_meta'].title)}.json`;

    link.click();

    URL.revokeObjectURL(link.href);
}

loadLocalWorkflows();
