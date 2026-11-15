# Verification Memorandum — Item 051: Block C Spread Footings and Clay Consolidation Settlement

Completed technical verification memorandum `/filesystem/Thelbridge_Verification_Memo_Item051_BlockC.docx` on Thelbridge letterhead, dated 07/20/2026, from Rahul Nimkar (Geotechnical Reviewer) to Adrian Vance (Project Engineer), copied to Rachel Marlbeck (Project Director), retaining the five standard memorandum sections (`1. PURPOSE`, `2. DOCUMENTS REVIEWED`, `3. BASIS OF REVIEW`, `4. FINDINGS`, `5. CONCLUSION AND RECOMMENDATION`):

1. **Founding Elevation Conflict & Stress Distribution Ambiguity**:
   - The settlement computed in CB-GEO-007 depends on which of the two founding elevations on the record is the correct one.
   - CB-GEO-007 Sheet 2 assumes the underside of footing is at El. 740.5 ft (2.5 ft above top of clay at El. 738.0 ft, depth z = 11.5 ft to mid-clay at El. 729.0 ft).
   - Detail 3/S-201 Rev.4 places top of footing at El. 748.0 ft with 2.0 ft thickness, putting the underside of footing at El. 746.0 ft (5.5 ft higher, depth z = 17.0 ft to mid-clay).
   - The 900 psf net stress increase at mid-clay (Δσ = 900 psf) on which the calculation rests is a function of the depth from footing base to mid-clay. The record does not settle which elevation governs; the computation is held open pending reconciliation.

2. **Nature of Settlement Computed in CB-GEO-007**:
   - CB-GEO-007 computes immediate (elastic) settlement only (0.42 inches via Schmertmann method on Sheet 3).
   - Sheet 4 explicitly records consolidation settlement as "Not computed. Serviceability taken from the immediate settlement result on Sheet 3."
   - The calculation entirely omits primary consolidation of the 18-ft thick Stratum 2 CL clay layer.

3. **Derivation of Primary Consolidation Settlement & Tolerance Exceedance**:
   - Input parameters from Vantree Report VMT-2025-0109-CON (ASTM D2435): layer thickness H = 18 ft = 216 in (El. 738.0 to El. 720.0 ft), initial void ratio e0 = 0.92, compression index Cc = 0.28, recompression index Cr = 0.045, effective overburden at mid-depth σ'0 = 1,850 psf, preconsolidation pressure σ'p = 1,900 psf (OCR = 1.03), net stress increase Δσ = 900 psf (final stress σ'f = 2,750 psf).
   - One-dimensional consolidation derivation:
     $$S_c = \frac{C_c \cdot H}{1 + e_0} \log_{10}\left(\frac{\sigma'_0 + \Delta\sigma}{\sigma'_0}\right) = \frac{0.28 \cdot 216\text{ in}}{1 + 0.92} \log_{10}\left(\frac{2,750}{1,850}\right) = 31.50\text{ in} \cdot 0.17216 = 5.42\text{ in}$$
     (Or accounting for σ'p = 1,900 psf: Sc = 112.5 · [0.045 · log10(1900/1850) + 0.28 · log10(2750/1900)] = 5.12 in).
   - Total settlement (Si + Sc = 0.42 in + 5.12 to 5.42 in = 5.54 to 5.84 in) at the governing Block C footing substantially exceeds the 1.0 in tolerance of Specification Section 31 20 00 Article 3.6.A.

4. **Soil Index Property Discrepancies**:
   - Laboratory index data (ASTM D4318 across 25 samples from all 9 borings) place the liquid limit (LL) of the CL clay at 40 to 41, above the 34 to 39 the geotechnical investigation report's narrative gives for the same clay.
   - Laboratory index data place the plasticity index (PI) of the CL clay at 21, above the 15 to 19 the geotechnical investigation report's narrative gives for the same clay.

5. **Drawing Revision Citation Mismatch**:
   - CB-GEO-007 cites its layout basis as S-101 Rev.2 dated 09/12/2025, while the revision block of S-101 issues Rev.2 on 12/12/2025 (and Rev.0 on 08/22/2025, Rev.1 on 10/03/2025, Rev.3 on 03/06/2026, Rev.4 on 05/29/2026). No revision of S-101 bears 09/12/2025.

6. **Field Monitoring Distribution Non-Compliance**:
   - Round 15 settlement monitoring readings (06/26/2026) recorded cumulative settlement of -0.61 in at MP-7 with an accelerating trend, approaching the 1.0 in limit.
   - Round 15 monitoring readings were routed to the Contractor's own staff (Marcus Whitfield, Superintendent, and Steven Kendrow, Project Executive), with only a copy to the Owner's Rep file, and the Structural Engineer of Record appears nowhere, violating Specification Section 31 20 00 Article 3.6.C.

7. **Contractual Hold on Loading & Schedule Impact**:
   - Specification Section 31 20 00 Article 3.6.B conditions any further loading of Block C on the issue of a written disposition.
   - The Level-3 concrete placement over Blocks A and B scheduled for 07/22/2026 (at 05:30) must itself be delayed, or its hold-point moved, until Item 051 is verified.

8. **Required Submittal and Allocation**:
   - A complete consolidation settlement analysis must be produced before Item 051 can be closed.
   - The Structural Engineer of Record (Calloway Braddock / Gregory Nash, PE) is the party required to produce the consolidation settlement analysis.

9. **Verification Disposition & Register Response**:
   - Item 051 Disposition: **NOT VERIFIED** (Status: **OPEN PENDING** / **HELD**).
   - Register Response (under Adrian Vance / Rahul Nimkar, dated 07/20/2026):
     "Status: Open Pending. Disposition: Not Verified / Held. CB-GEO-007 calculates immediate settlement only (0.42 in) and omits primary consolidation of Stratum 2 CL clay (Sc = 5.12 to 5.42 in), resulting in predicted total settlement exceeding the 1.0 in tolerance of Specification Section 31 20 00 Article 3.6.A. Settlement computation depends on founding elevation (CB-GEO-007 El. 740.5 ft vs S-201 El. 746.0 ft), which remains an unresolved conflict. S-101 Rev.2 date mismatch noted. Round 15 field settlement (-0.61 in, MP-7) approaching tolerance was improperly routed to Contractor staff only, violating Article 3.6.C. In accordance with Article 3.6.B, further loading of Block C is held. Level-3 concrete placement scheduled for 07/22/2026 must be delayed or its hold-point moved until the Structural Engineer of Record (Calloway Braddock / Gregory Nash, PE) submits a complete consolidation settlement analysis and acceptable written disposition."
