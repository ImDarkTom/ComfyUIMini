const express = require("express");
const http = require('http');
const path = require('path');

global.config = require('../config.json');
global.minComfyUIVersion = 'v0.2.2-50-7183fd1';

const logger = require("./utils/logger");
const { handleUpgrade } = require("./routes/wsRouter");

const mainRouter = require('./routes/mainRouter');
const comfyUIRouter = require('./routes/comfyUIRouter');
const settingsRouter = require('./routes/settingsRouter');

const app = express();
const server = http.createServer(app);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use("/", mainRouter);
app.use("/comfyui", comfyUIRouter);
app.use('/setsetting', settingsRouter);
app.use(express.static(path.join(__dirname, 'public')));

server.on('upgrade', handleUpgrade);

const { checkForWorkflowsFolder, loadSelectOptions } = require('./utils/fileManager');
const { comfyUICheck } = require('./utils/comfyUi');
const getLocalIp = require('./utils/localIp');

comfyUICheck();
checkForWorkflowsFolder();
loadSelectOptions();

server.listen(global.config.app_port, '0.0.0.0', () => {
    logger.success(`Running on http://${getLocalIp()}:${config.app_port}`);
});