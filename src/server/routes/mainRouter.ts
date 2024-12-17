import express from 'express';
import cookieParser from 'cookie-parser';
import themeMiddleware from '../middleware/themeMiddleware';
import {
    writeServerWorkflow,
    readServerWorkflow,
    serverWorkflowMetadata,
    deleteServerWorkflow,
} from '../utils/workflowUtils';
import { getGalleryPageData } from '../utils/galleryUtils';
import { RequestWithTheme } from '@shared/types/Requests';
import loadAndRenderWorkflow from 'server/utils/loadAndRenderWorkflow';

const router = express.Router();

router.use(cookieParser());
router.use(themeMiddleware);
router.use(express.json());

router.get('/', (req: RequestWithTheme, res) => {
    const formattedWorkflowMetadata = Object.values(serverWorkflowMetadata).map((workflowMetadata) => ({
        ...workflowMetadata,
        type: 'server',
        icon: 'server',
    }));

    res.render('pages/index', {
        serverWorkflowMetadata: formattedWorkflowMetadata,
        theme: req.theme,
    });
});

router.get('/import', (req: RequestWithTheme, res) => {
    res.render('pages/import', { theme: req.theme });
});

router.get('/edit/:type/:identifier', (req: RequestWithTheme, res) => {
    const workflowType = req.params.type;
    const workflowIdentifier = req.params.identifier;

    if (workflowType !== 'local' && workflowType !== 'server') {
        res.status(400).send('Invalid workflow type');
        return;
    }

    loadAndRenderWorkflow(workflowType, workflowIdentifier, req, res, 'pages/edit');
});

router.put('/edit/:fileName', (req, res) => {
    const workflowFilename = req.params.fileName;
    const workflowJson = req.body;

    const finishedSuccessfully = writeServerWorkflow(workflowFilename, workflowJson);

    if (finishedSuccessfully) {
        res.status(200).send('Successfully saved edited workflow.');
    } else {
        res.status(500).send('Internal Server Error. Check logs for more info.');
    }
});

router.delete('/edit/:fileName', (req, res) => {
    const workflowFilename = req.params.fileName;

    const finishedSuccessfully = deleteServerWorkflow(workflowFilename);

    if (finishedSuccessfully) {
        res.status(200).send('Successfully deleted edited workflow.');
    } else {
        res.status(500).send('Internal Server Error. Check logs for more info.');
    }
});

router.get('/download/:fileName', (req, res) => {
    const workflowFilename = req.params.fileName;

    const workflowFile = readServerWorkflow(workflowFilename);

    if ('error' in workflowFile) {
        if (workflowFile.error === 'notFound') {
            res.status(404).send('Workflow not found.');
            return;
        } else if (workflowFile.error === 'invalidJson') {
            res.status(400).send('Invalid workflow file.');
            return;
        } else {
            res.status(500).send('Internal Server Error');
            return;
        }
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(workflowFile);
});

router.get('/workflow/:type/:identifier', (req: RequestWithTheme, res) => {
    const workflowType = req.params.type;
    const workflowIdentifier = req.params.identifier;

    if (workflowType !== 'local' && workflowType !== 'server') {
        res.status(400).send('Invalid workflow type');
        return;
    }

    loadAndRenderWorkflow(workflowType, workflowIdentifier, req, res, 'pages/workflow');
});

router.get('/gallery/:subfolder?', (req: RequestWithTheme, res) => {
    const page = Number(req.query.page) || 0;
    const subfolder = req.params.subfolder || '';
    const itemsPerPage = Number(req.cookies['galleryItemsPerPage']) || 20;

    const pageData = getGalleryPageData(page, subfolder, itemsPerPage);

    res.render('pages/gallery', { theme: req.theme, ...pageData });
});

router.get('/settings', (req: RequestWithTheme, res) => {
    res.render('pages/settings', { theme: req.theme });
});

router.get('/allserverworkflows', async (req, res) => {
    const infoList = Object.entries(serverWorkflowMetadata).map((workflowMetadata) => {
        return {
            title: workflowMetadata[1].title,
            icon: 'server',
            type: 'server',
            identifier: workflowMetadata[1].filename,
        };
    });

    res.json(infoList);
});

export default router;
