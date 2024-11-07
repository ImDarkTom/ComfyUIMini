export interface InputOption {
    node_id: string;
    input_name_in_node: string;
    title: string;
    disabled?: boolean;
}

export interface WorkflowMetadata {
    title: string;
    description: string;
    format_version: string;
    input_options: InputOption[];
}

export interface NodeInputs {
    [key: string]: string | number | string[] | number[];
}

export interface WorkflowNode {
    inputs: NodeInputs;
    class_type: string;
    _meta: {
        title: string;
    };
}

export interface Workflow {
    [key: string]: WorkflowNode;
}

export interface WorkflowWithMetadata {
    nodes: Workflow;
    _comfyuimini_meta: WorkflowMetadata;
}

export type WorkflowFileReadError = {
    error: 'notFound' | 'invalidJson' | 'unknown';
};