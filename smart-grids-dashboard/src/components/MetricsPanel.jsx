export default function MetricsPanel({ data }) {
  // Si no hay datos, no renderizar
  if (!data) return null;

  // Datos para las métricas
  const {
    peak_demand_fixed,
    peak_demand_dr,
    avg_demand_fixed,
    avg_demand_dr,
    emissions_reduction,
    cost_savings,
  } = data;

  // Calcular el porcentaje de reducción de pico
  const peakReduction =
    ((peak_demand_fixed - peak_demand_dr) / peak_demand_fixed) * 100;

  // Calcular el porcentaje de reducción de demanda promedio
  const avgReduction =
    ((avg_demand_fixed - avg_demand_dr) / avg_demand_fixed) * 100;

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Resultados de la Simulación
      </h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Métricas de demanda pico */}
        <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">
              Demanda Pico
            </h3>
            <div className="flex items-center text-green-500">
              <span className="mr-1">▼</span>
              <span className="text-sm">{peakReduction.toFixed(1)}%</span>
            </div>
          </div>
          <div className="mt-2 flex justify-between items-end">
            <div>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {peak_demand_dr.toFixed(1)} kW
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                Con respuesta a la demanda
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-medium text-gray-500 dark:text-gray-400 line-through">
                {peak_demand_fixed.toFixed(1)} kW
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                Sin respuesta
              </p>
            </div>
          </div>
        </div>

        {/* Métricas de demanda promedio */}
        <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">
              Demanda Promedio
            </h3>
            <div className="flex items-center text-green-500">
              <span className="mr-1">▼</span>
              <span className="text-sm">{avgReduction.toFixed(1)}%</span>
            </div>
          </div>
          <div className="mt-2 flex justify-between items-end">
            <div>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {avg_demand_dr.toFixed(1)} kW
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                Con respuesta a la demanda
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-medium text-gray-500 dark:text-gray-400 line-through">
                {avg_demand_fixed.toFixed(1)} kW
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                Sin respuesta
              </p>
            </div>
          </div>
        </div>

        {/* Métricas de reducción de emisiones */}
        <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">
            Reducción de Emisiones
          </h3>
          <div className="mt-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">
              {emissions_reduction.toFixed(1)} kg CO₂
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Ahorro estimado
            </p>
          </div>
        </div>

        {/* Métricas de ahorro económico */}
        <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">
            Ahorro Económico
          </h3>
          <div className="mt-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">
              ${cost_savings.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Total estimado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
