const path = require('path');
const fs = require('fs');
const { optionalLog } = require('./logger');

const dataDirPath = path.join(__dirname, '..', '..', 'data');
const cacheFilePath = path.join(dataDirPath, 'workflowNamesCache.json');

let workflowNamesCacheJson = {};

function checkDataDirectoryExists() {
    if (!fs.existsSync(dataDirPath)) {
        optionalLog(global.config.optional_log.cache, "Creating data directory...");
        fs.mkdirSync(dataDirPath);
    }
}

function checkCacheFileExists() {
    if (!fs.existsSync(cacheFilePath)) {
        optionalLog(global.config.optional_log.cache, "Creating cache file...");
        fs.writeFileSync(cacheFilePath, '');
    }
}

function checkWorkflowCache(workflowsFolder, jsonFileList) {
    checkDataDirectoryExists();
    checkCacheFileExists();

    const cache = fs.readFileSync(cacheFilePath);

    let cacheJson = {};
    try {
        cacheJson = JSON.parse(cache);
        optionalLog(global.config.optional_log.cache, `Loaded ${Object.keys(cacheJson).length} cached workflow names.`);
    } catch (err) {
        if (err.type === "SyntaxError") {
            cacheJson = {};
            optionalLog(global.config.optional_log.cache, "Creating empty cache file...");
        }
    }

    const cachedFilesList = Object.keys(cacheJson);

    let cacheModified = false;
    for (const jsonWorkflowFilename of jsonFileList) {
        if (cachedFilesList.includes(jsonWorkflowFilename)) {
            continue;
        }

        const workflowFileContents = fs.readFileSync(path.join(workflowsFolder, jsonWorkflowFilename));

        const workflowName = JSON.parse(workflowFileContents)["_comfyuimini_meta"].title;

        cacheJson[jsonWorkflowFilename] = workflowName;
        cacheModified = true;
    }

    if (cacheModified) {
        optionalLog(global.config.optional_log.cache, `Cache modified, total entries: ${cacheJson.length}`);
        workflowNamesCacheJson = cacheJson;
        fs.writeFileSync(cacheFilePath, JSON.stringify(cacheJson, null, 2));
        optionalLog(global.config.optional_log.cache, "Saved cache.");
    }

    global.serverWorkflowNames = cacheJson;
}

module.exports = {
    checkWorkflowCache
}