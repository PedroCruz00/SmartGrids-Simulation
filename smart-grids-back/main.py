from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from models import SimulationParams, SimulationResult
from simulation import simulate_demand
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS para React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # o restringe con ["http://localhost:3000"]
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/simulate", response_model=SimulationResult)
def run_simulation(params: SimulationParams):
    try:
        logger.info(f"Executing simulation with params: {params}")
        result = simulate_demand(params, params.strategy)
        logger.info(f"Simulation completed successfully. Peak demand: {result.get('peak_demand')}")
        
        # Verificar los datos de red generados
        network_data = result.get("network_data", {})
        homes_count = len(network_data.get("homes", []))
        businesses_count = len(network_data.get("businesses", []))
        industries_count = len(network_data.get("industries", []))
        
        logger.info(f"Network data generated: Homes={homes_count}, Businesses={businesses_count}, Industries={industries_count}")
        
        # Verificar datos para comparación
        if "fixed_demand" in result and result["fixed_demand"] is not None:
            logger.info(f"Fixed demand data available for comparison. Peak: {result['fixed_demand'].get('peak_demand')}")
        
        return result
    except Exception as e:
        logger.error(f"Error in simulation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/")
def root():
    # Redireccionar a la documentación automática
    return RedirectResponse(url="/docs")