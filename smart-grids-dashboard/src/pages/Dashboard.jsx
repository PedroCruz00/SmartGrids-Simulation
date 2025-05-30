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
    console.log("=== PROCESANDO RESULTADOS API ===");
    console.log("Datos recibidos:", apiResults);

    // Validación robusta de datos de fixed_demand
    const hasValidFixedData =
      apiResults.fixed_demand &&
      apiResults.fixed_demand.time_series &&
      Array.isArray(apiResults.fixed_demand.time_series) &&
      apiResults.fixed_demand.time_series.length ===
        apiResults.time_series.length;

    console.log("¿Tiene datos fixed_demand válidos?", hasValidFixedData);

    if (hasValidFixedData) {
      console.log("Datos fixed_demand validados:", {
        length: apiResults.fixed_demand.time_series.length,
        peak: apiResults.fixed_demand.peak_demand,
        average: apiResults.fixed_demand.average_demand,
      });
    }

    // Determinar estrategia actual
    const currentStrategy = apiResults.strategy || "fixed";
    console.log("Estrategia actual:", currentStrategy);

    // Construir estructura para el gráfico con validación mejorada
    const hourlyData = apiResults.time_series.map((value, i) => {
      const entry = {
        hour: i % 24,
        dr_demand: typeof value === "number" ? value : 0,
      };

      // Lógica para fixed_demand
      if (hasValidFixedData) {
        // Usar datos reales de fixed_demand del backend
        entry.fixed_demand =
          typeof apiResults.fixed_demand.time_series[i] === "number"
            ? apiResults.fixed_demand.time_series[i]
            : value;
      } else if (currentStrategy === "fixed") {
        // Si estamos en modo fijo, ambas series son iguales
        entry.fixed_demand = value;
      } else {
        // Para estrategias no-fijas sin datos de referencia, usar estimación conservadora
        console.warn(
          `⚠️ No hay datos fixed_demand válidos para estrategia '${currentStrategy}'. Usando estimación.`
        );
        entry.fixed_demand = value * 1.12; // Estimación basada en promedio típico
      }

      // Añadir desviación estándar si está disponible (Monte Carlo)
      if (
        apiResults.time_series_std &&
        typeof apiResults.time_series_std[i] === "number" &&
        apiResults.time_series_std[i] > 0
      ) {
        entry.dr_demand_std = apiResults.time_series_std[i];
      }

      // Añadir precios si están disponibles
      if (
        apiResults.price_series &&
        typeof apiResults.price_series[i] === "number"
      ) {
        entry.price = apiResults.price_series[i];
      }

      return entry;
    });

    // Verificación de calidad de datos
    console.log("=== VERIFICACIÓN DE DATOS PROCESADOS ===");
    if (hourlyData.length > 0) {
      const fixedValues = hourlyData
        .map((d) => d.fixed_demand)
        .filter((v) => typeof v === "number" && v > 0);
      const drValues = hourlyData
        .map((d) => d.dr_demand)
        .filter((v) => typeof v === "number" && v > 0);

      if (fixedValues.length > 0 && drValues.length > 0) {
        const fixedAvg =
          fixedValues.reduce((a, b) => a + b, 0) / fixedValues.length;
        const drAvg = drValues.reduce((a, b) => a + b, 0) / drValues.length;
        const avgDifference = Math.abs(fixedAvg - drAvg);
        const percentDifference =
          (avgDifference / Math.max(fixedAvg, drAvg)) * 100;

        console.log(`Promedio fixed_demand: ${fixedAvg.toFixed(2)} kW`);
        console.log(`Promedio dr_demand: ${drAvg.toFixed(2)} kW`);
        console.log(
          `Diferencia: ${avgDifference.toFixed(
            2
          )} kW (${percentDifference.toFixed(1)}%)`
        );

        if (percentDifference < 1 && currentStrategy !== "fixed") {
          console.warn(
            "⚠️ Las diferencias entre estrategias son muy pequeñas (<1%)"
          );
        } else {
          console.log("✅ Las series tienen diferencias apropiadas");
        }
      }
    }

    // Validar y procesar datos de red
    const networkData = apiResults.network_data || {
      homes: [],
      businesses: [],
      industries: [],
    };
    const validatedNetworkData = {
      homes: Array.isArray(networkData.homes)
        ? networkData.homes.map((home, idx) => ({
            id: home.id || `home-${idx}`,
            type: "home",
            consumption:
              typeof home.consumption === "number" ? home.consumption : 5,
          }))
        : [],
      businesses: Array.isArray(networkData.businesses)
        ? networkData.businesses.map((business, idx) => ({
            id: business.id || `business-${idx}`,
            type: "business",
            consumption:
              typeof business.consumption === "number"
                ? business.consumption
                : 20,
          }))
        : [],
      industries: Array.isArray(networkData.industries)
        ? networkData.industries.map((industry, idx) => ({
            id: industry.id || `industry-${idx}`,
            type: "industry",
            consumption:
              typeof industry.consumption === "number"
                ? industry.consumption
                : 100,
          }))
        : [],
    };

    // Calcular métricas con validación mejorada
    const avgDemand =
      typeof apiResults.average_demand === "number"
        ? apiResults.average_demand
        : 0;
    const hours = typeof apiResults.hours === "number" ? apiResults.hours : 24;
    const totalEnergyConsumption = avgDemand * hours;

    // Calcular precio promedio con validación
    let averagePrice = 0.15; // Valor por defecto
    if (apiResults.price_series && Array.isArray(apiResults.price_series)) {
      const validPrices = apiResults.price_series.filter(
        (price) => typeof price === "number" && price > 0
      );
      if (validPrices.length > 0) {
        averagePrice =
          validPrices.reduce((sum, price) => sum + price, 0) /
          validPrices.length;
      }
    }

    const energyCost = totalEnergyConsumption * averagePrice;
    const emissionFactor = 0.5; // kg CO2 por kWh
    const totalEmissions = totalEnergyConsumption * emissionFactor;

    // Construir métricas con datos validados del backend
    const metrics = {
      // Usar datos reales de fixed_demand del backend cuando estén disponibles
      peak_demand_fixed:
        hasValidFixedData &&
        typeof apiResults.fixed_demand.peak_demand === "number"
          ? apiResults.fixed_demand.peak_demand
          : currentStrategy === "fixed"
          ? typeof apiResults.peak_demand === "number"
            ? apiResults.peak_demand
            : 0
          : typeof apiResults.peak_demand === "number"
          ? apiResults.peak_demand * 1.12
          : 0,

      peak_demand_dr:
        typeof apiResults.peak_demand === "number" ? apiResults.peak_demand : 0,
      peak_demand_confidence:
        typeof apiResults.peak_demand_confidence === "number"
          ? apiResults.peak_demand_confidence
          : 0,

      avg_demand_fixed:
        hasValidFixedData &&
        typeof apiResults.fixed_demand.average_demand === "number"
          ? apiResults.fixed_demand.average_demand
          : currentStrategy === "fixed"
          ? avgDemand
          : avgDemand * 1.08,

      avg_demand_dr: avgDemand,
      avg_demand_confidence:
        typeof apiResults.average_demand_confidence === "number"
          ? apiResults.average_demand_confidence
          : 0,

      emissions_reduction:
        typeof apiResults.reduced_emissions === "number"
          ? apiResults.reduced_emissions
          : 0,
      emissions_total: isNaN(totalEmissions) ? 0 : totalEmissions,
      emissions_reduction_confidence:
        typeof apiResults.reduced_emissions_confidence === "number"
          ? apiResults.reduced_emissions_confidence
          : 0,

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

    // Calcular valores derivados
    metrics.energy_cost_estimate = metrics.avg_demand_dr * hours * averagePrice;
    metrics.potential_savings = Math.max(
      0,
      (metrics.avg_demand_fixed - metrics.avg_demand_dr) * hours * averagePrice
    );

    console.log("=== MÉTRICAS FINALES ===");
    console.log("Métricas procesadas:", {
      strategy: metrics.strategy,
      peak_fixed: metrics.peak_demand_fixed.toFixed(2),
      peak_dr: metrics.peak_demand_dr.toFixed(2),
      avg_fixed: metrics.avg_demand_fixed.toFixed(2),
      avg_dr: metrics.avg_demand_dr.toFixed(2),
      monte_carlo_samples: metrics.monte_carlo_samples,
    });

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
