import time
from random import randint
from socketIO_client import SocketIO

socketIO = SocketIO('young-basin-31619.herokuapp.com')
piece = -1 
game_start = False

def on_update_game_state(*args): 
    global piece

    print("Game Updated", args) 
    if 'player_id' in args[0]:
        piece = args[0]['player_id']
    game_start = args[0]['started']

    if game_start:
        current_turn = args[0]['currentTurn']
        if current_turn == piece:
            time.sleep(3)
            socketIO.emit('make_move', {'roomName' : 'ai-room', 'piece' : piece, 'column' : randint(0, 6)})

def on_win(*args):
    print("End of Game", args)
    socketIO.emit('vote', {'roomName' : 'ai-room', 'vote' : 1})

socketIO.on('update_game_state', on_update_game_state)
socketIO.on('winner', on_win)

socketIO.emit('create_game', { 'roomName' : 'ai-room' , 'screenName' : 'AI','rows' : 6, 'cols' : 7, 'toWin' : 4 })

try:
    socketIO.wait()
except ConnectionError:
    print e
