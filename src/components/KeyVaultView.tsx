import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  Filter,
  Lock,
  Plus,
  Power,
  RefreshCw,
  Search,
  Sliders,
  Trash2,
  Zap,
} from 'lucide-react';
import { detectProviderFromKey, PROVIDERS } from '../data/providers';
import { ApiKeyItem, GmailAccount, ProviderId } from '../types';
import { ProviderIcon } from './ProviderIcon';

interface Props {
  keys: ApiKeyItem[];
  gmailAccounts: GmailAccount[];
  selectedGmail: string;
  setSelectedGmail: (email: string) => void;
  onAddKey: (params: {
    provider: ProviderId;
    label: string;
    rawKey: string;
    gmailTag: string;
    priority: number;
    customBaseUrl?: string;
    customAuthHeader?: string;
  }) => Promise<void>;
  onToggleKey: (id: string, enabled: boolean) => Promise<void>;
  onDeleteKey: (id: string) => Promise<void>;
  onTestKey: (id: string) => Promise<{ latencyMs: number }>;
  onUpdateKey: (id: string, updates: Partial<ApiKeyItem>) => Promise<void>;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const KeyVaultView: React.FC<Props> = ({
  keys,
  gmailAccounts,
  selectedGmail,
  setSelectedGmail,
  onAddKey,
  onToggleKey,
  onDeleteKey,
  onTestKey,
  onUpdateKey,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [revealedKeyIds, setRevealedKeyIds] = useState<Record<string, boolean>>({});
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testSuccessMessage, setTestSuccessMessage] = useState<{ id: string; msg: string } | null>(null);

  // Add Key Form State
  const [newProvider, setNewProvider] = useState<ProviderId>('openai');
  const [newLabel, setNewLabel] = useState('');
  const [newRawKey, setNewRawKey] = useState('');
  const [newGmailTag, setNewGmailTag] = useState(
    selectedGmail !== 'all' ? selectedGmail : (gmailAccounts[0]?.email || 'itzraviking@gmail.com')
  );
  const [newPriority, setNewPriority] = useState(1);
  const [newCustomBaseUrl, setNewCustomBaseUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Key Modal State
  const [editingKey, setEditingKey] = useState<ApiKeyItem | null>(null);

  // Auto-detect provider as user types the API key
  const handleKeyInputChange = (val: string) => {
    setNewRawKey(val);
    if (val.length > 4) {
      const detected = detectProviderFromKey(val);
      if (detected !== 'custom' && detected !== newProvider) {
        setNewProvider(detected);
      }
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRawKey.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddKey({
        provider: newProvider,
        label: newLabel.trim() || `${newProvider.toUpperCase()} Key`,
        rawKey: newRawKey.trim(),
        gmailTag: newGmailTag.trim(),
        priority: newPriority,
        customBaseUrl: newProvider === 'custom' ? newCustomBaseUrl : undefined,
      });
      // Reset form
      setNewRawKey('');
      setNewLabel('');
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestSingleKey = async (id: string) => {
    setTestingKeyId(id);
    try {
      const res = await onTestKey(id);
      setTestSuccessMessage({ id, msg: `Verified in ${res.latencyMs}ms` });
      setTimeout(() => setTestSuccessMessage(null), 3500);
    } catch (e) {
      setTestSuccessMessage({ id, msg: `Test failed` });
      setTimeout(() => setTestSuccessMessage(null), 3500);
    } finally {
      setTestingKeyId(null);
    }
  };

  // Filter keys
  const filteredKeys = keys.filter((key) => {
    const matchesGmail = selectedGmail === 'all' || key.gmailTag === selectedGmail;
    const matchesProvider = providerFilter === 'all' || key.provider === providerFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      key.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.maskedKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.gmailTag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGmail && matchesProvider && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#141720]/70 p-4 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6C768A]" />
            <input
              id="search-keys-input"
              type="text"
              placeholder="Search by label or masked key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0E1116] py-2 pl-9 pr-4 text-xs text-white placeholder-[#6C768A] focus:border-[#5B6CFF] focus:outline-none"
            />
          </div>

          {/* Provider Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-3.5 w-3.5 text-[#6C768A]" />
            <select
              id="provider-filter-select"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="rounded-xl border border-white/[0.08] bg-[#0E1116] px-3 py-2 text-xs text-[#C5CEE0] focus:border-[#5B6CFF] focus:outline-none"
            >
              <option value="all">All Providers ({keys.length})</option>
              {PROVIDERS.map((p) => {
                const count = keys.filter((k) => k.provider === p.id).length;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Gmail Filter */}
          <select
            id="gmail-filter-select"
            value={selectedGmail}
            onChange={(e) => setSelectedGmail(e.target.value)}
            className="rounded-xl border border-white/[0.08] bg-[#0E1116] px-3 py-2 text-xs text-[#C5CEE0] focus:border-[#5B6CFF] focus:outline-none"
          >
            <option value="all">All Gmail Tags</option>
            {gmailAccounts.map((acc) => (
              <option key={acc.id} value={acc.email}>
                {acc.email}
              </option>
            ))}
          </select>
        </div>

        {/* Add Key Button */}
        <button
          id="vault-add-key-btn"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center space-x-2 rounded-xl bg-[#5B6CFF] px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-[#4E5EEB] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Add New API Key</span>
        </button>
      </div>

      {/* Keys Grid */}
      {filteredKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-[#141720]/40 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#161B26] text-[#6C768A]">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-white">No API Keys Match Your Filter</h3>
          <p className="mt-1 max-w-sm text-xs text-[#8A94A6]">
            Try adjusting your search terms or Gmail identity filter, or add a new key to the vault.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setProviderFilter('all');
              setSelectedGmail('all');
            }}
            className="mt-4 text-xs text-[#5B6CFF] hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredKeys.map((key) => {
            const providerMeta = PROVIDERS.find((p) => p.id === key.provider) || PROVIDERS[0];
            const isRevealed = revealedKeyIds[key.id] || false;
            const isTesting = testingKeyId === key.id;
            const successMsg = testSuccessMessage?.id === key.id ? testSuccessMessage.msg : null;

            return (
              <div
                key={key.id}
                className={`relative rounded-2xl border p-5 transition ${
                  !key.enabled
                    ? 'border-white/[0.04] bg-[#10131A]/60 opacity-60'
                    : key.status === 'cooldown'
                    ? 'border-amber-500/30 bg-[#151720]'
                    : 'border-white/[0.08] bg-[#141720]/80 hover:border-white/[0.14]'
                }`}
              >
                {/* Header: Provider & Actions */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${providerMeta.color}20`, color: providerMeta.color }}
                    >
                      <ProviderIcon provider={key.provider} size={20} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-white">{key.label}</h4>
                        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-[#8A94A6]">
                          {providerMeta.name}
                        </span>
                      </div>
                      {/* Gmail Tag */}
                      <div className="mt-1 flex items-center space-x-1.5 text-xs text-[#717B8F]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#5B6CFF]" />
                        <span>Tagged: {key.gmailTag}</span>
                      </div>
                    </div>
                  </div>

                  {/* Priority and Status Badges */}
                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                        key.priority === 1
                          ? 'bg-[#5B6CFF]/20 text-[#8C9BFF]'
                          : key.priority === 2
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-white/[0.08] text-[#8A94A6]'
                      }`}
                    >
                      P{key.priority}
                    </span>

                    <span
                      className={`inline-flex items-center space-x-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                        !key.enabled
                          ? 'bg-white/[0.05] text-[#6C768A]'
                          : key.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : key.status === 'cooldown'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          !key.enabled
                            ? 'bg-[#6C768A]'
                            : key.status === 'active'
                            ? 'bg-emerald-400'
                            : key.status === 'cooldown'
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-rose-400'
                        }`}
                      />
                      <span className="capitalize">{!key.enabled ? 'Disabled' : key.status}</span>
                    </span>
                  </div>
                </div>

                {/* Key Masked Row */}
                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.04] bg-[#0E1116] px-3 py-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-3.5 w-3.5 text-[#5B6CFF]" />
                    <span className="font-mono text-[#C5CEE0]">
                      {isRevealed ? key.maskedKey.replace('••••••••', '•LIVE•SECURE•') : key.maskedKey}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-[#8A94A6]">
                    <button
                      onClick={() =>
                        setRevealedKeyIds((prev) => ({ ...prev, [key.id]: !prev[key.id] }))
                      }
                      title={isRevealed ? 'Hide' : 'Reveal masked key'}
                      className="rounded p-1 hover:bg-white/[0.06] hover:text-white"
                    >
                      {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(key.maskedKey)}
                      title="Copy masked identifier"
                      className="rounded p-1 hover:bg-white/[0.06] hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Usage Stats Row */}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.04] pt-3 text-center text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-[#6C768A]">Requests</span>
                    <p className="mt-0.5 font-semibold text-white">{key.totalRequests.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#6C768A]">Tokens</span>
                    <p className="mt-0.5 font-semibold text-white">
                      {key.tokensUsed > 1000 ? `${(key.tokensUsed / 1000).toFixed(1)}k` : key.tokensUsed}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#6C768A]">Latency</span>
                    <p className="mt-0.5 font-semibold text-[#8C9BFF]">
                      {key.lastLatencyMs ? `${key.lastLatencyMs}ms` : 'Ready'}
                    </p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-3 text-xs">
                  <div className="flex items-center space-x-2">
                    {/* Live Test Button */}
                    <button
                      id={`test-key-${key.id}`}
                      onClick={() => handleTestSingleKey(key.id)}
                      disabled={isTesting || !key.enabled}
                      className="flex items-center space-x-1.5 rounded-lg border border-white/[0.08] bg-[#161B26] px-2.5 py-1 text-xs text-[#C5CEE0] transition hover:border-[#5B6CFF]/40 hover:text-white disabled:opacity-40"
                    >
                      <RefreshCw className={`h-3 w-3 ${isTesting ? 'animate-spin text-[#5B6CFF]' : ''}`} />
                      <span>{isTesting ? 'Testing...' : 'Test Key'}</span>
                    </button>

                    {successMsg && (
                      <span className="text-[11px] font-medium text-emerald-400">{successMsg}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Toggle Active / Inactive */}
                    <button
                      id={`toggle-key-${key.id}`}
                      onClick={() => onToggleKey(key.id, !key.enabled)}
                      title={key.enabled ? 'Disable Key' : 'Enable Key'}
                      className={`rounded-lg p-1.5 transition ${
                        key.enabled
                          ? 'text-emerald-400 hover:bg-emerald-500/10'
                          : 'text-[#6C768A] hover:bg-white/[0.06]'
                      }`}
                    >
                      <Power className="h-4 w-4" />
                    </button>

                    {/* Edit Key */}
                    <button
                      onClick={() => setEditingKey(key)}
                      title="Edit key priority and label"
                      className="rounded-lg p-1.5 text-[#8A94A6] hover:bg-white/[0.06] hover:text-white"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {/* Delete Key */}
                    <button
                      id={`delete-key-${key.id}`}
                      onClick={() => onDeleteKey(key.id)}
                      title="Delete key"
                      className="rounded-lg p-1.5 text-[#8A94A6] hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD API KEY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#161B26] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5B6CFF]/10 text-[#5B6CFF]">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Add Provider API Key</h3>
                  <p className="text-xs text-[#8A94A6]">Encrypted with AES-256 at rest</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs text-[#8A94A6] hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="mt-4 space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-medium text-[#C5CEE0]">AI Provider</label>
                <div className="mt-1 grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNewProvider(p.id)}
                      className={`flex items-center space-x-2 rounded-xl border p-2 text-left text-xs transition ${
                        newProvider === p.id
                          ? 'border-[#5B6CFF] bg-[#5B6CFF]/15 text-white'
                          : 'border-white/[0.06] bg-[#0E1116] text-[#8A94A6] hover:text-white'
                      }`}
                    >
                      <ProviderIcon provider={p.id} size={14} />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Raw Key Input */}
              <div>
                <label className="block text-xs font-medium text-[#C5CEE0]">API Secret Key</label>
                <input
                  id="modal-raw-key-input"
                  type="password"
                  placeholder="e.g. sk-..., gsk_..., AIzaSy..."
                  value={newRawKey}
                  onChange={(e) => handleKeyInputChange(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0E1116] px-3 py-2 text-xs font-mono text-white placeholder-[#6C768A] focus:border-[#5B6CFF] focus:outline-none"
                />
                <span className="mt-1 block text-[11px] text-[#717B8F]">
                  Auto-detects provider pattern based on prefix. Never exposed to clients.
                </span>
              </div>

              {/* Label */}
              <div>
                <label className="block text-xs font-medium text-[#C5CEE0]">Key Friendly Label</label>
                <input
                  type="text"
                  placeholder={`e.g. Personal ${newProvider.toUpperCase()} #1`}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0E1116] px-3 py-2 text-xs text-white placeholder-[#6C768A] focus:border-[#5B6CFF] focus:outline-none"
                />
              </div>

              {/* Gmail Identity Tag */}
              <div>
                <label className="block text-xs font-medium text-[#C5CEE0]">Gmail Account Tag</label>
                <div className="mt-1 flex items-center space-x-2">
                  <select
                    value={newGmailTag}
                    onChange={(e) => setNewGmailTag(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0E1116] px-3 py-2 text-xs text-white focus:border-[#5B6CFF] focus:outline-none"
                  >
                    {gmailAccounts.map((acc) => (
                      <option key={acc.id} value={acc.email}>
                        {acc.email} ({acc.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority Selection */}
              <div>
                <label className="block text-xs font-medium text-[#C5CEE0]">
                  Rotation Priority / Weight
                </label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {[
                    { val: 1, title: 'P1 - Primary', desc: 'Used first in rotation' },
                    { val: 2, title: 'P2 - Secondary', desc: 'Used if P1 busy' },
                    { val: 3, title: 'P3 - Fallback', desc: 'Emergency backup' },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setNewPriority(p.val)}
                      className={`rounded-xl border p-2 text-left text-xs transition ${
                        newPriority === p.val
                          ? 'border-[#5B6CFF] bg-[#5B6CFF]/15 text-white'
                          : 'border-white/[0.06] bg-[#0E1116] text-[#8A94A6] hover:text-white'
                      }`}
                    >
                      <div className="font-semibold">{p.title}</div>
                      <div className="text-[10px] text-[#6C768A]">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* If Custom Provider: Base URL */}
              {newProvider === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-[#C5CEE0]">
                    Custom OpenAI-Compatible Base URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://your-custom-llm-host.com/v1"
                    value={newCustomBaseUrl}
                    onChange={(e) => setNewCustomBaseUrl(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0E1116] px-3 py-2 text-xs text-white placeholder-[#6C768A] focus:border-[#5B6CFF] focus:outline-none"
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="mt-6 flex items-center justify-end space-x-3 border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-white/[0.08] bg-[#141822] px-4 py-2 text-xs font-medium text-[#8A94A6] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="submit-add-key-btn"
                  type="submit"
                  disabled={isSubmitting || !newRawKey.trim()}
                  className="rounded-xl bg-[#5B6CFF] px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-[#4E5EEB] disabled:opacity-50"
                >
                  {isSubmitting ? 'Encrypting & Saving...' : 'Vault & Encrypt Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#161B26] p-6 shadow-2xl">
            <h3 className="font-semibold text-white">Edit Key Configuration</h3>
            <p className="text-xs text-[#8A94A6]">Update label, Gmail tag, or priority level</p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#C5CEE0]">Label</label>
                <input
                  type="text"
                  value={editingKey.label}
                  onChange={(e) => setEditingKey({ ...editingKey, label: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0E1116] px-3 py-2 text-xs text-white focus:border-[#5B6CFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#C5CEE0]">Priority</label>
                <select
                  value={editingKey.priority}
                  onChange={(e) => setEditingKey({ ...editingKey, priority: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0E1116] px-3 py-2 text-xs text-white focus:border-[#5B6CFF] focus:outline-none"
                >
                  <option value={1}>P1 - Primary</option>
                  <option value={2}>P2 - Secondary</option>
                  <option value={3}>P3 - Fallback</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#C5CEE0]">Gmail Tag</label>
                <select
                  value={editingKey.gmailTag}
                  onChange={(e) => setEditingKey({ ...editingKey, gmailTag: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0E1116] px-3 py-2 text-xs text-white focus:border-[#5B6CFF] focus:outline-none"
                >
                  {gmailAccounts.map((acc) => (
                    <option key={acc.id} value={acc.email}>
                      {acc.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end space-x-3 border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  onClick={() => setEditingKey(null)}
                  className="rounded-xl border border-white/[0.08] bg-[#141822] px-4 py-2 text-xs font-medium text-[#8A94A6] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await onUpdateKey(editingKey.id, {
                      label: editingKey.label,
                      priority: editingKey.priority,
                      gmailTag: editingKey.gmailTag,
                    });
                    setEditingKey(null);
                  }}
                  className="rounded-xl bg-[#5B6CFF] px-4 py-2 text-xs font-medium text-white hover:bg-[#4E5EEB]"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
