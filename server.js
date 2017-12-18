const express = require('express');
const app = express();
const server = require('http').Server(app);
const compression = require('compression');

app.use(
    compression(),
    express.static('.', {maxAge: '1y'})
);

server.listen(process.env.PORT || 8000);
