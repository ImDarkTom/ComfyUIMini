export class LocalWorkflowNotFoundError extends Error {
    constructor(workflowTitle) {
        super(`Could not find any locally saved workflow named '${workflowTitle}'.`);
        this.name = 'LocalWorkflowNotFoundError';
    }
}

export function getLocalWorkflow(workflowTitle) {
    const allWorkflows = JSON.parse(localStorage.getItem('workflows')) || [];

    const allWorkflowTitles = allWorkflows.map((item) => {
        return JSON.parse(item)['_comfyuimini_meta'].title;
    });

    if (!allWorkflowTitles.includes(workflowTitle)) {
        throw new LocalWorkflowNotFoundError(workflowTitle);
    }

    const currentWorkflow = JSON.parse(
        allWorkflows.filter((item) => JSON.parse(item)['_comfyuimini_meta'].title == workflowTitle)[0]
    );

    return currentWorkflow;
}
