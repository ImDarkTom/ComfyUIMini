function getFullConfig(): { [key: string]: unknown } {
    return JSON.parse(localStorage.getItem('config') ?? '{}');
}

function getConfig(key: string): unknown {
    const config = getFullConfig();

    return config[key];
}

function setConfig(key: string, value: unknown) {
    const config = getFullConfig();

    config[key] = value;

    localStorage.setItem('config', JSON.stringify(config));
}

function loadConfigsIntoCSS() {
    if (getConfig('workflow.compensatePreviewSaturation') === false) {
        document.documentElement.style.setProperty('--config-preview-saturation', '1');
    }
}

loadConfigsIntoCSS();

export { setConfig, getConfig };
