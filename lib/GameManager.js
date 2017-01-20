/**
 * @author Joshua Rasmussen
 *
 * Used to keep track of multiple sessions of games
 */

'use strict';


function GameManager(){
  // Set up some data structures 
  // to monitor multiple sessions
  this.games = {};
  this.userMap = {};

  this.roomNameForUser = function(playerId){
    return this.userMap[playerId];
  };

  this.destroyGameSession = function(playerId){
    let roomName = this.roomNameForUser(playerId);
    delete this.userMap[playerId];
    delete this.games[roomName];
  };

  this.gameForRoomName = function(roomName){
    return this.games[roomName];
  };

  this.setRoomNameForUser = function(playerId, roomName){
    this.userMap[playerId] = roomName;
  };

  this.addGameForRoomName = function(roomName, game){
    this.games[roomName] = game;
  }
}

module.exports = GameManager;
