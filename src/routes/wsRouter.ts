import WebSocket from 'ws';
import { generateImage } from '../utils/comfyAPIUtils';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import logger from '../utils/logger';

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const prompt = JSON.parse(message.toString());
        await generateImage(prompt, ws);
    });
});

const handleUpgrade = (request: IncomingMessage, socket: Socket, head: Buffer) => {
    if (!request.url) {
        logger.warn('No url property in WebSocket request.');
        socket.destroy();
        return;
    }
    
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

    if (pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
};

export {
    wss,
    handleUpgrade,
};
