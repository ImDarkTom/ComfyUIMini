const express = require('express');
const config = require('config');
const { getHistory, getQueue, interruptGeneration, getImage } = require('../utils/comfyAPIUtils');
const { getItemsForSelectType, loadSelectOptions } = require('../utils/selectOptionUtils');

const router = express.Router();

router.use(express.json());

router.get('/history/:promptId', async (req, res) => {
    const promptId = req.params.promptId;

    if (!promptId) {
        res.send('Prompt id cannot be undefined').status(400);
    }

    const promptHistory = getHistory();

    res.json(promptHistory);
});

router.get('/image', async (req, res) => {
    const queries = req.query;

    const imageResponse = await getImage(queries.filename, queries.subfolder, queries.type);

    res.set('Content-Type', imageResponse.headers['content-type']);
    res.set('Content-Length', imageResponse.headers['content-length']);
    res.send(imageResponse.data);
});

router.get('/selectoptions', async (req, res) => {
    if (config.selectOptions.models.length === 0) {
        console.info('Reloading select options...')
        await loadSelectOptions();
    }

    res.json(config.selectOptions);
});

router.get('/selectoption/:selectType', async (req, res) => {
    const selectType = req.params.selectType;

    const selectTypeItems = await getItemsForSelectType(selectType);

    if (selectTypeItems == []) {
        res.send(`Select option ${selectType} is either invalid or empty.`).status(400);
        return;
    }

    res.json(selectTypeItems);
});

router.get('/queue', async (req, res) => {
    const queue = getQueue();

    res.json(queue);
});

router.get('/interrupt', async (req, res) => {
    const interruptionResponse = interruptGeneration();

    res.send(interruptionResponse.data);
});

module.exports = router;
