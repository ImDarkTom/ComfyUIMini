import path from 'path';

// Default configuration values for tag autocomplete
const DEFAULT_CONFIG = {
    tagAutocomplete: {
        enabled: true,
        useUnderscores: true,
        csvWhitelist: ['tags.csv'],
        validation: {
            enabled: true,
            maxFileSize: 52428800, // 50MB
            maxLines: 1000000,
            maxLineLength: 10000,
            maxTagLength: 200,
            maxAliasesPerTag: 100
        }
    }
};

/**
 * Gets a configuration value by key path (e.g., 'tagAutocomplete.enabled')
 * Uses default values since config is now handled by the frontend
 */
export function getConfig(keyPath: string): any {
    if (!keyPath) {
        return DEFAULT_CONFIG;
    }
    
    const keys = keyPath.split('.');
    let value: any = DEFAULT_CONFIG;
    
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
 * Gets the path to a CSV file in the data directory
 */
export function getCsvPath(fileName: string): string {
    return path.join(process.cwd(), 'data', fileName);
}