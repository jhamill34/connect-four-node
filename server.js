'use strict';

// 3rd Party Libraries
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Personal Libraries
const SocketHandler = require('./lib/SocketHandler.js')(io);

// Set up the static server
app.use(express.static('public'));

// Socket handler 
io.on('connection', SocketHandler);

module.exports = http;

