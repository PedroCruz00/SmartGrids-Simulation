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
    // Construir estructura compatible con el frontend
    const hourlyData = apiResults.time_series.map((value, i) => {
      // Crear estructura para el gráfico
      const entry = {
        hour: i,
        dr_demand: value,
      };

      // Añadir datos fixed si están disponibles
      if (apiResults.fixed_demand && apiResults.fixed_demand.time_series) {
        entry.fixed_demand = apiResults.fixed_demand.time_series[i];
      }

      // Añadir desviación estándar si está disponible
      if (apiResults.time_series_std) {
        entry.dr_demand_std = apiResults.time_series_std[i];
      }

      // Añadir precios si están disponibles
      if (apiResults.price_series) {
        entry.price = apiResults.price_series[i];
      }

      return entry;
    });

    // Usar los datos de red proporcionados por el backend
    const networkData = apiResults.network_data || {
      homes: [],
      businesses: [],
      industries: [],
    };

    // Estructura final para el frontend
    return {
      demand_data: hourlyData,
      metrics: {
        peak_demand_fixed: apiResults.fixed_demand
          ? apiResults.fixed_demand.peak_demand
          : apiResults.peak_demand * 1.15, // Estimación si no hay datos fixed
        peak_demand_dr: apiResults.peak_demand,
        peak_demand_confidence: apiResults.peak_demand_confidence,
        avg_demand_fixed: apiResults.fixed_demand
          ? apiResults.fixed_demand.average_demand
          : apiResults.average_demand * 1.12, // Estimación si no hay datos fixed
        avg_demand_dr: apiResults.average_demand,
        avg_demand_confidence: apiResults.average_demand_confidence,
        emissions_reduction: apiResults.reduced_emissions,
        emissions_reduction_confidence: apiResults.reduced_emissions_confidence,
        cost_savings:
          apiResults.cost_savings || apiResults.reduced_emissions * 0.7, // Usar valor del backend o estimar
        monte_carlo_samples: apiResults.monte_carlo_samples || 1,
      },
      network_data: networkData,
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
