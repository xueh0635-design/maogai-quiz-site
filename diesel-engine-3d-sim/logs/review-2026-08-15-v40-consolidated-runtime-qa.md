# V40 Consolidated Runtime QA — 2026-08-15

## Scope
Review latest four-stroke inline-4 diesel 3D simulation against the project acceptance matrix and preserved evidence from the primary uploaded reference video `video_20260814_015807.mp4` / BV1kLgs6vETz.

## Latest pre-existing stable version
V39 `versions/v39-state-safe-runtime-qa.html` was the previous default. It inherited V37, which inherited V35, producing an unnecessarily deep runtime wrapper chain. V39 did add useful state-safe QA, drag, phase, P–V, hover and exploded-flow checks, but chain depth remained a startup/stability risk.

## Defect selected for this iteration
Highest-priority engineering defect: wrapper depth and duplicated runtime QA layers. V39 -> V37 -> V35 meant the newest QA and corrected-flow logic were spread across multiple nested wrappers. This increases initialization latency and creates more failure points even though the underlying V35 mechanical assembly is already the dominant geometry layer.

## Implemented in V40
- New `versions/v40-consolidated-runtime-qa.html` directly inherits V35 instead of V39/V37.
- Re-implements corrected coolant, lubrication-oil and high-pressure-fuel streams directly in V40.
- Preserves system-isolated visibility using current system focus + system checkboxes.
- Preserves exploded-view flow policy: fade during shallow explosion and hide assembly-state flow above deep explosion.
- Preserves state-safe QA: crank angle, play/pause state and explosion amount are restored after automated tests.
- Automated runtime checks include: WebGL/canvas presence, industrial V35 base, mesh-density threshold, real P–V canvas variance, four stroke phase probes at 90/270/450/630 deg, intake/exhaust valve opening probes, explosion-flow synchronization, multi-view camera movement, synthetic OrbitControls drag, hover information card, animation frame progress and wrapper depth.
- Default view remains front cutaway.

## Acceptance matrix status
- Structural completeness: PARTIAL. Industrial assembly, half-shell cutaway, DOHC/16V, common rail, four-branch exhaust, turbo, accessory drive, oil/coolant service hardware exist, but manufacturing-grade CAD fidelity is not proven.
- Disassembly hierarchy: IMPLEMENTED, screen-level final visual quality still requires independent browser evidence.
- Crank/rod timing: IMPLEMENTED by base runtime; V40 probes 720-deg stroke sequence.
- Valvetrain timing: IMPLEMENTED; V40 probes intake/exhaust opening states.
- Fuel flow: IMPLEMENTED and isolated.
- Lubrication flow: IMPLEMENTED and isolated.
- Coolant flow: IMPLEMENTED and isolated.
- PBR: IMPLEMENTED by Studio PBR / MeshPhysicalMaterial layers; final visual parity not independently screenshot-verified.
- Cutaway/exploded view: IMPLEMENTED; V40 keeps front cutaway default and tests explosion-flow behavior.
- Multiple views: IMPLEMENTED and camera movement tested programmatically.
- Hover info cards: IMPLEMENTED and synthetic hover probe included.
- Live status: IMPLEMENTED by base runtime.
- Pressure/temperature/P–V: IMPLEMENTED; V40 verifies P–V canvas contains rendered variance.
- Performance metrics: IMPLEMENTED by base runtime.
- Interaction experience: PARTIAL. Synthetic drag and button/view checks exist, but real user-perceived responsiveness/FPS remains unverified.

## Reference-video evidence boundary
Primary acceptance reference remains the user-uploaded `video_20260814_015807.mp4`. Preserved prior review evidence records approximately 50.917 s, 2400x1080, 24 FPS and representative stages including transparent cutaway + info card, subsystem disassembly with radiator, exposed internal mechanism, deep exploded view, and continuously visible live parameters/P–V. The raw MP4 was not re-read in this run, so V40 is NOT claimed to meet or exceed the video visually.

## Validation performed
- GitHub write of V40 succeeded.
- Stable `diesel-engine-3d-sim/index.html` was updated to V40 and historical V25–V39 routes were retained.
- V40 contains in-page `window.__v40Debug` runtime results, including iframe depth.
- Independent Chromium/WebGL screenshot capture was not available in this run, so final screen composition, real hover hit accuracy, visual explosion hierarchy, actual FPS, and mobile Safari/GPU behavior remain unverified.

## Release decision
V40 is promoted as the newest stable entry because it reduces duplicated wrapper layers while preserving the latest corrected flow and state-safe QA behavior. Project is NOT complete. No claim of exceeding the primary reference video is made.
