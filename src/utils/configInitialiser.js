const fs = require('fs');
const path = require('path');
const logger = require('./logger');

function initialiseConfig() {
    const configDir = path.join(__dirname, '..', '..', 'config', 'default.json');

    if (!fs.existsSync(configDir)) {
        try {
            fs.copyFileSync(path.join(__dirname, '..', '..', 'config', 'default.example.json'), configDir);
            console.log('Creating config file, you may need to manually configure some options for full functionality.');
        } catch(err) {
            console.error('Error when creating config file:', err);
            process.exit(1);
        }
    }
}

module.exports = { initialiseConfig };