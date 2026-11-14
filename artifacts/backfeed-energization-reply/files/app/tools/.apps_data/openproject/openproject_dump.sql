COPY public.statuses (id, name) FROM stdin;
1	New
12	Closed
\.

COPY public.work_packages (id, subject, status_id, parent_id, description) FROM stdin;
50	Halbray Field Solar Site 3 - Pre-PTO backfeed remediation items	1	\N	Work package for Halbray Field Solar Site 3 in the DER Program Backlog Review project that lists the Type TC tracker drive cable, the Type USE-2 inverter output conductors and the enamel strut among what Halbray has to settle before the backfeed. Specifically: (1) tracker drive cable along tracker row piles must be put in a raceway or replaced with a code-permitted wiring method; (2) Type USE-2 inverter output conductors on skids must be replaced with code-permitted conductors above ground; (3) green-enamel strut at array north edge must be replaced or given outdoor corrosion protection; and (4) Kelloway Township final approval under permit EP-25-0418 must be obtained.
\.

COPY public.journals (id, journable_type, journable_id, notes, version) FROM stdin;
1	WorkPackage	50	Determination on Halbray Field Solar Site 3 pre-PTO backfeed request (07/14/2025): Energization on 07/29/2025 cannot be confirmed due to NFPA 70-2023 code breaches (Type TC drive cable, Type USE-2 skid conductors, enamel strut) and pending Kelloway Township permit EP-25-0418 final inspection.
\.
