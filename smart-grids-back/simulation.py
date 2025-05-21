import numpy as np
from typing import Dict, List, Tuple, Literal
import simpy
from datetime import datetime

class EnergySystem:
    """Implementación de dinámica de sistemas para el mercado energético"""
    def __init__(self, initial_price=0.15, renewable_adoption=0.10, storage_capacity=0.05):
        # Estados del sistema (stocks)
        self.energy_price = initial_price  # $/kWh
        self.renewable_adoption = renewable_adoption  # % de generación renovable
        self.storage_capacity = storage_capacity  # % de demanda máxima que puede almacenarse
        
        # Parámetros del sistema
        self.price_sensitivity = 0.3  # Sensibilidad de la demanda al precio
        self.learning_rate = 0.01  # Tasa de adopción de renovables
        self.storage_growth_rate = 0.008  # Tasa de crecimiento del almacenamiento
        
        # Historiales para análisis
        self.price_history = [initial_price]
        self.renewable_history = [renewable_adoption]
        self.storage_history = [storage_capacity]
    
    def update(self, current_demand: float, peak_demand: float, dt=1):
        """Actualiza el sistema energético basado en la demanda actual"""
        # Calcular ratio de demanda (qué tan cerca estamos del pico)
        demand_ratio = current_demand / peak_demand if peak_demand > 0 else 0.5
        
        # Flujos del sistema
        # 1. El precio aumenta cuando la demanda es alta y disminuye cuando es baja
        price_change = (demand_ratio - 0.5) * 0.05
        
        # 2. Las renovables crecen más rápido cuando los precios son altos (incentivo económico)
        adoption_change = self.renewable_adoption * self.learning_rate * (1 - self.renewable_adoption) * (1 + self.energy_price/0.15)
        
        # 3. El almacenamiento crece con el tiempo y con la adopción de renovables
        storage_change = self.storage_capacity * self.storage_growth_rate * (1 - self.storage_capacity) * (1 + self.renewable_adoption)
        
        # Actualizar estados
        self.energy_price = max(0.08, min(0.30, self.energy_price + price_change * dt))  # Limitar entre 0.08-0.30 $/kWh
        self.renewable_adoption = min(0.9, self.renewable_adoption + adoption_change * dt)  # Máximo 90% renovable
        self.storage_capacity = min(0.3, self.storage_capacity + storage_change * dt)  # Máximo 30% de almacenamiento
        
        # Guardar historial
        self.price_history.append(self.energy_price)
        self.renewable_history.append(self.renewable_adoption)
        self.storage_history.append(self.storage_capacity)
        
        return {
            "price": self.energy_price,
            "renewable_adoption": self.renewable_adoption,
            "storage_capacity": self.storage_capacity
        }
    
    def get_emission_factor(self) -> float:
        """Calcula el factor de emisión basado en la mezcla energética"""
        # Las energías renovables tienen 0 emisiones, mientras las no renovables tienen un factor base
        non_renewable_factor = 0.5  # kg CO2/kWh
        return non_renewable_factor * (1 - self.renewable_adoption)
    
