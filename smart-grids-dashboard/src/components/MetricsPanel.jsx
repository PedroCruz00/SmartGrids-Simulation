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
    emissions_total = 0,
    cost_savings,
    energy_cost = 0,
    energy_cost_estimate = 0,
    potential_savings = 0,
    monte_carlo_samples,
    peak_demand_confidence,
    avg_demand_confidence,
    emissions_reduction_confidence,
    strategy,
  } = data;

  // Verificar si estamos en modo de consumo fijo
  const isFixedMode = strategy === "fixed";

  // Calcular el porcentaje de reducción de pico con protección contra NaN
  const peakReduction =
    !isFixedMode && peak_demand_fixed && peak_demand_dr
      ? ((peak_demand_fixed - peak_demand_dr) / peak_demand_fixed) * 100
      : 0;

  // Calcular el porcentaje de reducción de demanda promedio con protección contra NaN
  const avgReduction =
    !isFixedMode && avg_demand_fixed && avg_demand_dr
      ? ((avg_demand_fixed - avg_demand_dr) / avg_demand_fixed) * 100
      : 0;

  // Factor de carga con protección contra NaN o división por cero
  const loadFactor =
    peak_demand_dr && peak_demand_dr > 0
      ? (avg_demand_dr / peak_demand_dr) * 100
      : 0;

  // Calcular consumo total con protección
  const totalConsumption = avg_demand_dr * 24; // 24 horas

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
            {!isFixedMode && peakReduction > 0 && (
              <div className="flex items-center text-green-500">
                <span className="mr-1">▼</span>
                <span className="text-sm">{peakReduction.toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-between items-end">
            <div>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {peak_demand_dr.toFixed(1)} kW
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {isFixedMode ? "Demanda máxima" : "Con respuesta optimizada"}
                {hasMonteCarlo && peak_demand_confidence && (
                  <span className="ml-1 text-blue-500">
                    ±{peak_demand_confidence.toFixed(1)}
                  </span>
                )}
              </p>
            </div>
            {!isFixedMode && peak_demand_fixed && (
              <div className="text-right">
                <p className="text-xl font-medium text-gray-500 dark:text-gray-400 line-through">
                  {peak_demand_fixed.toFixed(1)} kW
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Sin optimización
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Métricas de demanda promedio */}
        <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">
              Demanda Promedio
            </h3>
            {!isFixedMode && avgReduction > 0 && (
              <div className="flex items-center text-green-500">
                <span className="mr-1">▼</span>
                <span className="text-sm">{avgReduction.toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-between items-end">
            <div>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {avg_demand_dr.toFixed(1)} kW
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {isFixedMode ? "Consumo medio" : "Con respuesta optimizada"}
                {hasMonteCarlo && avg_demand_confidence && (
                  <span className="ml-1 text-blue-500">
                    ±{avg_demand_confidence.toFixed(1)}
                  </span>
                )}
              </p>
            </div>
            {!isFixedMode && avg_demand_fixed && (
              <div className="text-right">
                <p className="text-xl font-medium text-gray-500 dark:text-gray-400 line-through">
                  {avg_demand_fixed.toFixed(1)} kW
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Sin optimización
                </p>
              </div>
            )}
            {isFixedMode && (
              <div className="flex flex-col items-end">
                <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                  Factor de carga:
                </div>
                <div className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                  {loadFactor.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resto de las métricas permanecen igual... */}
      </div>

      {/* Monte Carlo info */}
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

      {/* Solo en modo fijo: Potencial de mejora */}
      {isFixedMode && (
        <div className="mt-6 bg-green-50 p-4 rounded-lg dark:bg-green-900">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            Potencial de Mejora
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300 mb-3">
            Implementando una estrategia de respuesta a la demanda, podrías
            obtener:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded shadow-sm dark:bg-green-800">
              <div className="text-green-600 dark:text-green-200 font-medium">
                Reducción potencial de pico
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-100">
                10-15%
              </div>
            </div>
            <div className="bg-white p-3 rounded shadow-sm dark:bg-green-800">
              <div className="text-green-600 dark:text-green-200 font-medium">
                Ahorro económico estimado
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-100">
                ${potential_savings.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
