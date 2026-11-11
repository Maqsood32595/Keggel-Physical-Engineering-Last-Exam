from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
import datetime

doc = Document()

# Set default font
style = doc.styles['Normal']
font = style.font
font.name = 'Calibri'
font.size = Pt(11)
style.paragraph_format.space_after = Pt(6)
style.paragraph_format.space_before = Pt(0)

# Heading style
for level in range(1, 4):
    hs = doc.styles[f'Heading {level}']
    hs.font.name = 'Calibri'
    hs.font.color.rgb = RGBColor(0, 0, 0)

# Title block
title = doc.add_heading('MEMORANDUM', level=0)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER

# Memo header
header_table = doc.add_table(rows=6, cols=2, style='Table Grid')
header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
headers = [
    ('TO:', 'Gordon Selby, PE — Owner & Principal Engineer, The CFD ME (AZ PE #48213)'),
    ('FROM:', 'Validation Review — prepared per CFDME-QA-VAL-002 rev 2'),
    ('DATE:', '10/10/2025'),
    ('RE:', 'E119 Companion Simulation Validation — CFDME-2025-041 Ocotillo WUI Phase 1'),
    ('PROJECT:', 'CFDME-2025-041 — Ocotillo Additive Structures WUI Wildfire Exposure, Phase 1'),
    ('REFERENCES:', 'RBFMT-25-0918 (Red Butte test report, 09/24/2025); IWFPE-CERT-25-0374 (Ironwood certification, 09/29/2025); E119_companion_sim_results.csv (companion run of record); burn_data_original_vs_revised.csv (Bianca Rennert transmittal, 10/09/2025); CFDME-QA-VAL-002 rev 2 (Validation Procedure); CFDME-2025-041_Phase1_report_revB.docx §7 stub')
]
for i, (label, value) in enumerate(headers):
    cell_l = header_table.cell(i, 0)
    cell_r = header_table.cell(i, 1)
    cell_l.text = label
    cell_r.text = value
    for paragraph in cell_l.paragraphs:
        for run in paragraph.runs:
            run.bold = True
            run.font.size = Pt(11)
    for paragraph in cell_r.paragraphs:
        for run in paragraph.runs:
            run.font.size = Pt(11)

doc.add_paragraph('')

# 1. Executive Summary
doc.add_heading('1. Executive Summary', level=1)
doc.add_paragraph(
    'This memo reports the validation of the E119 companion simulation (the "run") against the certified '
    'third-party fire-endurance test of record (Red Butte report RBFMT-25-0918, test date 09/24/2025) for the '
    'Ocotillo Additive Structures double-wythe 3D-printed concrete wall assembly (OAS-WUI-01_revC). The validation '
    'follows the firm\'s Validation Procedure CFDME-QA-VAL-002 rev 2 (effective 05/01/2025), which requires reporting '
    'the model error E = S − D with its validation uncertainty u_val, and judging acceptance against the criterion '
    '|E| ≤ 10% of D.'
)
doc.add_paragraph(
    'The certified test of record gives a governing single-point endurance D = 118 min (reached at thermocouple 6, '
    'positioned over a horizontal 9-gauge steel tie course). The companion simulation predicts a single-point '
    'endurance S = 131 min. The model error is E = +13 min. The acceptance criterion is 10% of D = 11.8 min. '
    'The combined validation uncertainty is u_val = ±9 min (root-sum-square of u_num = ±4 min, u_inp = ±6 min, '
    'u_exp = ±5 min per Procedure §4 defaults).'
)
doc.add_paragraph(
    'Because |E| = 13 min exceeds both the acceptance criterion (11.8 min) and the validation uncertainty (9 min), '
    'the simulation does not validate against the certified test. The discrepancy is resolved as a model error — '
    'specifically, a systematic over-prediction of single-point endurance. The largest simulation prediction that '
    'would have cleared the criterion is S = 129.8 min (129 min to the nearest minute).'
)
doc.add_paragraph(
    'Bianca Rennert\'s amended figure of 129 min (post-test thermocouple calibration correction) is not admissible '
    'as the experimental value D per Procedure §6, because it lacks a reissued laboratory report and calibration '
    'certificate from Red Butte. If substantiated through proper laboratory channels, it would change the certified '
    'endurance to 129 min, the model error to E = +2 min, and the validation would pass — but only Ironwood Fire '
    'Protection Engineering (Marla Kettering, PE, AZ PE #45106) is entitled to reissue the certification.'
)
doc.add_paragraph(
    'This validation exercise establishes model fidelity against the ASTM E119 furnace exposure only. It does not '
    'establish any wildfire performance claim for the assembly. The gap to a wildfire claim can only be closed by a '
    'wildfire-specific physical test (the Red Butte confirmatory window is scheduled for 10/27/2025), and any future '
    'comparison must be reported in the E ± u_val form prescribed by the Validation Procedure.'
)

