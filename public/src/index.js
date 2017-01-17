var b;
var currentTurn;
var socket;


function setup(){
  createCanvas(600, 400);
  b = new Board(6, 7, 60);
  
  socket = io();
  socket.on('update_game_state', function(msg){
    b.state = msg.state;
    currentTurn = msg.currentTurn;

    if(msg.player_id !== undefined){
      socket.player_id = msg.player_id;
    }
  });
}

function draw(){
  background(50);
  b.show();
}

function mousePressed(){
  b.placePiece(currentTurn);
}

function Board(r, c, slot_size){
  this.rows = r;
  this.cols = c;
  this.radius = slot_size;
  this.height = this.radius * this.rows;
  this.width = this.radius * this.cols;

  this.placePiece = function(piece){
    var col;

    // Find where you clicked
    var normalX = mouseX - (width - this.width) / 2;
    col = Math.floor(normalX / this.radius);

    // If within range send to server
    if(col >= 0 && col < this.cols){
      if(this.state[col].length < this.rows){
        socket.emit('make_move', { piece: piece, column : col});
      }
    }
  }

  // Display function to display the state of the game
  this.show = function(){
    if(socket.player_id !== undefined){
      textSize(24);
      if(socket.player_id === 0){
        fill(66, 134, 244);
      }else if(socket.player_id === 1){
        fill(244, 66, 66);
      }
      text("Player " + socket.player_id + "'s Board", 10, 30);
    }
   
    fill(255);
    text("Player " + currentTurn + "'s Turn", 250, 30);

    noStroke();
    fill(255, 255, 102);
    translate((width - this.width) / 2, (height - this.height));
    rect(0, 0, this.width, this.height);

    translate(this.radius / 2, this.radius / 2);

    for(var i = 0; i < this.cols; i++){
      for(var j = 0; j < this.rows; j++){
        var c;
        if(this.state !== undefined && this.state[i] !== undefined){
          if(this.state[i][j] === 0){
            fill(66, 134, 244);
          }else if(this.state[i][j] === 1){
            fill(244, 66, 66);
          }else{  
            fill(50);
          }
        }else{
          fill(50);
        }

        ellipse(i * this.radius, (this.rows - j - 1) * this.radius, this.radius * 0.9, this.radius * 0.9);
      }
    }
  }
}
