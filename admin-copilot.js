/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SHIMLA WALI ADMIN STUDIO CO-PILOT (3D Interactive Assistant)
 * ═══════════════════════════════════════════════════════════════════════════
 * Embedded at bottom-right of admin.html.
 * Ultra-minimal screen footprint with interactive 3D robot character.
 * Deterministic local store controller:
 *  - Change Price & MRP across variants live
 *  - Manual Stock Reserve / Hold (for offline / VIP clients without web orders)
 *  - Release Reserved Stock Hold back to free website stock
 *  - Quick Physical Stock Adjust (+/-) with mandatory audit reason
 *  - Hide / Show Products on Storefront
 *  - Instant Studio Health Snapshot & Low Stock Alerts
 *  - Natural command recognition & quick action chips
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  if (window.__ADMIN_COPILOT_INITIALIZED__) return;
  window.__ADMIN_COPILOT_INITIALIZED__ = true;

  // -------------------------------------------------------------
  // 1. INJECT STYLES (Admin Studio Theme: Dark Slate / Emerald / Cyan / Gold)
  // -------------------------------------------------------------
  const styleEl = document.createElement('style');
  styleEl.id = 'admin-copilot-styles';
  styleEl.textContent = `
    /* =============================================================
       1. 3D FLOATING ROBOT CONTAINER (MOVABLE)
       ============================================================= */
    #admin-copilot-container {
      position: fixed;
      bottom: 18px;
      right: 20px;
      width: 92px;
      height: 112px;
      z-index: 999980;
      user-select: none;
      touch-action: none;
      cursor: grab;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      pointer-events: auto;
    }
    #admin-copilot-container.copilot-dragging {
      cursor: grabbing !important;
      transform: scale(1.06) !important;
      transition: none !important;
    }
    #admin-copilot-container:not(.copilot-dragging) {
      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    #admin-copilot-container:not(.copilot-dragging):hover {
      transform: translateY(-2px);
    }

    #admin-copilot-canvas {
      width: 92px;
      height: 94px;
      display: block;
      pointer-events: auto;
    }

    .copilot-badge-pill {
      margin-top: -4px;
      display: inline-flex;
      align-items: center;
      gap: 5.5px;
      padding: 3px 9px;
      background: rgba(15, 23, 42, 0.94);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 999px;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
      pointer-events: none;
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    }
    #admin-copilot-container:hover .copilot-badge-pill {
      border-color: #38bdf8;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
      transform: translateY(-1px);
    }
    .copilot-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #38bdf8;
      animation: copilotPulse 2.2s infinite ease-in-out;
    }
    @keyframes copilotPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
    .copilot-name-text {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: #38bdf8;
      text-transform: uppercase;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* =============================================================
       2. DOVA AI DRAWER - NIGHT THEME (LIGHT MODE BY DEFAULT)
       ============================================================= */
    #admin-copilot-drawer {
      position: fixed;
      bottom: 22px;
      right: 22px;
      width: 410px;
      max-width: calc(100vw - 32px);
      height: 600px;
      max-height: calc(100vh - 40px);
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.35), 0 8px 20px -4px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(20px);
      display: flex;
      flex-direction: column;
      z-index: 999985;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      transform: translateY(20px) scale(0.96);
      opacity: 0;
      pointer-events: none;
      transition: width 0.24s cubic-bezier(0.16, 1, 0.3, 1), height 0.24s cubic-bezier(0.16, 1, 0.3, 1), transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease-out;
    }
    #admin-copilot-drawer.copilot-open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: auto;
    }
    #admin-copilot-drawer.copilot-closing {
      transform: translateY(16px) scale(0.97);
      opacity: 0;
      pointer-events: none;
    }

    /* Expand / Resize to Large Modal */
    #admin-copilot-drawer.copilot-expanded {
      width: 760px;
      max-width: calc(100vw - 32px);
      height: 84vh;
      max-height: 860px;
    }
    #admin-copilot-drawer.copilot-expanded .copilot-stat-grid {
      grid-template-columns: repeat(4, 1fr);
    }
    #admin-copilot-drawer.copilot-expanded .copilot-prod-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    /* Drawer Header */
    .copilot-header {
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-shrink: 0;
    }
    .copilot-brand-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .copilot-avatar-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
    }
    .copilot-title-group h4 {
      margin: 0;
      font-size: 13.5px;
      font-weight: 700;
      letter-spacing: -0.2px;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .copilot-title-group p {
      margin: 2px 0 0 0;
      font-size: 10.5px;
      color: #64748b;
    }
    .copilot-header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .copilot-icon-btn {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.18s, color 0.18s, transform 0.15s;
    }
    .copilot-icon-btn:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
      color: #0f172a;
      transform: scale(1.05);
    }

    /* Quick Action Chips Bar */
    .copilot-chips-bar {
      padding: 8px 12px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      flex-shrink: 0;
    }
    .copilot-chip {
      padding: 5px 10px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.18s;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .copilot-chip:hover {
      background: #f1f5f9;
      border-color: #0284c7;
      color: #0284c7;
      transform: translateY(-1px);
    }
    .copilot-chip.active {
      background: #0284c7;
      border-color: #0284c7;
      color: #ffffff;
    }
    .copilot-chip svg {
      flex-shrink: 0;
    }

    /* Message Stream */
    .copilot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px 14px 20px 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
      background: #f8fafc;
    }

    /* Message Bubbles */
    .copilot-msg {
      max-width: 95%;
      border-radius: 12px;
      padding: 10px 13px;
      font-size: 12.5px;
      line-height: 1.48;
      word-break: break-word;
      animation: copilotFadeIn 0.2s ease-out;
    }
    @keyframes copilotFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .copilot-msg.bot {
      align-self: flex-start;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #1e293b;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .copilot-msg.user {
      align-self: flex-end;
      background: #0284c7;
      color: #ffffff;
      border-bottom-right-radius: 3px;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
    }

    /* Interactive Action Cards */
    .copilot-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 11px 12px;
      margin-top: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    }
    .copilot-card-title {
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0284c7;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Action Form Inputs inside Card */
    .copilot-field {
      margin-bottom: 8px;
    }
    .copilot-field label {
      display: block;
      font-size: 10.5px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 3px;
    }
    .copilot-input, .copilot-select {
      width: 100%;
      box-sizing: border-box;
      padding: 6px 10px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 12px;
      color: #0f172a;
      outline: none;
      font-family: inherit;
      transition: border-color 0.18s;
    }
    .copilot-input:focus, .copilot-select:focus {
      border-color: #0284c7;
    }

    /* Action Buttons inside Card */
    .copilot-btn-row {
      display: flex;
      gap: 6px;
      margin-top: 10px;
    }
    .copilot-btn {
      flex: 1;
      padding: 7px 12px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      transition: all 0.18s;
      border: none;
      outline: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
    .copilot-btn.primary {
      background: #10b981;
      color: #ffffff;
    }
    .copilot-btn.primary:hover {
      background: #059669;
      transform: translateY(-1px);
    }
    .copilot-btn.accent {
      background: #0284c7;
      color: #ffffff;
    }
    .copilot-btn.accent:hover {
      background: #0369a1;
      transform: translateY(-1px);
    }
    .copilot-btn.secondary {
      background: #ffffff;
      color: #334155;
      border: 1px solid #cbd5e1;
    }
    .copilot-btn.secondary:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #94a3b8;
    }

    /* Product mini grid */
    .copilot-prod-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-top: 6px;
    }
    .copilot-prod-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 7px 9px;
      cursor: pointer;
      transition: all 0.18s;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .copilot-prod-card:hover {
      border-color: #0284c7;
      background: #f0f9ff;
      transform: translateY(-1px);
    }
    .copilot-prod-title {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .copilot-prod-price {
      font-size: 10.5px;
      font-weight: 600;
      color: #10b981;
    }

    /* Live Stat Grid inside health snapshot */
    .copilot-stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin: 8px 0;
    }
    .copilot-stat-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    .copilot-stat-val {
      font-size: 16px;
      font-weight: 800;
      color: #0284c7;
    }
    .copilot-stat-val.gold { color: #d97706; }
    .copilot-stat-val.emerald { color: #059669; }
    .copilot-stat-val.rose { color: #e11d48; }
    .copilot-stat-lbl {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* Input Footer */
    .copilot-footer {
      padding: 10px 12px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
      align-items: center;
      flex-shrink: 0;
    }
    .copilot-footer-input {
      flex: 1;
      padding: 8px 12px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      font-size: 12px;
      color: #0f172a;
      outline: none;
      font-family: inherit;
    }
    .copilot-footer-input:focus {
      border-color: #0284c7;
      box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
    }
    .copilot-send-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #0284c7;
      border: none;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.18s;
    }
    .copilot-send-btn:hover {
      background: #0369a1;
      transform: scale(1.06);
    }

    /* Storefront visibility indicators */
    .copilot-vis-indicator {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      margin-right: 4px;
      vertical-align: middle;
    }
    .copilot-vis-indicator.live {
      background: #10b981;
    }
    .copilot-vis-indicator.hidden {
      background: #f43f5e;
    }

    /* =============================================================
       3. DAY THEME OVERRIDE (ADMIN IS LIGHT -> DOVA IS DARK)
       ============================================================= */
    [data-theme="light"] #admin-copilot-drawer {
      background: #0b1329;
      border: 1.5px solid #1e293b;
      box-shadow: 0 24px 54px -12px rgba(0, 0, 0, 0.5), 0 8px 20px -4px rgba(0, 0, 0, 0.25);
      color: #f8fafc;
    }
    [data-theme="light"] .copilot-header {
      background: #0f172a;
      border-bottom-color: #1e293b;
    }
    [data-theme="light"] .copilot-title-group h4 {
      color: #f8fafc;
    }
    [data-theme="light"] .copilot-title-group p {
      color: #94a3b8;
    }
    [data-theme="light"] .copilot-icon-btn {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
    }
    [data-theme="light"] .copilot-icon-btn:hover {
      background: rgba(56, 189, 248, 0.2);
      border-color: #38bdf8;
      color: #ffffff;
    }
    [data-theme="light"] .copilot-chips-bar {
      background: #0b1329;
      border-bottom-color: #1e293b;
    }
    [data-theme="light"] .copilot-chip {
      background: #131f37;
      border-color: #334155;
      color: #e2e8f0;
    }
    [data-theme="light"] .copilot-chip:hover {
      background: rgba(56, 189, 248, 0.15);
      border-color: #38bdf8;
      color: #38bdf8;
    }
    [data-theme="light"] .copilot-chip.active {
      background: #0284c7;
      border-color: #38bdf8;
      color: #ffffff;
    }
    [data-theme="light"] .copilot-messages {
      background: #070d1e;
      scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
    }
    [data-theme="light"] .copilot-msg.bot {
      background: #111c33;
      border-color: #1e293b;
      color: #f1f5f9;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    }
    [data-theme="light"] .copilot-card {
      background: #0c1527;
      border-color: #1e293b;
      box-shadow: none;
    }
    [data-theme="light"] .copilot-card-title {
      color: #38bdf8;
    }
    [data-theme="light"] .copilot-field label {
      color: #cbd5e1;
    }
    [data-theme="light"] .copilot-input,
    [data-theme="light"] .copilot-select {
      background: #131f37;
      border-color: #334155;
      color: #f8fafc;
    }
    [data-theme="light"] .copilot-btn.secondary {
      background: #1e293b;
      color: #f8fafc;
      border-color: #334155;
    }
    [data-theme="light"] .copilot-btn.secondary:hover {
      background: rgba(56, 189, 248, 0.2);
      border-color: #38bdf8;
      color: #38bdf8;
    }
    [data-theme="light"] .copilot-prod-card {
      background: #131f37;
      border-color: #1e293b;
    }
    [data-theme="light"] .copilot-prod-title {
      color: #ffffff;
    }
    [data-theme="light"] .copilot-stat-box {
      background: #131f37;
      border-color: #1e293b;
      box-shadow: none;
    }
    [data-theme="light"] .copilot-stat-val {
      color: #38bdf8;
    }
    [data-theme="light"] .copilot-stat-val.gold { color: #f59e0b; }
    [data-theme="light"] .copilot-stat-val.emerald { color: #10b981; }
    [data-theme="light"] .copilot-stat-val.rose { color: #f43f5e; }
    [data-theme="light"] .copilot-stat-lbl {
      color: #cbd5e1;
    }
    [data-theme="light"] .copilot-footer {
      background: #0f172a;
      border-top-color: #1e293b;
    }
    [data-theme="light"] .copilot-footer-input {
      background: #131f37;
      border-color: #334155;
      color: #ffffff;
    }
    [data-theme="light"] .copilot-footer-input:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }
  `;
  document.head.appendChild(styleEl);

  // -------------------------------------------------------------
  // 2. INJECT 3D AVATAR CONTAINER & DRAWER HTML
  // -------------------------------------------------------------
  const container = document.createElement('div');
  container.id = 'admin-copilot-container';
  container.title = 'Click to open Admin Co-Pilot Assistant';
  container.innerHTML = `
    <canvas id="admin-copilot-canvas"></canvas>
    <div class="copilot-badge-pill">
      <span class="copilot-status-dot"></span>
      <span class="copilot-name-text">DOVA</span>
    </div>
  `;
  document.body.appendChild(container);

  const drawer = document.createElement('div');
  drawer.id = 'admin-copilot-drawer';
  drawer.innerHTML = `
    <div class="copilot-header">
      <div class="copilot-brand-wrap">
        <div class="copilot-avatar-circle" title="DOVA AI">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="3"></rect><circle cx="9" cy="16" r="1.5" fill="currentColor"></circle><circle cx="15" cy="16" r="1.5" fill="currentColor"></circle><path d="M12 2v4"></path><line x1="8" y1="2" x2="16" y2="2"></line></svg>
        </div>
        <div class="copilot-title-group">
          <h4>DOVA <span style="font-size:9.5px;padding:2px 6px;background:rgba(56,189,248,0.2);color:#38bdf8;border-radius:999px;border:1px solid rgba(56,189,248,0.4);font-weight:700;">AI</span></h4>
          <p>Store Execution Assistant • Live</p>
        </div>
      </div>
      <div class="copilot-header-actions">
        <button type="button" class="copilot-icon-btn" id="copilot-resize-btn" title="Expand / Resize Width" aria-label="Resize"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg></button>
        <button type="button" class="copilot-icon-btn" id="copilot-reset-btn" title="Reset Menu" aria-label="Reset"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>
        <button type="button" class="copilot-icon-btn" id="copilot-close-btn" title="Close" aria-label="Close"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
      </div>
    </div>

    <!-- Quick Action Chips -->
    <div class="copilot-chips-bar">
      <button type="button" class="copilot-chip" data-act="price">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><circle cx="7" cy="7" r="1.5"></circle></svg>
        <span>Price / MRP</span>
      </button>
      <button type="button" class="copilot-chip" data-act="hold">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        <span>Hold Stock</span>
      </button>
      <button type="button" class="copilot-chip" data-act="release">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
        <span>Release Hold</span>
      </button>
      <button type="button" class="copilot-chip" data-act="adjust">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span>Stock +/-</span>
      </button>
      <button type="button" class="copilot-chip" data-act="visibility">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        <span>Hide / Show</span>
      </button>
      <button type="button" class="copilot-chip" data-act="health">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
        <span>Health Report</span>
      </button>
    </div>

    <!-- Message Stream -->
    <div class="copilot-messages" id="copilot-messages"></div>

    <!-- Input Footer -->
    <div class="copilot-footer">
      <input type="text" class="copilot-footer-input" id="copilot-input" placeholder="Type action (e.g. 'reserve 10 ghee', 'health')..." />
      <button type="button" class="copilot-send-btn" id="copilot-send-btn" title="Send" aria-label="Send"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>
    </div>
  `;
  document.body.appendChild(drawer);

  // -------------------------------------------------------------
  // 3. LOAD THREE.JS & BUILD PROCEDURAL 3D ROBOT
  // -------------------------------------------------------------
  function loadThree(cb) {
    if (window.THREE) return cb();
    const s = document.createElement('script');
    s.src = './three.min.js';
    s.async = true;
    s.onload = () => cb();
    s.onerror = () => {
      const cdn = document.createElement('script');
      cdn.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      cdn.onload = () => cb();
      cdn.onerror = () => console.error('[Co-Pilot] Could not load Three.js');
      document.head.appendChild(cdn);
    };
    document.head.appendChild(s);
  }

  let triggerBotSpin = () => {};
  let triggerBotHappy = () => {};

  function init3D() {
    const canvas = document.getElementById('admin-copilot-canvas');
    if (!canvas || !window.THREE) return;

    const width = 92;
    const height = 94;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0.38, 9.8);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xfffaed, 1.35);
    sun.position.set(4, 6, 5);
    scene.add(sun);

    const rim = new THREE.SpotLight(0x0ea5e9, 2.2);
    rim.position.set(-5, 4, -4);
    scene.add(rim);

    // Helpers
    function createRoundedBox(w, h, d, radius, smoothness = 5) {
      const shape = new THREE.Shape();
      const eps = 0.00001;
      const r = radius - eps;
      shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
      shape.absarc(eps, h - r * 2, eps, Math.PI, Math.PI / 2, true);
      shape.absarc(w - r * 2, h - r * 2, eps, Math.PI / 2, 0, true);
      shape.absarc(w - r * 2, eps, eps, 0, -Math.PI / 2, true);

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: d - radius * 2,
        bevelEnabled: true,
        bevelSegments: smoothness * 2,
        steps: 1,
        bevelSize: r,
        bevelThickness: radius,
        curveSegments: smoothness
      });
      geo.center();
      return geo;
    }

    // Materials (DOVA Sleek Titanium & Electric Cyan AI Aesthetic)
    const cyberTitanium = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.18,
      metalness: 0.52,
      clearcoat: 0.95,
      clearcoatRoughness: 0.08
    });
    const electricCyan = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.7,
      clearcoat: 0.85
    });
    const screenGloss = new THREE.MeshPhysicalMaterial({
      color: 0x020617,
      roughness: 0.04,
      clearcoat: 1.0
    });
    const silverJoint = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.15,
      metalness: 0.92
    });
    const darkObsidian = cyberTitanium;
    const mountainGold = electricCyan;

    // Eye Textures
    function makeEyeTex(glow = '#10b981') {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 128;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(64, 64, 15, 64, 64, 62);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.55, '#ffffff');
      grad.addColorStop(0.75, glow);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(64, 64, 62, 0, Math.PI * 2);
      ctx.fill();
      return new THREE.CanvasTexture(c);
    }
    function makeHappyTex(glow = '#10b981') {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 128;
      const ctx = c.getContext('2d');
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = glow;
      ctx.shadowBlur = 14;
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(64, 76, 32, Math.PI * 1.15, Math.PI * 1.85, false);
      ctx.stroke();
      return new THREE.CanvasTexture(c);
    }

    const eyeNorm = makeEyeTex('#38bdf8');
    const eyeHappy = makeHappyTex('#38bdf8');
    const leftEyeMat = new THREE.MeshBasicMaterial({ map: eyeNorm, transparent: true, depthWrite: false });
    const rightEyeMat = new THREE.MeshBasicMaterial({ map: eyeNorm, transparent: true, depthWrite: false });

    // Hierarchy
    const root = new THREE.Group();
    scene.add(root);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.35, 0);
    root.add(headGroup);

    // Head
    const headMesh = new THREE.Mesh(createRoundedBox(2.7, 2.1, 1.7, 0.45, 5), darkObsidian);
    headMesh.position.set(0, 0.85, 0);
    headGroup.add(headMesh);

    // Bezel & Screen
    const bezel = new THREE.Mesh(createRoundedBox(2.1, 1.5, 1.4, 0.3, 4), mountainGold);
    bezel.position.set(0, 0.85, 0.22);
    headGroup.add(bezel);

    const screen = new THREE.Mesh(createRoundedBox(1.9, 1.34, 1.25, 0.24, 4), screenGloss);
    screen.position.set(0, 0.85, 0.34);
    headGroup.add(screen);

    // Eyes
    const eyesRig = new THREE.Group();
    eyesRig.position.set(0, 0.82, 0.985);
    headGroup.add(eyesRig);

    const eyeGeo = new THREE.PlaneGeometry(0.65, 0.65);
    const leftEye = new THREE.Mesh(eyeGeo, leftEyeMat);
    leftEye.position.set(-0.41, 0, 0);
    eyesRig.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, rightEyeMat);
    rightEye.position.set(0.41, 0, 0);
    eyesRig.add(rightEye);

    // Antenna
    const antRod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 8), silverJoint);
    antRod.position.set(0, 2.2, 0);
    headGroup.add(antRod);
    const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.15
    }));
    antTip.position.set(0, 2.5, 0);
    headGroup.add(antTip);

    // Ears
    const earGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.28, 12);
    earGeo.rotateZ(Math.PI / 2);
    const leftEar = new THREE.Mesh(earGeo, mountainGold);
    leftEar.position.set(-1.42, 0.85, 0);
    headGroup.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, mountainGold);
    rightEar.position.set(1.42, 0.85, 0);
    headGroup.add(rightEar);

    // Torso
    const torso = new THREE.Mesh(createRoundedBox(2.1, 1.9, 1.5, 0.38, 5), darkObsidian);
    torso.position.set(0, -0.65, 0);
    root.add(torso);

    const chestStripe = new THREE.Mesh(createRoundedBox(1.3, 0.85, 0.15, 0.18, 4), mountainGold);
    chestStripe.position.set(0, -0.62, 0.74);
    root.add(chestStripe);

    // Arms
    function makeArm(isLeft) {
      const arm = new THREE.Group();
      arm.position.set(isLeft ? -1.35 : 1.35, -0.28, 0);
      const mesh = new THREE.Mesh(createRoundedBox(0.42, 1.05, 0.45, 0.18, 4), darkObsidian);
      mesh.position.set(0, -0.55, 0);
      arm.add(mesh);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), mountainGold);
      hand.position.set(0, -1.15, 0);
      arm.add(hand);
      return arm;
    }
    const leftArm = makeArm(true);
    const rightArm = makeArm(false);
    root.add(leftArm);
    root.add(rightArm);

    // State & Animations
    let isSpinning = false;
    let spinStart = 0;
    let isHappy = false;
    let happyTimer = null;

    triggerBotSpin = () => {
      isSpinning = true;
      spinStart = performance.now();
      triggerBotHappy(1400);
    };

    triggerBotHappy = (duration = 1500) => {
      isHappy = true;
      leftEyeMat.map = eyeHappy;
      rightEyeMat.map = eyeHappy;
      leftEyeMat.needsUpdate = true;
      rightEyeMat.needsUpdate = true;
      clearTimeout(happyTimer);
      happyTimer = setTimeout(() => {
        isHappy = false;
        leftEyeMat.map = eyeNorm;
        rightEyeMat.map = eyeNorm;
        leftEyeMat.needsUpdate = true;
        rightEyeMat.needsUpdate = true;
      }, duration);
    };

    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseX = Math.max(-1, Math.min(1, (e.clientX - cx) / 250));
      mouseY = Math.max(-1, Math.min(1, (e.clientY - cy) / 250));
    }, { passive: true });

    const startTime = performance.now();
    function animate() {
      requestAnimationFrame(animate);
      const now = performance.now();
      const elapsed = (now - startTime) * 0.001;

      // Gentle floating bob
      root.position.y = Math.sin(elapsed * 2.2) * 0.12;

      // Head look toward cursor
      headGroup.rotation.y += (mouseX * 0.35 - headGroup.rotation.y) * 0.08;
      headGroup.rotation.x += (-mouseY * 0.25 - headGroup.rotation.x) * 0.08;

      if (isSpinning) {
        const prog = Math.min(1, (now - spinStart) / 800);
        const ease = Math.sin(prog * Math.PI * 0.5);
        root.rotation.y = ease * Math.PI * 2;
        if (prog >= 1) {
          isSpinning = false;
          root.rotation.y = 0;
        }
      } else {
        root.rotation.y = Math.sin(elapsed * 0.8) * 0.06;
      }

      leftArm.rotation.z = Math.sin(elapsed * 1.8) * 0.05 - 0.05;
      rightArm.rotation.z = -Math.sin(elapsed * 1.8) * 0.05 + 0.05;

      renderer.render(scene, camera);
    }
    animate();
  }

  // -------------------------------------------------------------
  // 4. DRAWER OPEN / CLOSE CONTROLLER
  // -------------------------------------------------------------
  let isDrawerOpen = false;

  function toggleDrawer(force = null) {
    const box = document.getElementById('admin-copilot-drawer');
    if (!box) return;
    const next = force !== null ? force : !isDrawerOpen;

    if (next) {
      box.classList.remove('copilot-closing');
      box.classList.add('copilot-open');
      isDrawerOpen = true;
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      container.style.transform = 'scale(0.85)';
      triggerBotSpin();
      ensureWelcome();
      const inp = document.getElementById('copilot-input');
      if (inp) setTimeout(() => inp.focus(), 250);
    } else {
      box.classList.add('copilot-closing');
      container.style.opacity = '1';
      container.style.pointerEvents = 'auto';
      container.style.transform = 'scale(1)';
      setTimeout(() => {
        box.classList.remove('copilot-open');
        box.classList.remove('copilot-closing');
        isDrawerOpen = false;
      }, 180);
    }
  }

  // Draggable Floating Avatar (Touch & Mouse Support with Tap-to-Open)
  function makeAvatarDraggable(el) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initLeft = 0;
    let initTop = 0;
    let moved = false;

    el.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      isDragging = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;

      const rect = el.getBoundingClientRect();
      initLeft = rect.left;
      initTop = rect.top;

      try { el.setPointerCapture(e.pointerId); } catch {}
    });

    el.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!moved && Math.hypot(dx, dy) > 5) {
        moved = true;
        el.classList.add('copilot-dragging');
      }

      if (moved) {
        const maxX = window.innerWidth - el.offsetWidth - 8;
        const maxY = window.innerHeight - el.offsetHeight - 8;
        const newLeft = Math.max(8, Math.min(maxX, initLeft + dx));
        const newTop = Math.max(8, Math.min(maxY, initTop + dy));

        el.style.left = `${newLeft}px`;
        el.style.top = `${newTop}px`;
        el.style.right = 'auto';
        el.style.bottom = 'auto';
      }
    });

    const endDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch {}
      el.classList.remove('copilot-dragging');

      if (!moved) {
        // Pure click/tap -> toggle drawer!
        toggleDrawer();
      }
    };

    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
  }

  makeAvatarDraggable(container);

  // Close & Reset handlers
  document.getElementById('copilot-close-btn').addEventListener('click', () => toggleDrawer(false));
  document.getElementById('copilot-reset-btn').addEventListener('click', () => {
    document.getElementById('copilot-messages').innerHTML = '';
    ensureWelcome();
  });

  // Resize / Expand Drawer handler
  const resizeBtn = document.getElementById('copilot-resize-btn');
  if (resizeBtn) {
    resizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const box = document.getElementById('admin-copilot-drawer');
      if (!box) return;
      const isExp = box.classList.toggle('copilot-expanded');
      resizeBtn.innerHTML = isExp
    ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>'
    : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
      resizeBtn.title = isExp ? 'Collapse Width' : 'Expand / Resize Width';
    });
  }

  // -------------------------------------------------------------
  // 5. MESSAGE STREAM & WELCOME CARD
  // -------------------------------------------------------------
  function appendMsg(html, sender = 'bot') {
    const stream = document.getElementById('copilot-messages');
    if (!stream) return;
    const msg = document.createElement('div');
    msg.className = `copilot-msg ${sender}`;
    msg.innerHTML = html;
    stream.appendChild(msg);
    stream.scrollTop = stream.scrollHeight;
  }

  function ensureWelcome() {
    const stream = document.getElementById('copilot-messages');
    if (!stream || stream.children.length > 0) return;

    appendMsg(`
      <div style="font-weight:700;color:#0284c7;font-size:11px;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:4px;display:flex;align-items:center;gap:6px;">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#0284c7;"></span> DOVA AI ACTIVE
      </div>
      <p style="margin:0 0 6px 0;font-weight:600;font-size:13px;">Hello Admin! I am DOVA, your store execution assistant.</p>
      <p style="margin:0 0 8px 0;font-size:11.5px;opacity:0.8;">Execute instant changes directly without searching through tables:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        <button type="button" class="copilot-btn secondary" style="font-size:10.5px;padding:7px 9px;text-align:left;justify-content:flex-start;" onclick="window.__adminCopilotAct('price')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><circle cx="7" cy="7" r="1.5"></circle></svg> Change Price / MRP</button>
        <button type="button" class="copilot-btn secondary" style="font-size:10.5px;padding:7px 9px;text-align:left;justify-content:flex-start;" onclick="window.__adminCopilotAct('hold')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg> Hold / Reserve Stock</button>
        <button type="button" class="copilot-btn secondary" style="font-size:10.5px;padding:7px 9px;text-align:left;justify-content:flex-start;" onclick="window.__adminCopilotAct('release')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg> Release Reserved</button>
        <button type="button" class="copilot-btn secondary" style="font-size:10.5px;padding:7px 9px;text-align:left;justify-content:flex-start;" onclick="window.__adminCopilotAct('health')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> Store Health Snapshot</button>
      </div>
    `, 'bot');
  }

  // -------------------------------------------------------------
  // 6. ACTION HANDLERS (DETERMINISTIC CONTROLLERS)
  // -------------------------------------------------------------

  // Safe Store Helper
  function getStore() {
    return window.state || { products: [], inventory: {}, orders: [], metrics: null };
  }

  // Quick Action Chips listener
  document.querySelectorAll('.copilot-chips-bar .copilot-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.getAttribute('data-act');
      handleAction(act);
    });
  });
  window.__adminCopilotAct = handleAction;

  function handleAction(act, extraParam = null) {
    if (act === 'price') showPriceProductPicker();
    else if (act === 'hold') showHoldStockPicker(extraParam);
    else if (act === 'release') showReleaseStockPicker();
    else if (act === 'adjust') showAdjustStockPicker();
    else if (act === 'visibility') showVisibilityManager();
    else if (act === 'health') showHealthReport();
  }

  // ── A. CHANGE PRICE / MRP ────────────────────────────────────
  function showPriceProductPicker() {
    const store = getStore();
    const products = store.products || [];
    if (!products.length) {
      return appendMsg('No products loaded yet. Please wait a moment.', 'bot');
    }

    let cards = products.map(p => {
      const minPrice = Array.isArray(p.variants) && p.variants.length
        ? Math.min(...p.variants.map(v => v.price))
        : p.price;
      return `
        <div class="copilot-prod-card" onclick="window.__openPriceEdit('${p.id}')">
          <div class="copilot-prod-title">${esc(p.title)}</div>
          <div class="copilot-prod-price">Starts ₹${minPrice} • ${p.variants?.length || 1} packs</div>
        </div>
      `;
    }).join('');

    appendMsg(`
      <div class="copilot-card-title">SELECT PRODUCT TO UPDATE PRICE</div>
      <p style="margin:0 0 6px 0;font-size:11.5px;color:#94a3b8;">Choose which product's selling price or MRP you want to modify:</p>
      <div class="copilot-prod-grid">${cards}</div>
    `, 'bot');
  }

  window.__openPriceEdit = function (productId) {
    const store = getStore();
    const p = (store.products || []).find(x => x.id === productId);
    if (!p) return appendMsg('Product not found.', 'bot');

    const variants = p.variants || [{ size: 'Default', price: p.price, mrp: p.mrp, sku: p.sku }];
    let options = variants.map((v, i) => `
      <option value="${i}">${v.size || v.label || 'Pack'} — Current: ₹${v.price} (MRP: ₹${v.mrp}) [SKU: ${v.sku}]</option>
    `).join('');

    const firstVar = variants[0];
    const cardId = `price-form-${Date.now()}`;

    appendMsg(`
      <div class="copilot-card" id="${cardId}">
        <div class="copilot-card-title">EDIT PRICE: ${esc(p.title)}</div>
        <div class="copilot-field">
          <label>Select Pack Size / Variant:</label>
          <select class="copilot-select cop-var-sel" onchange="window.__syncPriceInputs('${cardId}', '${p.id}', this.value)">${options}</select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div class="copilot-field">
            <label>New Selling Price (₹) *</label>
            <input type="number" class="copilot-input cop-price" value="${firstVar.price}" min="1" />
          </div>
          <div class="copilot-field">
            <label>New MRP (₹) *</label>
            <input type="number" class="copilot-input cop-mrp" value="${firstVar.mrp}" min="1" />
          </div>
        </div>
        <div class="cop-preview" style="font-size:11px;color:#10b981;margin-bottom:8px;">
          Customer Discount: ~${Math.round((1 - firstVar.price / firstVar.mrp) * 100)}% OFF
        </div>
        <div class="copilot-btn-row">
          <button type="button" class="copilot-btn secondary" onclick="this.closest('.copilot-card').remove()">Cancel</button>
          <button type="button" class="copilot-btn primary" onclick="window.__submitPriceUpdate('${cardId}', '${p.id}')">Save &amp; Live Sync</button>
        </div>
      </div>
    `, 'bot');
  };

  window.__syncPriceInputs = function (cardId, prodId, varIdx) {
    const p = (getStore().products || []).find(x => x.id === prodId);
    if (!p) return;
    const v = p.variants[varIdx];
    const card = document.getElementById(cardId);
    if (!card || !v) return;
    card.querySelector('.cop-price').value = v.price;
    card.querySelector('.cop-mrp').value = v.mrp;
    const prev = card.querySelector('.cop-preview');
    if (prev) {
      const disc = Math.round((1 - v.price / v.mrp) * 100);
      prev.textContent = `Customer Discount: ~${disc}% OFF`;
    }
  };

  window.__submitPriceUpdate = async function (cardId, prodId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const p = (getStore().products || []).find(x => x.id === prodId);
    if (!p) return showToast('Product not found', true);

    const varIdx = Number(card.querySelector('.cop-var-sel').value);
    const newPrice = Number(card.querySelector('.cop-price').value);
    const newMrp = Number(card.querySelector('.cop-mrp').value);

    if (!newPrice || newPrice <= 0 || !newMrp || newMrp <= 0) {
      return showToast('Please enter valid positive numbers for price and MRP', true);
    }
    if (newPrice > newMrp) {
      return showToast('Selling price cannot exceed MRP', true);
    }

    const updatedVariants = (p.variants || []).map((v, i) => {
      if (i !== varIdx) return v;
      return {
        ...v,
        price: newPrice,
        mrp: newMrp,
        discount: `${Math.round((1 - newPrice / newMrp) * 100)}% OFF`
      };
    });

    try {
      card.innerHTML = `<div style="font-size:12px;color:#38bdf8;padding:8px 0;">Syncing price to storefront catalog...</div>`;
      const res = await window.apiFetch(`/api/admin/products/${encodeURIComponent(prodId)}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...p,
          variants: updatedVariants
        })
      });

      triggerBotHappy();
      card.innerHTML = `
        <div style="color:#10b981;font-weight:700;font-size:12px;margin-bottom:4px;"><span style="display:inline-flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> PRICE UPDATED LIVE</span></div>
        <p style="margin:0 0 6px 0;font-size:11.5px;color:#cbd5e1;">
          <b>${esc(p.title)}</b> (${updatedVariants[varIdx].size || updatedVariants[varIdx].sku}) is now <b>₹${newPrice}</b> (MRP: ₹${newMrp}).
        </p>
        <span style="font-size:10.5px;padding:2px 7px;background:rgba(16,185,129,0.2);color:#10b981;border-radius:4px;">Instant Storefront Sync Complete</span>
      `;

      if (typeof window.loadBootstrap === 'function') await window.loadBootstrap();
      if (typeof window.showToast === 'function') window.showToast(`Updated price for ${p.title}!`);
    } catch (err) {
      card.innerHTML = `<div style="color:#ef4444;font-size:12px;">Error updating price: ${esc(err.message)}</div>`;
    }
  };

  // ── B. HOLD / RESERVE STOCK FOR OFFLINE / VIP CLIENT ──────────
  function showHoldStockPicker(preselectedSku = '') {
    const store = getStore();
    const invMap = store.inventory || {};
    const prodMap = new Map((store.products || []).map(p => [p.id, p]));

    const skuList = Object.values(invMap);
    if (!skuList.length) return appendMsg('No inventory SKUs found.', 'bot');

    let options = skuList.map(i => {
      const title = prodMap.get(i.productId)?.title || i.productId;
      const free = Math.max(0, (i.availableQty || 0) - (i.reservedQty || 0));
      return `<option value="${esc(i.sku)}" ${i.sku === preselectedSku ? 'selected' : ''}>${esc(title)} (${esc(i.variantLabel)}) — Free: ${free} [Total: ${i.availableQty}]</option>`;
    }).join('');

    const firstSku = preselectedSku || skuList[0]?.sku || '';
    const initialItem = invMap[firstSku] || skuList[0];
    const initialFree = initialItem ? Math.max(0, (initialItem.availableQty || 0) - (initialItem.reservedQty || 0)) : 0;
    const cardId = `hold-form-${Date.now()}`;

    appendMsg(`
      <div class="copilot-card" id="${cardId}">
        <div class="copilot-card-title">MANUAL STOCK RESERVE / HOLD</div>
        <p style="margin:0 0 8px 0;font-size:11.5px;color:#94a3b8;">
          Reserve items for an offline or phone customer. This deducts free units from the website to prevent overselling!
        </p>
        <div class="copilot-field">
          <label>Select Product / SKU:</label>
          <select class="copilot-select cop-hold-sku" onchange="window.__syncHoldMax('${cardId}', this.value)">${options}</select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div class="copilot-field">
            <label>Units to Hold *</label>
            <input type="number" class="copilot-input cop-hold-qty" value="1" min="1" max="${initialFree}" />
          </div>
          <div class="copilot-field">
            <label>Free Stock on Web</label>
            <input type="text" class="copilot-input cop-hold-max" value="${initialFree} units" disabled style="opacity:0.75;" />
          </div>
        </div>
        <div class="copilot-field">
          <label>Client / Audit Note *</label>
          <input type="text" class="copilot-input cop-hold-note" placeholder="e.g. Reserved for VIP client via WhatsApp" />
        </div>
        <div class="copilot-btn-row">
          <button type="button" class="copilot-btn secondary" onclick="this.closest('.copilot-card').remove()">Cancel</button>
          <button type="button" class="copilot-btn primary" onclick="window.__submitHoldStock('${cardId}')">Lock &amp; Reserve Units</button>
        </div>
      </div>
    `, 'bot');
  }

  window.__syncHoldMax = function (cardId, sku) {
    const inv = getStore().inventory?.[sku];
    const card = document.getElementById(cardId);
    if (!card || !inv) return;
    const free = Math.max(0, (inv.availableQty || 0) - (inv.reservedQty || 0));
    const qtyInp = card.querySelector('.cop-hold-qty');
    const maxInp = card.querySelector('.cop-hold-max');
    if (qtyInp) qtyInp.max = free;
    if (maxInp) maxInp.value = `${free} units`;
  };

  window.__submitHoldStock = async function (cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const sku = card.querySelector('.cop-hold-sku').value;
    const qty = parseInt(card.querySelector('.cop-hold-qty').value, 10);
    const note = card.querySelector('.cop-hold-note').value.trim() || 'Manual reserve for offline client';

    if (!qty || qty <= 0) return showToast('Enter valid quantity to reserve', true);

    try {
      card.innerHTML = `<div style="font-size:12px;color:#38bdf8;padding:8px 0;">Reserving ${qty} unit(s) and protecting website stock...</div>`;
      const res = await window.apiFetch('/api/admin/inventory/hold', {
        method: 'POST',
        body: JSON.stringify({ sku, qty, note })
      });

      triggerBotSpin();
      card.innerHTML = `
        <div style="color:#10b981;font-weight:700;font-size:12px;margin-bottom:4px;"><span style="display:inline-flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> STOCK RESERVED SUCCESSFULLY</span></div>
        <p style="margin:0 0 6px 0;font-size:11.5px;color:#cbd5e1;">
          Held <b>${qty} unit(s)</b> of <b>${esc(sku)}</b>.<br/>
          Free stock on website is now <b>${res.remainingFree} units</b> (preventing overselling).
        </p>
        <div style="font-size:10.5px;color:#94a3b8;margin-bottom:8px;">Note: "${esc(note)}"</div>
        <button type="button" class="copilot-btn secondary" style="font-size:10.5px;padding:4px 8px;" onclick="window.__adminCopilotAct('release')">Open Release Manager</button>
      `;

      if (typeof window.loadBootstrap === 'function') await window.loadBootstrap();
      if (typeof window.showToast === 'function') window.showToast(`Reserved ${qty} units of ${sku}`);
    } catch (err) {
      card.innerHTML = `<div style="color:#ef4444;font-size:12px;">Error reserving stock: ${esc(err.message)}</div>`;
    }
  };

  // ── C. RELEASE RESERVED STOCK HOLD ───────────────────────────
  function showReleaseStockPicker() {
    const store = getStore();
    const invMap = store.inventory || {};
    const prodMap = new Map((store.products || []).map(p => [p.id, p]));

    const reservedSkus = Object.values(invMap).filter(i => (i.reservedQty || 0) > 0);
    if (!reservedSkus.length) {
      return appendMsg(`
        <div class="copilot-card">
          <div class="copilot-card-title">NO ACTIVE RESERVED HOLDS</div>
          <p style="margin:0;font-size:11.5px;color:#cbd5e1;">All inventory SKUs currently have 0 reserved units held.</p>
        </div>
      `, 'bot');
    }

    let options = reservedSkus.map(i => {
      const title = prodMap.get(i.productId)?.title || i.productId;
      return `<option value="${esc(i.sku)}">${esc(title)} (${esc(i.variantLabel)}) — Reserved: ${i.reservedQty}</option>`;
    }).join('');

    const first = reservedSkus[0];
    const cardId = `rel-form-${Date.now()}`;

    appendMsg(`
      <div class="copilot-card" id="${cardId}">
        <div class="copilot-card-title">RELEASE RESERVED STOCK TO WEB</div>
        <p style="margin:0 0 8px 0;font-size:11.5px;color:#94a3b8;">
          Release held units back into free stock so they become purchasable on the storefront again.
        </p>
        <div class="copilot-field">
          <label>Select Reserved SKU:</label>
          <select class="copilot-select cop-rel-sku" onchange="window.__syncRelMax('${cardId}', this.value)">${options}</select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div class="copilot-field">
            <label>Units to Release *</label>
            <input type="number" class="copilot-input cop-rel-qty" value="${first.reservedQty}" min="1" max="${first.reservedQty}" />
          </div>
          <div class="copilot-field">
            <label>Currently Reserved</label>
            <input type="text" class="copilot-input cop-rel-max" value="${first.reservedQty} units" disabled style="opacity:0.75;" />
          </div>
        </div>
        <div class="copilot-field">
          <label>Release Reason</label>
          <input type="text" class="copilot-input cop-rel-reason" value="Manual hold released back to inventory" />
        </div>
        <div class="copilot-btn-row">
          <button type="button" class="copilot-btn secondary" onclick="this.closest('.copilot-card').remove()">Cancel</button>
          <button type="button" class="copilot-btn primary" onclick="window.__submitReleaseStock('${cardId}')">Release to Web</button>
        </div>
      </div>
    `, 'bot');
  }

  window.__syncRelMax = function (cardId, sku) {
    const inv = getStore().inventory?.[sku];
    const card = document.getElementById(cardId);
    if (!card || !inv) return;
    const reserved = inv.reservedQty || 0;
    card.querySelector('.cop-rel-qty').value = reserved;
    card.querySelector('.cop-rel-qty').max = reserved;
    card.querySelector('.cop-rel-max').value = `${reserved} units`;
  };

  window.__submitReleaseStock = async function (cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const sku = card.querySelector('.cop-rel-sku').value;
    const qty = parseInt(card.querySelector('.cop-rel-qty').value, 10);
    const reason = card.querySelector('.cop-rel-reason').value.trim() || 'Manual hold released';

    if (!qty || qty <= 0) return showToast('Enter valid quantity to release', true);

    try {
      card.innerHTML = `<div style="font-size:12px;color:#38bdf8;padding:8px 0;">Releasing ${qty} unit(s) back to website free stock...</div>`;
      const res = await window.apiFetch('/api/admin/inventory/release', {
        method: 'POST',
        body: JSON.stringify({ sku, qty, reason })
      });

      triggerBotHappy();
      card.innerHTML = `
        <div style="color:#10b981;font-weight:700;font-size:12px;margin-bottom:4px;"><span style="display:inline-flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> STOCK RELEASED</span></div>
        <p style="margin:0;font-size:11.5px;color:#cbd5e1;">
          Released <b>${qty} unit(s)</b> of <b>${esc(sku)}</b>.<br/>
          Free stock available for website customers is now <b>${res.remainingFree} units</b>.
        </p>
      `;

      if (typeof window.loadBootstrap === 'function') await window.loadBootstrap();
      if (typeof window.showToast === 'function') window.showToast(`Released ${qty} units of ${sku}`);
    } catch (err) {
      card.innerHTML = `<div style="color:#ef4444;font-size:12px;">Error releasing stock: ${esc(err.message)}</div>`;
    }
  };

  // ── D. QUICK PHYSICAL STOCK ADJUST (+/-) ─────────────────────
  function showAdjustStockPicker() {
    const store = getStore();
    const invMap = store.inventory || {};
    const prodMap = new Map((store.products || []).map(p => [p.id, p]));
    const skuList = Object.values(invMap);

    let options = skuList.map(i => {
      const title = prodMap.get(i.productId)?.title || i.productId;
      return `<option value="${esc(i.sku)}">${esc(title)} (${esc(i.variantLabel)}) [Current Stock: ${i.availableQty}]</option>`;
    }).join('');

    const cardId = `adj-form-${Date.now()}`;
    appendMsg(`
      <div class="copilot-card" id="${cardId}">
        <div class="copilot-card-title">PHYSICAL STOCK ADJUSTMENT</div>
        <div class="copilot-field">
          <label>Select SKU:</label>
          <select class="copilot-select cop-adj-sku">${options}</select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div class="copilot-field">
            <label>Movement Type</label>
            <select class="copilot-select cop-adj-type">
              <option value="stock_received">Fresh Batch Added</option>
              <option value="manual_adjustment">Audit Correction</option>
              <option value="damaged_stock">Damaged / Expired</option>
            </select>
          </div>
          <div class="copilot-field">
            <label>Quantity Delta (+/-) *</label>
            <input type="number" class="copilot-input cop-adj-delta" placeholder="e.g. 20 or -5" />
          </div>
        </div>
        <div class="copilot-field">
          <label>Mandatory Audit Reason *</label>
          <input type="text" class="copilot-input cop-adj-reason" placeholder="e.g. Fresh November harvest delivery" />
        </div>
        <div class="copilot-btn-row">
          <button type="button" class="copilot-btn secondary" onclick="this.closest('.copilot-card').remove()">Cancel</button>
          <button type="button" class="copilot-btn primary" onclick="window.__submitStockAdjust('${cardId}')">Save Adjustment</button>
        </div>
      </div>
    `, 'bot');
  }

  window.__submitStockAdjust = async function (cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const sku = card.querySelector('.cop-adj-sku').value;
    const movementType = card.querySelector('.cop-adj-type').value;
    const qtyDelta = parseInt(card.querySelector('.cop-adj-delta').value, 10);
    const reason = card.querySelector('.cop-adj-reason').value.trim();

    if (!qtyDelta || isNaN(qtyDelta) || qtyDelta === 0) return showToast('Enter valid non-zero adjustment delta', true);
    if (!reason || reason.length < 3) return showToast('Descriptive audit reason required', true);

    try {
      card.innerHTML = `<div style="font-size:12px;color:#38bdf8;padding:8px 0;">Recording stock movement...</div>`;
      const res = await window.apiFetch('/api/admin/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({ sku, movementType, qtyDelta, reason })
      });

      triggerBotHappy();
      card.innerHTML = `
        <div style="color:#10b981;font-weight:700;font-size:12px;margin-bottom:4px;"><span style="display:inline-flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> STOCK ADJUSTED</span></div>
        <p style="margin:0;font-size:11.5px;color:#cbd5e1;">
          <b>${esc(sku)}</b> physical stock is now <b>${res.inventory?.availableQty} units</b>.<br/>
          Movement logged: <i>${esc(movementType)} (${qtyDelta > 0 ? '+' + qtyDelta : qtyDelta})</i>.
        </p>
      `;

      if (typeof window.loadBootstrap === 'function') await window.loadBootstrap();
      if (typeof window.showToast === 'function') window.showToast(`Updated stock for ${sku}!`);
    } catch (err) {
      card.innerHTML = `<div style="color:#ef4444;font-size:12px;">Error: ${esc(err.message)}</div>`;
    }
  };

  // ── E. HIDE / SHOW PRODUCTS ON STOREFRONT ────────────────────
  function showVisibilityManager() {
    const store = getStore();
    const products = store.products || [];

    let rows = products.map(p => {
      const isVis = p.visible !== false;
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
          <div>
            <div style="font-weight:700;font-size:11.5px;color:#ffffff;">${esc(p.title)}</div>
            <div style="font-size:10px;color:${isVis ? '#10b981' : '#f43f5e'};display:flex;align-items:center;gap:4px;"><span class="copilot-vis-indicator ${isVis ? 'live' : 'hidden'}"></span> ${isVis ? 'Live on Store' : 'Hidden from Store'}</div>
          </div>
          <button type="button" class="copilot-btn ${isVis ? 'secondary' : 'primary'}" style="font-size:10px;padding:4px 8px;flex:none;" onclick="window.__toggleProdVisibility('${p.id}', ${!isVis})">
            ${isVis ? 'Hide' : 'Make Live'}
          </button>
        </div>
      `;
    }).join('');

    appendMsg(`
      <div class="copilot-card">
        <div class="copilot-card-title">STOREFRONT CATALOG VISIBILITY</div>
        <p style="margin:0 0 6px 0;font-size:11px;color:#94a3b8;">1-Tap toggle to show or hide products from the public store:</p>
        <div>${rows}</div>
      </div>
    `, 'bot');
  }

  window.__toggleProdVisibility = async function (prodId, makeVisible) {
    try {
      await window.apiFetch(`/api/admin/products/${encodeURIComponent(prodId)}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ visible: makeVisible })
      });
      triggerBotHappy();
      if (typeof window.loadBootstrap === 'function') await window.loadBootstrap();
      showToast(`Product is now ${makeVisible ? 'visible' : 'hidden'} on storefront!`);
      showVisibilityManager();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // ── F. STUDIO HEALTH & STATS SNAPSHOT ────────────────────────
  function showHealthReport() {
    const store = getStore();
    const metrics = store.metrics || {};
    const invValues = Object.values(store.inventory || {});
    const orders = store.orders || [];

    const totalRevenue = metrics.netRevenue ?? orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.netAmount || o.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid').length;
    const pendingVerify = orders.filter(o => o.status === 'whatsapp_pending' || o.status === 'payment_pending').length;
    const waiting2d = orders.filter(o => o.stage === 'wait_2d' || o.verificationStatus === 'wait_2d').length;

    const lowStock = invValues.filter(i => (i.availableQty - (i.reservedQty || 0)) <= (i.reorderThreshold ?? 8));
    const outOfStock = invValues.filter(i => (i.availableQty - (i.reservedQty || 0)) <= 0);

    let lowStockList = lowStock.length
      ? lowStock.map(i => `<span style="display:inline-block;padding:2px 6px;margin:2px;background:rgba(244,63,94,0.15);border:1px solid rgba(244,63,94,0.3);border-radius:4px;font-size:10px;color:#f43f5e;">${i.sku} (${i.availableQty - (i.reservedQty || 0)} left)</span>`).join(' ')
      : '<span style="font-size:11px;color:#10b981;display:inline-flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> All SKUs have healthy stock buffer</span>';

    appendMsg(`
      <div class="copilot-card">
        <div class="copilot-card-title">STUDIO HEALTH &amp; SALES REPORT</div>
        <div class="copilot-stat-grid">
          <div class="copilot-stat-box">
            <div class="copilot-stat-val emerald">₹${Math.round(totalRevenue).toLocaleString('en-IN')}</div>
            <div class="copilot-stat-lbl">Net Revenue</div>
          </div>
          <div class="copilot-stat-box">
            <div class="copilot-stat-val">${totalOrders} (${paidOrders} Paid)</div>
            <div class="copilot-stat-lbl">Total Orders</div>
          </div>
          <div class="copilot-stat-box">
            <div class="copilot-stat-val gold">${pendingVerify}</div>
            <div class="copilot-stat-lbl">WhatsApp Queue</div>
          </div>
          <div class="copilot-stat-box">
            <div class="copilot-stat-val ${outOfStock.length ? 'rose' : ''}">${lowStock.length} (${outOfStock.length} OOS)</div>
            <div class="copilot-stat-lbl">Stock Alerts</div>
          </div>
        </div>
        <div style="font-size:11px;font-weight:600;color:#cbd5e1;margin-bottom:4px;">Low Stock &amp; Reorder Alerts:</div>
        <div style="margin-bottom:8px;">${lowStockList}</div>
        <div class="copilot-btn-row">
          <button type="button" class="copilot-btn secondary" onclick="window.tab ? window.tab('orders') : null">View Orders →</button>
          <button type="button" class="copilot-btn secondary" onclick="window.tab ? window.tab('inventory') : null">Open Godam →</button>
        </div>
      </div>
    `, 'bot');
  }

  // -------------------------------------------------------------
  // 7. NATURAL LANGUAGE COMMAND CLASSIFIER
  // -------------------------------------------------------------
  function parseUserCommand(raw) {
    const text = String(raw || '').toLowerCase().trim();
    if (!text) return;

    appendMsg(esc(raw), 'user');

    // 1. Price Change
    if (text.includes('price') || text.includes('mrp') || text.includes('rate') || text.includes('cost')) {
      if (text.includes('ghee')) return window.__openPriceEdit('ghee');
      if (text.includes('walnut') || text.includes('akhrot')) return window.__openPriceEdit('walnuts');
      if (text.includes('honey') || text.includes('shehed')) return window.__openPriceEdit('honey');
      if (text.includes('pickle') || text.includes('achaar')) return window.__openPriceEdit('pickle');
      if (text.includes('rice') || text.includes('chawal')) return window.__openPriceEdit('red_rice');
      return showPriceProductPicker();
    }

    // 2. Reserve / Hold
    if (text.includes('reserve') || text.includes('hold') || text.includes('rok') || text.includes('bacha')) {
      if (text.includes('release') || text.includes('unhold') || text.includes('free') || text.includes('hatao')) {
        return showReleaseStockPicker();
      }
      return showHoldStockPicker();
    }

    // 3. Health / Sales
    if (text.includes('health') || text.includes('sale') || text.includes('revenue') || text.includes('report') || text.includes('earning') || text.includes('kamai')) {
      return showHealthReport();
    }

    // 4. Stock / Inventory
    if (text.includes('stock') || text.includes('godam') || text.includes('maal') || text.includes('inventory')) {
      if (text.includes('adjust') || text.includes('add') || text.includes('plus') || text.includes('minus')) {
        return showAdjustStockPicker();
      }
      return showHealthReport();
    }

    // 5. Hide / Show
    if (text.includes('hide') || text.includes('show') || text.includes('visible') || text.includes('chupao') || text.includes('dikhao')) {
      return showVisibilityManager();
    }

    // Default Help
    appendMsg(`
      <p style="margin:0 0 6px 0;font-size:12px;">I can help you perform any admin studio task instantly. Tap a quick action below:</p>
      <div style="display:flex;flex-wrap:wrap;gap:5px;">
        <button type="button" class="copilot-btn secondary" style="font-size:10px;padding:4px 8px;" onclick="window.__adminCopilotAct('price')">Price Change</button>
        <button type="button" class="copilot-btn secondary" style="font-size:10px;padding:4px 8px;" onclick="window.__adminCopilotAct('hold')">Hold Stock</button>
        <button type="button" class="copilot-btn secondary" style="font-size:10px;padding:4px 8px;" onclick="window.__adminCopilotAct('release')">Release Hold</button>
        <button type="button" class="copilot-btn secondary" style="font-size:10px;padding:4px 8px;" onclick="window.__adminCopilotAct('health')">Health Snapshot</button>
      </div>
    `, 'bot');
  }

  // Input event wiring
  const inp = document.getElementById('copilot-input');
  const sendBtn = document.getElementById('copilot-send-btn');
  if (sendBtn && inp) {
    sendBtn.addEventListener('click', () => {
      const val = inp.value;
      inp.value = '';
      parseUserCommand(val);
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const val = inp.value;
        inp.value = '';
        parseUserCommand(val);
      }
    });
  }

  // HTML Escape helper
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function isBotEnabled() {
    if (localStorage.getItem('shimla_admin_bot_enabled') === 'false') return false;
    if (window.state && window.state.settings && window.state.settings.admin_bot_enabled === false) return false;
    return true;
  }

  // Auth & Settings sync: Hide Co-Pilot on login screen or if disabled in Settings; show when inside Admin Studio
  function syncVisibilityWithAuth() {
    const loginScreen = document.getElementById('login-screen');
    const adminApp = document.getElementById('admin-app');
    const isLoggedOut = (loginScreen && loginScreen.style.display !== 'none' && !loginScreen.classList.contains('hidden')) || (adminApp && adminApp.classList.contains('is-hidden'));
    const cont = document.getElementById('admin-copilot-container');
    const drw = document.getElementById('admin-copilot-drawer');
    const enabled = isBotEnabled();
    const shouldShow = !isLoggedOut && enabled;
    if (cont) cont.style.display = shouldShow ? 'flex' : 'none';
    if (!shouldShow && drw) drw.classList.remove('copilot-open');
  }
  window.__syncCopilotVisibility = syncVisibilityWithAuth;
  setInterval(syncVisibilityWithAuth, 300);
  syncVisibilityWithAuth();

  // Kickstart Three.js
  loadThree(() => init3D());
})();
