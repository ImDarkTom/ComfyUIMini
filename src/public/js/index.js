function loadLocalWorkflows() {
    const workflowsGridElem = document.querySelector('.workflow-grid');

    const workflowsList = JSON.parse(localStorage.getItem("workflows")) || [];

    for (const workflowText of workflowsList) {
        const workflowJson = JSON.parse(workflowText);
        const title = workflowJson["_comfyuimini_meta"].title;

        const gridItemHtml = `
        <div class="workflow-grid-item">
                <div class="workflow-icon-container">
                    <div class="icon workflow"></div>
                </div>
                <a class="workflow-title" href="/workflow/local/${title}">${title}</a>
        </div>
        `;

        workflowsGridElem.innerHTML += gridItemHtml;
    }
}

loadLocalWorkflows();