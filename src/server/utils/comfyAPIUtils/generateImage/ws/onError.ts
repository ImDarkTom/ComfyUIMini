import WebSocket from 'ws';

function handleComfyWsError(clientWs: WebSocket, error: unknown) {
    if (error instanceof Error && 'code' in error) {
        if (error.code === 'ERR_BAD_REQUEST') {
            clientWs.send(
                JSON.stringify({
                    type: 'error',
                    message:
                        'Bad Request error when sending workflow request. This can happen if you have disabled extensions that are required to run the workflow.',
                })
            );
            return;
        }

        console.error('Unknown error when generating image:', error);
        clientWs.send(
            JSON.stringify({
                type: 'error',
                message: 'Unknown error when generating image. Check console for more information.',
            })
        );
    }
}

export default handleComfyWsError;