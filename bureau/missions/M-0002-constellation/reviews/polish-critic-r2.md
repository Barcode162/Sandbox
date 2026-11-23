# Review — polish-critic — round 2 verification — M-0002

VERDICT: PASS WITH FINDINGS

## Scope reviewed
F-019, F-020, F-022, F-024, F-025, F-030 at base commit d0d51e6. Each is judged against its original "should be".

## Method
Probe plus my own captures at DSF 1 (F1/F5 at 1440, F7 at 1024, F9, F11, F12 timed), 2–4× crops and DOM measurements, all in `evidence/critic/r2v/`.

## Verification (before → after)
| ID | Result | Numbers |
|---|---|---|
| F-019 | **Verified** | Overview halo chroma went from 12–14 to a median of ~26 (Cook) and ~29 (Physicist) in the 6–8 px annulus. Probe: 32/31/26. Reads amber against ice (`F019-F1-vs-F5-heat-x2.jpg`). |
| F-020 | **Verified** | 16 chips on 8 nodes, all ≤16 chars, borderless, 0 over cores or labels. Temperature: 293 K above, 20 °C left, 2 · warm below, per spec (`F020-F5-heat-x3.jpg`). Residual: Room's "18 °C" sits 19 px from Boiling Point's core and 57 px from Room's own. |
| F-022 | **Verified** | At 1024 the row wraps "… → X →" / "Y → Z"; Z no longer orphaned. The trace wraps only at " · " (`F7-1024.jpg`, `F9-1440.jpg`). |
| F-024 | **Verified** | Tea–Temperature 44 px (was ~19); rings 18 px apart. Nearest: Ice at 27 px, still 10 px clear. Tea has its own label (`F024-F12-tea-x4.jpg`). |
| F-025 | **Verified** | At 1024: ✕ spans 275–307, last tab ends at 261, so 14 px clear. At 1440: 17 px right pad. Chip gaps 20/28 px, not 8/12, but no longer cramped. |
| F-030 | **Verified** | Heat minimum core gap 43.6/31.1/44.9 px (≥28). Ring-to-flowchart 52.9/89/135 px (≥40). F9: Simmer's lowest node is 46 px from the S bead. |

**The CEO's question:** letting "while heat is too low" give way to the condition chip is **acceptable**, because the chip says more at the moment of decision.

## Findings filed
| ID | Sev | Title | Where |
|---|---|---|---|
| F-031 | S2 | After Tea is stored, Temperature loses its label and "Stove" reads as its name | F12 and every later Cook overview |

A round-2 regression: Tea took Temperature's label slot (`F12-settled-6000.jpg`).

## Noted, not filed
- **F5 (pre-existing):** Temperature, Room and Boiling Point are unlabelled while the chips are expanded.
- **F9 (S3):** step P5 is unlabelled.

## Five tests
- **Flagship:** close. The one miss is the unnamed hub in F12 and F5.
- **Second-Look:** pass at 3–4× zoom.
- **Stranger:** partial, because the F5 chips orbit a star with no name.
- **Owner:** pass once F-031 is fixed.
- **Ten-second:** pass. F1 reads Heat, then the flowcharts, then the ring.

## Overall assessment
All six findings are verified with numbers. There is one new S2 (F-031) and no S0 or S1.

**Ship readiness:** shippable with findings. F-031 should be fixed first; it is about one priority rule.

## r2 F-031 re-check (8e80f44)
**Verified.** After storing Tea, "Temperature" is labelled at t = 900, 2500 and 6000 ms. It sits on the left side, 15 px from its core, with the glyphs about 4 px clear of the Flame Step ring and the Pot core. It is also labelled after reload. Stove's label no longer lands on Temperature's ring (`r2v/f031/F12-900-x4.jpg`, `F12-6000.jpg`, `F12-reload.jpg`).

The DOM audit at F1, F5, F12 and reload finds 0 labels over cores, 0 text-over-text overlaps and 0 chips over cores (`f031/F1-1440.jpg`, `F5-1440.jpg`).

Still open, and pre-existing: F5 leaves Temperature unlabelled while the chips are expanded. Ice and Stove go unlabelled at F12, and Tea is unlabelled after reload; both are S3.

**Ship readiness:** no open S0, S1 or S2 from polish.
