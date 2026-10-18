# Gemini CLI headless diagnosis

Status: **blocked by the service for this account**. Gemini stays in the provider list (position 2) so it starts working automatically if the account becomes eligible; today every call fails fast (~4 s) and the pipeline falls through to Codex.

## Re-verified live 2026-10-18 21:49 SGT (unsandboxed Claude session)

```sh
/opt/homebrew/bin/gemini --skip-trust -e none -o json -p 'Reply with exactly GEMINI_HEADLESS_OK.' </dev/null
```

Exit 1, no stdout. stderr: `IneligibleTierError ... reasonCode: 'UNSUPPORTED_CLIENT'` — the service says the Gemini CLI client is no longer supported for "Gemini Code Assist for individuals" (free tier, `oauth-personal`) and points to Antigravity. This is the same result Codex got inside its sandbox, so it is not a sandbox, proxy, network or MCP-startup problem.

Auth facts (values never printed): `~/.gemini/settings.json` selects `oauth-personal`; no `GEMINI_API_KEY` / `GOOGLE_API_KEY` / `GOOGLE_CLOUD_PROJECT` in the environment or in `~/.codex/private/*.env`.

## Ways to make it work (all need an owner decision — not done)

1. **Gemini API key** (AI Studio): create a key on the owner's Google account, store it as `~/.codex/private/gemini.env` (`GEMINI_API_KEY=...`), and set `security.auth.selectedType` to `gemini-api-key`. Free tier is rate-limited; paid tier costs money. Account action → owner.
2. **Vertex AI**: `GOOGLE_GENAI_USE_VERTEXAI=true` + `GOOGLE_CLOUD_PROJECT` + a service account. Billed to a GCP project → money decision → owner.
3. Reusing Antigravity's OAuth token in the Gemini CLI is not supported and was not attempted.

Antigravity (`agy`) is the working Google-model path and is the first writer.