# 2. Assembly Identity — Does the Run Match the Certified Assembly?
doc.add_heading('2. Assembly Identity — Does the Companion Run Represent the Certified Assembly?', level=1)
doc.add_paragraph(
    'Yes. The companion simulation uses geometry of record OAS-WUI-01_revC, which is the identical assembly '
    'described in the Red Butte test report RBFMT-25-0918 §2 and reproduced in the Ironwood certification memo '
    'IWFPE-CERT-25-0374 §1.2. Both documents specify:'
)
bullets = [
    'Two 50 mm printed siliceous-aggregate concrete leaves',
    '205 mm open-air cavity (no insulation, no fill, no membrane)',
    'Overall thickness 305 mm (50 / 205 / 50)',
    'Continuous truss-type (triangular zigzag) galvanized steel wall ties, 9-gauge (3.8 mm diameter)',
    'Tie vertical spacing 600 mm o.c., full specimen width',
    'Tie embedment 25 mm into each leaf',
    'Non-load-bearing configuration, standard ASTM E119 time-temperature curve, no hose-stream retest'
]
for b in bullets:
    doc.add_paragraph(b, style='List Bullet')

doc.add_paragraph(
    'The Phase 1 report §3.4 and §3.5 confirm the CFD case setup uses OAS-WUI-01_revC as the source geometry, '
    'transmitted with the signed SOW on 10/08/2025 and meshed on 10/09/2025. The architectural drawing '
    'OAS_wall_assembly_section.png (title block identifier OAS-WA-305mm-DW) refers to the same physical assembly. '
    'No geometric deviation exists between the run and the certified assembly.'
)

# 3. Governing Criterion and Time Reached
doc.add_heading('3. Governing Criterion and Time Reached', level=1)
doc.add_paragraph(
    'Per ASTM E119 §8 (thermal transmission on the unexposed face), two criteria apply to a non-load-bearing wall. '
    'The earlier of the two governs the reported fire endurance. The certified test report RBFMT-25-0918 §5 documents:'
)

# Table for test results
test_table = doc.add_table(rows=4, cols=3, style='Table Grid')
test_table.alignment = WD_TABLE_ALIGNMENT.CENTER
test_data = [
    ('Criterion', 'Limit', 'Time Reached (min)'),
    ('Average unexposed-face rise (nine-TC mean)', '139 °C above initial ambient (21.0 °C)', '163'),
    ('Single-point rise (any single TC)', '181 °C above initial ambient (21.0 °C)', '118'),
    ('GOVERNING', 'Single-point at TC-6 (over tie course)', '118')
]
for i, row_data in enumerate(test_data):
    for j, cell_text in enumerate(row_data):
        cell = test_table.cell(i, j)
        cell.text = cell_text
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.font.size = Pt(10)
                if i == 0 or i == 3:
                    run.bold = True

doc.add_paragraph('')
doc.add_paragraph(
    'The single-point criterion governs. It was reached at 118 min after test start at thermocouple 6, which was '
    'positioned directly opposite a horizontal course of the 3.8 mm truss-type steel wall ties. At that moment, '
    'TC-6 recorded a 181 °C rise while the nine-thermocouple mean rise stood at approximately 96 °C. The '
    'average-rise criterion was reached later at 163 min and does not govern. The certified endurance is D = 118 min.'
)

doc.add_heading('3.1 Companion Simulation — Governing Criterion and Time Reached', level=2)
doc.add_paragraph(
    'The companion simulation (E119_companion_sim_results.csv) tracks the simulation analogs of both criteria: '
    'T_unexposed_max_C (maximum unexposed-surface temperature, analog of the single-point criterion) and '
    'T_unexposed_avg_C (mean unexposed-surface temperature, analog of the nine-TC average criterion). The initial '
    'ambient in the simulation is 21.0 °C, matching the test. The single-point threshold is 21.0 + 181 = 202 °C; '
    'the average threshold is 21.0 + 139 = 160 °C.'
)

