/**
 * Gets any additional input options for a given input name.
 *
 * @param {string} inputName The name of the input.
 * @returns {object} An object containing any additional options for the input.
 */
function getAdditionalInputOptions(inputName) {
    if (inputName === 'seed') {
        return { show_randomise_toggle: true };
    }

    return {};
}

/**
 * Checks if a JSON workflow object is a valid ComfyUI workflow.
 * Kept here instead of workflowUtils in order to avoid circular dependency issues.
 *
 * @param {object} workflowJson The workflow object.
 * @returns {boolean} True if workflow is a valid ComfyUI workflow, otherwise false.
 */
function checkIfObjectIsValidWorkflow(workflowJson) {
    for (const key of Object.keys(workflowJson)) {
        if (workflowJson[key].inputs && typeof workflowJson[key].inputs === 'object') {
            return true;
        }
    }

    return false;
}

/**
 * Attempts to auto-generate metadata for a workflow object.
 *
 * @param {object} workflowObject The object from the parsed workflow JSON file.
 * @param {string} workflowFilename The filename of the workflow to use as the default title.
 * @returns {object|null} Returns an object containing the generated metadata, if JSON is not a valid workflow, returns null.
 */
function autoGenerateMetadata(workflowObject, workflowFilename) {
    if (checkIfObjectIsValidWorkflow(workflowObject) === false) {
        return null;
    }

    const generatedMetadata = {
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
                ...getAdditionalInputOptions(inputName),
            });
        }
    }

    return generatedMetadata;
}

module.exports = {
    autoGenerateMetadata,
}