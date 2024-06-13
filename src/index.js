const express = require("express");
const config = require('../config.json');
const path = require('path');
const axios = require("axios");

const mainRouter = require('./routes/mainRouter');
const cuiProxyRouter = require('./routes/proxy');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use("/", mainRouter);
app.use("/proxy", cuiProxyRouter);

async function checkForComfyUI() {
    try {
        const responseCodeMeaning = {
            200: "ComfyUI is running."
        };

        const request = await axios.get(config.comfyui_url);
        const status = request.status;

        console.log(`✅ ${status}: ${responseCodeMeaning[status] || "Unknown response."}`);
    } catch (err) {
        const errorCode = err.code;

        const errorMeaning = {
            "ECONNREFUSED": "Make sure ComfyUI is running and is accessible at the URL in the config.json file."
        }

        console.warn(`⚠ ${errorCode}: ${errorMeaning[errorCode] || err}`)
    }
}

checkForComfyUI();

app.listen(config.app_port, '0.0.0.0', () => {
    console.log(`Running on http://localhost:${config.app_port}`);
});