# Simular consumo base para cada tipo de usuario con distribuciones más realistas
def generate_base_consumption(num_entities, entity_type, hour_of_day, day_type="weekday", seed=None):
    """
    Genera consumos base más realistas utilizando diversas distribuciones estadísticas
    según el tipo de entidad y hora del día.
    
    Args:
        num_entities: Número de entidades a generar
        entity_type: 'home', 'business', o 'industry'
        hour_of_day: Hora del día (0-23)
        day_type: 'weekday' o 'weekend'
        seed: Semilla para reproducibilidad
        
    Returns:
        Array de consumos base
    """
    if seed is not None:
        np.random.seed(seed)
    
    # Factor según hora del día (mayor consumo en horas pico)
    is_weekend = day_type == "weekend"
    hour_factor = 1.0
    
    # Mañana: Pico mayor en días laborales
    if 7 <= hour_of_day <= 9:
        hour_factor = 1.2 + np.random.normal(0, 0.1) if is_weekend else 1.7 + np.random.normal(0, 0.1)
    # Mediodía: Similar en ambos
    elif 12 <= hour_of_day <= 14:
        hour_factor = 1.3 + np.random.normal(0, 0.1)
    # Tarde-noche: Pico mayor en días laborales
    elif 18 <= hour_of_day <= 21:
        hour_factor = 1.4 + np.random.normal(0, 0.1) if is_weekend else 1.8 + np.random.normal(0, 0.1)
    # Madrugada: Bajo en ambos
    elif 0 <= hour_of_day <= 5:
        hour_factor = 0.6 + np.random.normal(0, 0.05)
    
    # Distribuciones específicas según tipo
    if entity_type == 'home':
        # Mezcla de distribuciones para simular diferentes tipos de hogares
        # Distribución bimodal: 70% hogares pequeños, 30% hogares grandes
        mix = np.random.choice([0, 1], size=num_entities, p=[0.7, 0.3])
        small_homes = np.random.normal(1.2, 0.25, num_entities) * hour_factor
        large_homes = np.random.normal(2.5, 0.6, num_entities) * hour_factor
        return np.where(mix == 0, small_homes, large_homes)
    
    elif entity_type == 'business':
        # Distribución log-normal para negocios
        # Crea mayor variabilidad con algunos comercios mucho más grandes que otros
        sigma = 0.8
        mu = np.log(4.0) - sigma**2/2  # Para que la media sea ~4.0
        base = np.exp(np.random.normal(mu, sigma, num_entities))
        # Aplicar límites y factores
        return np.clip(base * hour_factor, 2.0, 40.0)
    
    elif entity_type == 'industry':
        # Distribución mixta para industrias
        # Distribución base usando Pareto para industrias con "larga cola"
        shape = 1.5
        base = np.random.pareto(shape, num_entities) * 10
        # Algunas industrias muy grandes (15%)
        outliers = np.random.choice([0, 1], size=num_entities, p=[0.85, 0.15])
        outlier_values = np.random.uniform(25, 35, num_entities)
        base = np.where(outliers == 1, outlier_values, base)
        # Aplicar factor hora y ajustar rango
        return np.clip(base * hour_factor, 5.0, 70.0)
    
    # Valor por defecto si ninguno coincide
    return np.random.normal(loc=5.0, scale=1.0, size=num_entities)

