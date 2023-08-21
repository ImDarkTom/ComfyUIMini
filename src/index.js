const express = require("express");
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const settings = require('../config.json');

async function getWorkflowConfig(filename) {
    const configFilePath = path.join(__dirname, '..', 'workflows', `${filename}.config.json`);

    try {
        const configsText = await fs.readFileSync(configFilePath, 'utf-8');
        return JSON.parse(configsText);
    } catch (err) {
        console.log("Error parsing workflow configs", err);
        return null;
    }
}

async function getWorkflow(filename) {
    const filePath = path.join(__dirname, '..', 'workflows', `${filename}.json`);
    const config = await getWorkflowConfig(filename);

    try {
        const data = await fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(data);
        return [jsonData, config];
    } catch (err) {
        console.log('Error:', err);
        return null; 
    }
}

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get("/workflows", async (req, res) => {
    const files = await fs.readdirSync(path.join(__dirname, '..', 'workflows'));

    const filteredFiles = files.filter(file => {
        const parsedPath = path.parse(file);
        return !parsedPath.name.endsWith('.config');
    });

    const filesWithoutExtensions = filteredFiles.map(file => path.parse(file).name);

    res.send(filesWithoutExtensions).status(200);
});

app.get("/workflowConfig/:workflowName", async (req, res) => {
    const workflowName = req.params.workflowName;

    const config = await getWorkflowConfig(workflowName);

    res.send(config).status(200);
});

app.get("/imgProxy", async (req, res) => {
    const queries = req.query;
    
    const response = await axios.get(`http://127.0.0.1:${settings.comfyui_port}/view?filename=${queries.filename}&subfolder=${queries.subfolder}&type=${queries.type}`, { responseType: 'arraybuffer' });

    res.set('Content-Type', response.headers['content-type']);
    res.set('Content-Length', response.headers['content-length']);
    res.send(response.data);
});

app.get("/imgReq", async (req, res) => {
    const queries = req.query;
    const workflowName = queries.workflowName;

    const workflowInfo = await getWorkflow(workflowName);
    const [baseWorkflow, workflowConfigs] = workflowInfo;

    for (const config of workflowConfigs) {
        switch (config.input_type) {
            case "int":
                if (queries[config.input_id] == -1) {
                    baseWorkflow[config.id].inputs[config.node_input] = Math.floor(Math.random()*100000000);
                } else {
                    baseWorkflow[config.id].inputs[config.node_input] = queries[config.input_id] ? Number(queries[config.input_id]) : config.default;
                }
                
                break;

            case "str":
                baseWorkflow[config.id].inputs[config.node_input] = queries[config.input_id] ? queries[config.input_id] : config.default;
                break;
        }
    }

    const cuiReq = await axios({
        method: 'post',
        url: `http://127.0.0.1:${settings.comfyui_port}/prompt`,
        data: {
            prompt: baseWorkflow
        }
    });

    let imgData = undefined;

    while (imgData == undefined) {
        const imgDataReq = await axios({
            method: 'get',
            url: `http://127.0.0.1:${settings.comfyui_port}/history/${cuiReq.data.prompt_id}`,
        });

        imgData = imgDataReq.data[cuiReq.data.prompt_id]
    };

    res.send(Object.values(imgData.outputs)).status(200);
});

app.listen(settings.app_port, '0.0.0.0', () => {
    console.log(`Listening on port ${settings.app_port}...`);
});