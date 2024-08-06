const createInputContainer = (id, title, inputHtml) => `
    <div class="workflow-input-container">
        <label for="${id}">${title}</label>
        ${inputHtml}
    </div>
`;

export async function renderSelectInput(inputOptions) {
    const selectListResponse = await fetch(`/comfyui/listmodels/${inputOptions.select_list}`);
    const selectListJson = await selectListResponse.json();

    const id = `input-${inputOptions.node_id}-${inputOptions.input_name_in_node}`;

    const createSelectOptions = (options) => {
        return options.map(item => `<option value="${item}">${item}</option>`).join('');
    }

    return createInputContainer(id, inputOptions.title, `<select id="${id}" class="workflow-input">${createSelectOptions(selectListJson)}</select>`);
}

export function renderTextInput(inputOptions) {
    const id = `input-${inputOptions.node_id}-${inputOptions.input_name_in_node}`;

    return createInputContainer(id, inputOptions.title, `<textarea id="${id}" class="workflow-input">${inputOptions.default}</textarea>`);
}

export function renderNumberInput(inputOptions) {
    const hasRandomiseToggle = inputOptions.show_randomise_toggle === true || inputOptions.show_randomise_toggle === "on";

    const id = `input-${inputOptions.node_id}-${inputOptions.input_name_in_node}`;
    const { default: defaultValue, step, min, max } = inputOptions;

    return createInputContainer(id, inputOptions.title, `
        <div class="inner-input-wrapper">
            <input 
                id="${id}" 
                type="number" 
                placeholder="${defaultValue}" 
                class="workflow-input ${hasRandomiseToggle ? "has-random-toggle" : ""}" 
                value="${defaultValue}"
                ${step !== undefined ? `step="${step}"` : ''}
                ${min !== undefined ? `min="${min}"` : ''} 
                ${max !== undefined ? `max="${max}"` : ''}
            >
            ${hasRandomiseToggle ? `<button class="randomise-input" type="button" data-linked-input-id="${id}">🎲</button>` : ''}
        </div>
    `);
}

export const inputRenderers = {
    select: renderSelectInput,
    text: renderTextInput,
    integer: renderNumberInput,
    float: renderNumberInput
}