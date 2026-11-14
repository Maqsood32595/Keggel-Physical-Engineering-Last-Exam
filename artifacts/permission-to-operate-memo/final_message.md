# Engineering Review and Determination: Corwyn Office Complex PV Permission to Operate Request

## 1. Executive Summary & Determination on PTO Issuance
- **Recipient**: Lena Kovalchuk, Shift Supervisor, System Operations Center (SOC).
- **Facility**: Corwyn Office Complex PV (PXA-2023-0629), Feeder ALN-072.
- **Requested PTO Date**: August 4, 2025 (08/04/2025).
- **Review Date**: July 14, 2025 (07/14/2025).
- **Determination**: States that **Permission to Operate cannot issue on 08/04/2025 on the record as it stands**. Permission to Operate is withheld for 08/04/2025 on the record as it stands.

## 2. Technical and Contractual Basis
1. **RTU Station Service Power Path**:
   - The RTU's only station service is fed from SWBD-PV below the POI recloser that the agreement keeps open before Permission to Operate (via auxiliary transformer TX-1 and auxiliary panel PP-1 Circuit 1).
   - The online UPS provides ~5.5 hours of backup power, after which the RTU de-energizes when SWBD-PV is unpowered.
2. **Governing Standard TCS-02 §5 Requirements**:
   - TCS-02 §5 judges live telemetry at the SCADA operator display at the moment Permission to Operate issues, so the SOC's 07/08/2025 confirmation does not carry to 08/04/2025.
3. **Inverter Powering and Valid Telemetry Points**:
   - The per-inverter points the RTU reports are valid at issuance only once the inverters are powered from an energized Facility.
   - The inverter ac disconnects AD-C1 to AD-C5 have to be closed during the pre-PTO energization so the inverters are powered.

## 3. Required Remediation and Assignment of Responsibility
1. **Written Agreement Amendment**:
   - A written amendment under section 12.1 of the interconnection agreement permitting energization of the Facility before Permission to Operate has to be signed before 08/04/2025 for live telemetry at issuance.
2. **Responsible Parties**:
   - The DER Program Office (Contracts) and Corwyn Realty Partners are responsible for signing the written amendment that permits energizing the Facility before Permission to Operate, so the RTU can present live telemetry at the SCADA operator display at issuance.
3. **Operational Switching**:
   - Distribution Operations energizes the Facility under its own switching order only once the written amendment permits energization before Permission to Operate, so the RTU can present live telemetry at the SCADA operator display at issuance.
4. **Feasibility**:
   - This can be accomplished before 08/04/2025 if the amendment is executed promptly by Corwyn Realty Partners and Contracts.

## 4. OpenProject Case Tracking
- Created one work package for Corwyn Office Complex PV in the DER Program Backlog Review project recording the determination that Permission to Operate is withheld for 08/04/2025 on the record as it stands.
- Lists Corwyn Realty Partners' signature of a written amendment permitting pre-PTO energization among what has to be settled before Permission to Operate.

## 5. Items Under Separate Review
- Installation, configuration, and commissioning tests of the RTU and POI recloser (SCADA/EMS Engineering and Distribution Protection Engineering).
- POI recloser settings and protection coordination study (Distribution Protection Engineering).
- Queue position (Meera Vellanki).
- System impact study and conditions (Ivo Grantham's DER Planning Group).
- Nothing else is under separate review.
