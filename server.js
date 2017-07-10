'use strict';

var express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io')(server),
  port = process.env.PORT || 3000,
  bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routes = require('./routes/jess-game-routes');
routes(app);

var hubs = require('./hubs/jess-game-hubs');
hubs(io);

//app.listen(port);
server.listen(port);

console.log('jess-game RESTful API server started on: ' + port);