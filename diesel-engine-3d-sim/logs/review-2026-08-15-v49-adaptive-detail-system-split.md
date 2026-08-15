# V49 Adaptive Detail + System Split — Round Review

Date: 2026-08-15

## Scope
Only `diesel-engine-3d-sim/` was modified. Historical versions were preserved. `index.html` was promoted to V49 after code-level validation.

## Findings from V48
1. V48 mobile runtime improved startup and added a lightweight CAD layer, but its cooling group bundled the radiator/fan and intercooler together. That made system isolation semantically wrong: the intercooler belongs to the charge-air/gas path, not the cooling circuit.
2. The V48 service/oil group remained visible in All mode even when the Oil checkbox was disabled, because its visibility did not honor `checked('oil')`.
3. The mobile bottom dock remained permanently visible, reducing the usable 3D viewport.
4. Mobile detail was fixed rather than device-adaptive: fast phones had no path to recover extra CAD detail, while slower phones received the same added geometry.

## Implemented in V49
- Added a runtime system split that keeps the radiator/fan under Cooling visibility and gives the intercooler Gas visibility, while preserving the existing V48 assembly and explosion behavior.
- Fixed the service/oil group so the Oil checkbox is honored in All and Oil-focused views.
- Added a mobile `系统` button that toggles the bottom system/cycle dock; Model/Control/Parameter modes close the bottom dock so the engine can occupy more of the screen.
- Added a progressive CAD detail group containing injector harness trunk/branches, injector connectors and clamp bolts, instanced head fasteners, crankcase reinforcement ribs, and service hose clamps.
- Added AUTO/HIGH/LOW quality control. AUTO samples frame cadence and enables the V49 detail layer when the device has adequate headroom; slower devices stay in Lite mode.
- Added a compact quality/FPS badge and preserved the non-blocking boot policy: the outer boot is removed as soon as a renderable inner WebGL canvas exists.
- Progressive detail follows explosion movement and hides at deep explosion levels to avoid floating assembled-detail artifacts.

## Validation performed
- The complete V49 inline JavaScript was extracted locally and passed `node --check` before GitHub upload.
- V49 contains runtime QA for: V48 root presence, progressive detail population, real `explodeAmount`, mobile system control creation, Gas→intercooler isolation, Cooling→radiator/fan isolation, Oil checkbox behavior, and the FPS sampler.
- Independent Chromium/WebGL screenshot validation was not available in this round; therefore V49 is not claimed to exceed the primary uploaded MP4 benchmark.

## Remaining blockers
- Real iPhone Safari screen-level validation of touch rotation, panel toggles, tooltip behavior, FPS and GPU load.
- Independent Chromium/WebGL screenshots for default cutaway, system isolation, exploded view and performance overlay.
- Re-read/re-extract the primary uploaded reference MP4 for a fresh frame-by-frame visual comparison before any final completion claim.

## Release
- Version: `versions/v49-adaptive-detail-system-split.html`
- Default stable entry: `diesel-engine-3d-sim/index.html`
