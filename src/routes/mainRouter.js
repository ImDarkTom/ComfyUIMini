const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
    res.render('pages/index', {serverWorkflows: global.serverWorkflowFilenames});
});

router.get('/import', (req, res) => {
    res.render('pages/import');
});

router.get('/workflow/:type/:identifier', (req, res) => {
    const workflowType = req.params.type;
    const workflowIdentifier = req.params.identifier;

    switch (workflowType) {
        case "local":
            res.render('pages/workflow', {workflowTitle: workflowIdentifier, workflowText: ""});
            break;

        case "server":
            const workflowFileBuffer = fs.readFileSync(path.join(__dirname, '..', '..', 'workflows', workflowIdentifier));
            const workflowFileJson = JSON.parse(workflowFileBuffer);

            const workflowTitle = workflowFileJson["_comfyuimini_meta"].title;

            res.render('pages/workflow', {workflowTitle: workflowTitle, workflowText: JSON.stringify(workflowFileJson)});
            break;
        
        default:
            res.status(400).send("Invalid workflow type");
            break;
    }
})

module.exports = router;