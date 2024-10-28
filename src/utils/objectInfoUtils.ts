import { NormalisedInputInfo, ProcessedObjectInfo } from '../types/ComfyObjectInfo';
import { fetchRawObjectInfo } from './comfyAPIUtils';

async function getProcessedObjectInfo(): Promise<ProcessedObjectInfo | null> {
    const rawObjectInfo = await fetchRawObjectInfo();

    if (rawObjectInfo === null) {
        return null;
    }

    const processedObjectInfo: ProcessedObjectInfo = {};

    for (const [nodeName, nodeInfo] of Object.entries(rawObjectInfo)) {
        for (const [inputName, inputInfo] of Object.entries(nodeInfo.input.required)) {
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
 * @param {object} inputInfo
 * @returns {object}
 * @returns {object.userAcessible} If the input contains an input that can be shown to the user i.e. not just piped from another node.
 */
function getNormalisedInfo(inputInfo: any): NormalisedInputInfo {
    const normalisedInfo = {
        userAccessible: false,
    } as NormalisedInputInfo;

    if (Array.isArray(inputInfo[0])) {
        normalisedInfo.userAccessible = true;
        normalisedInfo.type = 'ARRAY';
        normalisedInfo.data = inputInfo[0];

        if (inputInfo[1]) {
            normalisedInfo.default = inputInfo[1]?.default;
            normalisedInfo.tooltip = inputInfo[1]?.tooltip;
            normalisedInfo.imageUpload = inputInfo[1]?.image_upload;
        }

        return normalisedInfo;
    }

    if (['INT', 'FLOAT', 'STRING'].includes(inputInfo[0])) {
        // data can contain default, tooltip for any type, min, max for int, and min max, and step for ints, and multiline, dynamicPrompts for strings
        normalisedInfo.userAccessible = true;
        normalisedInfo.type = inputInfo[0];
        normalisedInfo.data = inputInfo[1];

        return normalisedInfo;
    }

    return normalisedInfo;
}

export { getProcessedObjectInfo };
