import { Workflow, WorkflowMetadata } from '../types/Workflow';

/**
 * Attempts to auto-generate metadata for a workflow object.
 *
 * @param {Workflow} workflowObject The object from the parsed workflow JSON file.
 * @param {string} workflowFilename The filename of the workflow to use as the default title.
 * @returns {object|null} Returns an object containing the generated metadata, if JSON is not a valid workflow, returns null.
 */
function autoGenerateMetadata(workflowObject: Workflow, workflowFilename: string): object | null {
    const generatedMetadata: WorkflowMetadata = {
        title: workflowFilename,
        description: 'A ComfyUI workflow.',
        format_version: '2',
        input_options: [],
    };

    for (const [nodeId, nodeObject] of Object.entries(workflowObject)) {
        if (nodeId.charAt(0) == '_') {
            continue;
        }

        const nodeTitle = nodeObject['_meta'].title;

        for (const [inputName, defaultInputValue] of Object.entries(nodeObject.inputs)) {
            if (Array.isArray(defaultInputValue)) {
                // Inputs that come from other nodes come as an array
                continue;
            }

            generatedMetadata.input_options.push({
                node_id: nodeId,
                input_name_in_node: inputName,
                title: `[${nodeTitle}-${nodeId}] ${inputName}`,
            });
        }
    }

    return generatedMetadata;
}

export { autoGenerateMetadata };
