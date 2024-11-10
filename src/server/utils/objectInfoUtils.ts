import { fetchRawObjectInfo } from './comfyAPIUtils';
import { NormalisedInputInfo, ProcessedObjectInfo } from '@shared/types/ComfyObjectInfo';

async function getProcessedObjectInfo(): Promise<ProcessedObjectInfo | null> {
    const rawObjectInfo = await fetchRawObjectInfo();

    if (rawObjectInfo === null) {
        return null;
    }

    const processedObjectInfo: ProcessedObjectInfo = {};

    for (const [nodeName, nodeInfo] of Object.entries(rawObjectInfo)) {
        const requiredInputs = nodeInfo.input.required;
        const optionalInputs = nodeInfo.input.optional;

        const allInputs = {
            ...(requiredInputs ?? {}),
            ...(optionalInputs ?? {}),
        };

        for (const [inputName, inputInfo] of Object.entries(allInputs)) {
            const normalisedInfo = getNormalisedInfo(inputInfo);

            if (normalisedInfo.userAccessible) {
                if (!processedObjectInfo[nodeName]) {
                    processedObjectInfo[nodeName] = {};
                }

                processedObjectInfo[nodeName][inputName] = normalisedInfo;
            }
        }
    }

    return processedObjectInfo;
}

/**
 * ComfyUI uses weirdly different formats for each input type,
 * e.g. For most inputs, `inputInfo[0]` is a string containing the input type, for arrays, its the list of options.
 *
 * However, arrays may also *sometimes* have a second element with other options such as `tooltip`, `default`, or `image_upload`
 * that determines if the input has an upload input or is just a list of options.
 *
 * @param {any} inputInfo
 * @returns {NormalisedInputInfo}
 */
function getNormalisedInfo(inputInfo: any): NormalisedInputInfo {
    const normalisedInfo: Partial<NormalisedInputInfo> = {
        userAccessible: false,
    };

    if (Array.isArray(inputInfo[0])) {
        normalisedInfo.userAccessible = true;
        normalisedInfo.type = 'ARRAY';
        normalisedInfo.list = inputInfo[0];

        if (inputInfo[1]) {
            normalisedInfo.default = inputInfo[1]?.default;
            normalisedInfo.imageUpload = inputInfo[1]?.image_upload;
            normalisedInfo.tooltip = inputInfo[1]?.tooltip;
        }

        return normalisedInfo as NormalisedInputInfo;
    }

    if (['INT', 'FLOAT', 'STRING'].includes(inputInfo[0])) {
        // data can contain default, tooltip for any type, min, max for int, and min max, and step for ints, and multiline, dynamicPrompts for strings
        normalisedInfo.userAccessible = true;
        normalisedInfo.type = inputInfo[0];
        normalisedInfo.default = inputInfo[1]?.default;
        normalisedInfo.tooltip = inputInfo[1]?.tooltip;
        normalisedInfo.min = inputInfo[1]?.min;
        normalisedInfo.max = inputInfo[1]?.max;
        normalisedInfo.step = inputInfo[1]?.step;
        normalisedInfo.multiline = inputInfo[1]?.multiline;
        normalisedInfo.dynamicPrompts = inputInfo[1]?.dynamicPrompts;

        return normalisedInfo as NormalisedInputInfo;
    }

    return normalisedInfo as NormalisedInputInfo;
}

export { getProcessedObjectInfo };
