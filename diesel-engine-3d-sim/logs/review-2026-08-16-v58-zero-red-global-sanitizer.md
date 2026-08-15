# V58 Zero Red Global Sanitizer Review

## Trigger
User supplied another mobile screenshot showing that large salmon/red surfaces and thin red outline fragments were still visible after V57. The request is now explicit: remove all of these red/pink section-display artifacts entirely and repeatedly verify they do not return.

## Why V57 was not sufficient
V57 hid known section groups and large red transparent meshes, but older nested layers can still change visibility/material state asynchronously. In particular V51 owns a shared saturated red casting material (`0x852a25`) and a red cut material (`0xff3b30`); its cutaway handler sets the casting material transparent and re-enables its section group. A name-based one-pass cleanup is therefore not a strong enough invariant.

## V58 policy
V58 uses a global no-red scene invariant rather than another list of individual bad meshes:
- all known section/cut groups are disabled;
- every visible scene object is audited for red/pink material hue;
- red line/line-segment/point/sprite objects are hidden;
- red broad/translucent meshes are hidden;
- any remaining small legitimate mesh that still uses a red/pink material is recolored to neutral graphite/steel;
- red emissive channels are cleared;
- outer block/head shell meshes are neutralized in solid mode and hidden in cutaway so internals are exposed without translucent walls;
- known legacy coarse block/head objects remain off;
- previous V49-V57 QA/reference overlays are hidden to reduce mobile clutter.

## Repeated verification
The page does not reveal the 3D canvas until it has passed **six consecutive full-scene zero-red audits**. After reveal it runs:
- an aggressive guard every 250 ms for the first 160 passes;
- a continuing 1.8 s watchdog for the lifetime of the page;
- immediate repeated sanitization after cutaway, reset, explode, explode slider, system tabs and visibility checkbox interactions.

The runtime debug object is `window.__v58Debug`. Acceptance counters are:
- `visibleOverlay === 0`
- `visibleRedLines === 0`
- `visibleRedMeshes === 0`
- `visibleRedMaterials === 0`
- `clean === true`

## Validation performed
- V58 inline JavaScript was extracted locally and passed `node --check` before upload.
- V58 was written to GitHub.
- Default index was updated to V58.
- Source-level root cause was rechecked against V51: V51 still contains the saturated red casting and red section materials, so V58 deliberately enforces the no-red invariant at runtime rather than trusting older handlers.

## Visual validation limit
This environment does not provide an independent interactive mobile WebGL screenshot runner. The code now waits for repeated zero-red scene audits before reveal, but the exact user camera angle still requires deployed-device confirmation. Do not claim visual closure until that screenshot is checked.
