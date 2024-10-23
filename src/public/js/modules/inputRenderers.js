const createInputContainer = (id, title, inputHtml) => `
    <div class="workflow-input-container">
        <label for="${id}">${title}</label>
        <div class="inner-input-wrapper">
            ${inputHtml}
        </div>
    </div>
`;

/**
 * 
 * @param {Object} inputOptions Options for the select input.
 * @param {string} inputOptions.node_id The node id.
 * @param {string} inputOptions.input_name_in_node The name of the input in the node.
 * @param {string} inputOptions.title The title of the input.
 * @param {string} inputOptions.data The list of options to select from.
 * @param {string} inputOptions.default The default selection option.
 * @returns {string}
 */
export function renderSelectInput(inputOptions) {
    function renderUploadMenu(inputId) {
        return `<label for="${inputId}-file_input" class="file-input-label"><span class="icon upload"></span></label>
        <input type="file" id="${inputId}-file_input" data-select-id="${inputId}" class="file-input" accept="image/jpeg,image/png,image/webp">`
    }

    const id = `input-${inputOptions.node_id}-${inputOptions.input_name_in_node}`;

    const createSelectOptions = (options) => {
        let optionsHtml = '';

        if (!options.includes(inputOptions.default)) {
            optionsHtml += `<option value="" disabled selected>Couldn't find '${inputOptions.default}'</option>`;
        }

        optionsHtml += options.map((item) =>
            `<option value="${item}" ${inputOptions.default == item ? "selected" : ""} >${item}</option>`
        ).join('');

        return optionsHtml;
    };

    return createInputContainer(
        id,
        inputOptions.title,
        `<select id="${id}" class="workflow-input">${createSelectOptions(inputOptions.data)}</select>
        ${inputOptions.imageUpload === true ? renderUploadMenu(id) : ""}`
    );
}

/**
 * 
 * @param {Object} inputOptions Options for the text input.
 * @param {string} inputOptions.node_id The node id.
 * @param {string} inputOptions.input_name_in_node The name of the input in the node.
 * @param {string} inputOptions.default The default value.
 * @param {string} inputOptions.title The title of the input.
 * @returns {string}
 */
export function renderTextInput(inputOptions) {
    const id = `input-${inputOptions.node_id}-${inputOptions.input_name_in_node}`;

    return createInputContainer(
        id,
        inputOptions.title,
        `<textarea id="${id}" class="workflow-input">${inputOptions.default}</textarea>`
    );
}

/**
 * 
 * @param {Object} inputOptions Options for the number input.
 * @param {string} inputOptions.node_id The node id.
 * @param {string} inputOptions.input_name_in_node The name of the input in the node.
 * @param {string} inputOptions.title The title of the input.
 * @param {string} inputOptions.default The default value of the input.
 * @param {number} inputOptions.step The step size of the input.
 * @param {number} inputOptions.min The minimum value of the input.
 * @param {number} inputOptions.max The maximum value of the input.
 * @returns {string}
 */
export function renderNumberInput(inputOptions) {
    const showRandomiseToggle = inputOptions.input_name_in_node === "seed";

    const id = `input-${inputOptions.node_id}-${inputOptions.input_name_in_node}`;
    const { default: defaultValue, step, min, max } = inputOptions;

    const randomiseToggleHTML = `
    <div class="randomise-buttons-container" data-linked-input-id="${id}">
        <span class="randomise-now-button">↻</span>
        <span class="randomise-input-toggle"></span>
    </div>`;

    return createInputContainer(
        id,
        inputOptions.title,
        `
        <input 
            id="${id}" 
            type="number" 
            placeholder="${defaultValue}" 
            class="workflow-input ${showRandomiseToggle ? 'has-random-toggle' : ''}" 
            value="${defaultValue}"
            ${step !== undefined ? `step="${step}"` : ''}
            ${min !== undefined ? `min="${min}"` : ''} 
            ${max !== undefined ? `max="${max}"` : ''}
        >
        ${showRandomiseToggle ? randomiseToggleHTML : ''}
    `
    );
}

export const inputRenderers = {
    ARRAY: renderSelectInput,
    STRING: renderTextInput,
    INT: renderNumberInput,
    FLOAT: renderNumberInput,
};