sim_table = doc.add_table(rows=4, cols=3, style='Table Grid')
sim_table.alignment = WD_TABLE_ALIGNMENT.CENTER
sim_data = [
    ('Criterion', 'Threshold', 'Time Reached (min)'),
    ('Average unexposed-face rise (simulation analog)', '160 °C (139 °C rise)', '176'),
    ('Single-point rise (simulation analog)', '202 °C (181 °C rise)', '131'),
    ('GOVERNING', 'Single-point (T_unexposed_max_C)', '131')
]
for i, row_data in enumerate(sim_data):
    for j, cell_text in enumerate(row_data):
        cell = sim_table.cell(i, j)
        cell.text = cell_text
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.font.size = Pt(10)
                if i == 0 or i == 3:
                    run.bold = True

doc.add_paragraph('')
doc.add_paragraph(
    'The simulation single-point criterion is reached at 131 min (interpolated crossing 130.9 min, rounded to the '
    'nearest minute). The simulation average criterion is reached at 176 min (interpolated crossing 176.1 min, '
    'rounded to the nearest minute). The governing criterion in the simulation is the single-point criterion at '
    '131 min. The Phase 1 report §7 stub states "Companion simulation predicts S = 131 min for the ASTM E119 '
    'exposure"; this value stands as the simulation prediction of record.'
)

# 4. Experimental Value Adopted and Disposition on Bianca's Figure
doc.add_heading('4. Experimental Value Adopted and Disposition on Bianca\'s Figure', level=1)
doc.add_paragraph(
    'Per Validation Procedure CFDME-QA-VAL-002 rev 2 §6, the experimental value D shall be taken from the '
    'certified third-party test report of record. Client-amended values may not be substituted for D absent a '
    'reissued report from the testing laboratory of record and a calibration certificate authorizing the revision. '
    'The three required forms of documentation are: (1) a reissued report from the laboratory bearing the same '
    'report number with an amendment sequence, signed by the laboratory\'s authorized signatory; (2) a calibration '
    'certificate covering the instrument whose revision is at issue; (3) an explicit statement in the reissued report '
    'that the revised value supersedes the original for all downstream use.'
)
doc.add_paragraph(
    'Bianca Rennert\'s transmittal of 10/09/2025 (burn_data_original_vs_revised.csv) provides a revised single-point '
    'endurance of 129 min, attributing the change to a "post-test thermocouple calibration correction applied to '
    'TC-6." This transmittal is a client communication; it is not a reissued laboratory report, it bears no '
    'laboratory signature, and no calibration certificate accompanies it. Accordingly, it does not meet the '
    'documentation standard of Procedure §6 and is not admissible as D.'
)
doc.add_paragraph(
    'The experimental value adopted for this validation is D = 118 min, drawn directly from RBFMT-25-0918 §5.2 '
    'and §6, certified by Glen Whitfield, Lab Manager, Red Butte Fire & Materials Testing, dated 09/24/2025. '
    'Bianca\'s figure of 129 min is recorded in the project correspondence folder but is not used as D.'
)

# 5. Validation Arithmetic
doc.add_heading('5. Validation Arithmetic — E, u_val, Acceptance Criterion, and Comparison', level=1)

val_table = doc.add_table(rows=9, cols=2, style='Table Grid')
val_table.alignment = WD_TABLE_ALIGNMENT.CENTER
val_data = [
    ('Quantity', 'Value'),
    ('D — Certified experimental endurance (single-point)', '118 min'),
    ('S — Simulation prediction (single-point)', '131 min'),
    ('E = S − D — Model error', '+13 min'),
    ('u_num — Numerical uncertainty (default)', '±4 min'),
    ('u_inp — Input uncertainty (default)', '±6 min'),
    ('u_exp — Experimental uncertainty (default)', '±5 min'),
    ('u_val = √(u_num² + u_inp² + u_exp²) — Validation uncertainty', '±8.77 min → ±9 min (reported to whole minutes)'),
    ('Acceptance criterion: 10% of D', '11.8 min'),
]
for i, row_data in enumerate(val_data):
    for j, cell_text in enumerate(row_data):
        cell = val_table.cell(i, j)
        cell.text = cell_text
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.font.size = Pt(10)
                if i == 0:
                    run.bold = True

