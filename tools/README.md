# `tools/` — the artwork pipeline and the auto-save watcher

None of this ships. Two scripts produce the images and the numbers the site is
built from, so a future change can be re-derived from the artwork instead of
guessed; the third keeps the GitHub mirror in sync.

Run them from the repository root. Python requirements: `Pillow`, `numpy`.

---

| file                | what it does |
| ------------------- | ------------ |
| `build_hero_asset.py` | Re-encodes the three 841 × 1870 masters in `assets/` into `ismot-next/public/hero-phone.webp`, `botanicals.webp` and `benefits.webp` at their native size (WebP q88). It prints each file's real aspect ratio — keep the CSS in sync with it. |
| `measure_hero.py`    | Measures a poster's painted controls (the hero's logo, bag, menu and Order Now, the benefits sheet's Buy Now) so the hotspot percentages can be checked against the artwork rather than nudged by eye. |

Workflow when the client supplies new artwork:

```bash
# 1. save the master over assets/ismot-<name>.png (841 × 1870)
python tools/build_hero_asset.py     # 2. encode to public/
python tools/measure_hero.py         # 3. re-measure any painted control
```

The hotspot tables live in `ismot-next/app/hero.tsx` (`HOTSPOTS`) and
`ismot-next/app/page.tsx` (the benefits sheet). `ismot-next/README.md` documents
the current numbers.

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
