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
    return <div className="p-4 text-gray-500">No hay datos para mostrar</div>;
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

    // Si tenemos datos de precio, añadirlos
    if (typeof item.price === "number") {
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
      <div className="p-4 text-gray-500">No hay datos válidos para mostrar</div>
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

            {/* Mostrar precio si está disponible */}
            {priceEntry && (
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
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Comparativa de Demanda Energética
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
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

      <div className="h-96 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="hour"
                label={{
                  value: "Hora del día",
                  position: "insideBottom",
                  offset: -10,
                  style: { textAnchor: "middle" },
                }}
                tick={{ fontSize: 12 }}
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
              />
              {finalData.some((d) => d.price !== undefined) && (
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

              {/* Línea de precio si está disponible */}
              {finalData.some((d) => d.price !== undefined) && (
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="hour"
                label={{
                  value: "Hora del día",
                  position: "insideBottom",
                  offset: -10,
                  style: { textAnchor: "middle" },
                }}
                tick={{ fontSize: 12 }}
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

      {/* Información adicional con etiquetas correctas */}
      <div className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Resumen del Análisis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-700 p-3 rounded">
            <div className="font-medium text-gray-900 dark:text-white">
              Pico {strategy === "fixed" ? "Actual" : currentStrategyLabel}
            </div>
            <div
              className="text-xl font-bold"
              style={{ color: colors.primary }}
            >
              {Math.max(...finalData.map((d) => d.dr_demand)).toFixed(1)} kW
            </div>
          </div>

          {strategy !== "fixed" && (
            <div className="bg-white dark:bg-gray-700 p-3 rounded">
              <div className="font-medium text-gray-600 dark:text-gray-300">
                Pico Referencia
              </div>
              <div className="text-xl font-bold text-gray-500">
                {Math.max(...finalData.map((d) => d.fixed_demand)).toFixed(1)}{" "}
                kW
              </div>
            </div>
          )}

          {strategy !== "fixed" && (
            <div className="bg-white dark:bg-gray-700 p-3 rounded">
              <div className="font-medium text-green-700 dark:text-green-300">
                Reducción Obtenida
              </div>
              <div className="text-xl font-bold text-green-600">
                {(
                  Math.max(...finalData.map((d) => d.fixed_demand)) -
                  Math.max(...finalData.map((d) => d.dr_demand))
                ).toFixed(1)}{" "}
                kW
                <span className="text-sm ml-1">
                  (
                  {(
                    ((Math.max(...finalData.map((d) => d.fixed_demand)) -
                      Math.max(...finalData.map((d) => d.dr_demand))) /
                      Math.max(...finalData.map((d) => d.fixed_demand))) *
                    100
                  ).toFixed(1)}
                  %)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
