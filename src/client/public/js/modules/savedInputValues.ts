import { NodeInputValues } from '@shared/types/SavedInputs';
import { Workflow } from '@shared/types/Workflow';

export const getSavedInputs = () => JSON.parse(localStorage.getItem('savedInputs') || '{}');

export class SaveInputValues {
    static fromWorkflow(workflowType: string, workflowIdentifier: string, filledWorkflow: Workflow) {
        const savedInputs = getSavedInputs();

        if (!savedInputs[workflowType]) {
            savedInputs[workflowType] = {};
        }

        if (!savedInputs[workflowType][workflowIdentifier]) {
            savedInputs[workflowType][workflowIdentifier] = {};
        }
    
        for (const [nodeId, nodeInfo] of Object.entries(filledWorkflow)) {
            if (!savedInputs[workflowType][workflowIdentifier][nodeId]) {
                savedInputs[workflowType][workflowIdentifier][nodeId] = {};
            }
    
            for (const [inputName, inputValue] of Object.entries(nodeInfo.inputs)) {
                if (Array.isArray(inputValue)) {
                    continue;
                }
    
                savedInputs[workflowType][workflowIdentifier][nodeId][inputName] = inputValue;
            }
        }
    
        localStorage.setItem('savedInputs', JSON.stringify(savedInputs));
    }

    static fromNodeInputValues(workflowType: string, workflowIdentifier: string, nodeInputValues: NodeInputValues) {
        const savedInputs = getSavedInputs();

        if (!savedInputs[workflowType]) {
            savedInputs[workflowType] = {};
        }

        if (!savedInputs[workflowType][workflowIdentifier]) {
            savedInputs[workflowType][workflowIdentifier] = {};
        }
        
        for (const [workflowNodeId, nodeInputs] of Object.entries(nodeInputValues)) {
            if (!savedInputs[workflowType][workflowIdentifier][workflowNodeId]) {
                savedInputs[workflowType][workflowIdentifier][workflowNodeId] = {};
            }

            for (const [inputName, inputValue] of Object.entries(nodeInputs)) {
                savedInputs[workflowType][workflowIdentifier][workflowNodeId][inputName] = inputValue;
            }
        }

        localStorage.setItem('savedInputs', JSON.stringify(savedInputs));
    }
}

export function getSavedInputValue(
    workflowType: string,
    workflowIdentifier: string,
    nodeId: string,
    inputName: string
) {
    const savedInputs = getSavedInputs();

    if (!savedInputs[workflowType]) {
        return null;
    }

    if (!savedInputs[workflowType][workflowIdentifier]) {
        return null;
    }

    if (!savedInputs[workflowType][workflowIdentifier][nodeId]) {
        return null;
    }

    if (savedInputs[workflowType][workflowIdentifier][nodeId][inputName] === undefined) {
        return null;
    }

    return savedInputs[workflowType][workflowIdentifier][nodeId][inputName];
}

export function clearSavedInputValuesForWorkflow(workflowType: string, workflowIdentifier: string) {
    const savedInputs = getSavedInputs();

    if (!savedInputs[workflowType]) {
        savedInputs[workflowType] = {};
    }

    if (savedInputs[workflowType][workflowIdentifier]) {
        delete savedInputs[workflowType][workflowIdentifier];
    }

    localStorage.setItem('savedInputs', JSON.stringify(savedInputs));
}

export function clearAllSavedInputValues() {
    localStorage.setItem('savedInputs', JSON.stringify({}));
}
