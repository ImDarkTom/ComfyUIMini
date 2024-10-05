const fs = require('fs');
const path = require('path');

const selectOptionsObject = getSelectOptionFileAsObject();

function getSelectOptionFileAsObject() {
    const selectOptionFilePath = path.join(__dirname, '..', '..', 'selects.json');

    if (!fs.existsSync(selectOptionFilePath)) {
        console.error('Could not find selects.json file.');
    }

    const selectsFileContents = fs.readFileSync(selectOptionFilePath, 'utf8');
    const selectOptionFileAsObject = JSON.parse(selectsFileContents);

    return selectOptionFileAsObject;
}

module.exports = {
    selectOptionsObject
};