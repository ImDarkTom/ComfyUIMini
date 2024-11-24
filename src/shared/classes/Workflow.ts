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

    /**
     * Gets a node based off node ID.
     *
     * @param nodeId The id of the node to get.
     * @returns The workflow node.
     */
    public getNode(nodeId: string): WorkflowNode {
        return this.workflow[nodeId];
    }

    /**
     * Gets the list of options for every input in the user metadata.
     *
     * @returns The list of options for each input in the workflow.
     */
    public getInputOptionsList(): InputOption[] {
        return this.workflow._comfyuimini_meta.input_options.map((inputOption) => ({
            title: inputOption.title,
            node_id: inputOption.node_id,
            input_name_in_node: inputOption.input_name_in_node,
            disabled: inputOption.disabled ?? false,
        }));
    }

    /** -------------
     * STATIC METHODS
    -------------- */

    /**
     * Checks if a workflow is valid.
     *
     * @param workflow The workflow to validate.
     * @param returnErrorMessage If true, returns a string with the error message instead of throwing an error.
     * @returns Error message string if `returnErrorMessage` is true, otherwise throws an error.
     */
    public static validateWorkflowObject(workflow: AnyWorkflow, returnErrorMessage: boolean = false): string | void {
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
                WorkflowInstance.validateNode(node, nodeId);
            }
        } catch (error) {
            if (returnErrorMessage) {
                return (error as Error).message;
            } else {
                throw error;
            }
        }
    }

    /**
     * Checks if a node is valid.
     *
     * @param node The node to validate.
     * @param nodeId The ID of the node.
     * @returns Throws an error if the node is invalid. Otherwise, returns nothing.
     */
    private static validateNode(node: WorkflowNode, nodeId: string): void {
        if (nodeId.startsWith('_')) {
            return;
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

        if (node._meta === undefined) {
            throw new Error(`Invalid workflow: node '${nodeId}' does not have a '_meta' property`);
        }

        if (node._meta.title === undefined) {
            throw new Error(`Invalid workflow: node '${nodeId}' does not have title in '_meta'`);
        }

        if (node.inputs === undefined) {
            throw new Error(`Invalid workflow: node '${nodeId}' does not have inputs`);
        }
    }

    /**
     * Auto-generates metadata for a workflow object.
     *
     * @param workflow The workflow to generate metadata for.
     * @param filename The optional filename to use for the title of the workflow.
     * @returns The workflow with the generated metadata.
     */
    public static generateMetadataForWorkflow(workflow: Workflow, filename?: string): WorkflowWithMetadata {
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

            const nodeTitle = node['_meta'].title;

            for (const [inputName, inputValue] of Object.entries(node.inputs)) {
                if (Array.isArray(inputValue)) {
                    // Inputs that come from other nodes come as an array
                    continue;
                }

                metadata.input_options.push({
                    node_id: nodeId,
                    input_name_in_node: inputName,
                    title: `[${nodeId}] ${nodeTitle}: ${inputName}`,
                    disabled: false,
                });
            }
        }

        return {
            ...workflow,
            _comfyuimini_meta: metadata,
        } as WorkflowWithMetadata;
    }

    /** --------------
     * PRIVATE METHODS
    --------------- */

    /**
     * Validates and sets the workflow object to be used throughout the class.
     *
     * @param workflow The workflow object to set as the new workflow.
     */
    private setWorkflowObject(workflow: AnyWorkflow): void {
        WorkflowInstance.validateWorkflowObject(workflow);

        if (WorkflowInstance.workflowHasMetadata(workflow)) {
            this.workflow = workflow;
        } else {
            this.workflow = WorkflowInstance.generateMetadataForWorkflow(workflow);
        }
    }

    /**
     * Assert if a workflow has metadata.
     *
     * @param workflow The workflow to check metadata for.
     * @returns Assertion if the workflow has metadata, and is therefore an instance of WorkflowWithMetadata.
     */
    private static workflowHasMetadata(workflow: AnyWorkflow): workflow is WorkflowWithMetadata {
        return (workflow as WorkflowWithMetadata)._comfyuimini_meta !== undefined;
    }
}
