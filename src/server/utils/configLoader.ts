import fs from 'fs';
import path from 'path';

type ConfigValue = string | number | boolean | ConfigValue[] | { [key: string]: ConfigValue };
type Config = { [key: string]: ConfigValue };

let configCache: Config | null = null;

/**
 * Loads the configuration from the default.json file
 */
function loadConfig(): Config {
    if (configCache !== null) {
        return configCache;
    }

    const configPath = path.join(process.cwd(), 'config', 'default.json');
    
    try {
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            configCache = JSON.parse(configData) as Config;
        } else {
            console.warn('Config file not found, using empty config');
            configCache = {};
        }
    } catch (error) {
        console.error('Error loading config:', error);
        configCache = {};
    }

    return configCache;
}

/**
 * Gets a configuration value by key path (e.g., 'tagAutocomplete.enabled')
 */
export function getConfig(keyPath: string): ConfigValue | undefined {
    const config = loadConfig();
    
    if (!keyPath) {
        return config;
    }
    
    const keys = keyPath.split('.');
    let value: ConfigValue = config;
    
    for (const key of keys) {
        if (value && typeof value === 'object' && !Array.isArray(value) && key in value) {
            value = value[key];
        } else {
            return undefined;
        }
    }
    
    return value;
}

/**
 * Gets the CSV whitelist from configuration with proper type checking
 */
export function getCsvWhitelist(): string[] {
    const whitelistConfig = getConfig('tagAutocomplete.csvWhitelist');
    return Array.isArray(whitelistConfig) ? whitelistConfig as string[] : ['tags.csv'];
}

/**
 * Checks if CSV validation is enabled
 */
export function isValidationEnabled(): boolean {
    return getConfig('tagAutocomplete.validation.enabled') !== false;
}

/**
 * Gets the path to a CSV file in the config directory
 */
export function getCsvPath(fileName: string): string {
    return path.join(process.cwd(), 'config', fileName);
}

/**
 * Clears the config cache (useful for testing or config reloading)
 */
export function clearConfigCache(): void {
    configCache = null;
}
