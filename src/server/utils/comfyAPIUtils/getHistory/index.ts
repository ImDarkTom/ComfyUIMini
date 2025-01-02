import { HistoryResponse } from '@shared/types/History';
import { comfyUIAxios } from '../comfyUIAxios';

async function getHistory(promptId: string): Promise<HistoryResponse> {
    const response = await comfyUIAxios.get(`/history/${promptId}`);

    return response.data;
}

export default getHistory;
