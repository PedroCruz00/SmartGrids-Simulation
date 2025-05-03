import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import { getMockData } from "./api/SimulationService";

/**
 * Componente principal de la aplicación
 */
function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Detectar preferencia de tema del sistema
  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setDarkMode(true);
    }

    // Escuchar cambios en la preferencia del tema
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Aplicar clase dark al html cuando cambia el modo
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Función para cambiar el tema
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="App">
      {/* Botón para cambiar tema */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 z-10"
        aria-label="Cambiar tema"
      >
        {darkMode ? (
          // Ícono de sol para modo oscuro
          <span className="text-yellow-400">☀️</span>
        ) : (
          // Ícono de luna para modo claro
          <span className="text-gray-700">🌙</span>
        )}
      </button>

      {/* Dashboard principal */}
      <Dashboard />
    </div>
  );
}

export default App;
