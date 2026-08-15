# V54 Section Occlusion Fix Review

## Trigger
User screenshot on mobile showed several very large salmon/red rectangles crossing the engine and hiding the crankcase/head from an oblique camera angle while Cutaway mode was active.

## Root cause
The obstruction was not a camera bug. It came from the section-face implementation introduced in V51/V52:

- V51 created `Deck Section Face`, `Main Bearing Split Section`, and `Opened Block Side Section` as full rectangular `BoxGeometry` slabs.
- V52 created `Head Deck Section Face`, `Cam Carrier Section Face`, and `Opened Cylinder Head Side Section` as full rectangular slabs.
- Their red `MeshBasicMaterial` used `depthTest:false`, opacity ~0.97, and render orders 28/30.
- As a result these plates were intentionally drawn through all engine geometry, including empty/open regions, so oblique/mobile views became dominated by red surfaces.

This is conceptually wrong for a cutaway: a section graphic should mark the material boundary/lip of the cut, not fill the entire clipping plane through free space.

## Fix
V54 loads V53 and performs a targeted runtime repair:

1. Hides the six oversized V51/V52 slab meshes by exact name.
2. Replaces them with 24 narrow perimeter section lips that inherit the original section-group transforms, so explode/cutaway behavior remains aligned.
3. Forces all section/cut/lip materials to `depthTest:true` and `depthWrite:false`.
4. Reduces excessive section opacity and normalizes render order.
5. Keeps the V53 ring/torus section references, but makes them depth-correct.
6. Normalizes V50 section-edge materials so they no longer X-ray through the engine.

## QA
V54 automated QA checks:

- V51/V52/V53 section groups are present.
- all six legacy slab meshes remain hidden.
- at least 24 replacement safe lips exist.
- no section/cut/lip material still has `depthTest:false`.
- no oversized legacy section slab is visible.

Local syntax validation before upload:

`node --check /tmp/v54.js`

Result: PASS, no syntax errors.

## Scope / limitations
This round fixes the red occlusion visible in the user screenshot. It does not yet implement true GPU clipping planes with automatically generated cap geometry. The replacement is a non-occluding engineering cut-lip visualization, which is safer for mobile and oblique camera views.

## Files
- `diesel-engine-3d-sim/versions/v54-section-occlusion-fix.html`
- `diesel-engine-3d-sim/index.html`

Historical V50-V53 files were preserved unchanged.
