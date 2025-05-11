import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";

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

    // Usar el método correcto para navegadores modernos
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Fallback para navegadores más antiguos
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Aplicar clase dark al documentElement cuando cambia el modo
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  // Función para cambiar el tema
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`App min-h-screen ${darkMode ? "dark" : ""}`}>
      {/* Botón para cambiar tema - con estilos actualizados */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors z-50 shadow-lg"
        aria-label="Cambiar tema"
      >
        {darkMode ? (
          // Ícono de sol para modo oscuro
          <span className="text-yellow-500 text-lg">☀️</span>
        ) : (
          // Ícono de luna para modo claro
          <span className="text-gray-700 text-lg">🌙</span>
        )}
      </button>

      {/* Dashboard principal */}
      <Dashboard />
    </div>
  );
}

export default App;
