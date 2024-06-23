const axios = require('axios');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

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

    res.json(promptHistoryResponse.data).status(promptHistoryResponse.status);
});

router.get('/image', async (req, res) => {
    const queries = req.query;
    
    const response = await axios.get(`${config.comfyui_url}/view?filename=${queries.filename}&subfolder=${queries.subfolder}&type=${queries.type}`, { responseType: 'arraybuffer' });

    res.set('Content-Type', response.headers['content-type']);
    res.set('Content-Length', response.headers['content-length']);
    res.send(response.data);
});

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

router.get('/listmodels/:modelType', (req, res) => {
    const modelType = req.params.modelType;

    const modelTypeInfo = global.modelDirs[modelType];

    if (!modelTypeInfo) {
        res.send("Model config not found for" + modelType).status(400);
        return;
    }

    try {
        const fileList = recursiveFolderRead(modelTypeInfo.folder_path, modelTypeInfo.folder_path, modelTypeInfo.filetypes);

        res.json(fileList).status(200);
    } catch (err) {
        if (err.code == "ENOENT") {
            res.send(`Invalid directory for ${modelType} in model_dirs.json`).status(400);
            return;
        }

        res.send("Internal Server Error").status(500);
        console.error(err);
    }
});

module.exports = router;