'use client';
import React, { useState, useRef, useEffect } from 'react';

export default function OtpInput({ length = 6, onComplete }) {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return; // Only numeric

    const newOtp = [...otp];
    // Take only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // If completely filled out, trigger completion hook
    const combinedOtp = newOtp.join('');
    if (combinedOtp.length === length) {
      onComplete(combinedOtp);
    }

    // Move focus forward if value exists
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

      // Trigger completion hook (with empty string, to reset external state)
      onComplete(newOtp.join(''));

      // Move focus backward
      if (index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft') {
      if (index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowRight') {
      if (index < length - 1 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
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
      onComplete(newOtp.join(''));
      inputRefs.current[length - 1].focus();
    } else if (inputRefs.current[pastedData.length]) {
      inputRefs.current[pastedData.length].focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          value={data}
          ref={(ref) => (inputRefs.current[index] = ref)}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          style={{
            width: '56px',
            height: '64px',
            backgroundColor: 'var(--surface-container-lowest, #060e20)',
            border: 'none',
            borderBottom: `2px solid ${data ? 'var(--primary-container, #6e00ff)' : 'var(--outline, #958da3)'}`,
            textAlign: 'center',
            fontSize: '24px',
            fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
            color: 'var(--on-surface, #dae2fd)',
            outline: 'none',
            transition: 'all 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderBottomColor = 'var(--primary, #d0bcff)';
            e.target.style.backgroundColor = 'var(--surface-container, #171f33)';
          }}
          onBlur={(e) => {
            e.target.style.borderBottomColor = data ? 'var(--primary-container, #6e00ff)' : 'var(--outline, #958da3)';
            e.target.style.backgroundColor = 'var(--surface-container-lowest, #060e20)';
          }}
        />
      ))}
    </div>
  );
}
