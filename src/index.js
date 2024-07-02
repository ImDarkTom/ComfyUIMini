const express = require("express");
const config = require('../config.json');
const path = require('path');

const mainRouter = require('./routes/mainRouter');
const comfyUIRouter = require('./routes/comfyUIRouter');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use("/", mainRouter);
app.use("/comfyui", comfyUIRouter);

const { 
    checkForWorkflowsFolder,
    checkForComfyUI,
    loadSelects,
    getLocalIP
} = require("./utils");

checkForComfyUI();
checkForWorkflowsFolder();
loadSelects();

app.listen(config.app_port, '0.0.0.0', () => {
    console.log(`✅ Running on http://${getLocalIP()}:${config.app_port}`);
});