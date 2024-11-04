import express from 'express';
import cookieParser from 'cookie-parser';
import themeMiddleware from '../middleware/themeMiddleware';
import { writeServerWorkflow, readServerWorkflow, serverWorkflowMetadata, checkIfObjectIsValidWorkflow } from '../utils/workflowUtils';
import { getGalleryPageData } from '../utils/galleryUtils';
import { RequestWithTheme } from '../types/Requests';
import { Workflow, WorkflowWithMetadata } from '../types/Workflow';
import { getProcessedObjectInfo } from '../utils/objectInfoUtils';
import { EditInput, EditPageData } from '../types/EjsPageData';

const router = express.Router();

router.use(cookieParser());
router.use(themeMiddleware);
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const appVersion = require('../../package.json').version;

router.get('/', (req: RequestWithTheme, res) => {
    res.render('pages/index', {
        serverWorkflowMetadata: Object.values(serverWorkflowMetadata),
        appVersion: appVersion,
        theme: req.theme,
    });
});

router.get('/import', (req: RequestWithTheme, res) => {
    res.render('pages/import', { theme: req.theme });
});

router.get('/edit/:type/:identifier', (req: RequestWithTheme, res) => {
    const workflowType = req.params.type;
    const workflowIdentifier = req.params.identifier;

    switch (workflowType) {
        case 'local':
            res.render('pages/edit', {
                workflowTitle: workflowIdentifier,
                workflowText: '',
                workflowType: 'local',
                workflowFilename: '',
                theme: req.theme,
            });
            break;

        case 'server':
            const workflowFileJson = readServerWorkflow(workflowIdentifier);

            if ('error' in workflowFileJson) {
                if (workflowFileJson.error === 'notFound') {
                    res.status(404).send('Workflow not found.');
                    break;
                } else if (workflowFileJson.error === 'invalidJson') {
                    res.status(400).send('Invalid workflow file.');
                    break;
                } else {
                    res.status(500).send('Internal Server Error');
                    break;
                }
            }

            const workflowTitle = workflowFileJson['_comfyuimini_meta'].title;

            res.render('pages/edit', {
                workflowTitle: workflowTitle,
                workflowText: JSON.stringify(workflowFileJson),
                workflowType: 'server',
                workflowFilename: workflowIdentifier,
                theme: req.theme,
            });
            break;
        default:
            res.status(400).send('Invalid workflow type');
            break;
    }
});

router.post('/edit2', async (req: RequestWithTheme, res) => {
    const workflowText = req.body.workflow;

    if (!workflowText) {
        res.status(400).send('No workflow provided');
        return;
    }

    let workflow;
    try {
        workflow = JSON.parse(workflowText);
    } catch (error) {
        res.status(400).send('Invalid workflow');
        return;
    }

    if (!checkIfObjectIsValidWorkflow(workflow)) {
        res.status(400).send('Invalid workflow');
        return;
    }

    let title: string = 'Unnamed Workflow';
    let description: string = '';

    if ('_comfyuimini_meta' in workflow) {
           if ('title' in workflow._comfyuimini_meta) {
            title = workflow._comfyuimini_meta.title;
        }

        if ('description' in workflow._comfyuimini_meta) {
            description = workflow._comfyuimini_meta.description;
        }
    }

    const objectInfo = await getProcessedObjectInfo();

    if (objectInfo === null) {
        res.status(500).send('Could not get ComfyUI object info.');
        return;
    }

    console.log(objectInfo);

    res.render('pages/edit2', {
        title: title,
        description: description,
        inputs: [],
        theme: req.theme,
    } as EditPageData);
});

function getEditInputsList(workflow: WorkflowWithMetadata | Workflow): EditInput[] {
    const inputs: EditInput[] = [];

    if ('_comfyuimini_meta' in workflow) {
        if ('input_options' in workflow._comfyuimini_meta) {
            const inputOptions = workflow._comfyuimini_meta.input_options;

            for (const inputOption of inputOptions) {
                const nodeId = inputOption.node_id;
                const inputNameInNode = inputOption.input_name_in_node;
                const title = inputOption.title ?? `[${nodeId}] ${inputNameInNode}`;

                inputs.push({
                    nodeId,
                    inputName: inputNameInNode,
                    title,
                    default: '',
                    type: 'STRING',
                });
            }
        }
    }
}

router.get('/import2', (req: RequestWithTheme, res) => {
    res.render('pages/import2', { theme: req.theme });
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

router.get('/workflow/:type/:identifier', (req: RequestWithTheme, res) => {
    const workflowType = req.params.type;
    const workflowIdentifier = req.params.identifier;

    switch (workflowType) {
        case 'local':
            res.render('pages/workflow', {
                workflow: {
                    title: workflowIdentifier,
                    type: 'local',
                    identifier: workflowIdentifier,
                    json: null,
                },
                theme: req.theme,
            });
            break;

        case 'server':
            const workflowFileJson = readServerWorkflow(workflowIdentifier);

            if ('error' in workflowFileJson) {
                if (workflowFileJson.error === 'notFound') {
                    res.status(404).send('Workflow not found.');
                    break;
                } else if (workflowFileJson.error === 'invalidJson') {
                    res.status(400).send('Invalid workflow file.');
                    break;
                } else {
                    res.status(500).send('Internal Server Error');
                    break;
                }
            }

            const workflowTitle = workflowFileJson['_comfyuimini_meta'].title;

            res.render('pages/workflow', {
                workflow: {
                    title: workflowTitle,
                    type: 'server',
                    identifier: workflowIdentifier,
                    json: workflowFileJson,
                },
                theme: req.theme,
            });
            break;

        default:
            res.status(400).send('Invalid workflow type');
            break;
    }
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

export default router;
