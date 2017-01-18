var b;
var currentTurn;
var socket;
var roomName;

window.onload = function(){
  var createBtn = document.getElementById('create');
  var joinBtn = document.getElementById('join');
  var roomNameText = document.getElementById('name');
  var setupForm = document.getElementById('setup-form');

  b = new Board(6, 7, 60);
  
  socket = io();
  socket.on('error_message', function(msg){
    alert(msg);
    setupForm.classList.remove('hide');
  });
 
  socket.on('winner', function(winner){
    alert(msg);
    setupForm.classList.remove('hide');
    socket.emit('leave_room', roomName);
  });

  socket.on('disconnect_message', function(msg){
    alert(msg);
    setupForm.classList.remove('hide');
    socket.emit('leave_room', roomName);
  });
  
  socket.on('update_game_state', function(msg){
    b.state = msg.state;
    if(msg.started){
      currentTurn = msg.currentTurn;
    }else{
      currentTurn = null;
    }

    if(msg.player_id !== undefined){
      socket.player_id = msg.player_id;
    }
  });

  createBtn.onclick = function(){
    roomName = roomNameText.value; 
    socket.emit('create_game', {
      rows : 6,
      cols : 7,
      toWin : 4,
      roomName : roomName
    });
    setupForm.classList.add('hide');
  };

  joinBtn.onclick = function(){
    roomName = roomNameText.value;
    socket.emit('join_game', {
      roomName : roomName
    });
    setupForm.classList.add('hide');
  };
};

function setup(){
  createCanvas(600, 460);
}

function draw(){
  background(150);

  if(b !== undefined){
    b.show();
  }
}

function mousePressed(){
  var setupForm = document.getElementById('setup-form');
  if(setupForm.classList.contains('hide')){
    b.placePiece(currentTurn);
  }
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
        socket.emit('make_move', { 
          piece: piece, 
          column : col,
          roomName : roomName 
        });
      }
    }
  }

  // Display function to display the state of the game
  this.show = function(){
    if(socket.player_id !== undefined){
      textAlign(CENTER);
      
      fill(255);
      textSize(48);
      text(roomName, width / 2, 40);
      
      textSize(24);
      if(socket.player_id === 0){
        fill(66, 134, 244);
      }else if(socket.player_id === 1){
        fill(244, 66, 66);
      }

      text("Player " + socket.player_id + "'s Board", width / 3, 75);
     
      fill(255);

      if(currentTurn !== null){
        text("Player " + currentTurn + "'s Turn", width * 2 / 3, 75);
      }else{
        text("Waiting on other player...", width * 3 / 4, 75);
      }
    }
   
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
            fill(150);
          }
        }else{
          fill(150);
        }

        ellipse(i * this.radius, (this.rows - j - 1) * this.radius, this.radius * 0.8, this.radius * 0.8);
      }
    }
  }
}
