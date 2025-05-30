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
    !isFixedMode && peak_demand_fixed && peak_demand_dr && peak_demand_fixed > 0
      ? ((peak_demand_fixed - peak_demand_dr) / peak_demand_fixed) * 100
      : 0;

  // Calcular el porcentaje de reducción de demanda promedio con protección contra NaN
  const avgReduction =
    !isFixedMode && avg_demand_fixed && avg_demand_dr && avg_demand_fixed > 0
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

  // Función para determinar el estado de eficiencia
  const getEfficiencyStatus = () => {
    if (isFixedMode) {
      return {
        status: "baseline",
        text: "Línea Base",
        color: "text-gray-500",
        description: "Sin optimización aplicada",
      };
    } else {
      // Solo para estrategias con optimización
      if (loadFactor >= 60) {
        return {
          status: "excellent",
          text: "Excelente",
          color: "text-green-600",
          description: "Uso muy eficiente de la infraestructura",
        };
      } else if (loadFactor >= 50) {
        return {
          status: "good",
          text: "Bueno",
          color: "text-green-500",
          description: "Uso eficiente de la infraestructura",
        };
      } else if (loadFactor >= 40) {
        return {
          status: "fair",
          text: "Regular",
          color: "text-yellow-500",
          description: "Hay espacio para mejora",
        };
      } else {
        return {
          status: "poor",
          text: "Mejorable",
          color: "text-orange-500",
          description: "Oportunidad significativa de mejora",
        };
      }
    }
  };

  const efficiencyStatus = getEfficiencyStatus();

  // Función para obtener el nombre de la estrategia
  const getStrategyDisplayName = () => {
    switch (strategy) {
      case "fixed":
        return "Consumo Fijo";
      case "demand_response":
        return "Respuesta a la Demanda";
      case "smart_grid":
        return "Red Inteligente";
      default:
        return "Estrategia Personalizada";
    }
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Resultados de la Simulación
        <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
          ({getStrategyDisplayName()})
        </span>
        {hasMonteCarlo && (
          <span className="ml-2 text-sm font-normal text-purple-600 dark:text-purple-400">
            - Monte Carlo: {monte_carlo_samples} muestras
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
                <span className="text-sm font-semibold">
                  {peakReduction.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-between items-end">
            <div>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {peak_demand_dr.toFixed(1)} kW
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {isFixedMode
                  ? "Demanda máxima base"
                  : `Con ${getStrategyDisplayName()}`}
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
                <span className="text-sm font-semibold">
                  {avgReduction.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-between items-end">
            <div>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {avg_demand_dr.toFixed(1)} kW
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {isFixedMode
                  ? "Consumo medio base"
                  : `Con ${getStrategyDisplayName()}`}
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

        {/* Factor de carga mejorado */}
        <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">
              Factor de Carga
            </h3>
            <div className={`flex items-center ${efficiencyStatus.color}`}>
              <span className="text-sm font-medium">
                {efficiencyStatus.text}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">
              {loadFactor.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              {efficiencyStatus.description}
            </p>
            {!isFixedMode && (
              <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Promedio / Pico ratio
              </div>
            )}
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
                <span className="mr-1">🌱</span>
                <span className="text-sm font-semibold">
                  -{emissions_reduction.toFixed(1)} kg
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
              Factor: {emissionFactor.toFixed(3)} kg CO₂/kWh
            </div>
          </div>
        </div>

        {/* Costo energético mejorado */}
        <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">
              Costo Energético
            </h3>
            {!isFixedMode && dailySavings > 0 && (
              <div className="flex items-center text-green-500">
                <span className="mr-1">💰</span>
                <span className="text-sm font-semibold">
                  ${dailySavings.toFixed(2)}
                </span>
              </div>
            )}
          </div>
          <div className="mt-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">
              ${actualEnergyCost.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              {isFixedMode ? "Costo diario base" : "Costo diario optimizado"}
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
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
            📊 Análisis Monte Carlo
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Se ejecutaron {monte_carlo_samples} simulaciones con diferentes
            condiciones iniciales. Los intervalos de confianza (±) muestran la
            variabilidad al 95% de nivel de confianza, proporcionando una medida
            de la incertidumbre en los resultados.
          </p>
        </div>
      )}

      {/* Solo en modo fijo: Potencial de mejora */}
      {isFixedMode && (
        <div className="mt-6 bg-green-50 p-4 rounded-lg dark:bg-green-900">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2 flex items-center">
            🎯 Potencial de Optimización
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300 mb-3">
            Este es el escenario base sin optimizaciones. Implementando
            estrategias inteligentes, podrías obtener:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded shadow-sm dark:bg-green-800">
              <div className="text-green-600 dark:text-green-200 font-medium text-sm">
                Respuesta a la Demanda
              </div>
              <div className="text-lg font-bold text-green-700 dark:text-green-100">
                10-20% reducción de pico
              </div>
            </div>
            <div className="bg-white p-3 rounded shadow-sm dark:bg-green-800">
              <div className="text-green-600 dark:text-green-200 font-medium text-sm">
                Red Inteligente
              </div>
              <div className="text-lg font-bold text-green-700 dark:text-green-100">
                15-30% reducción de pico
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-green-600 dark:text-green-400">
            💡 Tip: Prueba las otras estrategias para ver el impacto real en tu
            configuración
          </div>
        </div>
      )}

      {/* Solo para estrategias optimizadas: Resumen de beneficios */}
      {!isFixedMode && (peakReduction > 0 || avgReduction > 0) && (
        <div className="mt-6 bg-purple-50 p-4 rounded-lg dark:bg-purple-900">
          <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2 flex items-center">
            🚀 Beneficios Obtenidos
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {peakReduction > 0 && (
              <div className="text-center">
                <div className="text-purple-600 dark:text-purple-300 font-semibold text-lg">
                  {peakReduction.toFixed(1)}%
                </div>
                <div className="text-purple-700 dark:text-purple-400">
                  Reducción de pico
                </div>
              </div>
            )}
            {avgReduction > 0 && (
              <div className="text-center">
                <div className="text-purple-600 dark:text-purple-300 font-semibold text-lg">
                  {avgReduction.toFixed(1)}%
                </div>
                <div className="text-purple-700 dark:text-purple-400">
                  Reducción promedio
                </div>
              </div>
            )}
            {dailySavings > 0 && (
              <div className="text-center">
                <div className="text-purple-600 dark:text-purple-300 font-semibold text-lg">
                  ${dailySavings.toFixed(0)}
                </div>
                <div className="text-purple-700 dark:text-purple-400">
                  Ahorro diario
                </div>
              </div>
            )}
            {emissions_reduction > 0 && (
              <div className="text-center">
                <div className="text-purple-600 dark:text-purple-300 font-semibold text-lg">
                  {emissions_reduction.toFixed(0)} kg
                </div>
                <div className="text-purple-700 dark:text-purple-400">
                  Menos CO₂
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
