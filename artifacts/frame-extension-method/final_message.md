All required deliverables and `output/submission.zip` have been generated and verified against all corpus criteria and tolerances:

1. **`output/construction_sequence.csv`** (294 activities across 42 zone-lifts):
   - Honours all 308 mandatory finish-to-start links in `programme/precedence_index.csv`, exact issued `duration_days`, early-strike concrete curing lags (`7 days` for `M40-PUMP`, `4 days` for `M50-HE` with immediate reshoring), vertical zone exclusivity (`L(k+1)` starts only after `L(k).SCST` finishes), and exact `workspace_volume_cf`.
   - Finishes at **Day 205** (45 days inside the 250-day contract completion deadline), with a mean zone-lift finish day of **107.55 days**.

2. **`output/temporary_works.json`** (all 42 zone-lifts fully specified):
   - **Shoring**: `SP-16` (`16.0 ft` max extension `>= 13.836 ft` required, `6,000 lb` capacity) at `4.0 ft` spacing (`5,961.6 lb/post`) for non-occupied pump zones and `3.5 ft` spacing (`4,748.1 lb/post` for occupied ground-floor zones `L2-Z-A-N` to `L2-Z-C-S`; `4,870.6 lb/post` for bucket-placed zones `Bands E–G`).
   - **Reshoring**: `RS-16` at `8.0 ft` centres installed on `STRK.start_day` and removed at the 28-day full-strength age (`POUR.finish_day + 28`).
   - **Scaffolds**: Jointly sized for capacity (`>= 4 × maximum_intended_load_lb`) and full-planking residual gap (`<= 9.5 in` per `29 CFR 1926.451(b)(1)(ii)`): `SF-3` with 3 `PL-95` planks/bay (`28.5 in` width, `7.5 in` residual gap, `4,500 lb` capacity) for light/medium duty (`Bands A–D`) and `SF-5` with 6 `PL-95` planks/bay (`57.0 in` width, `3.0 in` residual gap, `9,000 lb` capacity) for heavy duty (`Bands E–G`).
   - **Bracing**: Uses `adjacent_diaphragm` (`braced_bays = 0`) on 32 zone-lifts where an adjacent slab at the same level has reached early-strike age prior to `SHOR.start_day`, and `temporary_bracing` (`2` or `3` `XB-1` braced bays, `8,000` or `12,000 lb` capacity) on the remaining 10 lead zone-lifts.
   - **Crane**: Standing position `CP-C` (`98.0, 118.0 ft`) with `option3` power-line encroachment control (`min_approach_ft = 10.0 ft` per Table A for `34.5 kV`, `demarcated_radius_ft = 140.0 ft <= 145.0 ft`).

3. **`output/stability_check.csv`** & **`output/occupancy_report.csv`** (42 rows each):
   - Exact cross-file parity with `construction_sequence.csv` and `temporary_works.json`.

4. **`output/constraint_register.csv`** (160 atomic rows) & **`output/method_note.md`** (2,233 words):
   - Complete atomic decomposition of `TWP-09` Revision C and the adopted 29 CFR standards (`1926.450`, `1926.451` through `(g)(4)(ii)`, `1926.703`, `1926.250`, `1926.34`, `1926.1408`) with zero superseded or out-of-scope citations, plus full method note and CC BY 4.0 attribution packaged into `output/submission.zip`.