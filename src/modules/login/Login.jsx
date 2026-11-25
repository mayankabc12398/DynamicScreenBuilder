// HospediaLogin.jsx — Redesigned
// Drop-in replacement. Only visual styles have changed; all logic/imports are preserved.

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { GetBindMenu } from "../../store/reducers/common/CommonExportFunction";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import logo from "@app/assets/image/logo.png";
import default_slide_fallback from "@app/assets/image/slide1-removebg-preview.png";
import { handleReactSelectDropDownOptions, notify } from "../../utils/utils";
import { useLocalStorage, getGlobalResourseApiData } from "../../utils/hooks/useLocalStorage";
import {
  GetLoginPageImageAPI,
  LoginGetEmployeeForForget,
  SendForgetPassword,
  signInAction,
} from "../../store/reducers/loginSlice/loginSlice";
import { speakMessage } from "../../utils/ustil2";
import ReactSelect from "../../components/formComponent/ReactSelect";
import { validateLoginTimeSync } from "../../utils/loginTimeGuard";

/* ─────────────────────────── FALLBACK IMAGES ─────────────────────────── */
const SLIDE_IMAGES_FALLBACK = [default_slide_fallback];

const SLIDE_LABELS = [
  "Advanced Medical Care",
  "Expert Healthcare Team",
  "Dedicated Specialists",
  "State-of-the-Art Facility",
];

