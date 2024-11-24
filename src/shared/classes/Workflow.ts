import { NodeInputValues } from '@shared/types/SavedInputs';
import {
    AnyWorkflow,
    InputOption,
    Workflow,
    WorkflowMetadata,
    WorkflowNode,
    WorkflowWithMetadata,
} from '@shared/types/Workflow';

export class WorkflowInstance {
    workflow!: WorkflowWithMetadata;

    constructor(workflow: AnyWorkflow) {
        WorkflowInstance.validateWorkflowObject(workflow);
        this.setWorkflowObject(workflow);
    }

    get metadata(): WorkflowMetadata {
        return this.workflow._comfyuimini_meta;
    }

    fillWorkflowWithUserInputs(inputValues: NodeInputValues): Workflow {
        // TODO: Implement into main workflow page
        const filledWorkflow = this.workflow;

        for (const [nodeId, nodeInputs] of Object.entries(inputValues)) {
            if (!filledWorkflow[nodeId]) {
                console.warn(`Node ${nodeId} not found in workflow`);
                continue;
            }

            for (const [inputName, inputValue] of Object.entries(nodeInputs)) {
                if (!filledWorkflow[nodeId].inputs[inputName]) {
                    console.warn(`Input ${inputName} not found in node ${nodeId}`);
                    continue;
                }

                filledWorkflow[nodeId].inputs[inputName] = inputValue;
            }
        }

        return filledWorkflow;
    }

    getNode(nodeId: string): WorkflowNode {
        return this.workflow[nodeId];
    }

    getInputOptionsList(): InputOption[] {
        return this.workflow._comfyuimini_meta.input_options.map((inputOption) => ({
            title: inputOption.title,
            node_id: inputOption.node_id,
            input_name_in_node: inputOption.input_name_in_node,
            disabled: inputOption.disabled ?? false,
        }));
    }

    /** --------------
     * PRIVATE METHODS
    --------------- */
    private setWorkflowObject(workflow: AnyWorkflow): void {
        if (this.workflowHasMetadata(workflow)) {
            this.workflow = workflow;
        } else {
            this.workflow = WorkflowInstance.generateMetadataForWorkflow(workflow);
        }
    }

    private workflowHasMetadata(workflow: AnyWorkflow): workflow is WorkflowWithMetadata {
        return (workflow as WorkflowWithMetadata)._comfyuimini_meta !== undefined;
    }

    static validateWorkflowObject(workflow: AnyWorkflow, returnErrorMessage: boolean = false): string | void {
        try {
            if (!workflow || typeof workflow !== 'object') {
                throw new Error('Invalid workflow: must be a non-null object');
            }

            if (Object.keys(workflow).length === 0) {
                throw new Error('Invalid workflow: must not be empty (no keys in object)');
            }

            if ('version' in workflow) {
                throw new Error('Invalid workflow: workflow not exported in API format (version string in workflow)');
            }

            for (const [nodeId, node] of Object.entries(workflow)) {
                if (nodeId.startsWith('_')) {
                    continue;
                }

                if (typeof node !== 'object') {
                    throw new Error(`Invalid workflow: node '${nodeId}' is not an object`);
                }

                if (Object.keys(node).length === 0) {
                    throw new Error(`Invalid workflow: node '${nodeId}' is empty`);
                }

                if (node.class_type === undefined) {
                    throw new Error(`Invalid workflow: node '${nodeId}' does not have a class_type`);
                }

                if (node.inputs === undefined) {
                    throw new Error(`Invalid workflow: node '${nodeId}' does not have inputs`);
                }
            }

            // TODO: Add stricter validation
        } catch (error) {
            if (returnErrorMessage) {
                return (error as Error).message;
            } else {
                throw error;
            }
        }
    }

    static generateMetadataForWorkflow(workflow: Workflow, filename?: string): WorkflowWithMetadata {
        const metadata: WorkflowMetadata = {
            title: filename ?? 'Unnamed Workflow',
            description: '',
            format_version: '2',
            input_options: [],
        };

        for (const [nodeId, node] of Object.entries(workflow)) {
            if (nodeId.startsWith('_')) {
                continue;
            }

            for (const [inputName, inputValue] of Object.entries(node.inputs)) {
                if (Array.isArray(inputValue)) {
                    // Inputs that come from other nodes come as an array
                    continue;
                }

                metadata.input_options.push({
                    node_id: nodeId,
                    input_name_in_node: inputName,
                    title: `[${nodeId}] ${inputName}`,
                    disabled: false,
                });
            }
        }

        return {
            ...workflow,
            _comfyuimini_meta: metadata,
        } as WorkflowWithMetadata;
    }
}
