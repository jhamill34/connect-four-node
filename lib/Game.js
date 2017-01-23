/**
 * @author Joshua Rasmussen
 *
 * File manages the specific aspects to a single game (i.e. game mechanics)
 */

'use strict';

const DisjointSet = require('./DisjointSet.js');

function Game(rows, cols, toWin){
  this.rows = rows;
  this.cols = cols;
  this.toWin = toWin;

  let size = rows * cols;

  this.started = false;
  this.currentTurne = 0;
  this.state = [];
  for(var i = 0; i < this.cols; i++){
    this.state.push([]);
  }

  this.turns = 0;
  this.dj_sets = {
    horizontal : new DisjointSet(size),
    vertical : new DisjointSet(size),
    diagonal_left : new DisjointSet(size),
    diagonal_right : new DisjointSet(size)
  };
  this.players = [];
  this.winCount = [];

  /**
   *
   */
  this.addPlayer = function(name){
    this.players.push(name);
    this.winCount.push(0);
  };

  /**
   *
   */
  this.start = function(){
    this.started = true;
  };

  /**
   *
   */
  this.stop = function(){
    this.started = false;
  };

  /**
   *
   */
  this.reset = function(){
    let size = this.rows * this.cols;
    this.state = [];
    for(var i = 0; i < this.cols; i++){
      this.state.push([]);
    }

    this.dj_sets = {
      horizontal : new DisjointSet(size),
      vertical : new DisjointSet(size),
      diagonal_left : new DisjointSet(size),
      diagonal_right : new DisjointSet(size)
    };

    this.started = true;
    this.turns = 0;
    this.currentTurn = (this.firstPerson + 1) % 2;
    this.firstPerson = this.currentTurn;
  };

  /**
   *
   */
  this.flipToGoFirst = function(){
    if(this.start){
      this.currentTurn = Math.floor(Math.random() * this.players.length);
      this.firstPerson = this.currentTurn;
    }
  };

  /**
   *
   */
  this.nextTurn = function(){
    this.currentTurn = (this.currentTurn + 1) % this.players.length;
  }

  /**
   *
   */
  this.placePiece = function(column, piece){
    let winSet;
    if(this.state[column].length !== this.cols){
      this.state[column].push(piece);
      this.turns++;
      winSet = this.updateSets(column);
    }

    return winSet;
  };

  /**
   *
   */
  this.incrementWinCount = function(piece){
    this.winCount[piece]++;
  };

  /**
   *
   */
  this.updateSets = function(column){
    let row = this.state[column].length - 1;
    let p = this.state[column][row];
  
    let setIndex = this.cols * row + column;
    console.log(setIndex);

    // Update Horizontal
    this.dj_sets.horizontal.init(setIndex);
    if(column > 0 && this.state[column - 1][row] === p){
      this.dj_sets.horizontal.join(setIndex - 1, setIndex);
    }
  
    if(column < (this.cols - 1) && this.state[column + 1][row] === p){
      this.dj_sets.horizontal.join(setIndex + 1, setIndex);
    }

    console.log(this.dj_sets.horizontal.sets); 
    if(this.dj_sets.horizontal.find(setIndex) >= this.toWin){
      return this.dj_sets.horizontal.findAllInSet(setIndex);
    }
  
    // Update Vertical
    this.dj_sets.vertical.init(setIndex);
    if(row > 0 && this.state[column][row - 1] === p){
      this.dj_sets.vertical.join(setIndex - this.cols, setIndex);
    }
  
    if(row < (this.rows - 1) && this.state[column][row + 1] === p){
      this.dj_sets.vertical.join(setIndex + this.cols, setIndex);
    }
  
    console.log(this.dj_sets.vertical.sets); 
    if(this.dj_sets.vertical.find(setIndex) >= this.toWin){
      return this.dj_sets.vertical.findAllInSet(setIndex);
    }
  
  
    // Update Diagonal Left
    this.dj_sets.diagonal_left.init(setIndex);
    if(row > 0 && column > 0 && this.state[column - 1][row - 1] === p){
      this.dj_sets.diagonal_left.join(setIndex - this.cols - 1, setIndex);
    }
  
    if(row < (this.rows - 1) && column < (this.cols - 1) && this.state[column + 1][row + 1] === p){
      this.dj_sets.diagonal_left.join(setIndex + this.cols + 1, setIndex);
    }
  
    console.log(this.dj_sets.diagonal_left.sets); 
    if(this.dj_sets.diagonal_left.find(setIndex) >= this.toWin){
      return this.dj_sets.diagonal_left.findAllInSet(setIndex);
    }
    
    // Update Diagonal Right
    this.dj_sets.diagonal_right.init(setIndex);
    if(row > 0 && column < (this.cols - 1) && this.state[column + 1][row - 1] === p){
      this.dj_sets.diagonal_right.join(setIndex - this.cols + 1, setIndex);
    }
  
    if(row < (this.rows - 1) && column > 0 && this.state[column - 1][row + 1] === p){
      this.dj_sets.diagonal_right.join(setIndex + this.cols - 1, setIndex);
    }
    
    console.log(this.dj_sets.diagonal_right.sets); 
    if(this.dj_sets.diagonal_right.find(setIndex) >= this.toWin){
      return this.dj_sets.diagonal_right.findAllInSet(setIndex);
    }
  
    return [];
  }

  //***********************************
  //*           Voting                *
  //***********************************

  /**
   *
   */
  this.startVoting = function(){
    this.voteCount = 0;
    this.vote = true;
  };

  /**
   *
   */
  this.castVote = function(vote){
    this.voteCount += 1;
    this.vote = this.vote && (vote === 1);
  };

  /**
   *
   */
  this.votingComplete = function(){
    return this.voteCount === this.players.length;
  };
}


module.exports = Game;
