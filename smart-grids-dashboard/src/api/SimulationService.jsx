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
