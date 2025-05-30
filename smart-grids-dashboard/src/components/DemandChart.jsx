import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";

export default function DemandChart({
  data,
  showConfidence = false,
  strategy = "fixed",
}) {
  // Depuración mejorada
  React.useEffect(() => {
    if (data && data.length) {
      console.log("=== ANÁLISIS DE DATOS EN DemandChart ===");
      console.log(`Total de puntos: ${data.length}`);
      console.log(`Estrategia actual: ${strategy}`);
      console.log("Primer punto:", data[0]);
      console.log("Último punto:", data[data.length - 1]);

      // Análisis de rangos para cada serie
      const fixedValues = data.map((d) => d.fixed_demand).filter((v) => v > 0);
      const drValues = data.map((d) => d.dr_demand).filter((v) => v > 0);

      if (fixedValues.length > 0) {
        console.log(
          `Fixed demand - Min: ${Math.min(...fixedValues).toFixed(
            2
          )}, Max: ${Math.max(...fixedValues).toFixed(2)}, Promedio: ${(
            fixedValues.reduce((a, b) => a + b, 0) / fixedValues.length
          ).toFixed(2)}`
        );
      }

      if (drValues.length > 0) {
        console.log(
          `Current strategy demand - Min: ${Math.min(...drValues).toFixed(
            2
          )}, Max: ${Math.max(...drValues).toFixed(2)}, Promedio: ${(
            drValues.reduce((a, b) => a + b, 0) / drValues.length
          ).toFixed(2)}`
        );
      }

      // Verificar diferencias significativas
      if (strategy !== "fixed") {
        const differences = data.map((d) =>
          Math.abs(d.fixed_demand - d.dr_demand)
        );
        const avgDifference =
          differences.reduce((a, b) => a + b, 0) / differences.length;
        const maxDifference = Math.max(...differences);

        console.log(
          `Diferencia promedio: ${avgDifference.toFixed(
            2
          )}, Diferencia máxima: ${maxDifference.toFixed(2)}`
        );

        if (avgDifference < 5) {
          console.warn(
            "⚠️ Las diferencias entre estrategias son pequeñas - puede ser difícil visualizar"
          );
        }
      }

      console.log("==========================================");
    }
  }, [data, strategy]);

  // Si no hay datos, no renderizar
  if (!data || !data.length) {
    console.log("No hay datos para renderizar");
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            No hay datos disponibles
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ejecute una simulación para ver los resultados
          </p>
        </div>
      </div>
    );
  }

  // Función para obtener etiquetas dinámicas según la estrategia
  const getStrategyLabel = (strategy) => {
    switch (strategy) {
      case "fixed":
        return "Consumo Fijo";
      case "demand_response":
        return "Respuesta a la Demanda";
      case "smart_grid":
        return "Red Inteligente";
      default:
        return "Estrategia Actual";
    }
  };

  // Función para obtener descripción de la estrategia
  const getStrategyDescription = (strategy) => {
    switch (strategy) {
      case "fixed":
        return "Línea base sin optimización";
      case "demand_response":
        return "Con precios dinámicos";
      case "smart_grid":
        return "Con gestión inteligente";
      default:
        return "Estrategia personalizada";
    }
  };

  // Función para obtener colores según la estrategia
  const getStrategyColors = (strategy) => {
    switch (strategy) {
      case "fixed":
        return {
          primary: "#3b82f6", // Azul
          secondary: "#60a5fa",
        };
      case "demand_response":
        return {
          primary: "#10b981", // Verde
          secondary: "#34d399",
          reference: "#6b7280", // Gris para referencia
        };
      case "smart_grid":
        return {
          primary: "#8b5cf6", // Púrpura
          secondary: "#a78bfa",
          reference: "#6b7280", // Gris para referencia
        };
      default:
        return {
          primary: "#3b82f6",
          secondary: "#60a5fa",
          reference: "#6b7280",
        };
    }
  };

  // Determinar las etiquetas correctas
  const fixedLabel =
    strategy === "fixed" ? "Consumo Fijo" : "Consumo Fijo (Referencia)";
  const currentStrategyLabel = getStrategyLabel(strategy);
  const currentStrategyDescription = getStrategyDescription(strategy);
  const colors = getStrategyColors(strategy);

  // Procesar datos para añadir intervalos de confianza si están disponibles
  const chartData = data.map((item, index) => {
    const baseEntry = {
      hour: typeof item.hour === "number" ? item.hour : index,
      fixed_demand:
        typeof item.fixed_demand === "number" ? item.fixed_demand : 0,
      dr_demand: typeof item.dr_demand === "number" ? item.dr_demand : 0,
    };

    // Si tenemos datos de Monte Carlo con desviación estándar, añadir límites
    if (
      showConfidence &&
      typeof item.dr_demand_std === "number" &&
      item.dr_demand_std > 0
    ) {
      const confidenceFactor = 1.96; // Para intervalo de confianza del 95%
      baseEntry.dr_demand_std = item.dr_demand_std;
      baseEntry.dr_lower = Math.max(
        0,
        item.dr_demand - confidenceFactor * item.dr_demand_std
      );
      baseEntry.dr_upper =
        item.dr_demand + confidenceFactor * item.dr_demand_std;

      // También calcular límites para fixed_demand si tiene desviación estándar
      if (
        typeof item.fixed_demand_std === "number" &&
        item.fixed_demand_std > 0
      ) {
        baseEntry.fixed_demand_std = item.fixed_demand_std;
        baseEntry.fixed_lower = Math.max(
          0,
          item.fixed_demand - confidenceFactor * item.fixed_demand_std
        );
        baseEntry.fixed_upper =
          item.fixed_demand + confidenceFactor * item.fixed_demand_std;
      }
    }

    // *** CORRECCIÓN: Solo añadir precio si NO es estrategia "fixed" ***
    if (strategy !== "fixed" && typeof item.price === "number") {
      baseEntry.price = item.price;
    }

    return baseEntry;
  });

  // Validar que tenemos datos válidos
  const validChartData = chartData.filter(
    (item) =>
      typeof item.fixed_demand === "number" &&
      typeof item.dr_demand === "number" &&
      !isNaN(item.fixed_demand) &&
      !isNaN(item.dr_demand)
  );

  if (validChartData.length !== chartData.length) {
    console.warn(
      `⚠️ Filtrados ${
        chartData.length - validChartData.length
      } puntos de datos inválidos`
    );
  }

  // Usar datos validados
  const finalData = validChartData.length > 0 ? validChartData : chartData;

  // Calcular rangos para mejor visualización
  const allDemandValues = finalData
    .flatMap((d) => [d.fixed_demand, d.dr_demand])
    .filter((v) => v > 0);

  if (allDemandValues.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Datos inválidos
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No se pudieron procesar los datos de demanda
          </p>
        </div>
      </div>
    );
  }

  const minDemand = Math.min(...allDemandValues);
  const maxDemand = Math.max(...allDemandValues);
  const demandRange = maxDemand - minDemand;

  // Ajustar el dominio del eje Y para mejor visualización
  const yAxisDomain = [
    Math.max(0, minDemand - demandRange * 0.15), // Más margen inferior
    maxDemand + demandRange * 0.15, // Más margen superior
  ];

  // Determinar si usar un gráfico simple o compuesto
  const useComposedChart =
    showConfidence && finalData.some((d) => d.dr_lower !== undefined);

  // *** VERIFICAR SI HAY DATOS DE PRECIO PARA MOSTRAR ***
  const hasPriceData =
    strategy !== "fixed" && finalData.some((d) => d.price !== undefined);

  // Tooltip personalizado mejorado para mejor información
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Encontrar los valores principales (fixed_demand y dr_demand)
      const fixedEntry = payload.find(
        (entry) => entry.dataKey === "fixed_demand"
      );
      const drEntry = payload.find((entry) => entry.dataKey === "dr_demand");
      const priceEntry = payload.find((entry) => entry.dataKey === "price");

      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-w-xs">
          <p className="font-bold text-lg mb-3 text-gray-900 dark:text-white">{`Hora: ${label}:00`}</p>

          {/* Mostrar demandas principales con etiquetas correctas */}
          <div className="space-y-2">
            {strategy !== "fixed" && fixedEntry && (
              <div className="flex justify-between items-center">
                <span
                  style={{ color: fixedEntry.color }}
                  className="font-medium"
                >
                  {fixedLabel}:
                </span>
                <span className="font-bold">
                  {fixedEntry.value.toFixed(1)} kW
                </span>
              </div>
            )}

            {drEntry && (
              <div className="flex justify-between items-center">
                <span style={{ color: drEntry.color }} className="font-medium">
                  {currentStrategyLabel}:
                </span>
                <span className="font-bold">{drEntry.value.toFixed(1)} kW</span>
              </div>
            )}

            {/* Mostrar precio solo si está disponible y NO es modo fixed */}
            {priceEntry && strategy !== "fixed" && (
              <div className="flex justify-between items-center">
                <span
                  style={{ color: priceEntry.color }}
                  className="font-medium"
                >
                  Precio:
                </span>
                <span className="font-bold">
                  ${priceEntry.value.toFixed(3)}/kWh
                </span>
              </div>
            )}
          </div>

          {/* Mostrar diferencia entre estrategias solo si no es modo fijo */}
          {fixedEntry && drEntry && strategy !== "fixed" && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Reducción:
                </span>
                <span className="font-semibold text-green-600">
                  {(fixedEntry.value - drEntry.value).toFixed(1)} kW
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Porcentaje:
                </span>
                <span className="font-semibold text-green-600">
                  {(
                    ((fixedEntry.value - drEntry.value) / fixedEntry.value) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          )}

          {/* Mostrar intervalos de confianza si están disponibles */}
          {showConfidence &&
            payload.some((entry) => entry.dataKey === "dr_demand_std") && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  📊 Intervalo de confianza 95%
                </p>
              </div>
            )}

          {/* Mensaje especial para modo fixed */}
          {strategy === "fixed" && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                💡 Escenario base sin optimización
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header mejorado con iconos y mejor organización */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {strategy === "fixed"
                ? "Perfil de Demanda Base"
                : "Comparativa de Demanda Energética"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {strategy !== "fixed" && (
                <span>{currentStrategyDescription} vs línea base</span>
              )}
              {strategy === "fixed" && (
                <span>Perfil de demanda sin optimizaciones (línea base)</span>
              )}
              {showConfidence && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  • Con intervalos de confianza Monte Carlo
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Indicadores de estrategia */}
        <div className="text-right">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              colors.primary === "#3b82f6"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                : colors.primary === "#10b981"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
            }`}
          >
            {strategy === "fixed" && "📊"}
            {strategy === "demand_response" && "⚡"}
            {strategy === "smart_grid" && "🔋"}
            <span className="ml-1">{currentStrategyLabel}</span>
          </div>
          {showConfidence && (
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Análisis estadístico
            </div>
          )}
        </div>
      </div>

      {/* Gráfico principal */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              {strategy !== "fixed" && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Referencia (línea discontinua)
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2`}
                  style={{ backgroundColor: colors.primary }}
                ></div>
                <span className="text-gray-600 dark:text-gray-400">
                  {currentStrategyLabel}
                </span>
              </div>
              {/* Solo mostrar indicador de precio si hay datos de precio */}
              {hasPriceData && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Precio dinámico
                  </span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {finalData.length} puntos de datos • Resolución horaria
              {strategy === "fixed" && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  • Escenario base
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="h-96 p-4">
          <ResponsiveContainer width="100%" height="100%">
            {useComposedChart ? (
              <ComposedChart
                data={finalData}
                margin={{
                  top: 20,
                  right: 40,
                  left: 20,
                  bottom: 40,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="hour"
                  label={{
                    value: "Hora del día",
                    position: "insideBottom",
                    offset: -10,
                    style: { textAnchor: "middle" },
                  }}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis
                  domain={yAxisDomain}
                  label={{
                    value: "Demanda (kW)",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle" },
                  }}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                {/* Solo mostrar eje Y derecho si hay datos de precio Y no es modo fixed */}
                {hasPriceData && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{
                      value: "Precio ($/kWh)",
                      angle: 90,
                      position: "insideRight",
                      style: { textAnchor: "middle" },
                    }}
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                )}
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                {/* Áreas para el intervalo de confianza primero (fondo) */}
                {showConfidence && (
                  <Area
                    type="monotone"
                    dataKey="dr_upper"
                    stroke="transparent"
                    fill={colors.primary}
                    fillOpacity={0.1}
                    name="Intervalo Confianza Superior"
                  />
                )}
                {showConfidence && (
                  <Area
                    type="monotone"
                    dataKey="dr_lower"
                    stroke="transparent"
                    fill={colors.primary}
                    fillOpacity={0.1}
                    name="Intervalo Confianza Inferior"
                  />
                )}

                {/* Líneas principales con etiquetas dinámicas */}
                {strategy !== "fixed" && (
                  <Line
                    type="monotone"
                    dataKey="fixed_demand"
                    name={fixedLabel}
                    stroke={colors.reference}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    activeDot={{ r: 5 }}
                    dot={{ r: 1 }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="dr_demand"
                  name={currentStrategyLabel}
                  stroke={colors.primary}
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  dot={{ r: 2 }}
                />

                {/* Línea de precio solo si hay datos y no es modo fixed */}
                {hasPriceData && (
                  <Line
                    type="monotone"
                    dataKey="price"
                    name="Precio Dinámico"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    yAxisId="right"
                    dot={{ r: 1 }}
                  />
                )}
              </ComposedChart>
            ) : (
              <LineChart
                data={finalData}
                margin={{
                  top: 20,
                  right: 40,
                  left: 20,
                  bottom: 40,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="hour"
                  label={{
                    value: "Hora del día",
                    position: "insideBottom",
                    offset: -10,
                    style: { textAnchor: "middle" },
                  }}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis
                  domain={yAxisDomain}
                  label={{
                    value: "Demanda (kW)",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle" },
                  }}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                {/* Solo mostrar línea de referencia si no estamos en modo fijo */}
                {strategy !== "fixed" && (
                  <Line
                    type="monotone"
                    dataKey="fixed_demand"
                    name={fixedLabel}
                    stroke={colors.reference}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    activeDot={{ r: 5 }}
                    dot={{ r: 1 }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="dr_demand"
                  name={currentStrategyLabel}
                  stroke={colors.primary}
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  dot={{ r: 2 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Panel de análisis mejorado */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <div className="flex items-center mb-4">
          <svg
            className="w-6 h-6 text-blue-500 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {strategy === "fixed"
              ? "Análisis del Escenario Base"
              : "Análisis de Resultados"}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pico de demanda */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pico {strategy === "fixed" ? "Base" : currentStrategyLabel}
              </span>
              <svg
                className="w-4 h-4 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: colors.primary }}
            >
              {Math.max(...finalData.map((d) => d.dr_demand)).toFixed(1)} kW
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {strategy === "fixed"
                ? "Demanda máxima natural"
                : "Máximo con optimización"}
            </div>
          </div>

          {/* Referencia (solo si no es fijo) */}
          {strategy !== "fixed" && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pico Referencia
                </span>
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-500">
                {Math.max(...finalData.map((d) => d.fixed_demand)).toFixed(1)}{" "}
                kW
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sin optimización
              </div>
            </div>
          )}

          {/* Reducción obtenida o promedio para modo fijo */}
          {strategy !== "fixed" ? (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Reducción Obtenida
                </span>
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {(
                  Math.max(...finalData.map((d) => d.fixed_demand)) -
                  Math.max(...finalData.map((d) => d.dr_demand))
                ).toFixed(1)}{" "}
                kW
              </div>
              <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                {(
                  ((Math.max(...finalData.map((d) => d.fixed_demand)) -
                    Math.max(...finalData.map((d) => d.dr_demand))) /
                    Math.max(...finalData.map((d) => d.fixed_demand))) *
                  100
                ).toFixed(1)}
                % reducción
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Demanda Promedio
                </span>
                <svg
                  className="w-4 h-4 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {(
                  finalData.reduce((sum, d) => sum + d.dr_demand, 0) /
                  finalData.length
                ).toFixed(1)}{" "}
                kW
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Factor de carga:{" "}
                {(
                  (finalData.reduce((sum, d) => sum + d.dr_demand, 0) /
                    finalData.length /
                    Math.max(...finalData.map((d) => d.dr_demand))) *
                  100
                ).toFixed(1)}
                %
              </div>
            </div>
          )}
        </div>

        {/* Información especial para modo fixed */}
        {strategy === "fixed" && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-blue-600 mr-2"
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
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Escenario Base - Sin Optimización
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Este perfil representa el consumo natural sin estrategias de
              optimización. No incluye precios dinámicos ya que los consumidores
              no responden a señales de precio. Este escenario sirve como línea
              base para comparar el impacto de las estrategias inteligentes.
            </p>
          </div>
        )}

        {/* Información adicional para Monte Carlo */}
        {showConfidence && (
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-purple-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                Intervalos de Confianza Monte Carlo
              </span>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Las áreas sombreadas muestran la variabilidad estadística de los
              resultados al 95% de confianza. Esto indica el rango probable de
              valores considerando la incertidumbre inherente del sistema.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
