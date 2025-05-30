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

  return (
    <div className="bg-white shadow rounded-lg dark:bg-gray-800">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Configuración de la Simulación
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Configuración de entidades */}
            <div className="col-span-1">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Entidades
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="homes"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Número de Hogares
                  </label>
                  <input
                    type="number"
                    name="homes"
                    id="homes"
                    min="1"
                    max="1000"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.homes}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label
                    htmlFor="businesses"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Número de Comercios
                  </label>
                  <input
                    type="number"
                    name="businesses"
                    id="businesses"
                    min="1"
                    max="500"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.businesses}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label
                    htmlFor="industries"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Número de Industrias
                  </label>
                  <input
                    type="number"
                    name="industries"
                    id="industries"
                    min="1"
                    max="200"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.industries}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Configuración de tiempo */}
            <div className="col-span-1">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiempo
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="simulation_hours"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Horas de Simulación
                  </label>
                  <input
                    type="number"
                    name="simulation_hours"
                    id="simulation_hours"
                    min="1"
                    max="168"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.simulation_hours}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label
                    htmlFor="start_hour"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Hora de Inicio (0-23)
                  </label>
                  <input
                    type="number"
                    name="start_hour"
                    id="start_hour"
                    min="0"
                    max="23"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.start_hour}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label
                    htmlFor="day_type"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Tipo de Día
                  </label>
                  <select
                    id="day_type"
                    name="day_type"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.day_type}
                    onChange={handleChange}
                  >
                    <option value="weekday">Día Laboral</option>
                    <option value="weekend">Fin de Semana</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Estrategia y opciones avanzadas */}
            <div className="col-span-1">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estrategia de Simulación
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="strategy"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Estrategia de Demanda
                  </label>
                  <select
                    id="strategy"
                    name="strategy"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.strategy}
                    onChange={handleChange}
                  >
                    <option value="fixed">Consumo Fijo</option>
                    <option value="demand_response">
                      Respuesta a la Demanda
                    </option>
                    <option value="smart_grid">Red Inteligente</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formData.strategy === "fixed" &&
                      "Sin ajustes de consumo (línea base)"}
                    {formData.strategy === "demand_response" &&
                      "Ajusta consumo según precios dinámicos"}
                    {formData.strategy === "smart_grid" &&
                      "Incluye almacenamiento y renovables"}
                  </p>
                </div>

                {showMonteCarloOptions && (
                  <div>
                    <label
                      htmlFor="monte_carlo_samples"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Muestras Monte Carlo
                    </label>
                    <select
                      id="monte_carlo_samples"
                      name="monte_carlo_samples"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.monte_carlo_samples}
                      onChange={handleChange}
                    >
                      <option value="1">1 (Sin Monte Carlo)</option>
                      <option value="10">10 muestras</option>
                      <option value="50">50 muestras</option>
                      <option value="100">100 muestras</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Más muestras = mayor precisión, pero mayor tiempo de
                      cálculo
                    </p>
                  </div>
                )}

                {/* Información sobre Consumo Fijo */}
                {formData.strategy === "fixed" && (
                  <div className="bg-gray-50 p-3 rounded-md dark:bg-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <strong>Nota:</strong> El Consumo Fijo representa el
                      escenario base sin optimizaciones. Se usa como referencia
                      para comparar con otras estrategias.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ejecutar Simulación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
