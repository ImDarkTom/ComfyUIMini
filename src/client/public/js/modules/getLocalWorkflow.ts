import { WorkflowWithMetadata } from '@shared/types/Workflow';

export class LocalWorkflowNotFoundError extends Error {
    constructor(workflowTitle: string) {
        super(`Could not find any locally saved workflow named '${workflowTitle}'.`);
        this.name = 'LocalWorkflowNotFoundError';
    }
}

export function getAllWorkflows(): WorkflowWithMetadata[] {
    const workflowsList: WorkflowWithMetadata[] = JSON.parse(localStorage.getItem('workflows') || '[]');

    return workflowsList;
}

export function getLocalWorkflow(workflowTitle: string): WorkflowWithMetadata | null {
    const allWorkflows = getAllWorkflows();

    const currentWorkflow = allWorkflows.find((workflow) => {
        return workflow._comfyuimini_meta.title == workflowTitle;
    });

    if (!currentWorkflow) {
        console.error(`Could not find workflow with title '${workflowTitle}' in local storage.`);
        return null;
    }

    return currentWorkflow;
}
