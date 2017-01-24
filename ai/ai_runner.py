import time
import sys, getopt
from socketIO_client import SocketIO
from ai_player import AIPlayer

def on_update_game_state(*args): 
    print("Game Updated", args) 
    if 'player_id' in args[0]:
        runner.piece = args[0]['player_id']
        runner.column_count = args[0]['cols']
        runner.row_count = args[0]['rows']
    runner.game_start = args[0]['started']

    if runner.game_start:
        current_turn = args[0]['currentTurn']
        if current_turn == runner.piece:
            # Delay to be able to watch the game
            time.sleep(delay)
                
            move = runner.make_move(args[0]['state'])

            # Implement a time limit that will send a forefit signal to the server
            socketIO.emit('make_move', {'roomName' : 'ai-room', 'piece' : runner.piece, 'column' : move})

def on_win(*args):
    print("End of Game", args)
    time.sleep(delay)
    socketIO.emit('vote', {'roomName' : runner.room_name, 'vote' : 1})

def on_error_message(*args):
    print("ERROR :", args)

def on_disconnected(*args):
    print("Other player left")
    socketIO.emit('leave_room', runner.room_name)
    sys.exit()

if __name__ == "__main__":
    try:
        opts, args = getopt.getopt(sys.argv[1:], "hr:x:y:s:w:c:d:l:i:", ["room-name=", "cols=", "rows=", "screen-name=", "to-win=", "create=", "delay=", "limit=", "impl="])
    except getopt.GetoptError:
        print 'ai-runner.py --room-name=<room-name> --rows=<rows> --cols=<cols> --screen-name=<screen-name> --to-win=<to win> --create=<yes or no>'
        sys.exit(2)

    delay = 3
    limit = 1
    AIClass = AIPlayer
    for opt, arg in opts:
        if opt == '-h':
            print 'ai-runner.py --room-name=<room-name> --rows=<rows> --cols=<cols> --screen-name=<screen-name> --to-win=<to win> --create=<yes or no>'
            sys.exit()
        elif opt in("-r", "--room-name"):
            room_name = arg
        elif opt in("-x", "--cols"):
            cols = int(arg)
        elif opt in("-y", "--rows"):
            rows = int(arg)
        elif opt in("-s", "--screen-name"):
            screen_name = arg
        elif opt in("-w", "--to-win"):
            to_win = int(arg)
        elif opt in("-c", "--create"):
            create = int(arg)
        elif opt in("-d", "--delay"):
            delay = float(arg)
        elif opt in("-l", "--limit"):
            limit = float(arg)
        elif opt in("-i", "--impl"):
            module, _class = arg.split(".")
            module = __import__(module)
            AIClass = getattr(module, _class)


    if issubclass(AIClass, AIPlayer):
      runner = AIClass()
    else:
      print("Invalid class!")
      sys.exit()

    runner.room_name = room_name
    socketIO = SocketIO('localhost', 3000)


    socketIO.on('update_game_state', on_update_game_state)
    socketIO.on('winner', on_win)
    socketIO.on('error_message', on_error_message) 
    socketIO.on('disconnect_message', on_disconnected)

    if create == 1:
        socketIO.emit('create_game', { 'roomName' : room_name , 'screenName' : screen_name,'rows' : rows, 'cols' : cols, 'toWin' : to_win })
    else:
        socketIO.emit('join_game', {'roomName' : room_name, 'screenName' : screen_name})
    
    try:
        socketIO.wait()
    except ConnectionError:
        print e
