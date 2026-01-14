# Playwright MCP (Codex guide)

This repo is a Playwright-based MCP server used by Codex to **browse UIs**, **check responsive layouts**, and **capture artifacts** (snapshots, screenshots, traces).

## What to use for UI review

- Prefer `browser_snapshot` for most “UI looks wrong” debugging. It’s fast and works without a vision model.
- Use screenshots when layout/visual issues matter:
  - `browser_take_screenshot` for one-off captures
  - `browser_screenshot_sweep` (extra tool in this repo) to capture desktop/tablet/mobile in one call

Artifacts are saved under the MCP output directory (default: `.playwright-mcp/` inside the workspace root, unless `--output-dir` is set).

## Viewing artifacts (screenshots, snapshots, storage state)

### Local (recommended for most SaaS dev)

When Codex runs the MCP server locally (stdio), the output folder is on your machine:

- Default: `<your workspace>/.playwright-mcp/`
- Custom: start the server with `--output-dir=/absolute/path/to/artifacts`

You can open that folder in Finder/Explorer, or click file paths/links shown in tool output (when supported by the client).

### One local server for all IDE windows (recommended)

If you keep multiple Cursor/VS Code windows open, run Playwright MCP once as a local HTTP service and point every client at it:

1. Start the server (example):

```bash
npx -y @playwright/mcp@latest --port 8931 --headless --output-dir "$HOME/mcp-artifacts"
```

2. Configure your MCP client with the URL:

```json
{
  "mcpServers": {
    "playwright": { "url": "http://localhost:8931/mcp" }
  }
}
```

Notes:
- With multiple simultaneous clients, prefer `--isolated` (and optionally `--storage-state=...`) to avoid persistent-profile locking.
- `--shared-browser-context` makes all clients share one browser context (convenient for login), but keeps the browser running longer (more RAM).

### Remote (Azure) deployment

If you deploy the MCP server to Azure, `--output-dir` points to the **server’s filesystem**, not your laptop. To avoid “logging into Azure” just to view images, use one of:

- **Inline images in chat**: keep `--image-responses=allow` and run screenshot tools (optionally use `browser_screenshot_sweep` with `embedImages=true`).
- **Artifact hosting**: upload artifacts to object storage and return shareable links (e.g. short-lived signed URLs).
- **Shared filesystem**: write to an Azure Files share mounted on your laptop, so the same folder is visible locally.

Note: extension-based “use my existing logged-in Chrome tab” only works when the MCP server runs on the same machine as that browser.

## Authenticated dashboards (login)

There are 3 recommended patterns, in order:

### 1) Use the browser extension (best for real SaaS sessions)

- Install the “Playwright MCP Bridge” extension and start the server with `--extension`.
- This lets the agent operate on a tab in your existing Chrome profile (already logged in).
- See `extension/README.md`.

### 2) Save and reuse storage state (best for headless + deterministic runs)

1. Log in once (manual or automated).
2. Call `browser_storage_state_save` (extra tool in this repo) to write a `storage-state-*.json` file.
3. Restart the server with `--isolated --storage-state=/absolute/path/to/storage-state.json`.

Tip: store these files under `sessions/` (already gitignored).

### 3) Persistent profile (quickest, but can “mix” apps)

- Run without `--isolated` (default behavior) and keep a dedicated `--user-data-dir` per app/environment.

## Handling credentials safely

If you don’t want to paste credentials into chat, run the server with a secrets file:

- Start server with `--secrets=/absolute/path/to/secrets.env`
- In tool calls, pass secret **names** (e.g. `TEST_EMAIL`, `TEST_PASSWORD`) as the `text` / `value`.
  - `browser_type` and `browser_fill_form` will substitute from the secrets file without echoing the raw values.

Example `secrets.env`:

```env
TEST_EMAIL=test@example.com
TEST_PASSWORD=supersecret
```

## Recommended Codex MCP config

To use this extended local checkout (includes extra tools), point Codex at `cli.js`:

```toml
[mcp_servers.playwright-local]
command = "node"
args = ["/absolute/path/to/mcp-playwright/cli.js", "--headless", "--output-dir=/absolute/path/to/artifacts"]
```

For separate desktop/mobile sessions, configure two servers:

