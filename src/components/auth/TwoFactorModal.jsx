'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Shield, ShieldAlert, KeyRound, Copy, Check, X, Smartphone, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { verifyMFA, verifyBackupCodeOnServer } from '../../lib/mfa';

export default function TwoFactorModal({
  isOpen,
  onClose,
  onSuccess,
  factorId = null,
  userEmail = null,
  title = 'Two-Factor Verification',
  description = 'Enter the 6-digit code from your authenticator app to verify your identity.',
  mode = 'verify', // 'verify' | 'enroll' | 'backup'
  enrollData = null, // { qr_code, secret, backupCodes }
}) {
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState('');
  const [isBackupMode, setIsBackupMode] = useState(mode === 'backup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [enrolledBackupCodes, setEnrolledBackupCodes] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError('');
      setEnrolledBackupCodes(null);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isBackupMode]);

  if (!isOpen || !mounted) return null;

  const handleCopySecret = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = (codes) => {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadBackupCodes = (codes) => {
    const element = document.createElement("a");
    const file = new Blob([
      `CODE PLUS ACADEMY - 2FA BACKUP CODES\nGenerated: ${new Date().toISOString()}\n\n` +
      `Keep these 8 codes safe and offline. Each code can only be used once.\n\n` +
      codes.join('\n')
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "cpa-backup-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!code.trim()) return;

    setError('');
    setLoading(true);

    try {
      if (isBackupMode) {
        // Verify via backup code
        await verifyBackupCodeOnServer(code, userEmail);
        onSuccess?.({ type: 'backup' });
        onClose();
      } else {
        // Verify via TOTP challenge/verify
        if (factorId) {
          await verifyMFA({ factorId, code });
        } else {
          await verifyBackupCodeOnServer(code, userEmail);
        }

        if (mode === 'enroll') {
          // If enrolling, generate and persist backup codes, then show them
          const { generateBackupCodes, saveBackupCodesToServer } = await import('../../lib/mfa');
          const generatedCodes = enrollData?.backupCodes || generateBackupCodes(8);
          await saveBackupCodesToServer(generatedCodes);
          setEnrolledBackupCodes(generatedCodes);
        } else {
          onSuccess?.({ type: 'totp', code });
          onClose();
        }
      }
    } catch (err) {
      console.error('[TwoFactorModal Error]:', err);
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity animate-fadeIn"
      style={{ zIndex: 9999999 }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div
        className="w-full max-w-md border rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all transform animate-slideUp"
        style={{
          background: 'var(--surface, #111827)',
          borderColor: 'var(--border, rgba(255,255,255,0.1))',
          color: 'var(--text, #f9fafb)',
          fontFamily: 'var(--font-body, sans-serif)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border, rgba(255,255,255,0.08))' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'var(--blue-dim, rgba(59, 124, 255, 0.12))',
                color: 'var(--primary, #3B7CFF)',
              }}
            >
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide" style={{ color: 'var(--text)' }}>
                {title}
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--dim)' }}>
                Security Assurance Level (AAL2)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {enrolledBackupCodes ? (
            /* Post-Enrollment Backup Codes Reveal */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border flex items-start gap-3 bg-amber-500/10 border-amber-500/30 text-amber-300">
                <ShieldAlert size={20} className="flex-shrink-0 mt-0.5 text-amber-400" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-amber-200 mb-1">Save these backup codes now</p>
                  <p className="text-amber-300/90">
                    Store these 8 backup codes offline in a password manager or safe location. If you lose access to your device, they are the only way to sign into your account.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border space-y-3" style={{ background: 'var(--s2)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider" style={{ color: 'var(--dim)' }}>
                    Your Backup Codes
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyBackupCodes(enrolledBackupCodes)}
                      className="px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      style={{ background: 'var(--s3)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      {copiedCodes ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                      <span>{copiedCodes ? 'Copied All' : 'Copy All'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadBackupCodes(enrolledBackupCodes)}
                      className="px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      style={{ background: 'var(--s3)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {enrolledBackupCodes.map((c, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg bg-black/30 font-mono text-xs font-bold text-center border border-white/5" style={{ color: 'var(--text)' }}>
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSuccess?.({ type: 'totp', backupCodes: enrolledBackupCodes });
                  onClose();
                }}
                className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg"
                style={{
                  background: 'var(--gradient-brand, linear-gradient(135deg, #3B7CFF, #9333EA))',
                  color: '#ffffff',
                }}
              >
                <span>✓ I Have Saved My Backup Codes</span>
                <Check size={16} />
              </button>
            </div>
          ) : mode === 'enroll' && enrollData ? (
            /* Enrollment Step */
            <div className="space-y-4">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--sub)' }}>
                Scan this QR code with Google Authenticator, Authy, or 1Password:
              </p>

              {/* QR Code display */}
              {enrollData.totp?.qr_code && (
                <div className="flex flex-col items-center justify-center p-3 rounded-xl border bg-white" style={{ borderColor: 'var(--border)' }}>
                  <img
                    src={enrollData.totp.qr_code}
                    alt="2FA QR Code"
                    className="w-48 h-48 object-contain"
                  />
                </div>
              )}

              {/* Secret key for manual entry */}
              {enrollData.totp?.secret && (
                <div className="p-2.5 rounded-xl border flex items-center justify-between" style={{ background: 'var(--s2)', borderColor: 'var(--border)' }}>
                  <div className="min-w-0 pr-2">
                    <p className="text-[10px] uppercase font-mono" style={{ color: 'var(--dim)' }}>Manual Secret Key</p>
                    <p className="text-xs font-mono font-bold truncate" style={{ color: 'var(--text)' }}>
                      {enrollData.totp.secret}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopySecret(enrollData.totp.secret)}
                    className="p-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    style={{ background: 'var(--s3)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    {copiedSecret ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    <span className="text-[10px]">{copiedSecret ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 pt-2">
                <label className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>
                  Enter 6-digit verification code to activate:
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.4em] font-mono text-xl py-2.5 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{
                    background: 'var(--s2)',
                    borderColor: error ? 'var(--danger, #ef4444)' : 'var(--border)',
                    color: 'var(--text)',
                  }}
                  autoFocus
                />

                {error && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <ShieldAlert size={14} /> {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                  style={{
                    background: 'var(--gradient-brand, linear-gradient(135deg, #3B7CFF, #9333EA))',
                    color: '#ffffff',
                    opacity: (loading || code.length < 6) ? 0.6 : 1,
                  }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Enable 2FA'}
                </button>
              </form>
            </div>
          ) : (
            /* Verification / Step-Up Step */
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--sub)' }}>
                {isBackupMode
                  ? 'Enter one of your 8-character backup codes (e.g. ABCD-1234):'
                  : description}
              </p>

              <div>
                <input
                  ref={inputRef}
                  type="text"
                  maxLength={isBackupMode ? 10 : 6}
                  value={code}
                  onChange={(e) => {
                    const val = isBackupMode ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, '');
                    setCode(val);
                  }}
                  placeholder={isBackupMode ? 'XXXX-XXXX' : '000000'}
                  className="w-full text-center tracking-[0.3em] font-mono text-xl py-3 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{
                    background: 'var(--s2)',
                    borderColor: error ? 'var(--danger, #ef4444)' : 'var(--border)',
                    color: 'var(--text)',
                  }}
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <ShieldAlert size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (isBackupMode ? code.length < 8 : code.length < 6)}
                className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                style={{
                  background: 'var(--gradient-brand, linear-gradient(135deg, #3B7CFF, #9333EA))',
                  color: '#ffffff',
                  opacity: (loading || (isBackupMode ? code.length < 8 : code.length < 6)) ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsBackupMode(!isBackupMode);
                    setCode('');
                    setError('');
                  }}
                  className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1.5"
                >
                  <KeyRound size={13} />
                  {isBackupMode ? 'Use Authenticator App 6-digit code' : 'Lost authenticator? Use Backup Code'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
