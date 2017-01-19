'use strict';

const uuid = require('node-uuid');
const DisjointSet = require('./DisjointSet.js');

// Set up some data structures 
// to monitor multiple sessions
let currentTurn = 0;
let games = {}; 
let userMap = {};

function updateSet(game, column){
  let row = game.state[column].length - 1;
  let p = game.state[column][row];

  let setIndex = game.cols * row + column;

  // Update Horizontal
  game.dj_sets.horizontal.init(setIndex);
  if(column > 0 && game.state[column - 1][row] === p){
    game.dj_sets.horizontal.join(setIndex, setIndex - 1);
  }

  if(column < (game.cols - 1) && game.state[column + 1][row] === p){
    game.dj_sets.horizontal.join(setIndex, setIndex + 1);
  }

  if(game.dj_sets.horizontal.find(setIndex) >= game.toWin){
    return p;
  }

  // Update Vertical
  game.dj_sets.vertical.init(setIndex);
  if(row > 0 && game.state[column][row - 1] === p){
    game.dj_sets.vertical.join(setIndex, setIndex - game.cols);
  }

  if(row < (game.rows - 1) && game.state[column][row + 1] === p){
    game.dj_sets.vertical.join(setIndex, setIndex + game.cols);
  }

  if(game.dj_sets.vertical.find(setIndex) >= game.toWin){
    return p;
  }


  // Update Diagonal Left
  game.dj_sets.diagonal_left.init(setIndex);
  if(row > 0 && column > 0 && game.state[column - 1][row - 1] === p){
    game.dj_sets.diagonal_left.join(setIndex, setIndex - game.cols - 1);
  }

  if(row < (game.rows - 1) && column < (game.cols - 1) && game.state[column + 1][row + 1] === p){
    game.dj_sets.diagonal_left.join(setIndex, setIndex + game.cols + 1);
  }

  if(game.dj_sets.diagonal_left.find(setIndex) >= game.toWin){
    return p;
  }
  
  // Update Diagonal Right
  game.dj_sets.diagonal_right.init(setIndex);
  if(row > 0 && column < (game.cols - 1) && game.state[column + 1][row - 1] === p){
    game.dj_sets.diagonal_right.join(setIndex, setIndex - game.cols + 1);
  }

  if(row < (game.rows - 1) && column > 0 && game.state[column - 1][row + 1] === p){
    game.dj_sets.diagonal_right.join(setIndex, setIndex + game.cols - 1);
  }

  if(game.dj_sets.diagonal_right.find(setIndex) >= game.toWin){
    return p;
  }

  return -1;
}

