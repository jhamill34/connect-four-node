'use strict';

function DisjointSet(size){
  this.count = size;
  this.sets = new Array(size); 

  this.init = function(item){
    if(this.sets[item] === undefined && item < this.count){
      this.sets[item] = -1;
    }
  };

  this.find = function(item){
    let current = item;
    while(this.sets[current] > 0){
      current = this.sets[current];
    }

    return -1 * this.sets[current];
  };

  this.join = function(a, b){
    let a_head, b_head, previous_b_head;

    a_head = a;
    while(this.sets[a_head] > 0){
      a_head = this.sets[a_head];
    }

    b_head = b;
    while(this.sets[b_head] > 0){
      previous_b_head = b_head;
      b_head = this.sets[b_head];
      this.sets[previous_b_head] = a_head;
    }

    this.sets[a_head] += this.sets[b_head];
    this.sets[b_head] = a_head;
  };
}

module.exports = DisjointSet;

