COPY public.statuses (id, name) FROM stdin;
1	New
12	Closed
\.

COPY public.work_packages (id, subject, status_id, parent_id, description) FROM stdin;
51	Corwyn Office Complex PV - Permission to Operate Determination and Pre-PTO Amendment	1	\N	Work package for Corwyn Office Complex PV in the DER Program Backlog Review project recording the determination that Permission to Operate is withheld for 08/04/2025 on the record as it stands. Lists Corwyn Realty Partners' signature of a written amendment under Section 12.1 of the interconnection agreement permitting pre-PTO energization among what has to be settled before Permission to Operate, so the RTU can present live telemetry at the SCADA operator display at issuance, inverters are powered with AD-C1 to AD-C5 closed, and Distribution Operations can energize under its switching order.
\.

COPY public.journals (id, journable_type, journable_id, notes, version) FROM stdin;
1	WorkPackage	51	Engineering determination (07/14/2025): Permission to Operate cannot issue on 08/04/2025 on the record as it stands. RTU station service fed from SWBD-PV below open POI recloser; TCS-02 §5 requires live telemetry at issuance. Pre-PTO energization amendment under ISA Section 12.1 must be signed by DER Program Office and Corwyn Realty Partners.
\.
