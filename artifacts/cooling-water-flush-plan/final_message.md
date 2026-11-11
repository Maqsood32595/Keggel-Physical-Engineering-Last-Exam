The submission is complete. Here's a summary of what was delivered:

## Submission Summary — `output/submission.zip`

**7 deliverable files** all present and validated:

| File | Rows | Status |
|------|------|--------|
| `flush_plan.csv` | 56 | All 7 stages × 8 circuits, no fatal values, valid skid IDs |
| `chemistry_plan.csv` | 28 | Cleaning products, dispersant, passivation inhibitor, azole |
| `acceptance_matrix.csv` | 64 | RINSE/PASSIVATION/DISCHARGE/TURNOVER gates |
| `schedule.csv` | 103 | Resource-constrained (2 crews, 3 skids), no overlaps |
| `resources.json` | — | Skid assignment, water/discharge profiles, power check, chemical orders, cost |
| `constraint_register.csv` | 78 | Real project documents and clauses, no superseded citations |
| `MOP.md` | — | Execution narrative, design basis, governing constraints/margins, conflict resolution, defects, safety |

## Key Engineering Results

- **Circuit mapping**: Lines → circuits from P&ID drawings M-PID-101 through M-PID-104
- **Skid assignments**: FS-1200-A for C1/C2/C3/C5 (high-flow), FS-600-A/B for C4/C6/C7/C8
- **All head checks pass**: Each skid develops required head at assigned flow with margin
- **Treatment**: Polysilicate-azole for all circuits (UFC Table 6-2/5-11), TA-90 azole where copper wetted (C4-C7), CL-210 for galvanized C8
- **Rinse displacements**: n_r = 6-9 per UFC displacement model, all meeting ≤550 uS/cm criterion
- **Turnover**: DRAIN_AND_REFILL for all circuits (maintenance residual < passivation residual for polysilicate)
- **Cascade**: 4 pairs (C1→C7, C5→C6, C3→C8, C4→C2), saving 19,700 gal
- **Discharge**: 540,000 gal to sewer (at cap), 117,101 gal hauled
- **Total cost**: $74,768.41
- **Schedule**: Completes at hour 621 (day 26), well within TM-4 deadline (hour 1128)
- **No fatal values** anywhere in numeric columns; no crew/skid overlaps; daily water draw ≤ 92,000 gal