def generate_markov_states(steps: int, hour_start: int = 0, day_type: str = 'weekday'):
    """
    Genera una secuencia de estados de demanda usando una cadena de Markov mejorada
    con dependencia temporal (hora del día y tipo de día)

    Args:
        steps: Número de pasos (horas) a simular
        hour_start: Hora del día para iniciar (0-23)
        day_type: 'weekday' o 'weekend'

    Returns:
        Lista de estados y multiplicadores de demanda correspondientes
    """
    states = ['very_low', 'low', 'medium_low', 'medium', 'medium_high', 'high', 'peak']

    demand_multipliers = {
        'very_low': 0.4,
        'low': 0.6,
        'medium_low': 0.8,
        'medium': 1.0,
        'medium_high': 1.2,
        'high': 1.5,
        'peak': 1.8
    }

    night_matrix = {
        'very_low': [0.70, 0.20, 0.10, 0.00, 0.00, 0.00, 0.00],
        'low':      [0.20, 0.60, 0.15, 0.05, 0.00, 0.00, 0.00],
        'medium_low':[0.10, 0.20, 0.60, 0.10, 0.00, 0.00, 0.00],
        'medium':   [0.05, 0.15, 0.20, 0.50, 0.10, 0.00, 0.00],
        'medium_high':[0.05, 0.10, 0.15, 0.20, 0.40, 0.10, 0.00],
        'high':     [0.10, 0.10, 0.10, 0.20, 0.20, 0.30, 0.00],
        'peak':     [0.10, 0.20, 0.20, 0.20, 0.15, 0.10, 0.05]
    }

    morning_matrix = {
        'very_low': [0.20, 0.50, 0.20, 0.10, 0.00, 0.00, 0.00],
        'low':      [0.05, 0.30, 0.40, 0.20, 0.05, 0.00, 0.00],
        'medium_low':[0.00, 0.10, 0.30, 0.40, 0.15, 0.05, 0.00],
        'medium':   [0.00, 0.05, 0.15, 0.40, 0.30, 0.10, 0.00],
        'medium_high':[0.00, 0.00, 0.10, 0.30, 0.35, 0.20, 0.05],
        'high':     [0.00, 0.00, 0.05, 0.15, 0.30, 0.40, 0.10],
        'peak':     [0.00, 0.00, 0.00, 0.10, 0.20, 0.30, 0.40]
    }

    midday_matrix = {
        'very_low': [0.10, 0.30, 0.40, 0.20, 0.00, 0.00, 0.00],
        'low':      [0.05, 0.20, 0.40, 0.25, 0.10, 0.00, 0.00],
        'medium_low':[0.00, 0.10, 0.30, 0.40, 0.15, 0.05, 0.00],
        'medium':   [0.00, 0.05, 0.15, 0.50, 0.20, 0.10, 0.00],
        'medium_high':[0.00, 0.00, 0.10, 0.20, 0.40, 0.25, 0.05],
        'high':     [0.00, 0.00, 0.05, 0.15, 0.30, 0.40, 0.10],
        'peak':     [0.00, 0.00, 0.00, 0.10, 0.30, 0.40, 0.20]
    }

    evening_matrix = {
        'very_low': [0.05, 0.20, 0.30, 0.30, 0.15, 0.00, 0.00],
        'low':      [0.00, 0.10, 0.20, 0.40, 0.20, 0.10, 0.00],
        'medium_low':[0.00, 0.05, 0.15, 0.30, 0.30, 0.15, 0.05],
        'medium':   [0.00, 0.00, 0.10, 0.20, 0.30, 0.30, 0.10],
        'medium_high':[0.00, 0.00, 0.05, 0.15, 0.30, 0.30, 0.20],
        'high':     [0.00, 0.00, 0.00, 0.10, 0.20, 0.40, 0.30],
        'peak':     [0.00, 0.00, 0.00, 0.05, 0.15, 0.30, 0.50]
    }

    if day_type == 'weekend':
        new_morning_matrix = {}
        for k, v in morning_matrix.items():
            adjusted = [
                0.7*v[0] + 0.3*v[1],
                0.3*v[0] + 0.5*v[1] + 0.2*v[2],
                0.3*v[1] + 0.5*v[2] + 0.2*v[3],
                0.3*v[2] + 0.4*v[3] + 0.3*v[4],
                0.3*v[3] + 0.4*v[4] + 0.3*v[5],
                0.3*v[4] + 0.5*v[5] + 0.2*v[6],
                0.5*v[5] + 0.5*v[6]
            ]
            total = sum(adjusted)
            normalized = [x / total for x in adjusted]
            new_morning_matrix[k] = normalized
        morning_matrix = new_morning_matrix

    hour_to_matrix = {
        0: night_matrix, 1: night_matrix, 2: night_matrix, 3: night_matrix, 4: night_matrix, 5: night_matrix,
        6: morning_matrix, 7: morning_matrix, 8: morning_matrix, 9: morning_matrix, 10: morning_matrix,
        11: midday_matrix, 12: midday_matrix, 13: midday_matrix, 14: midday_matrix, 15: midday_matrix, 16: midday_matrix,
        17: evening_matrix, 18: evening_matrix, 19: evening_matrix, 20: evening_matrix, 21: evening_matrix,
        22: night_matrix, 23: night_matrix
    }

    hour_based_states = {
        "night": ['very_low', 'low', 'medium_low'],
        "morning": ['low', 'medium_low', 'medium'],
        "midday": ['medium_low', 'medium', 'medium_high'],
        "evening": ['medium', 'medium_high', 'high']
    }

    if hour_start < 6:
        period = "night"
    elif hour_start < 11:
        period = "morning"
    elif hour_start < 17:
        period = "midday"
    else:
        period = "evening"

    current = np.random.choice(hour_based_states[period])

    state_results = []
    multiplier_results = []

    for i in range(steps):
        current_hour = (hour_start + i) % 24
        current_matrix = hour_to_matrix[current_hour]

        probs = current_matrix[current]
        if not np.isclose(sum(probs), 1.0, atol=1e-6):
            raise ValueError(f"Probabilities for state '{current}' at hour {current_hour} do not sum to 1: {sum(probs)}")

        current = np.random.choice(states, p=probs)
        state_results.append(current)
        multiplier_results.append(demand_multipliers[current])

    return state_results, multiplier_results
