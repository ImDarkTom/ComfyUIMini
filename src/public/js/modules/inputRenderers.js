const createInputContainer = (id, title, inputHtml) => `
    <div class="workflow-input-container">
        <label for="${id}">${title}</label>
        <div class="inner-input-wrapper">
            ${inputHtml}
        </div>
    </div>
`;

// { select_list, node_id, input_name_in_node, title }
export async function renderSelectInput(inputOptions) {
    const selectListResponse = await fetch(`/comfyui/selectoption/${inputOptions.select_list}`);
    const selectListJson = await selectListResponse.json();

    const id = `input-${inputOptions.node_id}-${inputOptions.input_name_in_node}`;

    const createSelectOptions = (options) => {
        return options.map((item) => `<option value="${item}">${item}</option>`).join('');
    };

    return createInputContainer(
        id,
        inputOptions.title,
        `<select id="${id}" class="workflow-input">${createSelectOptions(selectListJson)}</select>`
    );
}

// { node_id, input_name_in_node, default, title }
export function renderTextInput(inputOptions) {
    const id = `input-${inputOptions.node_id}-${inputOptions.input_name_in_node}`;

    return createInputContainer(
        id,
        inputOptions.title,
        `<textarea id="${id}" class="workflow-input">${inputOptions.default}</textarea>`
    );
}

// { node_id, input_name_in_node, show_randomise_toggle, title, defaultValue, step, min, max }
export function renderNumberInput(inputOptions) {
    const hasRandomiseToggle =
        inputOptions.show_randomise_toggle === true || inputOptions.show_randomise_toggle === 'on';

    const id = `input-${inputOptions.node_id}-${inputOptions.input_name_in_node}`;
    const { default: defaultValue, step, min, max } = inputOptions;

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
    select: renderSelectInput,
    text: renderTextInput,
    integer: renderNumberInput,
    float: renderNumberInput,
};
