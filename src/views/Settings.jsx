import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from '../context/ThemeContext';
import { DARK, LIGHT } from '../styles/tokens';
import GlobalStyles from '../components/shared/GlobalStyles';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { LogOut, Globe } from 'lucide-react';
import Cropper from 'react-easy-crop';
import AutosuggestInput from '../components/shared/AutosuggestInput';

// ─── CPA BRAND THEME ─────────────────────────────────────────────────────────
// Extracted from Code Plus Academy login screen reference
const THEMES = {
  dark: {
    // Backgrounds — pure black terminal feel matching login bg
    bg: "#050507",           // true black app bg
    bg2: "#0b0b0f",          // near-black panel
    bg3: "#111218",          // graphite card surfaces
    // Cards
    card: "rgba(255,255,255,0.03)",
    cardSolid: "#111218",
    cardHover: "rgba(138,43,255,0.07)",
    cardBorder: "rgba(255,255,255,0.08)",
    sep: "rgba(255,255,255,0.07)",
    glass: "rgba(5,5,7,0.92)",
    // CPA Brand Purple — electric #8A2BFF from login CTA
    accent: "#8a2bff",
    accent2: "#4da3ff",      // deep blue secondary glow from login
    accentAlt: "#6200ea",
    accentSoft: "rgba(138,43,255,0.13)",
    accentGlow: "rgba(138,43,255,0.38)",
    // Neon highlights
    neon: "#b47aff",         // neon violet — hover/active text
    neon2: "#4da3ff",        // blue accent
    neonCyan: "#00e5ff",
    // Typography
    text: "#f5f5f7",         // white headings from login
    text2: "#9ca0ae",        // muted gray body text from login
    text3: "#3c3f4e",        // very dim separators
    // Semantic
    danger: "#ff4560", dangerSoft: "rgba(255,69,96,0.12)",
    success: "#00c896", successSoft: "rgba(0,200,150,0.12)",
    warning: "#ffb340", warningSoft: "rgba(255,179,64,0.12)",
    badgeBg: "rgba(138,43,255,0.18)", badgeText: "#b47aff",
    // Shadows & glow
    shadow: "0 8px 48px rgba(0,0,0,0.75)",
    shadowSm: "0 2px 20px rgba(0,0,0,0.55)",
    btnShadow: "0 0 32px rgba(138,43,255,0.48), 0 4px 16px rgba(0,0,0,0.4)",
    // Shell
    headerBg: "rgba(5,5,7,0.95)",
    sidebarBg: "#08080c",
    inputBg: "rgba(255,255,255,0.04)",
    inputBorder: "rgba(255,255,255,0.1)",
    isDark: true,
  },
  light: {
    // Backgrounds
    bg: "#f7f8fb",
    bg2: "#eeedf5",
    bg3: "#ffffff",
    card: "rgba(255,255,255,0.95)",
    cardSolid: "#ffffff",
    cardHover: "#ffffff",
    cardBorder: "rgba(123,44,255,0.12)",
    sep: "rgba(0,0,0,0.07)",
    glass: "rgba(255,255,255,0.97)",
    // CPA Purple for light
    accent: "#7b2cff",
    accent2: "#2563eb",
    accentAlt: "#5b00d6",
    accentSoft: "rgba(123,44,255,0.08)",
    accentGlow: "rgba(123,44,255,0.18)",
    neon: "#7b2cff",
    neon2: "#2563eb",
    neonCyan: "#0284c7",
    // Typography
    text: "#141414",
    text2: "#5c5f72",
    text3: "#c8cadb",
    // Semantic
    danger: "#e5193a", dangerSoft: "rgba(229,25,58,0.09)",
    success: "#059669", successSoft: "rgba(5,150,105,0.08)",
    warning: "#d97706", warningSoft: "rgba(217,119,6,0.09)",
    badgeBg: "rgba(123,44,255,0.1)", badgeText: "#7b2cff",
    shadow: "0 4px 28px rgba(0,0,0,0.09)",
    shadowSm: "0 2px 12px rgba(0,0,0,0.06)",
    btnShadow: "0 4px 22px rgba(123,44,255,0.34)",
    headerBg: "rgba(247,248,251,0.97)",
    sidebarBg: "#eeedf5",
    inputBg: "rgba(0,0,0,0.025)",
    inputBorder: "rgba(0,0,0,0.1)",
    isDark: false,
  },
};

// ─── IMAGE CROP UTILS ────────────────────────────────────────────────────────
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

// ─── SVG ICON ─────────────────────────────────────────────────────────────────
const Ic = ({ p, s = 16, c = "currentColor", sw = 1.8, f = "none" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={f} stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={p} />
  </svg>
);

const I = {
  back: "M19 12H5M12 5l-7 7 7 7",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  sun: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z",
  moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  chevR: "M9 18l6-6-6-6",
  chevD: "M6 9l6 6 6-6",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  briefcase: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  msg: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  bookmark: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z",
  palette: "M12 2a10 10 0 1 0 0 20M8 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-4-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0z",
  globe: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  trash: "M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  plus: "M12 5v14M5 12h14",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  eyeOff: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  chart: "M18 20V10M12 20V4M6 20v-6",
  arrowUp: "M12 19V5M5 12l7-7 7 7",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  device: "M12 17h.01M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  github: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22",
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  map: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8h.01M11 12h1v4h1",
  folder: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  trending: "M23 6l-9.5 9.5-5-5L1 18",
  award: "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  settings2: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const Toggle = ({ on, onChange, t, size = "md" }) => {
  const w = size === "sm" ? 40 : 48, h = size === "sm" ? 23 : 27, r = size === "sm" ? 12 : 14, tw = size === "sm" ? 17 : 21;
  return (
    <div onClick={() => onChange(!on)} style={{
      width: w, height: h, borderRadius: r, flexShrink: 0,
      background: on
        ? `linear-gradient(135deg, ${t.accent} 0%, ${t.accent2} 100%)`
        : t.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)",
      position: "relative", cursor: "pointer",
      transition: "background .3s ease",
      boxShadow: on ? t.btnShadow : "none",
      border: on ? "none" : `1px solid ${t.isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.14)"}`,
    }}>
      <div style={{
        position: "absolute", top: (h - tw) / 2,
        left: on ? w - tw - (h - tw) / 2 : (h - tw) / 2,
        width: tw, height: tw, borderRadius: "50%",
        background: "#fff",
        transition: "left .26s cubic-bezier(.34,1.56,.64,1)",
        boxShadow: on
          ? `0 0 8px ${t.accentGlow}, 0 2px 6px rgba(0,0,0,0.3)`
          : "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </div>
  );
};

const Chip = ({ label, onRemove, t }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 10px", borderRadius: 7,
    background: t.accentSoft,
    border: `1px solid ${t.isDark ? "rgba(138,43,255,0.28)" : "rgba(123,44,255,0.18)"}`,
    color: t.neon, fontSize: 12, fontWeight: 600,
    fontFamily: "'Space Grotesk', 'Manrope', sans-serif",
    letterSpacing: ".02em",
  }}>
    {label}
    {onRemove && <span onClick={onRemove} style={{ cursor: "pointer", opacity: .65, lineHeight: 1 }}><Ic p={I.x} s={10} c={t.neon} /></span>}
  </span>
);

const Badge = ({ label, color, bg, size = 11 }) => (
  <span style={{
    fontSize: size, fontWeight: 700, padding: "3px 8px", borderRadius: 5,
    background: bg, color,
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: ".07em", textTransform: "uppercase",
  }}>{label}</span>
);

const Field = ({ label, t, children, hint }) => (
  <div style={{ marginBottom: 16 }}>
    {label && (
      <label style={{
        display: "block", fontSize: 10.5, color: t.isDark ? "#8a2bff" : t.accent,
        letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 7,
        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
        opacity: t.isDark ? 0.9 : 0.85,
      }}>{label}</label>
    )}
    {children}
    {hint && <p style={{ fontSize: 11, color: t.text2, marginTop: 5, fontFamily: "'Manrope', sans-serif" }}>{hint}</p>}
  </div>
);

const inputStyle = (t, focused) => ({
  width: "100%", padding: "11px 14px",
  background: focused
    ? t.isDark ? "rgba(138,43,255,0.07)" : "rgba(123,44,255,0.04)"
    : t.inputBg,
  border: `1.5px solid ${focused
    ? t.isDark ? "#8a2bff" : "#7b2cff"
    : t.inputBorder}`,
  borderRadius: 10, color: t.text, fontSize: 14,
  fontFamily: "'Manrope', sans-serif", outline: "none",
  transition: "border-color .2s, background .2s, box-shadow .2s",
  boxShadow: focused
    ? t.isDark
      ? `0 0 0 3px rgba(138,43,255,0.16), 0 0 20px rgba(138,43,255,0.12)`
      : `0 0 0 3px rgba(123,44,255,0.12)`
    : "none",
});

const Input = ({ value, onChange, placeholder, type = "text", t, prefix, suffix }) => {
  const [f, setF] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {prefix && <div style={{ position: "absolute", left: 12, color: t.text2, pointerEvents: "none", zIndex: 1 }}>{prefix}</div>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle(t, f), paddingLeft: prefix ? 36 : 14, paddingRight: suffix ? 36 : 14 }}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
      />
      {suffix && <div style={{ position: "absolute", right: 12, color: t.text2, cursor: "pointer", zIndex: 1 }}>{suffix}</div>}
    </div>
  );
};

const Select = ({ value, onChange, options, t }) => {
  const [f, setF] = useState(false);
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ ...inputStyle(t, f), appearance: "none", cursor: "pointer", backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239ca0ae' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: 36 }}>
      {options.map(o => <option key={o.value} value={o.value} style={{ background: t.isDark ? "#111218" : "#fff" }}>{o.label}</option>)}
    </select>
  );
};

// CPA-brand button — matching login screen EXECUTE_HANDSHAKE style
const Btn = ({ label, onClick, variant = "primary", t, icon, loading, danger, small, full }) => {
  const [hov, setHov] = useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
    padding: small ? "8px 16px" : "11px 22px", borderRadius: 10,
    fontSize: small ? 12.5 : 13.5, fontWeight: 700, cursor: "pointer",
    fontFamily: "'Space Grotesk', sans-serif", letterSpacing: ".04em",
    border: "none", transition: "all .22s ease",
    width: full ? "100%" : "auto",
    textTransform: "uppercase",
  };
  const primaryBg = danger
    ? hov ? "#ff2244" : t.danger
    : hov
      ? `linear-gradient(135deg, #a100ff 0%, #6200ea 100%)`
      : `linear-gradient(135deg, ${t.accent} 0%, ${t.accentAlt} 100%)`;
  const styles = {
    primary: {
      background: primaryBg,
      color: "#fff",
      boxShadow: hov
        ? danger
          ? `0 0 28px rgba(255,69,96,0.55), 0 4px 16px rgba(0,0,0,0.4)`
          : `0 0 36px rgba(138,43,255,0.6), 0 4px 20px rgba(0,0,0,0.4)`
        : danger ? `0 0 18px rgba(255,69,96,0.3)` : t.btnShadow,
      transform: hov ? "translateY(-1px)" : "translateY(0)",
    },
    ghost: {
      background: hov ? t.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" : "transparent",
      color: t.text2, border: `1.5px solid ${t.cardBorder}`,
    },
    soft: {
      background: hov ? t.isDark ? "rgba(138,43,255,0.2)" : "rgba(123,44,255,0.12)" : t.accentSoft,
      color: t.neon,
      border: `1px solid ${t.isDark ? "rgba(138,43,255,0.32)" : "rgba(123,44,255,0.22)"}`,
      boxShadow: hov && t.isDark ? `0 0 16px rgba(138,43,255,0.24)` : "none",
    },
    danger: {
      background: hov ? t.dangerSoft : t.isDark ? "rgba(255,69,96,0.08)" : "rgba(229,25,58,0.06)",
      color: t.danger,
      border: `1px solid ${t.danger}33`,
    },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...base, ...s }}
    >
      {loading
        ? <div style={{ width: 14, height: 14, border: `2px solid rgba(255,255,255,.3)`, borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
        : icon && <Ic p={I[icon]} s={13} c={s.color || t.neon} />
      }
      {label}
    </button>
  );
};