def calculate_consumer_elasticity(consumer_type: str, price: float, state: str, base_price: float = 0.15) -> float:
    """
    Calcula la elasticidad del consumidor basada en el tipo, precio y estado de la demanda
    
    Args:
        consumer_type: Tipo de consumidor ('home', 'commercial', 'industrial')
        price: Precio actual de la energía
        state: Estado de la demanda
        base_price: Precio de referencia
        
    Returns:
        Cambio porcentual en la demanda
    """
    # La elasticidad varía según el tipo de consumidor
    # Los hogares son más elásticos durante picos, las industrias más inelásticas
    base_elasticity = {
        'home': -0.5,       # Residencial: más elástico
        'commercial': -0.3, # Comercial: elasticidad media
        'industrial': -0.2  # Industrial: menos elástico (procesos fijos)
    }
    
    # La elasticidad también depende del estado de la red
    state_elasticity_multiplier = {
        'very_low': 0.2,    # Baja demanda: poca razón para reducir
        'low': 0.3,
        'medium_low': 0.5,
        'medium': 0.7,
        'medium_high': 0.9,
        'high': 1.2,        # Alta demanda: mayor incentivo para reducir
        'peak': 1.5         # Demanda pico: máximo incentivo
    }
    
    # Calcular elasticidad efectiva
    effective_elasticity = base_elasticity[consumer_type] * state_elasticity_multiplier[state]
    
    # Calcular el cambio de precio relativo
    price_change_percent = (price - base_price) / base_price
    
    # Aplicar elasticidad para determinar el cambio en demanda
    demand_change_percent = effective_elasticity * price_change_percent
    
    # Limitar el rango de cambio (no puede reducirse más del 30% ni aumentar más del 20%)
    return max(-0.3, min(0.2, demand_change_percent))

