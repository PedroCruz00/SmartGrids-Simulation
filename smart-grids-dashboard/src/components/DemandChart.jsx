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
  // Si no hay datos, no renderizar
  if (!data || !data.length) return null;

  // Procesar datos para añadir intervalos de confianza si están disponibles
  const chartData = data.map((item, index) => {
    const baseEntry = {
      hour: item.hour !== undefined ? item.hour : index,
      fixed_demand: item.fixed_demand || 0,
      dr_demand: item.dr_demand || 0,
    };

    // Si tenemos datos de Monte Carlo con desviación estándar, añadir límites
    if (showConfidence && item.dr_demand_std) {
      // Asumimos un nivel de confianza de 95% (1.96 * std)
      const confidenceFactor = 1.96;
      baseEntry.dr_lower =
        item.dr_demand - confidenceFactor * item.dr_demand_std;
      baseEntry.dr_upper =
        item.dr_demand + confidenceFactor * item.dr_demand_std;
    }

    // Si tenemos datos de precio, añadirlos
    if (item.price) {
      baseEntry.price = item.price;
    }

    return baseEntry;
  });

  // Determinar si usar un gráfico simple o compuesto (con áreas para intervalos)
  const useComposedChart =
    showConfidence && chartData.some((d) => d.dr_lower !== undefined);

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Comparativa de Demanda Energética
      </h2>
      <div className="h-64">
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
                label={{
                  value: "Demanda (kW)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{
                  value: "Precio ($/kWh)",
                  angle: -90,
                  position: "insideRight",
                }}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (typeof value === "number") {
                    const unit = name === "Precio ($/kWh)" ? " $/kWh" : " kW";
                    return [`${value.toFixed(2)}${unit}`, name];
                  }
                  return [value, name];
                }}
                labelFormatter={(hour) => `Hora ${hour}`}
              />

              <Legend />
              <Line
                type="monotone"
                dataKey="fixed_demand"
                name="Consumo Fijo"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="dr_demand"
                name="Con Respuesta a Demanda"
                stroke="#82ca9d"
                strokeWidth={2}
              />
              {/* Áreas para el intervalo de confianza */}
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
              {/* Línea de precio si está disponible */}
              {chartData.some((d) => d.price !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="price"
                  name="Precio ($/kWh)"
                  stroke="#ff7300"
                  yAxisId="right"
                  dot={false}
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
                label={{
                  value: "Demanda (kW)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (typeof value === "number") {
                    const unit = name === "Precio ($/kWh)" ? " $/kWh" : " kW";
                    return [`${value.toFixed(2)}${unit}`, name];
                  }
                  return [value, name];
                }}
                labelFormatter={(hour) => `Hora ${hour}`}
              />

              <Legend />
              <Line
                type="monotone"
                dataKey="fixed_demand"
                name="Consumo Fijo"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="dr_demand"
                name="Con Respuesta a Demanda"
                stroke="#82ca9d"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
