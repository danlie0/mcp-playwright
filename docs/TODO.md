# Action Log & TODOs

## 🔥 2026-01-13 — Crawl + capture across dashboards
Priority: ⭐⭐⭐⭐⭐
Summary: Add a “one command” workflow to crawl same-origin routes (after login) and capture snapshots + responsive screenshots for fast UI QA across SaaS dashboards.

- [ ] 🔥 Add tool `browser_crawl_and_capture` (same-origin, max depth/pages, allow/deny path globs)
- [ ] 🔥 Support `loginUrl` + “post-login start URL” flows (or assume already authenticated)
- [ ] 🔥 For each captured page: `browser_snapshot` + `browser_screenshot_sweep` (desktop/tablet/mobile)
- [ ] 🗂️ Emit a lightweight report file linking artifacts (e.g. `report.md` in output dir)
- [ ] 🧪 Add tests for: link filtering, output paths, and deterministic ordering
- [ ] 🗂️ Document flags + examples in `README.md` and `AGENTS.md`

Links:
- Tools: `extras/browser_screenshot_sweep.js`, `extras/browser_storage_state_save.js`
- Output dir: default `.playwright-mcp/` (or `--output-dir`, `PLAYWRIGHT_MCP_OUTPUT_DIR`)

## ⏫ 2026-01-13 — Visual regression (baseline + diff)
Priority: ⭐⭐⭐⭐
Summary: Make screenshot review actionable by diffing against baselines and saving diff images + a short summary.

- [ ] ⏫ Add tool/script `browser_visual_diff` (baselineDir vs runDir)
- [ ] ⏫ Output: per-page diff image + JSON summary (pass/fail thresholds)
- [ ] 🧭 Decide image comparison strategy (pixelmatch vs Playwright snapshot matcher)
- [ ] 🗂️ Document “golden update” workflow

Links:
- Existing screenshot tool: `browser_take_screenshot`
- Sweep tool: `browser_screenshot_sweep`

## 🟢 2026-01-13 — Improve embedded images in sweep
Priority: ⭐⭐
Summary: Reduce response payload size when `embedImages=true` by scaling/compressing images similarly to Playwright’s built-in screenshot tool.

- [ ] 🟢 Re-implement “scale to fit message” in `extras/browser_screenshot_sweep.js` (png/jpeg)
- [ ] 🟢 Add a max-bytes or max-dimension option (defaults safe)

## ✅ 2026-01-13 — Extra tools + docs groundwork
Priority: ⭐⭐⭐
Summary: Added two convenience tools for UI QA and auth reuse, and documented recommended login patterns for SaaS/dashboard work.

- [x] ✅ Add `browser_screenshot_sweep` tool (desktop/tablet/mobile capture) (`extras/browser_screenshot_sweep.js`)
- [x] ✅ Add `browser_storage_state_save` tool (persist cookies/localStorage) (`extras/browser_storage_state_save.js`)
- [x] ✅ Register extra tools for CLI + programmatic usage (`extras/register-extra-tools.js`, `cli.js`, `index.js`)
- [x] ✅ Document local Codex config + tool usage (`README.md`, `AGENTS.md`)
