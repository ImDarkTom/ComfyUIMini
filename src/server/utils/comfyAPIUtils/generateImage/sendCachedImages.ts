import logger from "server/utils/logger";
import getOutputImages from "./getOutputImages";
import WebSocket from "ws";

async function sendCachedImages(clientWs: WebSocket, promptId: string) {
    logger.logOptional('generation_finish', 'Using cached generation result.');

    const cachedImages = await getOutputImages(promptId);

    clientWs.send(JSON.stringify({ type: 'total_images', data: Object.values(cachedImages).length }));
    clientWs.send(JSON.stringify({ type: 'completed', data: cachedImages }));
}

export default sendCachedImages;