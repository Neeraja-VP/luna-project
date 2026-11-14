"""
Mission Energy Simulation Endpoints (Member 4 Ownership)
"""
from fastapi import APIRouter, HTTPException
from app.engines.simulation.engine import simulation_engine
from app.schemas.simulation import SimulationRequest, SimulationResponse

router = APIRouter()


@router.post("/simulate", response_model=SimulationResponse, tags=["Mission Simulation"])
def simulate_mission_energy(request: SimulationRequest):
    """
    Simulate lander / rover electrical power system (EPS), solar array power generation,
    thermal heater loads, and battery State of Charge (SoC).
    """
    try:
        return simulation_engine.simulate_mission_power(request)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mission simulation failed: {str(e)}")
