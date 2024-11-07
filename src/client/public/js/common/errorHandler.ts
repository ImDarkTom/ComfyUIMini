import { LocalWorkflowNotFoundError } from '../modules/getLocalWorkflow';

export function handleError(error: Error) {
    if (error instanceof LocalWorkflowNotFoundError) {
        alert(error.message);
    }
}
