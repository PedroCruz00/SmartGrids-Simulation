// api/simulationService.js

/**
 * Servicio para interactuar con el backend de simulación
 */

// URL base de la API (ajustar según el entorno)
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

/**
 * Ejecuta una simulación de respuesta a la demanda
 *
 * @param {Object} params - Parámetros de la simulación
 * @param {number} params.homes - Número de hogares
 * @param {number} params.businesses - Número de comercios
 * @param {number} params.industries - Número de industrias
 * @param {number} params.simulation_hours - Horas a simular
 * @param {string} params.strategy - Estrategia ('fixed', 'demand_response', 'smart_grid')
 * @param {number} params.monte_carlo_samples - Número de muestras para Monte Carlo
 * @param {number} params.start_hour - Hora del día para iniciar (0-23)
 * @param {string} params.day_type - Tipo de día ('weekday', 'weekend')
 * @returns {Promise<Object>} - Resultado de la simulación
 */
export const runSimulation = async (params) => {
  try {
    console.log("Enviando parámetros:", params);

    const response = await fetch(`${API_URL}/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error en la simulación:", error);
    throw error;
  }
};

/**
 * Obtiene datos de simulación previos (si existe la funcionalidad en el backend)
 *
 * @param {string} id - Identificador de la simulación
 * @returns {Promise<Object>} - Datos de la simulación
 */
export const getSimulationById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/simulations/${id}`);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error al obtener simulación:", error);
    throw error;
  }
};

/**
 * Obtiene datos de ejemplo para pruebas
 * Esta función es útil para desarrollo y pruebas sin backend
 *
 * @returns {Object} - Datos de ejemplo
 */
export const getMockData = () => {
  // Generar datos de hora por hora (24 horas)
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    // Crear patrones realistas de consumo con picos durante mañana y tarde
    const baseDemand = 2000 + Math.random() * 500;

    // Factor de multiplicación según la hora del día
    let timeFactor = 1;
    if (i >= 7 && i <= 9) timeFactor = 1.5; // Pico de la mañana
    if (i >= 18 && i <= 21) timeFactor = 1.8; // Pico de la tarde
    if (i >= 0 && i <= 5) timeFactor = 0.6; // Bajo consumo nocturno

    const fixedDemand = baseDemand * timeFactor;

    // La demanda con DR es menor durante picos y similar en horas valle
    const drFactor = timeFactor > 1.3 ? 0.8 : 0.95;
    const drDemand = fixedDemand * drFactor;

    // Datos para gráfico
    const entry = {
      hour: i,
      fixed_demand: fixedDemand,
      dr_demand: drDemand,
    };

    // Añadir datos de Monte Carlo si se requieren
    if (Math.random() > 0.5) {
      entry.dr_demand_std = drDemand * 0.08; // 8% de variabilidad
    }

    // Añadir precios
    entry.price = 0.12 + (timeFactor - 0.5) * 0.08;

    return entry;
  });

  // Generar datos de hogares, comercios e industrias
  const generateConsumers = (count, type) => {
    const baseConsumption =
      type === "home" ? 5 : type === "business" ? 20 : 100;

    return Array.from({ length: count }, (_, i) => ({
      id: `${type}-${i}`,
      consumption: baseConsumption + Math.random() * baseConsumption * 0.5,
    }));
  };

  return {
    demand_data: hourlyData,
    metrics: {
      peak_demand_fixed: 3800,
      peak_demand_dr: 3040,
      peak_demand_confidence: 120, // Ejemplo de datos Monte Carlo
      avg_demand_fixed: 2300,
      avg_demand_dr: 1980,
      avg_demand_confidence: 85,
      emissions_reduction: 450,
      emissions_reduction_confidence: 35,
      cost_savings: 325.75,
      monte_carlo_samples: 50, // Indicar que usamos Monte Carlo
    },
    network_data: {
      homes: generateConsumers(50, "home"),
      businesses: generateConsumers(20, "business"),
      industries: generateConsumers(10, "industry"),
    },
    // Datos de sistema energético para la estrategia smart_grid
    energy_system: {
      price_history: Array.from(
        { length: 24 },
        (_, i) => 0.15 + Math.sin(i / 4) * 0.05
      ),
      renewable_history: Array.from({ length: 24 }, (_, i) => 0.1 + i * 0.005),
      storage_history: Array.from({ length: 24 }, (_, i) => 0.05 + i * 0.002),
    },
  };
};
