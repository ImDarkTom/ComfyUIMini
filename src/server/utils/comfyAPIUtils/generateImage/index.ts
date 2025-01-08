import WebSocket from 'ws';
import config from 'config';
import { Workflow } from '@shared/types/Workflow';
import logger from 'server/utils/logger';
import { clientId, httpsAgent } from '../comfyUIAxios';
import getQueue from '../getQueue';
import getOutputImages from './getOutputImages';
import queuePrompt from './queuePrompt';
import bufferIsText from './bufferIsText';

function initialiseComfyWebSocket() {
    const comfyuiWsUrl: string = config.get('comfyui_ws_url');
    const wsOptions: WebSocket.ClientOptions = {};

    if (comfyuiWsUrl.startsWith('wss://')) {
        if (config.get('reject_unauthorised_cert')) {
            logger.warn(
                'Reject unauthorised certificates is enabled, this may cause issues when attempting to connect to a wss:// ComfyUI websocket.'
            );
        }

        wsOptions.agent = httpsAgent;
    }

    return new WebSocket(`${comfyuiWsUrl}/ws?clientId=${clientId}`, wsOptions);
}

async function handleOpenComfyWsConnection(comfyWsConnection: WebSocket, promptId: string) {
    try {
        logger.logOptional('queue_image', 'Queued image.');

        const queueJson = await getQueue();

        if (!queueJson['queue_running'][0]) {
            // If there is no running queue after we have queued an image that most likely
            // means that we have ran the workflow before and ComfyUI is reusing the output image.

            sendCachedImages(comfyWsConnection, promptId);
        } else {
            // Otherwise, we have queued generating the image.

            const queuedImagesAmount = queueJson['queue_running'][0][4].length
            comfyWsConnection.send(JSON.stringify({ type: 'total_images', data: queuedImagesAmount }));
        }
    } catch (error) {
        handleComfyWsError(comfyWsConnection, error);
    }
}

async function sendCachedImages(comfyWsConnection: WebSocket, promptId: string) {
    logger.logOptional('generation_finish', 'Using cached generation result.');

    const cachedImages = await getOutputImages(promptId);

    comfyWsConnection.send(JSON.stringify({ type: 'total_images', data: Object.values(cachedImages).length }));
    comfyWsConnection.send(JSON.stringify({ type: 'completed', data: cachedImages }));
}

function handleComfyWsError(comfyWsConnection: WebSocket, error: unknown) {
    if (error instanceof Error && 'code' in error) {
        if (error.code === 'ERR_BAD_REQUEST') {
            comfyWsConnection.send(
                JSON.stringify({
                    type: 'error',
                    message:
                        'Bad Request error when sending workflow request. This can happen if you have disabled extensions that are required to run the workflow.',
                })
            );
            return;
        }

        console.error('Unknown error when generating image:', error);
        comfyWsConnection.send(
            JSON.stringify({
                type: 'error',
                message: 'Unknown error when generating image. Check console for more information.',
            })
        );
    }
}

async function generateImage(workflowPrompt: Workflow, wsClient: WebSocket) {
    const comfyWsConnection = initialiseComfyWebSocket();
    let promptId: string | null = null;

    comfyWsConnection.on('open', async () => {
        const promptData = await queuePrompt(workflowPrompt);
        promptId = promptData.prompt_id;

        handleOpenComfyWsConnection(comfyWsConnection, promptId)
    });

    comfyWsConnection.on('message', async (data) => {
        if (!Buffer.isBuffer(data)) {
            logger.warn('Recieved non-buffer data from ComfyUI websocket:', data);
            return;
        }

        if (bufferIsText(data)) {
            const message = JSON.parse(data.toString());

            if (message.type === 'status') {
                if (message.data.status.exec_info.queue_remaining == 0) {
                    logger.logOptional('generation_finish', 'Image generation finished.');
                    comfyWsConnection.close();
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

    comfyWsConnection.on('close', async () => {
        if (typeof promptId !== 'string') {
            wsClient.send(JSON.stringify({ type: 'error', message: 'Uninitialised promptId.' }));
            return;
        }

        const outputImages = await getOutputImages(promptId);

        wsClient.send(JSON.stringify({ type: 'completed', data: outputImages }));
    });

    comfyWsConnection.on('error', (error) => handleComfyWsError(comfyWsConnection, error));
}

export default generateImage;
