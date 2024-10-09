/**
 * Predict the input type and the additional input options for a workflow input.
 *
 * @param {string} inputName The name of the input.
 * @returns {object} An object containing the predicted input type and any additional input options.
 */
function predictInputTypeAndOptions(inputName) {
    const predictions = {
        seed: {
            type: 'integer',
            show_randomise_toggle: true,
        },
        steps: {
            type: 'integer',
        },
        cfg: {
            type: 'float',
        },
        sampler_name: {
            type: 'select',
            select_list: 'sampler',
        },
        scheduler: {
            type: 'select',
            select_list: 'scheduler',
        },
        denoise: {
            type: 'float',
        },
        ckpt_name: {
            type: 'select',
            select_list: 'checkpoint',
        },
        width: {
            type: 'integer',
            min: 1,
        },
        height: {
            type: 'integer',
            min: 1,
        },
        batch_size: {
            type: 'integer',
        },
        text: {
            type: 'text',
        },
        filename_prefix: {
            type: 'text',
        },
        vae_name: {
            type: 'select',
            select_list: 'vae',
        },
    };

    return predictions[inputName] || { type: 'text' };
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
        description: '[Auto generated metadata]',
        format_version: '1',
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
                default: defaultInputValue,
                ...predictInputTypeAndOptions(inputName),
            });
        }
    }

    return generatedMetadata;
}

module.exports = {
    autoGenerateMetadata,
}