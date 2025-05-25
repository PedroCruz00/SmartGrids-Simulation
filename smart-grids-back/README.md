# Smart Grids Simulation - Backend

Simulador de redes eléctricas inteligentes con métodos avanzados de simulación para análisis de demanda energética y respuesta a la demanda.

## 🚀 Características

### Métodos de Simulación Implementados

- **🎲 Monte Carlo**: Simulaciones múltiples con diferentes condiciones iniciales
- **🔗 Cadenas de Markov**: Modelado estocástico de estados de demanda energética
- **⚡ Dinámica de Sistemas**: Retroalimentaciones entre precio, renovables y almacenamiento
- **📅 Eventos Discretos**: Simulación por pasos de tiempo (horas)

### Estrategias de Gestión

1. **Consumo Fijo**: Sin optimización, demanda base
2. **Respuesta a la Demanda**: Ajuste de consumo según precios dinámicos
3. **Red Inteligente**: Incluye almacenamiento de energía y gestión avanzada

## 🛠️ Tecnologías

- **FastAPI**: Framework web moderno y rápido
- **Pydantic**: Validación de datos y serialización
- **NumPy**: Computación científica y simulaciones
- **SimPy**: Biblioteca de simulación de eventos discretos
- **Python 3.11+**: Lenguaje base

## 📦 Instalación

### Prerrequisitos

- Python 3.11 o superior
- pip (gestor de paquetes)

### Configuración del Entorno

```bash
# Clonar el repositorio
git clone <repository-url>
cd smart-grids-back

# Instalar dependencias
pip install fastapi uvicorn numpy simpy
```

### Dependencias Principales

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
numpy==1.24.3
simpy==4.0.1
```

## 🚀 Ejecución

### Desarrollo

```bash
# Iniciar servidor de desarrollo
python -m uvicorn main:app --reload

# El servidor estará disponible en:
# http://localhost:8000
```

### Producción

```bash
# Iniciar servidor de producción
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Verificación

```bash
# Verificar estado del servidor
curl http://localhost:8000/health

# Documentación automática
# http://localhost:8000/docs
```

## 📋 API Endpoints

### `POST /simulate`

Ejecuta una simulación de demanda energética.

**Parámetros:**
```json
{
  "homes": 50,
  "businesses": 20,
  "industries": 10,
  "simulation_hours": 24,
  "monte_carlo_samples": 10,
  "strategy": "demand_response",
  "start_hour": 8,
  "day_type": "weekday"
}
```

**Estrategias disponibles:**
- `fixed`: Consumo fijo
- `demand_response`: Respuesta a la demanda
- `smart_grid`: Red inteligente

**Respuesta:**
```json
{
  "time_series": [234.5, 267.8, ...],
  "peak_demand": 456.7,
  "average_demand": 234.5,
  "reduced_emissions": 123.4,
  "cost_savings": 89.12,
  "monte_carlo_samples": 10,
  "network_data": {...},
  "fixed_demand": {...}
}
```

### `GET /health`

Verificación del estado del servidor.

### `GET /`

Redirección a la documentación automática.

## 🏗️ Arquitectura

```
smart-grids-back/
├── main.py              # Punto de entrada de la aplicación
├── models.py            # Modelos Pydantic para validación
├── simulation.py        # Lógica principal de simulación
└── requirements.txt     # Dependencias del proyecto
```

### Componentes Principales

#### `simulation.py`
- **EnergySystem**: Implementa dinámica de sistemas
- **generate_markov_states()**: Cadenas de Markov para estados de demanda
- **simulate_demand()**: Orquestador principal de simulaciones
- **simulate_demand_single_run()**: Simulación individual

#### `models.py`
- **SimulationParams**: Parámetros de entrada
- **SimulationResult**: Resultados de simulación
- **NetworkData**: Datos de red eléctrica

## 🧮 Algoritmos Implementados

### Monte Carlo
```python
# Múltiples simulaciones con semillas diferentes
for i in range(monte_carlo_samples):
    seed = int(time.time()) + i * 100
    result = simulate_demand_single_run(params, strategy, seed)
    results.append(result)

# Cálculo de estadísticas
mean = np.mean(results)
std = np.std(results)
confidence_interval = 1.96 * std / sqrt(n)
```

### Cadenas de Markov
```python
# Estados de demanda
states = ['very_low', 'low', 'medium', 'high', 'peak']

# Matrices de transición dependientes del tiempo
hour_to_matrix = {
    0: night_matrix,
    6: morning_matrix,
    12: midday_matrix,
    18: evening_matrix
}
```

### Dinámica de Sistemas
```python
# Retroalimentaciones del sistema energético
price_change = (demand_ratio - 0.5) * 0.05
adoption_change = renewable_adoption * learning_rate * (1 - renewable_adoption)
storage_change = storage_capacity * growth_rate * (1 + renewable_adoption)
```

## 🔧 Configuración

### Variables de Entorno

```bash
# Puerto del servidor (opcional)
PORT=8000

# Nivel de logging
LOG_LEVEL=INFO

# CORS origins (opcional)
CORS_ORIGINS=["http://localhost:3000"]
```

### Parámetros de Simulación

```python
# EnergySystem - Parámetros del sistema
initial_price = 0.15        # $/kWh
renewable_adoption = 0.10   # 10% inicial
storage_capacity = 0.05     # 5% de almacenamiento

# Elasticidades por tipo de consumidor
base_elasticity = {
    'home': -0.5,           # Más elástico
    'commercial': -0.3,     # Elasticidad media
    'industrial': -0.2      # Menos elástico
}
```

## 📊 Resultados Típicos

### Reducción de Demanda Pico
- **Respuesta a la Demanda**: 10-20% reducción
- **Red Inteligente**: 15-25% reducción

### Mejora del Factor de Carga
- **Consumo Fijo**: ~35%
- **Red Inteligente**: ~55%

### Reducción de Emisiones
- Proporcional a la reducción de consumo
- Factor base: 0.5 kg CO₂/kWh

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
python -m pytest tests/

# Test manual del endpoint
curl -X POST "http://localhost:8000/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "homes": 20,
    "businesses": 10,
    "industries": 5,
    "simulation_hours": 24,
    "strategy": "demand_response"
  }'
```

## 🐛 Solución de Problemas

### Error de Importación
```bash
# Si hay problemas con imports
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Error de Dependencias
```bash
# Reinstalar dependencias
pip install --upgrade -r requirements.txt
```

### Error de Puerto
```bash
# Cambiar puerto si 8000 está ocupado
python -m uvicorn main:app --port 8001
```

## 📈 Métricas de Performance

- **Simulación simple (24h)**: <1 segundo
- **Monte Carlo (100 muestras)**: <10 segundos
- **Simulación extendida (168h)**: <5 segundos

## 🤝 Contribuciones

1. Fork el proyecto
2. Crear una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 👥 Autores

- **Pedro Cruz**
- **Jhon Castro**
- **Daniel Arévalo**
- **Alex Hernández**

## 🔗 Enlaces Útiles

- [Documentación FastAPI](https://fastapi.tiangolo.com/)
- [NumPy Documentation](https://numpy.org/doc/)
- [SimPy Documentation](https://simpy.readthedocs.io/)
- [Pydantic Documentation](https://docs.pydantic.dev/)