import getOutputImages from "../getOutputImages";
import WebSocket from 'ws';

async function handleComfyWsClose(clientWs: WebSocket, promptId: string) {
    if (typeof promptId !== 'string') {
        clientWs.send(JSON.stringify({ type: 'error', message: 'Uninitialised promptId.' }));
        return;
    }

    const outputImages = await getOutputImages(promptId);

    clientWs.send(JSON.stringify({ type: 'completed', data: outputImages }));
}

export default handleComfyWsClose;