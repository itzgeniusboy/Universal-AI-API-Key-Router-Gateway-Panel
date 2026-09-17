import crypto from 'crypto';
import type { ApiKeyItem, GmailAccount, ProviderId, RouterSettings, RouterToken, UsageLog } from '../src/types';
import { getDatabase } from './db';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'router-panel-secure-aes-key-32ch'; // 32 bytes
const IV_GCM_LENGTH = 12;

/**
 * AES-256-GCM Authenticated Encryption for API keys at rest.
 * Output format: "gcm:<iv_hex>:<tag_hex>:<cipher_hex>"
 */
export function encryptKey(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_GCM_LENGTH);
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `gcm:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (err) {
    return Buffer.from(text).toString('base64');
  }
}

/**
 * Decrypts an AES-256-GCM encrypted API key.
 * Also backwards-compatible with legacy AES-256-CBC ciphertexts ("iv:cipher").
 */
export function decryptKey(cipherText: string): string {
  try {
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();

    if (cipherText.startsWith('gcm:')) {
      const parts = cipherText.split(':');
      const iv = Buffer.from(parts[1], 'hex');
      const authTag = Buffer.from(parts[2], 'hex');
      const encrypted = parts[3];
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    if (cipherText.includes(':')) {
      const [ivHex, encrypted] = cipherText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    return Buffer.from(cipherText, 'base64').toString('utf8');
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

const DEFAULT_SETTINGS: RouterSettings = {
  rotationStrategy: 'round-robin',
  autoFallback: true,
  maxFallbackRetries: 3,
  cooldownSeconds: 60,
  rateLimitTolerance: 2,
  logRetentionDays: 30,
};

class PersistentRouterStore {
  private roundRobinIndices: Map<string, number> = new Map();

  constructor() {
    this.seedDefaultsIfEmpty();
  }

  private seedDefaultsIfEmpty() {
    const db = getDatabase();
    try {
      const countRow = db.prepare('SELECT count(*) as cnt FROM api_keys').get() as { cnt: number };
      if (countRow && countRow.cnt > 0) {
        return; // Already initialized
      }

      console.log('[Store] Seeding initial database tables...');

      // Seed settings
      db.prepare(`
        INSERT OR REPLACE INTO settings (id, user_id, rotation_strategy, auto_fallback, max_fallback_retries, cooldown_seconds, rate_limit_tolerance, log_retention_days)
        VALUES ('global-settings', 'default-user', 'round-robin', 1, 3, 60, 2, 30)
      `).run();

      // Seed default user
      db.prepare(`
        INSERT OR IGNORE INTO users (id, email, name, avatar, created_at)
        VALUES ('default-user', 'itzraviking@gmail.com', 'Admin User', '', datetime('now'))
      `).run();

      // Seed initial Gmail accounts
      db.prepare(`
        INSERT OR IGNORE INTO gmail_accounts (id, user_id, email, name, is_primary, avatar_color, added_at)
        VALUES 
          ('gm-primary', 'default-user', 'itzraviking@gmail.com', 'Personal Admin', 1, '#5B6CFF', datetime('now')),
          ('gm-work', 'default-user', 'team.enterprise@gmail.com', 'Enterprise Workspace', 0, '#10A37F', datetime('now'))
      `).run();

      // Seed Initial Keys
      const initialKeys = [
        {
          id: 'k-google-live',
          provider: 'google',
          label: 'Google AI Studio Live Key',
          raw: process.env.GEMINI_API_KEY || 'AIzaSyDemoSampleKeyForRouting123',
          gmail: 'itzraviking@gmail.com',
          priority: 1,
        },
        {
          id: 'k-oai-1',
          provider: 'openai',
          label: 'OpenAI Production Primary',
          raw: 'sk-proj-sample-primary-key-4892',
          gmail: 'itzraviking@gmail.com',
          priority: 1,
        },
        {
          id: 'k-oai-2',
          provider: 'openai',
          label: 'OpenAI Backup Tier-2',
          raw: 'sk-proj-backup-secondary-key-9011',
          gmail: 'team.enterprise@gmail.com',
          priority: 2,
        },
        {
          id: 'k-ant-1',
          provider: 'anthropic',
          label: 'Claude Sonnet Fast Route',
          raw: 'sk-ant-sample-fast-route-8201',
          gmail: 'itzraviking@gmail.com',
          priority: 1,
        },
        {
          id: 'k-ant-2',
          provider: 'anthropic',
          label: 'Claude Team Fallback',
          raw: 'sk-ant-sample-fallback-3319',
          gmail: 'team.enterprise@gmail.com',
          priority: 2,
        },
        {
          id: 'k-groq-1',
          provider: 'groq',
          label: 'Groq LPU Instant Ultra',
          raw: 'gsk_sample-groq-lpu-ultra-1109',
          gmail: 'itzraviking@gmail.com',
          priority: 1,
        },
        {
          id: 'k-dsk-1',
          provider: 'deepseek',
          label: 'DeepSeek Reasoner Pool',
          raw: 'sk-sample-deepseek-reasoner-5512',
          gmail: 'itzraviking@gmail.com',
          priority: 1,
        },
        {
          id: 'k-mst-1',
          provider: 'mistral',
          label: 'Mistral Large Hub',
          raw: 'mis_sample-mistral-hub-9422',
          gmail: 'team.enterprise@gmail.com',
          priority: 1,
        },
        {
          id: 'k-or-1',
          provider: 'openrouter',
          label: 'OpenRouter Multi-Pass',
          raw: 'sk-or-sample-router-multipass-7741',
          gmail: 'itzraviking@gmail.com',
          priority: 1,
        },
      ];

      const insertKeyStmt = db.prepare(`
        INSERT INTO api_keys (
          id, user_id, provider, label, masked_key, encrypted_key, gmail_tag, status, priority,
          total_requests, tokens_used, last_latency_ms, last_used_at, created_at, enabled
        ) VALUES (
          ?, 'default-user', ?, ?, ?, ?, ?, 'active', ?, 0, 0, 0, datetime('now'), datetime('now'), 1
        )
      `);

      for (const k of initialKeys) {
        insertKeyStmt.run(
          k.id,
          k.provider,
          k.label,
          maskApiKey(k.raw),
          encryptKey(k.raw),
          k.gmail,
          k.priority
        );
      }

      // Seed Initial Master Router Token
      const masterRawToken = 'gw_live_8f49a2b9c7e1_master_router';
      const masterHash = crypto.createHash('sha256').update(masterRawToken).digest('hex');
      db.prepare(`
        INSERT INTO router_tokens (id, user_id, label, token_hash, token_prefix, allowed_providers, total_calls, last_used, created_at)
        VALUES ('tok-master-demo', 'default-user', 'Master External Client Token', ?, 'gw_live_', '["all"]', 45, datetime('now'), datetime('now'))
      `).run(masterHash);

      console.log('[Store] SQLite persistent tables seeded successfully.');
    } catch (err) {
      console.error('[Store] Error seeding defaults:', err);
    }
  }

  // --- API Keys Methods ---
  public getKeys(gmail?: string, userId = 'default-user'): ApiKeyItem[] {
    const db = getDatabase();
    let rows: any[];
    if (gmail && gmail !== 'all') {
      rows = db.prepare("SELECT * FROM api_keys WHERE (user_id = ? OR user_id = 'default-user') AND gmail_tag = ? ORDER BY priority ASC, created_at DESC").all(userId, gmail);
    } else {
      rows = db.prepare("SELECT * FROM api_keys WHERE user_id = ? OR user_id = 'default-user' ORDER BY priority ASC, created_at DESC").all(userId);
    }

    return rows.map((r) => ({
      id: r.id,
      provider: r.provider as ProviderId,
      label: r.label,
      maskedKey: r.masked_key,
      encryptedKey: r.encrypted_key,
      gmailTag: r.gmail_tag,
      status: r.status as any,
      priority: r.priority,
      totalRequests: r.total_requests,
      tokensUsed: r.tokens_used,
      lastLatencyMs: r.last_latency_ms,
      lastUsedAt: r.last_used_at,
      createdAt: r.created_at,
      enabled: Boolean(r.enabled),
      customBaseUrl: r.custom_base_url || undefined,
      customAuthHeader: r.custom_auth_header || undefined,
      cooldownUntil: r.cooldown_until || undefined,
    }));
  }

  public getKeyById(id: string): ApiKeyItem | undefined {
    const db = getDatabase();
    const r = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id) as any;
    if (!r) return undefined;
    return {
      id: r.id,
      provider: r.provider as ProviderId,
      label: r.label,
      maskedKey: r.masked_key,
      encryptedKey: r.encrypted_key,
      gmailTag: r.gmail_tag,
      status: r.status as any,
      priority: r.priority,
      totalRequests: r.total_requests,
      tokensUsed: r.tokens_used,
      lastLatencyMs: r.last_latency_ms,
      lastUsedAt: r.last_used_at,
      createdAt: r.created_at,
      enabled: Boolean(r.enabled),
      customBaseUrl: r.custom_base_url || undefined,
      customAuthHeader: r.custom_auth_header || undefined,
      cooldownUntil: r.cooldown_until || undefined,
    };
  }

  public addKey(data: {
    provider: ProviderId;
    label: string;
    rawKey: string;
    gmailTag: string;
    priority?: number;
    customBaseUrl?: string;
    customAuthHeader?: string;
    userId?: string;
  }): ApiKeyItem {
    const db = getDatabase();
    const id = `k-${data.provider}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const maskedKey = maskApiKey(data.rawKey);
    const encryptedKey = encryptKey(data.rawKey);
    const userId = data.userId || 'default-user';
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO api_keys (
        id, user_id, provider, label, masked_key, encrypted_key, gmail_tag, status, priority,
        total_requests, tokens_used, last_latency_ms, last_used_at, created_at, enabled,
        custom_base_url, custom_auth_header
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, 0, 0, 0, NULL, ?, 1, ?, ?)
    `).run(
      id,
      userId,
      data.provider,
      data.label || `${data.provider} Key`,
      maskedKey,
      encryptedKey,
      data.gmailTag,
      data.priority || 1,
      createdAt,
      data.customBaseUrl || null,
      data.customAuthHeader || null
    );

    return this.getKeyById(id)!;
  }

  public updateKey(id: string, updates: Partial<ApiKeyItem>): ApiKeyItem | null {
    const db = getDatabase();
    const existing = this.getKeyById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };

    db.prepare(`
      UPDATE api_keys SET
        label = ?,
        status = ?,
        priority = ?,
        total_requests = ?,
        tokens_used = ?,
        last_latency_ms = ?,
        last_used_at = ?,
        enabled = ?,
        cooldown_until = ?,
        custom_base_url = ?,
        custom_auth_header = ?
      WHERE id = ?
    `).run(
      merged.label,
      merged.status,
      merged.priority,
      merged.totalRequests,
      merged.tokensUsed,
      merged.lastLatencyMs || 0,
      merged.lastUsedAt || null,
      merged.enabled ? 1 : 0,
      merged.cooldownUntil || null,
      merged.customBaseUrl || null,
      merged.customAuthHeader || null,
      id
    );

    return this.getKeyById(id)!;
  }

  public deleteKey(id: string): boolean {
    const db = getDatabase();
    const res = db.prepare('DELETE FROM api_keys WHERE id = ?').run(id);
    return Number(res.changes) > 0;
  }

  public selectNextKey(provider: ProviderId, excludedKeyIds: string[] = [], userId = 'default-user'): ApiKeyItem | null {
    const now = Date.now();
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM api_keys 
      WHERE (user_id = ? OR user_id = 'default-user') 
        AND provider = ? 
        AND enabled = 1
    `).all(userId, provider) as any[];

    // Filter candidate keys:
    // 1. Not in excludedKeyIds
    // 2. Not in active cooldown
    const candidateKeys: ApiKeyItem[] = rows
      .map((r) => ({
        id: r.id,
        provider: r.provider as ProviderId,
        label: r.label,
        maskedKey: r.masked_key,
        encryptedKey: r.encrypted_key,
        gmailTag: r.gmail_tag,
        status: r.status as any,
        priority: r.priority,
        totalRequests: r.total_requests,
        tokensUsed: r.tokens_used,
        lastLatencyMs: r.last_latency_ms,
        lastUsedAt: r.last_used_at,
        createdAt: r.created_at,
        enabled: Boolean(r.enabled),
        customBaseUrl: r.custom_base_url || undefined,
        customAuthHeader: r.custom_auth_header || undefined,
        cooldownUntil: r.cooldown_until || undefined,
      }))
      .filter((k) => {
        if (excludedKeyIds.includes(k.id)) return false;
        if (k.cooldownUntil && new Date(k.cooldownUntil).getTime() > now) return false;
        return true;
      });

    if (candidateKeys.length === 0) return null;

    const settings = this.getSettings(userId);

    // Rotation Strategy:
    if (settings.rotationStrategy === 'priority-weight') {
      candidateKeys.sort((a, b) => a.priority - b.priority || a.totalRequests - b.totalRequests);
      return candidateKeys[0];
    }

    if (settings.rotationStrategy === 'least-recently-used') {
      candidateKeys.sort((a, b) => {
        const timeA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
        const timeB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
        return timeA - timeB;
      });
      return candidateKeys[0];
    }

    // Default: Round-Robin
    const currentIndex = this.roundRobinIndices.get(provider) || 0;
    const selectedKey = candidateKeys[currentIndex % candidateKeys.length];
    this.roundRobinIndices.set(provider, (currentIndex + 1) % candidateKeys.length);
    return selectedKey;
  }

  public markKeyRateLimited(id: string, cooldownSecs?: number): void {
    const key = this.getKeyById(id);
    if (!key) return;
    const settings = this.getSettings();
    const duration = (cooldownSecs || settings.cooldownSeconds) * 1000;
    const cooldownUntil = new Date(Date.now() + duration).toISOString();
    this.updateKey(id, {
      status: 'rate-limited',
      cooldownUntil,
    });
  }

  public recordKeyUsage(id: string, tokens: number, latencyMs: number): void {
    const key = this.getKeyById(id);
    if (!key) return;
    this.updateKey(id, {
      totalRequests: key.totalRequests + 1,
      tokensUsed: key.tokensUsed + tokens,
      lastLatencyMs: latencyMs,
      lastUsedAt: new Date().toISOString(),
      status: 'active',
      cooldownUntil: null,
    });
  }

  // --- Router Tokens Methods ---
  public getTokens(userId = 'default-user'): RouterToken[] {
    const db = getDatabase();
    const rows = db.prepare("SELECT * FROM router_tokens WHERE user_id = ? OR user_id = 'default-user' ORDER BY created_at DESC").all(userId) as any[];
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      tokenPrefix: r.token_prefix,
      allowedProviders: JSON.parse(r.allowed_providers || '["all"]'),
      totalCalls: r.total_calls,
      lastUsed: r.last_used || null,
      createdAt: r.created_at,
    }));
  }

  public createToken(label: string, allowedProviders: string[] = ['all'], userId = 'default-user'): { token: RouterToken; rawToken: string } {
    const db = getDatabase();
    const rawSecret = crypto.randomBytes(24).toString('hex');
    const rawToken = `gw_live_${rawSecret}`;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const id = `tok-${Date.now().toString(36)}`;
    const tokenPrefix = rawToken.slice(0, 8);
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO router_tokens (id, user_id, label, token_hash, token_prefix, allowed_providers, total_calls, last_used, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, NULL, ?)
    `).run(id, userId, label, tokenHash, tokenPrefix, JSON.stringify(allowedProviders), createdAt);

    return {
      token: {
        id,
        label,
        tokenPrefix,
        allowedProviders,
        totalCalls: 0,
        lastUsed: null,
        createdAt,
      },
      rawToken,
    };
  }

  public revokeToken(id: string): boolean {
    const db = getDatabase();
    const res = db.prepare('DELETE FROM router_tokens WHERE id = ?').run(id);
    return Number(res.changes) > 0;
  }

  public validateMasterToken(authHeader?: string): { valid: boolean; token?: RouterToken; error?: string } {
    if (!authHeader) {
      return { valid: false, error: 'Authorization header missing' };
    }

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return { valid: false, error: 'Invalid authorization format. Use Bearer <token>' };
    }

    const rawToken = match[1].trim();
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const db = getDatabase();
    const row = db.prepare('SELECT * FROM router_tokens WHERE token_hash = ?').get(tokenHash) as any;
    if (!row) {
      return { valid: false, error: 'Master Router token invalid or revoked' };
    }

    // Update token usage count
    db.prepare("UPDATE router_tokens SET total_calls = total_calls + 1, last_used = datetime('now') WHERE id = ?").run(row.id);

    return {
      valid: true,
      token: {
        id: row.id,
        label: row.label,
        tokenPrefix: row.token_prefix,
        allowedProviders: JSON.parse(row.allowed_providers || '["all"]'),
        totalCalls: row.total_calls + 1,
        lastUsed: new Date().toISOString(),
        createdAt: row.created_at,
      },
    };
  }

  // --- Gmail Accounts Methods ---
  public getGmailAccounts(userId = 'default-user'): GmailAccount[] {
    const db = getDatabase();
    const rows = db.prepare("SELECT * FROM gmail_accounts WHERE user_id = ? OR user_id = 'default-user' ORDER BY is_primary DESC, added_at ASC").all(userId) as any[];
    
    // Count keys per gmail
    const keyCounts = db.prepare('SELECT gmail_tag, count(*) as count FROM api_keys GROUP BY gmail_tag').all() as any[];
    const countMap = new Map<string, number>();
    for (const kc of keyCounts) {
      countMap.set(kc.gmail_tag, kc.count);
    }

    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      isPrimary: Boolean(r.is_primary),
      avatarColor: r.avatar_color || '#5B6CFF',
      addedAt: r.added_at,
      keyCount: countMap.get(r.email) || 0,
    }));
  }

  public addGmailAccount(email: string, name = '', userId = 'default-user'): GmailAccount {
    const db = getDatabase();
    const id = `gm-${Date.now().toString(36)}`;
    const colors = ['#5B6CFF', '#10A37F', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];
    const addedAt = new Date().toISOString();

    db.prepare(`
      INSERT OR IGNORE INTO gmail_accounts (id, user_id, email, name, is_primary, avatar_color, added_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `).run(id, userId, email, name || email.split('@')[0], avatarColor, addedAt);

    return {
      id,
      email,
      name: name || email.split('@')[0],
      isPrimary: false,
      avatarColor,
      addedAt,
      keyCount: 0,
    };
  }

  // --- Usage Logs Methods ---
  public getLogs(limit = 100, userId = 'default-user'): UsageLog[] {
    const db = getDatabase();
    const rows = db.prepare("SELECT * FROM usage_logs WHERE user_id = ? OR user_id = 'default-user' ORDER BY timestamp DESC LIMIT ?").all(userId, limit) as any[];

    return rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      provider: r.provider as ProviderId,
      keyId: r.key_id,
      keyLabel: r.key_label,
      gmailTag: r.gmail_tag,
      model: r.model,
      tokensUsed: r.tokens_used,
      status: r.status as any,
      latencyMs: r.latency_ms,
      fallbackAttempted: Boolean(r.fallback_attempted),
      fallbackChain: r.fallback_chain ? JSON.parse(r.fallback_chain) : undefined,
      endpoint: r.endpoint,
      promptPreview: r.prompt_preview || undefined,
    }));
  }

  public addLog(log: Omit<UsageLog, 'id' | 'timestamp'>, userId = 'default-user'): UsageLog {
    const db = getDatabase();
    const id = `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const timestamp = new Date().toISOString();

    db.prepare(`
      INSERT INTO usage_logs (
        id, user_id, timestamp, provider, key_id, key_label, gmail_tag, model,
        tokens_used, status, latency_ms, fallback_attempted, fallback_chain, endpoint, prompt_preview
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      timestamp,
      log.provider,
      log.keyId,
      log.keyLabel,
      log.gmailTag,
      log.model,
      log.tokensUsed,
      log.status,
      log.latencyMs,
      log.fallbackAttempted ? 1 : 0,
      log.fallbackChain ? JSON.stringify(log.fallbackChain) : null,
      log.endpoint,
      log.promptPreview || null
    );

    return { id, timestamp, ...log };
  }

  public clearLogs(userId = 'default-user'): void {
    const db = getDatabase();
    db.prepare("DELETE FROM usage_logs WHERE user_id = ? OR user_id = 'default-user'").run(userId);
  }

  // --- Settings Methods ---
  public getSettings(userId = 'default-user'): RouterSettings {
    const db = getDatabase();
    const r = db.prepare("SELECT * FROM settings WHERE user_id = ? OR id = 'global-settings' LIMIT 1").get(userId) as any;
    if (!r) return DEFAULT_SETTINGS;

    return {
      rotationStrategy: (r.rotation_strategy as any) || 'round-robin',
      autoFallback: Boolean(r.auto_fallback),
      maxFallbackRetries: r.max_fallback_retries ?? 3,
      cooldownSeconds: r.cooldown_seconds ?? 60,
      rateLimitTolerance: r.rate_limit_tolerance ?? 2,
      logRetentionDays: r.log_retention_days ?? 30,
    };
  }

  public updateSettings(updates: Partial<RouterSettings>, userId = 'default-user'): RouterSettings {
    const current = this.getSettings(userId);
    const merged = { ...current, ...updates };
    const db = getDatabase();

    db.prepare(`
      INSERT OR REPLACE INTO settings (
        id, user_id, rotation_strategy, auto_fallback, max_fallback_retries, cooldown_seconds, rate_limit_tolerance, log_retention_days
      ) VALUES ('global-settings', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      merged.rotationStrategy,
      merged.autoFallback ? 1 : 0,
      merged.maxFallbackRetries,
      merged.cooldownSeconds,
      merged.rateLimitTolerance,
      merged.logRetentionDays
    );

    return merged;
  }
}

export const routerStore = new PersistentRouterStore();