const getImgSrc = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (item?.ImageBase64) {
    const b64 = item.ImageBase64.trim();
    return b64.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`;
  }
  return "";
};

/* ═══════════════════════════════════════════════════════════════════════
   DAY THEMES — leftBg gradient flows BOTTOM → TOP (0deg)
   accent-dark at bottom → accent → mid tint → white/light at top
═══════════════════════════════════════════════════════════════════════ */
const DAY_THEMES = {
  0: {
    // Sunday — Soft Rose
    name: "Sunday",
    leftBg: "linear-gradient(0deg, #c2445f 0%, #e05a7a 15%, #fbb6c8 55%, #fff0f3 100%)",
    accentColor: "#e05a7a",
    accentLight: "#f8d7e0",
    accentMid: "#c2445f",
    btnGrad: "linear-gradient(135deg, #e05a7a 0%, #c2445f 100%)",
    btnShadow: "rgba(224,90,122,0.35)",
    inputBg: "#fdf4f6",
    inputFocusBg: "#fce8ed",
    focusRing: "rgba(224,90,122,0.20)",
    labelColor: "#8b2840",
    orbA: "rgba(224,90,122,0.12)",
    orbB: "rgba(255,255,255,0.05)",
    greeting: "Happy Sunday",
  },
  1: {
    // Monday — Deep Sapphire
    name: "Monday",
    leftBg: "linear-gradient(0deg, #1d4ed8 0%, #3b82f6 15%, #93c5fd 55%, #eff6ff 100%)",
    accentColor: "#3b82f6",
    accentLight: "#dbeafe",
    accentMid: "#1d4ed8",
    btnGrad: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    btnShadow: "rgba(59,130,246,0.35)",
    inputBg: "#f0f6ff",
    inputFocusBg: "#dbeafe",
    focusRing: "rgba(59,130,246,0.20)",
    labelColor: "#1e40af",
    orbA: "rgba(59,130,246,0.12)",
    orbB: "rgba(255,255,255,0.05)",
    greeting: "Good Monday",
  },
  2: {
    // Tuesday — Medical Teal (brand)
    name: "Tuesday",
    leftBg: "linear-gradient(0deg, #0284c7 0%, #0ea5e9 15%, #7dd3fc 55%, #f0faff 100%)",
    accentColor: "#0ea5e9",
    accentLight: "#e0f2fe",
    accentMid: "#0284c7",
    btnGrad: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
    btnShadow: "rgba(14,165,233,0.35)",
    inputBg: "#f0faff",
    inputFocusBg: "#e0f2fe",
    focusRing: "rgba(14,165,233,0.20)",
    labelColor: "#075985",
    orbA: "rgba(14,165,233,0.12)",
    orbB: "rgba(255,255,255,0.05)",
    greeting: "Good Tuesday",
  },
  3: {
    // Wednesday — Violet
    name: "Wednesday",
    leftBg: "linear-gradient(0deg, #6d28d9 0%, #8b5cf6 15%, #c4b5fd 55%, #f5f3ff 100%)",
    accentColor: "#8b5cf6",
    accentLight: "#ede9fe",
    accentMid: "#6d28d9",
    btnGrad: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    btnShadow: "rgba(139,92,246,0.35)",
    inputBg: "#f5f3ff",
    inputFocusBg: "#ede9fe",
    focusRing: "rgba(139,92,246,0.20)",
    labelColor: "#4c1d95",
    orbA: "rgba(139,92,246,0.12)",
    orbB: "rgba(255,255,255,0.05)",
    greeting: "Good Wednesday",
  },
  4: {
    // Thursday — Emerald
    name: "Thursday",
    leftBg: "linear-gradient(0deg, #059669 0%, #10b981 15%, #6ee7b7 55%, #f0fdf4 100%)",
    accentColor: "#10b981",
    accentLight: "#d1fae5",
    accentMid: "#059669",
    btnGrad: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    btnShadow: "rgba(16,185,129,0.35)",
    inputBg: "#f0fdf4",
    inputFocusBg: "#d1fae5",
    focusRing: "rgba(16,185,129,0.20)",
    labelColor: "#065f46",
    orbA: "rgba(16,185,129,0.12)",
    orbB: "rgba(255,255,255,0.05)",
    greeting: "Good Thursday",
  },
  5: {
    // Friday — Amber
    name: "Friday",
    leftBg: "linear-gradient(0deg, #d97706 0%, #f59e0b 15%, #fcd34d 55%, #fffbeb 100%)",
    accentColor: "#f59e0b",
    accentLight: "#fef3c7",
    accentMid: "#d97706",
    btnGrad: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    btnShadow: "rgba(245,158,11,0.35)",
    inputBg: "#fffbeb",
    inputFocusBg: "#fef3c7",
    focusRing: "rgba(245,158,11,0.20)",
    labelColor: "#92400e",
    orbA: "rgba(245,158,11,0.12)",
    orbB: "rgba(255,255,255,0.05)",
    greeting: "Happy Friday",
  },
  6: {
    // Saturday — Deep Rose / Pink
    name: "Saturday",
    leftBg: "linear-gradient(0deg, #be185d 0%, #ec4899 15%, #f9a8d4 55%, #fdf2f8 100%)",
    accentColor: "#ec4899",
    accentLight: "#fce7f3",
    accentMid: "#be185d",
    btnGrad: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
    btnShadow: "rgba(236,72,153,0.35)",
    inputBg: "#fdf2f8",
    inputFocusBg: "#fce7f3",
    focusRing: "rgba(236,72,153,0.20)",
    labelColor: "#831843",
    orbA: "rgba(236,72,153,0.12)",
    orbB: "rgba(255,255,255,0.05)",
    greeting: "Happy Saturday",
  },
  7: {
    // Sunday alt — Lime Green
    name: "Sunday",
    leftBg: "linear-gradient(0deg, #23be18 0%, #66ec48 15%, #86efac 55%, #f0fdf4 100%)",
    accentColor: "#66ec48",
    accentLight: "#e7fce8",
    accentMid: "#23be18",
    btnGrad: "linear-gradient(135deg, #48ec5b 0%, #18be3c 100%)",
    btnShadow: "rgba(72, 236, 80, 0.35)",
    inputBg: "#f2fdf3",
    inputFocusBg: "#e7fce9",
    focusRing: "rgba(72, 236, 75, 0.2)",
    labelColor: "#188321",
    orbA: "rgba(72, 236, 105, 0.12)",
    orbB: "rgba(255, 255, 255, 0.05)",
    greeting: "Happy Sunday",
  },
};

const getTodayTheme = (day) => DAY_THEMES[day];

/* ─────────────────────────── STYLES FACTORY ─────────────────────────── */
const buildStyles = (theme) => `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --accent: ${theme?.accentColor};
    --accent-mid: ${theme?.accentMid};
    --accent-light: ${theme?.accentLight};
    --focus-ring: ${theme?.focusRing};
    --input-bg: ${theme?.inputBg};
    --input-focus-bg: ${theme?.inputFocusBg};
    --label-color: ${theme?.labelColor};
    --btn-shadow: ${theme?.btnShadow};
    --orb-a: ${theme?.orbA};
    --orb-b: ${theme?.orbB};
  }

  .hp-wrapper {
    font-family: 'DM Sans', sans-serif;
    display: flex;
    height: 100vh;
    width: 100%;
    overflow: hidden;
    background: #f8f9fc;
  }

  /* ══ LEFT PANEL ══ */
  .hp-left {
    width: 62%;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${theme?.leftBg};
    flex-shrink: 0;
  }

  /* Subtle grid texture */
  .hp-left::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    z-index: 0;
  }

  /* Background slide images */
  .hp-bg-img {
    position: absolute;
    inset: 0;
    width: 100%; height: 100%;
    // object-fit: cover;
    opacity: 0;
    transition: opacity 1.4s ease-in-out;
    z-index: 1;
  }
  .hp-bg-img.hp-bg-active { opacity: 0.12; }

  /* Orbs */
  .hp-orb {
    position: absolute;
    border-radius: 50%;
    z-index: 2;
    animation: hp-float 6s ease-in-out infinite;
  }
  .hp-orb-1 { width:480px;height:480px;top:-160px;left:-160px; background:var(--orb-a); animation-delay:0s; }
  .hp-orb-2 { width:280px;height:280px;bottom:-80px;right:-80px; background:var(--orb-a); animation-delay:2s; }
  .hp-orb-3 { width:120px;height:120px;top:42%;left:8%; background:var(--orb-b); animation-delay:1s; }
  .hp-orb-4 { width:60px;height:60px;bottom:22%;right:12%; background:var(--orb-b); animation-delay:3s; }

  @keyframes hp-float {
    0%,100% { transform: translateY(0) scale(1); }
    50%      { transform: translateY(-14px) scale(1.04); }
  }

  /* ── Slide frame ── */
  .hp-frame {
    position: relative;
    z-index: 4;
    width: 78%;
    max-width: 580px;
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.10);
    box-shadow: 0 32px 80px rgba(0,0,0,0.55), 0 8px 20px rgba(0,0,0,0.30);
  }

  /* frame titlebar */
  .hp-titlebar {
    height: 36px;
    background: rgba(255,255,255,0.07);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 14px;
  }
  .hp-dot { width:10px;height:10px;border-radius:50%; }
  .hp-dot:nth-child(1){background:#ff5f57;}
  .hp-dot:nth-child(2){background:#febc2e;}
  .hp-dot:nth-child(3){background:#28c840;}
  .hp-titlebar-logo { margin-left: auto; height: 18px; opacity: 0.85; }

  /* slide track */
  .hp-track {
    position: relative;
    height: 320px;
    background: rgba(0,0,0,0.4);
    overflow: hidden;
  }

  .hp-slide {
    position: absolute;
    inset: 0;
    width:100%; height:100%;
    // object-fit: cover;
    object-position: center top;
    opacity: 0;
    transform: scale(1.06);
    transition: opacity 1s ease, transform 1s ease;
    will-change: opacity, transform;
  }
  .hp-slide.active  { opacity:1; transform:scale(1); }
  .hp-slide.exiting { opacity:0; transform:scale(0.97); }

  /* gradient overlay on track */
  .hp-track::after {
    content:'';
    position:absolute;
    inset:0;
    background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.10) 60%, transparent 100%);
    z-index:2;
    pointer-events:none;
  }

  /* card footer */
  .hp-card-foot {
    position: absolute;
    bottom:0; left:0; right:0;
    padding: 28px 18px 16px;
    z-index: 3;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 10px;
  }
  .hp-slide-label {
    font-size: 0.72rem;
    font-weight: 500;
    color: rgba(255,255,255,0.90);
    letter-spacing: 1.4px;
    text-transform: uppercase;
  }
  .hp-dots { display:flex; gap:5px; align-items:center; }
  .hp-dot-btn {
    width:6px; height:6px; border-radius:50%;
    background:rgba(255,255,255,0.35);
    border:none; cursor:pointer; padding:0;
    transition: all 0.3s ease;
  }
  .hp-dot-btn.hp-dot-active { background:#fff; width:18px; border-radius:3px; }

  /* ── Branding ── */
  .hp-brand {
    position: absolute;
    bottom: 28px; left:0; right:0;
    text-align: center;
    z-index: 4;
  }
  .hp-brand-name {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem;
    font-weight: 400;
    color: rgba(255,255,255,0.95);
    letter-spacing: 1px;
    text-shadow: 0 2px 20px rgba(0,0,0,0.40);
  }
  .hp-brand-sub {
    font-size: 0.62rem;
    color: rgba(255,255,255,0.45);
    letter-spacing: 2.5px;
    text-transform: uppercase;
    margin-top: 5px;
  }

  /* Accent bar at bottom */
  .hp-accent-bar {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent 0%, var(--accent) 40%, var(--accent) 60%, transparent 100%);
    opacity: 0.7;
    z-index: 5;
  }

  /* ══ RIGHT PANEL ══ */
  .hp-right {
    flex: 1;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 40px;
    position: relative;
    overflow: hidden;
  }

  /* Subtle right panel bg decoration */
  .hp-right::before {
    content:'';
    position:absolute;
    top:-80px; right:-80px;
    width:280px; height:280px;
    border-radius:50%;
    background: var(--accent-light);
    opacity: 0.45;
  }
  .hp-right::after {
    content:'';
    position:absolute;
    bottom:-60px; left:-60px;
    width:180px; height:180px;
    border-radius:50%;
    background: var(--accent-light);
    opacity: 0.30;
  }

  .hp-form-box {
    width: 100%;
    max-width: 380px;
    position: relative;
    z-index: 1;
  }

  /* Logo area */
  .hp-form-logo { height: 28px; margin-bottom: 36px; display: block; }

  /* Day chip */
  .hp-day-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--accent);
    background: var(--accent-light);
    border-radius: 100px;
    padding: 5px 14px;
    margin-bottom: 20px;
    letter-spacing: 0.3px;
  }
  .hp-day-chip::before {
    content:'';
    width:6px; height:6px; border-radius:50%;
    background: var(--accent);
    display:block;
  }

  /* Headings */
  .hp-form-h1 {
    font-family: 'DM Serif Display', serif;
    font-size: 2.1rem;
    font-weight: 400;
    color: #0f172a;
    line-height: 1.15;
    margin-bottom: 8px;
    letter-spacing: -0.3px;
  }
  .hp-form-sub {
    font-size: 0.88rem;
    color: #94a3b8;
    font-weight: 400;
    margin-bottom: 34px;
    line-height: 1.5;
  }

  /* Divider */
  .hp-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
    margin-bottom: 28px;
  }

  /* Field label */
  .hp-label {
    display:block;
    font-size: 0.76rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 8px;
  }
  .hp-label span { color: var(--accent); }

  /* Input wrapper */
  .hp-field { position:relative; margin-bottom: 20px; }
  .hp-icon {
    position:absolute; left:14px; top:50%;
    transform: translateY(-50%);
    color: #94a3b8; display:flex; align-items:center;
    pointer-events:none;
  }
  .hp-input {
    width:100%; padding: 13px 44px;
    background: var(--input-bg);
    border: 1.5px solid transparent;
    border-radius: 10px;
    font-size: 0.90rem;
    color: #0f172a;
    font-family: 'DM Sans', sans-serif;
    outline:none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .hp-input::placeholder { color: #cbd5e1; }
  .hp-input:focus {
    background: var(--input-focus-bg);
    border-color: var(--accent);
    box-shadow: 0 0 0 4px var(--focus-ring);
  }
  .hp-eye {
    position:absolute; right:14px; top:50%;
    transform: translateY(-50%);
    background:none; border:none; cursor:pointer;
    color:#94a3b8; padding:0; display:flex; align-items:center;
    transition: color 0.2s;
  }
  .hp-eye:hover { color: var(--accent); }

  /* Options row */
  .hp-opts {
    display:flex; align-items:center;
    justify-content:flex-end; margin-bottom: 24px;
  }
  .hp-forgot {
    font-size: 0.82rem; color: var(--accent); font-weight: 500;
    cursor:pointer; background:none; border:none;
    font-family:'DM Sans',sans-serif; text-decoration:none;
    padding: 0;
    transition: opacity 0.2s;
  }
  .hp-forgot:hover { opacity: 0.75; }

  .hp-select-wrap { margin-bottom: 22px; }

  /* Submit button */
  .hp-btn {
    width:100%; padding: 14px;
    background: ${theme?.btnGrad};
    color:#fff; border:none; border-radius:10px;
    font-size: 0.95rem; font-weight: 600;
    font-family:'DM Sans',sans-serif; cursor:pointer;
    transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
    box-shadow: 0 4px 20px var(--btn-shadow);
    letter-spacing: 0.3px;
  }
  .hp-btn:hover  { transform: translateY(-2px); box-shadow: 0 8px 28px var(--btn-shadow); }
  .hp-btn:active { transform: translateY(0); opacity: 0.92; }

  /* Footer note */
  .hp-form-footer {
    text-align:center;
    margin-top: 28px;
    font-size: 0.72rem;
    color: #cbd5e1;
    letter-spacing: 0.3px;
  }

  @media (max-width: 820px) {
    .hp-left  { display:none; }
    .hp-right { width:100%; padding: 40px 24px; }
    .hp-right::before, .hp-right::after { display:none; }
  }
`;

/* ─────────────────────────── SVG ICONS ─────────────────────────── */
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
    />
  </svg>
);
const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 11V7a5 5 0 0110 0v4"
    />
  </svg>
);
const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.94 17.94A10.9 10.9 0 0112 19c-5 0-9.27-3.11-11-7 1.05-2.33 2.72-4.3 4.87-5.66M9.9 4.24A10.94 10.94 0 0112 4c5 0 9.27 3.11 11 7a11.1 11.1 0 01-1.55 2.89M3 3l18 18"
    />
  </svg>
);
const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
    />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/* ─────────────────────────── SLIDESHOW ─────────────────────────── */
const HospediaSlideshow = ({ images = [], intervalMs = 4000, theme }) => {
  const [t] = useTranslation();
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [animating, setAnimating] = useState(false);
  const total = images.length;

  const advance = (nextIdx) => {
    if (animating || total === 0) return;
    setPrev(current);
    setAnimating(true);
    setCurrent(nextIdx);
    setTimeout(() => {
      setPrev(null);
      setAnimating(false);
    }, 1000);
  };

  useEffect(() => {
    if (total === 0) return;
    const t = setInterval(() => advance((current + 1) % total), intervalMs);
    return () => clearInterval(t);
  }, [current, animating, total]);

  if (total === 0)
    return (
      <>
        <div className="hp-orb hp-orb-1" />
        <div className="hp-orb hp-orb-2" />
        <div className="hp-orb hp-orb-3" />
        <div className="hp-orb hp-orb-4" />
        <div className="hp-brand">
          <div className="hp-brand-name">{t("Hospedia")}</div>
          <div className="hp-brand-sub">{t("Healthcare Management System")}</div>
        </div>
        <div className="hp-accent-bar" />
      </>
    );

  return (
    <>
      {images.map((item, idx) => (
        <img
          key={`bg-${idx}`}
          src={getImgSrc(item)}
          alt=""
          className={`hp-bg-img${idx === current ? " hp-bg-active" : ""}`}
        />
      ))}

      <div className="hp-orb hp-orb-1" />
      <div className="hp-orb hp-orb-2" />
      <div className="hp-orb hp-orb-3" />
      <div className="hp-orb hp-orb-4" />

      <div className="hp-frame">
        <div className="hp-titlebar">
          <div className="hp-dot" />
          <div className="hp-dot" />
          <div className="hp-dot" />
          <img className="hp-titlebar-logo" src={logo} alt="Logo" />
        </div>
        <div className="hp-track">
          {images.map((item, idx) => {
            let cls = "hp-slide";
            if (idx === current) cls += " active";
            else if (idx === prev) cls += " exiting";
            return (
              <img
                key={idx}
                src={getImgSrc(item)}
                alt={SLIDE_LABELS[idx] || `Slide ${idx + 1}`}
                className={cls}
                draggable={false}
                onError={(e) => {
                  e.target.src = default_slide_fallback;
                }}
              />
            );
          })}
          <div className="hp-card-foot">
            <span className="hp-slide-label">
              {images[current]?.ImageName ||
                SLIDE_LABELS[current] ||
                `Slide ${current + 1}`}
            </span>
            <div className="hp-dots">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  className={`hp-dot-btn${idx === current ? " hp-dot-active" : ""}`}
                  onClick={() => idx !== current && advance(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* <div className="hp-brand">
        <div className="hp-brand-name">Hospedia</div>
        <div className="hp-brand-sub">Powered by ItDose Infosystem Pvt. Ltd.</div>
      </div> */}
      <div className="hp-accent-bar" />
    </>
  );
};

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */
const HospediaLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [t] = useTranslation();
  const [theme, setTheme] = useState(() => getTodayTheme(new Date().getDay()));
  const [slide_images, setSlideImages] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [userData, setUserData] = useState([]);
  const [screenType, setScreenType] = useState("Login");

  useEffect(() => {
    async function preloadImages() {
      try {
        const apiResp = await GetLoginPageImageAPI();
        if (apiResp?.success && apiResp?.data?.length) {
          setSlideImages(apiResp.data);
        } else {
          setSlideImages(SLIDE_IMAGES_FALLBACK);
        }
      } catch {
        setSlideImages(SLIDE_IMAGES_FALLBACK);
      }
    }
    preloadImages();
  }, []);

  const { handleChange, values, handleSubmit, resetForm } = useFormik({
    initialValues: { userName: "", password: "" },
    onSubmit: async (values) => {
      if (!values?.userName || !values?.password) {
        notify(t("Both fields are required"), "error");
        return;
      }
      if (values?.userName.length < 3) {
        notify(t("At least 3 characters are required"), "error");
        return;
      }

      // Block login when the local system clock is out of sync with the server
      // clock by more than ±30 minutes.
      const timeSync = await validateLoginTimeSync();
      if (!timeSync.ok) {
        const mins = Math.abs(timeSync.diffMinutes);
        const direction = timeSync.diffMs > 0 ? "behind" : "ahead of";
        notify(
          `Your system date/time is ${mins} minute(s) ${direction} the server. ` +
            `Please correct your system clock (allowed difference is 30 minutes) and try again.`,
          "error",
        );
        return;
      }

      try {
        const loginData = await dispatch(signInAction(values));
        useLocalStorage(
          "theme",
          "set",
          loginData?.payload?.data?.userDetails?.themeName || "default_theme",
        );
        if (loginData?.payload?.success) {
          speakMessage(
            `Welcome ${loginData?.payload?.data?.userDetails?.empName ?? ""}`,
          );
          try {
            await getGlobalResourseApiData();
          } catch (e) {
            console.error("Failed to fetch global resources on login:", e);
          }
          /* Where this login lands. Users who have pinned a screen (the pin in the
             header) get sent there; everyone else, and anyone whose pinned screen is
             no longer in their role's menu, lands on the dashboard as before - the
             server only sends a page back after checking it is still reachable. */
          const landing =
            loginData?.payload?.data?.userDetails?.defaultPageUrl || "/dashboard";
          const landingActualUrl =
            loginData?.payload?.data?.userDetails?.defaultPageActualUrl || landing;

          /* The menu has to be in hand before the move. Only the dashboard and the other
             common screens are routes from the start; every screen reached from the menu
             becomes a route once the menu has loaded, and until then the router treats it
             as unknown and sends it to the dashboard. Navigating first would land on the
             dashboard every time, however good the pinned page was.

             Only for a pinned page - the plain dashboard login keeps going straight
             through, and the menu loads behind it as it always has. */
          if (landing !== "/dashboard") {
            try {
              await dispatch(
                GetBindMenu({
                  RoleID: loginData?.payload?.data?.userDetails?.defaultRole,
                }),
              );
            } catch (e) {
              console.error("Failed to load the menu before landing:", e);
            }
          }

          navigate(landing, {
            state: { data: "", actualUrl: landingActualUrl },
          });
        } else if (loginData?.payload) {
          // The API answers a wrong username/password with success = false (HTTP 200);
          // it used to be ignored, so the page just did nothing.
          notify("Wrong username or password. Please try again.", "error");
        } else {
          notify("Unable to reach the server. Please try again.", "error");
        }
      } catch (error) {
        console.error("Login error:", error);
        notify("Unable to reach the server. Please try again.", "error");
      }
    },
  });

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!values?.userName) {
      notify(t("Please fill the required fields"), "error");
      return;
    }
    if (values?.userName.length < 3) {
      notify(t("At least 3 characters are required"), "error");
      return;
    }
    try {
      const res = await dispatch(
        LoginGetEmployeeForForget({ input: values?.userName }),
      );
      if (res?.payload?.success) {
        setUserData(res.payload.data);
        notify(res.payload.message, "success");
        resetForm();
      } else notify(res?.payload?.message, "error");
    } catch (error) {
      notify(error?.message, "error");
    }
  };

  const handleSendForgetPasswordSubmit = async (name, value) => {
    try {
      const res = await dispatch(
        SendForgetPassword({ employeeID: value?.EmployeeID }),
      );
      if (res?.payload?.success) {
        setScreenType("Login");
        resetForm();
        notify(t("Reset password sent successfully"), "success");
      }
    } catch (error) {
      notify(error?.message, "error");
    }
  };

  useEffect(() => {
    if (userData?.length === 1)
      handleSendForgetPasswordSubmit("employee", userData[0]);
  }, [userData]);

  const goToForgotPassword = () => {
    setScreenType("ForgotPassword");
    setUserData([]);
    resetForm();
  };
  const goToLogin = () => {
    setScreenType("Login");
    setUserData([]);
    resetForm();
  };

  const isLogin = screenType === "Login";
  const isForgot = screenType === "ForgotPassword";
  const showEmpSelect = isForgot && userData?.length > 1;
  const showTextField = isLogin || (isForgot && !userData?.length);

  return (
    <>
      <style>{buildStyles(theme)}</style>
      <div className="hp-wrapper">


        {/* ── LEFT PANEL ── */}
        <div className="hp-left">

          <HospediaSlideshow
            images={slide_images}
            intervalMs={4000}
            theme={theme}
          />

        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="hp-right">
          <div className="hp-form-box">
            {/* <div style={{position:"absolute",right:"-150px" ,width:"200px",top:"-50px"}}>

            <ReactSelect
          placeholderName="Theme"
          id="Theme"
          inputId="Theme"
          name="Theme"
          value={values?.Theme}
          dynamicOptions={[
            { label: "Monday", value: "1" },
            { label: "Tuesday", value: "2" },
            { label: "Wednesday", value: "3" },
            { label: "Thursday", value: "4" },
            { label: "Friday", value: "5" },
            { label: "Saturday", value: "6" },
            { label: "Sunday", value: "7" },
          ]}
          searchable={true}
          removeIsClearable={true}
          requiredClassName="required-fields"
          handleChange={(name, value) => {
           let data = DAY_THEMES[parseInt(value?.value)]
           debugger
            setTheme(data)
          }}
          respclass="col-6"
          backgroundColor="white"
        />
            </div> */}
            {/* <img className="hp-form-logo" src={logo} alt="Hospedia"/> */}

            {/* <div className="hp-day-chip">{theme?.greeting}</div> */}


            {isLogin ? (
              <>
                <h1 className="hp-form-h1">{t("Welcome back")}</h1>
                <p className="hp-form-sub">
                  {t("Sign in to continue to your")} <strong>{slide_images?.length > 0 ? slide_images[0]?.GetLoginPageImage : t("Workspace")}</strong>
                </p>
              </>
            ) : (
              <>
                <h1 className="hp-form-h1">{t("Reset password")}</h1>
                <p className="hp-form-sub">
                  {t("Enter your registered email or mobile number")}
                </p>
              </>
            )}

            <div className="hp-divider" />

            <form
              onSubmit={isLogin ? handleSubmit : handleForgotPasswordSubmit}
            >
              {showTextField && (
                <>
                  <label className="hp-label">
                    {isLogin ? t("Username") : t("Mobile / Email")} <span>*</span>
                  </label>
                  <div className="hp-field">
                    <span className="hp-icon">
                      <UserIcon />
                    </span>
                    <input
                      className="hp-input"
                      type="text"
                      id="userName"
                      name="userName"
                      placeholder={
                        isLogin
                          ? "Enter your username"
                          : "Mobile No. or Email ID"
                      }
                      value={values?.userName}
                      onChange={handleChange}
                      autoComplete="username"
                    />
                  </div>
                </>
              )}

              {isLogin && (
                <>
                  <label className="hp-label">
                    {t("Password")} <span>*</span>
                  </label>
                  <div className="hp-field">
                    <span className="hp-icon">
                      <LockIcon />
                    </span>
                    <input
                      className="hp-input"
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder={t("Enter your password")}
                      value={values?.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                    />
                    <button
                      className="hp-eye"
                      type="button"
                      aria-label="Toggle password"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                </>
              )}

              {showEmpSelect && (
                <div className="hp-select-wrap">
                  <ReactSelect
                    placeholderName="Select employee to send reset password"
                    id="employee"
                    inputId="employee"
                    name="employee"
                    value={values?.employee}
                    dynamicOptions={[
                      ...handleReactSelectDropDownOptions(
                        userData,
                        "EmployeeName",
                        "EmployeeID",
                      ),
                    ]}
                    searchable={true}
                    removeIsClearable={true}
                    requiredClassName="required-fields"
                    handleChange={(name, value) =>
                      handleSendForgetPasswordSubmit(name, value)
                    }
                    respclass="col-12"
                    backgroundColor="white"
                  />
                </div>
              )}

              <div className="hp-opts">
                {isLogin && (
                  <button
                    type="button"
                    className="hp-forgot"
                    onClick={goToForgotPassword}
                  >
                    {t("Forgot password?")}
                  </button>
                )}
                {isForgot && (
                  <button
                    type="button"
                    className="hp-forgot"
                    onClick={goToLogin}
                  >
                    {t("← Back to login")}
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="hp-btn"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              >
                {isLogin ? t("Sign In") : t("Get User Details")}
              </button>
            </form>


            <p className="hp-form-footer">
              {t("Hospedia · Hospital Information Management System")} <br />
              {t("Powered by ItDose Infosystem Pvt. Ltd.")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default HospediaLogin;