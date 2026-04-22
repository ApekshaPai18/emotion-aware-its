"""
Simple Q-Learning Agent
"""
import random
import json
import os
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class QLearningAgent:
    def __init__(self, actions, alpha=0.1, gamma=0.9, epsilon=0.2):
        self.actions = actions
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.q_table = defaultdict(lambda: {a: 0.0 for a in self.actions})
        self.load("q_table.json")
        logger.info(f"RL Agent initialized with {len(actions)} actions")
    
    def choose_action(self, state):
        state_key = json.dumps(state)
        if random.random() < self.epsilon:
            return random.choice(self.actions)
        return max(self.q_table[state_key], key=self.q_table[state_key].get)
    
    def update(self, state, action, reward, next_state):
        state_key = json.dumps(state)
        next_key = json.dumps(next_state)
        
        old = self.q_table[state_key][action]
        next_max = max(self.q_table[next_key].values())
        new = old + self.alpha * (reward + self.gamma * next_max - old)
        self.q_table[state_key][action] = new
        self.save("q_table.json")
    
    def save(self, path):
        try:
            with open(path, 'w') as f:
                json.dump({k: dict(v) for k, v in self.q_table.items()}, f)
        except:
            pass
    
    def load(self, path):
        try:
            if os.path.exists(path):
                with open(path, 'r') as f:
                    data = json.load(f)
                    self.q_table = defaultdict(lambda: {a: 0.0 for a in self.actions})
                    for k, v in data.items():
                        self.q_table[k] = v
        except:
            pass