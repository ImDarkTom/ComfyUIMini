import { inputRenderers } from './inputRenderers.js';

const inputsContainer = document.querySelector('.inputs-container');

/**
 * @typedef {Object} InputOptions
 * @property {}
 */
const inputsInfoResponse = await fetch('/comfyui/inputsinfo');
const inputsInfoObject = await inputsInfoResponse.json();

/**
 * Render an input
 * 
 * @param {} nodeObject 
 */
export function renderNodeInputs(nodeObject, nodeMetadata) {
    const [nodeId, nodeInfo] = nodeObject;

    if (nodeId.startsWith('_')) {
        return;
    }

    const inputInfo = inputsInfoObject[nodeInfo.class_type];

    if (inputInfo == undefined) {
        return;
    }

    for (const [inputName, inputDefaultValue] of Object.entries(nodeInfo.inputs)) {
        const inputOptions = inputInfo[inputName];

        if (inputOptions == undefined) {
            continue;
        }

        const inputMetadata = nodeMetadata.find((item) => item.input_name_in_node === inputName);

        if (inputMetadata.disabled) {
            continue;
        }

        const renderer = inputRenderers[inputOptions.type];

        if (renderer) {
            const inputHtml = renderer({...inputOptions, ...inputMetadata});
            inputsContainer.innerHTML += inputHtml;
        }
    }
}


// async function renderInput(inputOptions) {
//     if (inputOptions.disabled) return '';

//     const renderer = inputRenderers[inputOptions.type];

//     if (renderer) {
//         return await renderer(inputOptions);
//     } else {
//         console.error(`Invalid input type: ${inputType}`);
//         return '';
//     }
// }