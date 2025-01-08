import { Workflow } from "@shared/types/Workflow";
import { clientId, comfyUIAxios } from "../comfyUIAxios";

async function queuePrompt(workflowPrompt: Workflow): Promise<QueuePromptResponse> {
    const postContents = { prompt: workflowPrompt, client_id: clientId };

    const response = await comfyUIAxios.post('/prompt', postContents, {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return response.data;
}

export default queuePrompt;