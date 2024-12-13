import fs from 'fs';
import path from 'path';

let cachedVersion: null | string;

export function getAppVersion(): string {
    if (!cachedVersion) {
        const packageJsonPath = path.join(__dirname, '..', '..', '..', 'package.json');
        cachedVersion = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;

        if (!cachedVersion) {
            throw new Error('Could not get app version from package.json');
        }
    }

    return cachedVersion;
}