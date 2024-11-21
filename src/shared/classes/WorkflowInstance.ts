import { InputOption, WorkflowWithMetadata } from '../types/Workflow';

export class WorkflowInstance {
    workflow: WorkflowWithMetadata;

    constructor(workflow: WorkflowWithMetadata) {
        this.workflow = workflow;
    }
    /**
     * Get a list of all inputs with their options in the user-set order.
     */
    getInputOptionsList(): InputOption[] {
        return this.workflow._comfyuimini_meta.input_options.map((inputOption) => ({
            title: inputOption.title,
            node_id: inputOption.node_id,
            input_name_in_node: inputOption.input_name_in_node,
            disabled: inputOption.disabled ?? false,
        }));
    }
}