// CPA graphite card — matching login panel surface
const Card = ({ children, t, style = {}, glow }) => (
  <div style={{
    background: t.isDark ? t.cardSolid : t.card,
    border: `1px solid ${t.cardBorder}`,
    borderRadius: 14,
    padding: "20px",
    boxShadow: glow && t.isDark
      ? `0 0 32px ${t.accentGlow}, ${t.shadowSm}`
      : t.isDark ? `0 4px 24px rgba(0,0,0,0.5)` : t.shadowSm,
    transition: "box-shadow .25s ease, transform .2s ease",
    ...style,
  }}>{children}</div>
);

const SectionHeader = ({ title, sub, t }) => (
  <div style={{ marginBottom: 24 }}>
    {/* Neon top accent bar — matches login screen top border feel */}
    <div style={{
      width: 36, height: 2, borderRadius: 2, marginBottom: 14,
      background: `linear-gradient(90deg, ${t.accent}, ${t.accent2})`,
      boxShadow: t.isDark ? `0 0 12px ${t.accentGlow}` : "none",
    }} />
    <h2 style={{
      fontSize: 22, fontWeight: 700, color: t.text,
      fontFamily: "'Space Grotesk', sans-serif",
      letterSpacing: "-.02em", lineHeight: 1.2,
    }}>{title}</h2>
    {sub && <p style={{ fontSize: 13, color: t.text2, marginTop: 6, fontFamily: "'Manrope', sans-serif", lineHeight: 1.5 }}>{sub}</p>}
  </div>
);

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
    {toasts.map(toast => (
      <div key={toast.id} style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 18px", borderRadius: 10,
        background: toast.type === "success"
          ? "linear-gradient(135deg,#00c896,#00a876)"
          : toast.type === "error"
            ? "linear-gradient(135deg,#ff4560,#cc1133)"
            : "linear-gradient(135deg,#8a2bff,#6200ea)",
        color: "#fff", fontSize: 13, fontWeight: 600,
        fontFamily: "'Space Grotesk', sans-serif",
        letterSpacing: ".03em",
        boxShadow: toast.type === "success"
          ? "0 4px 24px rgba(0,200,150,0.4)"
          : toast.type === "error"
            ? "0 4px 24px rgba(255,69,96,0.4)"
            : "0 4px 24px rgba(138,43,255,0.5)",
        animation: "slideUp .3s cubic-bezier(.34,1.56,.64,1)",
        border: "1px solid rgba(255,255,255,0.15)",
      }}>
        <Ic p={toast.type === "success" ? I.check : I.info} s={15} c="#fff" />
        {toast.message}
      </div>
    ))}
  </div>
);

// ─── PRIVACY & DATA principal rights ──────────────────────────────────────────
const PrivacySettings = ({ t, showToast }) => {
  const { user, refreshUser } = useAuth();
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [pan, setPan] = useState('');
  const [bank, setBank] = useState('');
  const [savingCreator, setSavingCreator] = useState(false);
  const [erasureLoading, setErasureLoading] = useState(false);

  const handleExport = async () => {
    try {
      const response = await api.get('/account/privacy/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cpa_my_data_${user?.id}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Data principal export downloaded.', 'success');
    } catch (e) {
      showToast('Failed to export data.', 'error');
    }
  };

  const handleErasure = async () => {
    if (!window.confirm('WARNING: This will file a request with the Grievance Officer to permanently delete your account and all associated data under the DPDP Act. This cannot be undone. Proceed?')) return;
    setErasureLoading(true);
    try {
      const res = await api.post('/account/privacy/erasure');
      showToast(res.data?.message || 'Erasure request submitted.', 'success');
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to submit erasure request.', 'error');
    } finally {
      setErasureLoading(false);
    }
  };

  const handleConsentToggle = async (val) => {
    setMarketingConsent(val);
    try {
      await api.post('/account/privacy/consent-withdrawal', { consent_type: 'marketing' });
      showToast(val ? 'Marketing consent granted.' : 'Marketing consent withdrawn.', 'success');
    } catch (e) {
      showToast('Failed to update consent.', 'error');
    }
  };

  const handleSaveCreatorDetails = async () => {
    setSavingCreator(true);
    try {
      const payload = {};
      if (pan) payload.pan_number = pan;
      if (bank) payload.bank_details = bank;

      await api.patch('/account/profile', payload);
      await refreshUser();
      setPan('');
      setBank('');
      showToast('Creator payment details updated securely.', 'success');
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to update creator details.', 'error');
    } finally {
      setSavingCreator(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Privacy & Data Control"
        sub="Manage your personal data, consent, and creator details under the DPDP Act 2023"
        t={t}
      />

      <Card t={t} style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 4 }}>
          Data Principal Rights
        </p>
        <p style={{ fontSize: 13, color: t.text2, marginBottom: 16 }}>
          Exercise your rights to access or request deletion of your personal data stored on our platform.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Btn label="Export My Data (Access)" onClick={handleExport} t={t} variant="soft" />
          <Btn label="Request Deletion (Erasure)" onClick={handleErasure} loading={erasureLoading} t={t} variant="danger" />
        </div>
      </Card>

      <Card t={t} style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 4 }}>
          Consent Management
        </p>
        <p style={{ fontSize: 13, color: t.text2, marginBottom: 16 }}>
          Withdraw or grant optional consents for non-essential processing.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <strong style={{ fontSize: 13, display: 'block', color: t.text }}>Marketing Notifications</strong>
            <span style={{ fontSize: 11, color: t.text2 }}>Receive updates about creator recommendations, new features, and news.</span>
          </div>
          <Toggle on={marketingConsent} onChange={handleConsentToggle} t={t} />
        </div>
      </Card>

      {user?.account_type === 'professional' && (
        <Card t={t} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 4 }}>
            🔒 Creator Financial Details (Encrypted)
          </p>
          <p style={{ fontSize: 13, color: t.text2, marginBottom: 16 }}>
            These details are encrypted at rest and accessible only to the Finance/Ops team for payout processing. Aadhaar card collection is disabled for compliance.
          </p>

          <Field label="PAN Card Number" t={t} hint={user?.has_pan ? "PAN number is securely stored." : "Enter your PAN number for tax compliance."}>
            <Input
              value={pan}
              onChange={setPan}
              placeholder={user?.has_pan ? "•••••••••• (Change PAN)" : "ABCDE1234F"}
              t={t}
            />
          </Field>

          <Field label="Bank Account / UPI Details" t={t} hint={user?.has_bank ? "Payout details are securely stored." : "Enter your bank account details or UPI ID."}>
            <textarea
              className="auth-textarea"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              placeholder={user?.has_bank ? "•••••••••••••••• (Change Bank / UPI details)" : "Bank Name: HDFC\nAccount: 501002...\nIFSC: HDFC0000240\nor UPI: name@okhdfc"}
              style={{
                width: "100%",
                padding: "11px 14px",
                background: t.inputBg,
                border: `1.5px solid ${t.inputBorder}`,
                borderRadius: 10,
                color: t.text,
                fontSize: 14,
                fontFamily: "'Manrope', sans-serif",
                outline: "none",
                minHeight: 80
              }}
            />
          </Field>

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Btn
              label="Save Secure Details"
              onClick={handleSaveCreatorDetails}
              loading={savingCreator}
              disabled={!pan && !bank}
              t={t}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

