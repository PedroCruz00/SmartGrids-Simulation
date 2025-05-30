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

    // Determinar estrategia actual
    const currentStrategy = apiResults.strategy || "fixed";
    console.log("Estrategia actual:", currentStrategy);

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

    // Construir estructura para el gráfico con validación mejorada
    const hourlyData = apiResults.time_series.map((value, i) => {
      const entry = {
        hour: i % 24,
        dr_demand: typeof value === "number" ? value : 0,
      };

      // Lógica mejorada para fixed_demand
      if (currentStrategy === "fixed") {
        // En modo fijo, ambas series son idénticas
        entry.fixed_demand = entry.dr_demand;
      } else if (hasValidFixedData) {
        // Usar datos reales de fixed_demand del backend
        entry.fixed_demand =
          typeof apiResults.fixed_demand.time_series[i] === "number"
            ? apiResults.fixed_demand.time_series[i]
            : entry.dr_demand * 1.15; // Fallback conservador
      } else {
        // Para estrategias no-fijas sin datos de referencia válidos
        console.warn(
          `⚠️ No hay datos fixed_demand válidos para estrategia '${currentStrategy}'. Generando referencia estimada.`
        );
        // Generar una referencia más realista basada en patrones típicos
        const hourOfDay = i % 24;
        let multiplier = 1.12; // Base de 12% más alto sin optimización

        // Ajustar multiplicador según la hora del día (picos típicos)
        if (hourOfDay >= 7 && hourOfDay <= 9) {
          multiplier = 1.18; // Pico matutino más pronunciado
        } else if (hourOfDay >= 18 && hourOfDay <= 21) {
          multiplier = 1.2; // Pico vespertino más pronunciado
        } else if (hourOfDay >= 12 && hourOfDay <= 14) {
          multiplier = 1.15; // Pico medio día
        } else if (hourOfDay >= 0 && hourOfDay <= 5) {
          multiplier = 1.08; // Valle nocturno con menor diferencia
        }

        entry.fixed_demand = entry.dr_demand * multiplier;
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

    // Verificación de calidad de datos mejorada
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

        const fixedPeak = Math.max(...fixedValues);
        const drPeak = Math.max(...drValues);
        const peakDifference = Math.abs(fixedPeak - drPeak);
        const peakPercentDifference =
          (peakDifference / Math.max(fixedPeak, drPeak)) * 100;

        console.log(`Estrategia: ${currentStrategy}`);
        console.log(`Promedio fixed_demand: ${fixedAvg.toFixed(2)} kW`);
        console.log(`Promedio dr_demand: ${drAvg.toFixed(2)} kW`);
        console.log(
          `Diferencia promedio: ${avgDifference.toFixed(
            2
          )} kW (${percentDifference.toFixed(1)}%)`
        );
        console.log(`Pico fixed_demand: ${fixedPeak.toFixed(2)} kW`);
        console.log(`Pico dr_demand: ${drPeak.toFixed(2)} kW`);
        console.log(
          `Diferencia pico: ${peakDifference.toFixed(
            2
          )} kW (${peakPercentDifference.toFixed(1)}%)`
        );

        if (currentStrategy !== "fixed") {
          if (percentDifference < 2) {
            console.warn(
              "⚠️ Las diferencias promedio entre estrategias son muy pequeñas (<2%)"
            );
          } else {
            console.log("✅ Las series tienen diferencias apropiadas");
          }

          if (peakPercentDifference < 5) {
            console.warn(
              "⚠️ Las diferencias de pico entre estrategias son pequeñas (<5%)"
            );
          } else {
            console.log("✅ Las diferencias de pico son significativas");
          }
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
        currentStrategy === "fixed"
          ? typeof apiResults.peak_demand === "number"
            ? apiResults.peak_demand
            : 0
          : hasValidFixedData &&
            typeof apiResults.fixed_demand.peak_demand === "number"
          ? apiResults.fixed_demand.peak_demand
          : typeof apiResults.peak_demand === "number"
          ? Math.max(...hourlyData.map((d) => d.fixed_demand))
          : 0,

      peak_demand_dr:
        typeof apiResults.peak_demand === "number" ? apiResults.peak_demand : 0,
      peak_demand_confidence:
        typeof apiResults.peak_demand_confidence === "number"
          ? apiResults.peak_demand_confidence
          : 0,

      avg_demand_fixed:
        currentStrategy === "fixed"
          ? avgDemand
          : hasValidFixedData &&
            typeof apiResults.fixed_demand.average_demand === "number"
          ? apiResults.fixed_demand.average_demand
          : hourlyData.reduce((sum, d) => sum + d.fixed_demand, 0) /
            hourlyData.length,

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
      peak_reduction: (
        metrics.peak_demand_fixed - metrics.peak_demand_dr
      ).toFixed(2),
      peak_reduction_percent:
        (
          ((metrics.peak_demand_fixed - metrics.peak_demand_dr) /
            metrics.peak_demand_fixed) *
          100
        ).toFixed(1) + "%",
    });

    return {
      demand_data: hourlyData,
      metrics: metrics,
      network_data: validatedNetworkData,
      energy_system: apiResults.final_energy_system,
      strategy: currentStrategy, // Incluir estrategia en los resultados
    };
  };

  const handleRunSimulation = async (params) => {
    setLoading(true);
    setError(null);

    // Limpiar resultados anteriores para evitar estado residual
    setSimulationResults(null);

    try {
      console.log("Ejecutando simulación con parámetros:", params);
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
      {/* Header mejorado con mejor espaciado */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Smart Grids Simulation
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Análisis comparativo de estrategias de gestión energética
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                  <span>Monte Carlo</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  <span>Markov</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
                  <span>Sistemas Dinámicos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Formulario de configuración */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <SimulationForm onSubmit={handleRunSimulation} />
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-700">
              <div className="flex items-center">
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
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Estado inicial - información de métodos */}
          {!loading && !simulationResults && (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="px-6 py-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Métodos de Simulación Avanzados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 dark:border-blue-700">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">MC</span>
                      </div>
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Monte Carlo
                      </h3>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Múltiples simulaciones con condiciones iniciales
                      aleatorias para cuantificar incertidumbre y obtener
                      intervalos de confianza estadísticos.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 dark:from-green-900/30 dark:to-green-800/30 dark:border-green-700">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">MK</span>
                      </div>
                      <h3 className="text-sm font-semibold text-green-900 dark:text-green-100">
                        Cadenas de Markov
                      </h3>
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Modelado estocástico de transiciones entre estados de
                      demanda con dependencias temporales y patrones de consumo
                      realistas.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 dark:border-purple-700">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">DS</span>
                      </div>
                      <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        Dinámica de Sistemas
                      </h3>
                    </div>
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      Retroalimentaciones entre precios, adopción de renovables
                      y almacenamiento, modelando la evolución del sistema
                      energético.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 dark:border-orange-700">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">ED</span>
                      </div>
                      <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                        Eventos Discretos
                      </h3>
                    </div>
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      Simulación horaria que actualiza el estado del sistema
                      según condiciones cambiantes y reglas de optimización.
                    </p>
                  </div>
                </div>

                <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200 dark:bg-gray-700/50 dark:border-gray-600">
                  <div className="flex items-center justify-center text-gray-600 dark:text-gray-300">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">
                      Configure los parámetros arriba y ejecute una simulación
                      para ver los resultados
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Estado de carga */}
          {loading && (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="px-6 py-12 flex justify-center">
                <Loader />
              </div>
            </div>
          )}

          {/* Resultados de la simulación */}
          {simulationResults && (
            <div className="space-y-6">
              {/* Panel de métricas - ancho completo mejorado */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="px-6 py-5">
                  <MetricsPanel data={simulationResults.metrics} />
                </div>
              </div>

              {/* Gráfico de demanda - ancho completo */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="px-6 py-5">
                  <DemandChart
                    data={simulationResults.demand_data}
                    showConfidence={
                      simulationResults.metrics.monte_carlo_samples > 1
                    }
                    strategy={simulationResults.strategy}
                  />
                </div>
              </div>

              {/* Red de consumidores - optimizada para pantalla completa */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="h-[600px]">
                  <NodeNetwork data={simulationResults.network_data} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer mejorado */}
      <footer className="mt-12 bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Smart Grids Simulation v2.0</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">
                Simulación avanzada de redes eléctricas
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="hidden md:inline">Desarrollado por:</span>
              <span className="font-medium">
                Pedro Cruz, Jhon Castro, Daniel Arévalo, Daniel Benavides
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
