export interface SavedInputs {
    [workflowType: string]: NodeInputValues[];
}

export interface NodeInputValues {
    [workflowNodeId: string]: {
        [inputName: string]: string;
    };
}
