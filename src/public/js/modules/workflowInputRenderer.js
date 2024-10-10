/**
 * @typedef {Object} InputOptions
 * @property {}
 */

const inputsInfo = await fetch('/comfyui/inputsinfo');

/**
 * Render an input
 * 
 * @param {} inputOptions 
 */
export function renderInput(inputOptions) {
    const [nodeId, nodeInfo] = inputOptions;


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