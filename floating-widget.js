/**
 * Shimla Wali / Mountain Artisanal Theme — Minimal 3D Interactive AI Assistant & Floating Stack
 * Redesigned for ultra-minimal screen footprint, luxury forest-gold aesthetic, and store intelligence.
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__SHIMLA_WALI_BOT_INITIALIZED__) return;
  window.__SHIMLA_WALI_BOT_INITIALIZED__ = true;

  // -------------------------------------------------------------
  // 1. INJECT STYLESHEET (Artisanal Himalayan Theme & Compact Layout)
  // -------------------------------------------------------------
  const styleEl = document.createElement('style');
  styleEl.id = 'shimla-bot-styles';
  styleEl.textContent = `
    /* =============================================================
       1. WHATSAPP FLOATING BUTTON (MINIMAL & BOTTOM-LEFT)
       ============================================================= */
    #btn-floating-whatsapp {
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.25s;
      text-decoration: none;
      cursor: pointer;
      user-select: none;
      background: #25D366;
      border-radius: 50%;
      border: 2px solid #ffffff;
      padding: 0;
      z-index: 999989;
      box-shadow: 0 4px 14px rgba(37, 211, 102, 0.45);
    }
    #btn-floating-whatsapp:hover {
      transform: scale(1.12) translateY(-2px);
      box-shadow: 0 8px 20px rgba(37, 211, 102, 0.65);
    }
    #btn-floating-whatsapp svg {
      width: 26px;
      height: 26px;
      fill: #ffffff;
      display: block;
    }

    /* =============================================================
       2. MINIMAL 3D FLOATING CHARACTER CONTAINER (BOTTOM-RIGHT)
       ============================================================= */
    #dova-widget-container {
      position: fixed;
      bottom: 18px;
      right: 18px;
      width: 92px;
      height: 112px;
      z-index: 999995;
      user-select: none;
      touch-action: none;
      cursor: grab;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: auto;
    }
    #dova-widget-container:active {
      cursor: grabbing;
      transform: scale(0.96);
    }

    #dova-canvas {
      width: 92px;
      height: 94px;
      display: block;
      pointer-events: auto;
    }

    /* Minimal Pill at Base */
    .dova-badge-pill {
      margin-top: -4px;
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 2.5px 8.5px;
      background: rgba(15, 23, 42, 0.94);
      border: 1px solid rgba(16, 185, 129, 0.45);
      border-radius: 999px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 10px rgba(16, 185, 129, 0.15);
      pointer-events: none;
      transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
    }
    #dova-widget-container:hover .dova-badge-pill {
      border-color: #10b981;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5), 0 0 14px rgba(16, 185, 129, 0.35);
      transform: translateY(-1px);
    }
    .dova-status-dot {
      width: 5.5px;
      height: 5.5px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
      animation: dovaPulse 2.4s infinite ease-in-out;
    }
    @keyframes dovaPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.55; transform: scale(0.85); }
    }
    .dova-name-text {
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.6px;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      text-transform: uppercase;
    }

    /* =============================================================
       3. COMPACT MINIMAL CHAT MODAL (WEBSITE THEMED)
       ============================================================= */
    #agy-chat-box {
      position: fixed;
      bottom: 80px;
      right: 18px;
      width: 350px;
      max-width: calc(100vw - 28px);
      height: 490px;
      max-height: calc(100vh - 100px);
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.12);
      display: none;
      flex-direction: column;
      z-index: 999999;
      overflow: hidden;
      transform-origin: bottom right;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    #agy-chat-box * {
      box-sizing: border-box;
      font-family: inherit;
    }
    #agy-chat-box.agy-open {
      display: flex;
      animation: agyModalSpringPop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    #agy-chat-box.agy-closing {
      animation: agyModalSpringShrink 0.18s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    @keyframes agyModalSpringPop {
      0% { opacity: 0; transform: scale(0.75) translateY(30px); }
      70% { opacity: 1; transform: scale(1.02) translateY(-2px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes agyModalSpringShrink {
      0% { opacity: 1; transform: scale(1) translateY(0); }
      100% { opacity: 0; transform: scale(0.7) translateY(30px); }
    }

    /* Header */
    .agy-header {
      background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%);
      color: #ffffff;
      padding: 11px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }
    .agy-header-left {
      display: flex;
      align-items: center;
      gap: 9px;
    }
    .agy-avatar {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      background: rgba(16, 185, 129, 0.18);
      border: 1px solid rgba(16, 185, 129, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    .agy-header-title { display: flex; flex-direction: column; }
    .agy-header-title h4 { margin: 0; font-size: 13.5px; font-weight: 700; color: #ffffff; letter-spacing: -0.2px; }
    .agy-header-title .agy-sub-status {
      display: flex; align-items: center; gap: 5px; font-size: 10.5px; color: #94a3b8; margin-top: 1px;
    }
    .agy-latency-badge {
      color: #6ee7b7; font-weight: 700; font-size: 9px; background: rgba(16, 185, 129, 0.15);
      padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .agy-header-actions { display: flex; align-items: center; gap: 5px; }
    .agy-hdr-btn {
      background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1; width: 26px; height: 26px; border-radius: 6px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    }
    .agy-hdr-btn:hover { background: rgba(16, 185, 129, 0.25); border-color: #10b981; color: #ffffff; }

    /* Message Stream */
    .agy-messages {
      flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;
      background: #090d16;
    }
    .agy-messages::-webkit-scrollbar { width: 4px; }
    .agy-messages::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 8px; }

    .agy-msg {
      max-width: 92%; padding: 10px 12px; border-radius: 12px; font-size: 12.5px; line-height: 1.48;
      word-wrap: break-word; animation: agyMsgSlide 0.22s ease forwards;
    }
    @keyframes agyMsgSlide { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    .agy-msg.user {
      background: linear-gradient(135deg, #15803d, #166534); color: #ffffff;
      align-self: flex-end; border-bottom-right-radius: 3px;
      box-shadow: 0 3px 10px rgba(21, 128, 61, 0.3);
    }
    .agy-msg.bot {
      background: #1e293b; color: #f1f5f9; align-self: flex-start;
      border-bottom-left-radius: 3px; border: 1px solid rgba(255, 255, 255, 0.08);
      width: 100%; box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25);
    }

    /* Rich Card Elements */
    .agy-card-badge {
      display: inline-block; font-size: 9.5px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.4px; color: #fef08a; background: rgba(234, 179, 8, 0.14);
      border: 1px solid rgba(234, 179, 8, 0.35); padding: 2px 7px; border-radius: 4px; margin-bottom: 6px;
    }
    .agy-tech-pills { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0; }
    .agy-tech-pill {
      background: rgba(255, 255, 255, 0.07); border: 1px solid rgba(255, 255, 255, 0.12);
      color: #e2e8f0; font-size: 10.5px; padding: 2px 6px; border-radius: 4px; font-weight: 600;
    }
    .agy-bullet-list { margin: 6px 0; padding-left: 0; list-style: none; display: flex; flex-direction: column; gap: 4px; }
    .agy-bullet-list li {
      display: flex; align-items: flex-start; gap: 6px; font-size: 11.5px; color: #cbd5e1;
    }
    .agy-bullet-list li::before {
      content: "🌲"; font-size: 10px; line-height: 1.4;
    }

    .agy-action-row {
      display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .agy-action-btn {
      background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4);
      color: #6ee7b7; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700;
      cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;
      transition: all 0.2s ease;
    }
    .agy-action-btn:hover {
      background: #10b981; color: #0f172a; border-color: #10b981;
    }
    .agy-action-btn.gold {
      background: rgba(234, 179, 8, 0.15); border-color: rgba(234, 179, 8, 0.4); color: #fef08a;
    }
    .agy-action-btn.gold:hover {
      background: #eab308; color: #0f172a;
    }

    /* Quick Chips (Horizontal Scroll) */
    .agy-quick-chips {
      padding: 6px 10px; display: flex; gap: 6px; overflow-x: auto; background: #0f172a;
      border-top: 1px solid rgba(255, 255, 255, 0.07); flex-shrink: 0;
    }
    .agy-quick-chips::-webkit-scrollbar { display: none; }
    .agy-chip {
      background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1; font-size: 11px; padding: 3px 8px; border-radius: 999px;
      cursor: pointer; white-space: nowrap; transition: all 0.2s; font-weight: 600;
    }
    .agy-chip:hover {
      background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #ffffff;
    }
    .agy-chip.gold {
      border-color: rgba(234, 179, 8, 0.35); color: #fef08a; background: rgba(234, 179, 8, 0.1);
    }

    /* Input Footer */
    .agy-footer {
      padding: 8px 10px; display: flex; gap: 6px; align-items: center; background: #0b1120;
      border-top: 1px solid rgba(255, 255, 255, 0.08); flex-shrink: 0;
    }
    .agy-input {
      flex: 1; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.14);
      color: #ffffff; padding: 8px 12px; border-radius: 20px; font-size: 12px; outline: none;
      transition: border-color 0.2s;
    }
    .agy-input:focus { border-color: #10b981; background: rgba(255, 255, 255, 0.08); }
    .agy-input::placeholder { color: #64748b; }
    .agy-send-btn {
      width: 32px; height: 32px; border-radius: 50%; background: #15803d; border: 0;
      color: #ffffff; display: flex; align-items: center; justify-content: center; cursor: pointer;
      transition: all 0.2s; flex-shrink: 0;
    }
    .agy-send-btn:hover { background: #16a34a; transform: scale(1.05); }
    .agy-send-btn svg { width: 14px; height: 14px; fill: currentColor; }

    @media (max-width: 480px) {
      #agy-chat-box {
        right: 12px;
        bottom: 74px;
        width: calc(100vw - 24px);
        height: 440px;
      }
      #dova-widget-container {
        right: 12px;
        bottom: 12px;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // -------------------------------------------------------------
  // 2. INJECT DOM CONTAINERS
  // -------------------------------------------------------------
  // 1. Floating WhatsApp Button
  const waBtn = document.createElement('a');
  waBtn.id = 'btn-floating-whatsapp';
  waBtn.href = 'https://wa.me/917018168156?text=' + encodeURIComponent('Hello Shimla Wali, I want to inquire about pure mountain harvest.');
  waBtn.target = '_blank';
  waBtn.rel = 'noopener noreferrer';
  waBtn.setAttribute('aria-label', 'Chat with Shimla Wali on WhatsApp');
  waBtn.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.668-.699c.969.586 1.761.884 2.791.885h.001c3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.311.045-.698.071-1.114-.063-.587-.189-1.341-.531-2.226-1.31-.885-.779-1.349-1.745-1.547-2.065-.198-.321-.409-.854-.409-1.385s.279-.791.38-.894c.1-.103.218-.129.29-.129.073 0 .145.001.209.004.067.003.157-.025.244.184.092.219.314.767.342.824.028.058.047.126.009.201-.037.075-.056.122-.112.188-.056.066-.118.147-.168.198-.056.056-.114.117-.049.229.065.112.289.477.621.772.428.381.79.499.902.555.112.056.178.047.244-.028.066-.075.279-.327.354-.439.075-.112.15-.094.252-.056.103.037.653.308.765.364.112.056.187.084.215.131.028.047.028.471-.116.876z"/>
    </svg>
  `;
  document.body.appendChild(waBtn);

  // 2. 3D Floating Avatar Container
  const dovaWrap = document.createElement('div');
  dovaWrap.id = 'dova-widget-container';
  dovaWrap.innerHTML = `
    <canvas id="dova-canvas" width="92" height="94"></canvas>
    <div class="dova-badge-pill">
      <span class="dova-status-dot"></span>
      <span class="dova-name-text">Shimla AI</span>
    </div>
  `;
  document.body.appendChild(dovaWrap);

  // 3. Compact Chat Box Modal
  const chatBox = document.createElement('div');
  chatBox.id = 'agy-chat-box';
  chatBox.innerHTML = `
    <div class="agy-header">
      <div class="agy-header-left">
        <div class="agy-avatar">🏔️</div>
        <div class="agy-header-title">
          <h4>Shimla Wali Guide</h4>
          <div class="agy-sub-status">
            <span class="agy-latency-badge">✨ Live Help</span>
            <span>Artisanal Mountain Store</span>
          </div>
        </div>
      </div>
      <div class="agy-header-actions">
        <button type="button" class="agy-hdr-btn" id="btn-agy-clear" title="Clear Chat">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
        <button type="button" class="agy-hdr-btn" id="btn-agy-close" title="Close Assistant">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>

    <div class="agy-messages" id="agy-messages"></div>

    <div class="agy-quick-chips">
      <button type="button" class="agy-chip gold" data-prompt="Festive 50% Off Offer">🏷️ Flat 50% OFF</button>
      <button type="button" class="agy-chip" data-prompt="A2 Cow Bilona Ghee">🍯 Pure Ghee</button>
      <button type="button" class="agy-chip" data-prompt="Kagzi Walnuts & Honey">🌰 Walnuts & Honey</button>
      <button type="button" class="agy-chip" data-prompt="Track Order & Shipping">📦 Track Order</button>
      <button type="button" class="agy-chip" data-prompt="Lab Purity Verification">🔬 Purity Test</button>
      <button type="button" class="agy-chip" data-prompt="WhatsApp Support">💬 WhatsApp</button>
    </div>

    <div class="agy-footer">
      <input type="text" id="agy-input" class="agy-input" placeholder="Ask about purity, ghee, 50% discount..." autocomplete="off" />
      <button type="button" id="agy-send-btn" class="agy-send-btn" aria-label="Send Message">
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
      </button>
    </div>
  `;
  document.body.appendChild(chatBox);

  // -------------------------------------------------------------
  // 3. LOAD THREE.JS FROM CDN IF NEEDED
  // -------------------------------------------------------------
  function loadThreeJs(callback) {
    if (window.THREE) return callback();
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.onload = () => callback();
    script.onerror = () => console.error('Failed to load Three.js from CDN');
    document.head.appendChild(script);
  }

  // -------------------------------------------------------------
  // 4. 3D PROCEDURAL ROBOT SETUP (MINIMAL, MOUNTAIN-THEMED)
  // -------------------------------------------------------------
  function initDova3D() {
    const canvas = document.getElementById('dova-canvas');
    if (!canvas || !window.THREE) return;

    const width = 92;
    const height = 94;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0.38, 9.8);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // Lighting (Warm Alpine Sun & Emerald Rim)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    sunLight.position.set(4, 6, 5);
    scene.add(sunLight);

    const emeraldRimLight = new THREE.SpotLight(0x10b981, 1.8);
    emeraldRimLight.position.set(-5, 4, -4);
    scene.add(emeraldRimLight);

    const amberBounce = new THREE.PointLight(0xd97706, 1.0, 10);
    amberBounce.position.set(0, -3, 3);
    scene.add(amberBounce);

    // Rounded Box Geometry Helper
    function createRoundedBox(w, h, d, radius, smoothness = 6) {
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

    // Mountain Artisanal Materials: Obsidian Slate & Warm Golden Accents
    const darkObsidianMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.22,
      metalness: 0.2,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1
    });

    const mountainGoldMat = new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      emissive: 0x3d2000,
      roughness: 0.25,
      metalness: 0.55,
      clearcoat: 0.6
    });

    const screenGlossMat = new THREE.MeshPhysicalMaterial({
      color: 0x020617,
      roughness: 0.05,
      metalness: 0.1,
      clearcoat: 1.0
    });

    const silverJointMat = new THREE.MeshStandardMaterial({
      color: 0xd4d8e2,
      roughness: 0.22,
      metalness: 0.85
    });

    // Eye Textures
    function createEyeTexture(glow = '#10b981', outer = '#059669') {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 128;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(64, 64, 15, 64, 64, 62);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.50, '#ffffff');
      grad.addColorStop(0.75, glow);
      grad.addColorStop(0.92, outer + '66');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(64, 64, 62, 0, Math.PI * 2);
      ctx.fill();
      return new THREE.CanvasTexture(c);
    }

    function createHappyEyeTexture(glow = '#10b981') {
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

    const normalEyeTex = createEyeTexture();
    const happyEyeTex = createHappyEyeTexture();

    const leftEyeMat = new THREE.MeshBasicMaterial({ map: normalEyeTex, transparent: true, depthWrite: false });
    const rightEyeMat = new THREE.MeshBasicMaterial({ map: normalEyeTex, transparent: true, depthWrite: false });

    // Root Group
    const robotRoot = new THREE.Group();
    scene.add(robotRoot);

    // 1. Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.35, 0);
    robotRoot.add(headGroup);

    // Head Shell
    const headMesh = new THREE.Mesh(createRoundedBox(2.7, 2.1, 1.7, 0.45, 6), darkObsidianMat);
    headMesh.position.set(0, 0.85, 0);
    headGroup.add(headMesh);

    // Gold Bezel
    const bezelMesh = new THREE.Mesh(createRoundedBox(2.1, 1.5, 1.4, 0.3, 5), mountainGoldMat);
    bezelMesh.position.set(0, 0.85, 0.22);
    headGroup.add(bezelMesh);

    // Glossy Face Screen
    const screenMesh = new THREE.Mesh(createRoundedBox(1.9, 1.34, 1.25, 0.24, 5), screenGlossMat);
    screenMesh.position.set(0, 0.85, 0.34);
    headGroup.add(screenMesh);

    // Eyes Rig
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

    // Top Antenna
    const antBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.26, 12), silverJointMat);
    antBase.position.set(0, 1.95, 0);
    headGroup.add(antBase);

    const antRod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 10), silverJointMat);
    antRod.position.set(0, 2.25, 0);
    headGroup.add(antRod);

    const antTipMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), antTipMat);
    antTip.position.set(0, 2.54, 0);
    headGroup.add(antTip);

    // Side Ears
    const earGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.28, 14);
    earGeo.rotateZ(Math.PI / 2);
    const leftEar = new THREE.Mesh(earGeo, mountainGoldMat);
    leftEar.position.set(-1.42, 0.85, 0);
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, mountainGoldMat);
    rightEar.position.set(1.42, 0.85, 0);
    headGroup.add(rightEar);

    // 2. Torso
    const torsoMesh = new THREE.Mesh(createRoundedBox(2.1, 1.9, 1.5, 0.38, 6), darkObsidianMat);
    torsoMesh.position.set(0, -0.65, 0);
    robotRoot.add(torsoMesh);

    // Chest Gold Accent Stripe
    const chestStripe = new THREE.Mesh(createRoundedBox(1.3, 0.85, 0.15, 0.18, 4), mountainGoldMat);
    chestStripe.position.set(0, -0.62, 0.74);
    robotRoot.add(chestStripe);

    // 3. Arms
    function createArm(isLeft) {
      const armGroup = new THREE.Group();
      const xSign = isLeft ? -1 : 1;
      armGroup.position.set(xSign * 1.35, -0.28, 0);

      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), silverJointMat);
      armGroup.add(shoulder);

      const armMesh = new THREE.Mesh(createRoundedBox(0.42, 1.05, 0.45, 0.18, 4), darkObsidianMat);
      armMesh.position.set(0, -0.55, 0);
      armGroup.add(armMesh);

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), mountainGoldMat);
      hand.position.set(0, -1.15, 0);
      armGroup.add(hand);

      return armGroup;
    }

    const leftArm = createArm(true);
    const rightArm = createArm(false);
    robotRoot.add(leftArm);
    robotRoot.add(rightArm);

    // -------------------------------------------------------------
    // ANIMATION & INTERACTION STATE
    // -------------------------------------------------------------
    let isSpinning = false;
    let spinStart = 0;
    const SPIN_DURATION = 900;

    let isNodding = false;
    let nodStart = 0;
    const NOD_DURATION = 1400;

    let isHappyEyes = false;
    let happyEyeTimer = null;

    let isBlinking = false;
    let blinkStart = 0;
    const BLINK_DURATION = 180;

    let nextBlinkTime = performance.now() + 2500 + Math.random() * 2000;
    let nextIdleAction = performance.now() + 6000 + Math.random() * 3000;

    function triggerSpin() {
      if (isSpinning) return;
      isSpinning = true;
      spinStart = performance.now();
      setHappyEyes(1200);
    }

    function triggerNod() {
      if (isNodding) return;
      isNodding = true;
      nodStart = performance.now();
    }

    function setHappyEyes(durationMs = 1500) {
      isHappyEyes = true;
      leftEyeMat.map = happyEyeTex;
      rightEyeMat.map = happyEyeTex;
      leftEyeMat.needsUpdate = true;
      rightEyeMat.needsUpdate = true;
      clearTimeout(happyEyeTimer);
      happyEyeTimer = setTimeout(() => {
        isHappyEyes = false;
        leftEyeMat.map = normalEyeTex;
        rightEyeMat.map = normalEyeTex;
        leftEyeMat.needsUpdate = true;
        rightEyeMat.needsUpdate = true;
      }, durationMs);
    }

    // Click handler for 360 Spin & Open Chat
    canvas.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerSpin();
      toggleChat();
    });

    // Main Render Loop
    let clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const now = performance.now();

      // 1. Natural Gentle Float Hover
      const hoverY = Math.sin(elapsed * 2.2) * 0.12;
      robotRoot.position.y = hoverY;

      // 2. Idle eye blinking
      if (!isHappyEyes) {
        if (!isBlinking && now > nextBlinkTime) {
          isBlinking = true;
          blinkStart = now;
        }
        if (isBlinking) {
          const bProgress = (now - blinkStart) / BLINK_DURATION;
          if (bProgress >= 1) {
            isBlinking = false;
            eyesRig.scale.y = 1;
            nextBlinkTime = now + 2500 + Math.random() * 2000;
          } else {
            eyesRig.scale.y = Math.max(0.08, Math.sin(bProgress * Math.PI));
          }
        }
      }

      // 3. Autonomous Idle Actions (Tilt/Nod or Soft Spin)
      if (now > nextIdleAction && !isSpinning && !isNodding) {
        if (Math.random() > 0.4) triggerNod();
        else triggerSpin();
        nextIdleAction = now + 7000 + Math.random() * 4000;
      }

      // 4. Spin Pirouette (360°)
      if (isSpinning) {
        const progress = Math.min(1, (now - spinStart) / SPIN_DURATION);
        const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);
        robotRoot.rotation.y = ease * Math.PI * 2;
        if (progress >= 1) {
          isSpinning = false;
          robotRoot.rotation.y = 0;
        }
      } else {
        // Subtle breathing sway
        robotRoot.rotation.y = Math.sin(elapsed * 0.8) * 0.08;
      }

      // 5. Head Nodding
      if (isNodding) {
        const nodProg = Math.min(1, (now - nodStart) / NOD_DURATION);
        const nodEase = Math.sin(nodProg * Math.PI * 2);
        headGroup.rotation.x = nodEase * 0.22;
        headGroup.rotation.z = Math.sin(nodProg * Math.PI) * 0.08;
        if (nodProg >= 1) {
          isNodding = false;
          headGroup.rotation.x = 0;
          headGroup.rotation.z = 0;
        }
      }

      // 6. Arm gentle breathing sway
      leftArm.rotation.z = Math.sin(elapsed * 1.8) * 0.06 - 0.05;
      rightArm.rotation.z = -Math.sin(elapsed * 1.8) * 0.06 + 0.05;

      renderer.render(scene, camera);
    }
    animate();
  }

  // -------------------------------------------------------------
  // 5. CHAT DRAWER LOGIC & SHIMLA WALI STORE INTELLIGENCE
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
      const inp = document.getElementById('agy-input');
      if (inp) setTimeout(() => inp.focus(), 250);
      ensureWelcomeMessage();
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

  function ensureWelcomeMessage() {
    const msgStream = document.getElementById('agy-messages');
    if (!msgStream || msgStream.children.length > 0) return;

    appendMsgHtml(`
      <span class="agy-card-badge">✨ WELCOME TO SHIMLA WALI</span>
      <p style="margin: 4px 0 6px 0; font-weight: 600; color: #f8fafc;">नमस्ते! Welcome to our Himalayan sanctuary 🏔️</p>
      <p style="margin-bottom: 6px; font-size: 11.5px; color: #cbd5e1;">I am your personal mountain store assistant. How may I help you today?</p>
      <ul class="agy-bullet-list">
        <li><b>Flat 20% OFF:</b> On orders above ₹1,500 using code <b>SHIMLA50</b>.</li>
        <li><b>A2 Desi Cow Ghee:</b> Cultured Bilona curd method direct from Himachal.</li>
        <li><b>Fresh Harvest:</b> Thin-shelled Kagzi Walnuts, Raw Forest Honey & Galgal Pickles.</li>
      </ul>
      <div class="agy-action-row">
        <button type="button" class="agy-action-btn gold" onclick="window.__applyBotShimla50 ? window.__applyBotShimla50() : null">⚡ Apply 20% OFF</button>
        <a href="shop.html" class="agy-action-btn">🛒 Explore Shop</a>
        <a href="https://wa.me/917018168156" target="_blank" rel="noopener noreferrer" class="agy-action-btn">💬 WhatsApp</a>
      </div>
    `, 'bot');
  }

  function appendMsgHtml(html, sender = 'bot') {
    const stream = document.getElementById('agy-messages');
    if (!stream) return;
    const msg = document.createElement('div');
    msg.className = `agy-msg ${sender}`;
    msg.innerHTML = html;
    stream.appendChild(msg);
    stream.scrollTop = stream.scrollHeight;
  }

  // Knowledge Base Engine for Shimla Wali Store
  function generateStoreReply(query) {
    const q = String(query || '').toLowerCase().trim();

    // 1. Festive 20% Off Offer / Coupon / Promo
    if (q.includes('20%') || q.includes('50%') || q.includes('discount') || q.includes('coupon') || q.includes('promo') || q.includes('code') || q.includes('offer') || q.includes('1500') || q.includes('shimla50')) {
      return `
        <span class="agy-card-badge">FESTIVE HARVEST PROMO • 20% OFF</span>
        <p>You can avail <b>FLAT 20% OFF</b> on your entire order whenever your subtotal reaches <b>₹1,500 or above</b>!</p>
        <div class="agy-tech-pills">
          <span class="agy-tech-pill">Code: <b>SHIMLA50</b></span>
          <span class="agy-tech-pill">Min Order: ₹1,500</span>
          <span class="agy-tech-pill">20% Instant Discount</span>
        </div>
        <ul class="agy-bullet-list">
          <li>Automatically applies with 1-click in Cart Drawer & Checkout.</li>
          <li>For example: ₹2,000 order gets an instant ₹400 off (you pay only ₹1,600).</li>
          <li>Zero typing required — simply tap the button below.</li>
        </ul>
        <div class="agy-action-row">
          <button type="button" class="agy-action-btn gold" onclick="window.applyCartPromo ? window.applyCartPromo('SHIMLA50') : alert('Code SHIMLA50 copied!');">⚡ Apply SHIMLA50 Code</button>
          <a href="checkout.html" class="agy-action-btn">🛍️ Go to Checkout</a>
        </div>
      `;
    }

    // 2. Pure A2 Cow Bilona Desi Ghee
    if (q.includes('ghee') || q.includes('cow') || q.includes('bilona') || q.includes('desi') || q.includes('curd') || q.includes('a2')) {
      return `
        <span class="agy-card-badge">A2 PAHADI COW BILONA GHEE</span>
        <p>Handcrafted using authentic Vedic Bilona method from grass-fed indigenous Pahadi cows:</p>
        <div class="agy-tech-pills">
          <span class="agy-tech-pill">250ml: ₹649</span>
          <span class="agy-tech-pill">500ml: ₹1,199</span>
          <span class="agy-tech-pill">1000ml: ₹2,199</span>
        </div>
        <ul class="agy-bullet-list">
          <li><b>True Vedic Bilona:</b> Whole milk cultured to curd, slow-churned in clay & brass pots.</li>
          <li><b>Granular (Danedar):</b> Golden amber aroma, rich in fat-soluble vitamins A, D, E, K.</li>
          <li><b>Zero Chemical Additives:</b> No preservatives, 100% lab certified.</li>
        </ul>
        <div class="agy-action-row">
          <a href="product.html?id=ghee" class="agy-action-btn">🍯 View Ghee Details</a>
          <button type="button" class="agy-action-btn gold" onclick="window.applyCartPromo ? window.applyCartPromo('SHIMLA50') : null">Apply 50% on ₹1,500+</button>
        </div>
      `;
    }

    // 3. Walnuts, Honey, Pickles, Apples, Rajma, Red Rice
    if (q.includes('walnut') || q.includes('akhrot') || q.includes('honey') || q.includes('shahad') || q.includes('pickle') || q.includes('achar') || q.includes('apple') || q.includes('rajma') || q.includes('rice')) {
      return `
        <span class="agy-card-badge">HIMALAYAN HARVEST DROPS</span>
        <p>All harvest items are sourced fresh from village farmsteads across Shimla and Kinnaur:</p>
        <ul class="agy-bullet-list">
          <li><b>Kagzi Walnuts:</b> Thin-shelled, easy to crack by hand with plump golden kernels (₹549 / 500g).</li>
          <li><b>Wild Forest Honey:</b> 100% raw unheated multi-floral mountain nectar (₹599 / 500g).</li>
          <li><b>Galgal Hill Pickles:</b> Traditional sun-cured in cold-pressed mustard oil & spices (₹349 / 400g).</li>
          <li><b>Organic Pahadi Rajma:</b> Slow-cooked heirloom red beans from high altitudes (₹249 / 1kg).</li>
        </ul>
        <div class="agy-action-row">
          <a href="shop.html" class="agy-action-btn">🛒 Browse Full Harvest</a>
          <a href="checkout.html" class="agy-action-btn">🛍️ View Bag</a>
        </div>
      `;
    }

    // 4. Track Order / Shipping / Delivery Timeline
    if (q.includes('track') || q.includes('order') || q.includes('ship') || q.includes('delivery') || q.includes('courier') || q.includes('status')) {
      return `
        <span class="agy-card-badge">ORDER DISPATCH & TRACKING</span>
        <p>We provide <b>Free Express Pan-India Shipping</b> with live tracking on all orders:</p>
        <ul class="agy-bullet-list">
          <li><b>Dispatch Time:</b> Freshly packed & dispatched within 24 hours from Shimla.</li>
          <li><b>Delivery Window:</b> 3 to 5 business days across India via BlueDart / Delhivery.</li>
          <li><b>Live WhatsApp Alerts:</b> Tracking ID & courier link sent directly to your phone.</li>
        </ul>
        <div class="agy-action-row">
          <a href="https://wa.me/917018168156?text=Hello%2C%20please%20help%20me%20track%20my%20order" target="_blank" rel="noopener noreferrer" class="agy-action-btn">📦 Track on WhatsApp</a>
          <a href="checkout.html" class="agy-action-btn">Buy / Checkout</a>
        </div>
      `;
    }

    // 5. Purity, Lab Test, Verification
    if (q.includes('purity') || q.includes('lab') || q.includes('test') || q.includes('verify') || q.includes('certificate') || q.includes('fssai') || q.includes('fake')) {
      return `
        <span class="agy-card-badge">LAB VERIFICATION & PURITY GUARANTEE</span>
        <p>Every single batch undergoes NABL-accredited purity analysis with full public batch lookup:</p>
        <ul class="agy-bullet-list">
          <li><b>Zero Palm Oil / Adulterants:</b> Tested for fatty acid profile and purity benchmarks.</li>
          <li><b>QR Code Verification:</b> Scan the QR code on your jar to view the exact lab report.</li>
          <li><b>FSSAI Licensed:</b> 100% compliant with food safety & standards regulations.</li>
        </ul>
        <div class="agy-action-row">
          <a href="verify.html" class="agy-action-btn">🔬 Open Verification Portal</a>
          <a href="https://wa.me/917018168156" target="_blank" rel="noopener noreferrer" class="agy-action-btn">💬 Talk to Producer</a>
        </div>
      `;
    }

    // 6. Direct Contact / WhatsApp / Phone
    if (q.includes('contact') || q.includes('call') || q.includes('phone') || q.includes('whatsapp') || q.includes('support') || q.includes('help')) {
      return `
        <span class="agy-card-badge">DIRECT MOUNTAIN HOTLINE</span>
        <p>We are always here to answer your questions or assist with custom packaging:</p>
        <ul class="agy-bullet-list">
          <li><b>WhatsApp Support:</b> <a href="https://wa.me/917018168156" target="_blank" rel="noopener noreferrer" style="color:#22c55e; font-weight:700;">+91 70181 68156</a></li>
          <li><b>Call Direct:</b> <a href="tel:+917018168156" style="color:#6ee7b7; font-weight:700;">+91 70181 68156</a></li>
          <li><b>COD Orders:</b> Cash on Delivery available across all serviceable pin codes.</li>
        </ul>
        <div class="agy-action-row">
          <a href="https://wa.me/917018168156" target="_blank" rel="noopener noreferrer" class="agy-action-btn" style="background:#25D366; color:#ffffff; border-color:#25D366;">💬 Chat on WhatsApp</a>
        </div>
      `;
    }

    // Default Fallback
    return `
      <span class="agy-card-badge">SHIMLA WALI ASSISTANT</span>
      <p>Thank you for asking! Here are quick things I can help you with immediately:</p>
      <ul class="agy-bullet-list">
        <li><b>Flat 20% Off:</b> Apply code <b>SHIMLA50</b> on orders above ₹1,500.</li>
        <li><b>Vedic A2 Ghee:</b> Cultured curd bilona ghee from indigenous Pahadi cows.</li>
        <li><b>Mountain Harvest:</b> Kagzi Walnuts, Raw Honey, Homemade Pickles, Royal Apples.</li>
        <li><b>Live Purity Reports:</b> Batch certificates and lab verification.</li>
      </ul>
      <div class="agy-action-row">
        <button type="button" class="agy-action-btn gold" onclick="window.applyCartPromo ? window.applyCartPromo('SHIMLA50') : null">⚡ Apply 20% OFF</button>
        <a href="shop.html" class="agy-action-btn">🛒 Browse All Harvest</a>
        <a href="https://wa.me/917018168156" target="_blank" rel="noopener noreferrer" class="agy-action-btn">💬 WhatsApp Support</a>
      </div>
    `;
  }

  function handleSend() {
    const inp = document.getElementById('agy-input');
    if (!inp) return;
    const txt = inp.value.trim();
    if (!txt) return;

    appendMsgHtml(window.escapeHtml ? window.escapeHtml(txt) : txt, 'user');
    inp.value = '';

    // Quick natural reply delay
    setTimeout(() => {
      const reply = generateStoreReply(txt);
      appendMsgHtml(reply, 'bot');
    }, 380);
  }

  // -------------------------------------------------------------
  // 6. EVENT LISTENERS & CHIP HANDLERS
  // -------------------------------------------------------------
  function setupEvents() {
    const closeBtn = document.getElementById('btn-agy-close');
    if (closeBtn) closeBtn.addEventListener('click', () => toggleChat(false));

    const clearBtn = document.getElementById('btn-agy-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const stream = document.getElementById('agy-messages');
        if (stream) {
          stream.innerHTML = '';
          ensureWelcomeMessage();
        }
      });
    }

    const sendBtn = document.getElementById('agy-send-btn');
    if (sendBtn) sendBtn.addEventListener('click', handleSend);

    const input = document.getElementById('agy-input');
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
      });
    }

    // Quick chips
    document.querySelectorAll('.agy-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt') || chip.innerText;
        appendMsgHtml(prompt, 'user');
        setTimeout(() => {
          const reply = generateStoreReply(prompt);
          appendMsgHtml(reply, 'bot');
        }, 320);
      });
    });

    // Make avatar draggable
    const container = document.getElementById('dova-widget-container');
    if (container) {
      let isDragging = false;
      let startX, startY, initialLeft, initialTop;

      container.addEventListener('pointerdown', (e) => {
        if (e.target.id === 'dova-canvas') {
          // Allow click
          isDragging = false;
          startX = e.clientX;
          startY = e.clientY;
          const rect = container.getBoundingClientRect();
          initialLeft = rect.left;
          initialTop = rect.top;

          const onPointerMove = (ev) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
              isDragging = true;
              container.style.bottom = 'auto';
              container.style.right = 'auto';
              container.style.left = Math.max(10, Math.min(window.innerWidth - 100, initialLeft + dx)) + 'px';
              container.style.top = Math.max(10, Math.min(window.innerHeight - 120, initialTop + dy)) + 'px';
            }
          };

          const onPointerUp = () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
          };

          window.addEventListener('pointermove', onPointerMove);
          window.addEventListener('pointerup', onPointerUp);
        }
      });
    }
  }

  // -------------------------------------------------------------
  // 7. INITIALIZE EVERYTHING
  // -------------------------------------------------------------
  function init() {
    setupEvents();
    loadThreeJs(() => {
      initDova3D();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
