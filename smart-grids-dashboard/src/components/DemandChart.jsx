import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DemandChart({ data }) {
  // Si no hay datos, no renderizar
  if (!data || !data.length) return null;

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Comparativa de Demanda Energética
      </h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
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
              formatter={(value) => [`${value.toFixed(2)} kW`, ""]}
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
        </ResponsiveContainer>
      </div>
    </div>
  );
}
