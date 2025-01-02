import { comfyUIAxios } from '../comfyUIAxios';
import fs from 'fs';
import path from 'path';
import config from 'config';

async function getImage(filename: string, subfolder: string, type: string) {
    const params = new URLSearchParams({ filename, subfolder, type });

    try {
        const response = await comfyUIAxios.get(`/view?${params.toString()}`, { responseType: 'arraybuffer' });

        return response;
    } catch (err: unknown) {
        if (err instanceof Error && 'code' in err) {
            if (err.code === 'ECONNREFUSED') {
                // Fallback if ComfyUI is unavailable
                if (type === 'output') {
                    const readFile = fs.readFileSync(path.join(config.get('output_dir'), subfolder, filename));

                    return {
                        data: readFile,
                        headers: {
                            'content-type': 'image/png',
                            'content-length': readFile.length,
                        },
                    };
                }
            }
        }

        console.error('Unknown error when fetching image:', err);
        return null;
    }
}

export default getImage;
