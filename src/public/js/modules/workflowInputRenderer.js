import { inputRenderers } from './inputRenderers.js';

const inputsContainer = document.querySelector('.inputs-container');

const inputsInfoResponse = await fetch('/comfyui/inputsinfo');
const inputsInfoObject = await inputsInfoResponse.json();

/**
 * 
 * @param {Object} workflowObject The workflow object to render inputs for.
 */
export function renderInputs(workflowObject) {
    const inputsMetadata = workflowObject['_comfyuimini_meta'].input_options;

    const transformedNodeList = Object.entries(workflowObject)
        .filter(([id]) => !id.startsWith('_'))
        .map(([id, value]) => {
            return { id, ...value };
        });

    for (const nodeInfo of transformedNodeList) {
        const nodeInputsMetadata = inputsMetadata.filter(inputMetadata => inputMetadata.node_id === nodeInfo.id);

        renderNodeInputs(nodeInfo, nodeInputsMetadata);
    }
}

function renderNodeInputs(nodeObject, nodeInputsMetadata) {
    const inputInfo = inputsInfoObject[nodeObject.class_type];

    if (inputInfo == undefined) {
        return;
    }

    for (const [inputName, inputDefaultFromWorkflow] of Object.entries(nodeObject.inputs)) {
        const inputOptionsFromComfyUI = inputInfo[inputName];

        if (inputOptionsFromComfyUI == undefined) {
            continue;
        }

        const inputMetadata = nodeInputsMetadata.find((input) => input.input_name_in_node === inputName);

        if (inputMetadata.disabled) {
            continue;
        }

        const renderer = inputRenderers[inputOptionsFromComfyUI.type];

        if (!renderer) {
            throw new Error(`No renderer found for input type ${inputOptionsFromComfyUI.type}`);
        }

        let dataForRenderer = inputMetadata;
        dataForRenderer = { ...dataForRenderer, ...inputOptionsFromComfyUI };
        dataForRenderer.default = inputDefaultFromWorkflow;

        const inputHtml = renderer(dataForRenderer);
        inputsContainer.innerHTML += inputHtml;
    }
}