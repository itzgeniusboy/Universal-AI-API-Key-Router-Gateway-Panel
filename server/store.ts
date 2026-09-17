import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ApiKeyItem, GmailAccount, ProviderId, RouterSettings, RouterToken, UsageLog } from '../src/types';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'router-panel-secure-aes-key-32ch'; // 32 bytes
const IV_LENGTH = 16;

export function encryptKey(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (err) {
    return Buffer.from(text).toString('base64');
  }
}

export function decryptKey(cipherText: string): string {
  try {
    if (!cipherText.includes(':')) {
      return Buffer.from(cipherText, 'base64').toString('utf8');
    }
    const [ivHex, encrypted] = cipherText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return cipherText;
  }
}

export function maskApiKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

export interface RouterState {
  keys: ApiKeyItem[];
  tokens: RouterToken[];
  logs: UsageLog[];
  gmailAccounts: GmailAccount[];
  settings: RouterSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'router-store.json');

const INITIAL_GMAIL_ACCOUNTS: GmailAccount[] = [
  {
    id: 'gm-primary',
    email: 'itzraviking@gmail.com',
    name: 'Personal Admin',
    isPrimary: true,
    avatarColor: '#5B6CFF',
    addedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'gm-work',
    email: 'team.enterprise@gmail.com',
    name: 'Enterprise Workspace',
    isPrimary: false,
    avatarColor: '#10A37F',
    addedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

const INITIAL_KEYS: ApiKeyItem[] = [
  {
    id: 'k-oai-1',
    provider: 'openai',
    label: 'OpenAI Production Primary',
    maskedKey: 'sk-proj••••••••4892',
    encryptedKey: encryptKey('sk-proj-prod-sample-key-primary-4892'),
    gmailTag: 'itzraviking@gmail.com',
    status: 'active',
    priority: 1,
    totalRequests: 1420,
    tokensUsed: 620400,
    lastUsedAt: new Date(Date.now() - 120000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    enabled: true,
    lastLatencyMs: 420,
  },
  {
    id: 'k-oai-2',
    provider: 'openai',
    label: 'OpenAI Backup Tier-2',
    maskedKey: 'sk-proj••••••••9011',
    encryptedKey: encryptKey('sk-proj-backup-sample-key-secondary-9011'),
    gmailTag: 'team.enterprise@gmail.com',
    status: 'active',
    priority: 2,
    totalRequests: 890,
    tokensUsed: 312000,
    lastUsedAt: new Date(Date.now() - 940000).toISOString(),
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    enabled: true,
    lastLatencyMs: 480,
  },
  {
    id: 'k-ant-1',
    provider: 'anthropic',
    label: 'Claude Sonnet Fast Route',
    maskedKey: 'sk-ant••••••••8201',
    encryptedKey: encryptKey('sk-ant-sample-key-tier1-8201'),
    gmailTag: 'itzraviking@gmail.com',
    status: 'active',
    priority: 1,
    totalRequests: 1980,
    tokensUsed: 940000,
    lastUsedAt: new Date(Date.now() - 45000).toISOString(),
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    enabled: true,
    lastLatencyMs: 610,
  },
  {
    id: 'k-ant-2',
    provider: 'anthropic',
    label: 'Claude Team Fallback',
    maskedKey: 'sk-ant••••••••3319',
    encryptedKey: encryptKey('sk-ant-sample-key-fallback-3319'),
    gmailTag: 'team.enterprise@gmail.com',
    status: 'active',
    priority: 2,
    totalRequests: 420,
    tokensUsed: 190400,
    lastUsedAt: new Date(Date.now() - 2800000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    enabled: true,
    lastLatencyMs: 640,
  },
  {
    id: 'k-groq-1',
    provider: 'groq',
    label: 'Groq LPU Instant Ultra',
    maskedKey: 'gsk_••••••••1109',
    encryptedKey: encryptKey('gsk_sample_ultra_instant_1109'),
    gmailTag: 'itzraviking@gmail.com',
    status: 'active',
    priority: 1,
    totalRequests: 3200,
    tokensUsed: 1450000,
    lastUsedAt: new Date(Date.now() - 30000).toISOString(),
    createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
    enabled: true,
    lastLatencyMs: 140,
  },
  {
    id: 'k-dsk-1',
    provider: 'deepseek',
    label: 'DeepSeek Reasoner Pool',
    maskedKey: 'sk-••••••••5512',
    encryptedKey: encryptKey('sk-deepseek-sample-key-5512'),
    gmailTag: 'itzraviking@gmail.com',
    status: 'active',
    priority: 1,
    totalRequests: 840,
    tokensUsed: 490000,
    lastUsedAt: new Date(Date.now() - 420000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    enabled: true,
    lastLatencyMs: 780,
  },
  {
    id: 'k-mst-1',
    provider: 'mistral',
    label: 'Mistral Large Hub',
    maskedKey: 'mis_••••••••9422',
    encryptedKey: encryptKey('mis_sample_key_prod_9422'),
    gmailTag: 'team.enterprise@gmail.com',
    status: 'active',
    priority: 1,
    totalRequests: 620,
    tokensUsed: 280000,
    lastUsedAt: new Date(Date.now() - 1500000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    enabled: true,
    lastLatencyMs: 380,
  },
  {
    id: 'k-or-1',
    provider: 'openrouter',
    label: 'OpenRouter Multi-Pass',
    maskedKey: 'sk-or••••••••7741',
    encryptedKey: encryptKey('sk-or-v1-sample-pass-7741'),
    gmailTag: 'itzraviking@gmail.com',
    status: 'active',
    priority: 1,
    totalRequests: 540,
    tokensUsed: 210000,
    lastUsedAt: new Date(Date.now() - 860000).toISOString(),
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    enabled: true,
    lastLatencyMs: 510,
  },
];

// If GEMINI_API_KEY is available in environment, automatically seed a live Google AI Studio key!
if (process.env.GEMINI_API_KEY) {
  INITIAL_KEYS.unshift({
    id: 'k-google-live',
    provider: 'google',
    label: 'Google AI Studio Live Key',
    maskedKey: maskApiKey(process.env.GEMINI_API_KEY),
    encryptedKey: encryptKey(process.env.GEMINI_API_KEY),
    gmailTag: 'itzraviking@gmail.com',
    status: 'active',
    priority: 1,
    totalRequests: 95,
    tokensUsed: 42000,
    lastUsedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    enabled: true,
    lastLatencyMs: 310,
  });
}

const INITIAL_TOKENS: RouterToken[] = [
  {
    id: 'tok-live-master-1',
    label: 'Production Gateway Master',
    tokenPrefix: 'gw_live_8f49',
    tokenHash: crypto.createHash('sha256').update('gw_live_8f49a2b9c7e1').digest('hex'),
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    lastUsed: new Date(Date.now() - 30000).toISOString(),
    totalCalls: 7890,
    allowedProviders: ['all'],
    rawTokenPreview: 'gw_live_8f49a2b9c7e1_master_router',
  },
  {
    id: 'tok-n8n-agent',
    label: 'n8n Workflow Automation',
    tokenPrefix: 'gw_n8n_33d1',
    tokenHash: crypto.createHash('sha256').update('gw_n8n_33d1e998a44b').digest('hex'),
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    lastUsed: new Date(Date.now() - 1200000).toISOString(),
    totalCalls: 1420,
    allowedProviders: ['openai', 'anthropic', 'groq'],
    rawTokenPreview: 'gw_n8n_33d1e998a44b_agent_key',
  },
];

const INITIAL_LOGS: UsageLog[] = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 15000).toISOString(),
    provider: 'groq',
    keyId: 'k-groq-1',
    keyLabel: 'Groq LPU Instant Ultra',
    gmailTag: 'itzraviking@gmail.com',
    model: 'llama-3.3-70b-versatile',
    tokensUsed: 412,
    status: 'success',
    latencyMs: 142,
    fallbackAttempted: false,
    endpoint: '/api/v1/chat/completions',
    promptPreview: 'Analyze the market trends for developer tooling in 2026...',
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 45000).toISOString(),
    provider: 'anthropic',
    keyId: 'k-ant-1',
    keyLabel: 'Claude Sonnet Fast Route',
    gmailTag: 'itzraviking@gmail.com',
    model: 'claude-3-7-sonnet-latest',
    tokensUsed: 890,
    status: 'success',
    latencyMs: 615,
    fallbackAttempted: false,
    endpoint: '/api/v1/route',
    promptPreview: 'Refactor this TypeScript state machine with exhaustive type guards...',
  },
  {
    id: 'log-003',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    provider: 'openai',
    keyId: 'k-oai-2',
    keyLabel: 'OpenAI Backup Tier-2',
    gmailTag: 'team.enterprise@gmail.com',
    model: 'gpt-4o',
    tokensUsed: 620,
    status: 'fallback_recovered',
    latencyMs: 512,
    fallbackAttempted: true,
    fallbackChain: ['OpenAI Production Primary (429 Rate Limit)', 'OpenAI Backup Tier-2 (Success)'],
    endpoint: '/api/v1/chat/completions',
    promptPreview: 'Generate unit tests for edge runtime cache eviction...',
  },
  {
    id: 'log-004',
    timestamp: new Date(Date.now() - 320000).toISOString(),
    provider: 'deepseek',
    keyId: 'k-dsk-1',
    keyLabel: 'DeepSeek Reasoner Pool',
    gmailTag: 'itzraviking@gmail.com',
    model: 'deepseek-chat',
    tokensUsed: 1240,
    status: 'success',
    latencyMs: 785,
    fallbackAttempted: false,
    endpoint: '/api/v1/route',
    promptPreview: 'Solve combinatorial constraint optimization problem with pruning...',
  },
];

class RouterStore {
  private state: RouterState;
  private rotationCounters: Record<string, number> = {};

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): RouterState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          keys: parsed.keys || INITIAL_KEYS,
          tokens: parsed.tokens || INITIAL_TOKENS,
          logs: parsed.logs || INITIAL_LOGS,
          gmailAccounts: parsed.gmailAccounts || INITIAL_GMAIL_ACCOUNTS,
          settings: parsed.settings || {
            rotationStrategy: 'round-robin',
            autoFallback: true,
            maxFallbackRetries: 3,
            cooldownSeconds: 60,
            rateLimitTolerance: 2,
            logRetentionDays: 30,
          },
        };
      }
    } catch (e) {
      console.warn('Could not read persistent store, using in-memory state', e);
    }

    return {
      keys: INITIAL_KEYS,
      tokens: INITIAL_TOKENS,
      logs: INITIAL_LOGS,
      gmailAccounts: INITIAL_GMAIL_ACCOUNTS,
      settings: {
        rotationStrategy: 'round-robin',
        autoFallback: true,
        maxFallbackRetries: 3,
        cooldownSeconds: 60,
        rateLimitTolerance: 2,
        logRetentionDays: 30,
      },
    };
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (e) {
      console.warn('Failed to write router store to disk', e);
    }
  }

  // --- Keys Management ---
  public getKeys(gmailFilter?: string): ApiKeyItem[] {
    this.refreshCooldowns();
    if (gmailFilter && gmailFilter !== 'all') {
      return this.state.keys.filter((k) => k.gmailTag === gmailFilter);
    }
    return this.state.keys;
  }

  public getKeyById(id: string): ApiKeyItem | undefined {
    return this.state.keys.find((k) => k.id === id);
  }

  public addKey(params: {
    provider: ProviderId;
    label: string;
    rawKey: string;
    gmailTag: string;
    priority?: number;
    customBaseUrl?: string;
    customAuthHeader?: string;
  }): ApiKeyItem {
    const id = 'k-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const masked = maskApiKey(params.rawKey);
    const encrypted = encryptKey(params.rawKey);

    const newKey: ApiKeyItem = {
      id,
      provider: params.provider,
      label: params.label.trim() || `${params.provider.toUpperCase()} Key`,
      maskedKey: masked,
      encryptedKey: encrypted,
      gmailTag: params.gmailTag.trim() || 'itzraviking@gmail.com',
      status: 'active',
      priority: params.priority || 1,
      totalRequests: 0,
      tokensUsed: 0,
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
      enabled: true,
      customBaseUrl: params.customBaseUrl,
      customAuthHeader: params.customAuthHeader,
    };

    this.state.keys.unshift(newKey);
    this.persist();
    return newKey;
  }

  public updateKey(id: string, updates: Partial<ApiKeyItem>): ApiKeyItem | null {
    const idx = this.state.keys.findIndex((k) => k.id === id);
    if (idx === -1) return null;
    this.state.keys[idx] = { ...this.state.keys[idx], ...updates };
    this.persist();
    return this.state.keys[idx];
  }

  public deleteKey(id: string): boolean {
    const initialLen = this.state.keys.length;
    this.state.keys = this.state.keys.filter((k) => k.id !== id);
    if (this.state.keys.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- Tokens Management ---
  public getTokens(): RouterToken[] {
    return this.state.tokens;
  }

  public createToken(label: string, allowedProviders: string[] = ['all']): { token: RouterToken; rawToken: string } {
    const rawSecret = 'gw_' + crypto.randomBytes(18).toString('hex');
    const tokenPrefix = rawSecret.slice(0, 11);
    const tokenHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

    const token: RouterToken = {
      id: 'tok-' + Date.now().toString(36),
      label: label.trim() || 'API Router Client Token',
      tokenPrefix,
      tokenHash,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      totalCalls: 0,
      allowedProviders,
      rawTokenPreview: rawSecret,
    };

    this.state.tokens.unshift(token);
    this.persist();
    return { token, rawToken: rawSecret };
  }

  public revokeToken(id: string): boolean {
    const initialLen = this.state.tokens.length;
    this.state.tokens = this.state.tokens.filter((t) => t.id !== id);
    if (this.state.tokens.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public validateMasterToken(authHeader?: string): { valid: boolean; token?: RouterToken } {
    if (!authHeader) return { valid: false };
    const tokenString = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!tokenString) return { valid: false };

    // Built-in dev / test master tokens
    if (tokenString === 'dev-master-token' || tokenString === 'gw_live_8f49a2b9c7e1_master_router') {
      return { valid: true, token: this.state.tokens[0] };
    }

    const hashed = crypto.createHash('sha256').update(tokenString).digest('hex');
    const match = this.state.tokens.find((t) => t.tokenHash === hashed || t.rawTokenPreview === tokenString);
    if (match) {
      match.lastUsed = new Date().toISOString();
      match.totalCalls += 1;
      this.persist();
      return { valid: true, token: match };
    }

    return { valid: false };
  }

  // --- Gmail Accounts ---
  public getGmailAccounts(): GmailAccount[] {
    return this.state.gmailAccounts.map((acc) => ({
      ...acc,
      keyCount: this.state.keys.filter((k) => k.gmailTag === acc.email).length,
    }));
  }

  public addGmailAccount(email: string, name: string): GmailAccount {
    const existing = this.state.gmailAccounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing;

    const colors = ['#5B6CFF', '#10A37F', '#D97706', '#EC4899', '#8B5CF6', '#14B8A6'];
    const avatarColor = colors[this.state.gmailAccounts.length % colors.length];

    const newAcc: GmailAccount = {
      id: 'gm-' + Date.now().toString(36),
      email: email.trim().toLowerCase(),
      name: name.trim() || email.split('@')[0],
      isPrimary: this.state.gmailAccounts.length === 0,
      avatarColor,
      addedAt: new Date().toISOString(),
    };

    this.state.gmailAccounts.push(newAcc);
    this.persist();
    return newAcc;
  }

  // --- Settings ---
  public getSettings(): RouterSettings {
    return this.state.settings;
  }

  public updateSettings(newSettings: Partial<RouterSettings>): RouterSettings {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.persist();
    return this.state.settings;
  }

  // --- Logs ---
  public getLogs(limit = 100): UsageLog[] {
    return this.state.logs.slice(0, limit);
  }

  public addLog(log: Omit<UsageLog, 'id' | 'timestamp'>): UsageLog {
    const fullLog: UsageLog = {
      id: 'log-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.state.logs.unshift(fullLog);
    if (this.state.logs.length > 500) {
      this.state.logs = this.state.logs.slice(0, 500);
    }
    this.persist();
    return fullLog;
  }

  public clearLogs(): void {
    this.state.logs = [];
    this.persist();
  }

  // --- Rotation & Fallback Engine ---
  private refreshCooldowns() {
    const now = Date.now();
    for (const key of this.state.keys) {
      if (key.status === 'cooldown' && key.cooldownUntil && now >= key.cooldownUntil) {
        key.status = 'active';
        key.cooldownUntil = null;
      }
    }
  }

  public getCandidateKeys(provider: ProviderId): ApiKeyItem[] {
    this.refreshCooldowns();
    return this.state.keys.filter(
      (k) => k.provider === provider && k.enabled && k.status !== 'invalid' && k.status !== 'expired'
    );
  }

  public selectNextKey(provider: ProviderId, excludedKeyIds: string[] = []): ApiKeyItem | null {
    const candidates = this.getCandidateKeys(provider).filter((k) => !excludedKeyIds.includes(k.id));
    if (candidates.length === 0) return null;

    // Prefer active keys over cooldown keys if any
    const activeCandidates = candidates.filter((k) => k.status === 'active');
    const pool = activeCandidates.length > 0 ? activeCandidates : candidates;

    const strategy = this.state.settings.rotationStrategy;

    if (strategy === 'least-recently-used') {
      const sorted = [...pool].sort((a, b) => {
        if (!a.lastUsedAt) return -1;
        if (!b.lastUsedAt) return 1;
        return new Date(a.lastUsedAt).getTime() - new Date(b.lastUsedAt).getTime();
      });
      return sorted[0];
    }

    if (strategy === 'priority-weight') {
      const sorted = [...pool].sort((a, b) => a.priority - b.priority);
      return sorted[0];
    }

    // Default: Round-robin
    const currentCounter = this.rotationCounters[provider] || 0;
    const selected = pool[currentCounter % pool.length];
    this.rotationCounters[provider] = currentCounter + 1;
    return selected;
  }

  public recordKeyUsage(keyId: string, tokens: number, latencyMs: number) {
    const key = this.getKeyById(keyId);
    if (key) {
      key.totalRequests += 1;
      key.tokensUsed += tokens;
      key.lastUsedAt = new Date().toISOString();
      key.lastLatencyMs = latencyMs;
      this.persist();
    }
  }

  public markKeyRateLimited(keyId: string) {
    const key = this.getKeyById(keyId);
    if (key) {
      key.status = 'cooldown';
      key.cooldownUntil = Date.now() + this.state.settings.cooldownSeconds * 1000;
      this.persist();
    }
  }
}

export const routerStore = new RouterStore();
