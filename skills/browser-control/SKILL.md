---
name: browser-control
description: Route web-browser automation, web QA, authenticated-session debugging, screenshots, scraping, and form workflows through Agent Browser, Playwright CLI, Chrome DevTools MCP, or Browser Use. Use when the user asks Codex to control a website, test a web app, inspect a live Chrome session, collect page data, or complete a browser-based task.
---

# Browser Control

Use an API, connector, or domain CLI instead of browser automation whenever it can complete the semantic operation. For example, use `feishu-cli` for Feishu data rather than driving its UI.

## Select one engine

Choose the narrowest engine that fits. Do not try multiple engines for the same write action merely because one is available.

1. Use **Chrome DevTools MCP** when the user explicitly wants their existing Chrome session, an authenticated tab, Chrome DevTools/Network/Performance diagnosis, or manual-to-agent handoff. Require the user to enable `chrome://inspect/#remote-debugging` and accept Chrome's connection prompt. Use `chrome-devtools-mcp --autoConnect` only after that consent.
2. Use **Agent Browser** for the default unattended browser task: navigation, structured extraction, forms, screenshots, repeatable page interaction, and basic headless QA. Use its accessibility snapshot refs rather than brittle CSS/XPath selectors.
3. Use **Playwright CLI** for deterministic local-web QA, cross-browser coverage, traceable test reproduction, network inspection, or a scripted workflow to preserve in the repository. Prefer role/label/test-id targets and assertions; save traces/screenshots when debugging failures.
4. Use **Browser Use** for long-horizon, exploratory goals whose path cannot be enumerated upfront, such as comparing many sites or navigating a variable multi-step flow. Prefer its local CLI for one-off agent tasks and its Python library only for product code, scheduled runs, or parallel execution. Never configure a paid cloud/API key without the user's approval.

If an engine cannot access the site, explain the blocker before changing engines. For a read-only task, fall back in the listed order that matches the task. For a write action (submit, send, buy, delete, permission change), first establish that no earlier engine completed it; otherwise ask before retrying.

## Target allowlist

Before the first navigation, classify every target origin. Permit only:

- `localhost`, `127.0.0.1`, or `[::1]` for local development;
- an exact origin the user supplied or approved for this task; or
- an exact host listed in `BROWSER_ALLOWED_DOMAINS` (comma-separated personal defaults).

Do not treat a broad parent domain as approval for every subdomain. Re-check the allowlist after redirects, SSO handoffs, downloads that open a new origin, or cross-origin iframes. Ask before navigating to an unapproved origin. Read `references/target-policy.md` when defining or changing an allowlist.

## Login-state selection

Use a fresh, isolated browser context by default. Reuse a personal logged-in session only when the task needs it or the user explicitly asks:

- Select **Chrome DevTools MCP** or local **Browser Use** only for the user-approved Chrome profile and a specified tab/site.
- Stop at password, MFA, consent, payment, or ambiguous-account screens. Never choose an account, enter a secret, or export cookie/storage data without explicit instruction.
- Keep an authenticated task on its selected profile. Do not silently transfer its state to another engine or cloud browser.

## Audit every browser operation

Before a browser navigation or interaction, record an `started` event. Record a final `success`, `failed`, `blocked`, or `cancelled` event after verification. Use the bundled script; it stores only metadata, the target origin (never the path/query), operation category, risk, and outcome.

```sh
node <skill-dir>/scripts/log-browser-audit.mjs \
  --engine agent-browser --action navigate --target https://example.com \
  --risk read --outcome started
```

By default, the log is `.agent/browser-audit.jsonl` in the active workspace. Pass `--workspace <path>` only when the task is intentionally scoped elsewhere. Never place credentials, page text, cookies, tokens, query parameters, or screenshots in audit events.

## Common workflow

1. State the target site, intended action, and whether it changes external state.
2. For write, financial, publishing, deletion, credential, or permission actions, confirm exact target and scope before the final submission.
3. Navigate, then inspect the current page state before interacting. Do not invent selectors or element refs.
4. Re-inspect after navigation or a dynamic DOM update. Prefer semantic locators and accessibility refs.
5. Verify the outcome using a visible confirmation, changed state, URL, returned identifier, or saved artifact.
6. Report the outcome and link/artifact. Never reveal cookies, passwords, tokens, or raw session storage.

## Engine runbooks

### Agent Browser

Run `agent-browser doctor --offline --quick` first if setup is uncertain. Follow this loop:

```sh
agent-browser open <url>
agent-browser snapshot -i
agent-browser click @e1
agent-browser snapshot -i
```

Use `fill`, `press`, `wait --load networkidle`, `get text`, and `screenshot` as needed. Use `batch --bail` only for independent, safe steps. Do not read, export, or copy browser cookies/storage unless the user explicitly requests it.

If Chrome exits before exposing a debugging port, do not keep retrying with different flags. Report the host-runtime limitation and, only with user approval, use Chrome DevTools MCP against an already-open Chrome session instead.

### Playwright CLI

Start with `playwright-cli open <url>` and `playwright-cli snapshot`. Use it for local app verification when an interaction needs a durable reproduction. Run the project test suite when it exists; use a fresh profile unless the task explicitly requires a user session. Keep generated screenshots, PDFs, or traces in the workspace's approved output location.

If the Playwright daemon or launched Chrome is blocked by the host runtime, preserve the failing command and error summary. Do not silently rerun the same scenario through another engine if it may have changed remote state.

### Chrome DevTools MCP

Use only after explicit user intent for their Chrome/session or debugging context. Chrome 144+ requires the user to enable remote debugging at `chrome://inspect/#remote-debugging` and approve each incoming debugging connection. Treat this as sensitive: an authenticated session can expose private data and perform actions as the user. Reuse the selected page or network request; do not inspect unrelated tabs, cookies, password data, or history.

### Browser Use

Check `browser-use --help` and the installed skill before use. Ask for confirmation before any action that would use a hosted Browser Use model, cloud browser, proxy, CAPTCHA service, or paid API key. Do not provide credentials to a third-party browser provider without explicit approval.

## Diagnose before retrying

| Signal | Action |
| --- | --- |
| CLI/MCP unavailable | Report the missing dependency and use another eligible engine only for a safe read-only task. |
| Chrome exits before attaching | Run the relevant `doctor`; preserve its result. Do not churn launch flags. Offer Chrome DevTools MCP only with user approval. |
| Login, MFA, account picker, or consent | Stop and ask the user to complete or select it. |
| Stale ref or changed DOM | Re-snapshot, re-evaluate the target, then continue. |
| Network/server error | Capture the smallest useful console/network evidence and report the failing request/URL origin. |
| Submission status unclear | Log `blocked`; inspect visible confirmation/history before any retry. |

## Safety and recovery

- Never bypass CAPTCHA, authentication, paywalls, rate limits, or access controls.
- Never submit a form twice. When the status is ambiguous, inspect history/confirmation before retrying.
- Avoid coordinate clicks unless accessibility/semantic control is unavailable; take a screenshot first.
- Close unattended sessions after the task unless the user asks to preserve them.
- For a failing local app, collect the smallest useful evidence: failing step, screenshot, console/network error, and reproducible command.
