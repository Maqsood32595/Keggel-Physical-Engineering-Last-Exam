COPY public.statuses (id, name) FROM stdin;
1	New
12	Closed
\.

COPY public.work_packages (id, subject, status_id, parent_id, description) FROM stdin;
45	Process the municipal witness-test waiver batch	12	\N	Six municipal arrays have submitted commissioning checklists pre-marked as waiver eligible.
47	Lockmere Middle School - Schedule the witnessed commissioning test	1	45	Schedule witness test per IEEE 1547.1 for Lockmere Middle.
48	Darnwick Elementary School - Schedule the witnessed commissioning test	1	45	Schedule witness test per IEEE 1547.1 for Darnwick Elementary.
49	Holcott Library - Schedule the witnessed commissioning test	1	45	Schedule witness test per IEEE 1547.1 for Holcott Library.
\.

COPY public.relations (id, from_id, to_id, hierarchy) FROM stdin;
1	45	47	0
2	45	48	0
3	45	49	0
\.

COPY public.journals (id, journable_type, journable_id, notes, version) FROM stdin;
1	WorkPackage	45	Batch Determination (07/14/2025): Cravenwood High: carried. Darnwick Elementary: not carried. Holcott Library: not carried. Lockmere Middle: not carried. Marden Falls WRF: carried.	1
\.
