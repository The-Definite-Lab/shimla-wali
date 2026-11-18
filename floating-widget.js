/**
 * Shimla Crunch — APPY Orchard Concierge & Movable Floating Assistant
 * Features:
 * 1. Renamed to APPY with bespoke mascot avatar
 * 2. 100% Brand Typography aligned with DM Sans & Shimla Crunch Design System
 * 3. Zero Emojis — Replaced with Elegant, Bespoke Vector SVGs
 * 4. Refined typography weights (removed harsh bold blocks)
 * 5. Structured card / box response layout with high readability
 * 6. 100% Option-driven / Pre-made decision flow (no freeform text input clutter)
 * 7. Freely draggable / movable anywhere on screen (touch & mouse) with position memory
 * 8. Clean Action Dock with vector SVGs for instant WhatsApp founder chat and coupon application
 */

(function () {
  'use strict';

  if (window.__SHIMLA_CRUNCH_BOT_INITIALIZED__) return;
  window.__SHIMLA_CRUNCH_BOT_INITIALIZED__ = true;

  // -------------------------------------------------------------
  // 1. BESPOKE VECTOR SVG ICONS (ZERO EMOJIS)
  // -------------------------------------------------------------
  const ICONS = {
    apple: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.94c1.5 0 2.75-.75 4-2 2-2 3.5-5 3.5-9 0-3-2-5-5-5-1.5 0-2.25.75-2.5 1-.25-.25-1-.1-2.5-1-3 0-5 2-5 5 0 4 1.5 7 3.5 9 1.25 1.25 2.5 2 4 2z"/><path d="M12 4V2c1 0 2.5.5 3 2"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13"/><path d="M19 12H5"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.5 4.5 0 0 1 12 7.5a4.5 4.5 0 0 1 4.5-4.5 2.5 2.5 0 0 1 0 5"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
    walnut: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a9 9 0 0 0-9 9c0 5 4 10 9 11 5-1 9-6 9-11a9 9 0 0 0-9-9z"/><path d="M12 2c-2.5 4-2.5 14 0 20"/><path d="M12 2c2.5 4 2.5 14 0 20"/></svg>',
    honey: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
    mountain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5"/></svg>',
    cert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.79 14.07c-.24.68-1.4 1.25-1.92 1.33-.5.08-1.15.11-3.69-.94-2.17-.9-3.57-3.11-3.68-3.26-.11-.15-.88-1.17-.88-2.23 0-1.06.56-1.58.76-1.8.2-.22.44-.28.59-.28.15 0 .3 0 .43.01.14.01.32-.05.5.39.19.46.65 1.58.71 1.7.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.12-.25.25-.11.49.14.24.63 1.04 1.35 1.68.93.83 1.71 1.09 1.95 1.21.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.18 1.26z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  };

  // -------------------------------------------------------------
  // 2. INJECT BRAND-MATCHED GLASSMORHPISM STYLESHEET
  // -------------------------------------------------------------
  const styleEl = document.createElement('style');
  styleEl.id = 'appy-widget-styles';
  styleEl.textContent = `
    /* =============================================================
       1. DRAGGABLE APPY FLOATING CHARACTER
       ============================================================= */
    #dova-widget-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999995;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
      cursor: grab;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      font-family: var(--font-sans, 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif);
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease;
    }
    #dova-widget-container * {
      box-sizing: border-box;
      font-family: inherit;
    }
    #dova-widget-container:hover {
      transform: translateY(-2px) scale(1.04);
    }
    #dova-widget-container:active,
    #dova-widget-container.appy-is-dragging {
      cursor: grabbing !important;
      transform: scale(0.96);
      filter: drop-shadow(0 14px 28px rgba(39, 72, 20, 0.45));
    }

    .apple-bot-avatar-btn {
      width: 62px;
      height: 62px;
      border-radius: 50%;
      background: linear-gradient(145deg, #ffffff 0%, #f4fbf1 100%);
      border: 2px solid #3D6B22;
      box-shadow: 0 10px 24px rgba(21, 26, 20, 0.22), 0 0 0 3px rgba(61, 107, 34, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: visible;
      transition: box-shadow 0.25s ease, border-color 0.25s ease;
    }
    #dova-widget-container:hover .apple-bot-avatar-btn {
      border-color: #274814;
      box-shadow: 0 14px 30px rgba(39, 72, 20, 0.35), 0 0 0 4px rgba(61, 107, 34, 0.28);
    }
    .apple-bot-img {
      width: 80%;
      height: 80%;
      object-fit: contain;
      display: block;
      pointer-events: none;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12));
    }
    .apple-bot-online-dot {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: #22c55e;
      border: 2px solid #ffffff;
      box-shadow: 0 0 6px #22c55e;
      animation: appyPulseDot 2s infinite;
    }
    @keyframes appyPulseDot {
      0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
      70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
      100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }

    /* Name Pill */
    .dova-badge-pill {
      margin-top: 5px;
      background: rgba(21, 26, 20, 0.92);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(61, 107, 34, 0.45);
      border-radius: 999px;
      padding: 2.5px 9px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      transition: all 0.2s ease;
    }
    #dova-widget-container:hover .dova-badge-pill {
      border-color: #3D6B22;
      background: #151A14;
    }
    .dova-status-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 5px #22c55e;
    }
    .dova-name-text {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: #ffffff;
      text-transform: uppercase;
    }

    /* Refined Speech Bubble (Zero harsh bold, zero emojis) */
    .apple-bot-speech-bubble {
      position: absolute;
      bottom: 76px;
      background: rgba(21, 26, 20, 0.94);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #f8fafc;
      border: 1px solid rgba(61, 107, 34, 0.45);
      padding: 6px 12px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
      animation: appyFloatBubble 3.5s ease-in-out infinite;
      z-index: 999996;
      letter-spacing: -0.01em;
    }
    .apple-bot-speech-bubble::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid rgba(21, 26, 20, 0.94);
    }
    @keyframes appyFloatBubble {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }

    /* =============================================================
       2. FROSTED GLASSMORHPISM CHAT DRAWER
       ============================================================= */
    #agy-chat-box {
      position: fixed;
      bottom: 95px;
      right: 24px;
      width: 375px;
      max-width: calc(100vw - 28px);
      height: 535px;
      max-height: calc(100vh - 110px);
      background: linear-gradient(155deg, rgba(21, 26, 20, 0.94) 0%, rgba(39, 72, 20, 0.90) 100%);
      backdrop-filter: blur(24px) saturate(190%);
      -webkit-backdrop-filter: blur(24px) saturate(190%);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 20px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 12px 28px rgba(39, 72, 20, 0.25);
      display: none;
      flex-direction: column;
      z-index: 999999;
      overflow: hidden;
      transform-origin: bottom right;
      font-family: var(--font-sans, 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif);
      color: #f8fafc;
    }
    #agy-chat-box * {
      box-sizing: border-box;
      font-family: inherit;
    }
    #agy-chat-box.agy-open {
      display: flex;
      animation: appySpringPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    #agy-chat-box.agy-closing {
      animation: appySpringShrink 0.18s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    @keyframes appySpringPop {
      0% { opacity: 0; transform: scale(0.78) translateY(20px); }
      70% { opacity: 1; transform: scale(1.02) translateY(-2px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes appySpringShrink {
      0% { opacity: 1; transform: scale(1) translateY(0); }
      100% { opacity: 0; transform: scale(0.75) translateY(20px); }
    }

    /* Refined Glass Header */
    .agy-header {
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }
    .agy-header-left {
      display: flex;
      align-items: center;
      gap: 11px;
    }
    .appy-avatar-glow {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #ffffff;
      border: 1.8px solid #3D6B22;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 10px rgba(61, 107, 34, 0.35);
      flex-shrink: 0;
    }
    .appy-avatar-glow img {
      width: 80%;
      height: 80%;
      object-fit: contain;
    }
    .agy-header-title {
      display: flex;
      flex-direction: column;
    }
    .appy-hdr-name {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .appy-hdr-sub {
      font-size: 10.5px;
      color: #94a3b8;
      font-weight: 400;
      margin-top: 1px;
      letter-spacing: 0.01em;
    }
    .agy-header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .agy-hdr-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      width: 28px;
      height: 28px;
      border-radius: 7px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      text-decoration: none;
    }
    .agy-hdr-btn svg {
      width: 14px;
      height: 14px;
    }
    .agy-hdr-btn:hover {
      background: rgba(61, 107, 34, 0.25);
      border-color: #3D6B22;
      color: #ffffff;
    }
    #btn-agy-call:hover {
      background: rgba(34, 197, 94, 0.25);
      border-color: #22c55e;
      color: #4ade80;
    }

    /* Message Stream */
    .agy-messages {
      flex: 1;
      padding: 13px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 11px;
      background: transparent;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
    }
    .agy-messages::-webkit-scrollbar {
      width: 4px;
    }
    .agy-messages::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.18);
      border-radius: 8px;
    }

    /* Message Bubbles */
    .agy-msg {
      max-width: 95%;
      border-radius: 12px;
      font-size: 12px;
      line-height: 1.5;
      word-wrap: break-word;
      animation: appyMsgSlide 0.22s ease forwards;
    }
    @keyframes appyMsgSlide {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .agy-msg.user {
      background: linear-gradient(135deg, #274814, #3D6B22);
      color: #ffffff;
      align-self: flex-end;
      border-bottom-right-radius: 3px;
      padding: 8px 12px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(39, 72, 20, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .agy-msg.user svg {
      width: 13px;
      height: 13px;
      flex-shrink: 0;
    }
    .agy-msg.bot {
      width: 100%;
      align-self: flex-start;
      background: transparent;
      padding: 0;
    }

    /* =============================================================
       3. WELCOME SCREEN & INTERACTIVE TOPIC TILES (PREMIUM ICONS)
       ============================================================= */
    .appy-welcome-card {
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 13px;
      display: flex;
      flex-direction: column;
      gap: 11px;
    }
    .appy-welcome-banner {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .appy-mascot-badge {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #ffffff;
      border: 1.8px solid #3D6B22;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18);
    }
    .appy-mascot-badge img {
      width: 80%;
      height: 80%;
      object-fit: contain;
    }
    .appy-welcome-title {
      margin: 0 0 2px 0;
      font-size: 13.5px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: -0.01em;
    }
    .appy-welcome-sub {
      margin: 0;
      font-size: 11px;
      color: #cbd5e1;
      line-height: 1.48;
      font-weight: 400;
    }

    /* Menu Grid */
    .appy-menu-grid {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .appy-topic-tile {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 11px;
      padding: 8px 11px;
      color: #f1f5f9;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      width: 100%;
    }
    .appy-topic-tile:hover {
      background: rgba(61, 107, 34, 0.2);
      border-color: rgba(61, 107, 34, 0.55);
      color: #ffffff;
      transform: translateX(3px);
      box-shadow: 0 4px 14px rgba(39, 72, 20, 0.2);
    }
    .appy-topic-tile.featured {
      background: linear-gradient(135deg, rgba(217, 119, 6, 0.12), rgba(255, 255, 255, 0.04));
      border-color: rgba(245, 158, 11, 0.35);
    }
    .appy-topic-tile.featured:hover {
      background: linear-gradient(135deg, rgba(217, 119, 6, 0.22), rgba(61, 107, 34, 0.25));
      border-color: #d97706;
      box-shadow: 0 4px 14px rgba(217, 119, 6, 0.22);
    }
    .topic-tile-icon {
      width: 30px;
      height: 30px;
      border-radius: 7px;
      background: rgba(61, 107, 34, 0.2);
      border: 1px solid rgba(61, 107, 34, 0.4);
      color: #6ee7b7;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .appy-topic-tile.featured .topic-tile-icon {
      background: rgba(217, 119, 6, 0.2);
      border-color: rgba(245, 158, 11, 0.45);
      color: #fbbf24;
    }
    .topic-tile-icon svg {
      width: 16px;
      height: 16px;
    }
    .topic-tile-info {
      flex: 1;
      min-width: 0;
    }
    .topic-tile-title {
      font-size: 12px;
      font-weight: 500;
      color: #ffffff;
      margin-bottom: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.01em;
    }
    .topic-tile-desc {
      font-size: 10px;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 400;
    }
    .topic-tile-arrow {
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, color 0.2s;
    }
    .topic-tile-arrow svg {
      width: 14px;
      height: 14px;
    }
    .appy-topic-tile:hover .topic-tile-arrow {
      color: #4ade80;
      transform: translateX(2px);
    }

    /* =============================================================
       4. STRUCTURED BOX / CARD RESPONSE LAYOUT (ZERO EMOJIS)
       ============================================================= */
    .appy-response-wrap {
      display: flex;
      flex-direction: column;
      gap: 9px;
      width: 100%;
    }
    .appy-topic-header {
      margin-bottom: 2px;
    }
    .appy-topic-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #fbbf24;
      background: rgba(217, 119, 6, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      padding: 2px 7px;
      border-radius: 999px;
      margin-bottom: 4px;
    }
    .appy-topic-badge svg {
      width: 11px;
      height: 11px;
    }
    .appy-topic-heading {
      margin: 0 0 2px 0;
      font-size: 13.5px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: -0.01em;
    }
    .appy-topic-sub {
      margin: 0;
      font-size: 10.5px;
      color: #cbd5e1;
      line-height: 1.45;
      font-weight: 400;
    }

    /* Distinct Box List */
    .appy-boxes-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .appy-card-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 11px;
      padding: 9px 11px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
      transition: all 0.2s ease;
    }
    .appy-card-box:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(61, 107, 34, 0.45);
    }
    .appy-card-box.highlight {
      background: linear-gradient(135deg, rgba(217, 119, 6, 0.12), rgba(255, 255, 255, 0.04));
      border-color: rgba(245, 158, 11, 0.35);
    }
    .appy-card-icon {
      width: 30px;
      height: 30px;
      border-radius: 7px;
      background: rgba(61, 107, 34, 0.2);
      border: 1px solid rgba(61, 107, 34, 0.35);
      color: #6ee7b7;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .appy-card-box.highlight .appy-card-icon {
      background: rgba(217, 119, 6, 0.18);
      border-color: rgba(245, 158, 11, 0.4);
      color: #fbbf24;
    }
    .appy-card-icon svg {
      width: 15px;
      height: 15px;
    }
    .appy-card-body {
      flex: 1;
      min-width: 0;
    }
    .appy-card-title {
      font-size: 11.5px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 2px;
      line-height: 1.35;
      letter-spacing: -0.01em;
    }
    .appy-card-desc {
      font-size: 10.5px;
      color: #cbd5e1;
      line-height: 1.48;
      font-weight: 400;
    }

    /* Actions Row */
    .appy-action-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 5px;
      padding-top: 7px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .appy-btn {
      padding: 6px 11px;
      border-radius: 7px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 1px solid transparent;
      letter-spacing: -0.01em;
    }
    .appy-btn svg {
      width: 13px;
      height: 13px;
    }
    .appy-btn:hover {
      transform: translateY(-1px);
    }
    .appy-btn-green {
      background: #274814;
      border-color: #3D6B22;
      color: #ffffff;
      box-shadow: 0 3px 10px rgba(39, 72, 20, 0.35);
    }
    .appy-btn-green:hover {
      background: #3D6B22;
      color: #ffffff;
    }
    .appy-btn-gold {
      background: linear-gradient(135deg, #b45309, #92400e);
      border-color: #f59e0b;
      color: #ffffff;
      box-shadow: 0 3px 10px rgba(217, 119, 6, 0.35);
    }
    .appy-btn-gold:hover {
      background: #d97706;
      color: #ffffff;
    }
    .appy-btn-glass {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(255, 255, 255, 0.16);
      color: #e2e8f0;
    }
    .appy-btn-glass:hover {
      background: rgba(255, 255, 255, 0.14);
      border-color: #3D6B22;
      color: #ffffff;
    }

    /* =============================================================
       5. BOTTOM ACTION DOCK (NO FREE-FORM INPUT, CLEAN SVGS)
       ============================================================= */
    .appy-dock {
      padding: 9px 13px;
      display: flex;
      gap: 6px;
      align-items: center;
      background: rgba(21, 26, 20, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }
    .appy-dock-btn {
      flex: 1;
      padding: 7px 9px;
      border-radius: 8px;
      font-size: 10.5px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      text-decoration: none;
      transition: all 0.2s ease;
      white-space: nowrap;
      letter-spacing: -0.01em;
    }
    .appy-dock-btn svg {
      width: 13px;
      height: 13px;
      flex-shrink: 0;
    }
    .appy-dock-btn.menu-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #e2e8f0;
    }
    .appy-dock-btn.menu-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: #3D6B22;
      color: #ffffff;
    }
    .appy-dock-btn.wa-btn {
      background: #25D366;
      border: 1px solid #20ba5a;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(37, 211, 102, 0.25);
    }
    .appy-dock-btn.wa-btn:hover {
      background: #20ba5a;
      transform: translateY(-1px);
    }
    .appy-dock-btn.promo-btn {
      background: rgba(217, 119, 6, 0.14);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fef08a;
    }
    .appy-dock-btn.promo-btn:hover {
      background: #d97706;
      color: #ffffff;
    }

    /* Floating Toast Notification */
    #appy-toast-pill {
      position: fixed;
      bottom: 96px;
      right: 24px;
      z-index: 999999;
      background: #0f172a;
      color: #86efac;
      border: 1.5px solid #166534;
      padding: 10px 18px;
      border-radius: 9999px;
      font-size: 0.82rem;
      font-weight: 700;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      opacity: 0;
      transform: translateY(12px);
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    #appy-toast-pill.appy-toast-visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    /* Mobile Adaptations */
    @media (max-width: 480px) {
      #agy-chat-box {
        right: 10px;
        bottom: 80px;
        width: calc(100vw - 20px);
        height: 480px;
      }
      .apple-bot-avatar-btn {
        width: 58px;
        height: 58px;
      }
      .apple-bot-speech-bubble {
        bottom: 70px;
        font-size: 10.5px;
        padding: 5px 10px;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // -------------------------------------------------------------
  // 3. INJECT DOM CONTAINERS (APPY LAUNCHER & MODAL)
  // -------------------------------------------------------------
  const dovaWrap = document.createElement('div');
  dovaWrap.id = 'dova-widget-container';
  dovaWrap.setAttribute('role', 'button');
  dovaWrap.setAttribute('aria-label', 'Open APPY Orchard Assistant');
  dovaWrap.innerHTML = `
    <div class="apple-bot-avatar-btn" id="apple-bot-trigger">
      <img src="./images/apple-ai-mascot.svg" alt="APPY Mascot" class="apple-bot-img" />
      <span class="apple-bot-online-dot"></span>
    </div>
    <div class="dova-badge-pill">
      <span class="dova-status-dot"></span>
      <span class="dova-name-text">APPY</span>
    </div>
    <div class="apple-bot-speech-bubble" id="apple-bot-speech-bubble">
      <span>Ask APPY &bull; Orchard Guide</span>
    </div>
  `;
  document.body.appendChild(dovaWrap);

  // Auto-dismiss floating bubble after 6 seconds or on click
  setTimeout(() => {
    const bubble = document.getElementById('apple-bot-speech-bubble');
    if (bubble) bubble.style.opacity = '0';
    setTimeout(() => { if (bubble) bubble.style.display = 'none'; }, 300);
  }, 6000);

  // Modal Container
  const chatBox = document.createElement('div');
  chatBox.id = 'agy-chat-box';
  chatBox.innerHTML = `
    <div class="agy-header">
      <div class="agy-header-left">
        <div class="appy-avatar-glow">
          <img src="./images/apple-ai-mascot.svg" alt="APPY" />
        </div>
        <div class="agy-header-title">
          <h4 class="appy-hdr-name">APPY</h4>
          <span class="appy-hdr-sub">Kotkhai Orchards Concierge</span>
        </div>
      </div>
      <div class="agy-header-actions">
        <a href="tel:+918580861606" class="agy-hdr-btn" id="btn-agy-call" title="Call Us Direct (+91 8580861606)" aria-label="Direct Phone Call">
          ${ICONS.phone}
        </a>
        <button type="button" class="agy-hdr-btn" id="btn-agy-menu" title="All Topics">
          ${ICONS.grid}
        </button>
        <button type="button" class="agy-hdr-btn" id="btn-agy-close" title="Close APPY">
          ${ICONS.close}
        </button>
      </div>
    </div>

    <div class="agy-messages" id="agy-messages"></div>

    <div class="appy-dock">
      <button type="button" class="appy-dock-btn menu-btn" id="dock-all-topics" title="All Topics">
        ${ICONS.grid}
        <span>Topics</span>
      </button>
      <a href="https://wa.me/918580861606?text=Hi%20Prajwal%2C%20I%20have%20an%20inquiry%20about%20Shimla%20Crunch%20orchard%20products." target="_blank" rel="noopener noreferrer" class="appy-dock-btn wa-btn" title="Direct WhatsApp Inquiry">
        ${ICONS.whatsapp}
        <span>Inquiry</span>
      </a>
      <button type="button" class="appy-dock-btn promo-btn" id="dock-promo-btn" title="Get Flat 20% OFF Coupon">
        ${ICONS.tag}
        <span>20% OFF</span>
      </button>
    </div>
  `;
  document.body.appendChild(chatBox);

  // -------------------------------------------------------------
  // 4. APPY TOPICS & STRUCTURED RESPONSES ENGINE (ZERO EMOJIS)
  // -------------------------------------------------------------
  let isChatOpen = false;

  function toggleChat(forceOpen = null) {
    const box = document.getElementById('agy-chat-box');
    if (!box) return;
    const shouldOpen = forceOpen !== null ? forceOpen : !isChatOpen;

    if (shouldOpen) {
      box.classList.remove('agy-closing');
      box.classList.add('agy-open');
      isChatOpen = true;
      renderWelcomeView();

      // Dismiss greeting tooltip
      const bubble = document.getElementById('apple-bot-speech-bubble');
      if (bubble) bubble.style.display = 'none';
    } else {
      box.classList.add('agy-closing');
      setTimeout(() => {
        box.classList.remove('agy-open');
        box.classList.remove('agy-closing');
        isChatOpen = false;
      }, 180);
    }
  }

  window.openShimlaBot = () => toggleChat(true);
  window.closeShimlaBot = () => toggleChat(false);
  window.openAppyBot = () => toggleChat(true);
  window.closeAppyBot = () => toggleChat(false);

  function renderWelcomeView() {
    const stream = document.getElementById('agy-messages');
    if (!stream) return;
    stream.innerHTML = `
      <div class="appy-welcome-card">
        <div class="appy-welcome-banner">
          <div class="appy-mascot-badge">
            <img src="./images/apple-ai-mascot.svg" alt="APPY" />
          </div>
          <div>
            <h4 class="appy-welcome-title">Welcome to Shimla Crunch</h4>
            <p class="appy-welcome-sub">Directly connected to our 4th-generation Kotkhai family orchards. Select an inquiry below for instant details:</p>
          </div>
        </div>

        <div class="appy-menu-grid">
          <button type="button" class="appy-topic-tile" data-topic="fresh-apples">
            <div class="topic-tile-icon">${ICONS.apple}</div>
            <div class="topic-tile-info">
              <div class="topic-tile-title">Fresh Mountain Apples</div>
              <div class="topic-tile-desc">Royal Delicious &amp; Red Gala &bull; 0% Wax &bull; 15.5&deg; Brix</div>
            </div>
            <span class="topic-tile-arrow">${ICONS.chevronRight}</span>
          </button>

          <button type="button" class="appy-topic-tile featured" data-topic="discovery-box">
            <div class="topic-tile-icon">${ICONS.box}</div>
            <div class="topic-tile-info">
              <div class="topic-tile-title">The Discovery Taster Box (₹899)</div>
              <div class="topic-tile-desc">4-in-1 Sampler: Apples + Crisps + Walnuts + Honey</div>
            </div>
            <span class="topic-tile-arrow">${ICONS.chevronRight}</span>
          </button>

          <button type="button" class="appy-topic-tile" data-topic="apple-crunch">
            <div class="topic-tile-icon">${ICONS.spark}</div>
            <div class="topic-tile-info">
              <div class="topic-tile-title">Apple Crunch Crisps</div>
              <div class="topic-tile-desc">100% Dehydrated Rings &bull; 0 Oil &bull; 0 Sugar</div>
            </div>
            <span class="topic-tile-arrow">${ICONS.chevronRight}</span>
          </button>

          <button type="button" class="appy-topic-tile" data-topic="walnuts-honey">
            <div class="topic-tile-icon">${ICONS.walnut}</div>
            <div class="topic-tile-info">
              <div class="topic-tile-title">Kagzi Walnuts &amp; Raw Honey</div>
              <div class="topic-tile-desc">Thin-Shelled Mountain Walnuts &bull; Blossom Nectar</div>
            </div>
            <span class="topic-tile-arrow">${ICONS.chevronRight}</span>
          </button>

          <button type="button" class="appy-topic-tile" data-topic="shipping-delivery">
            <div class="topic-tile-icon">${ICONS.truck}</div>
            <div class="topic-tile-info">
              <div class="topic-tile-title">Packing &amp; Pan-India Express</div>
              <div class="topic-tile-desc">Honeycomb Shock Armor &bull; 3&ndash;5 Days Delivery</div>
            </div>
            <span class="topic-tile-arrow">${ICONS.chevronRight}</span>
          </button>

          <button type="button" class="appy-topic-tile" data-topic="faqs-trust">
            <div class="topic-tile-icon">${ICONS.shield}</div>
            <div class="topic-tile-info">
              <div class="topic-tile-title">Why Shimla Crunch? (FAQs)</div>
              <div class="topic-tile-desc">Zero Artificial Wax &bull; FSSAI Certified &bull; 20% Promo</div>
            </div>
            <span class="topic-tile-arrow">${ICONS.chevronRight}</span>
          </button>
        </div>
      </div>
    `;

    bindTopicTiles();
    stream.scrollTop = 0;
  }

  function bindTopicTiles() {
    const stream = document.getElementById('agy-messages');
    if (!stream) return;
    stream.querySelectorAll('.appy-topic-tile').forEach(tile => {
      tile.onclick = () => {
        const topic = tile.getAttribute('data-topic');
        const title = tile.querySelector('.topic-tile-title') ? tile.querySelector('.topic-tile-title').innerText : topic;
        selectTopic(topic, title);
      };
    });
  }

  window.appySelectTopic = (topicKey) => {
    if (topicKey === 'main-menu') {
      renderWelcomeView();
    } else {
      selectTopic(topicKey);
    }
  };

  function selectTopic(topicKey, displayTitle = '') {
    const stream = document.getElementById('agy-messages');
    if (!stream) return;

    // User selection chip
    const userMsg = document.createElement('div');
    userMsg.className = 'agy-msg user';
    userMsg.innerHTML = `${ICONS.leaf} <span>${displayTitle || getTopicTitle(topicKey)}</span>`;
    stream.appendChild(userMsg);

    // Bot response after slight natural delay
    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.className = 'agy-msg bot';
      botMsg.innerHTML = getTopicResponseHtml(topicKey);
      stream.appendChild(botMsg);
      stream.scrollTop = stream.scrollHeight;
    }, 180);
  }

  function getTopicTitle(key) {
    switch (key) {
      case 'fresh-apples': return 'Fresh Mountain Apples';
      case 'discovery-box': return 'The Discovery Taster Box (₹899)';
      case 'promo-20': return 'Flat 20% OFF (CRUNCH20)';
      case 'apple-crunch': return 'Apple Crunch Crisps';
      case 'walnuts-honey': return 'Kagzi Walnuts & Raw Honey';
      case 'shipping-delivery': return 'Packing & Pan-India Express';
      case 'faqs-trust': return 'Why Shimla Crunch? (FAQs)';
      default: return 'Inquiry';
    }
  }

  function getTopicResponseHtml(key) {
    switch (key) {
      case 'fresh-apples':
        return `
          <div class="appy-response-wrap">
            <div class="appy-topic-header">
              <span class="appy-topic-badge">${ICONS.mountain} HIMALAYAN ORCHARD APPLES</span>
              <h5 class="appy-topic-heading">Tree-Ripened &amp; Freshly Plucked</h5>
              <p class="appy-topic-sub">Harvested at 8,200 ft under Hatu Peak in Kalbog-Baghi, Kotkhai:</p>
            </div>
            <div class="appy-boxes-list">
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.apple}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">Royal Delicious (from ₹549 / 5kg)</div>
                  <div class="appy-card-desc">Deep crimson blush skin, rich floral sweetness with natural 15.5&deg; Brix mountain fructose, and our signature auditory crunch snap.</div>
                </div>
              </div>
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.apple}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">Red Gala (from ₹599 / 5kg)</div>
                  <div class="appy-card-desc">Striped European rootstock variety with delicate skin, high juice content, and a crisp, refreshing sweet-tart balance.</div>
                </div>
              </div>
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.shield}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">100% Zero Artificial Wax</div>
                  <div class="appy-card-desc">Never polished with shellac or petroleum wax. Wash under tap water and consume unpeeled with complete peace of mind.</div>
                </div>
              </div>
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.box}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">Honeycomb Cellular Protection</div>
                  <div class="appy-card-desc">Individual shock-socket cellular trays inside heavy 5-ply cartons ensure zero bruising during express transit.</div>
                </div>
              </div>
            </div>
            <div class="appy-action-row">
              <a href="product.html?id=royal-apples" class="appy-btn appy-btn-green">${ICONS.apple} Royal Delicious</a>
              <a href="product.html?id=gala-apples" class="appy-btn appy-btn-green">${ICONS.apple} Red Gala</a>
              <button type="button" class="appy-btn appy-btn-glass" onclick="window.appySelectTopic('main-menu')">${ICONS.arrowLeft} All Inquiries</button>
            </div>
          </div>
        `;

      case 'discovery-box':
        return `
          <div class="appy-response-wrap">
            <div class="appy-topic-header">
              <span class="appy-topic-badge">${ICONS.cert} #1 TASTER PICK</span>
              <h5 class="appy-topic-heading">The Discovery Taster Box (₹899)</h5>
              <p class="appy-topic-sub">The complete Kotkhai harvest experience in a single cushioned box (Regular ₹1,250):</p>
            </div>
            <div class="appy-boxes-list">
              <div class="appy-card-box highlight">
                <div class="appy-card-icon">${ICONS.apple}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">2kg Fresh Mountain Apples</div>
                  <div class="appy-card-desc">1kg Royal Delicious + 1kg Red Gala freshly harvested from high-altitude Kotkhai trees.</div>
                </div>
              </div>
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.spark}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">100g Apple Crunch Crisps</div>
                  <div class="appy-card-desc">100% dehydrated apple rings with zero oil, zero preservatives, and zero added sugar.</div>
                </div>
              </div>
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.walnut}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">100g Kagzi Mountain Walnuts</div>
                  <div class="appy-card-desc">Thin-shelled mountain walnuts easily crackable by hand, rich in natural oils and fresh crunch.</div>
                </div>
              </div>
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.honey}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">100g Raw Apple Blossom Honey</div>
                  <div class="appy-card-desc">Cold-extracted unheated nectar gathered by bees during high-altitude spring apple bloom.</div>
                </div>
              </div>
            </div>
            <div class="appy-action-row">
              <a href="product.html?id=discovery-box" class="appy-btn appy-btn-gold">${ICONS.box} View Discovery Box (₹899)</a>
              <button type="button" class="appy-btn appy-btn-glass" onclick="window.appySelectTopic('main-menu')">${ICONS.arrowLeft} All Inquiries</button>
            </div>
          </div>
        `;

      case 'apple-crunch':
        return `
          <div class="appy-response-wrap">
            <div class="appy-topic-header">
              <span class="appy-topic-badge">${ICONS.spark} HEALTHY INNOVATION</span>
              <h5 class="appy-topic-heading">Signature Apple Crunch Crisps</h5>
              <p class="appy-topic-sub">Pure fruit snacking innovation made exclusively from Shimla Royal apples:</p>
            </div>
            <div class="appy-boxes-list">
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.leaf}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">Single Ingredient &bull; 100% Apples</div>
                  <div class="appy-card-desc">Zero palm oil, zero deep frying, zero added sugar, and zero artificial sulfur. Just 100% pure fruit.</div>
                </div>
              </div>
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.spark}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">Auditory Mountain Crunch</div>
                  <div class="appy-card-desc">Low-temperature dehydration locks in natural dietary fiber, apple pectin, and fresh orchard aroma.</div>
                </div>
              </div>
              <div class="appy-card-box highlight">
                <div class="appy-card-icon">${ICONS.tag}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">Available Pack Sizes</div>
                  <div class="appy-card-desc">100g Pouch: ₹199 | 250g Family Pack: ₹449 | 500g Mega Box: ₹799.</div>
                </div>
              </div>
            </div>
            <div class="appy-action-row">
              <a href="product.html?id=apple-crunch" class="appy-btn appy-btn-gold">${ICONS.spark} Shop Apple Crunch</a>
              <button type="button" class="appy-btn appy-btn-glass" onclick="window.appySelectTopic('main-menu')">${ICONS.arrowLeft} All Inquiries</button>
            </div>
          </div>
        `;

      case 'walnuts-honey':
        return `
          <div class="appy-response-wrap">
            <div class="appy-topic-header">
              <span class="appy-topic-badge">${ICONS.mountain} HIGH-ALTITUDE PANTRY</span>
              <h5 class="appy-topic-heading">Kagzi Walnuts &amp; Raw Blossom Honey</h5>
              <p class="appy-topic-sub">Harvested straight from our ancestral groves in Kotkhai:</p>
            </div>
            <div class="appy-boxes-list">
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.walnut}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">Kagzi Soft-Shell Walnuts (₹599 / 500g)</div>
                  <div class="appy-card-desc">Ultra-thin shell easily cracked with bare palms. Plump, light-amber kernels loaded with natural Omega-3.</div>
                </div>
              </div>
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.honey}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">Apple Blossom Raw Honey (₹449 / 500g)</div>
                  <div class="appy-card-desc">Unpasteurized, cold-extracted mountain honey with active pollen enzymes and rich amber color.</div>
                </div>
              </div>
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.shield}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">100% Purity &amp; Zero Adulteration</div>
                  <div class="appy-card-desc">Zero sugar syrup blending, zero artificial heating, and zero chemical bleaching. Certified lab pure.</div>
                </div>
              </div>
            </div>
            <div class="appy-action-row">
              <a href="product.html?id=walnuts" class="appy-btn appy-btn-green">${ICONS.walnut} Kagzi Walnuts</a>
              <a href="product.html?id=honey" class="appy-btn appy-btn-gold">${ICONS.honey} Raw Honey</a>
              <button type="button" class="appy-btn appy-btn-glass" onclick="window.appySelectTopic('main-menu')">${ICONS.arrowLeft} All Inquiries</button>
            </div>
          </div>
        `;

      case 'shipping-delivery':
        return `
          <div class="appy-response-wrap">
            <div class="appy-topic-header">
              <span class="appy-topic-badge">${ICONS.truck} PAN-INDIA LOGISTICS</span>
              <h5 class="appy-topic-heading">Express Courier &amp; Transit Armor</h5>
              <p class="appy-topic-sub">Direct courier dispatch within hours of orchard harvest:</p>
            </div>
            <div class="appy-boxes-list">
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.box}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">5-Ply Honeycomb Armor</div>
                  <div class="appy-card-desc">Custom shock-socket cellular trays guarantee 99.4% damage-free delivery to your doorstep.</div>
                </div>
              </div>
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.truck}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">3 to 5 Days Pan-India Express</div>
                  <div class="appy-card-desc">Dispatched via BlueDart &amp; Delhivery Express to 19,000+ PIN codes across all Indian states.</div>
                </div>
              </div>
              <div class="appy-card-box highlight">
                <div class="appy-card-icon">${ICONS.shield}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">100% Free Transit Replacement</div>
                  <div class="appy-card-desc">If courier transit ever damages your box, we dispatch an immediate replacement at zero additional charge.</div>
                </div>
              </div>
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.whatsapp}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">WhatsApp Live Tracking</div>
                  <div class="appy-card-desc">Real-time courier dispatch alert and live tracking link sent directly to your WhatsApp.</div>
                </div>
              </div>
            </div>
            <div class="appy-action-row">
              <a href="https://wa.me/918580861606?text=Hi%20Prajwal%2C%20please%20check%20shipping%20time%20for%20my%20PIN%20code" target="_blank" rel="noopener noreferrer" class="appy-btn appy-btn-green">${ICONS.truck} Check My PIN Code</a>
              <button type="button" class="appy-btn appy-btn-glass" onclick="window.appySelectTopic('main-menu')">${ICONS.arrowLeft} All Inquiries</button>
            </div>
          </div>
        `;

      case 'promo-20':
        return `
          <div class="appy-response-wrap">
            <div class="appy-topic-header">
              <span class="appy-topic-badge">${ICONS.tag} 20% OFF ACTIVATED</span>
              <h5 class="appy-topic-heading">Coupon CRUNCH20 Applied!</h5>
              <p class="appy-topic-sub">You get an instant flat 20% discount on all fresh harvest orders above ₹1,500:</p>
            </div>
            <div class="appy-boxes-list">
              <div class="appy-card-box highlight">
                <div class="appy-card-icon">${ICONS.tag}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">Code: CRUNCH20 (Active in Bag)</div>
                  <div class="appy-card-desc">Automatically calculates 20% savings on your bag subtotal when it reaches ₹1,500.</div>
                </div>
              </div>
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.box}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">Recommended: Discovery Box (₹899)</div>
                  <div class="appy-card-desc">Pair our Discovery Taster Box with Kagzi Walnuts or Raw Blossom Honey to easily reach ₹1,500 and save 20%!</div>
                </div>
              </div>
            </div>
            <div class="appy-action-row">
              <button type="button" class="appy-btn appy-btn-gold" onclick="window.openCart ? window.openCart() : document.getElementById('cart-drawer')?.classList.add('active')">${ICONS.box} View Bag &amp; Savings</button>
              <a href="shop.html" class="appy-btn appy-btn-green">${ICONS.apple} Shop All Harvest</a>
              <button type="button" class="appy-btn appy-btn-glass" onclick="window.appySelectTopic('main-menu')">${ICONS.arrowLeft} All Inquiries</button>
            </div>
          </div>
        `;

      case 'faqs-trust':
      default:
        return `
          <div class="appy-response-wrap">
            <div class="appy-topic-header">
              <span class="appy-topic-badge">${ICONS.cert} ORCHARD TRANSPARENCY</span>
              <h5 class="appy-topic-heading">Why Shimla Crunch? (FAQs)</h5>
              <p class="appy-topic-sub">Everything you need to know about our natural Kotkhai harvest:</p>
            </div>
            <div class="appy-boxes-list">
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.shield}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">Zero Artificial Wax Guarantee</div>
                  <div class="appy-card-desc">We never coat or polish fruit with shellac. Wash under tap water and bite straight in with peel intact.</div>
                </div>
              </div>
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.mountain}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">Why High Altitude Hits Different</div>
                  <div class="appy-card-desc">7,500+ ft elevation and freezing nights naturally concentrate 15.5&deg; Brix fructose sweetness and dense crunch.</div>
                </div>
              </div>
              <div class="appy-card-box">
                <div class="appy-card-icon">${ICONS.cert}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">Government Registered &amp; Certified</div>
                  <div class="appy-card-desc">FSSAI #20924009001289 &amp; UDYAM-HP-09-0019824 certified 4th-generation mountain farm.</div>
                </div>
              </div>
              <div class="appy-card-box highlight">
                <div class="appy-card-icon">${ICONS.tag}</div>
                <div class="appy-card-body">
                  <div class="appy-card-title">Flat 20% Off Coupon</div>
                  <div class="appy-card-desc">Apply coupon <b>CRUNCH20</b> on all cart orders above ₹1,500 for an instant 20% discount.</div>
                </div>
              </div>
            </div>
            <div class="appy-action-row">
              <button type="button" class="appy-btn appy-btn-gold" onclick="window.appyApplyPromo20 ? window.appyApplyPromo20() : (window.applyCartPromo && window.applyCartPromo('CRUNCH20'))">${ICONS.tag} Apply 20% OFF (CRUNCH20)</button>
              <a href="about.html" class="appy-btn appy-btn-green">${ICONS.mountain} Read Our Story</a>
              <button type="button" class="appy-btn appy-btn-glass" onclick="window.appySelectTopic('main-menu')">${ICONS.arrowLeft} All Inquiries</button>
            </div>
          </div>
        `;
    }
  }

  // -------------------------------------------------------------
  // 5. DRAGGABLE / MOVABLE APPY LOGIC (POINTER EVENTS)
  // -------------------------------------------------------------
  function setupDraggable() {
    const launcher = document.getElementById('dova-widget-container');
    if (!launcher) return;

    let isDragging = false;
    let hasMoved = false;
    let startX = 0, startY = 0;
    let initialX = 0, initialY = 0;

    // Restore saved position if available
    try {
      const savedX = localStorage.getItem('shimla_appy_x');
      const savedY = localStorage.getItem('shimla_appy_y');
      if (savedX !== null && savedY !== null) {
        const x = Math.max(10, Math.min(window.innerWidth - 75, parseInt(savedX, 10)));
        const y = Math.max(10, Math.min(window.innerHeight - 85, parseInt(savedY, 10)));
        launcher.style.left = `${x}px`;
        launcher.style.top = `${y}px`;
        launcher.style.right = 'auto';
        launcher.style.bottom = 'auto';
      }
    } catch (e) {}

    function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      isDragging = true;
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;

      const rect = launcher.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;

      launcher.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!hasMoved && Math.hypot(dx, dy) > 5) {
        hasMoved = true;
        launcher.classList.add('appy-is-dragging');
        // Dismiss bubble immediately on drag
        const bubble = document.getElementById('apple-bot-speech-bubble');
        if (bubble) bubble.style.display = 'none';
      }

      if (hasMoved) {
        const rect = launcher.getBoundingClientRect();
        const width = rect.width || 64;
        const height = rect.height || 78;

        let newX = initialX + dx;
        let newY = initialY + dy;

        newX = Math.max(10, Math.min(window.innerWidth - width - 10, newX));
        newY = Math.max(10, Math.min(window.innerHeight - height - 10, newY));

        launcher.style.left = `${newX}px`;
        launcher.style.top = `${newY}px`;
        launcher.style.right = 'auto';
        launcher.style.bottom = 'auto';
      }
    }

    function onPointerUp(e) {
      if (!isDragging) return;
      isDragging = false;
      launcher.classList.remove('appy-is-dragging');

      try {
        launcher.releasePointerCapture(e.pointerId);
      } catch (err) {}

      if (hasMoved) {
        // Save dragged position
        try {
          const rect = launcher.getBoundingClientRect();
          localStorage.setItem('shimla_appy_x', Math.round(rect.left));
          localStorage.setItem('shimla_appy_y', Math.round(rect.top));
        } catch (err) {}
      } else {
        // Clean tap/click -> toggle chat drawer!
        toggleChat();
      }
    }

    launcher.addEventListener('pointerdown', onPointerDown);
    launcher.addEventListener('pointermove', onPointerMove);
    launcher.addEventListener('pointerup', onPointerUp);
    launcher.addEventListener('pointercancel', onPointerUp);

    // Reposition safely on window resize
    window.addEventListener('resize', () => {
      const rect = launcher.getBoundingClientRect();
      const width = rect.width || 64;
      const height = rect.height || 78;
      let curX = rect.left;
      let curY = rect.top;

      let clampedX = Math.max(10, Math.min(window.innerWidth - width - 10, curX));
      let clampedY = Math.max(10, Math.min(window.innerHeight - height - 10, curY));

      if (clampedX !== curX || clampedY !== curY) {
        launcher.style.left = `${clampedX}px`;
        launcher.style.top = `${clampedY}px`;
        launcher.style.right = 'auto';
        launcher.style.bottom = 'auto';
      }
    });
  }

  // -------------------------------------------------------------
  // 6. EVENT LISTENERS & ACTION DOCK SETUP
  // -------------------------------------------------------------
  function showAppyToast(msg) {
    let toast = document.getElementById('appy-toast-pill');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appy-toast-pill';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = 'appy-toast-visible';
    clearTimeout(window.__appyToastTimer);
    window.__appyToastTimer = setTimeout(() => {
      toast.className = '';
    }, 3500);
  }
  window.showAppyToast = showAppyToast;

  function handlePromoClick() {
    if (typeof window.applyCartPromo === 'function') {
      window.applyCartPromo('CRUNCH20');
    } else {
      try { localStorage.setItem('shimla_promo_code', 'CRUNCH20'); } catch (e) {}
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('CRUNCH20').catch(() => {});
      }
    } catch (e) {}

    // If chat is open, display promo topic in stream
    if (isChatOpen) {
      selectTopic('promo-20', 'Flat 20% OFF (CRUNCH20)');
    } else {
      if (typeof window.openCart === 'function') {
        window.openCart();
      }
    }
    showAppyToast('🎉 Coupon CRUNCH20 Applied! 20% OFF on orders above ₹1,500');
  }
  window.appyApplyPromo20 = handlePromoClick;

  function setupEvents() {
    setupDraggable();

    const closeBtn = document.getElementById('btn-agy-close');
    if (closeBtn) closeBtn.addEventListener('click', () => toggleChat(false));

    const menuHdrBtn = document.getElementById('btn-agy-menu');
    if (menuHdrBtn) menuHdrBtn.addEventListener('click', () => renderWelcomeView());

    const dockMenuBtn = document.getElementById('dock-all-topics');
    if (dockMenuBtn) dockMenuBtn.addEventListener('click', () => renderWelcomeView());

    const promoBtn = document.getElementById('dock-promo-btn');
    if (promoBtn) {
      promoBtn.addEventListener('click', handlePromoClick);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEvents);
  } else {
    setupEvents();
  }
})();
