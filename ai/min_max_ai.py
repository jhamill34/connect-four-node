from random import randint
from ai_player import AIPlayer

class MinMaxAI(AIPlayer):
    # Give the current board a fitness value 
    def rank_state(self, state):
        result = 0
        invalid = False
        print state
        for i in range(self.row_count):
            for j in range(self.column_count - 4):
                for k in range(4):
                    if i < len(state[j + k]) and state[j + k][i] != self.piece:
                        invalid = True

                if not invalid:
                    result += 1
                invalid = False
        
        for i in range(self.column_count):
            for j in range(self.row_count - 4):
                for k in range(4):
                    if (j + k) < len(state[i]) and state[i][j + k] != self.piece:
                        invalid = True

                if not invalid:
                    result += 1
                invalid = False
        
        for i in range(self.column_count - 4):
            for j in range(self.row_count - 4):
                for k in range(4):
                    if (j + k) < len(state[i + k]) and state[i + k][j + k] != self.piece:
                        invalid = True

                if not invalid:
                    result += 1
                invalid = False
        
        for i in range(self.column_count - 4):
            for j in range(self.row_count - 4):
                for k in range(4):
                    if (j + k + 4) < len(state[i - k]) and state[i - k][j + k + 4] != self.piece:
                        invalid = True

                if not invalid:
                    result += 1
                invalid = False

        return result

    # take the current state and make a move 
    def simulate_move(self, col, state):
        state[col].append(self.piece)
        value = self.rank_state(state) 
        state[col].pop()
        
        print value
        return value

    def traverse_moves(self, state):
        max_rank = 0
        current_move = 0
        for i in range(len(state)):
            current_rank = self.simulate_move(i, state)
            if current_rank > max_rank:
                current_move = i
                max_rank = current_rank

        return current_move

    # Takes in a 2d array indicating the state of the game
    # returns an int that indicates which move they would like to make
    def make_move(self, state):
        print state
        return self.traverse_moves(state)

