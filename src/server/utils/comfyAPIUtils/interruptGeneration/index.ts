import { comfyUIAxios } from '../comfyUIAxios';

async function interruptGeneration() {
    const response = await comfyUIAxios.post('/interrupt');

    return response.data;
}

export default interruptGeneration;
