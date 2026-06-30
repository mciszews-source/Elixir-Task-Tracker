WITH team_map AS (
  SELECT slug, id FROM teams
  WHERE slug IN ('operations','marketing','sales','ewan','max','marek_jr_')
),
seed(legacy_id, slug, title, description, priority, due_date, from_ewan, status, completed_at, sort_order) AS (
  VALUES
  (1, 'operations', $t1$Finalize vendor contracts$t1$, $d1$Supplier delay / cost overruns if unresolved$d1$, 'high', '2026-06-07'::date, false, 'open', NULL::timestamptz, 100),
  (2, 'operations', $t2$Weekly ops review prep$t2$, $d2$Team misalignment on KPIs$d2$, 'medium', '2026-06-06'::date, false, 'open', NULL::timestamptz, 200),
  (3, 'operations', $t3$Office supply reorder$t3$, $d3$Minor inconvenience only$d3$, 'low', '2026-06-12'::date, false, 'open', NULL::timestamptz, 300),
  (5, 'marketing', $t5$Marketing Plan and Materials for Dr. Shararah$t5$, $d5$Relationship Management$d5$, 'high', '2026-06-10'::date, false, 'open', NULL::timestamptz, 100),
  (42, 'marketing', $t42$Outstanding needs from Dr. Kassir and Scheila$t42$, $d42$Important relationship$d42$, 'high', '2026-06-09'::date, false, 'open', NULL::timestamptz, 200),
  (58, 'marketing', $t58$Finish Branding For AstralX$t58$, '', 'high', '2026-06-12'::date, false, 'open', NULL::timestamptz, 300),
  (6, 'marketing', $t6$Coordinate Omar Husseins EVA announcement$t6$, $d6$EVA marketing$d6$, 'medium', '2026-06-09'::date, false, 'open', NULL::timestamptz, 400),
  (9, 'sales', $t9$Kristy Hamilton EVA$t9$, '', 'medium', '2026-06-15'::date, false, 'open', NULL::timestamptz, 100),
  (10, 'ewan', $t10$Follow Up with Executives about the proposal for Face Cairo$t10$, $d10$He must have time to look at it at least one day prior to meeting.$d10$, 'critical', '2026-06-08'::date, false, 'done', now(), 100),
  (25, 'ewan', $t25$Make sure Kevin Tehrani signs today$t25$, $d25$We need the money$d25$, 'critical', '2026-06-08'::date, false, 'done', now(), 200),
  (26, 'ewan', $t26$Collect requested paperwork by Dr. Yash$t26$, $d26$Potential Sale$d26$, 'critical', '2026-06-08'::date, false, 'done', now(), 300),
  (48, 'ewan', $t48$Call with Sam about payment structure$t48$, $d48$No Clear$d48$, 'critical', '2026-06-08'::date, false, 'done', now(), 400),
  (37, 'ewan', $t37$Dr. Shararah proposal (Brand guideline, social media guideline, marketing strategy, domain and website, YouTube channel setup, instagram setup , linked in setup, email signature, business cards, printed materials)$t37$, $d37$Very important relationship$d37$, 'critical', '2026-06-12'::date, false, 'open', NULL::timestamptz, 500),
  (59, 'ewan', $t59$ROXIUM and diary of a surgeon Domain, who has IONOS?$t59$, '', 'critical', '2026-06-12'::date, false, 'open', NULL::timestamptz, 600),
  (60, 'ewan', $t60$get the NOVEXIS website and LinkedIn$t60$, '', 'critical', '2026-06-12'::date, false, 'open', NULL::timestamptz, 700),
  (62, 'ewan', $t62$Bank of America Transfer$t62$, '', 'critical', '2026-06-12'::date, false, 'open', NULL::timestamptz, 800),
  (63, 'ewan', $t63$Event sponsorship - Rita$t63$, '', 'critical', '2026-06-12'::date, false, 'open', NULL::timestamptz, 900),
  (36, 'ewan', $t36$Plan next weeks Dallas trip - Communicate with Dr. White, Camp, Yash, Rohrich...$t36$, '', 'high', '2026-06-10'::date, false, 'open', NULL::timestamptz, 1000),
  (11, 'ewan', $t11$Create Kristy Hamiltons Talk Tracks and 100k Marketing Strategy$t11$, $d11$Potential Upsell Opportunity$d11$, 'high', '2026-06-10'::date, false, 'open', NULL::timestamptz, 1100),
  (27, 'ewan', $t27$Finalize project X name$t27$, $d27$Hoyos is here right now$d27$, 'high', '2026-06-08'::date, false, 'done', now(), 1200),
  (28, 'ewan', $t28$Register project X company and initiate trademark filings (software and hardware)$t28$, '', 'high', '2026-06-10'::date, false, 'done', now(), 1300),
  (29, 'ewan', $t29$Continue the discussion with Dr. Stephen Davis$t29$, $d29$We need to move him into the pipeline$d29$, 'high', '2026-06-09'::date, false, 'open', NULL::timestamptz, 1400),
  (57, 'ewan', $t57$Astral X NDA and Invention assignment between the company and everyone that is working on it$t57$, $d57$SO they dont say they invented it$d57$, 'high', '2026-06-19'::date, false, 'done', now(), 1500),
  (31, 'ewan', $t31$Schedule meeting with Dr. Samir Kapadia$t31$, $d31$Potenital Sale$d31$, 'high', '2026-06-09'::date, false, 'open', NULL::timestamptz, 1600),
  (32, 'ewan', $t32$Richard Chavo? reach out to him$t32$, '', 'high', '2026-06-10'::date, false, 'done', now(), 1700),
  (41, 'ewan', $t41$Outstanding needs from Dr. Kassir and Scheila$t41$, $d41$important Relationship$d41$, 'high', '2026-06-09'::date, false, 'done', now(), 1800),
  (45, 'ewan', $t45$Immediate need to replace Ben with another videographer$t45$, $d45$Dependence on Ben$d45$, 'high', '2026-06-12'::date, false, 'open', NULL::timestamptz, 1900),
  (43, 'ewan', $t43$Meeting with Jerry Chidester regard ing Clinical Trial, open projects and Project X investment$t43$, $d43$Very important$d43$, 'high', '2026-06-10'::date, false, 'open', NULL::timestamptz, 2000),
  (44, 'ewan', $t44$Make sure Ben gets first payment of open invoices$t44$, $d44$No videographer$d44$, 'high', '2026-06-09'::date, false, 'done', now(), 2100),
  (53, 'ewan', $t53$Outstanding payments from January$t53$, $d53$Legal Exposure$d53$, 'high', '2026-06-11'::date, false, 'open', NULL::timestamptz, 2200),
  (61, 'ewan', $t61$AstralX website$t61$, '', 'high', '2026-06-12'::date, false, 'open', NULL::timestamptz, 2300),
  (30, 'ewan', $t30$Schedule meeting with Dr. Rubinstein$t30$, $d30$Very important relationship$d30$, 'medium', '2026-06-10'::date, false, 'open', NULL::timestamptz, 2400),
  (35, 'ewan', $t35$Dr. Sarah follow up$t35$, $d35$Maintain relationship$d35$, 'medium', '2026-06-10'::date, false, 'done', now(), 2500),
  (38, 'ewan', $t38$Coordinate Omar Husseins EVA announcement$t38$, $d38$EVA marketing$d38$, 'medium', '2026-06-08'::date, false, 'open', NULL::timestamptz, 2600),
  (39, 'ewan', $t39$Provide George Bitar with the EVA information he requested$t39$, $d39$Potential EVA Sale$d39$, 'medium', '2026-06-12'::date, false, 'open', NULL::timestamptz, 2700),
  (47, 'ewan', $t47$Contact Michelle for East Coast machine building$t47$, '', 'medium', '2026-06-12'::date, false, 'open', NULL::timestamptz, 2800),
  (73, 'max', $t73$Update lead list$t73$, '', 'critical', '2026-06-18'::date, false, 'open', NULL::timestamptz, 100),
  (72, 'max', $t72$Dallas Recap Report$t72$, '', 'critical', '2026-06-17'::date, false, 'done', '2026-06-19T00:21:37.882Z'::timestamptz, 200),
  (65, 'max', $t65$Pay EVA Forwarder$t65$, '', 'critical', '2026-06-12'::date, false, 'done', now(), 300),
  (66, 'max', $t66$Send Johnny EVA recordings$t66$, '', 'critical', '2026-06-12'::date, false, 'done', now(), 400),
  (64, 'max', $t64$Finalize what we do with the interviews - Create a list$t64$, '', 'critical', '2026-06-12'::date, false, 'done', now(), 500),
  (46, 'max', $t46$Respond to all interview candidates with either acceptance or rejection$t46$, $d46$Professionalism$d46$, 'critical', '2026-06-08'::date, false, 'done', now(), 600),
  (12, 'max', $t12$Face Global, what are the next steps$t12$, $d12$Hot Opportunity$d12$, 'critical', '2026-06-17'::date, false, 'done', now(), 700),
  (50, 'max', $t50$Send Transcript of Hoyos visit to John$t50$, $d50$Stay Hot$d50$, 'critical', '2026-06-08'::date, false, 'done', now(), 800),
  (55, 'max', $t55$Make Task Tracker for Marek and See what you can teach him$t55$, '', 'critical', '2026-06-09'::date, false, 'done', now(), 900),
  (74, 'max', $t74$Roxium ADP Bank Account$t74$, '', 'critical', '2026-06-18'::date, false, 'open', NULL::timestamptz, 1000),
  (56, 'max', $t56$Make this a company wide tool that can be seen by everyone$t56$, '', 'critical', '2026-06-10'::date, false, 'open', NULL::timestamptz, 1100),
  (71, 'max', $t71$Update Salesforce$t71$, '', 'critical', '2026-06-15'::date, false, 'open', NULL::timestamptz, 1200),
  (75, 'max', $t75$EVA 3D - Dr. Haris$t75$, '', 'critical', '2026-06-18'::date, false, 'done', '2026-06-18T23:29:38.725Z'::timestamptz, 1300),
  (76, 'max', $t76$Consulting company names to Ewan$t76$, '', 'critical', '2026-06-18'::date, false, 'done', '2026-06-19T00:03:15.050Z'::timestamptz, 1400),
  (77, 'max', $t77$EVA Project, how can we make it reality$t77$, '', 'critical', '2026-06-18'::date, false, 'open', NULL::timestamptz, 1500),
  (78, 'max', $t78$Build an EVA Pilot Dashboard$t78$, '', 'critical', '2026-06-18'::date, false, 'open', NULL::timestamptz, 1600),
  (79, 'max', $t79$Finish Dr. Kristy Hamiltons Marketing Strategy$t79$, '', 'critical', '2026-06-19'::date, false, 'done', '2026-06-19T00:20:15.307Z'::timestamptz, 1700),
  (67, 'max', $t67$Did we get paid for Comert and Uribe?$t67$, '', 'high', '2026-06-12'::date, false, 'open', NULL::timestamptz, 1800),
  (54, 'max', $t54$Create Company overview Dashboard - With all info about the companies (Plaud)$t54$, '', 'high', '2026-06-10'::date, false, 'open', NULL::timestamptz, 1900),
  (20, 'max', $t20$Creat Framework for Implementing Marketing Strategies Efficiently$t20$, $d20$Need to make Roxium succesful$d20$, 'high', '2026-06-08'::date, false, 'open', NULL::timestamptz, 2000),
  (22, 'max', $t22$Mehmet reply and video shoot$t22$, $d22$Surgeon needs to stay happy$d22$, 'high', '2026-06-08'::date, false, 'open', NULL::timestamptz, 2100),
  (51, 'max', $t51$Create guide for marketing strategies for surgeons$t51$, $d51$We will not be able to deliver what we promised$d51$, 'high', '2026-06-12'::date, false, 'open', NULL::timestamptz, 2200),
  (13, 'max', $t13$Balikian Visit Plan$t13$, $d13$Pilot Partner$d13$, 'high', '2026-06-16'::date, false, 'open', NULL::timestamptz, 2300),
  (21, 'max', $t21$EVA 3D Surgeon Sales Document$t21$, '', 'high', '2026-06-08'::date, false, 'open', NULL::timestamptz, 2400),
  (23, 'max', $t23$Turn Hamilton Call into plan$t23$, $d23$ROXIUM customer$d23$, 'high', '2026-06-07'::date, false, 'open', NULL::timestamptz, 2500),
  (24, 'max', $t24$Daily Reports$t24$, '', 'high', '2026-06-06'::date, false, 'open', NULL::timestamptz, 2600),
  (33, 'max', $t33$Egyptian lead - Follow up$t33$, $d33$Potential Sale$d33$, 'high', '2026-06-11'::date, false, 'open', NULL::timestamptz, 2700),
  (34, 'max', $t34$Create new Updated lead list$t34$, $d34$Losing potential sales$d34$, 'high', '2026-06-08'::date, false, 'open', NULL::timestamptz, 2800),
  (40, 'max', $t40$Schedule meeting with H/K/B$t40$, $d40$Important strategic meeting$d40$, 'high', '2026-06-09'::date, false, 'open', NULL::timestamptz, 2900),
  (49, 'max', $t49$ABS meeting agreement - Have Marek draft it$t49$, $d49$No partnership for the meeting$d49$, 'high', '2026-06-10'::date, false, 'open', NULL::timestamptz, 3000),
  (68, 'marek_jr_', $t68$Roxium Execution System plus Dashboard$t68$, '', 'high', '2026-06-19'::date, false, 'open', NULL::timestamptz, 100),
  (69, 'marek_jr_', $t69$EVA 3D - Marketing Execution System$t69$, '', 'high', '2026-06-26'::date, false, 'open', NULL::timestamptz, 200),
  (70, 'marek_jr_', $t70$Dr. Kristy Hamilton - First Marketing Deliveries$t70$, '', 'high', '2026-06-19'::date, false, 'open', NULL::timestamptz, 300)
)
INSERT INTO tasks (
  team_id, title, description, priority, due_date,
  is_executive_request, status, completed_at,
  sort_order, is_on_board, external_id
)
SELECT
  tm.id,
  s.title,
  s.description,
  s.priority::task_priority,
  s.due_date,
  s.from_ewan,
  s.status::task_status,
  s.completed_at::timestamptz,
  s.sort_order,
  true,
  ('legacy:' || s.legacy_id::text)
FROM seed s
JOIN team_map tm ON tm.slug = s.slug
WHERE NOT EXISTS (
  SELECT 1 FROM tasks t
  WHERE t.external_id = ('legacy:' || s.legacy_id::text)
);

SELECT count(*) AS legacy_task_count FROM tasks WHERE external_id LIKE 'legacy:%';
