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

  // Calcular métricas económicas
  const actualEnergyCost = energy_cost > 0 ? energy_cost : energy_cost_estimate;
  const dailySavings = cost_savings || 0;
  const monthlySavings = dailySavings * 30;
  const yearlySavings = dailySavings * 365;

  // Calcular factor de emisión implícito
  const emissionFactor =
    totalConsumption > 0 ? emissions_total / totalConsumption : 0.5;

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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </div>

        {/* Factor de carga */}
        <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">
              Factor de Carga
            </h3>
            <div className="flex items-center">
              {loadFactor >= 50 ? (
                <span className="text-green-500 text-sm">✓ Eficiente</span>
              ) : (
                <span className="text-yellow-500 text-sm">⚠ Mejorable</span>
              )}
            </div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">
              {loadFactor.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              {loadFactor >= 50
                ? "Uso eficiente de la infraestructura"
                : "Oportunidad de mejora disponible"}
            </p>
          </div>
        </div>

        {/* Emisiones de CO2 */}
        <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">
              Emisiones CO₂
            </h3>
            {!isFixedMode && emissions_reduction > 0 && (
              <div className="flex items-center text-green-500">
                <span className="mr-1">▼</span>
                <span className="text-sm">
                  {emissions_reduction.toFixed(1)} kg
                </span>
              </div>
            )}
          </div>
          <div className="mt-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">
              {emissions_total.toFixed(1)} kg
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Emisiones totales diarias
              {hasMonteCarlo && emissions_reduction_confidence && (
                <span className="ml-1 text-blue-500">
                  ±{emissions_reduction_confidence.toFixed(1)}
                </span>
              )}
            </p>
            <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Factor: {emissionFactor.toFixed(2)} kg CO₂/kWh
            </div>
          </div>
        </div>

        {/* Costo energético */}
        <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">
              Costo Energético
            </h3>
            {!isFixedMode && dailySavings > 0 && (
              <div className="flex items-center text-green-500">
                <span className="mr-1">💰</span>
                <span className="text-sm">${dailySavings.toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="mt-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">
              ${actualEnergyCost.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Costo diario de energía
            </p>
            {!isFixedMode && dailySavings > 0 && (
              <div className="mt-1 space-y-1">
                <div className="text-xs text-green-600 dark:text-green-400">
                  Ahorro mensual: ${monthlySavings.toFixed(2)}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Ahorro anual: ${yearlySavings.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Consumo total */}
        <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">
              Consumo Total
            </h3>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">
              {totalConsumption.toFixed(1)} kWh
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Energía consumida (24h)
            </p>
            <div className="mt-1 grid grid-cols-2 gap-1 text-xs">
              <div className="text-gray-400 dark:text-gray-500">
                Semanal: {(totalConsumption * 7).toFixed(0)} kWh
              </div>
              <div className="text-gray-400 dark:text-gray-500">
                Mensual: {(totalConsumption * 30).toFixed(0)} kWh
              </div>
            </div>
          </div>
        </div>
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

      {/* Resumen de estrategia */}
      <div className="mt-6 bg-gray-100 p-4 rounded-lg dark:bg-gray-700">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
          Estrategia Actual:{" "}
          {strategy === "fixed"
            ? "Consumo Fijo"
            : strategy === "demand_response"
            ? "Respuesta a la Demanda"
            : strategy === "smart_grid"
            ? "Red Inteligente"
            : strategy}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {strategy === "fixed" &&
            "Sin optimización de consumo. La demanda se mantiene constante independientemente de las condiciones de la red."}
          {strategy === "demand_response" &&
            "Los consumidores ajustan su demanda en respuesta a señales de precio dinámicas, reduciendo el consumo durante picos de alta demanda."}
          {strategy === "smart_grid" &&
            "Sistema avanzado que incluye almacenamiento de energía, generación renovable y gestión inteligente de la demanda para optimizar la eficiencia del sistema."}
        </p>
      </div>
    </div>
  );
}
