import { LocalWorkflowNotFoundError } from "../modules/getLocalWorkflow.js";

export function handleError(error) {
    if (error instanceof LocalWorkflowNotFoundError) {
        alert(error.message);
    }
}