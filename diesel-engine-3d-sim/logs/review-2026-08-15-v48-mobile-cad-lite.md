# V48 · Mobile CAD Lite · Round Review

Date: 2026-08-15

## Starting point

The repository default entry was already V47 Adaptive Mobile Stable when this round began. V47 solved the indefinite mobile loading blocker by using V34 on phones and keeping V46 for full/desktop mode, with V25 fallback. The remaining high-impact problem was that the phone-safe path sacrificed much of the later CAD density: a phone could boot more reliably but would mostly see the shallower V34 geometry instead of the richer cooling/service/CAD assemblies.

## Highest-impact change implemented

V48 keeps the shallow mobile runtime policy but injects a lightweight CAD detail layer directly into the deepest V34/V25 Three.js scene instead of adding another nested iframe chain.

Mobile CAD-lite additions:
- common rail, four high-pressure lines, four rail fittings, rail pressure sensor and relief valve;
- intake plenum, four intake runners and charge-air coupler;
- visible crank/cam/idler timing drive elements;
- lightweight radiator assembly with 42 InstancedMesh fins;
- 7-blade cooling fan and shroud;
- intercooler module;
- full-flow oil filter head plus feed/return hard lines;
- red physical cutaway lip;
- system visibility mapping for fuel / gas / cooling / motion / oil;
- real explodeAmount linkage for the new assemblies.

## Mobile interaction/UI fix

On coarse-pointer / <=900 px devices the large desktop side panels are hidden by default so the 3D engine keeps the screen. A compact floating switcher provides Model / Controls / Parameters modes and opens the left or right panel as an overlay when needed. Bottom controls are compacted. Reference callouts are hidden on narrow screens to reduce obstruction.

A short tap on a V48-added mechanical component now opens the engineering information card. Pointer movement greater than 9 px is treated as a drag, so normal OrbitControls gestures are not intentionally converted into part selection.

## Startup architecture

- Mobile default: V48 wrapper -> V34 -> V32 -> V25.
- If the mobile dynamic runtime does not produce a renderable canvas within the watchdog limit, V48 falls back to V25 and still retries direct CAD-lite injection.
- Desktop / ?full=1 keeps the richer V46 path.
- No additional nested CAD wrapper was introduced for the mobile detail layer.

This specifically improves the tradeoff created by V47: mobile stability no longer requires dropping all later visible mechanical detail.

## Verification performed

- The V48 inline JavaScript was extracted locally and passed `node --check` before GitHub write.
- GitHub create/update operations completed successfully.
- Default index was updated only after the V48 file was created.

Limitations: no independent real iPhone Safari/WebGL screenshot run was available in this round. A canvas-presence watchdog is not equivalent to validating rendered pixels, FPS, touch feel, or GPU stability. The primary uploaded MP4 was not re-read byte-for-byte in this round, so this review does not claim benchmark superiority or final completion.

## Acceptance status after V48

Structural completeness: improved on the phone-safe path, still below manufacturing CAD evidence.
Exploded hierarchy: V48 additions follow the real explodeAmount control.
Crank/valve timing: inherited from V34 dynamic runtime; visible lightweight timing hardware added.
Fuel/oil/cooling/gas: inherited dynamic systems plus new visible service hardware.
PBR/cutaway/views/status/P-V/performance: inherited from the existing runtime.
Hover/touch info: desktop inherited; V48 parts additionally support short-tap information cards on touch devices.
Performance: radiator fins are instanced and geometry segment counts are intentionally lower on mobile; real FPS still unverified.

## Repository writes

- V48 version commit: d28f3635bf7fc049e09b3ca13c1648eef130a9e1
- Stable index promotion commit: 385cedfa1c9c962bd26a4d7ed349cbbcc02903ff

Conclusion: NOT FINAL. V48 is a mobile-focused recovery of visible mechanical density while preserving the shallower, safer startup path. Independent iPhone Safari screenshot/FPS/touch validation remains a blocking acceptance item.
