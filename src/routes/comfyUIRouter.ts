import express from 'express';
import { getHistory, getQueue, interruptGeneration, getImage, uploadImage } from '../utils/comfyAPIUtils';
import { getProcessedObjectInfo } from '../utils/objectInfoUtils';
import multer from 'multer';

const upload = multer();

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get('/history/:promptId', async (req, res) => {
    const promptId = req.params.promptId;

    if (!promptId) {
        res.send('Prompt id cannot be undefined').status(400);
    }

    const promptHistory = getHistory(promptId);

    res.json(promptHistory);
});

router.get('/image', async (req, res): Promise<void> => {
    const queries = req.query;

    const filename = typeof queries.filename === 'string' ? queries.filename : null;
    const subfolder = typeof queries.subfolder === 'string' ? queries.subfolder : '';
    const imageType = typeof queries.type === 'string' ? queries.type : null;

    if (!filename || !imageType) {
        res.status(400).send('Missing parameters');
        return;
    }

    const imageResponse = await getImage(filename, subfolder, imageType);

    if (
        !imageResponse ||
        !imageResponse.headers['content-length'] ||
        !imageResponse.headers['content-type'] ||
        !(typeof imageResponse.headers['content-type'] === 'string') ||
        !(typeof imageResponse.headers['content-length'] === 'string')
    ) {
        res.status(500).send('Server error when fetching image. Check console for more information.');
        return;
    }

    res.set('Content-Type', imageResponse.headers['content-type']);
    res.set('Content-Length', imageResponse.headers['content-length']);
    res.send(imageResponse.data);
});

router.get('/queue', async (req, res) => {
    const queue = getQueue();

    res.json(queue);
});

router.get('/interrupt', async (req, res) => {
    const interruptionResponse = await interruptGeneration();

    res.send(interruptionResponse.data);
});

router.get('/inputsinfo', async (req, res) => {
    const processedObjectInfo = await getProcessedObjectInfo();

    if (processedObjectInfo === null) {
        res.status(500).send('Could not get ComfyUI object info.');
        return;
    }

    res.json(processedObjectInfo);
});

router.post('/upload/image', upload.single('image'), async (req, res): Promise<void> => {
    try {
        if (
            !req.file ||
            !req.headers['content-type'] ||
            !req.headers['content-type'].startsWith('multipart/form-data')
        ) {
            res.status(400).json({ error: 'No file selected for upload' });
            return;
        }

        const response = await uploadImage(req.file);

        if ('error' in response) {
            res.status(500).json({ error: response.error });
            return;
        }

        res.status(200).json({
            message: 'File uploaded successfully',
            externalResponse: response.data,
        });
    } catch (err) {
        console.error('Error uploading file to ComfyUI', err);
        res.status(500).json({ error: 'Failed to upload file.' });
    }
});

export default router;
