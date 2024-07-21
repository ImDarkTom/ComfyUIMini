function editWorkflow() {
    alert("WIP");
}

function renameWorkflow(name) {
    const workflowsList = JSON.parse(localStorage.getItem("workflows")) || [];

    const workflowNames = workflowsList.map((workflow) => {
        return JSON.parse(workflow)["_comfyuimini_meta"].title;
    });

    if (!workflowNames.includes(name)) {
        return;
    }

    
    const newName = prompt("Rename workflow: ", name);

    if (!newName || newName == null || newName == undefined) {
        return;
    }

    const workflowListJson = workflowsList.map((workflow) => {
        return JSON.parse(workflow);
    });

    const selectedWorkflow = workflowListJson.find(workflow => workflow["_comfyuimini_meta"].title === name);

    selectedWorkflow["_comfyuimini_meta"].title = newName;

    const updatedWorkflowsList = workflowListJson.map((workflow) => {
        return JSON.stringify(workflow);
    });

    localStorage.setItem('workflows', JSON.stringify(updatedWorkflowsList));

    location.reload();
}

function deleteWorkflow(name) {
    const workflowsList = JSON.parse(localStorage.getItem("workflows")) || [];

    const selectedWorkflowIndex = workflowsList.findIndex(workflowText => {
        const workflow = JSON.parse(workflowText);
        return workflow["_comfyuimini_meta"].title === name;
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

    const workflowsList = JSON.parse(localStorage.getItem("workflows")) || [];

    for (const workflowText of workflowsList) {
        const workflowJson = JSON.parse(workflowText);

        const title = workflowJson["_comfyuimini_meta"].title;

        const bottomSheetOptions = [
            {
                icon: "🏷️",
                text: "Rename",
                function: `renameWorkflow`,
                functionParams: title
            },
            {
                icon: "✏",
                text: "Edit workflow (Not implemented)",
                function: "editWorkflow",
                functionParams: ""
            },
            {
                icon: "❌",
                text: "Delete workflow",
                function: `deleteWorkflow`,
                functionParams: title
            }
        ];

        const gridItemHtml = `
        <a href="/workflow/local/${title}" class="workflow-grid-link">
            <div class="workflow-grid-item">
                    <div class="workflow-item-icons">
                        <div class="workflow-icon-container">
                            <div class="icon phone workflow-icon"></div>
                        </div>
                        <span class="workflow-menu-icon" onclick='loadBottomSheet(${JSON.stringify(bottomSheetOptions)}, event)'>☰</span>
                    </div>
                    <span class="workflow-title">${title}</span>
            </div>
        </a>
        `;

        workflowsGridElem.innerHTML += gridItemHtml;
    }
}

loadLocalWorkflows();