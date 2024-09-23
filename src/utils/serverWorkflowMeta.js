const path = require('path');
const fs = require('fs');
const logger = require('./logger');

/**
 * Loads short metadata for all valid workflows in the workflows folder.
 * 
 * @param {string} workflowsFolder The folder where the workflows are stored.
 * @param {string[]} jsonFileList List of JSON files in the workflows folder.
 */
function loadServerWorkflowMetadata(workflowsFolder, jsonFileList) {
    const serverWorkflowMetadata = {};

    for (const jsonFilename of jsonFileList) {
        const jsonFileContents = fs.readFileSync(path.join(workflowsFolder, jsonFilename), 'utf8');
        const parsedJsonContents = JSON.parse(jsonFileContents);

        const jsonMetadata = parsedJsonContents["_comfyuimini_meta"];

        if (!jsonMetadata) {
            logger.warn(`${jsonFilename} does not have any attached ComfyUIMini metadata, workflows need to be imported through the UI before they can be used here.`);
            continue;
        }

        serverWorkflowMetadata[jsonFilename] = {
            title: jsonMetadata.title,
            filename: jsonFilename,
            description: jsonMetadata.description
        };
    }

    logger.info(`Found ${Object.keys(serverWorkflowMetadata).length} valid workflows in the workflow folder.`);

    global.serverWorkflowMetadata = serverWorkflowMetadata;
}

module.exports = {
    loadServerWorkflowMetadata
}