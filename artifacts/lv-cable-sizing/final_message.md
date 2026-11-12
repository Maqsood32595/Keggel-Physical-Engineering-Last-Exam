# Deliverable Packaging & Verification Confirmation

The initial complete deliverable package has been engineered, cross-verified, and packaged into the target submission archive at `/filesystem/electrical__lv_cable_sizing__blind/output/submission.zip`.

---

### Archive Summary: `/filesystem/electrical__lv_cable_sizing__blind/output/submission.zip`

The ZIP archive contains exactly the five required root-level contract deliverables:

1. **`wire_schedule.csv` (8,190 bytes):**
   - Contains all **32 circuits** from the Connected Load Schedule (`B-01` to `B-18`, `F-01` to `F-13`, and `SE-1`).
   - Uses the exact 27-column schema specified in the brief.
   - Sized strictly against governing criteria:
     * `SE-1`: Sized for continuous main bus ampacity (2000 A per UFC 3-501-01 § 3-2.3.3) with 6 sets of 500 kcmil CU.
     * Equipment circuits (motors, chillers, RTUs, VFD, elevator, fire pump, transformers): Sized for 125% load current without artificial OCPD floors per EDS-26 § 2.1.1.
     * Feeder chains: Cumulative voltage drop held to $\le 3.00\%$ along every path (`MCC-1`: 2.165%, `DP-2`: 1.406%, `K-13`: 1.546%, `LP-1`: 2.373%, `DP-3`: 2.228%, `ATS-1`: 2.223%).
     * Branch circuits: All circuits held to $\le 3.00\%$ branch drop and $\le 5.00\%$ cumulative drop at the load.
     * Fire pump (`F-03`): Satisfies NFPA 70 Article 695 ($1.67\%$ starting drop $\ll 15\%$, $0.30\%$ running drop $\le 5\%$).
     * Equipment grounding conductors: Sized per NFPA 70 Table 250.122 in copper, with proportional circular-mil scaling where phase conductors were upsized for voltage drop.
     * Project Standardization: Exactly **three distinct large sizes** (`500 kcmil`, `350 kcmil`, `250 kcmil`) larger than #1 AWG across all 32 circuits (satisfies the $\le 5$ distinct large size gate).

2. **`calc_book.xlsx` (8,751 bytes):**
   - **`front_sheet`:** Populated with all required design parameters (`outdoor_design_dry_bulb_c` = 42.0, `roof_ambient_c` = 46.0, `earth_ambient_c` = 27.45, `soil_thermal_resistivity_k_m_w` = 0.60, rejected native soil row = 0.95, `encasement_thermal_resistivity_k_m_w` = 0.55, `solar_irradiance_w_m2` = 1030.0, `load_factor` = 1.0, `termination_allowance_ft` = 8.0, `vd_start_point` = T-1 secondary lugs, `vd_limit_feeder_pct` = 3.0, `vd_limit_branch_pct` = 3.0, `vd_limit_total_pct` = 5.0, `mutual_heating_rise_k` = 27.03, `tray_sum_od_in` = 8.23, `distinct_large_sizes` = 3, `ampacity_basis` = NFPA 70 310.14(B), `total_usd` = 190,879.91).
   - **`duct_assignment`:** Full physical mapping for all sets in duct banks DB-1 (`SE-1` in D1–D6, `F-10` in D7–D8) and DB-2 (`F-05` in E1–E3).
   - **`cost_ledger`:** Line-item ledger covering all conductor sizes, terminations, interior rigid steel conduits, and the campus quantity break discount (-$8,516.23). Concludes with the `Total` row ($190,879.91; Material: $138,814.70, Labor: $52,065.21).

3. **`design_basis.md` (9,085 bytes):**
   - Opens with the strictly conforming fenced ```json header block declaring codes of record, environmental parameters, source citations, voltage drop chain budgets, cost elements, duct assignments, and mutual heating rise.
   - Comprehensive engineering narrative detailing the chain of adoption, environmental data provenance, voltage drop budget allocation, service entrance sizing, duct bank mutual heating modeling, size standardization, and cost ledger.

4. **`constraint_register.xlsx` (9,855 bytes):**
   - 55 atomic requirement rows across all 35 constraint families with full citations, quantitative values, kinds (HARD/SOFT), scopes of application, and engineering resolutions without compound sub-clauses.

5. **`E-621_wire_schedule.dxf` (29,137 bytes):**
   - Contract drawing sheet carrying title block (Project P-4210, Sheet E-621) and text entities (TEXT/MTEXT) containing all columns of the wire schedule, agreeing with `wire_schedule.csv` in sequence, circuit IDs, and wire sizes.

---

### Internal Verification Gate Results
The automated self-audit script was executed against the generated archive on disk:
- **ZIP Root Schema:** `wire_schedule.csv`, `E-621_wire_schedule.dxf`, `calc_book.xlsx`, `design_basis.md`, `constraint_register.xlsx` present at top level.
- **Circuit Count:** Exactly 32 circuits.
- **Cross-File Cost Parity:** Conductor Gross ($141,937.18) - 6% Campus Break ($8,516.23) + Terminations ($9,342.96) + Raceways ($48,116.00) = **$190,879.91** (Material: $138,814.70, Labor: $52,065.21). Front sheet, ledger, and design basis match to the exact cent.
- **Campus Quantity Break:** Total conductor length = **38,352.0 ft** $\ge 38,000.0\text{ ft}$ (qualifies for 6% discount).
- **Physical Gates:** Conduit fill $\le 40\%$, jam ratio not in $[2.8, 3.2]$, tray fill $8.23'' \le 16.20''$ ($90\%$ of $18''$).
- **Voltage Drop Gates:** Feeder cumulative $\le 3.00\%$, branch $\le 3.00\%$, total cumulative $\le 5.00\%$.