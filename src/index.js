const express = require("express");
const config = require('../config.json');
const path = require('path');
const { logSuccess } = require("./utils/logger");
const http = require('http');
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

server.on('upgrade', handleUpgrade)

const { 
    checkForWorkflowsFolder,
    checkForComfyUI,
    loadSelectTypes,
    getLocalIP
} = require("./utils");

checkForComfyUI();
checkForWorkflowsFolder();
loadSelectTypes();

server.listen(config.app_port, '0.0.0.0', () => {
    logSuccess(`Running on http://${getLocalIP()}:${config.app_port}`);
});