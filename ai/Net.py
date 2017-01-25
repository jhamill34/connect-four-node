import random
import math

class Neuron:
    def __init__(self, n):
        self.weights = []
        self.weights.append(1) # bias 
        for i in range(n - 1):
            self.weights.append(random.uniform(0, 1))

    def feedForward(self, inputs):
        result = 0
        for i in range(len(inputs)): 
            result += self.weights[i] * inputs[i]

        return self.activate(result)

    def activate(self, value):
        return (1.0 / (1 + math.exp(-1 * value)))

class Net:
    def __init__(self, n_input):
        self.net = []
        self.input_size = n_input
     
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

    def create(self, pop_size):
        for i in range(pop_size):
            self.population.append(createNet(self.input_size, self.recipe))
    
    def checkout(self):
        return self.population.pop()
    
    def checkin(self, net):
        self.population.insert(0, net)

    def isEmpty(self):
        return len(self.population) == 0

if __name__ == "__main__":
    # Input layer
    in_values = [0, 0, 0]

    npool = NetPool()
    npool.setRecipe(3, [3, 4, 2, 1])
    npool.create(100)

    while not npool.isEmpty():
        print npool.checkout().feedForward(in_values)

    
