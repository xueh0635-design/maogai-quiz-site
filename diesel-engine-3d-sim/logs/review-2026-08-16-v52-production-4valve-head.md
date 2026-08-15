# V52 Production 4-Valve Cylinder Head — Review

Date: 2026-08-16

## Goal
Continue the official-reference refinement route after V51. This round focuses on the cylinder-head / valvetrain package rather than adding generic external decoration.

## Official public references used
- DEUTZ TCD 3.6 L4 official product page and 2026 datasheet: water-cooled inline 4-cylinder engine, DEUTZ Common Rail, turbo + charge-air cooling, cooled external EGR, maintenance-free valve train; official package imagery and dimensions used for the engine-family context.
- Yanmar TNV / TN Common Rail Series official catalog: official cutaway imagery shows common-rail direct injection relationship, centered injector / combustion representation, cylinder-head/valve-region packaging, cooled EGR and DPF system context.
- John Deere 4045 official engine feature pages: official 4-valve cylinder-head feature used only as a public cross-check for modern four-valve diesel head architecture.

Important: the public sources do not disclose proprietary DEUTZ TCD 3.6 internal manufacturing CAD dimensions. V52 is therefore a public-reference engineering reconstruction, not an OEM tolerance model.

## Changes implemented
1. Hide the coarse V50 `Crossflow Cylinder Head` mesh and replace it with a layered lower-head casting, upper cam-carrier casting, machined deck and cam-carrier rail.
2. Add 10 cam-bearing bridges (5 per camshaft), bearing-half geometry and bridge bolts.
3. Add 16 valve-seat/guide assemblies: two intake and two exhaust per cylinder.
4. Apply a mild intake/exhaust splay to all 16 existing V34 dynamic valve groups so the moving stems visually align better with the new guides.
5. Add four central injector bores, four copper sleeves, four injector clamps and clamp bolts.
6. Add 16 crossflow port throats: 8 intake + 8 exhaust branches across four cylinders.
7. Add instanced cylinder-head fasteners, injector harness rail, four injector connectors, coolant-temperature sensor boss and cylinder-head oil-feed boss.
8. Add solid red deck / cam-carrier / opened-side section references.
9. Integrate all V52 groups with system focus, cutaway state and the real `explodeAmount` slider.
10. Add desktop hover and short-tap mobile part info handling for V52 geometry.

## QA encoded in V52
- V51 base present.
- Coarse head hidden.
- 16 dynamic valve groups found and tilted.
- 16 seat/guide assemblies.
- 10 cam-bearing bridges.
- 4 injector bores and 4 injector clamps.
- 16 port throats.
- Explode separation and restore.
- Cutaway transparency and section visibility.

## Local code validation performed before push
The complete V52 HTML was written locally, its inline JavaScript extracted, and `node --check /tmp/v52.js` completed successfully with no syntax errors.

## Remaining limitations
- No independent Chromium/WebGL screenshot validation in this round.
- No new frame-by-frame reread of the user's primary uploaded benchmark MP4 in this round.
- V52 still inherits the existing iframe runtime chain; this remains an architectural/performance debt for a later consolidation round.
- The 4-valve arrangement is a public modern-diesel architecture cross-check, not a claim that every hidden dimension matches proprietary TCD 3.6 production drawings.

## Next planned refinement
V53: crankshaft journals / crank webs / counterweights / connecting-rod big ends / main bearing relationship / piston bowl and oil drillings, with official public engine cutaways and component references used as constraints.
