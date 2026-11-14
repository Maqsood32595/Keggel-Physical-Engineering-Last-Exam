COPY public.statuses (id, name) FROM stdin;
1	New
12	Closed
\.

COPY public.work_packages (id, subject, status_id, parent_id, description) FROM stdin;
44	Respond to the Feeder ALN-108 pre-application request	12	\N	A pre-application request dated 07/02/2025 asks for available capacity on Feeder ALN-108 and cites the published hosting capacity map. Determine the figure the response should carry and what the requester should be advised. Flag any map maintenance the request implies.
\.

COPY public.journals (id, journable_type, journable_id, notes, version) FROM stdin;
1	WorkPackage	44	DER Program Office written determination on Case 44 (Feeder ALN-108 Pre-Application Request, Northline Renewables LLC, 3 MW pure generation): Confirmation of currently available capacity figure requested by Northline Renewables is withheld pending confirmation of current feeder state. All project-sizing reliance by Northline Renewables is conditional on Distribution Planning confirming interim position. Illustrative calculations show 3.0 MW map baseline less 2.2 MW queued additions (Grantwyck Solar 1.2 MW, Cindermere Renewables 1.0 MW) yielding 0.8 MW illustrative headroom. Action assigned to Distribution Planning: DER Program Office requests priority hosting-capacity refresh for Feeder ALN-108 citing RA-2025-07-01 section 3.7. Mandatory full feeder-level study required. Pre-application dialogue offered post-refresh. Case closed.	1
\.
