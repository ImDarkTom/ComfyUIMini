const fs = require('fs');
const path = require('path');

function writeToWorkflowFile(fileName, workflowJson) {
    try {
        fs.writeFileSync(path.join(__dirname, '..', '..', 'workflows', fileName), JSON.stringify(workflowJson, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error when saving edited workflow to file:', error);
        return false;
    }
}

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

module.exports = {
    writeToWorkflowFile,
    getWorkflowFromFile
}