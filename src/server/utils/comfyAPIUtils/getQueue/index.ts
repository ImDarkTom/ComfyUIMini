import { comfyUIAxios } from '../comfyUIAxios';

async function getQueue() {
    const response = await comfyUIAxios.get('/queue');

    return response.data;
}

export default getQueue;