def simulate_demand_single_run(params, strategy, energy_system=None, seed=None, hour_start=0, day_type='weekday'):
    """
    Ejecuta una simulación de demanda eléctrica
    
    Args:
        params: Parámetros de simulación
        strategy: Estrategia de gestión ('fixed', 'demand_response', 'smart_grid')
        energy_system: Sistema energético para dinámica de sistemas (opcional)
        seed: Semilla para reproducibilidad (None para aleatorio)
        hour_start: Hora de inicio de la simulación (0-23)
        day_type: 'weekday' o 'weekend'
        
    Returns:
        Resultados de la simulación
    """
    # Establecer semilla si se proporciona
    if seed is not None:
        np.random.seed(seed)
    
    hours = params.hours
    demand_profile = []
    price_profile = []
    emission_factors = []
    
    # Inicializar sistema energético si no se proporciona
    if energy_system is None and strategy == 'smart_grid':
        energy_system = EnergySystem()
    elif energy_system is None:
        energy_system = EnergySystem()  # Sistema mínimo para cálculos
    
    # Generar estados de Markov
    markov_states, state_multipliers = generate_markov_states(hours, hour_start, day_type)
    
    # Precio base inicial
    base_price = energy_system.energy_price
    
    max_demand = 0  # Para calcular el máximo durante la simulación
    
    for h in range(hours):
        state = markov_states[h]
        state_multiplier = state_multipliers[h]
        
        # Simular consumo base para cada tipo de usuario
        home_base = generate_base_consumption(params.num_homes, 'home', h % 24, day_type, seed)
        commercial_base = generate_base_consumption(params.num_commercial, 'business', h % 24, day_type, seed)
        industrial_base = generate_base_consumption(params.num_industrial, 'industry', h % 24, day_type, seed)
        
        # Aplicar estrategia de respuesta a la demanda
        if strategy == 'fixed':
            # Sin modificación al consumo
            home_actual = home_base
            commercial_actual = commercial_base
            industrial_actual = industrial_base
            current_price = base_price
            
        elif strategy == 'demand_response':
            # Respuesta a la demanda basada en precios dinámicos
            # El precio es más alto durante periodos de alta demanda
            price_multiplier = {
                'very_low': 0.7, 'low': 0.8, 'medium_low': 0.9, 
                'medium': 1.0, 'medium_high': 1.1, 'high': 1.3, 'peak': 1.5
            }
            current_price = base_price * price_multiplier[state]
            
            # Aplicar elasticidad para cada tipo de consumidor
            home_elasticity = calculate_consumer_elasticity('home', current_price, state, base_price)
            commercial_elasticity = calculate_consumer_elasticity('commercial', current_price, state, base_price)
            industrial_elasticity = calculate_consumer_elasticity('industrial', current_price, state, base_price)
            
            home_actual = home_base * (1 + home_elasticity)
            commercial_actual = commercial_base * (1 + commercial_elasticity)
            industrial_actual = industrial_base * (1 + industrial_elasticity)
            
        elif strategy == 'smart_grid':
            # Respuesta avanzada con almacenamiento y gestión inteligente
            
            # Precio base afectado por el sistema energético
            current_price = energy_system.energy_price
            
            # Las elasticidades dependen del precio y el estado
            home_elasticity = calculate_consumer_elasticity('home', current_price, state, base_price)
            commercial_elasticity = calculate_consumer_elasticity('commercial', current_price, state, base_price)
            industrial_elasticity = calculate_consumer_elasticity('industrial', current_price, state, base_price)
            
            # Consumo ajustado por elasticidad
            home_adjusted = home_base * (1 + home_elasticity)
            commercial_adjusted = commercial_base * (1 + commercial_elasticity)
            industrial_adjusted = industrial_base * (1 + industrial_elasticity)
            
            # Capacidad de almacenamiento disponible (puede reducir más el pico)
            if state in ['high', 'peak']:
                # Usar almacenamiento para reducir el pico
                storage_factor = 1.0 - (energy_system.storage_capacity * 0.8)
                home_actual = home_adjusted * storage_factor
                commercial_actual = commercial_adjusted * storage_factor
                industrial_actual = industrial_adjusted * storage_factor
            elif state in ['very_low', 'low']:
                # Cargar el almacenamiento durante baja demanda (aumenta ligeramente)
                storage_factor = 1.0 + (energy_system.storage_capacity * 0.3)
                home_actual = home_adjusted * storage_factor
                commercial_actual = commercial_adjusted * storage_factor
                industrial_actual = industrial_adjusted * storage_factor
            else:
                # Demanda normal
                home_actual = home_adjusted
                commercial_actual = commercial_adjusted
                industrial_actual = industrial_adjusted
        else:
            # Estrategia no reconocida, usar valores base
            home_actual = home_base
            commercial_actual = commercial_base
            industrial_actual = industrial_base
            current_price = base_price
        
        # Calcular demanda total
        total_demand = (home_actual.sum() + commercial_actual.sum() + industrial_actual.sum()) * state_multiplier
        
        # Actualizar max_demand si es necesario
        max_demand = max(max_demand, total_demand)
        
        # Actualizar sistema energético
        if strategy == 'smart_grid':
            energy_system.update(total_demand, max_demand)
        
        # Registrar resultados
        demand_profile.append(total_demand)
        price_profile.append(current_price)
        emission_factors.append(energy_system.get_emission_factor())
    
    # Calcular métricas
    peak_demand = max(demand_profile)
    avg_demand = np.mean(demand_profile)
    
    # Calcular emisiones y ahorro
    total_emissions = sum(demand_profile[i] * emission_factors[i] for i in range(hours))
    
    # Para respuesta a la demanda, crear una simulación de referencia
    if strategy in ['demand_response', 'smart_grid']:
        # Crear sistema de referencia para comparar ahorro
        ref_result = simulate_demand_single_run(
            params, 'fixed', EnergySystem(energy_system.price_history[0]), 
            seed, hour_start, day_type
        )
        ref_peak = ref_result['peak_demand']
        ref_emissions = ref_result['total_emissions']
        
        # Calcular ahorros
        peak_reduction = ref_peak - peak_demand
        emissions_reduction = ref_emissions - total_emissions
    else:
        peak_reduction = 0
        emissions_reduction = 0
    
    return {
        "time_series": demand_profile,
        "price_series": price_profile,
        "peak_demand": peak_demand,
        "average_demand": avg_demand,
        "peak_reduction": peak_reduction,
        "total_emissions": total_emissions,
        "reduced_emissions": emissions_reduction,
        "energy_system_state": {
            "price": energy_system.price_history,
            "renewable": energy_system.renewable_history,
            "storage": energy_system.storage_history
        }
    }

