from socketIO_client import SocketIO

def on_update_game_state(*args): 
    print("Game Updated", args)

def on_win(*args):
    print("End of Game", args)

socketIO = SocketIO('young-basin-31619.herokuapp.com')
socketIO.on('update_game_state', on_update_game_state)
socketIO.on('winner', on_win)

socketIO.emit('watch_game', { 'roomName' : 'Game' , 'screenName' : 'AI' })

try:
    socketIO.wait()
except ConnectionError:
    print e
