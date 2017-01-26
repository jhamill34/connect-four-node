from random import randint
from ai_player import AIPlayer
from Net import NetPool

GAME_COUNT = 1
POOL_SIZE = 4 

class MinMaxAI(AIPlayer):
    def __init__(self):
        self.current_count = 0
        self.pool = NetPool()
        self.pool.setRecipe(42, [42, 7, 1])
        self.pool.create(POOL_SIZE)
        
        self.net = self.pool.checkout()


    # Give the current board a fitness value 
    def rank_state(self, state, piece):
        vector_state = []
        for i in range(self.column_count):
            for j in range(self.row_count):
                if j >= len(state[i]): 
                    vector_state.append(0) 
                elif state[i][j] == piece: 
                    vector_state.append(1) 
                else: 
                    vector_state.append(-1)
        return self.net.feedForward(vector_state)[0]

    def traverse_moves(self, state, depth, h, isMax, alpha, beta):
        current_move = 0
        
        if h == depth:
            return current_move, self.rank_state(state, 0) - self.rank_state(state, 1)

        if isMax:
            opt_value = -9999
            for i in range(self.column_count):
                if len(state[i]) < self.row_count: 
                    # Make move
                    state[i].append(0)

                    # get value of the children 
                    previous_move, current_value = self.traverse_moves(state, depth + 1, h, False, alpha, beta) 

                    # print str(i) + ", " + str(current_value) + ", " + str(opt_value) + ", " + str(alpha) + ", " + str(beta)

                    # Keep the max
                    opt_value = max(current_value, opt_value)
                    if opt_value == current_value:
                        current_move = i

                    # Update Alpha
                    alpha = max(alpha, opt_value)

                    # Undo move
                    state[i].pop()
                
                if beta <= alpha:
                    return (current_move, opt_value)                    

        else:
            opt_value = 9999 
            for i in range(self.column_count):
                if len(state[i]) < self.row_count:
                    # Make Move
                    state[i].append(1)

                    # get value of children
                    previous_move, current_value = self.traverse_moves(state, depth + 1, h, True, alpha, beta)
                    
                    # print str(i) + ", " + str(current_value) + ", " + str(opt_value) + ", " + str(alpha) + ", " + str(beta)

                    # Keep Min value
                    opt_value = min(current_value, opt_value)
                    if opt_value == current_value:
                        current_move = i

                    # Update beta
                    beta = min(beta, opt_value)

                    # Undo move
                    state[i].pop()

                if beta <= alpha:
                   return (current_move, opt_value)                    

        return (current_move, opt_value)

    # Takes in a 2d array indicating the state of the game
    # returns an int that indicates which move they would like to make
    def make_move(self, state):
        move, value = self.traverse_moves(state, 0, 4, True, -9999, 9999)
        return move

    def end_game(self, winner):
        self.current_count += 1
        if winner == self.piece:
            self.net.fitness += 1

        if self.current_count % GAME_COUNT == 0:
            self.pool.checkin(self.net)
            self.net = self.pool.checkout()

        if self.current_count % (GAME_COUNT * POOL_SIZE) == 0:
            self.pool.checkin(self.net)
            self.pool.population.sort(key = lambda x : x.fitness, reverse= True)
            print "SORTED"
            
            # Kill off half of population 
            for i in range(POOL_SIZE / 2):
                self.pool.checkout()
            print "KILL"
            
            for i in range(POOL_SIZE / 4):
                parent_a = self.pool.checkout()
                parent_b = self.pool.checkout()
                child_a = parent_a.mate(parent_b)
                child_b = parent_a.mate(parent_b)
                print "SEX"           
                self.pool.checkin(parent_a)
                self.pool.checkin(parent_b)
                self.pool.checkin(child_a)
                self.pool.checkin(child_b)
            self.net = self.pool.checkout()
            print "DONE"
                


if __name__ == "__main__":
    runner = MinMaxAI()
    runner.row_count = 6
    runner.column_count = 7
    runner.piece =1 
    runner.current_count = 10
    runner.end_game(1)
