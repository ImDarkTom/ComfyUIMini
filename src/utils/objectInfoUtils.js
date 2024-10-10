const { getObjectInfo } = require("./comfyAPIUtils");

const inputsInfoObject = {};

async function loadObjectInfoMap() {
    const objectInfoObject = await getObjectInfo();

    for (const [nodeName, nodeInfo] of Object.entries(objectInfoObject)) {
        for (const [inputName, inputInfo] of Object.entries(nodeInfo.input.required)) {
            const processedInputData = getInputData(inputInfo);

            if (processedInputData.userAcessible) {
                if (!inputsInfoObject[nodeName]) {
                    inputsInfoObject[nodeName] = {};
                }

                inputsInfoObject[nodeName][inputName] = { type: processedInputData.type, data: inputInfo[processedInputData.getDataFromKey] };
            }
        }
    }
}

/**
 * 
 * @param {object} inputInfo 
 * @returns {object}
 * @returns {object.userAcessible} If the input contains an input that can be shown to the user i.e. not just piped from another node.
 * @returns {object.getDataFromKey} What key the data is stored in, 0 for lists, 1 for others.
 */
function getInputData(inputInfo) {
    if (Array.isArray(inputInfo[0])) {
        return {
            userAcessible: true,
            type: "ARRAY",
            getDataFromKey: 0
        };
    }

    if (["INT", "FLOAT", "STRING"].includes(inputInfo[0])) {
        return {
            userAcessible: true,
            type: inputInfo[0],
            getDataFromKey: 1
        }
    }

    return {
        userAcessible: false
    }
}

module.exports = {
    loadObjectInfoMap,
    inputsInfoObject
}