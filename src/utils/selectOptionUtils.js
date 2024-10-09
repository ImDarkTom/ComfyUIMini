const fs = require('fs');
const path = require('path');
const { getModelTypesList, getItemsForModelType } = require('./comfyAPIUtils');
const config = require('config');
const logger = require('./logger');

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

async function loadSelectOptions() {
    const selectsFromFileObject = require('../../selects.json');
    const selectTypesFromFileList = Object.keys(selectsFromFileObject);

    const modelTypesList = await getModelTypesList();

    const selectOptions = { selects: selectTypesFromFileList, models: modelTypesList };
    config.selectOptions = selectOptions;
}

/**
 * Get the list of items for a select type, this can be a list of models for a model type such as 'checkpoints', or a list of available samplers/schedulers/etc.
 * 
 * @param {string} selectType The select option type to get items for.
 * @returns {String[]} The list of items for the select type.
 */
async function getItemsForSelectType(selectType) {
    // Backwards compatibility
    if (selectType == "checkpoint") {
        selectType = "checkpoints";
    }

    const selectOptionCategory = getSelectOptionCategory(selectType);

    if (selectOptionCategory === "selects") {
        return selectOptionsObject[selectType];

    } else if (selectOptionCategory === "models") {
        return await getItemsForModelType(selectType);

    } else {
        logger.warn(`Unknown select option category '${selectOptionCategory}' for select type '${selectType}'.`);
        return [];
    }
}

/**
 * Gets the category of a select type.
 * 
 * E.g. if selectType is "checkpoints", the category would be "models", 
 * if selectType is "scheduler", the category would be "selects".
 * @param {string} selectType The select type to get the category of.
 * @returns {string} The category of the select type.
 */
function getSelectOptionCategory(selectType) {
    const selectOptions = config.selectOptions;

    for (const category in selectOptions) {
        if (selectOptions[category].includes(selectType)) {
            return category;
        }
    }
}

module.exports = {
    loadSelectOptions,
    getItemsForSelectType,
    selectOptionsObject
};