def simulate_demand(params, strategy):
    """
    Ejecuta una simulación completa con Monte Carlo si es necesario
    Args:
    params: Parámetros de simulación
    strategy: Estrategia de gestión
    Returns:
    Resultados de la simulación
    """
    # Si se solicita Monte Carlo y más de 1 muestra
    if params.montecarlo_samples > 1:
        # Inicializar sistema energético compartido para todas las simulaciones
        energy_system = EnergySystem()
        # Ejecutar múltiples simulaciones
        results = []
        for i in range(params.montecarlo_samples):
            # Variamos la semilla y la hora de inicio para cada simulación
            seed = 42 + i
            hour_start = (8 + i % 24) % 24  # Variar hora de inicio (8am por defecto)
            day_type = 'weekday' if i % 7 < 5 else 'weekend'  # Incluir fines de semana
            # Ejecutar simulación individual y guardar resultados
            result = simulate_demand_single_run(
                params, strategy, energy_system, seed, hour_start, day_type
            )
            results.append(result)
        
        # Calcular estadísticas - REALMENTE corregido sin asteriscos en axis
        time_series_mean = np.mean([r["time_series"] for r in results], axis=0).tolist()
        time_series_std = np.std([r["time_series"] for r in results], axis=0).tolist()
        price_series_mean = np.mean([r["price_series"] for r in results], axis=0).tolist()
        peak_demands = [r["peak_demand"] for r in results]
        avg_demands = [r["average_demand"] for r in results]
        emission_reductions = [r["reduced_emissions"] for r in results]
        
        # Calcular intervalos de confianza (95%)
        confidence_level = 1.96  # 95% confianza
        sample_size = params.montecarlo_samples
        peak_std = np.std(peak_demands)
        peak_error = confidence_level * peak_std / np.sqrt(sample_size)
        avg_std = np.std(avg_demands)
        avg_error = confidence_level * avg_std / np.sqrt(sample_size)
        emission_std = np.std(emission_reductions)
        emission_error = confidence_level * emission_std / np.sqrt(sample_size)
        
        # Resultados finales con estadísticas
        result = {
            "time_series": time_series_mean,
            "time_series_std": time_series_std,
            "price_series": price_series_mean,
            "peak_demand": np.mean(peak_demands),
            "peak_demand_std": peak_std,
            "peak_demand_confidence": peak_error,
            "average_demand": np.mean(avg_demands),
            "average_demand_std": avg_std,
            "average_demand_confidence": avg_error,
            "reduced_emissions": np.mean(emission_reductions),
            "reduced_emissions_std": emission_std,
            "reduced_emissions_confidence": emission_error,
            "monte_carlo_samples": params.montecarlo_samples
        }
        # Incluir estado final del sistema energético
        if strategy == 'smart_grid':
            result["final_energy_system"] = {
                "price": energy_system.energy_price,
                "renewable_adoption": energy_system.renewable_adoption,
                "storage_capacity": energy_system.storage_capacity
            }
        return result
    else:
        # Ejecutar una sola simulación sin Monte Carlo
        return simulate_demand_single_run(params, strategy)
# Normaliza cada fila del conjunto de matrices - Corregido sin asteriscos
def normalize_transition_matrix(matrix):
    matrix = np.array(matrix, dtype=np.float64)
    row_sums = matrix.sum(axis=1)
    # Evita división por cero
    row_sums[row_sums == 0] = 1
    return matrix / row_sums[:, np.newaxis]

def generate_network_data(params):
    """
    Genera datos de red para la visualización
    Args:
    params: Parámetros de simulación
    Returns:
    Datos de red para visualización
    """
    homes = []
    businesses = []
    industries = []
    
    # Generar datos para hogares
    for i in range(params.num_homes):
        consumption = np.random.lognormal(mean=1.5, sigma=0.5) * 5  # Distribución lognormal para consumo
        homes.append({
            "id": f"home-{i}",
            "type": "home",
            "consumption": float(consumption)
        })
    
    # Generar datos para negocios
    for i in range(params.num_commercial):
        consumption = np.random.lognormal(mean=2.0, sigma=0.6) * 20  # Mayor consumo para negocios
        businesses.append({
            "id": f"business-{i}",
            "type": "business",
            "consumption": float(consumption)
        })
    
    # Generar datos para industrias
    for i in range(params.num_industrial):
        consumption = np.random.lognormal(mean=3.0, sigma=0.7) * 100  # Mucho mayor para industrias
        industries.append({
            "id": f"industry-{i}",
            "type": "industry",
            "consumption": float(consumption)
        })
    
    return {
        "homes": homes,
        "businesses": businesses,
        "industries": industries
    }