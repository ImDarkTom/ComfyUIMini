interface PromptNodeErrors {
    [nodeId: string]: {
        errors: PromptError[];
        dependent_outputs: string[];
        class_type: string;
    }
}

interface PromptError {
    type: string;
    message: string;
    details: string;
    extra_info: {
        exception_type: string;
        traceback: string[];
    } | Record<string, never>;
}

interface QueuePromptResponse {
    prompt_id: string;
    number: number;
    error?: PromptError;
    node_errors: PromptNodeErrors | Record<string, never>; // Either a node error or empty object
}