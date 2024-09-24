const fs = require('fs');
const path = require('path');
const logger = require('./logger');

function checkForWorkflowsFolder() {
    const workflowsFilepath = path.join(__dirname, '..', '..', 'workflows');
    
    if (!fs.existsSync(workflowsFilepath)) {
        fs.mkdirSync(workflowsFilepath);

        logger.info(`Workflow folder not found, creating...`);
        return;
    }

    try {
        const filesList = fs.readdirSync(workflowsFilepath);
        const listJsonFiles = filesList.filter(file => path.extname(file).toLowerCase() === ".json");

        loadServerWorkflowMetadata(workflowsFilepath, listJsonFiles);
    } catch (err) {
        console.error('Error reading workflows folder: ', err);
    }
}

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

function recursiveFolderRead(folderPath, basePath, accepted_exts, fileList = []) {
    const files = fs.readdirSync(folderPath);

    files.forEach((file) => {
        const filePath = path.join(folderPath, file);

        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            recursiveFolderRead(filePath, basePath, accepted_exts, fileList);
        } else if (stats.isFile()) {

            const fileExt = path.extname(file).toLowerCase();

            if (accepted_exts.includes(fileExt)) {
                const relativePath = path.relative(basePath, filePath);
                fileList.push(relativePath);
            }
        }
    });

    return fileList;
}

function loadModelTypes() {
    const modelDirsConfigPath = path.join(__dirname, '..', '..', 'model_dirs.json');

    if (!fs.existsSync(modelDirsConfigPath)) {
        fs.copyFileSync(path.join(__dirname, '..', '..', 'model_dirs.example.json'), modelDirsConfigPath);
    }

    // readFileSync is preferable here as require() wouldn't reflect changes during runtime (user changing model path)
    const modelDirsConfigJson = JSON.parse(fs.readFileSync(modelDirsConfigPath));

    if (!modelDirsConfigJson.checkpoint || modelDirsConfigJson.checkpoint.folder_path == "path/to/checkpoints/folder") {
        logger.warn("model_dirs.json not configured, you will be unable to select models until it is set.")
        return {};
    }



    const models = {};

    for (const [modelTypeName, modelTypeInfo] of Object.entries(modelDirsConfigJson)) {
        try {
            const fileList = recursiveFolderRead(modelTypeInfo.folder_path, modelTypeInfo.folder_path, modelTypeInfo.filetypes);
    
            models[modelTypeName] = fileList;
        } catch (err) {
            if (err.code == "ENOENT") {
                logger.warn(`Invalid directory for ${modelTypeName} in model_dirs.json`);
                continue;
            }
    
            console.err("Error when reading model_dirs.json: ", err);
        }
    }

    logger.info(`Loaded ${Object.keys(models).length} model types.`);

    return models;
}

function loadSelectOptions() {
    const selectsFromFile = require('../../selects.json');

    const modelSelects = loadModelTypes();

    // Merge selectsFromFile into modelSelects, then set global var to that
    Object.assign(modelSelects, selectsFromFile);
    
    global.selectOptions = modelSelects;
}


// Workflows
function getWorkflowFromFile(fileName) {
    try {
        const fileContents = fs.readFileSync(path.join(__dirname, '..', '..', 'workflows', fileName));
        const workflowJson = JSON.parse(fileContents);

        return workflowJson;
    } catch (error) {
        if (error.code === "ENOENT") {
            return "invalid";
        }

        console.error("Error when reading workflow from file:", error);
        return "error";
    }
}

function writeToWorkflowFile(fileName, workflowJson) {
    try {
        fs.writeFileSync(path.join(__dirname, '..', '..', 'workflows', fileName), JSON.stringify(workflowJson, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error when saving edited workflow to file:', error);
        return false;
    }
}

module.exports = {
    checkForWorkflowsFolder,
    loadSelectOptions,
    loadModelTypes,
    getWorkflowFromFile,
    writeToWorkflowFile,
    recursiveFolderRead
}