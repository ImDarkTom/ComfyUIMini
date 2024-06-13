const axios = require('axios');
const express = require('express');
const router = express.Router();

const config = require('../../config.json');

router.use(express.json());

router.post('/prompt', async (req, res) => {
    const workflowJson = req.body;

    const postContents = { 'prompt': workflowJson };

    const cuiResponse = await axios.post(`${config.comfyui_url}/prompt`, postContents, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    res.json(cuiResponse.data).status(cuiResponse.status);
});

router.get('/history/:promptId', async (req, res) => {
    const promptId = req.params.promptId;

    if (!promptId) {
        res.send("Prompt id cannot be undefined").status(400);
    }

    const promptHistoryResponse = await axios.get(`${config.comfyui_url}/history/${promptId}`);

    console.log(promptHistoryResponse);

    res.json(promptHistoryResponse.data).status(promptHistoryResponse.status);
});

router.get('/image', async (req, res) => {
    const queries = req.query;
    
    const response = await axios.get(`${config.comfyui_url}/view?filename=${queries.filename}&subfolder=${queries.subfolder}&type=${queries.type}`, { responseType: 'arraybuffer' });

    res.set('Content-Type', response.headers['content-type']);
    res.set('Content-Length', response.headers['content-length']);
    res.send(response.data);
});

module.exports = router;