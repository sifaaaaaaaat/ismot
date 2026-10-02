# `tools/` — measurement scripts and the auto-save watcher

None of this ships. These scripts exist to **produce the numbers the hero's CSS
is derived from**, so a future change can be re-derived from evidence instead of
guessed. Run them from the repository root.

Python requirements: `Pillow`, `numpy`; `probe.py` and `grid_overlay.py`
additionally need `opencv-python`. **`scipy` is not installed.**

---

## Live assets (`ismot-next/public/`)

| script            | what it measures |
| ----------------- | ---------------- |
| `ink_profile.py`  | The bottle's **real ink footprint** in `bottle.webp`, both upright and rotated 12° (the CSS tilt), plus its horizontal extent per vertical band. Sizing the stage from ink rather than the bounding box is what keeps the bottle large — the box keeps the transparent corners the tilt creates. |
| `orb_profile.py`  | The radial alpha profile of `circle-white.webp`. It confirms the disc is **hard-edged** (alpha ≈ 0.59 out to r = 0.90, then a sharp drop to 0 at r = 1.0), which is why the orb must never be clipped by a short composition. |

## Layout model

| script          | what it does |
| --------------- | ------------ |
| `stage_fit.py`  | Models stage size against viewport size and prints the three clearances that matter — stage under the nav, bottle-to-copy, bottle-to-right-column — with an `OK` / `OVERLAP` verdict per size. This is the table that shows the hero is clear at every desktop size **≥ ~1100 px wide** and that below that the two copy columns collide regardless of stage size. |

`stage_fit.py` encodes an earlier, coarser version of the sizing formula. The
constants actually shipped in `ismot-next/app/globals.css` (`--stage`,
`--stage-top`, `--band-top`) are the refined result and remain the **source of
truth**; use the script to explore, not to overrule the CSS.

## Legacy v1 artwork (`assets/`)

| script            | what it does |
| ----------------- | ------------ |
| `probe.py`        | Compares `assets/base-empty.webp` against the source photo `assets/ismot-hero.jpg` region by region and writes a side-by-side crop sheet to `probe_crops.jpg`. Used to check how cleanly the layer artwork was lifted out of the photograph. |
| `grid_overlay.py` | Draws a labelled 100 px coordinate grid over the master photo so rectangles can be read off by eye. Output: `grid_overlay.jpg`. |
| `build_assets.py` | The script that cut the v1 layer assets (bottle, cards, nav items, splash shapes, typography) out of the master photo. |

These belong to the pre-framework version of the site at the repository root and
are kept for provenance.

## Screenshot analysis

| script             | what it does |
| ------------------ | ------------ |
| `analyze_annot.py` | Finds the black annotation strokes in one of the designer's marked-up screenshots and reports their connected components. |
| `analyze_right.py` | Measures the dark-green text bands of the right-hand column in the same screenshot and fits the two guide-stroke slopes. |

> **Caveat:** both hard-code an absolute path into the user's OneDrive
> `Screenshots` folder, so they only run on the original machine. Update the
> `SRC` constant — or better, pass the image as an argument — before reusing
> them elsewhere.

Debug overlays and contact sheets these scripts produced are committed next to
them (`probe_crops.jpg`, `grid_overlay.jpg`, `ref_sheet.jpg`, `base_preview.jpg`,
`product_check.jpg`, `right_col_check.png`, `debug_sheet.jpg`, `pocket_debug.png`)
— they are the visual record behind the numbers.

---

## `autosave.mjs` — keep the remote in sync

A Node file watcher: when the working tree has been quiet for 15 s it commits
everything and pushes.

```bash
node tools/autosave.mjs                              # default 15 s debounce
AUTOSAVE_DEBOUNCE_MS=30000 node tools/autosave.mjs   # slower
AUTOSAVE_REMOTE=upstream node tools/autosave.mjs     # different remote
```

It filters out everything `.gitignore` covers *before* touching git, so
`node_modules/` and `.next/` churn never causes a commit. It never rewrites
history, never force-pushes, and if a push fails (offline, credentials) the
commit is kept and the push is retried on the next quiet period.

The same script is also runnable anywhere Node runs, since it resolves the
repository root from its own location rather than the current directory.