doc.add_paragraph('')
doc.add_paragraph(
    'Comparison against the primary acceptance criterion: |E| = 13 min > 11.8 min (10% of D). The primary criterion '
    'is NOT met.'
)
doc.add_paragraph(
    'Comparison against the validation uncertainty: |E| = 13 min > 9 min (u_val). The discrepancy exceeds the '
    'combined validation uncertainty and is therefore resolved as a model error — larger than the noise floor of '
    'the exercise — per Procedure §5 secondary test. This is an actionable finding regardless of the primary '
    'criterion outcome.'
)
doc.add_paragraph(
    'Sign of E: E = +13 min (positive). The simulation over-predicts the single-point endurance. A simulation that '
    'consistently over-predicts endurance carries different engineering implications from one that under-predicts; '
    'the positive sign is preserved in this rollup and discussed in Section 7.'
)

doc.add_heading('5.1 Largest Prediction That Would Have Cleared the Criterion', level=2)
doc.add_paragraph(
    'The acceptance criterion is |S − D| ≤ 0.10 × D. With D = 118 min, the maximum admissible S is:'
)
doc.add_paragraph(
    'S_max = D + 0.10 × D = 118 min + 11.8 min = 129.8 min.',
    style='Normal'
)
doc.add_paragraph(
    'The largest simulation prediction that would have cleared the criterion is 129.8 min (129 min to the nearest '
    'minute). At S = 129 min, E = +11 min, which satisfies |E| = 11 min ≤ 11.8 min and also |E| = 11 min ≤ 9 min? '
    'No — at S = 129 min, |E| = 11 min still exceeds u_val = 9 min, so the secondary comparison to u_val would '
    'still flag a model error. To clear both the primary criterion and the u_val comparison simultaneously requires '
    '|E| ≤ 9 min, i.e., S ≤ 127 min. The value 129.8 min is the limit for the primary criterion alone.'
)

# 6. Two Required Comparisons
doc.add_heading('6. Two Required Comparisons', level=1)

doc.add_heading('6.1 Separation Between the Two Criteria — Test vs. Run', level=2)
comp1_table = doc.add_table(rows=4, cols=3, style='Table Grid')
comp1_table.alignment = WD_TABLE_ALIGNMENT.CENTER
comp1_data = [
    ('', 'Test (RBFMT-25-0918)', 'Run (E119_companion_sim_results.csv)'),
    ('Single-point governance time', '118 min', '131 min'),
    ('Average-rise criterion time', '163 min', '176 min'),
    ('Separation (average − single-point)', '45 min', '45 min'),
]
for i, row_data in enumerate(comp1_data):
    for j, cell_text in enumerate(row_data):
        cell = comp1_table.cell(i, j)
        cell.text = cell_text
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.font.size = Pt(10)
                if i == 0:
                    run.bold = True

doc.add_paragraph('')
doc.add_paragraph(
    'The separation between the two thermal-transmission criteria is identical in the test and in the simulation: '
    '45 minutes in both cases. This indicates the model correctly captures the relative thermal dynamics between '
    'the localized thermal-bridge path (the tie course at TC-6) and the bulk unexposed-face response averaged over '
    'the nine thermocouples. The model reproduces the temporal offset between the governing single-point failure '
    'and the later average-rise failure.'
)

doc.add_heading('6.2 Governing Point Above the Nine-Point Mean at Governance', level=2)
comp2_table = doc.add_table(rows=4, cols=3, style='Table Grid')
comp2_table.alignment = WD_TABLE_ALIGNMENT.CENTER
comp2_data = [
    ('', 'Test (at 118 min)', 'Run (at 131 min)'),
    ('Governing single-point rise', '181 °C', '181.1 °C'),
    ('Nine-TC mean rise at that moment', '≈96 °C (per RBFMT-25-0918 §5.2)', '89.9 °C (T_unexposed_avg_C at 131 min)'),
    ('Difference (governing point above mean)', '85 °C', '91.2 °C'),
]
for i, row_data in enumerate(comp2_data):
    for j, cell_text in enumerate(row_data):
        cell = comp2_table.cell(i, j)
        cell.text = cell_text
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.font.size = Pt(10)
                if i == 0:
                    run.bold = True

