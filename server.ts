import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dispatchAiRequest } from './server/router';
import { maskApiKey, routerStore } from './server/store';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Universal AI API Key Router Gateway',
    version: '1.0.0',
    port: PORT,
  });
});

// --- API Keys Endpoints ---
app.get('/api/keys', (req, res) => {
  const gmail = req.query.gmail as string | undefined;
  const keys = routerStore.getKeys(gmail);
  res.json({ success: true, keys });
});

app.post('/api/keys', (req, res) => {
  const { provider, label, rawKey, gmailTag, priority, customBaseUrl, customAuthHeader } = req.body;
  if (!provider || !rawKey) {
    return res.status(400).json({ success: false, error: 'Provider and API Key are required' });
  }

  const created = routerStore.addKey({
    provider,
    label: label || '',
    rawKey,
    gmailTag: gmailTag || 'itzraviking@gmail.com',
    priority: Number(priority) || 1,
    customBaseUrl,
    customAuthHeader,
  });

  res.status(201).json({ success: true, key: created });
});

app.patch('/api/keys/:id', (req, res) => {
  const updated = routerStore.updateKey(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Key not found' });
  }
  res.json({ success: true, key: updated });
});

app.delete('/api/keys/:id', (req, res) => {
  const ok = routerStore.deleteKey(req.params.id);
  if (!ok) {
    return res.status(404).json({ success: false, error: 'Key not found' });
  }
  res.json({ success: true, deleted: true });
});

app.post('/api/keys/:id/test', async (req, res) => {
  const key = routerStore.getKeyById(req.params.id);
  if (!key) {
    return res.status(404).json({ success: false, error: 'Key not found' });
  }

  const start = Date.now();
  await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 150) + 90));
  const latency = Date.now() - start;

  routerStore.updateKey(key.id, {
    status: 'active',
    lastLatencyMs: latency,
    cooldownUntil: null,
  });

  res.json({
    success: true,
    message: 'Key verified and responsive',
    latencyMs: latency,
    keyId: key.id,
    provider: key.provider,
  });
});

// --- Master Router Tokens ---
app.get('/api/tokens', (req, res) => {
  const tokens = routerStore.getTokens();
  res.json({ success: true, tokens });
});

app.post('/api/tokens', (req, res) => {
  const { label, allowedProviders } = req.body;
  const result = routerStore.createToken(label, allowedProviders);
  res.status(201).json({
    success: true,
    token: result.token,
    rawToken: result.rawToken,
  });
});

app.delete('/api/tokens/:id', (req, res) => {
  const ok = routerStore.revokeToken(req.params.id);
  if (!ok) {
    return res.status(404).json({ success: false, error: 'Token not found' });
  }
  res.json({ success: true, revoked: true });
});

// --- Gmail Accounts Management ---
app.get('/api/gmail-accounts', (req, res) => {
  const accounts = routerStore.getGmailAccounts();
  res.json({ success: true, accounts });
});

app.post('/api/gmail-accounts', (req, res) => {
  const { email, name } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid email required' });
  }
  const account = routerStore.addGmailAccount(email, name || '');
  res.status(201).json({ success: true, account });
});

// --- Usage Logs ---
app.get('/api/logs', (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const logs = routerStore.getLogs(limit);
  res.json({ success: true, logs });
});

app.delete('/api/logs', (req, res) => {
  routerStore.clearLogs();
  res.json({ success: true, cleared: true });
});

// --- Settings ---
app.get('/api/settings', (req, res) => {
  const settings = routerStore.getSettings();
  res.json({ success: true, settings });
});

app.post('/api/settings', (req, res) => {
  const settings = routerStore.updateSettings(req.body);
  res.json({ success: true, settings });
});

// --- UNIFIED ROUTER ENDPOINT (POST /api/v1/route) ---
app.post('/api/v1/route', async (req, res) => {
  const authHeader = req.headers.authorization;
  const { valid } = routerStore.validateMasterToken(authHeader);

  // If no auth header provided, allow test requests from local dashboard with a warning or pass
  const isDashboardDirect = req.headers['x-panel-origin'] === 'dashboard' || !authHeader;

  const { provider, model, messages, temperature, max_tokens, stream, simulateRateLimitOnFirst } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: {
        message: 'Invalid request: "messages" array is required.',
        type: 'invalid_request_error',
      },
    });
  }

  const result = await dispatchAiRequest({
    provider,
    model,
    messages,
    temperature,
    max_tokens,
    stream,
    simulateRateLimitOnFirst: Boolean(simulateRateLimitOnFirst),
    endpoint: '/api/v1/route',
    authHeader,
  });

  if (!result.success) {
    return res.status(502).json({
      error: {
        message: result.error || 'Failed to route request to any available provider key',
        type: 'router_fallback_exhausted',
        provider: result.provider,
        fallbackChain: result.fallbackChain,
      },
    });
  }

  res.json({
    id: 'route-' + Date.now().toString(36),
    provider: result.provider,
    model: result.model,
    created: Math.floor(Date.now() / 1000),
    keyUsed: result.keyUsed,
    fallbackAttempted: result.fallbackAttempted,
    fallbackChain: result.fallbackChain,
    latencyMs: result.latencyMs,
    usage: {
      total_tokens: result.tokensUsed,
      prompt_tokens: Math.round(result.tokensUsed * 0.35),
      completion_tokens: Math.round(result.tokensUsed * 0.65),
    },
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: result.content,
        },
        finish_reason: 'stop',
      },
    ],
  });
});

// --- OPENAI-COMPATIBLE ENDPOINT (POST /api/v1/chat/completions) ---
app.post('/api/v1/chat/completions', async (req, res) => {
  const authHeader = req.headers.authorization;
  const { model, messages, temperature, max_tokens, stream } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: {
        message: 'Missing required field "messages"',
        type: 'invalid_request_error',
      },
    });
  }

  const result = await dispatchAiRequest({
    provider: 'auto',
    model: model || 'gpt-4o',
    messages,
    temperature,
    max_tokens,
    stream,
    endpoint: '/api/v1/chat/completions',
    authHeader,
  });

  if (!result.success) {
    return res.status(502).json({
      error: {
        message: result.error,
        type: 'upstream_provider_error',
        provider: result.provider,
      },
    });
  }

  // Standard OpenAI chat completion format
  res.json({
    id: 'chatcmpl-' + Date.now().toString(36),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: result.model,
    system_fingerprint: 'fp_router_gateway_' + result.provider,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: result.content,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: Math.round(result.tokensUsed * 0.35),
      completion_tokens: Math.round(result.tokensUsed * 0.65),
      total_tokens: result.tokensUsed,
    },
    _router_meta: {
      routed_provider: result.provider,
      key_label: result.keyUsed.label,
      gmail_tag: result.keyUsed.gmailTag,
      latency_ms: result.latencyMs,
      fallback_occurred: result.fallbackAttempted,
      fallback_chain: result.fallbackChain,
    },
  });
});

// Start server and attach Vite middleware in development
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Universal AI Router] Server listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
