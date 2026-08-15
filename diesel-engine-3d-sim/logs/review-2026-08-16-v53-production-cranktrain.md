# V53 Production Cranktrain Review

Date: 2026-08-16

## Scope
V53 continues the official-public-reference refinement path established in V50-V52. This round focuses on the crankshaft, connecting rods, pistons, ring pack, wrist pins, counterweights, journals, crank oil drillings, and the relation to the V51 five-main-bearing block structure.

## Official reference constraints used
- DEUTZ TCD 3.6 L4 official product data: inline 4-cylinder, 3.6 L, 98 mm bore, 120 mm stroke. The 120 mm stroke constrains the visual crank radius to 60 mm.
- Perkins 904J-E36TA official product data: inline 4-cylinder, 3.6 L, 98 mm bore, 120 mm stroke, direct injection. This independently cross-checks the same 98x120 class architecture.
- Yanmar official industrial-engine catalog/download pages remain a cross-check for modern common-rail inline diesel packaging and cutaway conventions.

Important: OEM crank forging dimensions, connecting-rod center distance, journal diameters, bearing clearances, piston compression height, bowl profile and production tolerances are not publicly established here. V53 therefore uses those only as engineering visualization assumptions, not as OEM drawings.

## Changes
1. Added a forged-crankshaft reference group with 5 main journals, 4 crankpins, 8 crank webs and 8 counterweights, crank nose and flywheel mounting flange.
2. Derived a 60 mm crank radius from the published 120 mm stroke.
3. Added diagonal crankshaft oil drillings and a separate oil-flow-core visualization.
4. Added four connecting-rod assemblies with I-beam shank, big end, cap, small-end bronze bush and rod bolts.
5. Added four piston assemblies with approximately bore-matched skirt, re-entrant bowl visual reference, three-ring pack and wrist pin.
6. Added dynamic slider-crank kinematics tied to the existing crankScrub control. Geometric phasing keeps cylinders 1/4 paired and 2/3 paired 180 degrees opposite; the existing 720-degree firing-cycle reference remains 1-3-4-2.
7. Added cautious hiding of legacy coarse Piston / Connecting Rod / Crankshaft meshes under the base reference root to reduce duplicate geometry.
8. Added Motion/Oil system visibility, cutaway section marks, exploded separation and hover metadata.
9. Added V53 QA for five mains, four crankpins, eight counterweights, four rods, four pistons, three-ring packs, four crank oil drillings, 120 mm stroke travel, animation and exploded restore.

## Validation performed
- Extracted the complete inline V53 JavaScript locally and ran `node --check`; syntax check passed with no output/errors.
- Created `versions/v53-production-cranktrain.html` successfully on GitHub and fetched it back successfully.
- Updated `diesel-engine-3d-sim/index.html` to default to V53.
- No independent Chromium/WebGL execution or iPhone Safari frame-rate test was available in this round, so runtime QA is instrumented in-page but not claimed as independently observed.
- The primary uploaded benchmark video was not re-read byte-for-byte in this round, so no claim of benchmark superiority is made.

## Next iteration
V54 should refine the real front-end drive: crank damper, timing train relationship, water-pump/alternator/idler/tensioner geometry, high-pressure-pump drive reference, belt path, fan hub and front cover/casting.