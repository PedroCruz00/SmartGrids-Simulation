import { useState, useEffect } from "react";

export default function SimulationForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    homes: 50,
    businesses: 20,
    industries: 10,
    simulation_hours: 24,
    monte_carlo_samples: 1,
    strategy: "fixed",
    start_hour: 8,
    day_type: "weekday",
  });

  // Efecto para resetear Monte Carlo cuando se cambia a "fixed"
  useEffect(() => {
    if (formData.strategy === "fixed" && formData.monte_carlo_samples > 1) {
      setFormData((prev) => ({
        ...prev,
        monte_carlo_samples: 1,
      }));
    }
  }, [formData.strategy]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === "number" ? parseInt(value, 10) : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Asegurar que Consumo Fijo siempre use 1 muestra
    const submitData = {
      ...formData,
      monte_carlo_samples:
        formData.strategy === "fixed" ? 1 : formData.monte_carlo_samples,
    };

    onSubmit(submitData);
  };

  // Mostrar la sección de Monte Carlo solo si NO está en modo fixed
  const showMonteCarloOptions = formData.strategy !== "fixed";

  // Función para obtener información de la estrategia
  const getStrategyInfo = (strategy) => {
    switch (strategy) {
      case "fixed":
        return {
          description: "Sin ajustes de consumo (línea base)",
          icon: "📊",
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-700",
          borderColor: "border-gray-200 dark:border-gray-600",
        };
      case "demand_response":
        return {
          description: "Ajusta consumo según precios dinámicos",
          icon: "⚡",
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-900/30",
          borderColor: "border-blue-200 dark:border-blue-700",
        };
      case "smart_grid":
        return {
          description: "Incluye almacenamiento y renovables",
          icon: "🔋",
          color: "text-purple-600 dark:text-purple-400",
          bgColor: "bg-purple-50 dark:bg-purple-900/30",
          borderColor: "border-purple-200 dark:border-purple-700",
        };
      default:
        return {
          description: "Estrategia personalizada",
          icon: "⚙️",
          color: "text-indigo-600 dark:text-indigo-400",
          bgColor: "bg-indigo-50 dark:bg-indigo-900/30",
          borderColor: "border-indigo-200 dark:border-indigo-700",
        };
    }
  };

  const strategyInfo = getStrategyInfo(formData.strategy);

  // Función para calcular el tiempo total de simulación estimado
  const getEstimatedTime = () => {
    const baseTime = formData.simulation_hours * 0.1; // segundos por hora
    const monteCarloMultiplier = formData.monte_carlo_samples;
    const totalTime = baseTime * monteCarloMultiplier;

    if (totalTime < 1) return "< 1 segundo";
    if (totalTime < 60) return `~${Math.ceil(totalTime)} segundos`;
    return `~${Math.ceil(totalTime / 60)} minutos`;
  };

  return (
    <div className="px-6 py-6">
      {/* Header del formulario */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Configuración de la Simulación
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Configure los parámetros para la simulación de la red eléctrica
          inteligente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sección de Entidades */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center mb-4">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Entidades de Consumo
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Defina el número de consumidores por tipo
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <label
                htmlFor="homes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                🏠 Hogares
              </label>
              <input
                type="number"
                name="homes"
                id="homes"
                min="1"
                max="1000"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.homes}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Consumo residencial (1-1000)
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <label
                htmlFor="businesses"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                🏢 Comercios
              </label>
              <input
                type="number"
                name="businesses"
                id="businesses"
                min="1"
                max="500"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.businesses}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Establecimientos comerciales (1-500)
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <label
                htmlFor="industries"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                🏭 Industrias
              </label>
              <input
                type="number"
                name="industries"
                id="industries"
                min="1"
                max="200"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.industries}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Plantas industriales (1-200)
              </p>
            </div>
          </div>

          {/* Resumen de entidades */}
          <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                Total de entidades:
              </span>
              <span className="text-blue-900 dark:text-blue-100 font-bold">
                {formData.homes + formData.businesses + formData.industries}
              </span>
            </div>
          </div>
        </div>

        {/* Sección de Configuración Temporal */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center mb-4">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Configuración Temporal
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Defina el período y condiciones de simulación
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <label
                htmlFor="simulation_hours"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                ⏱️ Duración (horas)
              </label>
              <input
                type="number"
                name="simulation_hours"
                id="simulation_hours"
                min="1"
                max="168"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.simulation_hours}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.simulation_hours === 24 && "1 día"}
                {formData.simulation_hours === 168 && "1 semana"}
                {formData.simulation_hours !== 24 &&
                  formData.simulation_hours !== 168 &&
                  `${Math.floor(formData.simulation_hours / 24)} días, ${
                    formData.simulation_hours % 24
                  } horas`}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <label
                htmlFor="start_hour"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                🕐 Hora de Inicio
              </label>
              <select
                name="start_hour"
                id="start_hour"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.start_hour}
                onChange={handleChange}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}:00
                    {i === 0 && " (Medianoche)"}
                    {i === 6 && " (Madrugada)"}
                    {i === 8 && " (Mañana)"}
                    {i === 12 && " (Mediodía)"}
                    {i === 18 && " (Tarde)"}
                    {i === 22 && " (Noche)"}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Hora del día para iniciar (0-23)
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <label
                htmlFor="day_type"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                📅 Tipo de Día
              </label>
              <select
                id="day_type"
                name="day_type"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.day_type}
                onChange={handleChange}
              >
                <option value="weekday">Día Laboral</option>
                <option value="weekend">Fin de Semana</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.day_type === "weekday"
                  ? "Lun-Vie: Picos matutinos y vespertinos"
                  : "Sáb-Dom: Patrones de consumo más uniformes"}
              </p>
            </div>
          </div>
        </div>

        {/* Sección de Estrategia */}
        <div
          className={`p-6 rounded-lg border ${strategyInfo.bgColor} ${strategyInfo.borderColor}`}
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
              <span className="text-xl">{strategyInfo.icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Estrategia de Gestión
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seleccione el método de optimización energética
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <label
                htmlFor="strategy"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
              >
                Estrategia de Demanda
              </label>

              <div className="space-y-3">
                {[
                  {
                    value: "fixed",
                    label: "Consumo Fijo",
                    description: "Sin ajustes de consumo (línea base)",
                    icon: "📊",
                    features: [
                      "Patrón de demanda natural",
                      "Sin optimización",
                      "Referencia para comparación",
                    ],
                  },
                  {
                    value: "demand_response",
                    label: "Respuesta a la Demanda",
                    description: "Ajusta consumo según precios dinámicos",
                    icon: "⚡",
                    features: [
                      "Precios dinámicos",
                      "Elasticidad de demanda",
                      "Reducción 10-20%",
                    ],
                  },
                  {
                    value: "smart_grid",
                    label: "Red Inteligente",
                    description: "Incluye almacenamiento y renovables",
                    icon: "🔋",
                    features: [
                      "Almacenamiento de energía",
                      "Generación renovable",
                      "Reducción 15-30%",
                    ],
                  },
                ].map((option) => (
                  <div
                    key={option.value}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.strategy === option.value
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                    onClick={() =>
                      handleChange({
                        target: { name: "strategy", value: option.value },
                      })
                    }
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id={option.value}
                        name="strategy"
                        value={option.value}
                        checked={formData.strategy === option.value}
                        onChange={handleChange}
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{option.icon}</span>
                          <label
                            htmlFor={option.value}
                            className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                          >
                            {option.label}
                          </label>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {option.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {option.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuración Monte Carlo */}
            {showMonteCarloOptions && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <label
                  htmlFor="monte_carlo_samples"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
                >
                  🎲 Análisis Monte Carlo
                </label>
                <select
                  id="monte_carlo_samples"
                  name="monte_carlo_samples"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.monte_carlo_samples}
                  onChange={handleChange}
                >
                  <option value="1">1 muestra (Sin Monte Carlo)</option>
                  <option value="10">10 muestras (Análisis básico)</option>
                  <option value="50">50 muestras (Análisis detallado)</option>
                  <option value="100">
                    100 muestras (Análisis exhaustivo)
                  </option>
                </select>
                <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Monte Carlo:</strong> Ejecuta múltiples simulaciones
                    con condiciones iniciales aleatorias para cuantificar la
                    incertidumbre y obtener intervalos de confianza
                    estadísticos.
                    {formData.monte_carlo_samples > 1 && (
                      <span className="block mt-1">
                        <strong>Tiempo estimado:</strong> {getEstimatedTime()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Información sobre Consumo Fijo */}
            {formData.strategy === "fixed" && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Línea Base:</strong> El Consumo Fijo representa el
                      escenario sin optimizaciones. Se usa como referencia para
                      comparar el impacto de las estrategias inteligentes.
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Monte Carlo está deshabilitado para mantener la
                      consistencia de la referencia.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resumen de configuración y botón de envío */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Resumen de Configuración
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verifique los parámetros antes de ejecutar
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Tiempo estimado
              </div>
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {getEstimatedTime()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Entidades
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {formData.homes + formData.businesses + formData.industries}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Duración
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {formData.simulation_hours}h
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Estrategia
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {strategyInfo.icon}{" "}
                {formData.strategy === "fixed"
                  ? "Fijo"
                  : formData.strategy === "demand_response"
                  ? "DR"
                  : "Smart"}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Muestras
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {formData.monte_carlo_samples}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Ejecutar Simulación
          </button>
        </div>
      </form>
    </div>
  );
}
