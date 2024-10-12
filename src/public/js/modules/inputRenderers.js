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
 * @returns {string}
 */
export function renderSelectInput(inputOptions) {
    const id = `input-${inputOptions.node_id}-${inputOptions.input_name_in_node}`;

    const createSelectOptions = (options) => {
        return options.map((item) => `<option value="${item}">${item}</option>`).join('');
    };

    return createInputContainer(
        id,
        inputOptions.title,
        `<select id="${id}" class="workflow-input">${createSelectOptions(inputOptions.data)}</select>`
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
 * @param {string} inputOptions.data.default The default value of the input.
 * @param {number} inputOptions.data.step The step size of the input.
 * @param {number} inputOptions.data.min The minimum value of the input.
 * @param {number} inputOptions.data.max The maximum value of the input.
 * @returns {string}
 */
export function renderNumberInput(inputOptions) {
    const hasRandomiseToggle =
        inputOptions.show_randomise_toggle === true || inputOptions.show_randomise_toggle === 'on';

    const id = `input-${inputOptions.node_id}-${inputOptions.input_name_in_node}`;
    const { default: defaultValue, step, min, max } = inputOptions.data;

    const randomiseToggle = `
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
            class="workflow-input ${hasRandomiseToggle ? 'has-random-toggle' : ''}" 
            value="${defaultValue}"
            ${step !== undefined ? `step="${step}"` : ''}
            ${min !== undefined ? `min="${min}"` : ''} 
            ${max !== undefined ? `max="${max}"` : ''}
        >
        ${hasRandomiseToggle ? randomiseToggle : ''}
    `
    );
}

export const inputRenderers = {
    ARRAY: renderSelectInput,
    STRING: renderTextInput,
    INT: renderNumberInput,
    FLOAT: renderNumberInput,
};
