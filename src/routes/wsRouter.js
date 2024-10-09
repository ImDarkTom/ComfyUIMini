const WebSocket = require('ws');
const { generateImage } = require('../utils/comfyAPIUtils');

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const prompt = JSON.parse(message.toString());
        await generateImage(prompt, ws);
    });
});

const handleUpgrade = (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

    if (pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
};

module.exports = {
    wss,
    handleUpgrade,
};
