import fs from 'fs';
import path from 'path';
import paths from './paths';

function initialiseConfig() {
    const configDir = path.join(paths.config, 'default.json');

    if (!fs.existsSync(configDir)) {
        try {
            fs.copyFileSync(path.join(paths.config, 'default.example.json'), configDir);
            console.log(
                'Creating config file, you may need to manually configure some options for full functionality.'
            );
        } catch (err) {
            console.error('Error when creating config file:', err);
            process.exit(1);
        }
    }
}

export { initialiseConfig };
