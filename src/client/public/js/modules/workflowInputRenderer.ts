import { InputOption, WorkflowNode, WorkflowWithMetadata } from '@shared/types/Workflow.js';
import { InputOptionsBase, inputRenderers } from './inputRenderers.js';
import { ProcessedObjectInfo } from '@shared/types/ComfyObjectInfo.js';

const inputsContainer = document.querySelector('.inputs-container') as HTMLElement;

const inputsInfoResponse = await fetch('/comfyui/inputsinfo');
const inputsInfoObject: ProcessedObjectInfo = await inputsInfoResponse.json();

/**
 * 
 * @param {WorkflowWithMetadata} workflowObject The workflow object to render inputs for.
 */
export function renderInputs(workflowObject: WorkflowWithMetadata) {
    const inputsMetadata = workflowObject['_comfyuimini_meta'].input_options;

    const transformedNodeList = Object.entries(workflowObject)
        .filter(([id]) => !id.startsWith('_'))
        .map(([id, value]) => {
            return { id, ...value };
        });

    for (const nodeInfo of transformedNodeList) {
        const nodeInputsMetadata = inputsMetadata.filter(inputMetadata => inputMetadata.node_id === nodeInfo.id);

        if (nodeInputsMetadata == undefined) {
            console.error(`No input metadata found for node ${nodeInfo.id}`);
            continue;
        }

        renderNodeInputs(nodeInfo, nodeInputsMetadata);
    }
}

interface DataForRenderer {
    node_id: string;
    input_name_in_node: string;
    title: string;
    default: string;
}

function renderNodeInputs(nodeObject: WorkflowNode, nodeInputsMetadata: InputOption[]) {
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

        if (!inputMetadata) {
            console.error(`No input metadata found for input ${inputName} in node ${nodeObject.class_type}`);
            continue;
        }

        if (inputMetadata.disabled) {
            continue;
        }

        const renderer = inputRenderers[inputOptionsFromComfyUI.type];

        if (!renderer) {
            throw new Error(`No renderer found for input type ${inputOptionsFromComfyUI.type}`);
        }

        let dataForRenderer: InputOptionsBase = inputMetadata as InputOptionsBase;
        dataForRenderer = { ...dataForRenderer, ...inputOptionsFromComfyUI };
        dataForRenderer.default = inputDefaultFromWorkflow.toString();

        // @ts-ignore - Fix later
        const inputHtml = renderer(dataForRenderer);

        inputsContainer.innerHTML += inputHtml;
    }
}