doc.add_paragraph('')
doc.add_paragraph(
    'At the moment of single-point governance, the governing thermocouple sits 85 °C above the nine-point mean in '
    'the test, and 91 °C above the mean in the simulation. The simulation shows a 6 °C larger excess (approximately '
    '7% relative difference). This indicates the model slightly amplifies the thermal-bridge effect of the steel tie '
    'course relative to the bulk concrete response. The tie thermal path conducts heat more efficiently in the '
    'simulation than the physical assembly demonstrated, or the bulk concrete response is slightly retarded in the '
    'model, or both.'
)

# 7. What This Says About the Model, Where Rework Belongs, and Whether Rework Has Started
doc.add_heading('7. Model Diagnosis, Rework Location, and Rework Status', level=1)
doc.add_paragraph(
    'The validation result — a systematic over-prediction of single-point endurance by 13 min (11% error) with an '
    'identical 45-minute criterion separation but a modestly amplified thermal-bridge excess (91 °C vs. 85 °C) — '
    'points to a specific class of model error: the thermal resistance of the steel tie path, or the thermal '
    'capacitance/conduction of the concrete leaves adjacent to the tie embedment, is under-predicted in the '
    'simulation. The tie course acts as a continuous metallic thermal bridge (conductivity ~45 W/m·K, more than an '
    'order of magnitude above the siliceous-aggregate concrete). The simulation captures the existence and timing '
    'of this bridge (correct 45-minute separation) but not its precise thermal resistance (6 °C excess at governance).'
)
doc.add_paragraph(
    'Rework belongs in the through-wall CFD treatment of the assembly, specifically:'
)
rework_bullets = [
    'Tie thermal modeling: contact resistance at the tie-concrete interface, tie embedment geometry (25 mm each leaf), and effective tie conductivity in the printed concrete matrix.',
    'Concrete temperature-dependent properties: the Modeling Standard §3.5 reference table for siliceous-aggregate concrete at elevated temperature; verify the k(T), ρ(T), c_p(T) curves used in the companion run against the standard.',
    'Cavity radiation and convection: the open-air 205 mm cavity carries no insulation; the radiation view factors between the exposed and unexposed leaves across the cavity, and the natural convection loop in the cavity, affect the bulk unexposed-face temperature history.',
    'Mesh resolution at the tie embedment: the tie diameter is 3.8 mm; the fine grid background dx = 0.5 m does not resolve the tie. The sub-grid treatment of the tie thermal path (Modeling Standard §6) must be audited.',
    'Boundary condition on the exposed face: the E119 standard curve delivery by the simulation\'s furnace boundary condition — verify the time-temperature history imposed matches the ASTM E119 curve within the standard tolerance band.'
]
for b in rework_bullets:
    doc.add_paragraph(b, style='List Bullet')

doc.add_paragraph(
    'Rework status: No rework on the E119 companion simulation has been started. The case log for the wildfire '
    'matrix (log.solve_20251009_attempt3.txt, dated 10/09/2025) documents a third attempt at a steady solve for the '
    'desert-fire scoping model (buffelgrass fuel, n-heptane surrogate, EDC combustion, fvDOM radiation) — this is '
    'the SOW §3.1 wildfire matrix, not the E119 companion run. The companion run is a separate case setup (furnace '
    'exposure, no combustion, conjugate heat transfer through the wall assembly) and its case setup record has not '
    'been updated since the initial run that produced E119_companion_sim_results.csv. Peer Review Checklist Item 5 '
    '(Through-wall CFD treatment confirmed per Modeling Standard rev 4 §6) remains OPEN, confirming the treatment '
    'has not yet been documented or audited.'
)

