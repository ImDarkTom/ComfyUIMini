import axios from 'axios';
import config from 'config';
import crypto from 'crypto';
import https from 'https';
import { getAppVersion } from 'server/utils/getAppVersion';

const clientId = crypto.randomUUID();
const appVersion = getAppVersion();
const comfyUIUrl: string = config.get('comfyui_url');

const httpsAgent = new https.Agent({
    rejectUnauthorized: config.get('reject_unauthorised_cert') || false,
});

const comfyUIAxios = axios.create({
    baseURL: comfyUIUrl,
    timeout: 10000,
    headers: {
        'User-Agent': `ComfyUIMini/${appVersion}`,
    },
    httpsAgent: httpsAgent,
});

export { comfyUIAxios, clientId, comfyUIUrl, httpsAgent };
