import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Timer } from 'lucide-react';

/**
 * Utility to mask email for security display (e.g. atharvakapse@gmail.com -> ath***@gmail.com)
 */
function maskEmail(email = '') {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 3) {
    return `${local[0]}***@${domain}`;
  }
  return `${local.slice(0, 3)}***@${domain}`;
}

export default function OtpCard({
  title = "Verify Your Account",
  subtitle = "We sent a 6-digit security code to your email.",
  email = "",
  length = 6,
  onVerify,
  onResend,
  loading = false,
  errorMsg = "",
  buttonText = "Verify Account"
}) {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Timer countdown for resend button
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-advance focus
    if (value && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);

      if (index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim().slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, idx) => {
      newOtp[idx] = char;
    });
    setOtp(newOtp);

    if (pastedData.length === length) {
      inputRefs.current[length - 1].focus();
    } else if (inputRefs.current[pastedData.length]) {
      inputRefs.current[pastedData.length].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length === length && onVerify) {
      onVerify(fullCode);
    }
  };

  const handleResendClick = () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(60);
    if (onResend) onResend();
  };

  const isComplete = otp.join('').length === length;

  return (
    <div className="max-w-md w-full bg-[#0B0F19] border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] mx-auto">
      {/* Top Brand Gradient Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#9333EA]/30 via-[#0EA5E9] to-[#9333EA]/30"></div>

      {/* Card Header */}
      <div className="text-center mb-8">
        <div className="inline-flex p-3.5 bg-[#0EA5E9]/10 rounded-2xl text-[#0EA5E9] mb-4 shadow-[0_0_25px_rgba(14,165,233,0.2)] border border-[#0EA5E9]/20">
          <ShieldCheck width={32} height={32} />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">{title}</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          {subtitle}
          {email && (
            <>
              <br />
              <span className="text-[#38BDF8] font-mono font-semibold text-sm">{maskEmail(email)}</span>
            </>
          )}
        </p>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit}>
        {/* OTP Input Grid */}
        <div className="mb-6">
          <div className="flex justify-between gap-2 sm:gap-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                maxLength={1}
                value={digit}
                placeholder="·"
                onChange={(e) => handleChange(e, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onPaste={handlePaste}
                className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-mono font-bold rounded-xl bg-[#111827]/80 border transition-all outline-none text-white caret-[#0EA5E9] ${
                  digit
                    ? 'border-[#0EA5E9] shadow-[0_0_12px_rgba(14,165,233,0.3)] bg-[#0EA5E9]/10'
                    : 'border-white/10 hover:border-white/20 focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9]/50 focus:shadow-[0_0_15px_rgba(14,165,233,0.25)]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <p className="text-red-400 text-xs font-medium text-center mb-4 bg-red-500/10 border border-red-500/20 py-2 rounded-lg">
            {errorMsg}
          </p>
        )}

        {/* Verify Action Button */}
        <button
          type="submit"
          disabled={loading || !isComplete}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all mb-6 flex items-center justify-center gap-2 cursor-pointer ${
            isComplete && !loading
              ? 'bg-[#0EA5E9] text-slate-950 shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:shadow-[0_0_30px_rgba(14,165,233,0.6)] hover:brightness-110'
              : 'bg-white/10 text-gray-400 cursor-not-allowed opacity-60'
          }`}
        >
          <ShieldCheck width={20} height={20} />
          <span>{loading ? 'Verifying...' : buttonText}</span>
        </button>

        {/* Resend Footer */}
        <div className="text-center text-xs sm:text-sm text-gray-400 flex flex-col sm:flex-row items-center justify-center gap-1.5">
          <p>Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResendClick}
            disabled={!canResend}
            className={`flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
              canResend
                ? 'text-[#0EA5E9] hover:text-[#38BDF8]'
                : 'text-gray-500 cursor-not-allowed'
            }`}
          >
            <Timer width={14} height={14} />
            {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
          </button>
        </div>
      </form>
    </div>
  );
}
