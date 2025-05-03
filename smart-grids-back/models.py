from pydantic import BaseModel, Field
from typing import List, Literal

class SimulationParams(BaseModel):
    num_homes: int = Field(alias="homes")
    num_commercial: int = Field(alias="businesses")
    num_industrial: int = Field(alias="industries")
    hours: int = Field(default=24, alias="simulation_hours")
    montecarlo_samples: int = 1000
    strategy: Literal["fixed", "demand_response"]

    class Config:
        allow_population_by_field_name = True

class SimulationResult(BaseModel):
    time_series: List[float]
    peak_demand: float
    average_demand: float
    reduced_emissions: float
