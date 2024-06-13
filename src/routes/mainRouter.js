const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('pages/index');
});

router.get('/import', (req, res) => {
    res.render('pages/import');
});

router.get('/localworkflow/:workflowTitle', (req, res) => {
    const workflowTitle = req.params.workflowTitle;

    res.render('pages/localworkflow', {workflowTitle: workflowTitle});
});

module.exports = router;