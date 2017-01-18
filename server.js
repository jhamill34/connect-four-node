var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var uuid = require('node-uuid');

var currentTurn = 0;
var games = {}; 

app.use(express.static('public'));
app.use(bodyParser.json());

/**
 * Create a new room to join
 */
app.post('/room', function(req, res){
  console.log(req.body);
  res.status(200).send("Hello, world"); 
});

/**
 * Handles the websocket connection
 */
io.on('connection', function(socket){
  socket.on('create_game', function(msg){
    // Each socket can only be in one room at a time 
    if(Object.keys(socket.rooms).length > 1){
      return;
    }

    // Join a room
    socket.join(msg.roomName);
  
    // Set player Id
    socket.playerId = uuid.v1();

    // Config the game
    game = {
      rows: msg.rows,
      cols: msg.cols,
      toWin: msg.toWin,
      started : false,
      currentTurn : 0,
      state : [],
      players: {} 
    };
    game.players[socket.playerId] = 0;
    
    for(var i = 0; i < game.cols; i++){
      game.state.push([]); 
    }
  
    // Put game in hash
    games[msg.roomName] = game;

    // Update the client
    socket.emit('update_game_state', {
      currentTurn : game.players[socket.playerId], 
      state : game.state, 
      player_id: game.players[socket.playerId] 
    });
  });
 
  socket.on('join_game', function(msg){
    // If the game hasn't been made yet get out!
    if(games[msg.roomName] === undefined) {
      return;
    }

    // Each socket can be in only one room at a time
    if(Object.keys(socket.rooms).length > 1){
      return;
    }

    // Join the room 
    socket.join(msg.roomName);
    
    socket.playerId = uuid.v1();
    
    games[msg.roomName].players[socket.playerId] = 1;
    games[msg.roomName].started = true;

    var game = games[msg.roomName];
    socket.emit('update_game_state', {
      currentTurn : game.currentTurn, 
      state : game.state, 
      player_id: game.players[socket.playerId] 
    });
  });

  socket.on('make_move', function(msg){
    var game = games[msg.roomName];
    console.log(msg);
    console.log(game);
    if(game.started && msg.piece === game.players[socket.playerId]){
      game.state[msg.column].push(msg.piece);
      game.currentTurn = (game.currentTurn + 1) % 2;
    
      io.to(msg.roomName).emit('update_game_state', {
        currentTurn : game.currentTurn, 
        state : game.state 
      });
    }
  });
});

http.listen(3000, function(){
  console.log("Listening on port 3000");
});
