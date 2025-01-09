import logger from "server/utils/logger";
import handleComfyWsError from "./onError";
import WebSocket from 'ws';
import getQueue from "../../getQueue";
import sendCachedImages from "../sendCachedImages";

async function handleOpenComfyWsConnection(clientWs: WebSocket, promptId: string) {
    try {
        logger.logOptional('queue_image', 'Queued image.');

        const queueJson = await getQueue();

        if (queueJson['queue_running'][0] === undefined) {
            // If there is no running queue after we have queued an image that most likely
            // means that we have ran the workflow before and ComfyUI is reusing the output image.

            sendCachedImages(clientWs, promptId);
        } else {
            // Otherwise, we have queued generating the image.

            const queuedImagesAmount = queueJson['queue_running'][0][4].length;
            clientWs.send(JSON.stringify({ type: 'total_images', data: queuedImagesAmount }));
        }
    } catch (error) {
        handleComfyWsError(clientWs, error);
    }
}

export default handleOpenComfyWsConnection;