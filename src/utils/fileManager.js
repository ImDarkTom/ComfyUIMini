const fs = require('fs');
const path = require('path');
const { logInfo, logWarning } = require('./logger');

function checkForWorkflowsFolder() {
    const workflowsFilepath = path.join(__dirname, '..', '..', 'workflows');
    
    if (!fs.existsSync(workflowsFilepath)) {
        fs.mkdirSync(workflowsFilepath);

        logInfo(`Workflow folder not found, creating...`);
        return;
    }

    try {
        const filesList = fs.readdirSync(workflowsFilepath);
        const jsonFilesList = filesList.filter(file => path.extname(file).toLowerCase() === ".json");

        global.serverWorkflowFilenames = jsonFilesList;

        logInfo(`Found ${jsonFilesList.length} workflows in the workflow folder.`);
        return;
    } catch (err) {
        console.err('Error reading workflows folder: ', err);
        return;
    }
}

function loadModelTypes() {
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

    const modelDirsConfigPath = path.join(__dirname, '..', '..', 'model_dirs.json');

    if (!fs.existsSync(modelDirsConfigPath)) {
        fs.copyFileSync(path.join(__dirname, '..', '..', 'model_dirs.example.json'), modelDirsConfigPath);
    }

    // readFileSync is preferable here as require() wouldn't reflect changes during runtime (user changing model path)
    const modelDirsConfigJson = JSON.parse(fs.readFileSync(modelDirsConfigPath));

    if (!modelDirsConfigJson.checkpoint || modelDirsConfigJson.checkpoint.folder_path == "path/to/checkpoints/folder") {
        logWarning("model_dirs.json not configured, you will be unable to select models until it is set.")
        return {};
    }



    const models = {};

    for (const [modelTypeName, modelTypeInfo] of Object.entries(modelDirsConfigJson)) {
        try {
            const fileList = recursiveFolderRead(modelTypeInfo.folder_path, modelTypeInfo.folder_path, modelTypeInfo.filetypes);
    
            models[modelTypeName] = fileList;
        } catch (err) {
            if (err.code == "ENOENT") {
                logWarning(`Invalid directory for ${modelTypeName} in model_dirs.json`);
                continue;
            }
    
            console.err("Error when reading model_dirs.json: ", err);
        }
    }

    logInfo(`Loaded ${Object.keys(models).length} model types.`);

    return models;
}

function loadSelectOptions() {
    const selectsFromFile = require('../../selects.json');

    const modelSelects = loadModelTypes();

    // Merge selectsFromFile into modelSelects, then set global var to that
    Object.assign(modelSelects, selectsFromFile);
    
    global.selects = modelSelects;
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
    writeToWorkflowFile
}