# Smart Grids Simulation - Dashboard

Panel de control web interactivo para simulación y visualización de redes eléctricas inteligentes con análisis avanzado de demanda energética.

## 🚀 Características

### Visualizaciones Avanzadas

- **📊 Gráficos Interactivos**: Comparativa de demanda con intervalos de confianza
- **🌐 Red Interactiva**: Visualización D3.js de la topología de red eléctrica
- **📈 Métricas en Tiempo Real**: Panel de control con estadísticas clave
- **🎨 Modo Oscuro**: Interfaz adaptable con detección automática de preferencias

### Funcionalidades de Simulación

- **⚙️ Configuración Flexible**: Parámetros ajustables para entidades y tiempo
- **🎲 Monte Carlo**: Soporte para simulaciones estadísticas múltiples
- **📋 Estrategias**: Comparación entre consumo fijo, respuesta a demanda y red inteligente
- **📱 Responsivo**: Interfaz optimizada para desktop y móvil

## 🛠️ Tecnologías

- **React 19.1**: Framework de interfaz de usuario moderno
- **Tailwind CSS 3.4**: Framework de CSS utilitario
- **Recharts 2.15**: Biblioteca de gráficos para React
- **D3.js 7.9**: Visualización de datos avanzada
- **Vite/Create React App**: Herramientas de desarrollo

## 📦 Instalación

### Prerrequisitos

- Node.js 16.0 o superior
- npm 8.0 o superior (incluido con Node.js)

### Configuración del Proyecto

```bash
# Clonar el repositorio
git clone <repository-url>
cd smart-grids-dashboard

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

### Dependencias Principales

```json
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "tailwindcss": "^3.4.17",
  "recharts": "^2.15.3",
  "d3": "^7.9.0"
}
```

## 🚀 Scripts Disponibles

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm start
# Accesible en http://localhost:3000

# Ejecutar tests
npm test

# Compilar para producción
npm run build

# Eject configuración (no recomendado)
npm run eject
```

### Verificación

```bash
# Verificar sintaxis y estilo
npm run lint

# Formatear código
npm run format

# Analizar bundle
npm run analyze
```

## 🏗️ Estructura del Proyecto

```
smart-grids-dashboard/
├── public/
│   ├── index.html           # Plantilla HTML principal
│   └── manifest.json        # Configuración PWA
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── DemandChart.jsx     # Gráfico de demanda energética
│   │   ├── MetricsPanel.jsx    # Panel de métricas
│   │   ├── NodeNetwork.jsx     # Visualización de red D3.js
│   │   ├── SimulationForm.jsx  # Formulario de configuración
│   │   └── Loader.jsx          # Indicador de carga
│   ├── pages/
│   │   └── Dashboard.jsx       # Página principal
│   ├── api/
│   │   └── SimulationService.jsx # Cliente API
│   ├── styles/
│   │   └── globals.css         # Estilos globales
│   ├── App.js               # Componente raíz
│   └── index.js             # Punto de entrada
├── tailwind.config.js       # Configuración Tailwind
└── package.json             # Dependencias y scripts
```

## 🎨 Componentes Principales

### `Dashboard.jsx`
Componente principal que orquesta toda la aplicación:
- Gestión de estado global
- Procesamiento de datos de la API
- Coordinación entre componentes

### `SimulationForm.jsx`
Formulario de configuración de simulaciones:
```jsx
const [formData, setFormData] = useState({
  homes: 50,
  businesses: 20,
  industries: 10,
  simulation_hours: 24,
  monte_carlo_samples: 1,
  strategy: "fixed",
  start_hour: 8,
  day_type: "weekday"
});
```

### `DemandChart.jsx`
Gráfico interactivo con Recharts:
- Comparación entre consumo fijo y optimizado
- Intervalos de confianza para Monte Carlo
- Precios dinámicos en eje secundario

### `NodeNetwork.jsx`
Visualización de red con D3.js:
- Topología interactiva de la red eléctrica
- Nodos escalados por consumo energético
- Múltiples layouts (radial, sectorial, fuerzas)

### `MetricsPanel.jsx`
Panel de métricas con estadísticas:
- Demanda pico y promedio
- Reducciones porcentuales
- Intervalos de confianza Monte Carlo
- Emisiones y costos estimados

## 🔧 Configuración

### Variables de Entorno

```bash
# URL del backend (opcional)
REACT_APP_API_URL=http://localhost:8000

# Configuración de build
GENERATE_SOURCEMAP=false
```

### Tailwind CSS

```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {}
  },
  plugins: []
};
```

### Configuración del API

