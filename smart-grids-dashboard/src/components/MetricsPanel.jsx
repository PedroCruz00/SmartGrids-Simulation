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
        bgColor: "bg-gray-100 dark:bg-gray-700",
        description: "Sin optimización aplicada",
      };
    } else {
      // Solo para estrategias con optimización
      if (loadFactor >= 60) {
        return {
          status: "excellent",
          text: "Excelente",
          color: "text-green-700 dark:text-green-300",
          bgColor: "bg-green-100 dark:bg-green-800",
          description: "Uso muy eficiente",
        };
      } else if (loadFactor >= 50) {
        return {
          status: "good",
          text: "Bueno",
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-900",
          description: "Uso eficiente",
        };
      } else if (loadFactor >= 40) {
        return {
          status: "fair",
          text: "Regular",
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-50 dark:bg-yellow-900",
          description: "Margen de mejora",
        };
      } else {
        return {
          status: "poor",
          text: "Mejorable",
          color: "text-orange-600 dark:text-orange-400",
          bgColor: "bg-orange-50 dark:bg-orange-900",
          description: "Necesita optimización",
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

  // Función para obtener el color de la estrategia
  const getStrategyColor = () => {
    switch (strategy) {
      case "fixed":
        return "text-gray-600 dark:text-gray-400";
      case "demand_response":
        return "text-blue-600 dark:text-blue-400";
      case "smart_grid":
        return "text-purple-600 dark:text-purple-400";
      default:
        return "text-indigo-600 dark:text-indigo-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con información de la estrategia */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Resultados de la Simulación
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Análisis detallado del rendimiento energético
          </p>
        </div>
        <div className="text-right">
          <div className={`text-lg font-semibold ${getStrategyColor()}`}>
            {getStrategyDisplayName()}
          </div>
          {hasMonteCarlo && (
            <div className="text-sm text-purple-600 dark:text-purple-400">
              Monte Carlo: {monte_carlo_samples} muestras
            </div>
          )}
        </div>
      </div>

      {/* Métricas principales - Grid mejorado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Demanda Pico */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 rounded-lg border border-blue-200 dark:border-blue-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-white"
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
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Demanda Pico
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Máximo consumo
                </p>
              </div>
            </div>
            {!isFixedMode && peakReduction > 0 && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <svg
                  className="w-4 h-4 mr-1"
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
                <span className="text-sm font-semibold">
                  {peakReduction.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {peak_demand_dr.toFixed(1)} kW
            </div>

            {!isFixedMode && peak_demand_fixed && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span className="line-through">
                  {peak_demand_fixed.toFixed(1)} kW
                </span>
                <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                  -{(peak_demand_fixed - peak_demand_dr).toFixed(1)} kW
                </span>
              </div>
            )}

            {hasMonteCarlo && peak_demand_confidence && (
              <div className="text-xs text-blue-600 dark:text-blue-400">
                IC 95%: ±{peak_demand_confidence.toFixed(1)} kW
              </div>
            )}
          </div>
        </div>

        {/* Demanda Promedio */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-5 rounded-lg border border-green-200 dark:border-green-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-white"
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
                <h3 className="text-sm font-medium text-green-900 dark:text-green-100">
                  Demanda Promedio
                </h3>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Consumo medio
                </p>
              </div>
            </div>
            {!isFixedMode && avgReduction > 0 && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <svg
                  className="w-4 h-4 mr-1"
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
                <span className="text-sm font-semibold">
                  {avgReduction.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {avg_demand_dr.toFixed(1)} kW
            </div>

            {!isFixedMode && avg_demand_fixed && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span className="line-through">
                  {avg_demand_fixed.toFixed(1)} kW
                </span>
                <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                  -{(avg_demand_fixed - avg_demand_dr).toFixed(1)} kW
                </span>
              </div>
            )}

            {hasMonteCarlo && avg_demand_confidence && (
              <div className="text-xs text-green-600 dark:text-green-400">
                IC 95%: ±{avg_demand_confidence.toFixed(1)} kW
              </div>
            )}
          </div>
        </div>

        {/* Factor de Carga */}
        <div
          className={`p-5 rounded-lg border ${efficiencyStatus.bgColor} border-gray-200 dark:border-gray-600`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Factor de Carga
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  Eficiencia del sistema
                </p>
              </div>
            </div>
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${efficiencyStatus.color} ${efficiencyStatus.bgColor}`}
            >
              {efficiencyStatus.text}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {loadFactor.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {efficiencyStatus.description}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Promedio / Pico = {(avg_demand_dr / peak_demand_dr).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Consumo Total */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-5 rounded-lg border border-orange-200 dark:border-orange-700/50">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Consumo Total
              </h3>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                Energía consumida (24h)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalConsumption.toFixed(0)} kWh
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 dark:text-gray-400">
              <div>Semanal: {(totalConsumption * 7).toFixed(0)} kWh</div>
              <div>Mensual: {(totalConsumption * 30).toFixed(0)} kWh</div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Impacto Ambiental */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
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
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Impacto Ambiental
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Emisiones de CO₂ y sostenibilidad
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Emisiones totales
                </span>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {emissions_total.toFixed(1)} kg CO₂
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Factor: {emissionFactor.toFixed(3)} kg/kWh
                </div>
              </div>
            </div>

            {!isFixedMode && emissions_reduction > 0 && (
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                <div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Reducción de emisiones
                  </span>
                  <div className="text-xl font-bold text-green-900 dark:text-green-100">
                    -{emissions_reduction.toFixed(1)} kg CO₂
                  </div>
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            )}

            {hasMonteCarlo && emissions_reduction_confidence && (
              <div className="text-xs text-blue-600 dark:text-blue-400 text-center">
                Intervalo de confianza: ±
                {emissions_reduction_confidence.toFixed(1)} kg CO₂
              </div>
            )}
          </div>
        </div>

        {/* Impacto Económico */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Impacto Económico
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Costos y ahorros energéticos
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Costo energético diario
                </span>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  ${actualEnergyCost.toFixed(2)}
                </div>
              </div>
            </div>

            {!isFixedMode && dailySavings > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                  <div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Ahorro diario
                    </span>
                    <div className="text-xl font-bold text-green-900 dark:text-green-100">
                      ${dailySavings.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <svg
                      className="w-5 h-5 mr-1"
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Ahorro mensual
                    </div>
                    <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      ${monthlySavings.toFixed(0)}
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-center">
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      Ahorro anual
                    </div>
                    <div className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                      ${yearlySavings.toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="space-y-4">
        {/* Monte Carlo info */}
        {hasMonteCarlo && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2"
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
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Análisis Monte Carlo
              </h3>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Se ejecutaron {monte_carlo_samples} simulaciones con diferentes
              condiciones iniciales. Los intervalos de confianza (±) muestran la
              variabilidad al 95% de confianza, proporcionando una medida de la
              incertidumbre en los resultados.
            </p>
          </div>
        )}

        {/* Solo en modo fijo: Potencial de mejora */}
        {isFixedMode && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center mb-3">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
                Potencial de Optimización
              </h3>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
              Este es el escenario base sin optimizaciones. Implementando
              estrategias inteligentes, podrías obtener:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white dark:bg-green-800/30 p-3 rounded-lg shadow-sm">
                <div className="text-green-600 dark:text-green-200 font-semibold text-sm">
                  Respuesta a la Demanda
                </div>
                <div className="text-lg font-bold text-green-700 dark:text-green-100">
                  10-20% reducción de pico
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Precios dinámicos + elasticidad
                </div>
              </div>
              <div className="bg-white dark:bg-green-800/30 p-3 rounded-lg shadow-sm">
                <div className="text-green-600 dark:text-green-200 font-semibold text-sm">
                  Red Inteligente
                </div>
                <div className="text-lg font-bold text-green-700 dark:text-green-100">
                  15-30% reducción de pico
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Almacenamiento + renovables + gestión
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-green-600 dark:text-green-400 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Prueba las otras estrategias para ver el impacto real en tu
              configuración
            </div>
          </div>
        )}

        {/* Solo para estrategias optimizadas: Resumen de beneficios */}
        {!isFixedMode && (peakReduction > 0 || avgReduction > 0) && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="flex items-center mb-3">
              <svg
                className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                Beneficios Obtenidos con {getStrategyDisplayName()}
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {peakReduction > 0 && (
                <div className="text-center p-3 bg-white dark:bg-purple-800/30 rounded-lg">
                  <div className="text-purple-600 dark:text-purple-300 font-bold text-lg">
                    {peakReduction.toFixed(1)}%
                  </div>
                  <div className="text-purple-700 dark:text-purple-400 text-sm">
                    Reducción de pico
                  </div>
                </div>
              )}
              {avgReduction > 0 && (
                <div className="text-center p-3 bg-white dark:bg-purple-800/30 rounded-lg">
                  <div className="text-purple-600 dark:text-purple-300 font-bold text-lg">
                    {avgReduction.toFixed(1)}%
                  </div>
                  <div className="text-purple-700 dark:text-purple-400 text-sm">
                    Reducción promedio
                  </div>
                </div>
              )}
              {dailySavings > 0 && (
                <div className="text-center p-3 bg-white dark:bg-purple-800/30 rounded-lg">
                  <div className="text-purple-600 dark:text-purple-300 font-bold text-lg">
                    ${dailySavings.toFixed(0)}
                  </div>
                  <div className="text-purple-700 dark:text-purple-400 text-sm">
                    Ahorro diario
                  </div>
                </div>
              )}
              {emissions_reduction > 0 && (
                <div className="text-center p-3 bg-white dark:bg-purple-800/30 rounded-lg">
                  <div className="text-purple-600 dark:text-purple-300 font-bold text-lg">
                    {emissions_reduction.toFixed(0)} kg
                  </div>
                  <div className="text-purple-700 dark:text-purple-400 text-sm">
                    Menos CO₂
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
