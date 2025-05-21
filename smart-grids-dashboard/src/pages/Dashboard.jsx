import { useState } from "react";
import SimulationForm from "../components/SimulationForm";
import MetricsPanel from "../components/MetricsPanel";
import DemandChart from "../components/DemandChart";
import NodeNetwork from "../components/NodeNetwork";
import Loader from "../components/Loader";
import { runSimulation } from "../api/SimulationService";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null);
  const [error, setError] = useState(null);

  // Función para procesar los datos recibidos del backend
  const processApiResults = (apiResults) => {
    console.log("Procesando resultados:", apiResults);

    // Verificar que tenemos datos de fixed_demand para comparación
    const hasFixedData =
      apiResults.fixed_demand && apiResults.fixed_demand.time_series;

    // Determinar estrategia actual
    const currentStrategy = apiResults.strategy || "fixed";

    // Construir estructura para el gráfico
    const hourlyData = apiResults.time_series.map((value, i) => {
      const entry = {
        hour: i % 24, // Asegurar que la hora sea 0-23
        dr_demand: value,
      };

      // Añadir datos de consumo fijo para comparación
      if (hasFixedData) {
        entry.fixed_demand = apiResults.fixed_demand.time_series[i];
      } else {
        // Si no tenemos datos fixed, usar una estimación basada en el valor actual
        entry.fixed_demand =
          apiResults.strategy === "fixed" ? value : value * 1.15;
      }

      // Añadir desviación estándar si está disponible (Monte Carlo)
      if (apiResults.time_series_std) {
        entry.dr_demand_std = apiResults.time_series_std[i];
      }

      // Añadir precios si están disponibles
      if (apiResults.price_series) {
        entry.price = apiResults.price_series[i];
      }

      return entry;
    });

    // Verificar que tenemos datos de red
    const networkData = apiResults.network_data || {
      homes: [],
      businesses: [],
      industries: [],
    };

    // Verificar que cada componente de la red tiene el formato correcto
    const validatedNetworkData = {
      homes: networkData.homes
        ? networkData.homes.map((home) => ({
            id: home.id || `home-${Math.random().toString(36).substr(2, 9)}`,
            type: "home",
            consumption: home.consumption || 5,
          }))
        : [],
      businesses: networkData.businesses
        ? networkData.businesses.map((business) => ({
            id:
              business.id ||
              `business-${Math.random().toString(36).substr(2, 9)}`,
            type: "business",
            consumption: business.consumption || 20,
          }))
        : [],
      industries: networkData.industries
        ? networkData.industries.map((industry) => ({
            id:
              industry.id ||
              `industry-${Math.random().toString(36).substr(2, 9)}`,
            type: "industry",
            consumption: industry.consumption || 100,
          }))
        : [],
    };

    // Asegurar que los valores necesarios para los cálculos estén definidos
    const avgDemand =
      typeof apiResults.average_demand === "number"
        ? apiResults.average_demand
        : 0;
    const hours = typeof apiResults.hours === "number" ? apiResults.hours : 24;

    // Calcular métricas adicionales con manejo seguro
    const totalEnergyConsumption = avgDemand * hours;

    // Calcular precio promedio con validación
    let averagePrice = 0.15; // Valor por defecto
    if (
      apiResults.price_series &&
      Array.isArray(apiResults.price_series) &&
      apiResults.price_series.length > 0
    ) {
      const validPrices = apiResults.price_series.filter(
        (price) => typeof price === "number"
      );
      if (validPrices.length > 0) {
        const sumPrices = validPrices.reduce((sum, price) => sum + price, 0);
        averagePrice = sumPrices / validPrices.length;
      }
    }

    const energyCost = totalEnergyConsumption * averagePrice;

    // Estimar emisiones totales basadas en un factor de emisión estándar
    const emissionFactor = 0.5; // kg CO2 por kWh (valor típico para una matriz energética mixta)
    const totalEmissions = totalEnergyConsumption * emissionFactor;

    // Construir métricas para el panel con valores seguros
    const metrics = {
      peak_demand_fixed:
        hasFixedData && typeof apiResults.fixed_demand.peak_demand === "number"
          ? apiResults.fixed_demand.peak_demand
          : typeof apiResults.peak_demand === "number"
          ? apiResults.peak_demand * 1.15
          : 0,
      peak_demand_dr:
        typeof apiResults.peak_demand === "number" ? apiResults.peak_demand : 0,
      peak_demand_confidence: apiResults.peak_demand_confidence || 0,
      avg_demand_fixed:
        hasFixedData &&
        typeof apiResults.fixed_demand.average_demand === "number"
          ? apiResults.fixed_demand.average_demand
          : avgDemand * 1.12,
      avg_demand_dr: avgDemand,
      avg_demand_confidence: apiResults.avg_demand_confidence || 0,
      emissions_reduction:
        typeof apiResults.reduced_emissions === "number"
          ? apiResults.reduced_emissions
          : 0,
      emissions_total: isNaN(totalEmissions) ? 0 : totalEmissions,
      emissions_reduction_confidence:
        apiResults.reduced_emissions_confidence || 0,
      cost_savings:
        typeof apiResults.cost_savings === "number"
          ? apiResults.cost_savings
          : 0,
      energy_cost: isNaN(energyCost) ? avgDemand * hours * 0.15 : energyCost,
      monte_carlo_samples:
        typeof apiResults.monte_carlo_samples === "number"
          ? apiResults.monte_carlo_samples
          : 1,
      strategy: currentStrategy,
    };

    // Calcular valores derivados adicionales
    metrics.energy_cost_estimate = metrics.avg_demand_dr * hours * 0.15;
    metrics.potential_savings = metrics.energy_cost * 0.12;

    console.log("Métricas procesadas:", metrics);

    return {
      demand_data: hourlyData,
      metrics: metrics,
      network_data: validatedNetworkData,
      energy_system: apiResults.final_energy_system,
    };
  };

  const handleRunSimulation = async (params) => {
    setLoading(true);
    setError(null);

    try {
      const results = await runSimulation(params);
      console.log("Resultados de la API:", results);
      const processedResults = processApiResults(results);
      setSimulationResults(processedResults);
    } catch (err) {
      console.error("Error al ejecutar la simulación:", err);
      setError("Error al ejecutar la simulación: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Simulación de Respuesta a la Demanda
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Resto del código actual del componente... */}
        <div className="px-4 py-6 sm:px-0">
          <SimulationForm onSubmit={handleRunSimulation} />

          {error && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 dark:bg-red-900 dark:border-red-700">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && !simulationResults && (
            <div className="mt-6 bg-white overflow-hidden shadow rounded-lg dark:bg-gray-800">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Métodos de Simulación Utilizados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg dark:bg-blue-900">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Monte Carlo
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Ejecuta múltiples simulaciones con diferentes condiciones
                      iniciales para obtener distribuciones estadísticas.
                      Permite cuantificar la incertidumbre en las predicciones y
                      calcular intervalos de confianza.
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg dark:bg-green-900">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      Cadenas de Markov
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Modelan las transiciones entre estados de demanda
                      energética, capturando la naturaleza estocástica del
                      consumo a lo largo del tiempo con dependencias temporales.
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg dark:bg-purple-900">
                    <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                      Dinámica de Sistemas
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Simula las retroalimentaciones entre precio, adopción de
                      renovables y almacenamiento de energía, modelando cómo
                      estos factores evolucionan e interactúan con el tiempo.
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg dark:bg-orange-900">
                    <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                      Eventos Discretos
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      El sistema avanza en pasos de tiempo discretos (horas),
                      actualizando el estado del sistema en cada paso según las
                      condiciones y reglas definidas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center mt-12">
              <Loader />
            </div>
          ) : simulationResults ? (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Resto del código para mostrar resultados... */}
              <div className="bg-white overflow-hidden shadow rounded-lg dark:bg-gray-800">
                <div className="px-4 py-5 sm:p-6">
                  <MetricsPanel data={simulationResults.metrics} />
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg dark:bg-gray-800">
                <div className="px-4 py-5 sm:p-6">
                  <DemandChart
                    data={simulationResults.demand_data}
                    showConfidence={
                      simulationResults.metrics.monte_carlo_samples > 1
                    }
                  />
                </div>
              </div>

              <div className="lg:col-span-2 bg-white overflow-hidden shadow rounded-lg dark:bg-gray-800">
                <div className="px-4 py-5 sm:p-6" style={{ height: "500px" }}>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Red de Consumidores
                  </h2>
                  <NodeNetwork data={simulationResults.network_data} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