```javascript
// src/api/SimulationService.jsx
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const runSimulation = async (params) => {
  const response = await fetch(`${API_URL}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  return await response.json();
};
```

## 🎯 Funcionalidades de Usuario

### Configuración de Simulación

1. **Entidades**:
   - Número de hogares (1-1000)
   - Número de comercios (1-500)
   - Número de industrias (1-200)

2. **Tiempo**:
   - Horas de simulación (1-168)
   - Hora de inicio (0-23)
   - Tipo de día (laboral/fin de semana)

3. **Estrategia**:
   - Consumo fijo
   - Respuesta a la demanda
   - Red inteligente

4. **Monte Carlo**:
   - 1, 10, 50 o 100 muestras

### Visualizaciones

#### Gráfico de Demanda
- **Línea azul**: Consumo fijo de referencia
- **Línea verde**: Demanda con optimización
- **Área sombreada**: Intervalos de confianza (95%)
- **Línea naranja**: Precios dinámicos (eje derecho)

#### Red Interactiva
- **Estrella azul**: Centro de distribución
- **Círculos verdes**: Hogares residenciales
- **Cuadrados naranjas**: Comercios
- **Triángulos rojos**: Industrias
- **Grosor de enlaces**: Proporcional al consumo

#### Panel de Métricas
- **Demanda pico**: Valor máximo y reducción porcentual
- **Demanda promedio**: Valor medio y factor de carga
- **Emisiones**: Reducción de CO₂ estimada
- **Costos**: Ahorros económicos calculados

## 📊 Interpretación de Resultados

### Métricas Clave

#### Factor de Carga
```
Factor de Carga = (Demanda Promedio / Demanda Pico) × 100%
```
- **Objetivo**: >50% (más eficiente)
- **Típico sin optimización**: 30-40%
- **Con red inteligente**: 50-60%

#### Reducción de Pico
```
Reducción = ((Pico Original - Pico Optimizado) / Pico Original) × 100%
```
- **Respuesta a demanda**: 10-20%
- **Red inteligente**: 15-25%

#### Intervalos de Confianza (Monte Carlo)
```
IC 95% = Media ± 1.96 × (Desviación Estándar / √n)
```

### Colores y Símbolos

| Elemento | Color | Significado |
|----------|-------|-------------|
| 🔵 Azul | `#8884d8` | Consumo fijo/referencia |
| 🟢 Verde | `#82ca9d` | Demanda optimizada |
| 🟠 Naranja | `#ff7300` | Precios dinámicos |
| ▼ Flecha | Verde | Reducción conseguida |
| ± Símbolo | Azul | Intervalo de confianza |

## 🧪 Testing y Validación

### Casos de Prueba Recomendados

1. **Simulación Base**:
   ```
   Hogares: 20, Comercios: 10, Industrias: 5
   Horas: 24, Estrategia: Consumo Fijo
   ```

2. **Respuesta a Demanda**:
   ```
   Mismos parámetros + Estrategia: Respuesta a la Demanda
   Expectativa: 10-15% reducción de pico
   ```

3. **Red Inteligente**:
   ```
   Mismos parámetros + Estrategia: Red Inteligente
   Expectativa: 15-20% reducción de pico
   ```

4. **Monte Carlo**:
   ```
   Estrategia: Red Inteligente + 10 muestras
   Expectativa: Intervalos de confianza visibles
   ```

## 🔧 Solución de Problemas

### Errores Comunes

#### Error de Conexión API
```
Error 500: Internal Server Error
```
**Solución**: Verificar que el backend esté ejecutándose en puerto 8000

#### Gráficos No Aparecen
```javascript
// Verificar en consola del navegador (F12)
console.log("Datos del gráfico:", simulationResults);
```

#### Problemas de Styling
```bash
# Reinstalar Tailwind
npm install tailwindcss@latest
```

### Debugging

```javascript
// Habilitar logs detallados en Dashboard.jsx
console.log("Datos de la API:", apiResults);
console.log("Métricas procesadas:", metrics);
console.log("Datos para gráfico:", hourlyData);
```

## 📱 Responsive Design

### Breakpoints

- **sm**: 640px+ (tablets)
- **md**: 768px+ (desktop pequeño)
- **lg**: 1024px+ (desktop)
- **xl**: 1280px+ (desktop grande)

### Grid Layout

```jsx
<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
  {/* Adapta de 1 columna en móvil a 2 en desktop */}
</div>
```

## 🌙 Modo Oscuro

Detección automática y toggle manual:

```javascript
// Detección del sistema
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

// Toggle manual
const toggleDarkMode = () => setDarkMode(!darkMode);
```

## 🚀 Deployment

### Build de Producción

```bash
# Generar build optimizado
npm run build

# Servir archivos estáticos
npx serve -s build
```

### Configuración para Hosting

```javascript
// package.json - para GitHub Pages
"homepage": "https://username.github.io/smart-grids-dashboard"
```

## 🤝 Contribuciones

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-viz`)
3. Commit cambios (`git commit -am 'Agregar nueva visualización'`)
4. Push a la rama (`git push origin feature/nueva-viz`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Autores

- **Pedro Cruz**
- **Jhon Castro**
- **Daniel Arévalo**
- **Alex Hernández**

## 🔗 Enlaces Útiles

- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [D3.js](https://d3js.org/)
- [Create React App](https://create-react-app.dev/)