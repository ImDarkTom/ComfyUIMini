import logger from 'server/utils/logger';
import config from 'config';
import { comfyUIAxios, comfyUIUrl } from '../comfyUIAxios';
import versionCheck from './versionCheck';
import formatVersion from './formatVersion';

/**
 * Check if ComfyUI is running and meets minimum required version.
 */
async function comfyUICheck() {
    let comfyUIVersion = null;
    let comfyUIVersionRequirement = false;

    const minComfyUIVersion: string = config.get('developer.min_comfyui_version');

    if (!minComfyUIVersion) {
        logger.warn('No minimum ComfyUI version specified in config.');
        return;
    }

    if (comfyUIUrl.startsWith('https://')) {
        if (config.get('reject_unauthorised_cert')) {
            logger.warn(
                'Reject unauthorised certificates is enabled, this may cause issues when attempting to connect to a https:// ComfyUI websocket.'
            );
        }
    }

    try {
        await comfyUIAxios.get('/');

        logger.success(`ComfyUI is running.`);
    } catch (error) {
        if (error instanceof Error && 'code' in error) {
            const errorCode = error.code;

            if (errorCode === 'ECONNREFUSED') {
                logger.warn(
                    `Could not connect to ComfyUI, make sure it is running and accessible at the url in the config.json file.`
                );
                return;
            } else {
                logger.warn(`Unknown error when checking for ComfyUI: ${error}`);
            }
        }
    }

    try {
        const infoRequest = await comfyUIAxios.get('/system_stats');

        comfyUIVersion = infoRequest.data.system.comfyui_version;

        if (comfyUIVersion === undefined || comfyUIVersion === null) {
            comfyUIVersion = '>=0.2.0';
        }

        const parsedComfyUIVersion = formatVersion(comfyUIVersion);
        const parsedMinComfyUIVersion = formatVersion(minComfyUIVersion);

        comfyUIVersionRequirement = versionCheck(parsedComfyUIVersion, parsedMinComfyUIVersion);
    } catch (error) {
        logger.warn(`Could not check ComfyUI version: ${error}`);
    }

    if (!comfyUIVersionRequirement) {
        logger.warn(
            `Your ComfyUI version (${comfyUIVersion}) is lower than the required version (${minComfyUIVersion}). ComfyUIMini may not behave as expected.`
        );
        return;
    }

    logger.success(`ComfyUI version: ${comfyUIVersion}`);
}

export default comfyUICheck;
