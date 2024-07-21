const { default: axios } = require('axios');
const config = require('../../config.json');
const uuid = require('uuid');
const WebSocket = require('ws');

const clientId = uuid.v4();

async function queuePrompt(workflowPrompt, clientId) {
    const postContents = { 'prompt': workflowPrompt, client_id: clientId };

    const response = await axios.post(`${config.comfyui_url}/prompt`, postContents, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return response.data;
}

async function getImageUrl(filename, subfolder, folderType) {
    const params = new URLSearchParams({ filename, subfolder, type: folderType });

    return `/comfyui/image?${params.toString()}`;
}

async function getHistory(promptId) {
    const response = await axios.get(`${config.comfyui_url}/history/${promptId}`);

    return response.data;
}

async function generateImage(workflowPrompt, wsClient) {
    const wsServer = new WebSocket(`${config.comfyui_ws_url}/ws?clientId=${clientId}`);
    const outputImages = {};

    wsServer.on('open', async () => {
        const promptData = await queuePrompt(workflowPrompt);
        const promptId = promptData.prompt_id;

        wsServer.on('message', async (data) => {
            const message = JSON.parse(data.toString());

            if (message.type === "status") {
                if (message.data.status.exec_info.queue_remaining == 0) {
                    console.log("Generation finished")
                    wsServer.close();
                }
            }

            wsClient.send(JSON.stringify(message));
        });

        wsServer.on('close', async () => {
            const history = await getHistory(promptId);
            const historyOutputs = history[promptId].outputs;

            for (const nodeId in historyOutputs) {
                const nodeOutput = historyOutputs[nodeId];
                if (nodeOutput.images) {
                    const imageUrls = await Promise.all(nodeOutput.images.map(async (image) => {
                        return await getImageUrl(image.filename, image.subfolder, image.type);
                    }));
                    outputImages[nodeId] = imageUrls;
                }
            }

            wsClient.send(JSON.stringify({ status: 'completed', data: outputImages }));
        });
    });

}

module.exports = generateImage;