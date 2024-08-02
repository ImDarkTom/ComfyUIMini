const axios = require('axios');
const { logSuccess, logWarning } = require('./logger');
const config = require('../../config.json');
const os = require('os');

async function checkForComfyUI() {
    try {
        const responseCodeMeaning = {
            200: "ComfyUI is running."
        };

        const request = await axios.get(config.comfyui_url);
        const status = request.status;

        logSuccess(`${status}: ${responseCodeMeaning[status] || "Unknown response."}`);
    } catch (err) {
        const errorCode = err.code;

        const errorMeaning = {
            "ECONNREFUSED": "Make sure ComfyUI is running and is accessible at the URL in the config.json file."
        }

        logWarning(`${errorCode}: ${errorMeaning[errorCode] || err}`)
    }
}

function getLocalIP() {
    function isVirtualNetwork(interfaceName) {
        const commonVirtualNetworkNames = ['vmnet', 'vboxnet', 'vethernet', 'virtualbox', 'vmware'];
        return commonVirtualNetworkNames.some(virtualNet => interfaceName.toLowerCase().startsWith(virtualNet));
    }
    
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const addresses = networkInterfaces[interfaceName];

        for (const address of addresses) {
            if (address.family === 'IPv4' && !address.internal && !isVirtualNetwork(interfaceName)) {
                return address.address;
            }
        }
    }

    return '127.0.0.1';
}

module.exports = {
    checkForComfyUI,
    getLocalIP
}