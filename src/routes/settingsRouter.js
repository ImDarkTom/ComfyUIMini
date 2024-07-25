const express = require('express');
const router = express.Router();

router.use(express.json());

router.get('/theme', async (req, res) => {
    const requestTheme = req.query.theme;

    const themesList = ['dark', 'light', 'midnight', 'whiteout', 'aurora'];

    if (themesList.includes(requestTheme)) {
        res.cookie('theme', requestTheme, {
            maxAge: 1000 * 60 * 60 * 24 * 365,
            httpOnly: true,
            secure: false,
            sameSite: 'Lax'
        });

        res.send(`Theme set to ${requestTheme}.`).status(200);
    } else {
        res.send("Invalid theme name.").status(400);
    }
});

module.exports = router;