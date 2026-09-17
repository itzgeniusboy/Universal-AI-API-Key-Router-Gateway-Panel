import React, { useState } from 'react';
import {
  Check,
  Download,
  HelpCircle,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Sliders,
  Upload,
  User,
} from 'lucide-react';
import { GmailAccount, RouterSettings } from '../types';

interface Props {
  settings: RouterSettings;
  gmailAccounts: GmailAccount[];
  onUpdateSettings: (newSettings: Partial<RouterSettings>) => Promise<void>;
  onAddGmailAccount: (email: string, name: string) => Promise<void>;
}

export const SettingsView: React.FC<Props> = ({
  settings,
  gmailAccounts,
  onUpdateSettings,
  onAddGmailAccount,
}) => {
  const [currentSettings, setCurrentSettings] = useState<RouterSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [newGmailEmail, setNewGmailEmail] = useState('');
  const [newGmailName, setNewGmailName] = useState('');
  const [isAddingGmail, setIsAddingGmail] = useState(false);

  const handleSaveSettings = async () => {
    await onUpdateSettings(currentSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleCreateGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGmailEmail.trim()) return;

    await onAddGmailAccount(newGmailEmail.trim(), newGmailName.trim());
    setNewGmailEmail('');
    setNewGmailName('');
    setIsAddingGmail(false);
  };

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#141720]/70 p-6 backdrop-blur-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#5B6CFF]">
          <Sliders className="h-4 w-4" />
          <span>Routing Policies & Identities</span>
        </div>
        <h2 className="mt-1 text-xl font-bold text-white">Gateway Engine Configuration</h2>
        <p className="mt-1 text-xs text-[#8A94A6]">
          Configure auto-rotation algorithms, continuous failover behaviors, and manage your tagged Gmail identities.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Router Policies */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.08] bg-[#141720]/80 p-6 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-white">Rotation & Failover Strategy</h3>

            <div className="mt-4 space-y-4 text-xs">
              {/* Strategy picker */}
              <div>
                <div className="flex items-center space-x-1.5">
                  <label className="block font-medium text-[#C5CEE0]">Key Selection Algorithm (Rotation Strategy)</label>
                  <div className="group relative cursor-help">
                    <HelpCircle className="h-3.5 w-3.5 text-[#5B6CFF]/80 group-hover:text-[#8C9BFF] transition-colors" />
                    <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-white/[0.12] bg-[#14161A] p-3 text-xs text-[#C5CEE0] opacity-0 shadow-2xl backdrop-blur-xl transition-all duration-200 group-hover:opacity-100 group-hover:pointer-events-auto">
                      <p className="font-semibold text-white mb-1">Rotation Strategy</p>
                      <p className="text-[11px] leading-relaxed text-[#9DA8BE]">
                        Determines the routing algorithm used across active keys: <strong className="text-white">Priority First</strong> routes to highest priority keys and reserves lower tiers as emergency backups; <strong className="text-white">Round-Robin</strong> distributes load equally across all matching keys; <strong className="text-white">Least Recently Used</strong> balances lifetime wear.
                      </p>
                    </div>
                  </div>
                </div>
                <select
                  id="settings-strategy-select"
                  value={currentSettings.rotationStrategy}
                  onChange={(e) =>
                    setCurrentSettings({
                      ...currentSettings,
                      rotationStrategy: e.target.value as any,
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#0E1116] px-3 py-2 text-xs text-white focus:border-[#5B6CFF] focus:outline-none"
                >
                  <option value="round-robin">Round-Robin (Even Distribution)</option>
                  <option value="least-recently-used">Least Recently Used (Balanced Wear)</option>
                  <option value="priority-weight">Priority First (P1 then P2 Fallback)</option>
                </select>
                <span className="mt-1 block text-[11px] text-[#717B8F]">
                  Determines which active key handles each incoming request.
                </span>
              </div>

              {/* Auto Fallback switch */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0E1116] p-3">
                <div>
                  <span className="font-medium text-white">Continuous Flow (Auto-Fallback)</span>
                  <p className="text-[11px] text-[#717B8F]">
                    Silently retries with next healthy key on HTTP 429 rate limit.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={currentSettings.autoFallback}
                  onChange={(e) =>
                    setCurrentSettings({ ...currentSettings, autoFallback: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-white/[0.1] bg-[#161B26] text-[#5B6CFF] focus:ring-0"
                />
              </div>

              {/* Cooldown duration */}
              <div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5">
                    <label className="font-medium text-[#C5CEE0]">Rate-Limit Cooldown Duration</label>
                    <div className="group relative cursor-help">
                      <HelpCircle className="h-3.5 w-3.5 text-[#5B6CFF]/80 group-hover:text-[#8C9BFF] transition-colors" />
                      <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-white/[0.12] bg-[#14161A] p-3 text-xs text-[#C5CEE0] opacity-0 shadow-2xl backdrop-blur-xl transition-all duration-200 group-hover:opacity-100 group-hover:pointer-events-auto">
                        <p className="font-semibold text-white mb-1">Cooldown Quarantine</p>
                        <p className="text-[11px] leading-relaxed text-[#9DA8BE]">
                          When an upstream provider returns HTTP 429 (Rate Limit), the gateway immediately flags that key into cooldown. During cooldown, traffic routes to alternate healthy keys. Once the timer expires, the router sends a lightweight canary request to restore the key into service.
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className="text-[#8C9BFF]">{currentSettings.cooldownSeconds} seconds</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={300}
                  step={15}
                  value={currentSettings.cooldownSeconds}
                  onChange={(e) =>
                    setCurrentSettings({
                      ...currentSettings,
                      cooldownSeconds: Number(e.target.value),
                    })
                  }
                  className="mt-2 w-full accent-[#5B6CFF]"
                />
                <span className="mt-1 block text-[11px] text-[#717B8F]">
                  Time a rate-limited key stays sidelined before re-entering rotation pool.
                </span>
              </div>

              {/* Max retries */}
              <div>
                <label className="block font-medium text-[#C5CEE0]">Maximum Fallback Retries</label>
                <select
                  value={currentSettings.maxFallbackRetries}
                  onChange={(e) =>
                    setCurrentSettings({
                      ...currentSettings,
                      maxFallbackRetries: Number(e.target.value),
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#0E1116] px-3 py-2 text-xs text-white focus:border-[#5B6CFF] focus:outline-none"
                >
                  <option value={1}>1 Retry</option>
                  <option value={2}>2 Retries</option>
                  <option value={3}>3 Retries (Recommended)</option>
                  <option value={5}>5 Retries</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  id="save-settings-btn"
                  onClick={handleSaveSettings}
                  className="flex items-center space-x-2 rounded-xl bg-[#5B6CFF] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4E5EEB]"
                >
                  {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  <span>{isSaved ? 'Settings Saved' : 'Save Routing Policies'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Security details */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#141720]/80 p-6 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Shield className="h-4 w-4" />
              <span>Storage Encryption At Rest</span>
            </div>
            <h4 className="mt-1 font-semibold text-white">AES-256-CBC with SHA-256 Digest</h4>
            <p className="mt-1 text-xs text-[#8A94A6]">
              All vaulted API keys are encrypted at rest using a 32-byte secret key and 16-byte initialization vector. Keys are decrypted exclusively in memory at request dispatch time and never returned in plaintext to the browser.
            </p>
          </div>
        </div>

        {/* Right: Gmail Accounts Management */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.08] bg-[#141720]/80 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Gmail Identity Tags</h3>
                <p className="text-xs text-[#8A94A6]">
                  Organize and track which Google account owns which provider key.
                </p>
              </div>
              <button
                id="add-gmail-tag-btn"
                onClick={() => setIsAddingGmail(true)}
                className="flex items-center space-x-1.5 rounded-xl border border-white/[0.08] bg-[#161B26] px-3 py-1.5 text-xs text-[#C5CEE0] hover:border-[#5B6CFF]/40 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Account</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {gmailAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0E1116] p-3 text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-semibold text-xs"
                      style={{ backgroundColor: acc.avatarColor }}
                    >
                      {acc.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-medium text-white">{acc.name}</span>
                        {acc.isPrimary && (
                          <span className="rounded bg-[#5B6CFF]/20 px-1.5 py-0.2 text-[10px] text-[#8C9BFF]">
                            Primary
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#717B8F]">{acc.email}</span>
                    </div>
                  </div>

                  <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[11px] text-[#8A94A6]">
                    {acc.keyCount || 0} keys tagged
                  </span>
                </div>
              ))}
            </div>

            {/* Add Gmail Form Modal */}
            {isAddingGmail && (
              <form onSubmit={handleCreateGmail} className="mt-4 rounded-xl border border-white/[0.08] bg-[#161B26] p-4 space-y-3 text-xs">
                <h4 className="font-semibold text-white">Add Gmail Account Identity</h4>
                <div>
                  <label className="block text-[#C5CEE0]">Gmail Address</label>
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={newGmailEmail}
                    onChange={(e) => setNewGmailEmail(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0E1116] px-3 py-1.5 text-xs text-white focus:border-[#5B6CFF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#C5CEE0]">Account Label / Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Work AI Sandbox"
                    value={newGmailName}
                    onChange={(e) => setNewGmailName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0E1116] px-3 py-1.5 text-xs text-white focus:border-[#5B6CFF] focus:outline-none"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingGmail(false)}
                    className="rounded-lg border border-white/[0.08] px-3 py-1 text-xs text-[#8A94A6] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#5B6CFF] px-3 py-1 text-xs font-medium text-white hover:bg-[#4E5EEB]"
                  >
                    Add Tag
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
