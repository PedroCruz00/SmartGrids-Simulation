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
        logger.info("Simulation completed successfully")
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