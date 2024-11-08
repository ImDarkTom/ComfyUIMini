import { LocalWorkflowNotFoundError } from '../modules/getLocalWorkflow.js';

export function handleError(error: any) {
    if (error instanceof LocalWorkflowNotFoundError) {
        alert(error.message);
    }
}