# 8. Implications for the Rest of Phase 1
doc.add_heading('8. Implications for the Rest of Phase 1', level=1)
doc.add_paragraph(
    'The Phase 1 report cannot be finalized until Section 7 (Validation) is completed. This memo completes Section 7. '
    'The validation finding — the model does not validate against the certified E119 test (|E| > 10% D and |E| > u_val) — '
    'is a documented finding that must be reported in the Phase 1 report §7. Per Validation Procedure §5, a '
    'deliverable in which |E| exceeds the criterion, or |E| exceeds u_val, or both, shall not be released with an '
    'unqualified validation claim. The reviewing engineer (Marguerite Falk, PE) determines whether the deliverable '
    'may be released with a documented finding, whether the model shall be reworked, or whether the validation '
    'reference itself is unsuitable.'
)
doc.add_paragraph(
    'The wildfire matrix (SOW §3.1, six transient LES cases) uses the same through-wall CFD treatment and the same '
    'wall assembly geometry. The over-prediction of single-point endurance in the E119 validation suggests the '
    'wildfire-case unexposed-face and tie-embedded temperature histories (Appendix B, currently "[To be populated]") '
    'may carry a similar positive bias at locations corresponding to tie courses. This does not invalidate the '
    'wildfire analysis, but it must be disclosed as a model-form uncertainty in the Phase 1 report conclusions (§8). '
    'The confirmatory Red Butte wildfire test window (10/27/2025) remains the critical path for wildfire-specific '
    'validation.'
)
doc.add_paragraph(
    'Peer Review Checklist Item 6 (Validation reported as E ± u_val against acceptance criterion) is CLOSED by this '
    'memo. Items 2, 3, 4, 5, 7, 9, and 10 remain OPEN pending regime/solver documentation, verification evidence '
    'per QA Verification Standard, through-wall treatment documentation, geometry revision cross-check, and pressure '
    'cross-checks per Units SOP.'
)

# 9. Wildfire Claim — What This Exercise Does and Does Not Establish
doc.add_heading('9. Wildfire Claim — What This Exercise Does and Does Not Establish', level=1)
doc.add_paragraph(
    'Per Validation Procedure §7 (Scope Limitation) and Ironwood certification memo §5.2: ASTM E119 exposes an '
    'assembly to the standard building time-temperature curve, which is a smooth, monotonically rising, '
    'fuel-continuous compartment fire scenario intended to grade the relative thermal performance of building '
    'assemblies under a repeatable exposure. A wildland-urban interface (WUI) wildfire exposure is a wind-driven, '
    'radiation-dominated, transient fire-front event whose peak heat flux, duration, and spatial distribution differ '
    'from E119 at every axis. An assembly with a two-hour E119 rating is not thereby a two-hour wildfire assembly, '
    'and no algebraic manipulation of an E119 result yields a wildfire survival time.'
)
doc.add_paragraph(
    'What this validation exercise ESTABLISHES:'
)
establishes = [
    'The CFD model (solver stack, through-wall treatment, material properties, boundary conditions as configured for the E119 companion run) reproduces the certified E119 test single-point endurance with a model error of E = +13 min (11% over-prediction).',
    'The model correctly captures the 45-minute separation between the single-point and average-rise criteria, indicating the relative thermal dynamics between the tie-course thermal bridge and the bulk unexposed face are qualitatively correct.',
    'The model slightly amplifies the thermal-bridge excess at governance (91 °C vs. 85 °C), identifying a specific model-form error in the tie thermal path or adjacent concrete response.',
    'The validation is reported in the required form (E ± u_val against acceptance criterion) per CFDME-QA-VAL-002 rev 2.'
]
for b in establishes:
    doc.add_paragraph(b, style='List Bullet')

doc.add_paragraph('What this validation exercise DOES NOT ESTABLISH:')
not_establishes = [
    'Any wildfire performance claim for the Ocotillo assembly, the structures in which it is installed, or the occupants of those structures.',
    'That the assembly will survive any specific wildfire exposure duration.',
    'That the wildfire matrix LES results (SOW §3.1) are validated against wildfire physics.',
    'That the 1-hour fire-resistance rating certified by Ironwood (IWFPE-CERT-25-0374) implies any wildfire survival time.',
    'That Bianca Rennert\'s amended figure of 129 min has any standing for certification or validation purposes.'
]
for b in not_establishes:
    doc.add_paragraph(b, style='List Bullet')

doc.add_paragraph(
    'What would CLOSE the gap to a wildfire claim:'
)
close_gap = [
    'A wildfire-specific physical test of the assembly under a representative WUI exposure (radiant + convective heat flux from an advancing vegetation fire front, wind-driven flame tilt, firebrand deposition). The Red Butte confirmatory window on 10/27/2025 is scheduled for this purpose.',
    'Validation of the wildfire-configuration CFD model against that wildfire physical test, reported in the E ± u_val form per CFDME-QA-VAL-002 rev 2, with a wildfire-specific acceptance criterion agreed between the reviewing engineer and the fire-protection engineer of record.',
    'A separate certification by a fire-protection PE (such as Ironwood) addressing wildfire performance, explicitly scoped to the wildfire exposure and not conflated with the E119 rating.'
]
for b in close_gap:
    doc.add_paragraph(b, style='List Bullet')

