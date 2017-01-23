from random import randint

#
# The expectation is that this class gets
# overridden to implement the make_move method
#
class AIPlayer:
    # Takes in a 2d array indicating the state of the game
    # returns an int that indicates which move they would like to make
    def make_move(self, state):
        return randint(0, len(state) - 1)

