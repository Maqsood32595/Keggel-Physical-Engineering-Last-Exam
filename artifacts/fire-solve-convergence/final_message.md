# Technical Disposition on Attempt 3 (Steady Solve) and Authorized Transient LES Solve Specification (CFDME-2025-041)

Completed signed technical disposition memo `/filesystem/CFDME-2025-041_transient_solve_disposition_revA.docx` on firm letterhead, formally dated 10/10/2025, with reviewer and professional engineering stamp blocks and firm stamp boundary language:

1. **Residual Plateau & Plume Dynamics**:
   - The residual plateau in attempt 3 is identified as the physical puffing oscillation of the buoyant plume necking and shedding toroidal vortices.
   - For a 3.0 m fire front, the Cetegen-Ahmed prediction gives a puffing frequency of 0.87 Hz (f = 1.5 · D^(-1/2) = 0.8660 Hz) and period of 1.15 s (T = 1.1547 s).
   - Closing narrative of attempt 3 quoted an oscillation period of 1.15 s at the plume-centerline probe.
   - Theoretical prediction (0.8660 Hz, 1.1547 s) and attempt 3 quoted value (0.8696 Hz, 1.15 s) agree to 0.41 percent.
   - Concluded that no steady solution exists for the Ocotillo desert-fire problem.

2. **Standards Compliance & Non-Conforming Items**:
   - Radiation: Conforming configuration requires 4 angular directions (S4 quadrature) and 2 wavelength bands split at 2.5 µm (1200–1700 K range); delivered fvDOM 32 rays with 1 grey band is non-conforming.
   - Turbulence: Conforming closure requires Large Eddy Simulation (LES) with WALE or dynamic Smagorinsky sub-grid closure; delivered RAS k-ε is forbidden.
   - Solid region properties: The record holds only constants on file; no temperature-dependent tables exist for concrete leaves or steel ties.

3. **Authorized Transient Run Specification vs. Delivered controlDict**:
   - Authorized: `startFrom latestTime`, `adjustTimeStep yes`, `maxCo 0.9`, `maxDeltaT 0.01 s`, `writeControl adjustableRunTime`, `writeInterval 0.0461 s` (largest 4-decimal interval allowing ≥ 25 samples/period for T = 1.1547 s), `endTime 31.10 s` (shortest end time: 8.00 s startup + 20 full periods).
   - Delivered: `startFrom startTime`, `adjustTimeStep no`, `deltaT 0.01 s` (fixed), `writeControl timeStep`, `writeInterval 100` time steps, `endTime 2000` outer iterations, no `maxCo`, no `maxDeltaT`.

4. **Mesh Topology & Verification Scope**:
   - Attempt 3 ran on the production conjugate mesh (11,214,862 cells, 5 cell zones: atmosphere, outerLeaf, cavity, innerLeaf, ties, 13 boundary patches).
   - Three-grid study verified plume resolution in the fluid domain only (fine grid D*/dx = 7.52, resolved TKE fraction = 0.84, single cell zone, 6 boundary patches, zero wall patches). Solid leaves, cavity radiation, and ties fall outside the verification scope.

5. **Carried Forward Settings & Inlet Specification**:
   - Authorized inlet: U_ref = 8.0 m/s at Z_ref = 6.1 m.
   - EDC combustion model (v2005) carries forward.
   - Delivered flow direction (cos(240), sin(240), 0) was erroneous (drove flow toward 210° compass). Correct unit vector for wind from 240° is (0.866, 0.500, 0) in mesh axes (x east, y north).
   - Delivered roughness length 0.03 m was Mulshi's annotation and not from the site met record (which holds no roughness length).

6. **Computational Cost Projections**:
   - Solver wall clock: 4 h 28 m for one authorized case; 26 h 49 m for the full 6-case matrix.
   - Projection basis conditions: fixed core count condition is unmet (study fine-grid benchmark core count unrecorded); fixed mesh condition is unmet (study ran on fluid-only mesh without wall assembly); fixed solver stack condition is satisfied (both fireFoam LES reacting).
   - Courant margin & time step: Fine-grid benchmark reached max Co = 0.90 against 0.9 ceiling (zero margin). Production conjugate solve will advance at smaller average time step than 0.0022 s due to 0.0625 m and 0.03125 m near-wall cells.
   - Projected figures represent a lower bound; firm figures require a benchmark on the production conjugate mesh.
   - Multiplier gates: No contingency, margin, risk multiplier, or overhead percentage is applied.

7. **Attempt 3 Consumption & Usability Downstream**:
   - Consumed 6 h 41 m wall clock and 424.3 CPU-hours (1.50 times, or 2 h 13 m more solver wall clock than one authorized case).
   - Solved fields from attempt 3 are discarded.

8. **Reviewer Block, Stamp Language & Date**:
   - Stamp boundary: "CFD thermal analysis only. Fire-resistance rating certified separately by others."
   - Signed by Gordon Selby, PE (AZ PE #48213) and reviewed/concurred by Marguerite Falk, PE (AZ PE #42798), dated 10/10/2025.
