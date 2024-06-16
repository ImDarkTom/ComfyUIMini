function loadLocalWorkflows() {
    const workflowsGridElem = document.querySelector('.workflow-grid');

    const workflowsList = JSON.parse(localStorage.getItem("workflows")) || [];

    for (const workflowText of workflowsList) {
        const workflowJson = JSON.parse(workflowText);
        const title = workflowJson["_comfyuimini_meta"].title;

        const gridItemHtml = `
        <a href="/workflow/local/${title}" class="workflow-grid-link">
            <div class="workflow-grid-item">
                    <div class="workflow-icon-container">
                        <div class="icon phone workflow-icon"></div>
                    </div>
                    <span class="workflow-title">${title}</span>
            </div>
        </a>
        `;

        workflowsGridElem.innerHTML += gridItemHtml;
    }
}

loadLocalWorkflows();