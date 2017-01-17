var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var currentTurn = 0;
var gameState;

var currentId = 0;

app.use(express.static('public'));

io.on('connection', function(socket){
  if(gameState === undefined){
    gameState = [];
    for(var i = 0; i < 7; i++){
      gameState.push([]); 
    }
  }
  socket.player_id = currentId;
  currentId = currentId + 1;

  socket.emit('update_game_state', {
    currentTurn : currentTurn, 
    state : gameState, 
    player_id: socket.player_id
  });

  socket.on('make_move', function(msg){
    if(msg.piece === socket.player_id){
      gameState[msg.column].push(msg.piece);
      currentTurn = (currentTurn + 1) % 2;
    
      io.emit('update_game_state', {
        currentTurn : currentTurn, 
        state : gameState 
      });
    }
  });
});

http.listen(3000, function(){
  console.log("Listening on port 3000");
});
