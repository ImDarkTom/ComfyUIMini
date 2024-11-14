import express from 'express';
import http from 'http';
import config from 'config';

// Makes sure that if there isn't a config file created, it is created before anything else
import { initialiseConfig } from './utils/configInitialiser';
initialiseConfig();

import paths from './utils/paths';
import logger from './utils/logger';
import { handleUpgrade } from './routes/wsRouter';
import mainRouter from './routes/mainRouter';
import comfyUIRouter from './routes/comfyUIRouter';
import settingsRouter from './routes/settingsRouter';
import { comfyUICheck } from './utils/comfyAPIUtils';
import { serverWorkflowsCheck } from './utils/workflowUtils';
import getLocalIp from './utils/localIp';
import renderRouter from './routes/renderRouter';

const app = express();
const server = http.createServer(app);

app.set('view engine', 'ejs');
app.set('views', paths.views);

app.use('/', mainRouter);
app.use('/comfyui', comfyUIRouter);
app.use('/setsetting', settingsRouter);
app.use('/render', renderRouter);
app.use(express.static(paths.public));
app.use(express.static(paths.clientJs));

comfyUICheck();
serverWorkflowsCheck();

server.on('upgrade', handleUpgrade);

server.listen(config.get('app_port'), '0.0.0.0', () => {
    logger.success(`Running on http://${getLocalIp()}:${config.get('app_port')}`);
});
