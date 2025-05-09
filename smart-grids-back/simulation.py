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
    # Estados más granulares de demanda
    states = ['very_low', 'low', 'medium_low', 'medium', 'medium_high', 'high', 'peak']
    
    # Multiplicadores de demanda para cada estado
    demand_multipliers = {
        'very_low': 0.4,
        'low': 0.6,
        'medium_low': 0.8,
        'medium': 1.0,
        'medium_high': 1.2,
        'high': 1.5,
        'peak': 1.8
    }
    
    # Matrices de transición diferentes según periodo del día
    # Estas matrices están diseñadas para reflejar patrones realistas:
    # - Por la mañana (6-9), la demanda tiende a aumentar (personas despiertan, industrias arrancan)
    # - Durante el mediodía (11-14), demanda media-alta (actividad comercial, aires acondicionados)
    # - Por la tarde/noche (17-21), pico de demanda (personas vuelven a casa)
    # - Por la noche (22-5), demanda baja y estable
    
    # Estas son matrices de transición diseñadas heurísticamente
    night_matrix = {  # 22-5h: demanda mayormente baja y estable
        'very_low': [0.70, 0.20, 0.10, 0.00, 0.00, 0.00, 0.00],
        'low':      [0.20, 0.60, 0.15, 0.05, 0.00, 0.00, 0.00],
        'medium_low':[0.10, 0.20, 0.60, 0.10, 0.00, 0.00, 0.00],
        'medium':   [0.05, 0.15, 0.20, 0.50, 0.10, 0.00, 0.00],
        'medium_high':[0.05, 0.10, 0.15, 0.20, 0.40, 0.10, 0.00],
        'high':     [0.10, 0.10, 0.10, 0.20, 0.20, 0.30, 0.00],
        'peak':     [0.10, 0.20, 0.20, 0.20, 0.15, 0.10, 0.05]
    }
    
    morning_matrix = {  # 6-10h: tendencia a aumentar
        'very_low': [0.20, 0.50, 0.20, 0.10, 0.00, 0.00, 0.00],
        'low':      [0.05, 0.30, 0.40, 0.20, 0.05, 0.00, 0.00],
        'medium_low':[0.00, 0.10, 0.30, 0.40, 0.15, 0.05, 0.00],
        'medium':   [0.00, 0.05, 0.15, 0.40, 0.30, 0.10, 0.00],
        'medium_high':[0.00, 0.00, 0.10, 0.30, 0.35, 0.20, 0.05],
        'high':     [0.00, 0.00, 0.05, 0.15, 0.30, 0.40, 0.10],
        'peak':     [0.00, 0.00, 0.00, 0.10, 0.20, 0.30, 0.40]
    }
    
    midday_matrix = {  # 11-16h: niveles medios-altos
        'very_low': [0.10, 0.30, 0.40, 0.20, 0.00, 0.00, 0.00],
        'low':      [0.05, 0.20, 0.40, 0.25, 0.10, 0.00, 0.00],
        'medium_low':[0.00, 0.10, 0.30, 0.40, 0.15, 0.05, 0.00],
        'medium':   [0.00, 0.05, 0.15, 0.50, 0.20, 0.10, 0.00],
        'medium_high':[0.00, 0.00, 0.10, 0.20, 0.40, 0.25, 0.05],
        'high':     [0.00, 0.00, 0.05, 0.15, 0.30, 0.40, 0.10],
        'peak':     [0.00, 0.00, 0.00, 0.10, 0.30, 0.40, 0.20]
    }
    
    evening_matrix = {  # 17-21h: pico de demanda
        'very_low': [0.05, 0.20, 0.30, 0.30, 0.15, 0.00, 0.00],
        'low':      [0.00, 0.10, 0.20, 0.40, 0.20, 0.10, 0.00],
        'medium_low':[0.00, 0.05, 0.15, 0.30, 0.30, 0.15, 0.05],
        'medium':   [0.00, 0.00, 0.10, 0.20, 0.30, 0.30, 0.10],
        'medium_high':[0.00, 0.00, 0.05, 0.15, 0.30, 0.30, 0.20],
        'high':     [0.00, 0.00, 0.00, 0.10, 0.20, 0.40, 0.30],
        'peak':     [0.00, 0.00, 0.00, 0.05, 0.15, 0.30, 0.50]
    }
    
    # Matrices diferentes para días de semana vs fin de semana
    if day_type == 'weekend':
        # Ajustar matrices para reflejar patrones de fin de semana
        # En general, la demanda comienza más tarde y los picos son menores
        morning_matrix = {k: [0.7*v[0]+0.3*v[1], 0.3*v[0]+0.5*v[1]+0.2*v[2], 0.3*v[1]+0.5*v[2]+0.2*v[3], 
                             0.3*v[2]+0.4*v[3]+0.3*v[4], 0.3*v[3]+0.4*v[4]+0.3*v[5], 
                             0.3*v[4]+0.5*v[5]+0.2*v[6], 0.5*v[5]+0.5*v[6]] 
                         for k, v in morning_matrix.items()}
    
    # Mapeo de horas a matrices de transición
    hour_to_matrix = {
        0: night_matrix, 1: night_matrix, 2: night_matrix, 3: night_matrix, 4: night_matrix, 5: night_matrix,
        6: morning_matrix, 7: morning_matrix, 8: morning_matrix, 9: morning_matrix, 10: morning_matrix,
        11: midday_matrix, 12: midday_matrix, 13: midday_matrix, 14: midday_matrix, 15: midday_matrix, 16: midday_matrix,
        17: evening_matrix, 18: evening_matrix, 19: evening_matrix, 20: evening_matrix, 21: evening_matrix,
        22: night_matrix, 23: night_matrix
    }
    
    # Inicializar en un estado apropiado según la hora
    hour_based_states = {
        "night": ['very_low', 'low', 'medium_low'],
        "morning": ['low', 'medium_low', 'medium'],
        "midday": ['medium_low', 'medium', 'medium_high'],
        "evening": ['medium', 'medium_high', 'high']
    }
    
    # Determinar periodo del día inicial
    if hour_start < 6:
        period = "night"
    elif hour_start < 11:
        period = "morning"
    elif hour_start < 17:
        period = "midday"
    else:
        period = "evening"
    
    # Elegir un estado inicial aleatorio apropiado para la hora del día
    current = np.random.choice(hour_based_states[period])
    
    state_results = []
    multiplier_results = []
    
    for i in range(steps):
        current_hour = (hour_start + i) % 24
        current_matrix = hour_to_matrix[current_hour]
        
        # Transición al siguiente estado
        current = np.random.choice(states, p=current_matrix[current])
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
        home_base = np.random.normal(loc=1.5, scale=0.3, size=params.num_homes)
        commercial_base = np.random.normal(loc=5.0, scale=1.0, size=params.num_commercial)
        industrial_base = np.random.normal(loc=10.0, scale=2.0, size=params.num_industrial)
        
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
        
        # Calcular estadísticas
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