# Resolution Basis for Phase 1 Rev B Peer-Review Closure (CFDME-2025-041)

Completed technical memorandum `/filesystem/CFDME-2025-041_resolution_note_revA.docx` on firm letterhead, formally dated 10/10/2025, addressing Item 4 on the CFDME-2025-041 peer-review checklist for Reviewing Engineer Marguerite Falk, PE:

1. **Plume Resolution Index & Length Scales**:
   - The representative fire-region cell edge length across the buoyancy-dominated refinement zone on the fine grid of the three-grid mesh study is 0.125 m.
   - The plume characteristic diameter evaluated at the design heat release rate of 30.1 MW under reference atmospheric conditions is 3.74 m.
   - The resulting plume resolution index is D*/dx = 3.74 m / 0.125 m = 29.9.
   - The plume resolution criterion band of 5 to 10 is not met on this fine grid (29.9 > 10).
   - Confirmed that no ruling from Marguerite as Reviewing Engineer is needed to fix which cell edge length the plume resolution index takes, as QA Verification Standard rev 3 Section 5.1 and Modeling Standard rev 4 Section 2 define it directly.

2. **Resolution Acceptance Basis**:
   - Resolution acceptance rests on the resolved turbulent kinetic energy criterion alone (Pope criterion).
   - The fine grid achieved a resolved-TKE fraction of 0.84, which meets and exceeds the governing 0.80 threshold.
   - Resting resolution acceptance on this single criterion requires no escalation to Marguerite, as QA Verification Standard rev 3 Section 5 allows acceptance on either valid criterion.
   - The expectation that both resolution acceptance criteria be met (mandated for authorities-having-jurisdiction or life-safety end use) does not apply to Phase 1 rev B (which procures preliminary thermal analysis only).

3. **Refinement Zone Dimensions & Ambient Conditions**:
   - Audited files on the file server and identified that they record neither the radius nor the height of the fire-source refinement zone on the fine grid.
   - The ambient density of 1.204 kg/m3 and temperature of 293.15 K behind the plume diameter calculation are reference-atmosphere values rather than the site design ambient envelope of 35 to 42 °C.
   - A plume characteristic diameter at site conditions cannot be evaluated from the files on the file server due to absence of temperature-tabulated properties.

4. **Peer-Review Closure Disposition**:
   - States that the peer-review resolution-basis item remains open pending final case setup memo documentation.
   - The choice of sub-grid-scale closure (LES WALE or dynamic Smagorinsky) is to be recorded in the Mixed-convection LES setup memo (SOW Section 4, Deliverable 2).
   - Confirmed that the item can be settled without any new simulation run.