```toml
[mcp_servers.playwright-desktop]
command = "npx"
args = ["@playwright/mcp@latest", "--headless", "--viewport-size=1440x900"]

[mcp_servers.playwright-mobile]
command = "npx"
args = ["@playwright/mcp@latest", "--headless", "--device", "iPhone 15"]
```


## Action Log & TODOs (New)

- **Why**: Persist important decisions, config flags, and next steps across chats so nothing is lost.
- **File**: Maintain a single rolling checklist at `docs/TODO.md`.
- **Also track missing product features** in `docs/TODO_Features.md` using checkboxes: `[-]` for open items and `[x]` when implemented.
- **When to Update**: Whenever adding SDKs/flags, changing flows, making key decisions, or leaving follow‑ups.
- **Format**:
  - Date heading
  - Priority line directly under the heading in the form `Priority: ⭐️…` (1–5 stars)
  - Summary line: 1–2 sentences under the date heading explaining the intent, scope, and desired outcome of the work (prefix with "Summary:" recommended)
  - Bulleted checklist with `[ ]` open and `[x]` done
  - Link to relevant files and env keys
  - Optional: Test notes (how this was or will be verified)

### Priority & Emoji Conventions (New)

- Always order sections by priority, not by creation time. Highest‑priority open items go at the very top of `docs/TODO.md`.
- Prefix sections and bullets with clear emojis to improve scanability:
  - 🔥 High priority, ⏫ Medium, 🟢 Low, 🚧 Blocked, ✅ Done, 🧪 Test, 🗂️ Docs, 🔧 Build/CI, 🧭 Decision.
- When closing an item, keep it in place and mark with `✅` and `[x]` plus a short result.
- If priorities change, reorder the sections so the most important work stays at the top.


## Trigger Prompts (quick actions)

## Planning template (from the screenshot guidance)

- The screenshot says: “Use Agents.md to point Codex to a Plans.md so the agent has a template for writing longer multi-step plans.”
- This repo uses `agent-docs/plan.md` as the ExecPlan template. For complex or multi‑hour work, create or update an ExecPlan using `agent-docs/plan.md` and keep it current as the work progresses.

Trigger: [DOCS]  
**Action:** Read recursivley all files under docs folder

Trigger: [PLAN]  
**Action:** First run the [DOCS] step and scan relevant core files (schema, routes, screens) before drafting an ExecPlan. Then create or update an ExecPlan using `agent-docs/plan.md`. Present the draft plan first and wait for approval before implementation.

Trigger: [AGG]  
**Action:** Run `./scripts/code_aggregator.sh`.


Trigger: [COMP]
**Meaning:** "Comprehensive Analysis & Deep Thought"
**Action:** Before writing any code, stop and think.
- Perform a Chain-of-Thought analysis.
- Break the problem down into logical components.
- Anticipate potential edge cases or logic errors in the user's request.
- Look across as many files as you need to

## Communication & Output

- always write in markdown when talking in the chat
- Be concise, use headings + short lists. No filler.
- If context is missing, ask up to 3 targeted questions; otherwise proceed with sensible defaults and state assumptions.
- If you notice high‑value improvements or forward‑looking ideas while working, proactively call them out clearly and ask whether to implement them (keep it brief; avoid “nice-to-haves” unless truly valuable).
- **Forward-thinking mode (required):** when you spot a worthwhile idea (UX fix, quality gate, missing feature, tech debt cleanup with strong ROI), do BOTH:
  - Tell me in-chat in a small section named **“💡 Opportunities”** with **1–3 bullets max** (each bullet: *why it matters* + *rough scope* + *ask if I want it now*).
  - Log it as an open checkbox `[-]` in `docs/TODO_Features.md` (or `docs/TODO.md` if it’s operational/tech debt), including links to relevant files.
- If I asked a direct question, answer the question only (no extras). If you still have Opportunities, log them in `docs/TODO_Features.md` and wait for me to ask.
- Always add a TL:DR at the bottom.
- Always add emojis and structure your output well when talking to me. Use plain simple english.
- when i ask you a question. Just answer the question. 
-  **Critical Queries:** If you need my input or approval, prefix and suffix your question with 🚨🚨 (e.g., "🚨🚨 Shall I proceed with the deletion? 🚨🚨").
- if i ask you a quesiton. Answer the question only. 
