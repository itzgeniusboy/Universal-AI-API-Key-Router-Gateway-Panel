# Universal AI API Key Router & Gateway Panel

Production-grade, multi-provider AI API Key Router, continuous failover gateway, and usage management panel. Deployable to Vercel, Google Cloud Run, Docker, or any Node.js container.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## Key Features

1. **Multi-Provider Key Vault (15+ Providers)**
   - OpenAI, Anthropic, Google AI Studio, Groq, DeepSeek, Mistral, xAI (Grok), Cohere, OpenRouter, Perplexity, Together AI, Fireworks AI, Azure OpenAI, AWS Bedrock, and Custom OpenAI-compatible endpoints.
   - Keys are encrypted at rest with **AES-256-GCM** (authenticated encryption) using a 32-byte secret key and 12-byte initialization vectors.
   - Masked key previews (`sk-••••••••1234`) with instant reveal toggles and never logged in plain text.

2. **Google OAuth & Gmail Identity Tagging**
   - Seamless Google Account authentication and multi-account tagging.
   - Tag each API key by its owner Gmail account (e.g. personal, work, or team sandboxes).
   - Filter vault, stats, and audit logs by Gmail tag or provider.

3. **Continuous Flow & Auto-Rotation (Zero-Downtime)**
   - Add multiple keys per provider with priority weights (P1 Primary, P2 Secondary, P3 Backup).
   - Rotation algorithms: **Round-Robin**, **Least Recently Used (LRU)**, or **Priority-Based (P1 -> P2 -> P3)**.
   - **Continuous Fallback**: If key #1 hits HTTP 429 rate limits or quota exhaustion, the router automatically intercepts the failure, sidelines the key into temporary cooldown, and completes the request with key #2 without dropping the client connection.

4. **Unified Router & OpenAI-Compatible Endpoints**
   - `POST /api/v1/route`: Accepts `{ provider: "openai" | "anthropic" | "google" | "auto", model: "...", messages: [...] }`.
   - `POST /api/v1/chat/completions`: Drop-in replacement for OpenAI SDK, LangChain, n8n, and Cursor without modifying payload structures.
   - **SSE Streaming**: Supports `stream: true` chunked server-sent events for instant token-by-token streaming.
   - **Gateway Rate Limiting**: Built-in `express-rate-limit` protection on public endpoints to prevent gateway abuse.

5. **Master Router Tokens & One-Click Snippets**
   - Generate panel master tokens for client tools so you never expose raw provider keys in external scripts.
   - Copy-paste snippets for Python OpenAI SDK, LangChain, n8n HTTP Request node, Node.js fetch, and cURL.

6. **Usage Logs & Real-Time Testbench**
   - Searchable audit logs with provider, model, latency, token count, and full fallback breadcrumbs.
   - Interactive Continuous Flow Tester to simulate 429 rate-limits and observe live auto-rotation.

---

## Quickstart API Usage

### 1. Unified Router Endpoint (`/api/v1/route`)
```bash
curl -X POST http://localhost:3000/api/v1/route \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer gw_live_8f49a2b9c7e1_master_router" \
  -d '{
    "provider": "openai",
    "model": "gpt-4o",
    "messages": [
      { "role": "user", "content": "Explain key rotation in two sentences." }
    ]
  }'
```

### 2. OpenAI Drop-In Endpoint (`/api/v1/chat/completions`)
```bash
curl -X POST http://localhost:3000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer gw_live_8f49a2b9c7e1_master_router" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      { "role": "user", "content": "Hello from OpenAI client SDK" }
    ],
    "stream": false
  }'
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ENCRYPTION_KEY` | Recommended | 32-character AES-256-GCM encryption key for securing API keys at rest |
| `GEMINI_API_KEY` | Optional | Google AI Studio API key (injected in AI Studio workspace) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 Client ID for Google login |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth 2.0 Client Secret |
| `APP_URL` | Optional | Public URL of the deployment for client snippets |

---

## Vercel Deployment

1. Fork or push this repository to GitHub.
2. Go to [Vercel](https://vercel.com/new) and import the repository.
3. Add the environment variable:
   - `ENCRYPTION_KEY`: A secure 32-character random string (e.g. `openssl rand -hex 16`)
4. Click **Deploy**. Vercel will build the Vite frontend into `dist/` and route `/api/*` to the serverless entry point `api/index.ts` via `vercel.json`.

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Compile production bundle
npm run build

# Start production server
npm start
```
