import express from 'express';
const router = express.Router();

router.use(express.json());

router.get('/theme', async (req, res) => {
    const requestTheme = req.query.theme;

    if (!requestTheme || typeof requestTheme !== 'string') {
        res.status(400).send({ error: 'Theme name not set or invalid.' });
        return;
    }

    const themesList = ['dark', 'light', 'midnight', 'whiteout', 'aurora'];

    if (themesList.includes(requestTheme)) {
        res.cookie('theme', requestTheme, {
            maxAge: 1000 * 60 * 60 * 24 * 365,
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
        });

        res.send(`Theme set to ${requestTheme}.`).status(200);
    } else {
        res.send('Invalid theme name.').status(400);
    }
});

router.get('/galleryitemsperpage', async (req, res): Promise<void> => {
    const requestCount = Number(req.query.count);

    if (isNaN(requestCount) || requestCount < 1) {
        res.status(400).send({ error: 'Invalid number, must be a valid integer greater than 0.' });
        return
    }

    res.cookie('galleryItemsPerPage', requestCount.toString(), {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
    });

    res.json({ message: `Set gallery items per page to ${requestCount}` });
});

export default router;