module.exports = function(io){
  return function(socket){
    /**
     * When a socket disconnects we remove the game from
     * the map and then send the DISCONNECT_MESSAGE to 
     * other sockets connected to the room
     */
    socket.on('disconnect', function(){
      if(socket.playerId){
        let roomName = userMap[socket.playerId];
        socket.to(roomName).emit('disconnect_message', 'Other Player diconnected');
      
        delete userMap[socket.playerId];
        delete games[roomName];
      }
    });

    /**
     * When a socket requests to leave the room, just remove them from the 
     * socket. Generally happens when the socket recieves the DISCONNECT_MESSAGE. 
     * Used to clean up and allow them to create a new game.
     */
    socket.on('leave_room', function(msg){
      let roomName = userMap[socket.playerId];
      socket.leave(roomName);
    });

    /**
     * Socket sends this message to spin up a new game instance. It puts them in a waiting state.
     * Expects a config json to set up the game. 
     */
    socket.on('create_game', function(msg){
      if(msg.roomName === ''){
        socket.emit('error_message', 'Room name cant be empty');
        return;
      }
      
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
      socket.pieceValue = 0;
      userMap[socket.playerId] = msg.roomName;

      // Config the game
      let size = msg.rows * msg.cols;
      let game = {
        rows: msg.rows,
        cols: msg.cols,
        toWin: msg.toWin,
        started : false,
        currentTurn : 0,
        state : [],
        turns: 0,
        dj_sets: {
          horizontal : new DisjointSet(size),
          vertical : new DisjointSet(size),
          diagonal_left : new DisjointSet(size),
          diagonal_right : new DisjointSet(size)
        },
        players: {},
        winCount: {}
      };
      game.players[0] = msg.screenName;
      game.winCount[0] = 0;

      for(var i = 0; i < game.cols; i++){
        game.state.push([]); 
      }
    
      // Put game in hash
      games[msg.roomName] = game;

      // Update the client
      socket.emit('update_game_state', {
        started: game.started,
        state : game.state, 
        winCount : game.winCount,
        newGame : true,
        rows : game.rows,
        cols : game.cols,
        player_id: 0,
        players: game.players
      });
    });

    /**
     * Send this with the room name you are looking to join. 
     * Will start the game.
     */
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
      socket.pieceValue = 1;
      userMap[socket.playerId] = msg.roomName;
      
      games[msg.roomName].players[1] = msg.screenName;
      games[msg.roomName].started = true;
      games[msg.roomName].currentTurn = Math.floor(Math.random() * 2);
      games[msg.roomName].winCount[1] = 0;
      games[msg.roomName].firstPerson = games[msg.roomName].currentTurn;

      var game = games[msg.roomName];
      socket.emit('update_game_state', {
        currentTurn : game.currentTurn,
        started: game.started,
        state : game.state, 
        newGame : true,
        rows : game.rows,
        cols : game.cols,
        winCount : game.winCount,
        player_id: 1,
        players: game.players
      });

      socket.to(msg.roomName).emit('update_game_state', {
        currentTurn : game.currentTurn, 
        started: game.started,
        winCount : game.winCount,
        state : game.state,
        players: game.players
      });
    });

    socket.on('watch_game', function(msg){
      socket.join(msg.roomName);
      
      let game = games[msg.roomName];
      socket.emit('update_game_state', {
        currentTurn : game.currentTurn,
        started: game.started,
        state : game.state, 
        newGame : true,
        rows : game.rows,
        cols : game.cols,
        winCount : game.winCount,
        players: game.players
      });
    });

    socket.on('vote', function(msg){
      if(socket.playerId !== undefined){
        let game = games[msg.roomName];
        game.voteCount += 1;
        game.vote = game.vote && (msg.vote === 1);
        
        if(game.voteCount === Object.keys(game.players).length){
          if(game.vote){
            let size = game.rows * game.cols;
            
            // Reset the state of the game 
            game.state = [];
            for(var i = 0; i < game.cols; i++){
              game.state.push([]); 
            }
            game.dj_sets = {
              horizontal : new DisjointSet(size),
              vertical : new DisjointSet(size),
              diagonal_left : new DisjointSet(size),
              diagonal_right : new DisjointSet(size)
            };
            game.started = true;
            game.turns = 0;
            game.currentTurn = (game.firstPerson + 1) % 2;
            game.firstPerson = game.currentTurn;

            io.to(msg.roomName).emit('update_game_state', {
              currentTurn : game.currentTurn, 
              started: game.started,
              winCount : game.winCount,
              state : game.state,
              players: game.players
            });
          }else{
            // Remove the game and user from map
            delete userMap[socket.playerId];
            delete games[msg.roomName];
          
            // Let room know the game is over
            io.to(msg.roomName).emit('game_over');
            
            // Stop listening to room events
            socket.leave(msg.roomName);
          }
        }
      }
    });

    /**
     * Makes a move on the game state and then emits an event telling everyone to update
     * the UI.
     */
    socket.on('make_move', function(msg){
      var game = games[msg.roomName];
      if(game.started && msg.piece === socket.pieceValue){
        if(game.state[msg.column].length !== game.cols){
          game.state[msg.column].push(msg.piece);
          game.turns++;

          var winner = updateSet(game, msg.column);
          if(winner >= 0){
            game.winCount[msg.piece]++;
            game.started = false;
            
            game.voteCount = 0;
            game.vote = true;

            io.to(msg.roomName).emit('winner',  {
              winner : winner,
              state: game.state
            });
          }else if(game.turns === (game.rows * game.cols)){
            game.started = false; 
            game.voteCount = 0; 
            game.vote = true;
            io.to(msg.roomName).emit('tie', {
              state: game.state
            });
          }else{
            game.currentTurn = (game.currentTurn + 1) % 2;
          }
          io.to(msg.roomName).emit('update_game_state', {
            currentTurn : game.currentTurn, 
            started: game.started,
            state : game.state, 
            lastPlay : msg.column,
            winCount : game.winCount,
            players: game.players
          });
        }
      }
    });
  }
};
