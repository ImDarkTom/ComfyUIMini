import { ObjectInfoPartial } from '@shared/types/ComfyObjectInfo';
import { comfyUIAxios } from '../comfyUIAxios';
import logger from 'server/utils/logger';

async function getRawObjectInfo(): Promise<ObjectInfoPartial | null> {
    try {
        const response = await comfyUIAxios.get('/api/object_info');

        return response.data;
    } catch (error) {
        logger.warn(`Could not get ComfyUI object info: ${error}`);
        return null;
    }
}

export default getRawObjectInfo;