doc.add_paragraph(
    'Form of any future comparison: Per Validation Procedure §3, every validation claim shall present S, D, E, and '
    'u_val in a single line or table, in that order, with a citation to the physical test report from which D is '
    'taken and to the run identifier from which S is taken. Descriptive words such as "matches," "agrees," '
    '"confirms," or "is validated" are inadmissible substitutes for the numerical statement. The reviewing engineer '
    'shall reject any submitted deliverable that omits any of the four quantities or replaces the numerical rollup '
    'with a qualitative characterization.'
)

# 10. Effect of Bianca's Figure on Certified Rating, Entitlement, Stamp Language
doc.add_heading('10. Effect of Bianca\'s Figure on Certified Rating, Entitlement to Act, and Stamp Language', level=1)
doc.add_paragraph(
    'If Bianca\'s figure of 129 min were substantiated through the proper laboratory channel (reissued Red Butte '
    'report with amendment sequence, calibration certificate, and explicit supersession statement per Procedure §6), '
    'the following would occur:'
)

effect_table = doc.add_table(rows=5, cols=2, style='Table Grid')
effect_table.alignment = WD_TABLE_ALIGNMENT.CENTER
effect_data = [
    ('Item', 'Effect'),
    ('Certified endurance D', 'Changes from 118 min to 129 min'),
    ('Model error E', 'Changes from +13 min to +2 min (S = 131 min unchanged)'),
    ('Primary criterion (10% of D)', '12.9 min; |E| = 2 min ≤ 12.9 min → PASSES'),
    ('u_val comparison', '|E| = 2 min ≤ 9 min → PASSES (discrepancy within validation uncertainty)')
]
for i, row_data in enumerate(effect_data):
    for j, cell_text in enumerate(row_data):
        cell = effect_table.cell(i, j)
        cell.text = cell_text
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.font.size = Pt(10)
                if i == 0:
                    run.bold = True

doc.add_paragraph('')
doc.add_paragraph(
    'Effect on certified fire-resistance rating: The Ironwood certification IWFPE-CERT-25-0374 §3 certifies a '
    '1-hour rating (60 min) because the measured endurance of 118 min exceeds 60 min but falls short of the '
    '2-hour rung (120 min) by 2 min. If D = 129 min, the measured endurance would exceed 120 min, and the '
    'assembly would be certified at the 2-hour rating (the highest standard rung fully demonstrated). The certification '
    'scope (§1.2) would remain limited to the specific assembly geometry and test conditions.'
)
doc.add_paragraph(
    'WHO IS ENTITLED TO ACT: Per Ironwood certification memo §4 ("Amendments and Reissuance"): "Any change to the '
    'certified rating requires a reissued test report from the testing laboratory of record and a new certification '
    'issued by Ironwood Fire Protection Engineering. No other party may certify or restate this rating." Only Marla '
    'Kettering, PE (Arizona PE #45106), Principal of Ironwood Fire Protection Engineering, is entitled to reissue '
    'the certification. The CFD ME (Gordon Selby, PE) stamps CFD thermal analysis only and does not certify '
    'fire-resistance ratings.'
)
doc.add_paragraph(
    'STAMP LANGUAGE: Per Validation Procedure §9 and the firm\'s standard stamp block (Phase 1 report §9.2):'
)
doc.add_paragraph(
    '"CFD thermal analysis only. Fire-resistance rating certified separately by others."',
    style='Normal'
).runs[0].bold = True
doc.add_paragraph(
    'This stamp language appears on the Phase 1 report and on this memo. It delimits the firm\'s professional '
    'responsibility to the CFD thermal analysis; fire-resistance rating certification is reserved to the fire-protection '
    'professional engineer of record (Ironwood, Marla Kettering, PE).'
)

# 11. Checklist Disposition
doc.add_heading('11. Peer Review Checklist Disposition', level=1)
doc.add_paragraph(
    'The CFDME-2025-041 Peer Review Checklist (opened 10/09/2025, reviewer Marguerite Falk, PE, AZ PE #42798) '
    'carries the following items relevant to this memo:'
)

