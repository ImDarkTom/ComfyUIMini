const { default: axios } = require('axios');
const config = require('../../config.json');
const WebSocket = require('ws');
const { optionalLog, logWarning } = require('./logger');
const { logSuccess } = require('./logger');
const crypto = require('crypto');

const clientId = crypto.randomUUID();

async function queuePrompt(workflowPrompt, clientId) {
    const postContents = { 'prompt': workflowPrompt, client_id: clientId };

    const response = await axios.post(`${config.comfyui_url}/prompt`, postContents, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return response.data;
}

async function getImage(filename, subfolder, type) {
    const params = new URLSearchParams({ filename, subfolder, type });

    const response = await axios.get(`${config.comfyui_url}/view?${params.toString()}`, { responseType: 'arraybuffer' });

    return response;
}

async function generateProxiedImageUrl(filename, subfolder, folderType) {
    const params = new URLSearchParams({ filename, subfolder, type: folderType });

    return `/comfyui/image?${params.toString()}`;
}

async function getHistory(promptId) {
    const response = await axios.get(`${config.comfyui_url}/history/${promptId}`);

    return response.data;
}

async function getQueue() {
    const response = await axios.get(`${config.comfyui_url}/queue`);

    return response.data;
}

async function getOutputImages(promptId) {
    const outputImages = {};

    const history = await getHistory(promptId);
    const historyOutputs = history[promptId].outputs;

    for (const nodeId in historyOutputs) {
        const nodeOutput = historyOutputs[nodeId];
        if (nodeOutput.images) {
            const imageUrls = await Promise.all(nodeOutput.images.map(async (image) => {
                return await generateProxiedImageUrl(image.filename, image.subfolder, image.type);
            }));
            outputImages[nodeId] = imageUrls;
        }
    }

    return outputImages;
}

async function generateImage(workflowPrompt, wsClient) {
    const wsServer = new WebSocket(`${config.comfyui_ws_url}/ws?clientId=${clientId}`);

    wsServer.on('open', async () => {
        try {
            const promptData = await queuePrompt(workflowPrompt);
            const promptId = promptData.prompt_id;

            optionalLog(config.optional_log.queue_image, "Queued image.");

            const queueJson = await getQueue();
            let totalImages;

            if (queueJson["queue_running"][0] === undefined) {
                // Exact workflow was ran before and was cached by ComfyUI.
                const cachedImages = await getOutputImages(promptId);
                optionalLog(config.optional_log.generation_finish, "Using cached generation result.");

                wsClient.send(JSON.stringify({ status: 'completed', data: cachedImages }));
                
            } else {
                totalImages = queueJson["queue_running"][0][4].length;
            }

            wsClient.send(JSON.stringify({status: "total_images", data: totalImages}));

            wsServer.on('message', async (data) => {
                const message = JSON.parse(data.toString());

                if (message.type === "status") {
                    if (message.data.status.exec_info.queue_remaining == 0) {
                        optionalLog(config.optional_log.generation_finish, "Image generation finished.");
                        wsServer.close();
                    }
                }

                wsClient.send(JSON.stringify(message));
            });

            wsServer.on('close', async () => {
                const outputImages = await getOutputImages(promptId);

                wsClient.send(JSON.stringify({ status: 'completed', data: outputImages }));
            });
        } catch (error) {
            console.error("Unknown error when generating image:", error);
            wsClient.send(JSON.stringify({ status: 'error', message: "Unknown error when generating image. Check console for more information." }));
        }
    });

    wsServer.on('error', (error) => {
        if (error.code === "ECONNREFUSED") {
            logWarning(`Could not connect to ComfyUI when attempting to generate image: ${error}`);
            wsClient.send(JSON.stringify({ status: 'error', message: 'Could not connect to ComfyUI. Check console for more information.' }));
        } else {
            console.error("WebSocket error when generating image:", error);
            wsClient.send(JSON.stringify({ status: 'error', message: 'Unknown WebSocket error when generating image. Check console for more information.' }));
        }
    })

}

async function checkForComfyUI() {
    try {
        const responseCodeMeaning = {
            200: "ComfyUI is running."
        };

        const request = await axios.get(config.comfyui_url);
        const status = request.status;

        logSuccess(`${status}: ${responseCodeMeaning[status] || "Unknown response."}`);
    } catch (err) {
        const errorCode = err.code;

        const errorMeaning = {
            "ECONNREFUSED": "Make sure ComfyUI is running and is accessible at the URL in the config.json file."
        }

        logWarning(`${errorCode}: ${errorMeaning[errorCode] || err}`)
    }
}

async function interruptGeneration() {
    const response = await axios.post(`${config.comfyui_url}/interrupt`);

    return response.data;
}

module.exports = {
    generateImage,
    getQueue,
    getHistory,
    checkForComfyUI,
    interruptGeneration,
    getImage
};