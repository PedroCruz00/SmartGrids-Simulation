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
    monte_carlo_samples,
    peak_demand_confidence,
    avg_demand_confidence,
    emissions_reduction_confidence,
  } = data;

  // Calcular el porcentaje de reducción de pico
  const peakReduction =
    ((peak_demand_fixed - peak_demand_dr) / peak_demand_fixed) * 100;

  // Calcular el porcentaje de reducción de demanda promedio
  const avgReduction =
    ((avg_demand_fixed - avg_demand_dr) / avg_demand_fixed) * 100;

  // Verificar si hay estadísticas de Monte Carlo
  const hasMonteCarlo = monte_carlo_samples > 1;

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Resultados de la Simulación
        {hasMonteCarlo && (
          <span className="ml-2 text-sm font-normal text-blue-500">
            (Monte Carlo: {monte_carlo_samples} muestras)
          </span>
        )}
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
                {hasMonteCarlo && peak_demand_confidence && (
                  <span className="ml-1 text-blue-500">
                    ±{peak_demand_confidence.toFixed(1)}
                  </span>
                )}
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
                {hasMonteCarlo && avg_demand_confidence && (
                  <span className="ml-1 text-blue-500">
                    ±{avg_demand_confidence.toFixed(1)}
                  </span>
                )}
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
              {hasMonteCarlo && emissions_reduction_confidence && (
                <span className="ml-1 text-blue-500">
                  ±{emissions_reduction_confidence.toFixed(1)}
                </span>
              )}
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

      {/* Si hay datos de Monte Carlo, mostrar información adicional */}
      {hasMonteCarlo && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg dark:bg-blue-900">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Información Monte Carlo
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            La simulación fue ejecutada {monte_carlo_samples} veces con
            diferentes condiciones iniciales. Los intervalos de confianza (±) se
            muestran al 95% de nivel de confianza.
          </p>
        </div>
      )}
    </div>
  );
}