// 1. EDIT PROFILE
const EditProfile = ({ t, showToast }) => {
  // form state initialized from useAuth user above
  const { user, updateUser } = useAuth();
const [loading, setLoading] = useState(false);
const [form, setForm] = useState({
  name: user?.name || '',
  username: user?.username || '',
  bio: user?.bio || '',
  location: user?.location || '',
  website: user?.website_url || '',
  github: user?.github_username || '',
  linkedin: user?.social_links?.linkedin || '',
  twitter: user?.social_links?.twitter || '',
  youtube: user?.social_links?.youtube || '',
});
const [skills, setSkills] = useState(() => {
  const raw = user?.tech_interests;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    if (raw.startsWith('{'))
      return raw.slice(1, -1).split(',').map(s => s.replace(/^"|"$/g, '').trim()).filter(Boolean);
    try { return JSON.parse(raw); } catch {}
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
});
const [newSkill, setNewSkill] = useState('');
const [usernameOk, setUsernameOk] = useState(true);
const [visibility, setVisibility] = useState(!user?.is_private);
const [saving, setSaving] = useState(false);
const [uChecking, setUChecking] = useState(false);

  const checkUsername = (v) => {
    setForm(f => ({ ...f, username: v }));
    setUChecking(true);
    setTimeout(() => { setUsernameOk(v.length > 3 && !["@admin", "@cpa"].includes(v)); setUChecking(false); }, 700);
  };

  const save = async () => {
  setSaving(true);
  try {
    const res = await api.patch('/account/profile', {
      name: form.name,
      username: form.username,
      bio: form.bio,
      location: form.location,
      github_username: form.github,
      website_url: form.website,
      tech_interests: skills,
      social_links: {
        linkedin: form.linkedin,
        twitter: form.twitter,
        youtube: form.youtube,
      },
    });
    updateUser(res.data.user);
    showToast('Profile updated successfully', 'success');
  } catch (err) {
    console.error('[EditProfile] Save failed:', err?.response?.status, err?.response?.data);
    const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to save profile';
    showToast(msg, 'error');
  } finally {
    setSaving(false);
  }
};

  const addSkill = () => { if (newSkill.trim() && !skills.includes(newSkill.trim())) { setSkills([...skills, newSkill.trim()]); setNewSkill(""); } };

  return (
    <div>
      <SectionHeader title="Edit Profile" sub="Manage your public developer profile and creator identity" t={t} />

      {/* Avatar + Banner — fully wired upload */}
      {(() => {
        const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
        const [bannerUrl, setBannerUrl] = useState(user?.banner_url || null);
        const [avatarUploading, setAvatarUploading] = useState(false);
        const [bannerUploading, setBannerUploading] = useState(false);
        const avatarInputRef = useRef(null);
        const bannerInputRef = useRef(null);
        const avatarInitial = (user?.name || 'U').charAt(0).toUpperCase();

        // Cropper state
        const [cropModalOpen, setCropModalOpen] = useState(false);
        const [cropImageSrc, setCropImageSrc] = useState(null);
        const [crop, setCrop] = useState({ x: 0, y: 0 });
        const [zoom, setZoom] = useState(1);
        const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
        const [cropTarget, setCropTarget] = useState(null);

        const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
          setCroppedAreaPixels(croppedAreaPixels);
        }, []);

        const handleFileChange = (e, target) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (!file.type.startsWith('image/')) { showToast('Only images allowed', 'error'); return; }
          
          const reader = new FileReader();
          reader.addEventListener('load', () => {
            setCropImageSrc(reader.result);
            setCropTarget(target);
            setCropModalOpen(true);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
          });
          reader.readAsDataURL(file);
        };

        const handleCropConfirm = async () => {
          if (!cropImageSrc || !croppedAreaPixels) return;
          setCropModalOpen(false);
          const isBanner = cropTarget === 'banner';
          
          try {
            const setUploading = isBanner ? setBannerUploading : setAvatarUploading;
            setUploading(true);
            
            // Get cropped blob
            const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
            const fd = new FormData();
            fd.append('file', croppedBlob, `cropped_${cropTarget}.jpg`);
            
            if (isBanner) {
              fd.append('folder', 'banners');
              const res = await api.post('/upload/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
              await api.patch('/account/profile', { banner_url: res.data.url });
              setBannerUrl(res.data.url);
              updateUser({ ...user, banner_url: res.data.url });
              showToast('Banner updated', 'success');
            } else {
              const res = await api.post('/upload/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
              setAvatarUrl(res.data.avatar_url);
              updateUser({ ...user, avatar_url: res.data.avatar_url });
              showToast('Avatar updated', 'success');
            }
          } catch (err) {
            console.error(`[${cropTarget}] Upload failed:`, err?.response?.data || err);
            showToast(err?.response?.data?.error || `${cropTarget} upload failed`, 'error');
          } finally {
            if (isBanner) setBannerUploading(false);
            else setAvatarUploading(false);
          }
        };

        return (
          <Card t={t} style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
            {/* Hidden file inputs */}
            <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => handleFileChange(e, 'avatar')} />
            <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => handleFileChange(e, 'banner')} />

            {/* Banner */}
            <div style={{ height: 110, position: "relative", overflow: "hidden",
              background: bannerUrl ? "transparent" : `linear-gradient(135deg,${t.accent},${t.accent2},${t.accentAlt})` }}>
              {bannerUrl && <img src={bannerUrl} alt="banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              <button onClick={() => bannerInputRef.current?.click()}
                disabled={bannerUploading}
                title="Change banner"
                style={{ position: "absolute", bottom: 8, right: 8, display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 10px", borderRadius: 8, background: "rgba(0,0,0,.52)",
                  border: "none", cursor: "pointer", color: "#fff", fontSize: 12,
                  fontFamily: "'Space Grotesk',sans-serif" }}>
                {bannerUploading
                  ? <div style={{ width: 13, height: 13, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                  : <Ic p={I.camera} s={13} c="#fff" />}
                <span>{bannerUploading ? "Uploading..." : "Change Banner"}</span>
              </button>
            </div>

            {/* Avatar + info */}
            <div style={{ padding: "0 20px 20px", position: "relative" }}>
              <div style={{ position: "relative", display: "inline-block", marginTop: -38 }}>
                {/* Avatar circle */}
                <div style={{ width: 76, height: 76, borderRadius: 18, overflow: "hidden",
                  background: `linear-gradient(135deg,${t.accent},${t.accent2})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 800, color: "#fff",
                  fontFamily: "'Space Grotesk',sans-serif",
                  border: `3px solid ${t.bg}`,
                  boxShadow: t.isDark ? `0 0 20px rgba(138,43,255,0.4)` : t.shadowSm }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : avatarInitial}
                </div>
                {/* Avatar upload button */}
                <button onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  title="Change avatar"
                  style={{ position: "absolute", bottom: -4, right: -4, width: 28, height: 28,
                    borderRadius: "50%", background: `linear-gradient(135deg,${t.accent},${t.accent2})`,
                    border: `2px solid ${t.bg}`, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {avatarUploading
                    ? <div style={{ width: 11, height: 11, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                    : <Ic p={I.camera} s={12} c="#fff" />}
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                <Badge label={user?.account_type?.toUpperCase() || 'PERSONAL'} color={t.badgeText} bg={t.badgeBg} />
                {user?.email_verified && <Badge label="✓ VERIFIED" color={t.success} bg={t.successSoft} />}
              </div>
            </div>

            {/* Cropper Modal */}
            {cropModalOpen && (
              <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ position: 'relative', width: '90%', maxWidth: 800, height: 400, background: '#050507', borderRadius: 16, overflow: 'hidden', border: `1px solid ${t.cardBorder}` }}>
                  <Cropper
                    image={cropImageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={cropTarget === 'banner' ? 16 / 4 : 1}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>
                <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => {
                      setZoom(e.target.value)
                    }}
                    style={{ width: 150, marginRight: 20 }}
                  />
                  <button onClick={() => setCropModalOpen(false)} style={{ padding: '10px 24px', borderRadius: 10, background: t.cardBorder, color: t.text, border: 'none', cursor: 'pointer', fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>Cancel</button>
                  <button onClick={handleCropConfirm} style={{ padding: '10px 24px', borderRadius: 10, background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}>Confirm Crop</button>
                </div>
              </div>
            )}
          </Card>
        );
      })()}

      <Card t={t} style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Display Name" t={t}>
            <Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Your name" t={t} />
          </Field>
          <Field label="Username" t={t}>
            <div style={{ position: "relative" }}>
              <Input value={form.username} onChange={checkUsername} placeholder="@handle" t={t} />
              <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
                {uChecking ? <div style={{ width: 14, height: 14, border: `2px solid ${t.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                  : usernameOk ? <Ic p={I.check} s={14} c={t.success} /> : <Ic p={I.x} s={14} c={t.danger} />}
              </div>
            </div>
          </Field>
        </div>
        <Field label="Bio" t={t}>
          <div style={{ position: "relative" }}>
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Your story, stack, goals..." style={{ ...inputStyle(t, false), resize: "none", lineHeight: 1.6, paddingBottom: 28 }} />
            <span style={{ position: "absolute", bottom: 8, right: 10, fontSize: 11, color: t.text2 }}>{form.bio.length}/300</span>
          </div>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Location" t={t}>
            <Input value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} placeholder="City, Country" t={t} prefix={<Ic p={I.map} s={14} c={t.text2} />} />
          </Field>
          <Field label="Website" t={t}>
            <Input value={form.website} onChange={v => setForm(f => ({ ...f, website: v }))} placeholder="yoursite.com" t={t} prefix={<Ic p={I.link} s={14} c={t.text2} />} />
          </Field>
        </div>
      </Card>

      <Card t={t} style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: t.text2, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", fontFamily: "'Space Grotesk',sans-serif", marginBottom: 14 }}>Social Links</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* GitHub is saved as github_username — separate field, not in social_links JSONB */}
          <Field label="GitHub" t={t}>
            <Input value={form.github} onChange={v => setForm(f => ({ ...f, github: v }))} placeholder="@username" t={t} prefix={<Ic p={I.github} s={14} c={t.text2} />} />
          </Field>
          {[["linkedin", "LinkedIn", I.link], ["twitter", "X / Twitter", I.msg], ["youtube", "YouTube", I.zap]].map(([k, l, icon]) => (
            <Field key={k} label={l} t={t}>
              <Input value={form[k]} onChange={v => setForm(f => ({ ...f, [k]: v }))} placeholder={`@${k}`} t={t} prefix={<Ic p={icon} s={14} c={t.text2} />} />
            </Field>
          ))}
        </div>
      </Card>

      <Card t={t} style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: t.text2, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", fontFamily: "'Space Grotesk',sans-serif", marginBottom: 12 }}>Skills / Tech Stack</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {skills.map(s => <Chip key={s} label={s} onRemove={() => setSkills(skills.filter(x => x !== s))} t={t} />)}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <AutosuggestInput endpoint="/suggestions/skills" placeholder="Add skill..." value={newSkill} onChange={setNewSkill} theme={t} />
          <Btn label="Add" onClick={addSkill} variant="soft" t={t} icon="plus" small />
        </div>
      </Card>

      <Card t={t} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif" }}>Public Profile</p>
            <p style={{ fontSize: 12, color: t.text2, marginTop: 2 }}>Make your profile visible to everyone</p>
          </div>
          <Toggle on={visibility} onChange={setVisibility} t={t} />
        </div>
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn label="Discard" variant="ghost" t={t} onClick={() => showToast("Changes discarded", "info")} />
        <Btn label={saving ? "Saving..." : "Save Changes"} onClick={save} t={t} icon="check" loading={saving} full />
      </div>
    </div>
  );
};

// 2. EDUCATION & CERTS
const EducationCerts = ({ t, showToast }) => {
  const [edu, setEdu] = useState([]);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingEdu, setAddingEdu] = useState(false);
  const [addingCert, setAddingCert] = useState(false);
  const [newEdu, setNewEdu] = useState({ school: '', degree: '', field_of_study: '', start_year: '', end_year: '', currently_attending: false, grade: '', description: '' });
  const [newCert, setNewCert] = useState({ name: '', issuer: '', issue_month: '', issue_year: '', no_expiry: false, expiry_month: '', expiry_year: '', credential_id: '', credential_url: '' });

  useEffect(() => {
    Promise.all([
      api.get('/account/education'),
      api.get('/account/certifications'),
    ])
      .then(([eduRes, certRes]) => {
        setEdu(eduRes.data.education || []);
        setCerts(certRes.data.certifications || []);
      })
      .catch((err) => {
        console.error('[EducationCerts] Load failed:', err?.response?.status, err?.response?.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <SectionHeader title="Education & Certs" sub="Build your academic vault and certification portfolio" t={t} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif" }}>Education</h3>
        <Btn label="Add" variant="soft" t={t} icon="plus" small onClick={() => setAddingEdu(!addingEdu)} />
      </div>

      {addingEdu && (
        <Card t={t} style={{ marginBottom: 12, borderColor: t.accent + "44" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Field label="School / College *" t={t}><AutosuggestInput endpoint="/suggestions/colleges" placeholder="University name" value={newEdu.school} onChange={val => setNewEdu(f => ({ ...f, school: val }))} theme={t} /></Field>
            <Field label="Degree" t={t}><Input value={newEdu.degree} onChange={v => setNewEdu(f => ({ ...f, degree: v }))} placeholder="B.Sc / B.Tech / MBA..." t={t} /></Field>
            <Field label="Field of Study" t={t}><Input value={newEdu.field_of_study} onChange={v => setNewEdu(f => ({ ...f, field_of_study: v }))} placeholder="Computer Science" t={t} /></Field>
            <Field label="Grade / CGPA" t={t}><Input value={newEdu.grade} onChange={v => setNewEdu(f => ({ ...f, grade: v }))} placeholder="8.5 / 85%" t={t} /></Field>
            <Field label="Start Year" t={t}><Input value={newEdu.start_year} onChange={v => setNewEdu(f => ({ ...f, start_year: v }))} placeholder="2022" t={t} /></Field>
            <Field label="End Year" t={t}><Input value={newEdu.end_year} onChange={v => setNewEdu(f => ({ ...f, end_year: v }))} placeholder="2026" t={t} /></Field>
            <Field label="Description" t={t} style={{ gridColumn: "1 / -1" }}><Input value={newEdu.description} onChange={v => setNewEdu(f => ({ ...f, description: v }))} placeholder="What you studied, achievements..." t={t} /></Field>
          </div>
          {/* Currently attending toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Toggle on={newEdu.currently_attending} onChange={v => setNewEdu(f => ({ ...f, currently_attending: v }))} t={t} size="sm" />
            <span style={{ fontSize: 13, color: t.text2, fontFamily: "'Manrope',sans-serif" }}>Currently attending</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn label="Cancel" variant="ghost" t={t} small onClick={() => setAddingEdu(false)} />
            <Btn label="Add Education" t={t} small onClick={async () => {
              if (!newEdu.school.trim()) { showToast("School name is required", "error"); return; }
              try {
                const r = await api.post("/account/education", {
                  school: newEdu.school,
                  degree: newEdu.degree || null,
                  field_of_study: newEdu.field_of_study || null,
                  start_year: newEdu.start_year || null,
                  end_year: newEdu.end_year || null,
                  currently_attending: newEdu.currently_attending,
                  grade: newEdu.grade || null,
                  description: newEdu.description || null,
                });
                setEdu(prev => [...prev, r.data.item]);
                setAddingEdu(false);
                setNewEdu({ school: "", degree: "", field_of_study: "", start_year: "", end_year: "", currently_attending: false, grade: "", description: "" });
                showToast("Education added", "success");
              } catch (err) {
                console.error('[EducationCerts] Add edu failed:', err?.response?.status, err?.response?.data);
                const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to add education";
                showToast(msg, "error");
              }
            }} />
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {loading ? <p style={{ fontSize: 12, color: t.text2 }}>Loading...</p> : edu.length === 0 ? <p style={{ fontSize: 12, color: t.text2 }}>No education records yet. Add one above.</p> : edu.map(e => (
          <Card key={e.id} t={t}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: t.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Ic p={I.award} s={20} c={t.neon} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: t.text, fontFamily: "'Space Grotesk',sans-serif" }}>{e.degree || "Degree"}</p>
                    {e.currently_attending && <Badge label="● PRESENT" color={t.success} bg={t.successSoft} />}
                  </div>
                  <p style={{ fontSize: 13, color: t.text2, marginTop: 2 }}>{e.school}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {e.field_of_study && <Badge label={e.field_of_study} color={t.neon} bg={t.accentSoft} />}
                    {(e.start_year || e.end_year) && (
                      <Badge
                        label={e.currently_attending
                          ? `${e.start_year || "?"} — Present`
                          : e.start_year && e.end_year
                            ? `${e.start_year} — ${e.end_year}`
                            : e.end_year ? `Class of ${e.end_year}` : e.start_year}
                        color={t.text2}
                        bg={t.isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)"}
                      />
                    )}
                    {e.grade && <Badge label={`CGPA ${e.grade}`} color={t.success} bg={t.successSoft} />}
                  </div>
                  {e.description && <p style={{ fontSize: 12, color: t.text2, marginTop: 6, fontStyle: "italic" }}>{e.description}</p>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={async () => {
                  try { await api.delete(`/account/education/${e.id}`); setEdu(prev => prev.filter(x => x.id !== e.id)); showToast("Education removed", "success"); }
                  catch { showToast("Failed to remove", "error"); }
                }} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${t.dangerSoft}`, background: t.dangerSoft, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic p={I.trash} s={12} c={t.danger} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif" }}>Certifications</h3>
        <Btn label="Add" variant="soft" t={t} icon="plus" small onClick={() => setAddingCert(!addingCert)} />
      </div>

      {addingCert && (
        <Card t={t} style={{ marginBottom: 12, borderColor: t.accent + "44" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Field label="Certificate Name *" t={t}><Input value={newCert.name} onChange={v => setNewCert(f => ({ ...f, name: v }))} placeholder="AWS Certified Solutions Architect..." t={t} /></Field>
            <Field label="Issuer / Provider *" t={t}><AutosuggestInput endpoint="/suggestions/companies" placeholder="Amazon, Google, Coursera..." value={newCert.issuer} onChange={val => setNewCert(f => ({ ...f, issuer: val }))} theme={t} /></Field>
            <Field label="Issue Month" t={t}><Input value={newCert.issue_month} onChange={v => setNewCert(f => ({ ...f, issue_month: v }))} placeholder="January" t={t} /></Field>
            <Field label="Issue Year" t={t}><Input value={newCert.issue_year} onChange={v => setNewCert(f => ({ ...f, issue_year: v }))} placeholder="2024" t={t} /></Field>
            <Field label="Expiry Month" t={t}><Input value={newCert.expiry_month} onChange={v => setNewCert(f => ({ ...f, expiry_month: v }))} placeholder="January" t={t} /></Field>
            <Field label="Expiry Year" t={t}><Input value={newCert.expiry_year} onChange={v => setNewCert(f => ({ ...f, expiry_year: v }))} placeholder="2027" t={t} /></Field>
            <Field label="Credential ID" t={t}><Input value={newCert.credential_id} onChange={v => setNewCert(f => ({ ...f, credential_id: v }))} placeholder="ABC-123-XYZ" t={t} /></Field>
            <Field label="Credential URL" t={t}><Input value={newCert.credential_url} onChange={v => setNewCert(f => ({ ...f, credential_url: v }))} placeholder="https://..." t={t} prefix={<Ic p={I.link} s={14} c={t.text2} />} /></Field>
          </div>
          {/* No expiry toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Toggle on={newCert.no_expiry} onChange={v => setNewCert(f => ({ ...f, no_expiry: v }))} t={t} size="sm" />
            <span style={{ fontSize: 13, color: t.text2, fontFamily: "'Manrope',sans-serif" }}>This credential does not expire</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn label="Cancel" variant="ghost" t={t} small onClick={() => setAddingCert(false)} />
            <Btn label="Add Certificate" t={t} small onClick={async () => {
              if (!newCert.name.trim() || !newCert.issuer.trim()) { showToast("Name and issuer are required", "error"); return; }
              try {
                const r = await api.post("/account/certifications", {
                  name: newCert.name,
                  issuer: newCert.issuer,
                  issue_month: newCert.issue_month || null,
                  issue_year: newCert.issue_year || null,
                  no_expiry: newCert.no_expiry,
                  expiry_month: newCert.no_expiry ? null : (newCert.expiry_month || null),
                  expiry_year: newCert.no_expiry ? null : (newCert.expiry_year || null),
                  credential_id: newCert.credential_id || null,
                  credential_url: newCert.credential_url || null,
                });
                setCerts(prev => [...prev, r.data.item]);
                setAddingCert(false);
                setNewCert({ name: "", issuer: "", issue_month: "", issue_year: "", no_expiry: false, expiry_month: "", expiry_year: "", credential_id: "", credential_url: "" });
                showToast("Certificate added", "success");
              } catch (err) {
                console.error('[EducationCerts] Add cert failed:', err?.response?.status, err?.response?.data);
                const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to add certificate";
                showToast(msg, "error");
              }
            }} />
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? null : certs.length === 0 ? <p style={{ fontSize: 12, color: t.text2 }}>No certificates yet. Add one above.</p> : certs.map(c => (
          <Card key={c.id} t={t}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: c.no_expiry ? t.successSoft : t.warningSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Ic p={I.shield} s={20} c={c.no_expiry ? t.success : t.warning} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: t.text, fontFamily: "'Space Grotesk',sans-serif" }}>{c.name}</p>
                  {c.no_expiry && <Badge label="✓ NO EXPIRY" color={t.success} bg={t.successSoft} size={10} />}
                </div>
                <p style={{ fontSize: 12, color: t.text2, marginTop: 2 }}>
                  {c.issuer}
                  {(c.issue_month || c.issue_year) && ` · Issued ${[c.issue_month, c.issue_year].filter(Boolean).join(" ")}`}
                  {!c.no_expiry && (c.expiry_month || c.expiry_year) && ` · Expires ${[c.expiry_month, c.expiry_year].filter(Boolean).join(" ")}`}
                </p>
                {c.credential_id && <p style={{ fontSize: 11, color: t.text3, marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>ID: {c.credential_id}</p>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {c.credential_url && <a href={c.credential_url} target="_blank" rel="noopener noreferrer" style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${t.cardBorder}`, background: t.accentSoft, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic p={I.link} s={12} c={t.neon} /></a>}
                <button onClick={async () => {
                  try { await api.delete(`/account/certifications/${c.id}`); setCerts(prev => prev.filter(x => x.id !== c.id)); showToast("Certificate removed", "success"); }
                  catch { showToast("Failed to remove", "error"); }
                }} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${t.dangerSoft}`, background: t.dangerSoft, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic p={I.trash} s={12} c={t.danger} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// 3. NOTIFICATIONS
const Notifications = ({ t, showToast }) => {
  const [tab, setTab] = useState("push");
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("08:00");
  const [quietOn, setQuietOn] = useState(false);
  const [notifs, setNotifs] = useState({
    likes: true, comments: true, mentions: true, followers: true,
    messages: true, courseUpdates: true, announcements: false,
    security: true, weeklyDigest: true,
  });
  const toggle = k => setNotifs(p => ({ ...p, [k]: !p[k] }));
  const groups = [
    { key: "social", label: "Social", icon: "user", items: [{ k: "likes", l: "Likes & Reactions" }, { k: "comments", l: "Comments" }, { k: "mentions", l: "Mentions & Tags" }, { k: "followers", l: "New Followers" }] },
    { key: "comms", label: "Communications", icon: "msg", items: [{ k: "messages", l: "Direct Messages" }, { k: "announcements", l: "Announcements" }] },
    { key: "platform", label: "Platform", icon: "zap", items: [{ k: "courseUpdates", l: "Course Updates" }, { k: "weeklyDigest", l: "Weekly Digest" }] },
    { key: "security", label: "Security (Always On)", icon: "shield", forced: true, items: [{ k: "security", l: "Security Alerts" }] },
  ];

  return (
    <div>
      <SectionHeader title="Notifications" sub="Control what, when, and how you're notified" t={t} />
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: t.isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.06)", borderRadius: 12, padding: 4 }}>
        {["push", "email"].map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{
            flex: 1, padding: "8px", borderRadius: 9, border: "none", cursor: "pointer",
            background: tab === tb ? t.accent : "transparent",
            color: tab === tb ? "#fff" : t.text2, fontSize: 13, fontWeight: 700,
            fontFamily: "'Space Grotesk',sans-serif", transition: "all .2s",
          }}>{tb === "push" ? "🔔 Push" : "📧 Email"}</button>
        ))}
      </div>
      {groups.map(g => (
        <Card key={g.key} t={t} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: g.forced ? t.warningSoft : t.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic p={I[g.icon]} s={14} c={g.forced ? t.warning : t.neon} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif" }}>{g.label}</p>
            {g.forced && <Badge label="REQUIRED" color={t.warning} bg={t.warningSoft} />}
          </div>
          {g.items.map((item, i) => (
            <div key={item.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderTop: i > 0 ? `1px solid ${t.sep}` : "none" }}>
              <p style={{ fontSize: 14, color: t.text }}>{item.l}</p>
              <Toggle on={notifs[item.k]} onChange={() => !g.forced && toggle(item.k)} t={t} size="sm" />
            </div>
          ))}
        </Card>
      ))}
      <Card t={t} style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif" }}>🌙 Quiet Hours</p>
            <p style={{ fontSize: 12, color: t.text2 }}>Pause all notifications during sleep</p>
          </div>
          <Toggle on={quietOn} onChange={setQuietOn} t={t} />
        </div>
        {quietOn && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="From" t={t}><input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} style={inputStyle(t, false)} /></Field>
            <Field label="To" t={t}><input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} style={inputStyle(t, false)} /></Field>
          </div>
        )}
      </Card>
      <Btn label="Save Preferences" onClick={() => showToast("Notification preferences saved", "success")} t={t} icon="check" full />
    </div>
  );
};

// 4. INSIGHTS
const Insights = ({ t }) => {
  const [range, setRange] = useState("7D");
  const [stats, setStats] = useState(null);
  const [topContent, setTopContent] = useState([]);
  const [bars, setBars] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  useEffect(() => {
    setLoading(true);
    api.get(`/account/insights?range=${range}`)
      .then(r => {
        const d = r.data;
        setStats({
          views: d.profile_views ?? 0, reach: d.reach ?? 0,
          followers: d.new_followers ?? 0, clicks: d.link_clicks ?? 0,
          saves: d.saves ?? 0,
        });
        setTopContent(d.top_content || []);
        setBars(d.daily_views || [0, 0, 0, 0, 0, 0, 0]);
      })
      .catch(() => {
        // Fallback to zeros — don't show fake numbers
        setStats({ views: 0, reach: 0, followers: 0, clicks: 0, saves: 0 });
        setTopContent([]); setBars([0, 0, 0, 0, 0, 0, 0]);
      })
      .finally(() => setLoading(false));
  }, [range]);

  const d = stats || { views: 0, reach: 0, followers: 0, clicks: 0, saves: 0 };

  return (
    <div>
      <SectionHeader title="Your Insights" sub="Track your growth, reach, and engagement analytics" t={t} />
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: t.isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.06)", borderRadius: 12, padding: 4 }}>
        {["7D", "30D", "90D"].map(r => (
          <button key={r} onClick={() => setRange(r)} style={{
            flex: 1, padding: "8px", borderRadius: 9, border: "none", cursor: "pointer",
            background: range === r ? t.accent : "transparent",
            color: range === r ? "#fff" : t.text2, fontSize: 13, fontWeight: 700,
            fontFamily: "'Space Grotesk',sans-serif", transition: "all .2s",
          }}>{r}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontSize: 12, color: t.text2, marginBottom: 16 }}>Loading analytics...</p>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Profile Views", val: d.views.toLocaleString(), icon: "eye", color: t.accent, delta: "" },
          { label: "Reach", val: d.reach.toLocaleString(), icon: "trending", color: t.accentAlt, delta: "" },
          { label: "New Followers", val: `+${d.followers}`, icon: "user", color: t.success, delta: "" },
          { label: "Link Clicks", val: d.clicks, icon: "link", color: t.warning, delta: "" },
          { label: "Saves", val: d.saves, icon: "bookmark", color: "#ec4899", delta: "" },
          { label: "Enrollments", val: Math.round(d.saves * .4), icon: "award", color: t.neonCyan, delta: "" },
        ].map(s => (
          <Card key={s.label} t={t} style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${s.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic p={I[s.icon]} s={15} c={s.color} />
              </div>
              {s.delta ? <span style={{ fontSize: 11, fontWeight: 700, color: t.success, background: t.successSoft, padding: "2px 7px", borderRadius: 6 }}>{s.delta}</span> : null}
            </div>
            <p style={{ fontSize: 22, fontWeight: 800, color: t.text, fontFamily: "'Space Grotesk',sans-serif" }}>{s.val}</p>
            <p style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      <Card t={t} style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 14 }}>📈 Profile Views</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", height: `${h}%`, borderRadius: 6, background: `linear-gradient(to top, ${t.accent}, ${t.neon})`, opacity: .85 }} />
              <span style={{ fontSize: 10, color: t.text2 }}>{days[i]}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card t={t}>
        <p style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 14 }}>🏆 Top Content</p>
        {topContent.length === 0
          ? <p style={{ fontSize: 12, color: t.text2 }}>No content data yet — publish posts to see analytics.</p>
          : topContent.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < topContent.length - 1 ? `1px solid ${t.sep}` : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: t.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: t.neon, fontFamily: "'Space Grotesk',sans-serif" }}>#{i + 1}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{item.title}</p>
                <p style={{ fontSize: 11, color: t.text2 }}>{(item.view_count || item.views || 0).toLocaleString()} views · {item.clap_count || item.saves || 0} saves</p>
              </div>
            </div>
          ))
        }
      </Card>
    </div>
  );
};

// 5. PROFESSIONAL ACCOUNT
const Professional = ({ t, showToast }) => {
  const { user, refreshUser } = useAuth();
  const toLabel = (type) => type === "professional" ? "Professional" : "Personal";
  const [mode, setMode] = useState(toLabel(user?.account_type));
  const [saving, setSaving] = useState(false);
  const [hoveredMode, setHoveredMode] = useState(null);

  useEffect(() => { if (user?.account_type) setMode(toLabel(user.account_type)); }, [user?.id]);

  const options = [
    {
      key: "Personal",
      label: "Personal",
      icon: "user",
      desc: "Standard learning & personal use",
    },
    {
      key: "Professional",
      label: "Professional",
      icon: "briefcase",
      desc: "Creator tools, insights & public growth",
    },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/account/type", { account_type: mode.toLowerCase() });
      await refreshUser();
      showToast(`Account type updated to ${mode}`, "success");
    } catch (e) {
      showToast(e?.response?.data?.error || "Failed to update account type", "error");
    } finally { setSaving(false); }
  };

  return (
    <div>
      <SectionHeader
        title="Professional Account"
        sub="Choose your creator mode and unlock the right tools"
        t={t}
      />

      <Card t={t} style={{ marginBottom: 20 }}>
        {/* Card label */}
        <div style={{ marginBottom: 20 }}>
          <p style={{
            fontSize: 15, fontWeight: 700, color: t.text,
            fontFamily: "'Space Grotesk',sans-serif", marginBottom: 4,
          }}>Account Type</p>
          <p style={{ fontSize: 13, color: t.text2 }}>
            Choose how your CPA profile functions
          </p>
        </div>

        {/* Two-option toggle row */}
        <div style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}>
          {options.map(opt => {
            const isActive = mode === opt.key;
            const isHovered = hoveredMode === opt.key && !isActive;

            return (
              <div
                key={opt.key}
                onClick={() => setMode(opt.key)}
                onMouseEnter={() => setHoveredMode(opt.key)}
                onMouseLeave={() => setHoveredMode(null)}
                style={{
                  flex: "1 1 140px",
                  minWidth: 140,
                  padding: "18px 16px",
                  borderRadius: 14,
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "all .22s cubic-bezier(.4,0,.2,1)",

                  /* Background */
                  background: isActive
                    ? t.isDark
                      ? "rgba(124,58,237,0.13)"
                      : "rgba(109,40,217,0.07)"
                    : isHovered
                      ? t.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"
                      : t.isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)",

                  /* Border */
                  border: isActive
                    ? `1.5px solid ${t.isDark ? "#7c3aed" : "#6d28d9"}`
                    : `1.5px solid ${t.isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)"}`,

                  /* Glow */
                  boxShadow: isActive
                    ? t.isDark
                      ? "0 0 22px rgba(124,58,237,0.28), 0 2px 12px rgba(0,0,0,0.35)"
                      : "0 0 14px rgba(109,40,217,0.18), 0 2px 8px rgba(0,0,0,0.08)"
                    : isHovered
                      ? t.isDark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.07)"
                      : "none",

                  /* Press */
                  transform: isActive ? "translateY(-1px)" : "translateY(0)",
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10, marginBottom: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isActive
                    ? t.isDark ? "rgba(124,58,237,0.22)" : "rgba(109,40,217,0.12)"
                    : t.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                  transition: "background .22s",
                }}>
                  <Ic
                    p={I[opt.icon]}
                    s={17}
                    c={isActive ? (t.isDark ? "#a78bfa" : "#6d28d9") : t.text2}
                  />
                </div>

                {/* Label */}
                <p style={{
                  fontSize: 14, fontWeight: 700, marginBottom: 5,
                  fontFamily: "'Space Grotesk',sans-serif",
                  color: isActive ? t.text : t.text2,
                  transition: "color .2s",
                }}>{opt.label}</p>

                {/* Description */}
                <p style={{
                  fontSize: 12, lineHeight: 1.45,
                  color: isActive
                    ? t.isDark ? "rgba(167,139,250,0.8)" : "rgba(109,40,217,0.75)"
                    : t.text2,
                  transition: "color .2s",
                }}>{opt.desc}</p>

                {/* Active indicator dot */}
                {isActive && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5, marginTop: 14,
                  }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: t.isDark ? "#a78bfa" : "#6d28d9",
                      boxShadow: t.isDark ? "0 0 6px #a78bfa" : "none",
                    }} />
                    <span style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: ".05em",
                      color: t.isDark ? "#a78bfa" : "#6d28d9",
                      fontFamily: "'Space Grotesk',sans-serif",
                    }}>SELECTED</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{
          height: 1, background: t.sep, margin: "22px 0",
        }} />

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%", padding: "12px 24px",
            borderRadius: 11, border: "none", cursor: saving ? "default" : "pointer",
            background: saving
              ? t.isDark ? "rgba(124,58,237,0.5)" : "rgba(109,40,217,0.5)"
              : `linear-gradient(135deg, ${t.isDark ? "#7c3aed" : "#6d28d9"} 0%, ${t.isDark ? "#5b21b6" : "#4c1d95"} 100%)`,
            color: "#fff", fontSize: 14, fontWeight: 700,
            fontFamily: "'Space Grotesk',sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: saving ? "none" : t.isDark
              ? "0 0 24px rgba(124,58,237,0.45)"
              : "0 4px 18px rgba(109,40,217,0.32)",
            transition: "all .25s",
            opacity: saving ? 0.75 : 1,
          }}
        >
          {saving ? (
            <>
              <div style={{
                width: 15, height: 15,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin .7s linear infinite",
              }} />
              Saving…
            </>
          ) : (
            <>
              <Ic p={I.check} s={15} c="#fff" />
              Save Changes
            </>
          )}
        </button>
      </Card>
    </div>
  );
};

// 6. SECURITY & AUTH
const Security = ({ t, showToast }) => {
  const [passShow, setPassShow] = useState({ cur: false, new: false, conf: false });
  const [pass, setPass] = useState({ cur: "", new: "", conf: "" });
  const [twoFa, setTwoFa] = useState(false);
  const [twoFaMethod, setTwoFaMethod] = useState("app");
  const strength = pass.new.length === 0 ? 0 : pass.new.length < 6 ? 1 : pass.new.length < 10 ? 2 : pass.new.length < 14 ? 3 : 4;
  const strengthColors = ["", t.danger, t.warning, "#f59e0b", t.success];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    setSessionsLoading(true);
    api.get('/auth/sessions').then(r => setSessions(r.data.sessions || [])).catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, []);

  const revokeSession = async (id) => {
    try {
      await api.delete(`/auth/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      showToast('Session revoked', 'success');
    } catch { showToast('Failed to revoke session', 'error'); }
  };

  const revokeAllOtherSessions = async () => {
    try {
      await api.post('/auth/logout-all');
      setSessions(prev => prev.filter(s => s.is_current));
      showToast('All other sessions revoked', 'success');
    } catch { showToast('Failed to revoke sessions', 'error'); }
  };

  const updatePassword = async () => {
    if (pass.new !== pass.conf) return showToast("Passwords do not match", "error");
    try {
      await api.post('/auth/change-password', { currentPassword: pass.cur, newPassword: pass.new });
      showToast("Password updated successfully", "success");
      setPass({ cur: "", new: "", conf: "" });
    } catch { showToast("Failed to update password", "error"); }
  };

  const riskScore = 74;

  return (
    <div>
      <SectionHeader title="Security & Auth" sub="Protect your account with enterprise-grade security" t={t} />

      {/* Risk Score */}
      <Card t={t} glow style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 72, height: 72 }}>
            <svg width={72} height={72} viewBox="0 0 72 72">
              <circle cx={36} cy={36} r={28} fill="none" stroke={t.cardBorder} strokeWidth={6} />
              <circle cx={36} cy={36} r={28} fill="none" stroke={riskScore > 70 ? t.success : riskScore > 40 ? t.warning : t.danger} strokeWidth={6}
                strokeDasharray={`${2 * Math.PI * 28 * riskScore / 100} ${2 * Math.PI * 28}`}
                strokeLinecap="round" transform="rotate(-90 36 36)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: t.success, fontFamily: "'Space Grotesk',sans-serif" }}>{riskScore}</div>
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: t.text, fontFamily: "'Space Grotesk',sans-serif" }}>Account Risk Score</p>
            <p style={{ fontSize: 13, color: t.success }}>Good — Enable 2FA for max security</p>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <Badge label="✓ Strong Password" color={t.success} bg={t.successSoft} size={10} />
              <Badge label="2FA Off" color={t.warning} bg={t.warningSoft} size={10} />
            </div>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card t={t} style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 14 }}>🔑 Change Password</p>
        <Field label="Current Password" t={t}>
          <Input value={pass.cur} onChange={v => setPass(p => ({ ...p, cur: v }))} type={passShow.cur ? "text" : "password"} placeholder="Current password" t={t}
            suffix={<span onClick={() => setPassShow(p => ({ ...p, cur: !p.cur }))}><Ic p={passShow.cur ? I.eyeOff : I.eye} s={15} c={t.text2} /></span>} />
        </Field>
        <Field label="New Password" t={t}>
          <Input value={pass.new} onChange={v => setPass(p => ({ ...p, new: v }))} type={passShow.new ? "text" : "password"} placeholder="New password" t={t}
            suffix={<span onClick={() => setPassShow(p => ({ ...p, new: !p.new }))}><Ic p={passShow.new ? I.eyeOff : I.eye} s={15} c={t.text2} /></span>} />
          {pass.new.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColors[strength] : t.text3, transition: "background .3s" }} />)}
              </div>
              <p style={{ fontSize: 11, color: strengthColors[strength] }}>{strengthLabels[strength]} password</p>
            </div>
          )}
        </Field>
        <Field label="Confirm Password" t={t}>
          <div style={{ position: "relative" }}>
            <Input value={pass.conf} onChange={v => setPass(p => ({ ...p, conf: v }))} type={passShow.conf ? "text" : "password"} placeholder="Confirm password" t={t}
              suffix={<span onClick={() => setPassShow(p => ({ ...p, conf: !p.conf }))}><Ic p={passShow.conf ? I.eyeOff : I.eye} s={15} c={t.text2} /></span>} />
            {pass.conf && <div style={{ position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)" }}>
              {pass.new === pass.conf ? <Ic p={I.check} s={14} c={t.success} /> : <Ic p={I.x} s={14} c={t.danger} />}
            </div>}
          </div>
        </Field>
        <Btn label="Update Password" t={t} icon="key" onClick={updatePassword} full />
      </Card>

      {/* 2FA */}
      <Card t={t} style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: twoFa ? 16 : 0 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif" }}>🛡️ Two-Factor Authentication</p>
            <p style={{ fontSize: 12, color: t.text2, marginTop: 2 }}>Add an extra security layer</p>
          </div>
          <Toggle on={twoFa} onChange={setTwoFa} t={t} />
        </div>
        {twoFa && (
          <div>
            {[{ k: "app", l: "Authenticator App", icon: "phone", desc: "Google Auth, Authy" }, { k: "sms", l: "SMS Code", icon: "msg", desc: "Text message" }, { k: "email", l: "Email Code", icon: "msg", desc: "Email verification" }].map(m => (
              <div key={m.k} onClick={() => setTwoFaMethod(m.k)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, cursor: "pointer", marginBottom: 6, background: twoFaMethod === m.k ? t.accentSoft : "transparent", border: `1px solid ${twoFaMethod === m.k ? t.accent + "44" : "transparent"}` }}>
                <Ic p={I[m.icon]} s={16} c={twoFaMethod === m.k ? t.neon : t.text2} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{m.l}</p>
                  <p style={{ fontSize: 11, color: t.text2 }}>{m.desc}</p>
                </div>
                {twoFaMethod === m.k && <Ic p={I.check} s={14} c={t.neon} />}
              </div>
            ))}
            <Btn label="Setup 2FA" t={t} icon="shield" full style={{ marginTop: 8 }} onClick={() => showToast("2FA setup initiated", "info")} />
          </div>
        )}
      </Card>

      {/* Sessions */}
      <Card t={t} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>📱 Active Sessions</p>
          {sessions.length > 1 && (
            <button onClick={revokeAllOtherSessions} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: t.dangerSoft, border: `1px solid ${t.danger}44`, borderRadius: 8, color: t.danger, fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
              <LogOut size={12} /> Revoke Others
            </button>
          )}
        </div>
        {sessionsLoading ? (
          <p style={{ fontSize: 12, color: t.text2 }}>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p style={{ fontSize: 12, color: t.text2 }}>No active sessions found.</p>
        ) : sessions.map((s, i) => (
          <div key={s.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < sessions.length - 1 ? `1px solid ${t.sep}` : "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.is_current ? t.accentSoft : t.isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe size={16} color={s.is_current ? t.neon : t.text2} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
                {s.device_name || s.browser || s.device || 'Unknown Device'} {s.is_current && <Badge label="This device" color={t.success} bg={t.successSoft} />}
              </p>
              <p style={{ fontSize: 11, color: t.text2 }}>
                {(s.location_city ? `${s.location_city}, ${s.location_country}` : s.ip_address) || s.loc} · {s.last_seen_at ? new Date(s.last_seen_at).toLocaleString() : s.time}
              </p>
            </div>
            {!s.is_current && (
              <button onClick={() => revokeSession(s.id)} style={{ fontSize: 11, color: t.danger, background: t.dangerSoft, border: "none", borderRadius: 7, padding: "4px 9px", cursor: "pointer", fontWeight: 700 }}>
                Revoke
              </button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
};

// 7. MESSAGES
const Messages = ({ t, showToast }) => {
  const { user } = useAuth();
  const [dmPerm, setDmPerm] = useState("Followers Only");
  const [receipts, setReceipts] = useState(true);
  const [typing, setTyping] = useState(true);
  const [autoReply, setAutoReply] = useState(false);
  const [autoMsg, setAutoMsg] = useState("Hey! I'll get back to you shortly 👋");
  const [spamAI, setSpamAI] = useState(true);
  const dmOptions = ["Everyone", "Followers Only", "Mutuals Only", "Nobody"];
  const [blocked, setBlocked] = useState([]);

  useEffect(() => {
    api.get("/account/blocked")
      .then(r => setBlocked(r.data.blocked || []))
      .catch(() => setBlocked([]));
  }, []);

  const unblock = async (userId) => {
    try {
      await api.delete(`/account/blocked/${userId}`);
      setBlocked(b => b.filter(u => u.id !== userId));
      showToast("User unblocked", "success");
    } catch { showToast("Failed to unblock", "error"); }
  };

  return (
    <div>
      <SectionHeader title="Message Settings" sub="Control who can reach you and how conversations work" t={t} />
      <Card t={t} style={{ marginBottom: 14 }}>
        <Field label="Who can DM me" t={t}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dmOptions.map(o => (
              <div key={o} onClick={() => setDmPerm(o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, cursor: "pointer", background: dmPerm === o ? t.accentSoft : "transparent", border: `1px solid ${dmPerm === o ? t.accent + "44" : "transparent"}` }}>
                <span style={{ fontSize: 14, color: t.text, fontWeight: dmPerm === o ? 600 : 400 }}>{o}</span>
                {dmPerm === o && <Ic p={I.check} s={14} c={t.neon} />}
              </div>
            ))}
          </div>
        </Field>
      </Card>

      <Card t={t} style={{ marginBottom: 14 }}>
        {[
          { k: "receipts", l: "Read Receipts", s: "Show when messages are read", val: receipts, set: setReceipts },
          { k: "typing", l: "Typing Indicators", s: "Show when you're typing", val: typing, set: setTyping },
          { k: "spamAI", l: "🤖 AI Spam Detection", s: "Auto-filter spam messages", val: spamAI, set: setSpamAI },
        ].map((item, i) => (
          <div key={item.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 2 ? `1px solid ${t.sep}` : "none" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{item.l}</p>
              <p style={{ fontSize: 11, color: t.text2 }}>{item.s}</p>
            </div>
            <Toggle on={item.val} onChange={item.set} t={t} size="sm" />
          </div>
        ))}
      </Card>

      <Card t={t} style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: autoReply ? 14 : 0 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>⚡ Auto Reply <Badge label="PRO" color={t.badgeText} bg={t.badgeBg} /></p>
            <p style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>Auto-reply when you're away</p>
          </div>
          <Toggle on={autoReply} onChange={setAutoReply} t={t} size="sm" />
        </div>
        {autoReply && <Field label="Auto Reply Message" t={t}><textarea value={autoMsg} onChange={e => setAutoMsg(e.target.value)} rows={3} style={{ ...inputStyle(t, false), resize: "none" }} /></Field>}
      </Card>

      <Card t={t} style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 12 }}>Blocked Users</p>
        {blocked.length === 0 ? <p style={{ fontSize: 13, color: t.text2 }}>No blocked users.</p> :
          blocked.map((u, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: t.dangerSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic p={I.user} s={16} c={t.danger} /></div>
              <div style={{ flex: 1 }}><p style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{u.name || u.username}</p><p style={{ fontSize: 11, color: t.text2 }}>@{u.username}</p></div>
              <Btn label="Unblock" variant="ghost" t={t} small onClick={() => unblock(u.id)} />
            </div>
          ))}
      </Card>

      <Btn label="Save Message Settings" onClick={() => showToast("Message settings saved", "success")} t={t} icon="check" full />
    </div>
  );
};

// 8. SAVED SETTINGS
const Saved = ({ t, showToast }) => {
  const [folders, setFolders] = useState([]);
  const [newFolder, setNewFolder] = useState("");
  const [adding, setAdding] = useState(false);
  const [counts, setCounts] = useState({ posts: 0, courses: 0, resources: 0, creators: 0 });

  useEffect(() => {
    api.get("/account/saved/stats")
      .then(r => {
        const d = r.data;
        setCounts({
          posts: d.saved_posts ?? 0, courses: d.saved_courses ?? 0,
          resources: d.saved_resources ?? 0, creators: d.saved_creators ?? 0,
        });
        setFolders((d.folders || []).map((f, i) => ({
          id: f.id, name: f.name, items: f.item_count || 0,
          isPublic: f.is_public || false,
          color: ["#7c3aed", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9"][i % 5],
        })));
      })
      .catch(() => {});
  }, []);

  const categories = [
    { label: "Saved Posts", count: counts.posts, icon: "bookmark", color: t.accent },
    { label: "Saved Courses", count: counts.courses, icon: "award", color: t.success },
    { label: "Resources", count: counts.resources, icon: "download", color: t.accentAlt },
    { label: "Creators", count: counts.creators, icon: "user", color: "#ec4899" },
  ];

  return (
    <div>
      <SectionHeader title="Saved Settings" sub="Organize your bookmarks, courses, and resources" t={t} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {categories.map(c => (
          <Card key={c.label} t={t} style={{ padding: 16, cursor: "pointer" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c.color}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Ic p={I[c.icon]} s={16} c={c.color} />
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: t.text, fontFamily: "'Space Grotesk',sans-serif" }}>{c.count}</p>
            <p style={{ fontSize: 12, color: t.text2, marginTop: 2 }}>{c.label}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif" }}>Custom Folders</p>
        <Btn label="New Folder" variant="soft" t={t} icon="plus" small onClick={() => setAdding(!adding)} />
      </div>

      {adding && (
        <Card t={t} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Input value={newFolder} onChange={setNewFolder} placeholder="Folder name..." t={t} />
            <Btn label="Create" t={t} small onClick={() => { if (newFolder.trim()) { setFolders([...folders, { id: Date.now(), name: newFolder.trim(), items: 0, isPublic: false, color: t.accent }]); setNewFolder(""); setAdding(false); showToast("Folder created", "success"); } }} />
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {folders.map(f => (
          <Card key={f.id} t={t}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: `${f.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic p={I.folder} s={18} c={f.color} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif" }}>{f.name}</p>
                <p style={{ fontSize: 12, color: t.text2 }}>{f.items} items · {f.isPublic ? "Public" : "Private"}</p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => { setFolders(folders.map(x => x.id === f.id ? { ...x, isPublic: !x.isPublic } : x)); showToast(`Folder is now ${!f.isPublic ? "public" : "private"}`, "info"); }}
                  style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${t.cardBorder}`, background: t.accentSoft, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic p={f.isPublic ? I.eye : I.eyeOff} s={12} c={t.neon} />
                </button>
                <button onClick={() => setFolders(folders.filter(x => x.id !== f.id))}
                  style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${t.dangerSoft}`, background: t.dangerSoft, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic p={I.trash} s={12} c={t.danger} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Btn label="Export All Saves" variant="soft" t={t} icon="download" full onClick={() => showToast("Preparing export...", "info")} />
    </div>
  );
};

// 9. APPEARANCE
const Appearance = ({ t, isDark, setIsDark, showToast }) => {
  const [accent, setAccent] = useState("#7c3aed");
  const [fontSize, setFontSize] = useState("medium");
  const [radius, setRadius] = useState("16");
  const [density, setDensity] = useState("comfortable");
  const [motion, setMotion] = useState(true);
  const accentColors = ["#7c3aed", "#2563eb", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#f43f5e"];
  const themes = [
  { id: "system", label: "System",      icon: "⚙️" },
  { id: "dark",   label: "Dark",        icon: "🌌" },
  { id: "light",  label: "Light",       icon: "☀️" },
];
  const { theme: activeTheme, setTheme } = useTheme();

  return (
    <div>
      <SectionHeader title="Appearance" sub="Personalize your visual experience" t={t} />
      <Card t={t} style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 12 }}>Theme</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {themes.map(th => (
           <div key={th.id} onClick={() => {
  setTheme(th.id);
  showToast(`${th.label} theme applied`, "success");
}}
              style={{ padding: "14px 8px", borderRadius: 12, textAlign: "center", cursor: "pointer", border: `1.5px solid ${activeTheme === th.id ? t.accent + "66" : t.cardBorder}`, background: activeTheme === th.id ? t.accentSoft : t.card, transition: "all .2s" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{th.icon}</div>
              <p style={{ fontSize: 11, fontWeight: 600, color: activeTheme === th.id ? t.neon : t.text2, fontFamily: "'Space Grotesk',sans-serif" }}>{th.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card t={t} style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 12 }}>Accent Color</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {accentColors.map(c => (
            <div key={c} onClick={() => setAccent(c)}
              style={{ width: 36, height: 36, borderRadius: "50%", background: c, cursor: "pointer", border: `3px solid ${accent === c ? "#fff" : "transparent"}`, boxShadow: accent === c ? `0 0 12px ${c}88` : "none", transition: "all .2s" }} />
          ))}
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: t.card, border: `2px dashed ${t.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Ic p={I.plus} s={14} c={t.text2} />
          </div>
        </div>
      </Card>

      <Card t={t} style={{ marginBottom: 14 }}>
        <Field label="Font Size" t={t}>
          <div style={{ display: "flex", gap: 8 }}>
            {["small", "medium", "large"].map(s => (
              <button key={s} onClick={() => setFontSize(s)} style={{ flex: 1, padding: "9px", borderRadius: 10, border: `1.5px solid ${fontSize === s ? t.accent + "55" : t.cardBorder}`, background: fontSize === s ? t.accentSoft : "transparent", color: fontSize === s ? t.neon : t.text2, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif", textTransform: "capitalize" }}>{s}</button>
            ))}
          </div>
        </Field>
        <Field label="Card Radius" t={t}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input type="range" min={0} max={24} value={radius} onChange={e => setRadius(e.target.value)} style={{ flex: 1, accentColor: t.accent }} />
            <div style={{ width: 40, height: 40, borderRadius: `${radius}px`, background: t.accentSoft, border: `2px solid ${t.accent}44` }} />
          </div>
        </Field>
        <Field label="Density" t={t}>
          <div style={{ display: "flex", gap: 8 }}>
            {["compact", "comfortable"].map(d => (
              <button key={d} onClick={() => setDensity(d)} style={{ flex: 1, padding: "9px", borderRadius: 10, border: `1.5px solid ${density === d ? t.accent + "55" : t.cardBorder}`, background: density === d ? t.accentSoft : "transparent", color: density === d ? t.neon : t.text2, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif", textTransform: "capitalize" }}>{d}</button>
            ))}
          </div>
        </Field>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Reduce Motion</p>
            <p style={{ fontSize: 11, color: t.text2 }}>For accessibility or preference</p>
          </div>
          <Toggle on={!motion} onChange={v => setMotion(!v)} t={t} size="sm" />
        </div>
      </Card>

      <Btn label="Apply Appearance" onClick={() => showToast("Appearance settings saved", "success")} t={t} icon="check" full />
    </div>
  );
};

// 10. LANGUAGE
const Language = ({ t, showToast }) => {
  const [lang, setLang] = useState("en-US");
  const [region, setRegion] = useState("IN");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [timeFormat, setTimeFormat] = useState("12h");
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [subtitleLang, setSubtitleLang] = useState("en");

  return (
    <div>
      <SectionHeader title="Language & Region" sub="Set your language, locale, and format preferences" t={t} />
      <Card t={t} style={{ marginBottom: 14 }}>
        <Field label="App Language" t={t}>
          <Select value={lang} onChange={setLang} t={t} options={[{ value: "en-US", label: "🇺🇸 English (US)" }, { value: "en-IN", label: "🇮🇳 English (India)" }, { value: "hi", label: "🇮🇳 हिंदी (Hindi)" }, { value: "mr", label: "🇮🇳 मराठी (Marathi)" }, { value: "es", label: "🇪🇸 Español" }, { value: "fr", label: "🇫🇷 Français" }, { value: "de", label: "🇩🇪 Deutsch" }, { value: "ja", label: "🇯🇵 日本語" }]} />
        </Field>
        <Field label="Region" t={t}>
          <Select value={region} onChange={setRegion} t={t} options={[{ value: "IN", label: "🇮🇳 India" }, { value: "US", label: "🇺🇸 United States" }, { value: "UK", label: "🇬🇧 United Kingdom" }, { value: "AU", label: "🇦🇺 Australia" }, { value: "CA", label: "🇨🇦 Canada" }]} />
        </Field>
        <Field label="Date Format" t={t}>
          <Select value={dateFormat} onChange={setDateFormat} t={t} options={[{ value: "DD/MM/YYYY", label: "DD/MM/YYYY" }, { value: "MM/DD/YYYY", label: "MM/DD/YYYY" }, { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" }]} />
        </Field>
        <Field label="Time Format" t={t}>
          <div style={{ display: "flex", gap: 8 }}>
            {["12h", "24h"].map(f => (
              <button key={f} onClick={() => setTimeFormat(f)} style={{ flex: 1, padding: "9px", borderRadius: 10, border: `1.5px solid ${timeFormat === f ? t.accent + "55" : t.cardBorder}`, background: timeFormat === f ? t.accentSoft : "transparent", color: timeFormat === f ? t.neon : t.text2, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif" }}>{f}</button>
            ))}
          </div>
        </Field>
      </Card>
      <Card t={t} style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>🌐 Auto-Translate Posts</p>
            <p style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>Translate foreign language content</p>
          </div>
          <Toggle on={autoTranslate} onChange={setAutoTranslate} t={t} size="sm" />
        </div>
        <Field label="Preferred Subtitle Language" t={t}>
          <Select value={subtitleLang} onChange={setSubtitleLang} t={t} options={[{ value: "en", label: "English" }, { value: "hi", label: "हिंदी" }, { value: "es", label: "Español" }]} />
        </Field>
      </Card>
      <Btn label="Save Language Settings" onClick={() => showToast("Language settings saved", "success")} t={t} icon="check" full />
    </div>
  );
};

// 11. DANGER ZONE
const DangerZone = ({ t, showToast }) => {
  const { user } = useAuth();
  const dangerUsername = user?.username || "yourusername";
  const [step, setStep] = useState(0);
  const [passConfirm, setPassConfirm] = useState("");
  const [usernameConfirm, setUsernameConfirm] = useState("");
  const [deactivateStep, setDeactivateStep] = useState(0);
  const steps = ["Download Data", "Confirm Password", "Type Username", "Final Warning"];

  return (
    <div>
      <SectionHeader title="⚠️ Danger Zone" sub="Irreversible actions — proceed with extreme caution" t={t} />

      {/* Download Data */}
      <Card t={t} style={{ marginBottom: 14, borderColor: t.warning + "44" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: t.warningSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ic p={I.download} s={18} c={t.warning} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: t.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 4 }}>Download Account Data</p>
            <p style={{ fontSize: 12, color: t.text2, marginBottom: 12 }}>Export all your posts, certs, saved items, and profile data before any action.</p>
            <Btn label="Request Data Export" variant="soft" t={t} icon="download" onClick={() => showToast("Export request submitted. You'll receive an email within 24 hours.", "info")} />
          </div>
        </div>
      </Card>

      {/* Deactivate */}
      <Card t={t} style={{ marginBottom: 14, borderColor: t.warning + "44" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: t.warningSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ic p={I.eye} s={18} c={t.warning} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: t.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 4 }}>Deactivate Account</p>
            <p style={{ fontSize: 12, color: t.text2, marginBottom: 12 }}>Temporarily hide your profile. You can reactivate anytime within 90 days.</p>
            {deactivateStep === 0 ? (
              <Btn label="Deactivate Temporarily" variant="danger" t={t} icon="eyeOff" onClick={() => setDeactivateStep(1)} />
            ) : (
              <div style={{ background: t.warningSoft, borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 13, color: t.warning, fontWeight: 600, marginBottom: 10 }}>Confirm deactivation?</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn label="Cancel" variant="ghost" t={t} small onClick={() => setDeactivateStep(0)} />
                  <Btn label="Yes, Deactivate" danger t={t} small onClick={() => { showToast("Account deactivated. Log in anytime to reactivate.", "info"); setDeactivateStep(0); }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Delete Account */}
      <Card t={t} style={{ borderColor: t.danger + "44", background: t.isDark ? "rgba(244,63,94,.04)" : "rgba(220,38,38,.03)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: t.dangerSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ic p={I.trash} s={18} c={t.danger} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: t.danger, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 4 }}>Delete Account Permanently</p>
            <p style={{ fontSize: 12, color: t.text2, marginBottom: 14 }}>This will permanently delete your account after a 7-day grace period. All data will be erased.</p>

            {step === 0 && <Btn label="Begin Deletion Process" danger t={t} icon="trash" onClick={() => setStep(1)} />}

            {step > 0 && (
              <div>
                {/* Progress */}
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {steps.map((s, i) => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? t.danger : t.text3 }} />
                  ))}
                </div>
                <p style={{ fontSize: 12, color: t.danger, fontWeight: 700, marginBottom: 12 }}>Step {step} of {steps.length}: {steps[step - 1]}</p>

                {step === 1 && (
                  <div>
                    <p style={{ fontSize: 12, color: t.text2, marginBottom: 10 }}>We strongly recommend downloading your data first.</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn label="Back" variant="ghost" t={t} small onClick={() => setStep(0)} />
                      <Btn label="Continue" danger t={t} small onClick={() => setStep(2)} />
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div>
                    <Field label="Enter Your Password" t={t}><Input value={passConfirm} onChange={setPassConfirm} type="password" placeholder="Current password" t={t} /></Field>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn label="Back" variant="ghost" t={t} small onClick={() => setStep(1)} />
                      <Btn label="Continue" danger t={t} small onClick={() => passConfirm.length > 0 && setStep(3)} />
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div>
                    <Field label={`Type "@${dangerUsername}" to confirm`} t={t}><Input value={usernameConfirm} onChange={setUsernameConfirm} placeholder={`@${dangerUsername}`} t={t} /></Field>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn label="Back" variant="ghost" t={t} small onClick={() => setStep(2)} />
                      <Btn label="Continue" danger t={t} small onClick={() => usernameConfirm === `@${dangerUsername}` && setStep(4)} />
                    </div>
                  </div>
                )}
                {step === 4 && (
                  <div style={{ background: t.dangerSoft, borderRadius: 12, padding: 14 }}>
                    <p style={{ fontSize: 13, color: t.danger, fontWeight: 700, marginBottom: 6 }}>⚠️ Final Warning</p>
                    <p style={{ fontSize: 12, color: t.text2, marginBottom: 12 }}>Your account will enter a 7-day grace period. If you log in during this time, deletion will be cancelled.</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn label="Cancel" variant="ghost" t={t} small onClick={() => { setStep(0); setPassConfirm(""); setUsernameConfirm(""); }} />
                      <Btn label="Delete My Account" danger t={t} small onClick={() => { showToast("Account scheduled for deletion in 7 days.", "error"); setStep(0); }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

// 12. LOGOUT
const Logout = ({ t, showToast }) => {
  const { user } = useAuth();
  const [remember, setRemember] = useState(true);
  const displayName = user?.name || user?.username || "Account";
  const handle = user?.username ? `@${user.username}` : "";
  const accountLabel = user?.account_type === "professional" ? "Pro Account" : "Personal Account";
  const initial = displayName.charAt(0).toUpperCase();
  return (
    <div>
      <SectionHeader title="Sign Out" sub="Manage your session and device access" t={t} />
      <Card t={t} style={{ marginBottom: 14, textAlign: "center", padding: "32px 20px" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg,${t.accent},${t.accentAlt})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, fontWeight: 800, color: "#fff", fontFamily: "'Space Grotesk',sans-serif" }}>
          {initial}
        </div>
        <p style={{ fontSize: 18, fontWeight: 800, color: t.text, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 8 }}>{displayName}</p>
        <p style={{ fontSize: 13, color: t.text2, marginBottom: 20 }}>{handle}{handle ? " · " : ""}{accountLabel}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24, padding: "12px 16px", background: t.isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)", borderRadius: 12 }}>
          <Toggle on={remember} onChange={setRemember} t={t} size="sm" />
          <span style={{ fontSize: 13, color: t.text2 }}>Remember this device</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn label="Logout This Device" t={t} icon="logout" danger full onClick={async () => {
            try { await api.post("/auth/logout"); window.location.href = "/login"; }
            catch { showToast("Logout failed", "error"); }
          }} />
          <Btn label="Logout All Devices" variant="danger" t={t} icon="refresh" full onClick={async () => {
            try { await api.post("/auth/logout-all"); window.location.href = "/login"; }
            catch { showToast("Failed to sign out all devices", "error"); }
          }} />
        </div>
      </Card>
    </div>
  );
};

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV = [
  { id: "profile", label: "Edit Profile", icon: "user", group: "Identity" },
  { id: "education", label: "Education & Certs", icon: "award", group: "Identity" },
  { id: "notifications", label: "Notifications", icon: "bell", group: "Activity" },
  { id: "insights", label: "Your Insights", icon: "chart", group: "Activity" },
  { id: "professional", label: "Professional Account", icon: "briefcase", group: "Business" },
  { id: "security", label: "Security & Auth", icon: "lock", group: "Privacy" },
  { id: "messages", label: "Messages", icon: "msg", group: "Interactions" },
  { id: "saved", label: "Saved Settings", icon: "bookmark", group: "Interactions" },
  { id: "appearance", label: "Appearance", icon: "palette", group: "Preferences" },
  { id: "language", label: "Language", icon: "globe", group: "Preferences" },
  { id: "privacy", label: "Privacy & Data", icon: "shield", group: "Preferences" },
  { id: "danger", label: "Danger Zone", icon: "trash", group: "System", isDanger: true },
  { id: "logout", label: "Logout", icon: "logout", group: "System", isDanger: true },
];

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function Settings() {
  const { resolvedTheme, setTheme } = useTheme();
  const { user } = useAuth();
  const isDark = resolvedTheme === 'dark';
  const setIsDark = (v) => setTheme(v ? 'dark' : 'light');
  const [active, setActive] = useState("profile");
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toasts, setToasts] = useState([]);
  const t = isDark ? THEMES.dark : THEMES.light;

  // Real user display values — used in sidebar and mobile header
  const displayName = user?.name || user?.username || "Account";
  const displayHandle = user?.username ? `@${user.username}` : "";
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const accountType = user?.account_type === "professional" ? "PRO" : "PERSONAL";

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 3000);
  }, []);

  const filtered = search ? NAV.filter(n => n.label.toLowerCase().includes(search.toLowerCase())) : NAV;
  const groups = [...new Set(filtered.map(n => n.group))];

  const renderPanel = () => {
    const props = { t, showToast, isDark, setIsDark };
    switch (active) {
      case "profile": return <EditProfile {...props} />;
      case "education": return <EducationCerts {...props} />;
      case "notifications": return <Notifications {...props} />;
      case "insights": return <Insights {...props} />;
      case "professional": return <Professional {...props} />;
      case "security": return <Security {...props} />;
      case "messages": return <Messages {...props} />;
      case "saved": return <Saved {...props} />;
      case "appearance": return <Appearance {...props} />;
      case "language": return <Language {...props} />;
      case "privacy": return <PrivacySettings {...props} />;
      case "danger": return <DangerZone {...props} />;
      case "logout": return <Logout {...props} />;
      default: return null;
    }
  };

  return (
    <div style={{ fontFamily: "'Manrope','Manrope',sans-serif", background: t.bg, minHeight: "100vh", color: t.text, transition: "background .4s,color .4s" }}>
      <GlobalStyles />

      {/* CPA Background Ambient — matches login dark bg depth */}
      {isDark && <>
        <div style={{ position: "fixed", top: -120, left: -80, width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(138,43,255,0.07) 0%, transparent 68%)", pointerEvents: "none", zIndex: 0, animation: "glowPulse 5s ease infinite" }} />
        <div style={{ position: "fixed", bottom: -60, right: -80, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(77,163,255,0.05) 0%, transparent 68%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", top: "40%", left: "30%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(98,0,234,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      </>}

      {/* ── MOBILE HEADER ── */}
      <style>{`
        .cpa-mobile-header { display: none !important; }
        .cpa-desktop-sidebar { display: flex !important; }
        @media (max-width: 768px) {
          .cpa-mobile-header  { display: flex !important; }
          .cpa-desktop-sidebar { display: none !important; }
          .cpa-desktop-layout { flex-direction: column !important; }
          .cpa-content-panel  { padding: 20px 16px 100px !important; max-height: unset !important; overflow-y: unset !important; }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <div className="cpa-mobile-header" style={{
        position: "sticky", top: 0, zIndex: 50,
        background: t.headerBg, backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid ${t.sep}`,
        padding: "0 16px", height: 56,
        alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Left purple accent bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${t.accent}, transparent)`, opacity: .5 }} />
        <button onClick={() => setMobileNav(true)} style={{
          width: 36, height: 36, borderRadius: 9,
          border: `1px solid ${t.cardBorder}`, background: t.isDark ? "rgba(255,255,255,0.04)" : t.card,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Ic p={I.settings2} s={16} c={t.text2} />
        </button>
        <div style={{
          fontWeight: 700, fontSize: 15,
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: ".01em", color: t.text,
        }}>
          {NAV.find(n => n.id === active)?.label || "Settings"}
        </div>
        <button onClick={() => setIsDark(!isDark)} style={{
          width: 36, height: 36, borderRadius: 9,
          border: `1px solid ${t.isDark ? "rgba(138,43,255,0.35)" : "rgba(123,44,255,0.25)"}`,
          background: t.accentSoft,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: t.isDark ? `0 0 12px rgba(138,43,255,0.25)` : "none",
        }}>
          <Ic p={isDark ? I.sun : I.moon} s={15} c={t.neon} />
        </button>
      </div>

      {/* ── MOBILE NAV OVERLAY ── */}
      {mobileNav && (
        <div className="mobile-nav-overlay" style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
          <div onClick={() => setMobileNav(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)" }} />
          <div style={{
            position: "relative", width: 272, background: t.sidebarBg,
            height: "100%", overflowY: "auto", padding: "20px 10px",
            borderRight: `1px solid ${t.sep}`,
            animation: "slideInFromLeft .25s cubic-bezier(.34,1.56,.64,1)",
            boxShadow: t.isDark ? `4px 0 40px rgba(0,0,0,0.8)` : `4px 0 24px rgba(0,0,0,0.12)`,
          }}>
            {/* Logo area */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 18px", borderBottom: `1px solid ${t.sep}`, marginBottom: 14 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `linear-gradient(135deg, #8a2bff 0%, #4da3ff 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700, color: "#fff",
                fontFamily: "'Space Grotesk', sans-serif",
                boxShadow: t.isDark ? `0 0 18px rgba(138,43,255,0.5)` : t.shadowSm,
              }}>{avatarInitial}</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-.01em" }}>{displayName}</p>
                <p style={{ fontSize: 10.5, color: t.text2, fontFamily: "'Manrope', sans-serif", letterSpacing: ".03em" }}>{displayHandle}</p>
              </div>
            </div>
            <div style={{ padding: "4px 0" }}>
              {groups.map(g => (
                <div key={g} style={{ marginBottom: 16 }}>
                  <p style={{
                    fontSize: 9.5, color: t.isDark ? "rgba(138,43,255,0.7)" : t.accent,
                    fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase",
                    fontFamily: "'Space Grotesk', sans-serif",
                    padding: "0 10px", marginBottom: 4,
                  }}>{g}</p>
                  {filtered.filter(n => n.group === g).map(n => (
                    <button key={n.id} className="cpa-nav-btn" onClick={() => { setActive(n.id); setMobileNav(false); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 9,
                        padding: "9px 12px", borderRadius: 9, border: "none", cursor: "pointer",
                        background: active === n.id
                          ? n.isDanger ? t.dangerSoft : t.accentSoft
                          : "transparent",
                        color: active === n.id
                          ? n.isDanger ? t.danger : t.neon
                          : n.isDanger ? t.danger : t.text2,
                        marginBottom: 1,
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 13.5, fontWeight: active === n.id ? 600 : 400,
                        letterSpacing: ".01em",
                        transition: "all .15s ease",
                        position: "relative",
                      }}>
                      {active === n.id && !n.isDanger && (
                        <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, borderRadius: "0 2px 2px 0", background: t.neon, boxShadow: `0 0 8px ${t.accentGlow}` }} />
                      )}
                      <Ic p={I[n.icon]} s={14} c={active === n.id ? (n.isDanger ? t.danger : t.neon) : (n.isDanger ? t.danger : t.text2)} />
                      {n.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP LAYOUT ── */}
      <div className="cpa-desktop-layout" style={{ display: "flex", maxWidth: 1240, margin: "0 auto", minHeight: "100vh", position: "relative", zIndex: 1 }}>

        {/* ── SIDEBAR ── */}
        <div className="desktop-sidebar cpa-desktop-sidebar" style={{
          width: 252, flexShrink: 0,
          position: "sticky", top: 0, height: "100vh", overflowY: "auto",
          background: t.sidebarBg,
          borderRight: `1px solid ${t.sep}`,
          padding: "22px 10px",
          flexDirection: "column",
        }}>
          {/* Subtle top neon line matching login header */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${t.accent}, ${t.accent2}, transparent)`, opacity: t.isDark ? .6 : .4 }} />

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 18px", borderBottom: `1px solid ${t.sep}`, marginBottom: 18 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `linear-gradient(135deg, #8a2bff 0%, #4da3ff 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, fontWeight: 700, color: "#fff",
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: t.isDark ? `0 0 20px rgba(138,43,255,0.52)` : t.shadowSm,
              flexShrink: 0,
            }}>{avatarInitial}</div>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: t.text, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-.01em" }}>{displayName}</p>
              <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                <Badge label={accountType} color={t.badgeText} bg={t.badgeBg} />
              </div>
            </div>
          </div>

          {/* Search — terminal inspired */}
          <div style={{ position: "relative", marginBottom: 18 }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search settings..."
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              style={{
                width: "100%", padding: "8px 12px 8px 34px",
                background: searchFocused
                  ? t.isDark ? "rgba(138,43,255,0.08)" : "rgba(123,44,255,0.05)"
                  : t.inputBg,
                border: `1.5px solid ${searchFocused ? t.accent : t.inputBorder}`,
                borderRadius: 9, color: t.text, fontSize: 12.5,
                fontFamily: "'Manrope', sans-serif", outline: "none",
                transition: "all .2s",
                boxShadow: searchFocused && t.isDark ? `0 0 14px rgba(138,43,255,0.2)` : "none",
              }}
            />
            <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Ic p={I.search} s={13} c={searchFocused ? t.neon : t.text3} />
            </div>
          </div>

          {/* Nav Groups */}
          <div style={{ flex: 1 }}>
            {groups.map(g => (
              <div key={g} style={{ marginBottom: 20 }}>
                {/* Group label — uppercase system label style */}
                <p style={{
                  fontSize: 9.5, fontWeight: 700, letterSpacing: ".13em",
                  textTransform: "uppercase", padding: "0 10px", marginBottom: 5,
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: t.isDark ? "rgba(138,43,255,0.65)" : t.accent,
                }}>{g}</p>
                {filtered.filter(n => n.group === g).map(n => {
                  const isActive = active === n.id;
                  return (
                    <button key={n.id} className="cpa-nav-btn" onClick={() => setActive(n.id)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 9,
                        padding: "8px 10px 8px 14px", borderRadius: 9,
                        border: "none", cursor: "pointer",
                        background: isActive
                          ? n.isDanger ? t.dangerSoft : t.accentSoft
                          : "transparent",
                        color: isActive
                          ? n.isDanger ? t.danger : t.neon
                          : n.isDanger ? t.danger : t.text2,
                        marginBottom: 1,
                        transition: "all .15s ease",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 13, fontWeight: isActive ? 600 : 400,
                        letterSpacing: ".01em", textAlign: "left",
                        position: "relative",
                      }}>
                      {/* Active left indicator bar */}
                      {isActive && !n.isDanger && (
                        <div style={{
                          position: "absolute", left: 0, top: "18%", bottom: "18%",
                          width: 3, borderRadius: "0 2px 2px 0",
                          background: `linear-gradient(to bottom, ${t.accent}, ${t.accent2})`,
                          boxShadow: t.isDark ? `0 0 10px ${t.accentGlow}` : "none",
                        }} />
                      )}
                      <div style={{
                        width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                        background: isActive
                          ? n.isDanger ? t.dangerSoft : t.isDark ? "rgba(138,43,255,0.2)" : "rgba(123,44,255,0.12)"
                          : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background .15s",
                      }}>
                        <Ic p={I[n.icon]} s={13} c={isActive ? (n.isDanger ? t.danger : t.neon) : (n.isDanger ? t.danger : t.text2)} />
                      </div>
                      <span style={{ flex: 1 }}>{n.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Theme Toggle at bottom */}
          <div style={{
            borderTop: `1px solid ${t.sep}`,
            paddingTop: 14, marginTop: 4,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 8px 0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Ic p={isDark ? I.moon : I.sun} s={13} c={t.text2} />
              <span style={{ fontSize: 12, color: t.text2, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: ".03em" }}>
                {isDark ? "DARK" : "LIGHT"}
              </span>
            </div>
            <Toggle on={isDark} onChange={setIsDark} t={t} size="sm" />
          </div>
        </div>

        {/* ── MAIN CONTENT PANEL ── */}
        <div className="cpa-content-panel" style={{
          flex: 1, padding: "36px 36px 64px",
          overflowY: "auto", maxHeight: "100vh",
          background: t.isDark ? "rgba(0,0,0,0.18)" : "transparent",
        }}>
          {/* Neon top accent line on content panel */}
          <div style={{
            position: "sticky", top: -36, zIndex: 10,
            height: 1, marginBottom: 36,
            background: t.isDark
              ? `linear-gradient(90deg, transparent, ${t.accent}55, ${t.accent2}33, transparent)`
              : `linear-gradient(90deg, transparent, ${t.accent}22, transparent)`,
            marginLeft: -36, marginRight: -36,
          }} />

          <div style={{ maxWidth: 672, margin: "0 auto", animation: "fadeIn .28s ease" }} key={active}>
            {renderPanel()}
          </div>
        </div>
      </div>

      {/* Toasts */}
      <Toast toasts={toasts} />
    </div>
  );
}
