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

export default function DemandChart({ data, showConfidence = false }) {
  // Depuración mejorada
  React.useEffect(() => {
    if (data && data.length) {
      console.log("=== ANÁLISIS DE DATOS EN DemandChart ===");
      console.log(`Total de puntos: ${data.length}`);
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
          `DR demand - Min: ${Math.min(...drValues).toFixed(
            2
          )}, Max: ${Math.max(...drValues).toFixed(2)}, Promedio: ${(
            drValues.reduce((a, b) => a + b, 0) / drValues.length
          ).toFixed(2)}`
        );
      }

      // Verificar diferencias significativas
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

      if (avgDifference < 1) {
        console.warn(
          "⚠️ Las diferencias entre estrategias son muy pequeñas - puede ser difícil visualizar"
        );
      }

      console.log("==========================================");
    }
  }, [data]);

  // Si no hay datos, no renderizar
  if (!data || !data.length) {
    console.log("No hay datos para renderizar");
    return <div className="p-4 text-gray-500">No hay datos para mostrar</div>;
  }

  // Procesar datos para añadir intervalos de confianza si están disponibles
  const chartData = data.map((item, index) => {
    const baseEntry = {
      hour: item.hour !== undefined ? item.hour : index,
      fixed_demand: item.fixed_demand || 0,
      dr_demand: item.dr_demand || 0,
    };

    // Si tenemos datos de Monte Carlo con desviación estándar, añadir límites
    if (showConfidence && item.dr_demand_std) {
      const confidenceFactor = 1.96;
      baseEntry.dr_lower = Math.max(
        0,
        item.dr_demand - confidenceFactor * item.dr_demand_std
      );
      baseEntry.dr_upper =
        item.dr_demand + confidenceFactor * item.dr_demand_std;
    }

    // Si tenemos datos de precio, añadirlos
    if (item.price) {
      baseEntry.price = item.price;
    }

    return baseEntry;
  });

  // Calcular rangos para mejor visualización
  const allDemandValues = chartData
    .flatMap((d) => [d.fixed_demand, d.dr_demand])
    .filter((v) => v > 0);
  const minDemand = Math.min(...allDemandValues);
  const maxDemand = Math.max(...allDemandValues);
  const demandRange = maxDemand - minDemand;

  // Ajustar el dominio del eje Y para mejor visualización
  const yAxisDomain = [
    Math.max(0, minDemand - demandRange * 0.1),
    maxDemand + demandRange * 0.1,
  ];

  // Determinar si usar un gráfico simple o compuesto
  const useComposedChart =
    showConfidence && chartData.some((d) => d.dr_lower !== undefined);

  // Tooltip personalizado para mejor información
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-300 dark:border-gray-600 rounded shadow-lg">
          <p className="font-semibold">{`Hora: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toFixed(2)} ${
                entry.name.includes("Precio") ? "$/kWh" : "kW"
              }`}
            </p>
          ))}
          {payload.length >= 2 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {`Diferencia: ${Math.abs(
                payload[0].value - payload[1].value
              ).toFixed(2)} kW`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Comparativa de Demanda Energética
      </h2>
      <div className="h-80">
        {" "}
        {/* Aumentar altura para mejor visualización */}
        <ResponsiveContainer width="100%" height="100%">
          {useComposedChart ? (
            <ComposedChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                label={{
                  value: "Hora del día",
                  position: "insideBottomRight",
                  offset: -5,
                }}
              />
              <YAxis
                domain={yAxisDomain}
                label={{
                  value: "Demanda (kW)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              {chartData.some((d) => d.price !== undefined) && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{
                    value: "Precio ($/kWh)",
                    angle: -90,
                    position: "insideRight",
                  }}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Áreas para el intervalo de confianza primero (fondo) */}
              <Area
                type="monotone"
                dataKey="dr_upper"
                stroke="transparent"
                fill="#82ca9d"
                fillOpacity={0.2}
                name="Límite Superior IC"
              />
              <Area
                type="monotone"
                dataKey="dr_lower"
                stroke="transparent"
                fill="#82ca9d"
                fillOpacity={0.2}
                name="Límite Inferior IC"
              />

              {/* Líneas principales */}
              <Line
                type="monotone"
                dataKey="fixed_demand"
                name="Consumo Fijo"
                stroke="#8884d8"
                strokeWidth={3}
                activeDot={{ r: 6 }}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="dr_demand"
                name="Con Gestión Inteligente"
                stroke="#82ca9d"
                strokeWidth={3}
                activeDot={{ r: 6 }}
                dot={{ r: 2 }}
              />

              {/* Línea de precio si está disponible */}
              {chartData.some((d) => d.price !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="price"
                  name="Precio Dinámico"
                  stroke="#ff7300"
                  strokeWidth={2}
                  yAxisId="right"
                  dot={{ r: 1 }}
                />
              )}
            </ComposedChart>
          ) : (
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                label={{
                  value: "Hora del día",
                  position: "insideBottomRight",
                  offset: -5,
                }}
              />
              <YAxis
                domain={yAxisDomain}
                label={{
                  value: "Demanda (kW)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              <Line
                type="monotone"
                dataKey="fixed_demand"
                name="Consumo Fijo"
                stroke="#8884d8"
                strokeWidth={3}
                activeDot={{ r: 6 }}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="dr_demand"
                name="Con Gestión Inteligente"
                stroke="#82ca9d"
                strokeWidth={3}
                activeDot={{ r: 6 }}
                dot={{ r: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Información adicional */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Pico Consumo Fijo:</strong>{" "}
            {Math.max(...chartData.map((d) => d.fixed_demand)).toFixed(2)} kW
          </div>
          <div>
            <strong>Pico Gestionado:</strong>{" "}
            {Math.max(...chartData.map((d) => d.dr_demand)).toFixed(2)} kW
          </div>
        </div>
        <div className="mt-2">
          <strong>Reducción de Pico:</strong>{" "}
          {(
            Math.max(...chartData.map((d) => d.fixed_demand)) -
            Math.max(...chartData.map((d) => d.dr_demand))
          ).toFixed(2)}{" "}
          kW (
          {(
            ((Math.max(...chartData.map((d) => d.fixed_demand)) -
              Math.max(...chartData.map((d) => d.dr_demand))) /
              Math.max(...chartData.map((d) => d.fixed_demand))) *
            100
          ).toFixed(1)}
          %)
        </div>
      </div>
    </div>
  );
}
