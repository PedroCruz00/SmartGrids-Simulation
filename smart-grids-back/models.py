from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict

class SimulationParams(BaseModel):
    num_homes: int = Field(alias="homes")
    num_commercial: int = Field(alias="businesses")
    num_industrial: int = Field(alias="industries")
    hours: int = Field(default=24, alias="simulation_hours")
    montecarlo_samples: int = Field(default=1, alias="monte_carlo_samples")
    strategy: Literal["fixed", "demand_response", "smart_grid"] = "fixed"
    hour_start: int = Field(default=8, alias="start_hour")
    day_type: Literal["weekday", "weekend"] = "weekday"

    class Config:
        validate_by_name = True
        allow_population_by_field_name = True

class EnergySystemState(BaseModel):
    price: float
    renewable_adoption: float 
    storage_capacity: float

class MonteCarloStats(BaseModel):
    mean: float
    std_dev: float
    confidence_interval: float

class ConsumerNode(BaseModel):
    id: str
    type: str
    consumption: float

class NetworkData(BaseModel):
    homes: List[ConsumerNode]
    businesses: List[ConsumerNode]
    industries: List[ConsumerNode]

class FixedDemandData(BaseModel):
    peak_demand: float
    average_demand: float
    time_series: List[float]

class SimulationResult(BaseModel):
    time_series: List[float]
    time_series_std: Optional[List[float]] = None
    price_series: Optional[List[float]] = None
    peak_demand: float
    peak_demand_std: Optional[float] = None
    peak_demand_confidence: Optional[float] = None
    average_demand: float
    average_demand_std: Optional[float] = None
    average_demand_confidence: Optional[float] = None
    reduced_emissions: float
    reduced_emissions_std: Optional[float] = None
    reduced_emissions_confidence: Optional[float] = None
    cost_savings: Optional[float] = None
    monte_carlo_samples: Optional[int] = None
    fixed_demand: Optional[FixedDemandData] = None
    network_data: Optional[NetworkData] = None
    final_energy_system: Optional[Dict] = None