# V56 Cutaway Casting Clearance Review

## Trigger
User mobile screenshot after V54/V55 still showed a very large salmon/red translucent rectangle covering the engine in cutaway view.

## Root cause
The previous fixes concentrated on `Section / Cut / Lip` geometry and oversized red section-face slabs. That was incomplete.

The remaining obstruction came from the *outer casting meshes themselves*:
- V51 `Upper Cylinder Barrel Casting`
- V51 `Deep Skirt Crankcase Casting`
- related V51 deck/split/bedplate slabs
- V52 large head carrier/casting slabs

In cutaway mode V51/V52 set their cast materials to `transparent=true` with low opacity rather than physically removing the near-side casting. Because these pieces are large `BoxGeometry` meshes with warm red casting material, their projected front/back faces merge into a broad salmon overlay at oblique mobile camera angles. V54/V55 section-slab guards did not classify them as section-like, so they survived.

## V56 fix
- Wraps the latest V55 hard-section guard.
- Keeps legacy V50 `Cast Iron Cylinder Block` and `Crossflow Cylinder Head` permanently hidden once V51/V52 detailed replacements exist.
- During cutaway, suppresses the large V51/V52 outer casting slabs while retaining internal liners, five-main-bearing structure, oil galleries, cranktrain, valve train, ports, injectors and V54 perimeter cut lips.
- Neutralizes remaining casting color toward graphite so normal solid view no longer produces an exaggerated salmon mass.
- Adds a safety scan: any very large warm-colored transparent mesh (largest dimensions >260 and >120 scene units, opacity <=0.55) is suppressed in cutaway.
- Re-applies the guard after cutaway/reset/explode/system interactions and for the startup stabilization window so older nested handlers cannot immediately re-enable the offending meshes.

## Runtime QA added
`window.__v56Debug` checks:
- detailed casting meshes were found;
- legacy V50 coarse block/head are off;
- exact large V51/V52 outer casting slabs are off while cutaway is active;
- zero remaining visible large warm transparent overlays.

## Validation status
Source-level causal chain is verified from V50/V51/V52 implementation. The new V56 file and default index were written successfully to GitHub. This automation environment does not provide an interactive browser/WebGL screenshot runner, so the exact user mobile camera angle has **not** been visually re-captured here. Do not claim full visual closure until the deployed page is checked from the same angle.

## Remaining global acceptance gaps
The project is not yet accepted as exceeding the uploaded reference video. Several high-level requirements remain only partially validated, especially a full visual comparison against `video_20260814_015807.mp4`, OEM-like dismantling hierarchy, complete pressure/temperature instrumentation and P–V synchronization, and long-run mobile interaction/performance regression. V56 addresses the blocking red cutaway occlusion first.