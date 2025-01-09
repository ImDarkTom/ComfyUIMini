import WebSocket from 'ws';
import config from 'config';
import { Workflow } from '@shared/types/Workflow';
import logger from 'server/utils/logger';
import { clientId, httpsAgent } from '../comfyUIAxios';
import queuePrompt from './queuePrompt';
import handleComfyWsMessage from './ws/onMessage';
import handleComfyWsClose from './ws/onClose';
import handleComfyWsError from './ws/onError';
import handleOpenComfyWsConnection from './ws/onOpen';

function initialiseComfyWs() {
    const comfyWsUrl: string = config.get('comfyui_ws_url');
    const comfyWsOptions: WebSocket.ClientOptions = {};

    if (comfyWsUrl.startsWith('wss://')) {
        if (config.get('reject_unauthorised_cert')) {
            logger.warn(
                'Reject unauthorised certificates is enabled, this may cause issues when attempting to connect to a wss:// ComfyUI websocket.'
            );
        }

        comfyWsOptions.agent = httpsAgent;
    }

    return new WebSocket(`${comfyWsUrl}/ws?clientId=${clientId}`, comfyWsOptions);
}

async function generateImage(workflowPrompt: Workflow, clientWs: WebSocket) {
    const comfyWsConnection = initialiseComfyWs();

    comfyWsConnection.on('open', async () => {
        const promptData = await queuePrompt(workflowPrompt);
        const promptId = promptData.prompt_id;

        await handleOpenComfyWsConnection(clientWs, promptId);

        comfyWsConnection.on('message', (data, isBinary) => handleComfyWsMessage(clientWs, comfyWsConnection, data, isBinary));
        comfyWsConnection.on('close', async () => await handleComfyWsClose(clientWs, promptId));
        comfyWsConnection.on('error', (error) => handleComfyWsError(comfyWsConnection, error));
    });
}

export default generateImage;
