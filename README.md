# Universal AI API Key Router & Gateway Panel

Production-grade, multi-provider AI API Key Router, continuous failover gateway, and usage management panel. Deployable to Vercel, Cloud Run, or any Node.js container.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## Key Features

1. **Multi-Provider Key Vault (15+ Providers)**
   - OpenAI, Anthropic, Google AI Studio, Groq, DeepSeek, Mistral, xAI (Grok), Cohere, OpenRouter, Perplexity, Together AI, Fireworks AI, Azure OpenAI, AWS Bedrock, and Custom OpenAI-compatible endpoints.
   - Keys are encrypted at rest with **AES-256-CBC** using a 32-byte secret key and initialization vector.
   - Masked key previews (`sk-••••••••1234`) with instant reveal toggles.

2. **Gmail Identity Tagging**
   - Tag each API key by its owner Gmail account (e.g. personal, work, or team sandboxes).
   - Filter vault, stats, and audit logs by Gmail tag.

3. **Continuous Flow & Auto-Rotation (Zero-Downtime)**
   - Add multiple keys per provider.
   - Rotation algorithms: **Round-Robin**, **Least Recently Used (LRU)**, or **Priority-Based (P1 -> P2 -> P3)**.
   - **Continuous Fallback**: If key #1 hits HTTP 429 rate limit or quota exhaustion, the router automatically intercepts the failure, sidelines the key into a temporary cooldown, and completes the request with key #2 without dropping the client connection.

4. **Unified Router & OpenAI-Compatible Endpoints**
   - `POST /api/v1/route`: Accepts `{ provider: "openai" | "anthropic" | "auto", model: "...", messages: [...] }`.
   - `POST /api/v1/chat/completions`: Drop-in replacement for OpenAI SDK, LangChain, n8n, and Cursor without modifying payload structures.

5. **Master Router Tokens & One-Click Snippets**
   - Generate panel master tokens for client tools so you never expose raw provider keys in external scripts.
   - Copy-paste snippets for Python OpenAI SDK, LangChain, n8n HTTP Request node, Node.js fetch, and cURL.

6. **Usage Logs & Real-Time Testbench**
   - Searchable audit logs with provider, model, latency, token count, and full fallback breadcrumbs.
   - Interactive Continuous Flow Tester to simulate rate-limits and observe live rotation.

---

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Optional Google AI Studio API key (automatically seeded in vault) |
| `ENCRYPTION_KEY` | 32-character AES-256 encryption key for storage at rest |
| `APP_URL` | Self-referential URL of the deployment for client snippets |

---

## Quick Start

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
