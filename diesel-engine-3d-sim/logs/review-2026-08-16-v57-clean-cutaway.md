# V57 Clean Cutaway Review

## Trigger
User confirmed the previous V54/V56 fixes still left two visually disruptive artifacts in mobile cutaway view:
1. large pink/salmon translucent walls;
2. thin broken red section outlines.
The user explicitly requested that both visual conventions be removed entirely so the mechanical structure remains unobstructed.

## Policy change
V57 no longer uses red/pink cutaway highlighting at all. Cutaway now communicates sectioning only by hiding the outer shell and exposing the real internal components.

## Implementation
- V57 wraps V53 directly rather than stacking the V54/V56 red-overlay repair wrappers.
- Permanently disables all known section-highlight groups:
  - `V28 Machined Section Faces`
  - `V50 Section Faces`
  - `V51 Block Section Faces`
  - `V52 Head Section Faces`
  - `V53 Cranktrain Section Faces`
- Hides every visible red/pink `Line` / `LineSegments` overlay found in the live Three.js scene.
- Hides any red/pink mesh whose own name or parent indicates section face/edge/reference/cut lip/cut edge.
- In cutaway mode, hides large warm translucent meshes that could form a pink wall.
- Keeps coarse legacy V50 block/head permanently off once the detailed replacements exist.
- Recolors the remaining detailed V51/V52 outer shell meshes to graphite and makes them opaque in normal solid view.
- In cutaway mode, those outer shell meshes are hidden instead of made transparent.
- Re-applies the cleanup after cutaway/reset/explode/system interactions and during startup stabilization.
- Old version QA/reference badges are hidden so the mobile viewport is less cluttered.

## Runtime QA
`window.__v57Debug` checks that the scene contains:
- zero visible known section-highlight groups;
- zero visible red/pink line overlays;
- zero visible red/pink section-overlay meshes;
- zero large pink translucent walls while cutaway is active.

## Validation
- V57 inline JavaScript was extracted locally and passed `node --check` before upload.
- `v57-clean-cutaway.html` was written successfully.
- default `diesel-engine-3d-sim/index.html` now points to V57.
- No claim is made that the exact mobile angle is visually closed until the user re-tests the deployed page.

## Next work
After this visual blocker is accepted, resume the planned official-reference mechanical detail iteration, starting with the real front accessory/timing drive package.