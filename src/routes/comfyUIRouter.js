const axios = require('axios');
const express = require('express');
const { loadModelTypes } = require('../utils');
const config = require('../../config.json');

const router = express.Router();

router.use(express.json());

router.get('/history/:promptId', async (req, res) => {
    const promptId = req.params.promptId;

    if (!promptId) {
        res.send("Prompt id cannot be undefined").status(400);
    }

    const promptHistoryResponse = await axios.get(`${config.comfyui_url}/history/${promptId}`);

    res.json(promptHistoryResponse.data).status(promptHistoryResponse.status);
});

router.get('/image', async (req, res) => {
    const queries = req.query;
    
    const response = await axios.get(`${config.comfyui_url}/view?filename=${queries.filename}&subfolder=${queries.subfolder}&type=${queries.type}`, { responseType: 'arraybuffer' });

    res.set('Content-Type', response.headers['content-type']);
    res.set('Content-Length', response.headers['content-length']);
    res.send(response.data);
});

router.get('/modeltypes', (req, res) => {
    const modelTypesList = Object.keys(global.selects);

    res.json(modelTypesList);
});

router.get('/listmodels/:modelType', (req, res) => {
    const modelType = req.params.modelType;

    const modelTypeInfo = global.selects[modelType];

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
    const response = await axios.get(`${config.comfyui_url}/queue`);

    res.send(response.data);
});


module.exports = router;