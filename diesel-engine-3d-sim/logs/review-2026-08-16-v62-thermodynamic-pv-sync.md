# V62 Thermodynamic / P–V Sync Review

## Baseline reviewed
Latest project baseline before this round: `v61-cooling-turbo-pack.html`, which adds radiator/fan, turbocharger, manifolds, charge/coolant/oil pipes and related mounts on top of the V59 zero-red guard chain.

The primary visual benchmark remains the user-uploaded `video_20260814_015807.mp4`. Exact same-camera re-capture of the uploaded video is not available in this automation runtime, so this review does **not** claim visual superiority over the reference. Web search for BV1kLgs6vETz / o4UzlBJ did not reliably retrieve the exact benchmark, so the uploaded video remains the authoritative target.

## Acceptance review
- Structural completeness: improved through V61; still procedural CAD-like rather than OEM CAD. Front/rear accessory drive, flywheel housing, radiator/fan, turbo, manifolds and service pipes are represented.
- Disassembly hierarchy: multi-system exploded movement exists, but not every fastener/part has an OEM assembly hierarchy.
- Crank/rod and valve phase: base engine implements 720° cycle and 1-3-4-2 phase offsets `[0,540,180,360]`; camshaft relationship and valve lifts are present.
- Fuel/oil/cooling flow: particle/flow paths and system-specific visibility exist; V61 adds turbo oil and coolant/charge-air hardware.
- PBR/materials: neutral engineering PBR is present; V59 zero-red guard remains inherited. No new red/pink section material was introduced in V62.
- Cutaway/exploded views: present; V59+ removes red/pink section overlays and exposes internals by hiding shell geometry.
- Multi-view: front/side/top/iso controls present.
- Hover info: raycast tooltip metadata is present and extended through V61.
- Real-time state: RPM, load, crank angle, phase, per-cylinder state and performance readouts exist.
- Pressure/temperature/P–V: this was the most important remaining numerical inconsistency. The old V25 thermodynamic function capped the chart around 75 bar and used an intentionally simplified curve. V62 replaces the visible pressure/temperature/P–V presentation with a single synchronized model.
- Performance/mobile: source-level mobile adaptations and runtime counters exist, but real-device 5–10 minute FPS/memory/touch regression remains unverified.

## V62 implementation
V62 wraps V61 and adds a synchronized educational turbo-diesel thermodynamic model:
- Compression ratio 17.2.
- Slider-crank volume relation using crank radius 60 and rod length 200 scene/reference units.
- Load/RPM dependent boost pressure.
- Polytropic compression (`n≈1.34`) and expansion (`n≈1.27`).
- Injection/combustion pressure rise around 348–382° local crank angle.
- Peak cylinder-pressure envelope about 88–158 bar depending on load/boost, with a 175 bar chart ceiling.
- Peak gas-temperature envelope about 1650–2280 K.
- Load/RPM-linked coolant temperature, oil temperature, oil pressure, torque, power, BSFC and thermal-efficiency readouts.
- Four cylinder pressure strip uses the same model and the existing phase offsets.
- The original P–V canvas is hidden and replaced by a V62 overlay generated from exactly the same thermodynamic function used by the numeric readouts, so the marker and curve cannot diverge from the displayed cylinder pressure.

## QA performed
Before upload, the complete V62 inline JavaScript was extracted and checked with `node --check`; syntax passed.

Runtime QA embedded in V62 checks:
- finite/positive P, T and V across a 720° sweep;
- compression pressure rise;
- expansion pressure fall;
- plausible pressure/temperature range at 25/50/75/100% load;
- existence of the replacement P–V canvas;
- inherited V61 and V59 QA are not explicitly failed.

`window.__v62Debug` exposes live model values and QA state.

## Known limitations / not yet accepted
1. The V62 thermodynamic model is physics-consistent for education/visualization but is **not** calibrated against measured DEUTZ TCD 3.6 in-cylinder pressure traces or an OEM ECU map.
2. Exact same-camera comparison against `video_20260814_015807.mp4` was not possible in this run.
3. Real-phone 5–10 minute performance, memory and gesture stability have not been measured in this run.
4. Procedural geometry still does not equal a full OEM CAD assembly/disassembly tree.

Therefore the project is **not complete** and must not be reported as exceeding the benchmark yet.

## Files changed this round
Only `diesel-engine-3d-sim/` was modified:
- `versions/v62-thermodynamic-pv-sync.html`
- `index.html`
- this review log
