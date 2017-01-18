var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var uuid = require('node-uuid');

var currentTurn = 0;
var games = {}; 
var userMap = {};


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
  socket.on('disconnect', function(){
    var roomName = userMap[socket.playerId];
    socket.to(roomName).emit('disconnect_message', 'Player diconnected');
    
    delete userMap[socket.playerId];
    delete games[roomName];
  });

  socket.on('leave_room', function(msg){
    var roomName = userMap[socket.playerId];
    socket.leave(roomName);
  });

  socket.on('create_game', function(msg){
    if(games[msg.roomName] !== undefined){
      socket.emit('error_message', 'Room already exists');
      return;
    }
    
    if(Object.keys(socket.rooms).length > 1){
      socket.emit('error_message', 'You are already in a room'); 
      return; 
    }

    // Join a room
    socket.join(msg.roomName);
  
    // Set player Id
    socket.playerId = uuid.v1();
    userMap[socket.playerId] = msg.roomName;

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
      started: game.started,
      state : game.state, 
      player_id: game.players[socket.playerId] 
    });
  });
 
  socket.on('join_game', function(msg){
    // If the game hasn't been made yet get out!
    if(games[msg.roomName] === undefined) {
      socket.emit('error_message', 'Room not found!'); 
      return;
    }

    // Each socket can be in only one room at a time
    if(Object.keys(socket.rooms).length > 1){
      socket.emit('error_message', 'You are already in a room'); 
      return; 
    }

    // Join the room 
    socket.join(msg.roomName);
    
    socket.playerId = uuid.v1();
    userMap[socket.playerId] = msg.roomName;
    
    games[msg.roomName].players[socket.playerId] = 1;
    games[msg.roomName].started = true;
    games[msg.roomName].currentTurn = Math.floor(Math.random() * 2);

    var game = games[msg.roomName];
    socket.emit('update_game_state', {
      currentTurn : game.currentTurn,
      started: game.started,
      state : game.state, 
      player_id: game.players[socket.playerId] 
    });

    socket.to(msg.roomName).emit('update_game_state', {
      currentTurn : game.currentTurn, 
      started: game.started,
      state : game.state 
    });
  });

  socket.on('make_move', function(msg){
    var game = games[msg.roomName];
    if(game.started && msg.piece === game.players[socket.playerId]){
      game.state[msg.column].push(msg.piece);
      io.to(msg.roomName).emit('update_game_state', {
        currentTurn : game.currentTurn, 
        started: game.started,
        state : game.state 
      });

      var winner = checkWin(game.state);
      if(winner > 0){
        io.to(msg.roomName).emit('winner', winner);
      }else{
        game.currentTurn = (game.currentTurn + 1) % 2;
      }
    }
  });
});

function checkWin(state){
  return -1;
}

http.listen(3000, function(){
  console.log("Listening on port 3000");
});
