import { useState } from "react";

export default function SimulationForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    homes: 50,
    businesses: 20,
    industries: 10,
    simulationHours: 24,
    strategy: "fixed",
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? parseInt(value, 10) : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white shadow rounded-lg dark:bg-gray-800">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Configuración de la Simulación
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

            <div>
              <label
                htmlFor="simulationHours"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Horas de Simulación
              </label>
              <input
                type="number"
                name="simulationHours"
                id="simulationHours"
                min="1"
                max="168"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.simulationHours}
                onChange={handleChange}
              />
            </div>

            <div>
              <label
                htmlFor="strategy"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Estrategia
              </label>
              <select
                id="strategy"
                name="strategy"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.strategy}
                onChange={handleChange}
              >
                <option value="fixed">Consumo Fijo</option>
                <option value="demand_response">Respuesta a la Demanda</option>
              </select>
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
