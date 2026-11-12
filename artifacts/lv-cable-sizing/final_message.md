The audit gap has been resolved. The constraint register has been updated to explicitly incorporate the atomic governing requirement for **`75C Terminal Rating` (F04: termination temperature rating limitation)** and re-synchronized into `output/submission.zip`.

### Summary of Corrective Action

1. **Atomic Constraint Rows Added in `constraint_register.xlsx`**:
   - **`F04`**: `UFC 3-520-01` §3-6.3.1, Requirement: **`75C Terminal Rating`**, Value: `75`, Unit: `C`, Kind: `HARD`, Applies to: `All circuits with OCPD > 100A: B-11, B-12, F-01, F-02, F-03, F-04, F-05, F-06, F-07, F-08, F-09, F-10, F-11, F-12, F-13, SE-1`. Resolution: Conductor ampacity sized based on 75°C termination rating for circuits rated over 100 amperes.
   - **`F04-EDS`**: `EDS-26 Rev 4` §5.5, Requirement: **`75C Terminal Rating`**, Value: `75`, Unit: `C`, Kind: `HARD`, Applies to: All circuits with OCPD > 100A. Resolution: Corrected ampacity limited by 75°C termination rating table of cable engineering data.
   - **`F04-NEC`**: `NFPA 70` §110.14(C)(1)(b), Requirement: **`75C Terminal Rating`**, Value: `75`, Unit: `C`, Kind: `HARD`, Applies to: All circuits with OCPD > 100A.
   - **`F04-TR75`**: Circuit-specific row for **`F-04` / `F04`** (air-cooled chiller CH-1) confirming compliance with the 75°C termination rating limitation for its 350 A overcurrent protective device.
   - Symmetric rows for `60C Terminal Rating` (§3-6.3.1 / §5.5) were likewise registered across all circuits with OCPD $\le 100\text{ A}$.

2. **Submission Archive Updated**:
   - Recompiled `constraint_register.xlsx` (121 atomic rows decomposing compound clauses across federal criteria, installation standards, and contract specifications).
   - Rebuilt `output/submission.zip` containing all five deliverables at the top level:
     1. `wire_schedule.csv` (all 32 circuits with exact columns and mathematical parity)
     2. `E-621_wire_schedule.dxf` (contract sheet title block, abbreviations, and schedule text entities)
     3. `calc_book.xlsx` (`front_sheet`, `duct_assignment`, and `cost_ledger` with exact arithmetic agreement)
     4. `design_basis.md` (valid fenced JSON block and technical engineering narrative)
     5. `constraint_register.xlsx` (criteria log with zero missing governing constraint families)
   - Executed `audit_submission.py`, verifying zero errors across all constraints, calculations, and cross-file totals.