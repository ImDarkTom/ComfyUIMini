import { Workflow } from '@shared/types/Workflow';

export interface SavedInputs {
    [workflowType: string]: {
        [workflowIdentifier: string]: {
            [workflowNodeId: string]: {
                [inputName: string]: string;
            };
        };
    };
}

export const getSavedInputs = () => JSON.parse(localStorage.getItem('savedInputs') || '{}');

export function saveInputValues(workflowType: string, workflowIdentifier: string, filledWorkflow: Workflow) {
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
