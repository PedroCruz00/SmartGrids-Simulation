import { useState } from "react";
import SimulationForm from "../components/SimulationForm";
import MetricsPanel from "../components/MetricsPanel";
import DemandChart from "../components/DemandChart";
import NodeNetwork from "../components/NodeNetwork";
import Loader from "../components/Loader";
import { runSimulation, getMockData } from "../api/SimulationService";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null);
  const [error, setError] = useState(null);
  const [currentMode, setCurrentMode] = useState("mock"); // "api" o "mock"

  // Función para procesar los datos recibidos del backend
  const processApiResults = (apiResults) => {
    // Construir estructura compatible con el frontend
    const hourlyData = apiResults.time_series.map((value, i) => {
      // Crear estructura para el gráfico
      const entry = {
        hour: i,
        dr_demand: value,
      };

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

    // Generar datos de red (aún con datos de ejemplo porque el backend no los proporciona)
    const generateConsumers = (count, type, baseFactor = 1) => {
      const baseConsumption =
        type === "home"
          ? 5 * baseFactor
          : type === "business"
          ? 20 * baseFactor
          : 100 * baseFactor;

      return Array.from({ length: count }, (_, i) => ({
        id: `${type}-${i}`,
        consumption: baseConsumption + Math.random() * baseConsumption * 0.5,
      }));
    };

    // Determinar si se usó Monte Carlo
    const usedMonteCarlo =
      apiResults.monte_carlo_samples && apiResults.monte_carlo_samples > 1;
    if (usedMonteCarlo) {
      console.log("Simulación Monte Carlo detectada");
    }
    
    // Estructura final para el frontend
    return {
      demand_data: hourlyData,
      metrics: {
        peak_demand_fixed: apiResults.peak_demand * 1.15, // Estimación aproximada para comparación
        peak_demand_dr: apiResults.peak_demand,
        peak_demand_confidence: apiResults.peak_demand_confidence,
        avg_demand_fixed: apiResults.average_demand * 1.12, // Estimación aproximada
        avg_demand_dr: apiResults.average_demand,
        avg_demand_confidence: apiResults.average_demand_confidence,
        emissions_reduction: apiResults.reduced_emissions,
        emissions_reduction_confidence: apiResults.reduced_emissions_confidence,
        cost_savings: apiResults.reduced_emissions * 0.7, // Estimación de ahorro basada en emisiones
        monte_carlo_samples: apiResults.monte_carlo_samples || 1,
      },
      network_data: {
        homes: generateConsumers(apiResults.num_homes || 50, "home"),
        businesses: generateConsumers(
          apiResults.num_commercial || 20,
          "business"
        ),
        industries: generateConsumers(
          apiResults.num_industrial || 10,
          "industry"
        ),
      },
      energy_system: apiResults.final_energy_system,
      raw_api_response: apiResults, // Guardar respuesta raw para depuración
    };
  };

  const handleRunSimulation = async (params) => {
    setLoading(true);
    setError(null);

    try {
      if (currentMode === "api") {
        // Usar API real
        const results = await runSimulation(params);
        const processedResults = processApiResults(results);
        setSimulationResults(processedResults);
      } else {
        // Usar datos de ejemplo
        setTimeout(() => {
          const mockData = getMockData();
          setSimulationResults(mockData);
        }, 1000); // Simular delay de API
      }
    } catch (err) {
      setError("Error al ejecutar la simulación: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar entre API y mock
  const toggleMode = () => {
    setCurrentMode(currentMode === "api" ? "mock" : "api");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Simulación de Respuesta a la Demanda
          </h1>

          {/* Botón para cambiar modo API/Mock */}
          <button
            onClick={toggleMode}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md dark:bg-blue-900 dark:text-blue-200"
          >
            Modo: {currentMode === "api" ? "API Real" : "Datos Ejemplo"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
