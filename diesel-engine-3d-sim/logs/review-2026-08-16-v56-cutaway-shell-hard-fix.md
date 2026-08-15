# V56 Cutaway Shell Hard Fix Review

## Trigger
A second user mobile screenshot still showed a very large salmon/red translucent obstruction across the engine after the V54 section-face fix.

## Corrected diagnosis
The V54 diagnosis was incomplete. There were two separate occlusion sources:

1. **Oversized red section slabs** from V51/V52, already targeted in V54/V55.
2. **The large outer casting meshes themselves**. V51 creates `Upper Cylinder Barrel Casting`, `Deep Skirt Crankcase Casting`, deck/split/bedplate slabs, and V52 adds large head carrier/casting meshes. V51's cast material is a saturated red (`0x852a25`). In cutaway mode these full closed-box castings are made transparent at low opacity instead of being geometrically opened, so their front/back surfaces blend into a broad salmon rectangle at oblique mobile camera angles.

The screenshot also still showed V51-era badges/QA, which is consistent with the deep iframe chain exposing the deepest renderable canvas before later cleanup layers are fully attached.

## V56 integrated fix
- New file: `versions/v56-cutaway-shell-hard-fix.html`.
- Embeds V54 directly to avoid another unnecessary wrapper layer.
- Requires only the deepest Three.js runtime; it does not depend on V52/V53/V54 feature groups being initialized.
- Permanently hides obsolete coarse V50 `Cast Iron Cylinder Block` and `Crossflow Cylinder Head` once detailed replacements are present.
- During cutaway, hides the large V51/V52 full-shell casting meshes while retaining liners, bearing webs, oil galleries, cranktrain, valvetrain, ports, injectors, service hardware and narrow cut lips.
- Changes detailed casting color toward graphite so solid view no longer reads as a huge red mass.
- Preserves thin cut lips but hides oversized red section slabs using both known names and geometry heuristics.
- Forces remaining Section/Cut/Lip materials to `depthTest=true`, `depthWrite=false`, controlled opacity and low render order.
- Adds a generic safety rule for any later-loaded very large warm transparent mesh.
- Re-discovers tracked shell meshes on every guard pass, so late-loaded V51/V52 layers are still corrected.
- Runs before revealing the page, then every 200 ms during startup stabilization and after cutaway/explode/reset/system interactions.
- Hides obsolete V51–V55 debug/ref overlays on mobile to reduce visual clutter.

## Runtime QA
`window.__v56Debug` reports:
- remaining oversized red section slabs;
- remaining large warm transparent shell occluders;
- tracked shell count;
- auto-suppressed mesh count;
- root-cause and fix notes.

Expected acceptance while cutaway is active:
- `remainingSectionSlabs = 0`
- `remainingWarmShellOccluders = 0`

## Validation
- The exact source-level root cause is verified from V51/V52 code.
- The integrated V56 inline JavaScript was extracted locally and passed `node --check` before upload.
- GitHub file write succeeded and the default index was switched to this integrated V56 file.
- No independent iPhone Safari/WebGL screenshot runner is available in this environment, so final visual acceptance still depends on rechecking the same camera angle on the user's device.
