const express = require('express');
const { getHistory, getQueue, interruptGeneration, getImage } = require('../utils/comfyAPIUtils');
const { inputsInfoObject } = require('../utils/objectInfoUtils');

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

router.get('/queue', async (req, res) => {
    const queue = getQueue();

    res.json(queue);
});

router.get('/interrupt', async (req, res) => {
    const interruptionResponse = interruptGeneration();

    res.send(interruptionResponse.data);
});

router.get('/inputsinfo', (req, res) => {
    res.json(inputsInfoObject);
});

module.exports = router;
