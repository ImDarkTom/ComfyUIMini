const os = require('os');

function getLocalIp() {
    function isVirtualNetwork(interfaceName) {
        const commonVirtualNetworkNames = ['vmnet', 'vboxnet', 'vethernet', 'virtualbox', 'vmware'];
        return commonVirtualNetworkNames.some((virtualNet) => interfaceName.toLowerCase().startsWith(virtualNet));
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

module.exports = getLocalIp;
