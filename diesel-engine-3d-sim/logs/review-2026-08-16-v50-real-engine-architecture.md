# V50 · Real Engine Architecture Review

Date: 2026-08-16

## Goal

Replace the increasingly synthetic teaching/demo exterior with a production-diesel-like architecture based on public OEM technical material. The primary external-layout reference for this round is DEUTZ TCD 3.6 L4. Yanmar 4TNV98CT, Perkins 904J-E36TA, Kubota V3800-CR-TIEF4H and John Deere 4045 HPCR were used only as cross-checks for common modern four-cylinder diesel architecture.

## Public reference evidence used

- DEUTZ TCD 3.6 L4 official product/data sheet: inline 4, 3.6 L, turbocharger with charge-air cooler, up to 105 kW / 550 Nm, published envelope about 724 x 629 x 972 mm in the 2026 agricultural sheet; official imagery shows front fan/accessory drive, top-mounted aftertreatment, service filters and compact inline layout.
- DEUTZ official product page: common-rail injection, cooled external EGR, charge-air cooling and modular aftertreatment.
- Yanmar 4TNV98CT official page/catalog: four cylinders, 3.319 L, 98 x 110 mm, turbocharged, direct injection/common rail, cooled EGR, DPF. Catalog cutaway confirms the common-rail / injector / EGR / DPF architecture used as a family-level internal cross-check.
- Perkins 904J-E36TA official page: inline four, 3.6 L, 98 x 120 mm, 17:1, turbocharged aftercooled, direct injection and liquid cooling.
- Kubota V3800-CR-TIEF4H official page: four-cylinder vertical water-cooled diesel, common rail, turbo/aftercooler and DOC+DPF+SCR.
- John Deere 4045 official product information: four-cylinder HPCR and four-valve cross-flow variants.

## Important geometry correction

Previous synthetic layers had timing/front-drive geometry positioned on a side face. V50 adopts a physically coherent coordinate convention:

- crankshaft axis = X
- front accessory / fan end = -X
- flywheel / starter end = +X
- intake side = +Z
- exhaust / turbo side = -Z

This is a major structural correction rather than a cosmetic detail pass.

## V50 implementation

New stable candidate: `versions/v50-real-tcd36-architecture-stable.html`

The default real-reference layer now includes:

- cast-iron block, cross-flow head, rocker cover and deep sump proportions
- front crank damper, water-pump pulley, alternator pulley/body, automatic tensioner, multi-rib belt and 8-blade engine fan
- rear flywheel housing, flywheel/ring gear and starter
- longitudinal high-pressure common rail, four injectors, four high-pressure pipes, rail-pressure sensor/limiter and leak-off line
- intake plenum with four cylinder runners and throttle/EGR mixer
- four-branch exhaust manifold feeding one turbocharger
- cooled EGR module and return/feed routing
- top-mounted DOC/DPF canister with band clamps, cones/caps and turbo-to-DOC pipe
- water-pump housing, coolant crossover and thermostat housing
- full-flow oil filter, primary fuel/water separator, secondary fuel filter and ECU
- solid red cut-section edges
- system visibility mapping, physically directed explode offsets, hover metadata and fan animation

The deliberately generic V48/V49 exterior add-on roots are hidden in the V50 real-reference default view so the new production-inspired layout is not mixed with contradictory geometry. The older deep runtime remains underneath to preserve piston/rod/valve/thermodynamic interaction while the exterior is rebuilt.

## QA / limitations

A first experimental V50 file was created with a JavaScript typo in the cutaway opacity expression. It was NOT promoted. A corrected stable candidate was created as `v50-real-tcd36-architecture-stable.html` and only that file is mapped from the default V50 entry.

The stable candidate contains an internal `__v50Debug` regression covering reference root creation, front/rear drivetrain orientation, common rail, DOC/DPF, cross-flow intake/exhaust presence, explode front/rear motion and Gas/Fuel system isolation.

No claim is made that this is DEUTZ manufacturing CAD. Public brochures/data sheets do not expose proprietary surface geometry, tolerances, internal oil galleries, exact casting cores or full OEM assembly drawings. V50 follows public dimensions and component architecture and is a visual/educational digital model.

Independent Chromium/WebGL screenshot validation and direct comparison with the user's primary uploaded reference video remain required before declaring completion or benchmark superiority.
