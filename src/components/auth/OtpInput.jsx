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
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    const combinedOtp = newOtp.join('');
    if (combinedOtp.length === length) {
      onComplete(combinedOtp);
    }

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

      onComplete(newOtp.join(''));

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
      onComplete(newOtp.join(''));
      inputRefs.current[length - 1].focus();
    } else if (inputRefs.current[pastedData.length]) {
      inputRefs.current[pastedData.length].focus();
    }
  };

  return (
    <div className="flex justify-between gap-2 sm:gap-4 my-2">
      {otp.map((data, index) => (
        <input
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          type="text"
          maxLength={1}
          value={data}
          placeholder="·"
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg bg-[#0a0f1d]/80 border transition-all outline-none text-white caret-[#0ea5e9] ${
            data
              ? 'border-[#0ea5e9] shadow-[0_0_10px_rgba(0,240,255,0.3)] bg-[#0ea5e9]/10'
              : 'border-white/10 hover:border-white/20 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9]/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.25)]'
          }`}
        />
      ))}
    </div>
  );
}
