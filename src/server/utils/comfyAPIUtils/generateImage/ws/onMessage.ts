import logger from "server/utils/logger";
import WebSocket from "ws";

/**
 * Handles recieving messages from ComfyUI WebSocket.
 * @param clientWs The WebSocket connection to the frontend client.
 * @param comfyWs The WebSocket connection to the ComfyUI instance.
 * @param data The data recieved from the ComfyUI WebSocket.
 * @param isBinary Whether the data is binary or not, i.e. if it is an image.
 */
function handleComfyWsMessage(clientWs: WebSocket, comfyWs: WebSocket, data: WebSocket.Data, isBinary: boolean) {
    if (!Buffer.isBuffer(data)) {
        logger.warn('Recieved non-buffer data from ComfyUI websocket:', data);
        return;
    }

    if (isBinary) {
        try {
            handleSendImageBuffer(clientWs, data);
        } catch (error) {
            logger.warn('Failed to handle sending image buffer:', error);
        }
    } else {
        try {
            handleSendMessage(clientWs, comfyWs, data);
        } catch (error) {
            logger.warn('Failed to handle sending message:', error);
        }
    }
}

function handleSendImageBuffer(clientWs: WebSocket, buffer: Buffer<ArrayBufferLike>) {
    // Handle image buffers like ComfyUI client
    const imageType = buffer.readUInt32BE(0);
    let imageMime;

    switch (imageType) {
        case 1:
            imageMime = 'image/jpeg';
            break;
        case 2:
            imageMime = 'image/png';
            break;
        default:
            imageMime = 'image/jpeg';
    }

    const imageBlob = buffer.slice(8);
    const base64Image = imageBlob.toString('base64');

    const jsonPayload = {
        type: 'preview',
        data: { image: base64Image, mimetype: imageMime },
    };

    clientWs.send(JSON.stringify(jsonPayload));
}

function handleSendMessage(clientWs: WebSocket, comfyWs: WebSocket, data: Buffer<ArrayBufferLike>) {
    const messageString = data.toString();
    const message = JSON.parse(messageString);

    if (message.type === 'status') {
        if (message.data.status.exec_info.queue_remaining == 0) {
            logger.logOptional('generation_finish', 'Image generation finished.');
            comfyWs.close();
        }
    } else if (message.type === 'progress') {
        clientWs.send(JSON.stringify(message));
    }
}

export default handleComfyWsMessage;