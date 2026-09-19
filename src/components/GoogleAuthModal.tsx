import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Mail, User, ShieldCheck, Check, X, ArrowRight } from 'lucide-react';
import { UserProfile, GmailAccount } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (email: string, name?: string) => Promise<void> | void;
  currentUser?: UserProfile | null;
  existingAccounts?: GmailAccount[];
}

export const GoogleAuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConnect,
  currentUser,
  existingAccounts = [],
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsSubmitting(true);
    try {
      await onConnect(emailInput.trim(), nameInput.trim() || undefined);
      setEmailInput('');
      setNameInput('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSelect = (email: string, name?: string) => {
    setEmailInput(email);
    if (name) setNameInput(name);
  };

  const modalContent = (
    <div
      id="google-auth-modal-portal"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-[2px] transition-all duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative my-auto w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl border border-white/[0.12] bg-[#14161F] shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 shrink-0 bg-[#161924] rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B6CFF]/20 text-[#5B6CFF] border border-[#5B6CFF]/30">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Google Account Authentication</h3>
              <p className="text-xs text-[#8A94A6]">Sign in & attach Gmail tag for key routing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8A94A6] hover:bg-white/[0.06] hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-5 text-xs">
          {/* Status badge if already connected */}
          {currentUser && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 shrink-0" />
                <span>
                  Currently signed in as <strong className="font-semibold text-white">{currentUser.email}</strong>
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider rounded bg-emerald-500/20 px-2 py-0.5">
                Connected
              </span>
            </div>
          )}

          {/* Quick pick from known accounts */}
          {existingAccounts.length > 0 && (
            <div>
              <label className="block font-medium text-[#C5CEE0] mb-2">
                Quick Select Known Account:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {existingAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickSelect(acc.email, acc.name)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                      emailInput === acc.email
                        ? 'border-[#5B6CFF] bg-[#5B6CFF]/15 text-white'
                        : 'border-white/[0.06] bg-[#0E1117] text-[#9DA8BE] hover:border-white/[0.15] hover:text-white'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="font-medium text-white truncate">{acc.name}</div>
                      <div className="text-[10px] text-[#717B8F] truncate">{acc.email}</div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <form id="google-auth-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#C5CEE0]">
                Google / Gmail Address <span className="text-[#5B6CFF]">*</span>
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#6C768A]" />
                <input
                  ref={inputRef}
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0B0D12] py-2.5 pl-9 pr-3 text-xs text-white placeholder-[#6C768A] focus:border-[#5B6CFF] focus:ring-1 focus:ring-[#5B6CFF] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#C5CEE0]">
                Display Name / Workspace Tag (Optional)
              </label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-[#6C768A]" />
                <input
                  type="text"
                  placeholder="e.g. Personal Sandbox, Work Production"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0B0D12] py-2.5 pl-9 pr-3 text-xs text-white placeholder-[#6C768A] focus:border-[#5B6CFF] focus:ring-1 focus:ring-[#5B6CFF] focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-[#0E1117] p-3.5 text-xs text-[#8A94A6] space-y-1.5">
              <div className="flex items-center space-x-2 text-white font-medium">
                <ShieldCheck className="h-4 w-4 text-[#5B6CFF]" />
                <span>Multi-Account Key Isolation</span>
              </div>
              <p className="leading-relaxed text-[11px] text-[#8C98AC]">
                Keys tagged under this Gmail account will be isolated. You can route API requests strictly through keys attached to this Gmail account using the header <code className="rounded bg-white/[0.06] px-1 py-0.5 text-[#5B6CFF]">x-gmail-tag: {emailInput || 'your-account@gmail.com'}</code>.
              </p>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 border-t border-white/[0.08] px-6 py-4 shrink-0 bg-[#161924] rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] bg-[#141822] px-4 py-2 text-xs font-medium text-[#8A94A6] hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="google-auth-form"
            disabled={isSubmitting || !emailInput.trim()}
            className="flex items-center space-x-2 rounded-xl bg-[#5B6CFF] px-4 py-2 text-xs font-medium text-white shadow-lg shadow-[#5B6CFF]/20 hover:bg-[#4E5EEB] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Linking Account...</span>
              </>
            ) : (
              <span>Authenticate & Link Gmail</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
