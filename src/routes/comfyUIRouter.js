const express = require('express');
const { getHistory, getQueue, interruptGeneration, getImage, uploadImage } = require('../utils/comfyAPIUtils');
const { inputsInfoObject, loadObjectInfo } = require('../utils/objectInfoUtils');
const multer = require('multer');

const upload = multer();

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

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

router.post('/upload/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.headers['content-type'].startsWith('multipart/form-data')) {
            return res.status(400).json({ error: 'No file selected for upload' });
        }

        const response = await uploadImage(req.file);

        try {
            await loadObjectInfo();
        } catch (err) {
            console.error('Error reloading object info', err);
        }

        res.status(200).json({
            message: 'File uploaded successfully',
            externalResponse: response.data,
        });
    } catch (err) {
        console.error('Error uploading file to ComfyUI', err);
        res.status(500).json({error: 'Failed to upload file.'});
    }
});

module.exports = router;
