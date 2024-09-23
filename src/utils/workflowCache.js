const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const dataDirPath = path.join(__dirname, '..', '..', 'data');
const cacheFilePath = path.join(dataDirPath, 'workflowNamesCache.json');

let workflowNamesCacheJson = {};

function checkDataDirectoryExists() {
    if (!fs.existsSync(dataDirPath)) {
        logger.logOptional("cache", "Creating data directory...");
        fs.mkdirSync(dataDirPath);
    }
}

function checkCacheFileExists() {
    if (!fs.existsSync(cacheFilePath)) {
        logger.logOptional("cache", "Creating cache file...");
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
        logger.logOptional("cache", `Loaded ${Object.keys(cacheJson).length} cached workflow names.`);
    } catch (err) {
        if (err.type === "SyntaxError") {
            cacheJson = {};
            logger.logOptional("cache", "Creating empty cache file...");
        }
    }

    const cachedFilesList = Object.keys(cacheJson);

    let cacheModified = false;
    for (const jsonWorkflowFilename of jsonFileList) {
        if (cachedFilesList.includes(jsonWorkflowFilename)) {
            continue;
        }

        const workflowFileContents = fs.readFileSync(path.join(workflowsFolder, jsonWorkflowFilename));
        const parsedWorkflowFileContents = JSON.parse(workflowFileContents);

        if (!parsedWorkflowFileContents["_comfyuimini_meta"]) {
            logger.warn(`${jsonWorkflowFilename} does not have any attached ComfyUIMini metadata, skipping...`);
            continue;
        }

        const workflowMetadata = JSON.parse(workflowFileContents)["_comfyuimini_meta"];

        cacheJson[jsonWorkflowFilename] = {
            title: workflowMetadata.title,
            filename: jsonWorkflowFilename,
            description: workflowMetadata.description
        };
        
        cacheModified = true;
    }

    if (cacheModified) {
        logger.logOptional("cache", `Cache modified, total entries: ${cacheJson.length}`);
        workflowNamesCacheJson = cacheJson;
        fs.writeFileSync(cacheFilePath, JSON.stringify(cacheJson, null, 2));
        logger.logOptional("cache", "Saved cache.");
    }

    global.serverWorkflowMetadata = cacheJson;
}

module.exports = {
    checkWorkflowCache
}