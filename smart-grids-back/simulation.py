import numpy as np
import simpy

def generate_markov_states(steps: int):
    states = ['low', 'medium', 'high']
    transition_matrix = {
        'low': [0.6, 0.3, 0.1],
        'medium': [0.2, 0.6, 0.2],
        'high': [0.1, 0.4, 0.5]
    }
    current = 'medium'
    result = []

    for _ in range(steps):
        current = np.random.choice(states, p=transition_matrix[current])
        result.append(current)

    return result

def simulate_demand(params, strategy):
    np.random.seed(42)
    hours = params.hours
    demand_profile = []

    markov_states = generate_markov_states(hours)

    for h in range(hours):
        state = markov_states[h]
        multiplier = {'low': 0.6, 'medium': 1.0, 'high': 1.5}[state]

        home = np.random.normal(loc=1.5, scale=0.3, size=params.num_homes)
        commercial = np.random.normal(loc=5.0, scale=1.0, size=params.num_commercial)
        industrial = np.random.normal(loc=10.0, scale=2.0, size=params.num_industrial)

        total = (home.sum() + commercial.sum() + industrial.sum()) * multiplier

        if strategy == 'demand_response' and state == 'high':
            total *= 0.85  # Reduce un 15% en estado de alta demanda

        demand_profile.append(total)

    peak = max(demand_profile)
    avg = np.mean(demand_profile)
    reduction = 0.2 * peak if strategy == 'demand_response' else 0

    return {
        "time_series": demand_profile,
        "peak_demand": peak,
        "average_demand": avg,
        "reduced_emissions": reduction
    }
