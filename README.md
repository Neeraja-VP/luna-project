# LUNA NAVIGATOR — AI-Powered Lunar Landing Site Navigator

[![NASA Space Apps Inspired](https://img.shields.io/badge/Inspiration-NASA%20Space%20Apps%202026-blue.svg)](https://www.spaceappschallenge.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10%2B-green.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19%20%7C%2018-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6%2B-purple.svg)](https://vitejs.dev/)

An interactive scientific decision-support platform designed to evaluate, rank, and simulate lunar south-pole landing sites for robotic and crewed exploration missions (such as NASA Artemis and CLPS).

---

## 🌟 Key Capabilities

- **Interactive Lunar South Pole Explorer**: Explore candidate landing sites (Shackleton Rim, Connecting Ridge, Malapert Mountain, etc.) with real selenographic coordinates.
- **Sun & Solar Illumination Modeling**: Real-time celestial ephemeris via NASA JPL Horizons, calculating solar azimuth, elevation, and terrain-cast shadows.
- **Earth Visibility & Libration Analysis**: Compute Direct-to-Earth (DTE) communication availability, tracking lunar libration in latitude ($\pm 6.7^\circ$) and longitude ($\pm 7.9^\circ$).
- **Topographic Horizon Ray Tracing**: Extract 360-degree local terrain horizon masks from NASA LOLA digital elevation models (DEM) to determine true line-of-sight obstructions.
- **Multi-Site Comparison & MCDA Ranking**: Configurable multi-criteria decision analysis (MCDA) weighting solar illumination, communication windows, slope hazard, and elevation.
- **Mission Power & Energy Simulation**: Model solar array power generation and battery State-of-Charge (SoC) across mission durations.
- **Explainable AI Recommendations**: Provide clear engineering justifications for candidate site selection based strictly on empirical calculations.

---

## 👥 Team Responsibilities

| Role | Module | Primary Work Directory |
| :--- | :--- | :--- |
| **Member 1 (Frontend)** | React dashboard, lunar visualization, charts | `frontend/` |
| **Member 2 (Backend)** | FastAPI, JPL Horizons, Ephemeris calculations | `backend/app/api/`, `backend/app/engines/ephemeris/` |
| **Member 3 (GIS / Compute)**| LOLA DEM processing, ray tracing, terrain horizon | `backend/app/engines/terrain/`, `datasets/` |
| **Member 4 (AI / Integration)**| MCDA ranking engine, mission energy simulation, docs | `backend/app/engines/recommendation/`, `backend/app/engines/simulation/`, `docs/` |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Python 3.10+** (with NumPy, SciPy, FastAPI, Pydantic)
- **Node.js 18+** & npm
- **Git**

### 1. Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend API interactive docs will be available at: `http://localhost:8000/docs`

### 2. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
Frontend application will be live at: `http://localhost:5173`

### 3. Running Unit Tests
```powershell
cd backend
pytest -v
```

---

## 🐳 Docker Deployment

To launch the unified platform with PostgreSQL / PostGIS:
```bash
docker-compose up --build
```

---

## 📚 Technical Documentation

- [System Architecture](docs/architecture.md)
- [Shared API Contracts](docs/api-contracts.md)
- [Scientific & Mathematical Methodology](docs/scientific-methodology.md)
- [Planetary Data Sources](docs/data-sources.md)
- [Team Git & PR Workflow](docs/team-workflow.md)

---

## 🔬 Scientific Data & Standards

- **Ephemerides**: NASA JPL Horizons (DE440 planetary ephemeris).
- **Elevation Model**: NASA LRO Lunar Orbiter Laser Altimeter (LOLA) PDS datasets.
- **Reference Datum**: Mean lunar sphere with $R_{moon} = 1737.4\text{ km}$ ($1,737,400\text{ meters}$).
- **Coordinate System**: Lunar Mean Earth / Polar Axis (ME) selenographic frame.
