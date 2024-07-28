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

module.exports = {
    writeToWorkflowFile
}