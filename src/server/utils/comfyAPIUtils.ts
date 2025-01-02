import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import config from 'config';
import FormData from 'form-data';
import logger from './logger';
import { Workflow } from '@shared/types/Workflow';
import { HistoryResponse } from '@shared/types/History';
import { ObjectInfoPartial } from '@shared/types/ComfyObjectInfo';
import { clientId, comfyuiAxios, httpsAgent } from './comfyAPIUtils/comfyUIAxios';
import comfyUICheck from './comfyAPIUtils/startupCheck';

async function queuePrompt(workflowPrompt: Workflow) {
    const postContents = { prompt: workflowPrompt, client_id: clientId };

    const response = await comfyuiAxios.post('/prompt', postContents, {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return response.data;
}

async function getImage(filename: string, subfolder: string, type: string) {
    const params = new URLSearchParams({ filename, subfolder, type });

    try {
        const response = await comfyuiAxios.get(`/view?${params.toString()}`, { responseType: 'arraybuffer' });

        return response;
    } catch (err: unknown) {
        if (err instanceof Error && 'code' in err) {
            if (err.code === 'ECONNREFUSED') {
                // Fallback if ComfyUI is unavailable
                if (type === 'output') {
                    const readFile = fs.readFileSync(path.join(config.get('output_dir'), subfolder, filename));

                    return {
                        data: readFile,
                        headers: {
                            'content-type': 'image/png',
                            'content-length': readFile.length,
                        },
                    };
                }
            }
        }

        console.error('Unknown error when fetching image:', err);
        return null;
    }
}

/**
 * Gets the list of available models.
 *
 * @returns {Promise<string[]>} A promise that resolves to an array of strings representing the available models.
 */
async function getModelTypesList(): Promise<string[]> {
    try {
        const response = await comfyuiAxios.get('/models');

        return response.data;
    } catch (error) {
        logger.warn('Could not get model types list from ComfyUI:', error);
        return [];
    }
}

/**
 * Gets the list of available models for a specific model type.
 *
 * @param {string} modelType The model type to get the list of available models for.
 * @returns {Promise<string[]>} A promise that resolves to a list of strings representing the available models for the specified model type.
 */
async function getItemsForModelType(modelType: string): Promise<string[]> {
    const response = await comfyuiAxios.get(`/models/${modelType}`);

    return response.data;
}

async function generateProxiedImageUrl(filename: string, subfolder: string, folderType: string) {
    const params = new URLSearchParams({ filename, subfolder, type: folderType });

    return `/comfyui/image?${params.toString()}`;
}

async function getHistory(promptId: string): Promise<HistoryResponse> {
    const response = await comfyuiAxios.get(`/history/${promptId}`);

    return response.data;
}

async function getQueue() {
    const response = await comfyuiAxios.get('/queue');

    return response.data;
}

async function getOutputImages(promptId: string) {
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

function bufferIsText(buffer: Buffer) {
    try {
        const text = buffer.toString('utf8');
        JSON.parse(text);
        return true;
    } catch {
        return false;
    }
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

async function interruptGeneration() {
    const response = await comfyuiAxios.post('/interrupt');

    return response.data;
}

async function fetchRawObjectInfo(): Promise<ObjectInfoPartial | null> {
    try {
        const response = await comfyuiAxios.get('/api/object_info');

        return response.data;
    } catch (error) {
        logger.warn(`Could not get ComfyUI object info: ${error}`);
        return null;
    }
}

async function uploadImage(file: Express.Multer.File) {
    try {
        const form = new FormData();
        form.append('image', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
        });

        const response = await comfyuiAxios.post('/upload/image', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        return response;
    } catch (error) {
        return { error: error };
    }
}

export {
    generateImage,
    getQueue,
    getHistory,
    comfyUICheck,
    interruptGeneration,
    getImage,
    getModelTypesList,
    getItemsForModelType,
    fetchRawObjectInfo,
    uploadImage,
};
