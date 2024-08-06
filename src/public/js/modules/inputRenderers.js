export async function renderSelectInput(inputOptions) {
    const selectListResponse = await fetch(`/comfyui/listmodels/${inputOptions.select_list}`);
    const selectListJson = await selectListResponse.json();

    let html = `
        <div class="workflow-input-container">
            <label for="input-${inputOptions.node_id}-${inputOptions.input_name_in_node}">${inputOptions.title}</label>
            <select id="input-${inputOptions.node_id}-${inputOptions.input_name_in_node}" class="workflow-input">
        `;

    selectListJson.forEach(item => {
        html += `<option value="${item}">${item}</option>`;
    });

    html += "</select>"

    return html;
}

export async function renderTextInput(inputOptions) {
    let html = `
        <div class="workflow-input-container">
            <label for="input-${inputOptions.node_id}-${inputOptions.input_name_in_node}">${inputOptions.title}</label>
            <textarea id="input-${inputOptions.node_id}-${inputOptions.input_name_in_node}" class="workflow-input">${inputOptions.default}</textarea>
        `;

    return html;
}

export async function renderNumberInput(inputOptions) {
    const type = inputOptions.type === "integer" ? "number" : "number";
    const hasRandomiseToggle = inputOptions.show_randomise_toggle === true || inputOptions.show_randomise_toggle === "on";

    const inputId = `input-${inputOptions.node_id}-${inputOptions.input_name_in_node}`;
    const defaultValue = inputOptions.default;

    const inputStep = inputOptions.step;
    const inputMin = inputOptions.min;
    const inputMax = inputOptions.max;

    let html = `
        <div class="workflow-input-container">
            <label for="${inputId}">${inputOptions.title}</label>
            <div class="inner-input-wrapper">
                <input 
                    id="${inputId}" 
                    type="${type}" 
                    placeholder="${defaultValue}" 
                    class="workflow-input ${hasRandomiseToggle ? "has-random-toggle" : ""}" 
                    value="${defaultValue}"
                    ${inputStep !== undefined ? `step="${inputStep}"` : ''}
                    ${inputMin !== undefined ? `min="${inputMin}"` : ''} 
                    ${inputMax !== undefined ? `max="${inputMax}"` : ''}
                >
        `;

    if (hasRandomiseToggle) {
        html += `
            <button class="randomise-input" type="button" onclick="randomiseInput('${inputId}')">🎲</button>
            `;
    }

    html += `</div></div>`;
    return html;
}

export const inputRenderers = {
    select: renderSelectInput,
    text: renderTextInput,
    integer: renderNumberInput,
    float: renderNumberInput
}