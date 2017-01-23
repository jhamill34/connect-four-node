from random import randint
from ai_player import AIPlayer

class TestAI2(AIPlayer):
    # Takes in a 2d array indicating the state of the game
    # returns an int that indicates which move they would like to make
    def make_move(self, state):
        return randint(4, 6)
