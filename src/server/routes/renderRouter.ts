import express from 'express';

const router = express.Router({});
router.use(express.json());

router.post('/home/workflow-list', (req, res) => {
    const workflowMetadataList = req.body;

    res.render('components/home/cardList', { workflowMetadataList });
});

export default router;