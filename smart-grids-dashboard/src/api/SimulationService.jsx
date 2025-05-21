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
export const getMockData = (params = {}) => {
  // Extraer parámetros o usar valores por defecto
  const homes = params.homes || 50;
  const businesses = params.businesses || 20;
  const industries = params.industries || 10;
  const hours = params.simulation_hours || 24;
  const monteCarlo = params.monte_carlo_samples || 1;
  const strategy = params.strategy || "fixed";
  const startHour = params.start_hour || 8;
  const dayType = params.day_type || "weekday";

  // Usar una semilla pseudoaleatoria basada en parámetros
  const seed = homes * 1000 + businesses * 100 + industries * 10 + startHour;
  // Función simple de generación de números pseudoaleatorios
  const seededRandom = () => {
    const x = Math.sin(seed + hourlyData.length) * 10000;
    return x - Math.floor(x);
  };

  // Generar datos de hora por hora más realistas
  const hourlyData = Array.from({ length: hours }, (_, i) => {
    // Calcular hora real según hora de inicio
    const currentHour = (startHour + i) % 24;

    // Crear patrones realistas según tipo de día y hora
    const isWeekend = dayType === "weekend";

    // Factor de base para la demanda basado en la hora
    let baseDemand = 1500 + seededRandom() * 500;
    let timeFactor = 1;

    // Patrón de mañana (mayor en días laborales)
    if (currentHour >= 7 && currentHour <= 9)
      timeFactor = isWeekend ? 1.2 : 1.7;
    // Patrón medio día (similar en ambos)
    else if (currentHour >= 12 && currentHour <= 14) timeFactor = 1.3;
    // Patrón tarde-noche (mayor en días laborales)
    else if (currentHour >= 18 && currentHour <= 21)
      timeFactor = isWeekend ? 1.4 : 1.8;
    // Horas de madrugada (bajo en ambos)
    else if (currentHour >= 0 && currentHour <= 5) timeFactor = 0.6;

    // Ajustar demanda con tamaño de la red
    const networkSize = homes * 2 + businesses * 5 + industries * 20;
    const networkFactor = networkSize / 500; // Normalizar para aproximadamente 500 unidades

    // Calcular demanda según estrategia
    const fixedDemand = baseDemand * timeFactor * networkFactor;

    // Factores de reducción según estrategia
    let drFactor;
    if (strategy === "fixed") {
      drFactor = 1.0; // Sin reducción
    } else if (strategy === "demand_response") {
      // Mayor respuesta en horas pico
      drFactor = timeFactor > 1.3 ? 0.8 + seededRandom() * 0.1 : 0.95;
    } else if (strategy === "smart_grid") {
      // Smart Grid logra mayor reducción
      drFactor = timeFactor > 1.3 ? 0.7 + seededRandom() * 0.1 : 0.9;
    }

    const drDemand = fixedDemand * drFactor;

    // Datos para gráfico
    const entry = {
      hour: currentHour,
      fixed_demand: fixedDemand,
      dr_demand: drDemand,
    };

    // Añadir variabilidad según muestras Monte Carlo
    if (monteCarlo > 1) {
      // Más muestras = menor variabilidad (más preciso)
      const variabilityFactor = 0.2 / Math.sqrt(monteCarlo);
      entry.dr_demand_std = drDemand * variabilityFactor;
    }

    // Añadir precios que correlacionan con demanda
    entry.price = 0.12 + (timeFactor - 0.5) * 0.08;

    return entry;
  });

  // Función mejorada para generar consumidores con distribuciones más realistas
  const generateConsumers = (count, type) => {
    // Usar seed para consistencia
    const typeSeed = type === "home" ? 100 : type === "business" ? 200 : 300;

    return Array.from({ length: count }, (_, i) => {
      // Generar números pseudoaleatorios específicos para cada consumidor
      const consumerSeed = seed + typeSeed + i;
      const r1 =
        Math.sin(consumerSeed) * 10000 -
        Math.floor(Math.sin(consumerSeed) * 10000);
      const r2 =
        Math.sin(consumerSeed * 2) * 10000 -
        Math.floor(Math.sin(consumerSeed * 2) * 10000);

      let consumption;

      if (type === "home") {
        // Distribución bimodal para hogares (pequeños y grandes)
        if (r1 > 0.7) {
          // Hogares grandes (30%)
          consumption = 7 + r2 * 5;
        } else {
          // Hogares pequeños (70%)
          consumption = 2 + r2 * 3;
        }
      } else if (type === "business") {
        // Distribución log-normal aproximada para negocios
        consumption = 10 * Math.exp(r1 * r2 * 2);
      } else {
        // Distribución más extrema para industrias
        if (r1 > 0.85) {
          // Grandes industrias (15%)
          consumption = 150 + r2 * 250;
        } else {
          // Industrias medianas (85%)
          consumption = 40 + r2 * 60;
        }
      }

      return {
        id: `${type}-${i}`,
        consumption: consumption,
        efficiency: 0.7 + r2 * 0.3, // Factor de eficiencia variable
      };
    });
  };

  // Calcular estadísticas basadas en los datos generados
  const calculateStats = () => {
    const peakFixed = Math.max(...hourlyData.map((d) => d.fixed_demand));
    const peakDR = Math.max(...hourlyData.map((d) => d.dr_demand));
    const avgFixed =
      hourlyData.reduce((sum, d) => sum + d.fixed_demand, 0) / hours;
    const avgDR = hourlyData.reduce((sum, d) => sum + d.dr_demand, 0) / hours;

    // Emisiones proporcionales a consumo, pero con factor extra para smart grid
    const emissionFactor = strategy === "smart_grid" ? 0.8 : 1.0;
    const emissions = (avgFixed - avgDR) * hours * 0.5 * emissionFactor;

    // Ahorro económico basado en diferencia de consumo y tarifas
    const avgPrice = hourlyData.reduce((sum, d) => sum + d.price, 0) / hours;
    const costSavings = (avgFixed - avgDR) * hours * avgPrice;

    return {
      peak_demand_fixed: peakFixed,
      peak_demand_dr: peakDR,
      avg_demand_fixed: avgFixed,
      avg_demand_dr: avgDR,
      emissions_reduction: emissions,
      cost_savings: costSavings,
      monte_carlo_samples: monteCarlo,
    };
  };

  const stats = calculateStats();

  // Añadir intervalos de confianza basados en Monte Carlo
  if (monteCarlo > 1) {
    const confidenceFactor = 1.96 / Math.sqrt(monteCarlo); // 95% de confianza
    stats.peak_demand_confidence =
      stats.peak_demand_dr * 0.1 * confidenceFactor;
    stats.avg_demand_confidence = stats.avg_demand_dr * 0.08 * confidenceFactor;
    stats.emissions_reduction_confidence =
      stats.emissions_reduction * 0.15 * confidenceFactor;
  }

  return {
    demand_data: hourlyData,
    metrics: stats,
    network_data: {
      homes: generateConsumers(homes, "home"),
      businesses: generateConsumers(businesses, "business"),
      industries: generateConsumers(industries, "industry"),
    },
    energy_system:
      strategy === "smart_grid"
        ? {
            price_history: Array.from({ length: hours }, (_, i) => {
              const hour = (startHour + i) % 24;
              return 0.15 + Math.sin(hour / 4) * 0.05;
            }),
            renewable_history: Array.from({ length: hours }, (_, i) => {
              // Renovables aumentan durante el día
              const hour = (startHour + i) % 24;
              return 0.1 + (hour >= 8 && hour <= 16 ? (hour - 8) * 0.01 : 0);
            }),
            storage_history: Array.from({ length: hours }, (_, i) => {
              // Almacenamiento se carga durante baja demanda y se descarga en picos
              const hour = (startHour + i) % 24;
              return (
                0.05 +
                ((hour >= 1 && hour <= 6) || (hour >= 13 && hour <= 16)
                  ? 0.05
                  : 0)
              );
            }),
          }
        : null,
  };
};
