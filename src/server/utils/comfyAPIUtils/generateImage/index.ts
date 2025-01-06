import WebSocket from 'ws';
import config from 'config';
import { Workflow } from '@shared/types/Workflow';
import logger from 'server/utils/logger';
import { clientId, httpsAgent } from '../comfyUIAxios';
import getHistory from '../getHistory';
import getQueue from '../getQueue';
import bufferIsText from './bufferIsText';
import queuePrompt from './queuePrompt';

async function getOutputImages(promptId: string) {
    async function generateProxiedImageUrl(filename: string, subfolder: string, folderType: string) {
        const params = new URLSearchParams({ filename, subfolder, type: folderType });

        return `/comfyui/image?${params.toString()}`;
    }

    const outputImages: Record<string, string[]> = {};

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

async function generateImage(workflowPrompt: Workflow, wsClient: WebSocket) {
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

    const wsServer = new WebSocket(`${config.get('comfyui_ws_url')}/ws?clientId=${clientId}`, wsOptions);

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
                if (!Buffer.isBuffer(data)) {
                    logger.warn('Recieved non-buffer data from ComfyUI websocket:', data);
                    return;
                }

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
            if (error instanceof Error && 'code' in error) {
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
        }
    });

    wsServer.on('error', (error) => {
        if ('code' in error) {
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
        }
    });
}

export default generateImage;
