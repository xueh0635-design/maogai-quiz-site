# V55 Hard Section Guard Review

## User-visible failure
User mobile screenshot still showed very large salmon/red rectangular planes occluding the engine after V54. The screenshot also still exposed V51-era badges/QA, indicating the latest upper-layer patch had not necessarily attached before the deep runtime was revealed.

## Root cause
Two independent problems combined:
1. V51/V52 created full rectangular cut-section slabs such as `Deck Section Face`, `Main Bearing Split Section`, `Opened Block Side Section`, `Head Deck Section Face`, `Cam Carrier Section Face`, and `Opened Cylinder Head Side Section`. These are large plate meshes rather than narrow machined cut lips.
2. The version stack is deeply nested. An outer version can see a renderable V25/V51 canvas and reveal it before all later enhancement layers have attached. Therefore the V54 cleanup, which depended on V51/V52/V53 groups being available, could be skipped/delayed on mobile while the bad V51 slab meshes were already visible.

## V55 fix
- Added `v55-hard-section-guard.html`.
- The guard requires only the deepest Three.js runtime and canvas; it does not require V52/V53/V54 feature groups.
- It scans the entire scene before revealing the page.
- Known bad slab names are always hidden.
- A geometry heuristic also hides newly-created red section-like slabs when two dimensions are large (>240 and >80 scene units) and the third is thin (<32), while preserving narrow cut lips.
- All remaining section/cut/lip materials are forced to `depthTest=true`, `depthWrite=false`, restrained opacity, and low render order.
- The guard rescans every 200 ms for the first ~16 s and after cutaway/explode/reset interactions, so later-loaded child layers cannot reintroduce the slab occluders.
- Old V51–V54 debug/ref badges are hidden to reduce mobile visual clutter.
- V55 does not reveal the canvas until the first guard pass has completed.

## Validation
- Local extracted inline JavaScript passed `node --check` before upload.
- Automated runtime QA reports `remainingVisibleRedSlabs`, expected value 0.
- Historical V51–V54 files were preserved; V55 is a new version.

## Remaining limitation
No independent iPhone Safari/WebGL screenshot was available inside the tool environment after deployment. Final device-level acceptance still requires the user to refresh the V55 link and confirm the same camera angle is clear.
