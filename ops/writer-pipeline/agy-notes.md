# Antigravity writer adapter (`agy`)

`agy` (zsh launcher) + `agy.mjs` (Node). Keep them together. Calls `~/.gemini/antigravity/bin/agentapi` (override with `AGY_AGENTAPI`).

```sh
agy --models
agy --diagnose [--refresh-project]
agy --model pro|flash|flash_lite --output /abs/new-file [--prompt-file /abs/prompt.txt] [--timeout 600] [--json] 'prompt'
```

## How it works (verified live 2026-10-18)

1. **Discovery.** Uses `ANTIGRAVITY_LS_ADDRESS` / `ANTIGRAVITY_CSRF_TOKEN` if set; otherwise reads the running `language_server` process arguments (CSRF token kept in memory only, never printed or written), lists that PID's loopback ports with `lsof` and keeps the one that answers `ListProjects` over HTTP.
2. **Project ID, cwd-independent.** Resolution order: `ANTIGRAVITY_PROJECT_ID` env → cached `~/.config/nexualpha/agy.json` (`AGY_CONFIG` overrides; mode 0600; holds only `projectId`, `workspace`, `resolvedAt`) → project whose folder contains cwd → default workspace `/Users/bestberlin/Documents/ChatGPT/Crypto聚合`. The first successful match is cached, so launchd and any cwd work. `--refresh-project` re-resolves. Current project: `ffb81e73-b2f5-49a4-8509-eb7af9c08181` (Crypto聚合).
3. **Start.** `agentapi new-conversation --model=<alias>` prints `{"response":{"newConversation":{"prompt":…,"conversationId":"<uuid>"}}}`. (The old parser looked only at top-level keys → "Unrecognized new-conversation response".)
4. **Wait.** `get-conversation-metadata` confirms the conversation exists, but it carries **no run status** (workspace, projectId, planModel only). Completion is read from the language server's `GetCascadeTrajectory` RPC (`{"cascadeId": id}`): top-level `status` is `CASCADE_RUN_STATUS_RUNNING|BUSY|IDLE|CANCELING`. Success = run `IDLE` **and** the output file is non-empty **and** the random receipt file contains `AGY_COMPLETE`. Idle without a receipt → error. Timeout → `CancelCascadeInvocation` is sent so the conversation does not keep running.
5. **Result.** Prints the output path, or with `--json`: `{output, conversationId, alias, responseModel, modelEnum, status}`. write-batch records this as `meta.writerInfo`.

## Models (live 2026-10-18)

| alias | served model (trajectory `responseModel`) | enum |
|---|---|---|
| `flash` | `gemini-3.8-flash-tiered` | `MODEL_PLACEHOLDER_M322` |
| `pro` | `gemini-3.8-flash-tiered` (same!) | `MODEL_PLACEHOLDER_M322` |

On this account `--model=pro` is accepted but currently served by the same Gemini 3.8 Flash tier. `GetCascadeModelConfigData` lists the IDE picker models: Gemini 3.8 Flash (Low/Medium/High, quota 100%, resets daily), Claude Sonnet 4.6 (Thinking), Claude Opus 4.6 (Thinking), GPT-OSS 120B (Medium) — the three non-Gemini ones show no remaining-quota fraction (reset 2026-10-23) — and Gemini 4 Argon (disabled). agentapi offers no flag to pick these named models; only the three aliases.

## Safety notes

- The Antigravity agent has file, `run_command`, `search_web`, browser and subagent tools, and `commandExecutionPolicy: eager`. "Only write the output file" is a prompt contract, not a sandbox. Conversations run in the Crypto聚合 workspace.
- Every draft is still `needs_review`; Claude reviews before anything is published.
