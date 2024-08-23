const express = require('express');
const { loadModelTypes } = require('../utils/fileManager');
const { getHistory, getQueue, interruptGeneration, getImage } = require('../utils/comfyUi');

const router = express.Router();

router.use(express.json());

router.get('/history/:promptId', async (req, res) => {
    const promptId = req.params.promptId;

    if (!promptId) {
        res.send("Prompt id cannot be undefined").status(400);
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

router.get('/modeltypes', (req, res) => {
    const modelTypesList = Object.keys(global.selectOptions);

    res.json(modelTypesList);
});

router.get('/listmodels/:modelType', (req, res) => {
    const modelType = req.params.modelType;

    const modelTypeInfo = global.selectOptions[modelType];

    if (!modelTypeInfo) {
        res.send("Model config not found for " + modelType).status(400);
        return;
    }

    res.json(modelTypeInfo);
});

router.post('/reloadmodels', (req, res) => {
    try {
        loadModelTypes();
        res.send("Refreshed model list").status(200);
    } catch (err) {
        res.send("Internal Server Error").send(500);
        console.error("Error when refreshing models list: ", err);
    }
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