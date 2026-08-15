# V51 Production Block Casting Review

Date: 2026-08-16

## Goal
Refine V50 toward the official/public architecture of a production inline-four diesel engine, with this round focused on cylinder-block casting, main-bearing support, cylinder/liner-water-jacket representation, main oil gallery, service bosses, and cutaway readability.

## Official reference basis
Primary geometry anchors are taken from the official DEUTZ TCD 3.6 L4 product data: four cylinders, 3.6 L displacement, 98 mm bore, 120 mm stroke, and the official package dimensions published for the production family. Yanmar 4TNV98CT and Perkins 904J-E36TA official pages were used only as cross-checks for modern water-cooled inline-four common-rail architecture, not as parts to be mixed into the DEUTZ reference layout.

## Implemented in V51
- Hid the deliberately coarse V50 rectangular cylinder-block primitive in favor of a new stepped production-block casting layer.
- Added upper cylinder-barrel casting, deep-skirt crankcase, machined deck face, main-bearing split line, lower bedplate rail, and bilateral casting reinforcement ribs.
- Added five main-bearing bulkheads/saddles for the inline-four crankshaft support layout, with machined saddle arcs, caps, bearing shells, and cap bolts.
- Added four 98 mm-reference cylinder-liner outer bodies, deck water-jacket rings, lower water-jacket galleries, and coolant-transfer passages.
- Added a longitudinal main-oil gallery, five branch drillings to the main-bearing locations, and four piston-cooling-jet feed/boss representations.
- Added four water-jacket core plugs, multiple accessory mounting bosses, an oil-pressure gallery port, and coolant drain boss.
- Added solid red section faces for the deck, main-bearing split line, and an opened service-side cut surface.
- Connected the new layer to system focus/checkbox visibility, Cutaway, Reset, Explode, Hover engineering metadata, and runtime self-checks.

## Verification performed
- Extracted the V51 inline JavaScript locally and ran `node --check`: PASS.
- GitHub file creation succeeded for `versions/v51-production-block-casting.html`.
- Default stable `index.html` was updated to V51 only after the syntax check and code review.
- V51 runtime QA code checks: V50 base presence, coarse block hidden, 5 main caps, 4 liners, 4 core plugs, main oil gallery, explode separation/restore, cutaway transparency, and section-face visibility.

## Remaining limitations
- This is architecture-level reconstruction from public official product/dimension information and conventional inline-four production-engine practice; it is not proprietary OEM manufacturing CAD, exact water-jacket core geometry, foundry draft specification, or tolerance-level drawing reproduction.
- Independent Chromium/WebGL screenshot validation is still required to confirm final occlusion, visual proportions, mobile GPU performance, hover hit rate, and exploded-view readability.
- V52 should focus on the cylinder-head internals: 4-valve-per-cylinder layout, central injector relationship, valve springs/retainers, followers/rockers, cam journals, and intake/exhaust port entry geometry.

## Commits
- V51 version: `03da3e632baabd021943e49d82750532036c6d9a`
- Stable index promotion: `5a2d7380f0ce82518b8e2315f84c36cb363f75f6`
