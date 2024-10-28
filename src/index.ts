import express from 'express';
import http from 'http';
import path from 'path';

import { initialiseConfig } from './utils/configInitialiser';
initialiseConfig();

import config from 'config';
import logger from './utils/logger';
import { handleUpgrade } from './routes/wsRouter';

import mainRouter from './routes/mainRouter';
import comfyUIRouter from './routes/comfyUIRouter';
import settingsRouter from './routes/settingsRouter';

const app = express();
const server = http.createServer(app);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', mainRouter);
app.use('/comfyui', comfyUIRouter);
app.use('/setsetting', settingsRouter);
app.use(express.static(path.join(__dirname, 'public')));

server.on('upgrade', handleUpgrade);

import { comfyUICheck } from './utils/comfyAPIUtils';
import { serverWorkflowsCheck } from './utils/workflowUtils';
import getLocalIp from './utils/localIp';

comfyUICheck();
serverWorkflowsCheck();

server.listen(config.get('app_port'), '0.0.0.0', () => {
    logger.success(`Running on http://${getLocalIp()}:${config.get('app_port')}`);
});
