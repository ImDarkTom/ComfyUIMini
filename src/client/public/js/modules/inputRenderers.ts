export interface BaseRenderConfig {
    node_id: string;
    input_name_in_node: string;
    title: string;
    default: string;
}

export interface TextRenderConfig extends BaseRenderConfig {
    multiline?: boolean;
}

export interface NumberRenderConfig extends BaseRenderConfig {
    step?: number;
    min?: number;
    max?: number;
}

export interface SelectRenderConfig extends BaseRenderConfig {
    list: string[];
    imageUpload?: boolean;
}

const createInputContainer = (id: string, title: string, inputHtml: string): string => `
    <div class="workflow-input-container">
        <label for="${id}">${title}</label>
        <div class="inner-input-wrapper">
            ${inputHtml}
        </div>
    </div>
`;

/**
 *
 * @param {SelectRenderConfig} inputOptions Options for the select input.
 * @returns {string}
 */
export function renderSelectInput(inputOptions: SelectRenderConfig): string {
    function renderUploadMenu(inputId: string) {
        return `<label for="${inputId}-file_input" class="file-input-label"><span class="icon upload"></span></label>
        <input type="file" id="${inputId}-file_input" data-select-id="${inputId}" class="file-input" accept="image/jpeg,image/png,image/webp">`;
    }

    const id = `input-${inputOptions.node_id}-${inputOptions.input_name_in_node}`;

    const createSelectOptions = (options: string[]) => {
        let optionsHtml = '';

        if (!options.includes(inputOptions.default)) {
            optionsHtml += `<option value="" disabled selected>Couldn't find '${inputOptions.default}'</option>`;
        }

        optionsHtml += options
            .map(
                (item) => `<option value="${item}" ${inputOptions.default == item ? 'selected' : ''} >${item}</option>`
            )
            .join('');

        return optionsHtml;
    };

    return createInputContainer(
        id,
        inputOptions.title,
        `<select id="${id}" class="workflow-input">${createSelectOptions(inputOptions.list)}</select>
        ${inputOptions.imageUpload === true ? renderUploadMenu(id) : ''}`
    );
}

/**
 *
 * @param {TextRenderConfig} inputOptions Options for the text input.
 * @returns {string}
 */
export function renderTextInput(inputOptions: TextRenderConfig): string {
    const id = `input-${inputOptions.node_id}-${inputOptions.input_name_in_node}`;
    return createInputContainer(
        id,
        inputOptions.title,
        `<textarea id="${id}" class="workflow-input">${inputOptions.default}</textarea>`
    );
}

/**
 *
 * @param {NumberRenderConfig} inputOptions Options for the number input.
 * @returns {string}
 */
export function renderNumberInput(inputOptions: NumberRenderConfig): string {
    const showRandomiseToggle = inputOptions.input_name_in_node === 'seed';

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
