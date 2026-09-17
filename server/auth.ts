import crypto from 'crypto';
import { getDatabase } from './db';
import { routerStore } from './store';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  avatar?: string;
}

export function getUserByEmail(email: string): UserSession | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!row) return null;
  return {
    userId: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar || undefined,
  };
}

export function getUserById(id: string): UserSession | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!row) return null;
  return {
    userId: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar || undefined,
  };
}

export function createOrUpdateGoogleUser(profile: {
  email: string;
  name: string;
  avatar?: string;
}): UserSession {
  const db = getDatabase();
  const existing = getUserByEmail(profile.email);

  if (existing) {
    db.prepare('UPDATE users SET name = ?, avatar = ? WHERE id = ?').run(
      profile.name,
      profile.avatar || null,
      existing.userId
    );
    // Ensure this email exists in gmail_accounts for this user
    routerStore.addGmailAccount(profile.email, profile.name, existing.userId);
    return {
      userId: existing.userId,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar,
    };
  }

  const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
  db.prepare(`
    INSERT INTO users (id, email, name, avatar, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(userId, profile.email, profile.name, profile.avatar || null);

  // Auto-create primary gmail_accounts row for this authenticated Google user
  const accountId = `gm-${Date.now().toString(36)}`;
  db.prepare(`
    INSERT OR IGNORE INTO gmail_accounts (id, user_id, email, name, is_primary, avatar_color, added_at)
    VALUES (?, ?, ?, ?, 1, '#5B6CFF', datetime('now'))
  `).run(accountId, userId, profile.email, profile.name);

  return {
    userId,
    email: profile.email,
    name: profile.name,
    avatar: profile.avatar,
  };
}
