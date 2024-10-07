const { default: axios } = require('axios');
const WebSocket = require('ws');
const logger = require('./logger');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('config');
const { selectOptionsObject } = require('./selectOptionManager');

const clientId = crypto.randomUUID();
const appVersion = require('../../package.json').version;

const comfyuiAxios = axios.create({
    baseURL: config.comfyui_url,
    timeout: 10000,
    headers: {
        'User-Agent': `ComfyUIMini/${appVersion}`,
    },
});

async function queuePrompt(workflowPrompt, clientId) {
    const postContents = { prompt: workflowPrompt, client_id: clientId };

    const response = await comfyuiAxios.post('/prompt', postContents, {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return response.data;
}

async function getImage(filename, subfolder, type) {
    const params = new URLSearchParams({ filename, subfolder, type });

    try {
        const response = await comfyuiAxios.get(`/view?${params.toString()}`, { responseType: 'arraybuffer' });

        return response;
    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            // Fallback if ComfyUI is unavailable
            if (type === 'output') {
                const readFile = fs.readFileSync(path.join(config.output_dir, subfolder, filename));

                return {
                    data: readFile,
                    headers: {
                        'Content-Type': 'image/png',
                        'Content-Length': readFile.length,
                    },
                };
            }
        }
    }
}

/**
 * Gets the category of a select type.
 * 
 * E.g. if selectType is "checkpoints", the category would be "models", 
 * if selectType is "scheduler", the category would be "selects".
 * @param {string} selectType The select type to get the category of.
 * @returns {string} The category of the select type.
 */
function getSelectOptionCategory(selectType) {
    const selectOptions = config.selectOptions;

    for (const category in selectOptions) {
        if (selectOptions[category].includes(selectType)) {
            return category;
        }
    }
}

/**
 * Get the list of items for a select type, this can be a list of models for a model type such as 'checkpoints', or a list of available samplers/schedulers/etc.
 * 
 * @param {string} selectType The select option type to get items for.
 * @returns {String[]} The list of items for the select type.
 */
async function getItemsForSelectType(selectType) {
    // Backwards compatibility
    if (selectType == "checkpoint") {
        selectType = "checkpoints";
    }

    const selectOptionCategory = getSelectOptionCategory(selectType);

    if (selectOptionCategory === "selects") {
        return selectOptionsObject[selectType];

    } else if (selectOptionCategory === "models") {
        return getItemsForModelType(selectType);

    } else {
        console.warn(`Unknown select option category '${selectOptionCategory}' for select type '${selectType}'.`);
        return [];
    }
}

/**
 * Gets the list of available models.
 * 
 * @returns {Promise<string[]>} A promise that resolves to an array of strings representing the available models.
 */
async function getModelTypesList() {
    try {
        const response = await comfyuiAxios.get('/models');

        return response.data;
    } catch (error) {
        logger.warn('Could not get model types list from ComfyUI');
        return [];
    }
}

/**
 * Gets the list of available models for a specific model type.
 * 
 * @param {string} modelType The model type to get the list of available models for.
 * @returns {Promise<string[]>} A promise that resolves to a list of strings representing the available models for the specified model type.
 */
async function getItemsForModelType(modelType) {
    const response = await comfyuiAxios.get(`/models/${modelType}`);

    return response.data;
}

async function generateProxiedImageUrl(filename, subfolder, folderType) {
    const params = new URLSearchParams({ filename, subfolder, type: folderType });

    return `/comfyui/image?${params.toString()}`;
}

async function getHistory(promptId) {
    const response = await comfyuiAxios.get(`/history/${promptId}`);

    return response.data;
}

async function getQueue() {
    const response = await comfyuiAxios.get('/queue');

    return response.data;
}

async function getOutputImages(promptId) {
    const outputImages = {};

    const history = await getHistory(promptId);
    const historyOutputs = history[promptId].outputs;

    for (const nodeId in historyOutputs) {
        const nodeOutput = historyOutputs[nodeId];
        if (nodeOutput.images) {
            const imageUrls = await Promise.all(
                nodeOutput.images.map(async (image) => {
                    return await generateProxiedImageUrl(image.filename, image.subfolder, image.type);
                })
            );
            outputImages[nodeId] = imageUrls;
        }
    }

    return outputImages;
}

function bufferIsText(buffer) {
    try {
        const text = buffer.toString('utf8');
        JSON.parse(text);
        return true;
    } catch (error) {
        return false;
    }
}

async function generateImage(workflowPrompt, wsClient) {
    const wsServer = new WebSocket(`${config.comfyui_ws_url}/ws?clientId=${clientId}`);

    wsServer.on('open', async () => {
        try {
            const promptData = await queuePrompt(workflowPrompt);
            const promptId = promptData.prompt_id;

            logger.logOptional('queue_image', 'Queued image.');

            const queueJson = await getQueue();

            if (queueJson['queue_running'][0] === undefined) {
                // Exact workflow was ran before and was cached by ComfyUI.
                const cachedImages = await getOutputImages(promptId);
                logger.logOptional('generation_finish', 'Using cached generation result.');

                wsClient.send(JSON.stringify({ type: 'total_images', data: Object.values(cachedImages).length }));
                wsClient.send(JSON.stringify({ type: 'completed', data: cachedImages }));

            } else {
                wsClient.send(JSON.stringify({ type: 'total_images', data: queueJson['queue_running'][0][4].length }));
            }

            wsServer.on('message', async (data) => {
                if (bufferIsText(data)) {
                    const message = JSON.parse(data.toString());

                    if (message.type === 'status') {
                        if (message.data.status.exec_info.queue_remaining == 0) {
                            logger.logOptional('generation_finish', 'Image generation finished.');
                            wsServer.close();
                        }
                    } else if (message.type === 'progress') {
                        wsClient.send(JSON.stringify(message));
                    }
                } else {
                    // Handle image buffers like ComfyUI client
                    const imageType = data.readUInt32BE(0);
                    let imageMime;

                    switch (imageType) {
                        case 1:
                        default:
                            imageMime = 'image/jpeg';
                            break;
                        case 2:
                            imageMime = 'image/png';
                    }

                    const imageBlob = data.slice(8);
                    const base64Image = imageBlob.toString('base64');

                    const jsonPayload = {
                        type: 'preview',
                        data: { image: base64Image, mimetype: imageMime },
                    };

                    wsClient.send(JSON.stringify(jsonPayload));
                }
            });

            wsServer.on('close', async () => {
                const outputImages = await getOutputImages(promptId);

                wsClient.send(JSON.stringify({ type: 'completed', data: outputImages }));
            });
        } catch (error) {
            if (error.code === 'ERR_BAD_REQUEST') {
                wsClient.send(
                    JSON.stringify({
                        type: 'error',
                        message:
                            'Bad Request error when sending workflow request. This can happen if you have disabled extensions that are required to run the workflow.',
                    })
                );
                return;
            }

            console.error('Unknown error when generating image:', error);
            wsClient.send(
                JSON.stringify({
                    type: 'error',
                    message: 'Unknown error when generating image. Check console for more information.',
                })
            );
        }
    });

    wsServer.on('error', (error) => {
        if (error.code === 'ECONNREFUSED') {
            logger.warn(`Could not connect to ComfyUI when attempting to generate image: ${error}`);
            wsClient.send(
                JSON.stringify({
                    type: 'error',
                    message: 'Could not connect to ComfyUI. Check console for more information.',
                })
            );
        } else {
            console.error('WebSocket error when generating image:', error);
            wsClient.send(
                JSON.stringify({
                    type: 'error',
                    message: 'Unknown WebSocket error when generating image. Check console for more information.',
                })
            );
        }
    });
}

/**
 * Formats a ComfyUI version string to a semver-compatible version string.
 *
 * The part after the first '-' indicates how many commits since the downloaded release,
 * we can just use this as another part of the version as `major > minor > patch > commit`
 * in order to be able to check if a feature from a certain commit is available in ComfyUI.
 *
 * E.g. `v0.2.2-84-gd1cdf51` becomes `0.2.2.84`.
 *
 * @param {string} versionString The input ComfyUI version string.
 * @returns {string} The output semver-compatible version string.
 */
function formatVersion(versionString) {
    return versionString
        .replace('v', '')
        .replace(/-[a-z0-9]+$/, '')
        .replace(/-/g, '.');
}

/**
 * Compares a passed `comfyui_version` string with a requirement version string.
 *
 * @param {string} version The string version for comfyui_version. E.g. `v0.2.2-84-gd1cdf51`
 * @param {string} versionRequirement The version to check against. Commit hash is not included in comparison. E.g. `0.2.2-49`
 * @returns {boolean} If the version is greater than or equal to the requirement version.
 */
function versionCheck(version, versionRequirement) {
    const versionSplit = formatVersion(version).split('.');
    const versionRequirementSplit = formatVersion(versionRequirement).split('.');

    for (const versionPart in versionSplit) {
        if (parseInt(versionSplit[versionPart]) > parseInt(versionRequirementSplit[versionPart])) {
            return true;
        }
    }

    return false;
}

/**
 * Check if ComfyUI is running and meets minimum required version
 * @returns
 */
async function comfyUICheck() {
    let comfyUIVersion = null;
    let comfyUIVersionRequirement = false;

    const minComfyUIVersion = config.developer.min_comfyui_version;

    try {
        await comfyuiAxios.get('/');

        logger.success(`ComfyUI is running.`);
    } catch (error) {
        const errorCode = error.code;

        if (errorCode === 'ECONNREFUSED') {
            logger.warn(
                `Could not connect to ComfyUI, make sure it is running and accessible at the url in the config.json file.`
            );
            return;
        } else {
            logger.warn(`Unknown error when checking for ComfyUI: ${error}`);
        }
    }

    try {
        const infoRequest = await comfyuiAxios.get('/system_stats');

        comfyUIVersion = infoRequest.data.system.comfyui_version;

        if (comfyUIVersion === undefined || comfyUIVersion === null) {
            comfyUIVersion = '>=0.2.0';
        }

        comfyUIVersionRequirement = versionCheck(comfyUIVersion, minComfyUIVersion);
    } catch (error) {
        logger.warn(`Could not check ComfyUI version: ${error}`);
    }

    if (!comfyUIVersionRequirement) {
        logger.warn(
            `Your ComfyUI version (${comfyUIVersion}) is lower than the required version (${minComfyUIVersion}). ComfyUIMini may not behave as exptected.`
        );
        return;
    }

    logger.success(`ComfyUI version: ${comfyUIVersion}`);
}

async function interruptGeneration() {
    const response = await comfyuiAxios.post('/interrupt');

    return response.data;
}

module.exports = {
    generateImage,
    getQueue,
    getHistory,
    comfyUICheck,
    interruptGeneration,
    getImage,
    getModelTypesList,
    getItemsForSelectType
};
