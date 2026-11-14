# LUNA NAVIGATOR — Team Collaboration & Git Workflow

## 1. Team Responsibilities & Ownership

To ensure 4 developers can work in parallel without merge conflicts or regressions:

| Developer | Core Domain | Assigned Workspace | Interface Coordination Point |
| :--- | :--- | :--- | :--- |
| **Member 1** | Frontend Development | `frontend/` | Consumes `/api/` endpoints via `src/services/api.js` |
| **Member 2** | Backend & Ephemeris | `backend/app/api/`, `backend/app/services/`, `backend/app/engines/ephemeris/` | Delivers `/api/ephemeris`, `/api/sites` |
| **Member 3** | GIS & Terrain Ray Tracing | `backend/app/engines/terrain/`, `backend/app/services/geospatial/`, `datasets/` | Delivers `/api/terrain/horizon`, coordinates DEMs |
| **Member 4** | AI/ML, Simulation & Integration | `backend/app/engines/recommendation/`, `backend/app/engines/simulation/`, `docs/` | Delivers `/api/recommend`, `/api/simulate`, test runner |

---

## 2. Git Branching Strategy

We follow a structured GitFlow / Feature-Branch model:

- `main`: Production-ready, fully validated code. All unit tests must pass before merging.
- `develop`: Integration branch where feature branches meet.
- Feature branches naming convention:
  - `feature/m1-frontend-<feature-name>`
  - `feature/m2-ephemeris-<feature-name>`
  - `feature/m3-terrain-<feature-name>`
  - `feature/m4-simulation-<feature-name>`
  - `fix/<bug-description>`

### Example Workflow:
```powershell
# 1. Start from latest develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/m2-ephemeris-horizons-client

# 3. Work incrementally, commit with clear messages
git add backend/app/engines/ephemeris/
git commit -m "feat(ephemeris): implement JPL Horizons batch query and parser"

# 4. Push to remote and open Pull Request
git push -u origin feature/m2-ephemeris-horizons-client
```

---

## 3. Pull Request (PR) & Code Review Guidelines

1. **Interface Contract Adherence**: Any PR that changes request or response signatures in `backend/app/schemas/` must receive approval from both the backend author and the frontend developer (Member 1).
2. **Scientific Integrity**:
   - Never fabricate or hardcode planetary positions or elevation profiles.
   - All physical calculations must include units in variable names or docstrings (e.g., `elevation_m`, `solar_flux_w_m2`, `azimuth_deg`).
3. **Automated Testing**:
   - Backend PRs must run `pytest` and pass 100% of tests.
   - Frontend PRs must pass `npm run build` without compilation errors.
4. **No Overwrites**:
   - Never modify another team member's core files without prior review and communication.

---

## 4. Coding Standards

### 4.1 Python (Backend & Engines)
- Python 3.10+
- Type annotations required on all function arguments and returns:
  ```python
  def calculate_solar_elevation(
      sub_solar_lat_deg: float,
      sub_solar_lon_deg: float,
      site_lat_deg: float,
      site_lon_deg: float
  ) -> float:
      ...
  ```
- Strict schema validation using **Pydantic v2**:
  - Request models must inherit from `pydantic.BaseModel` with field constraints (`Field(ge=-90.0, le=90.0)`).
- Error Handling: Use standard HTTP exceptions (`fastapi.HTTPException`) with actionable messages.

### 4.2 JavaScript / React (Frontend)
- Functional components with React hooks.
- Styling via Tailwind CSS utility classes; avoid inline styles.
- State management kept local to components or isolated custom hooks (`useEphemeris`, `useSiteSelection`).
- Centralized API requests in `src/services/api.js`.

---

## 5. Development Milestones & Checklist

- [x] **Phase 1**: Repository initialization, shared architecture, schemas, and contracts.
- [ ] **Phase 2**: NASA JPL Horizons API integration & ephemeris engine.
- [ ] **Phase 3**: Topocentric Sun and Earth coordinate transformations.
- [ ] **Phase 4**: Solar illumination and Earth communication geometric visibility.
- [ ] **Phase 5**: NASA LOLA DEM processing and spatial indexing.
- [ ] **Phase 6**: Terrain horizon ray-tracing and obstruction detection.
- [ ] **Phase 7**: Interactive lunar map, 3D explorer, and dashboard UI.
- [ ] **Phase 8**: Landing-site comparison and MCDA ranking engine.
- [ ] **Phase 9**: Mission electrical power & battery SoC simulation.
- [ ] **Phase 10**: AI mission assistant, end-to-end testing, and Docker deployment.
