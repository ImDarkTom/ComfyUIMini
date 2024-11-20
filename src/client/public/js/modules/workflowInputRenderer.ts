import { InputOption, WorkflowWithMetadata } from '@shared/types/Workflow.js';
import { BaseRenderConfig, renderNumberInput, renderSelectInput, renderTextInput } from './inputRenderers.js';
import { NormalisedInputInfo, ProcessedObjectInfo } from '@shared/types/ComfyObjectInfo.js';
import { getSavedInputValue } from './savedInputValues.js';

const inputsContainer = document.querySelector('.inputs-container') as HTMLElement;

const inputsInfoResponse = await fetch('/comfyui/inputsinfo');
const inputsInfoObject: ProcessedObjectInfo = await inputsInfoResponse.json();

interface WorkflowDataObject {
    type: string;
    identifier: string;
    json: WorkflowWithMetadata;
    title: string;
}

/**
 *
 * @param {WorkflowDataObject} workflowObject The workflow object to render inputs for.
 */
export function renderInputs(workflowObject: WorkflowDataObject) {
    const workflowJson = workflowObject.json;
    const userInputsMetadata = workflowJson['_comfyuimini_meta'].input_options;

    let renderedInputs = '';
    for (const userInputMetadata of userInputsMetadata) {
        if (userInputMetadata.disabled) {
            continue;
        }

        const inputNode = workflowJson[userInputMetadata.node_id];

        // Can be number or string, but not a list as we can only save editable inputs with the import page.
        const savedDefaultValue = getSavedInputValue(
            workflowObject.type,
            workflowObject.identifier,
            userInputMetadata.node_id,
            userInputMetadata.input_name_in_node
        );

        const defaultValue = savedDefaultValue ?? inputNode.inputs[userInputMetadata.input_name_in_node].toString();

        const comfyInputInfo = inputsInfoObject[inputNode.class_type][userInputMetadata.input_name_in_node];

        if (!comfyInputInfo) {
            console.warn(`No input info found for ${userInputMetadata.input_name_in_node} in ${inputNode.class_type}`);
            continue;
        }

        const renderedInput = renderInput(userInputMetadata, defaultValue, comfyInputInfo);

        renderedInputs += renderedInput;
    }

    inputsContainer.innerHTML = renderedInputs;
}

export function renderInput(userInputMetadata: InputOption, defaultValue: string, comfyInputInfo: NormalisedInputInfo) {
    const inputType = comfyInputInfo.type;

    const baseRenderOptions: BaseRenderConfig = {
        node_id: userInputMetadata.node_id,
        input_name_in_node: userInputMetadata.input_name_in_node,
        title: userInputMetadata.title,
        default: defaultValue,
    };

    switch (inputType) {
        case 'STRING': {
            const textRenderOptions = {
                multiline: comfyInputInfo.multiline,
                ...baseRenderOptions,
            };

            return renderTextInput(textRenderOptions);
        }

        case 'INT':
        case 'FLOAT': {
            const numberRenderOptions = {
                step: comfyInputInfo.step,
                min: comfyInputInfo.min,
                max: comfyInputInfo.max,
                ...baseRenderOptions,
            };

            return renderNumberInput(numberRenderOptions);
        }

        case 'ARRAY': {
            const selectRenderOptions = {
                list: comfyInputInfo.list,
                imageUpload: comfyInputInfo.imageUpload,
                ...baseRenderOptions,
            };

            return renderSelectInput(selectRenderOptions);
        }

        default: {
            console.error(`No renderer found for input type ${inputType}`);
            return `No renderer found for input type ${inputType}`;
        }
    }
}