cl_table = doc.add_table(rows=12, cols=4, style='Table Grid')
cl_table.alignment = WD_TABLE_ALIGNMENT.CENTER
cl_data = [
    ('Item', 'Description', 'Status Before Memo', 'Status After Memo'),
    ('1', 'Deliverable identifies governing SOW and revision', '[X] CLOSED', '[X] CLOSED'),
    ('2', 'Regime selection documented against Modeling Standard', '[ ] OPEN', '[ ] OPEN'),
    ('3', 'Solver package confirmed per Modeling Standard §3', '[ ] OPEN', '[ ] OPEN'),
    ('4', 'Resolution basis D*/dx and Pope resolved-TKE in Verification body', '[ ] OPEN', '[ ] OPEN'),
    ('5', 'Through-wall CFD treatment confirmed per Modeling Standard §6', '[ ] OPEN', '[ ] OPEN'),
    ('6', 'Validation reported as E ± u_val against acceptance criterion', '[ ] OPEN', '[X] CLOSED by this memo'),
    ('7', 'Geometry revision tagged and matches case log', '[ ] OPEN', '[ ] OPEN'),
    ('8', 'Stamp boundary respected', '[X] CLOSED', '[X] CLOSED'),
    ('9', 'Pressures cross-checked against BC per Units SOP §4', '[ ] OPEN', '[ ] OPEN'),
    ('10', 'Reviewer sign-off and stamp block completed', '[ ] OPEN', '[ ] OPEN (held pending 2,3,4,5,7,9)'),
    ('11', 'Reviewer sign-off', 'Pending', 'Pending')
]
for i, row_data in enumerate(cl_data):
    for j, cell_text in enumerate(row_data):
        cell = cl_table.cell(i, j)
        cell.text = cell_text
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.font.size = Pt(9)
                if i == 0:
                    run.bold = True

doc.add_paragraph('')
doc.add_paragraph(
    'This memo CLOSES Checklist Item 6. Items 2, 3, 4, 5, 7, 9, and 10 remain OPEN. Item 10 (reviewer sign-off) '
    'is held open pending closure of Items 2, 3, 4, 5, 7, and 9 per the checklist\'s own disposition note.'
)

# 12. Paragraph for Bianca
doc.add_heading('12. Paragraph for Bianca Rennert (Same-Day Response)', level=1)
doc.add_paragraph(
    'Bianca — The E119 companion simulation predicts a single-point endurance of 131 min against the certified test '
    'value of 118 min (Red Butte RBFMT-25-0918). The model error is +13 min, which exceeds our 10% acceptance '
    'criterion (11.8 min) and our combined validation uncertainty (±9 min). The simulation does not validate. Your '
    'revised figure of 129 min (post-test TC-6 calibration correction) is not admissible as the experimental value '
    'because it lacks a reissued laboratory report and calibration certificate from Red Butte; our validation '
    'procedure requires those documents before any substitution. If Red Butte reissues the report with the '
    'correction, the error would drop to +2 min and the validation would pass — and the certified rating would move '
    'from 1-hour to 2-hour — but only Ironwood (Marla Kettering, PE) can reissue that certification. This validation '
    'covers the E119 furnace exposure only; it does not establish any wildfire performance. The press deck should '
    'not describe the simulation as "validated against the certified test." We can say: "The E119 companion '
    'simulation over-predicts the certified single-point endurance by 13 min (11%); the discrepancy is resolved as a '
    'model error in the steel tie thermal-bridge path. Wildfire validation is pending the 10/27/2025 Red Butte '
    'confirmatory window." — Gordon'
)

# Signature block
doc.add_paragraph('')
doc.add_paragraph('')
sig_table = doc.add_table(rows=4, cols=2, style='Table Grid')
sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
sig_data = [
    ('Prepared by:', 'Gordon Selby, PE — Owner & Principal Engineer, The CFD ME'),
    ('Arizona PE:', '#48213'),
    ('Date:', '10/10/2025'),
    ('Stamp:', 'CFD thermal analysis only. Fire-resistance rating certified separately by others.')
]
for i, row_data in enumerate(sig_data):
    for j, cell_text in enumerate(row_data):
        cell = sig_table.cell(i, j)
        cell.text = cell_text
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.font.size = Pt(11)
                if j == 0:
                    run.bold = True

# Save
output_path = '/app/files/output/Validation_Memo_E119_Companion_Simulation_20251010.docx'
doc.save(output_path)
print(f'Saved to {output_path}')
