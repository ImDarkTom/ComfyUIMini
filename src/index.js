const express = require("express");
const config = require('../config.json');
const path = require('path');

const mainRouter = require('./routes/mainRouter');
const cuiProxyRouter = require('./routes/proxy');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use("/", mainRouter);
app.use("/proxy", cuiProxyRouter);

app.listen(config.app_port, '0.0.0.0', () => {
    console.log(`Running on http://localhost:${config.app_port}`);
});