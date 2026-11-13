The detected audit gaps have been resolved immediately. The constraint register in `conveyance_study.xlsx` and the deliverable report `recon_summary.md` have been updated and re-verified on disk, and `output/submission.zip` has been re-synchronized.

### Actions Taken:
1. **Registered 'Cost / Ledger Parity':**
   - **`req_id`:** `R-35`
   - **`document`:** `RFP Section 01 11 00 / UFC 3-740-05`
   - **`clause`:** `Part 3 / 3.1 & 3.7`
   - **`requirement`:** `Cost / Ledger Parity`
   - **`value`:** `Exact parity` (100% mathematical agreement of take-off quantities, labor hours, loaded rates, equipment rates, material prices, subcontract quotes, and rolled-up project costs across all ledgers)
   - **`applies_to`:** `All conveyance alternatives and takeoff ledger lines`

2. **Registered 'Termination Temperature':**
   - **`req_id`:** `R-36`
   - **`document`:** `UFC 3-520-01 / NFPA 70`
   - **`clause`:** `3-6.3.1 / 110.14(C)`
   - **`requirement`:** `Termination Temperature`
   - **`value`:** `75 C` (Conductors terminated on equipment rated for circuits over 100 A are limited to 75°C ampacity ratings per lowest equipment termination temperature rating; higher temperature ratings permitted solely for derating/ambient adjustments)
   - **`applies_to`:** `Equipment terminations and conductor ampacity basis`

3. **Added Additional Mandatory Code-Scaled Protection Constraints:**
   - `R-37`: **Raceway Derating** (*NFPA 70 Table 310.15(C)(1) / UFC 3-520-01 3-6.3.1*) — Ampacity adjustment factors for $>3$ current-carrying conductors in raceway.
   - `R-38`: **Voltage-Drop Design Loads** (*UFC 3-520-01 3-6.3.2 / UFC 3-501-01 3-2.4*) — Maximum 3% feeder / 5% total system voltage drop at design load.
   - `R-39`: **Cable Tray Fill Limits** (*EDS-26 §6.3.2 / Spec 26 05 33 §3.5 / UFC 3-520-01 Table 3-1 Article 392*) — Sum of cable diameters $\le 90\%$ usable tray width for single-layer MV cables.
   - `R-40`: **Codes of Record** (*PCSFA-IEDS Rev 3 Clause 1.2 / UFC 3-501-01 Section 1-3*) — NFPA 70, IEEE C2, 29 CFR 1926 Subpart P, UFC, UFS, and UFGS as referenced.
   - `R-41`: **Proportional Equipment Grounding Conductor Sizing** (*NFPA 70 / NEC 250.122(B)*) — $\text{cmil}_{\text{egc}} \ge \text{cmil}_{\text{egc\_base}} \times (\text{cmil}_{\text{phase\_upsized}} / \text{cmil}_{\text{phase\_base}})$.

4. **Deliverables Re-Synchronized & Verified:**
   - **`output/conveyance_study.xlsx`**: Updated with all 41 atomic constraint rows in `Register`.
   - **`output/submission.zip`**: Rebuilt with updated `conveyance_study.xlsx` and `conveyance_study_report.md`.
   - **`recon_summary.md`**: Section 4 updated with Section 4.7 detailing these constraints.