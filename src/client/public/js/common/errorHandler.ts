import { LocalWorkflowNotFoundError } from '../modules/getLocalWorkflow.js';

export function handleError(error: Error) {
    if (error instanceof LocalWorkflowNotFoundError) {
        alert(error.message);
    }
}
