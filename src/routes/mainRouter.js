const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const themeMiddleware = require('../middleware/themeMiddleware');
const { writeToWorkflowFile, getWorkflowFromFile } = require('../utils/fileManager');
const { getGalleryPageData } = require('../utils/gallery');

router.use(cookieParser());
router.use(themeMiddleware);
router.use(express.json());

const appVersion = require('../../package.json').version;

router.get('/', (req, res) => {
    res.render('pages/index', { serverWorkflowNames: global.serverWorkflowNames, appVersion: appVersion, theme: req.theme });
});

router.get('/import', (req, res) => {
    res.render('pages/import', { theme: req.theme });
});

router.get('/edit/:type/:identifier', (req, res) => {
    const workflowType = req.params.type;
    const workflowIdentifier = req.params.identifier;

    switch (workflowType) {
        case "local":
            res.render('pages/edit', { workflowTitle: workflowIdentifier, workflowText: "", workflowType: "local", workflowFilename: "", theme: req.theme });
            break;
        
        case "server":
            const workflowFileJson = getWorkflowFromFile(workflowIdentifier);

            if (workflowFileJson === "invalid") {
                res.status(400).send("Invalid workflow filename.");
                break;
            } else if (workflowFileJson === "error") {
                res.status(500).send("Internal Server Error");
                break;
            }

            const workflowTitle = workflowFileJson["_comfyuimini_meta"].title;

            res.render('pages/edit', { workflowTitle: workflowTitle, 
                workflowText: JSON.stringify(workflowFileJson), 
                workflowType: "server", 
                workflowFilename: workflowIdentifier, 
                theme: req.theme });
            break;
        default:
            res.status(400).send("Invalid workflow type");
            break;
    }
});

router.put('/edit/:fileName', (req, res) => {
    const workflowFilename = req.params.fileName;
    const workflowJson = req.body;

    const finishedSuccessfully = writeToWorkflowFile(workflowFilename, workflowJson);

    if (finishedSuccessfully) {
        res.status(200).send("Successfully saved edited workflow.")
    } else {
        res.status(500).send("Internal Server Error. Check logs for more info.");
    }
});

router.get('/workflow/:type/:identifier', (req, res) => {
    const workflowType = req.params.type;
    const workflowIdentifier = req.params.identifier;

    switch (workflowType) {
        case "local":
            res.render('pages/workflow', { 
                workflow: {
                    title: workflowIdentifier, 
                    type: "local", 
                    identifier: workflowIdentifier,
                    json: null,
                },
                theme: req.theme });
            break;

        case "server":
            const workflowFileJson = getWorkflowFromFile(workflowIdentifier);

            if (workflowFileJson === "invalid") {
                res.status(400).send("Invalid workflow filename.");
                break;
            } else if (workflowFileJson === "error") {
                res.status(500).send("Internal Server Error");
                break;
            }

            const workflowTitle = workflowFileJson["_comfyuimini_meta"].title;

            res.render('pages/workflow', { 
                workflow: {
                    title: workflowTitle, 
                    type: "server", 
                    identifier: workflowIdentifier,
                    json: workflowFileJson
                },
                theme: req.theme });
            break;
        
        default:
            res.status(400).send("Invalid workflow type");
            break;
    }
});

router.get('/gallery/:subfolder?', (req, res) => {
    const page = Number(req.query.page) || 0;
    const subfolder = req.params.subfolder || "";
    const itemsPerPage = Number(req.query.itemsPerPage) || 20;

    const pageData = getGalleryPageData(page, subfolder, itemsPerPage);

    if (pageData?.error) {
        res.status(500).send("Internal Server Error");
    }

    res.render('pages/gallery', {theme: req.theme, ...pageData});
});

router.get('/settings', (req, res) => {
    res.render('pages/settings', { theme: req.theme });
});

module.exports = router;