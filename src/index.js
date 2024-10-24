const express = require('express');
const http = require('http');
const path = require('path');

const { initialiseConfig } = require('./utils/configInitialiser');
initialiseConfig();

const config = require('config');
const logger = require('./utils/logger');
const { handleUpgrade } = require('./routes/wsRouter');

const mainRouter = require('./routes/mainRouter');
const comfyUIRouter = require('./routes/comfyUIRouter');
const settingsRouter = require('./routes/settingsRouter');

const app = express();
const server = http.createServer(app);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', mainRouter);
app.use('/comfyui', comfyUIRouter);
app.use('/setsetting', settingsRouter);
app.use(express.static(path.join(__dirname, 'public')));

server.on('upgrade', handleUpgrade);

const { loadObjectInfo } = require('./utils/objectInfoUtils');
const { comfyUICheck } = require('./utils/comfyAPIUtils');
const { serverWorkflowsCheck } = require('./utils/workflowUtils');
const getLocalIp = require('./utils/localIp');

comfyUICheck();
serverWorkflowsCheck();
loadObjectInfo();

server.listen(config.get('app_port'), '0.0.0.0', () => {
    logger.success(`Running on http://${getLocalIp()}:${config.get('app_port')}`);
});
