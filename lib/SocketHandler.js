/**
 * @author Joshua Rasmussen
 *
 * File manages the SocketIO event handlers. 
 *
 * Events Listeners include  
 *  disconnect  
 *  leave_room
 *  create_game
 *  join_game
 *  watch_game
 *  vote
 *  make_move
 */

'use strict';

const uuid = require('node-uuid');

const GameManager = require('./GameManager.js');
const Game = require('./Game.js');

module.exports = function(io){
  let gameManager = new GameManager();
  
  return function(socket){
    /**
     * When a socket disconnects we remove the game from
     * the map and then send the DISCONNECT_MESSAGE to 
     * other sockets connected to the room
     */
    socket.on('disconnect', function(){
      if(socket.playerId){
        let roomName = gameManager.roomNameForUser(socket.playerId);
        socket.to(roomName).emit('disconnect_message', 'Other Player diconnected');
        gameManager.destroyGameSession(socket.playerId);
      }
    });

    /**
     * When a socket requests to leave the room, just remove them from the 
     * socket. Generally happens when the socket recieves the DISCONNECT_MESSAGE. 
     * Used to clean up and allow them to create a new game.
     */
    socket.on('leave_room', function(msg){
      let roomName = gameManager.roomNameForUser(socket.playerId);
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
     
      if(gameManager.gameForRoomName(msg.roomName) !== undefined){
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
      gameManager.setRoomNameForUser(socket.playerId, msg.roomName);

      let game = new Game(msg.rows, msg.cols, msg.toWin); 
      game.addPlayer(msg.screenName);
      gameManager.addGameForRoomName(msg.roomName, game);

      // Update the client
      socket.emit('update_game_state', {
        started: game.started,
        state : game.state, 
        winCount : game.winCount,
        newGame : true,
        rows : game.rows,
        cols : game.cols,
        player_id: socket.pieceValue,
        players: game.players
      });
    });

    /**
     * Send this with the room name you are looking to join. 
     * Will start the game.
     */
    socket.on('join_game', function(msg){
      // If the game hasn't been made yet get out!
      let game = gameManager.gameForRoomName(msg.roomName);
      if(game === undefined) {
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
      gameManager.setRoomNameForUser(socket.playerId, msg.roomName);
     
      game.addPlayer(msg.screenName);
      game.start();
      game.flipToGoFirst();
        
      socket.emit('update_game_state', {
        currentTurn : game.currentTurn,
        started: game.started,
        state : game.state, 
        newGame : true,
        rows : game.rows,
        cols : game.cols,
        winCount : game.winCount,
        player_id: socket.piecePvalue,
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
      
      let game = gameManager.gameForRoomName(msg.roomName);
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
        let game = gameManager.gameForRoomName(msg.roomName);
        game.castVote(msg.vote);
        
        if(game.votingComplete()){
          if(game.vote){
            game.reset();

            io.to(msg.roomName).emit('update_game_state', {
              currentTurn : game.currentTurn, 
              newGame: true,
              rows : game.rows,
              cols : game.cols,
              started: game.started,
              winCount : game.winCount,
              state : game.state,
              players: game.players
            });
          }else{
            // Remove the game and user from map
            gameManager.destroyGameSession(socket.playerId);

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
      let game = gameManager.gameForRoomName(msg.roomName);
      if(game.started && msg.piece === socket.pieceValue){
        let winSet = game.placePiece(msg.column, socket.pieceValue);
        if(winSet !== undefined){
          if(winSet.length > 0){
            game.incrementWinCount(socket.pieceValue);
            game.stop();
            game.startVoting();

            io.to(msg.roomName).emit('winner',  {
              winner : msg.piece,
              state: game.state,
              winSet: winSet
            });
          }else if(game.turns === (game.rows * game.cols)){
            game.stop();
            game.startVoting();
            
            io.to(msg.roomName).emit('tie', {
              state: game.state
            });
          }else{
            game.nextTurn();
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
