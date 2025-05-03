from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import SimulationParams, SimulationResult
from simulation import simulate_demand

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
    result = simulate_demand(params, params.strategy)
    return result
