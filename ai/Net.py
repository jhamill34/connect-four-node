#
# @author Joshua Rasmussen
# 
# The goal of this file is to recreate an Aritifial Neural Network
# and a Genetic Pool of nets that will compete with each other 
# to eventually create the best network to play against
# This is an Unsupervised learning approach. 
# 
# THE PLAN:
# we will generate a pool of networks that make up a GENERATION.
# each initial net will be generated with random weights.
# two at a time we will pull them out and have them play N games.
#

import random
import math

class Neuron:
    def __init__(self, n):
        self.weights = []
        for i in range(n + 1):
            self.weights.append(random.uniform(0, 1))

    def feedForward(self, inputs):
        result = self.weights[0]
        for i in range(len(inputs)): 
            result += self.weights[i + 1] * inputs[i]

        return self.activate(result)

    def activate(self, value):
        return (1.0 / (1 + math.exp(-1 * value)))

    def clone(self):
        # Create new instance
        neuron = Neuron(len(self.weights))

        # Copy all the weights
        for i in range(len(self.weights)):
            neuron.weights[i] = self.weights[i]

        return neuron

    # 50% chance of taking the parter weights
    def mate(self, other):
        for i in range(len(self.weights)):
            if random.randint(0, 1) == 0:
               self.weights[i] = other.weights[i] 

    # 2% chance of mutating any given weight
    def mutate(self):
        for i in range(len(self.weights)):
            if random.randint(0, 50) == 0:
                self.weights[i] = random.uniform(0, 1)

class Net:
    def __init__(self, n_input):
        self.net = []
        self.input_size = n_input
        self.fitness = 0

    def addLayer(self, num_nodes):
        layer = []
        if len(self.net) == 0:
            h_input = self.input_size
        else:
            h_input = len(self.net[len(self.net) - 1])

        for i in range(num_nodes):
            layer.append(Neuron(h_input))

        self.net.append(layer)

        return self

    def clone(self):
        n = Net(self.input_size)
        n.net = list(self.net)
        for i in range(len(self.net)):
            n.net[i] = list(self.net[i])
            for j in range(len(self.net[i])):
               n.net[i][j] = self.net[i][j].clone() 

        return n

    def mate(self, other):
        child = self.clone()
        for i in range(len(self.net)):
            for j in range(len(self.net[i])):
                child.net[i][j].mate(other)
                child.net[i][j].mutate()

    def feedForward(self, in_values):
        previous_out = in_values
        for l in self.net:
            layer_out = []
            for n in l:
                layer_out.append(n.feedForward(previous_out))
            
            previous_out = layer_out

        return previous_out

def createNet(input_size, topo_sequence):
    net = Net(input_size)
    for layer_size in topo_sequence:
        net = net.addLayer(layer_size)

    return net

class NetPool:
    def __init__(self):
        self.population = []

    def setRecipe(self, input_size, topo_sequence): 
        self.recipe = topo_sequence
        self.input_size = input_size
        return self

    def generate(self):
        self.population.append(createNet(self.input_size, self.recipe))

    def create(self, pop_size):
        for i in range(pop_size):
            self.generate()

    def checkout(self):
        return self.population.pop()
    
    def checkin(self, net):
        self.population.insert(0, net)

    def isEmpty(self):
        return len(self.population) == 0

if __name__ == "__main__":
    in_values = [0, 0, 0]

    npool = NetPool()
    npool.setRecipe(3, [3, 4, 2, 1])
    npool.create(100)

    # we could set it up so that every one plays everyone and we keep track of the game record as the fitness
    # to keep the population from blowing up we kill off the 50% of the population with the lowest fitness
    # and we mate the top 50%
    # rinse and repeat

    while not npool.isEmpty():
        print npool.checkout().feedForward(in_values)

