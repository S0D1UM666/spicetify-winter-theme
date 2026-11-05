// ============================================================
// HALLOWEEN for Spotify — decorative layer
// Adds a storybook banner to Home, cobwebs and a hanging spider.
// Pure DOM: safe with Spicetify extensions such as the bulb toggle.
// ============================================================

(() => {
  if (window.__halloweenThemeLoaded) return;
  window.__halloweenThemeLoaded = true;

  const BANNER_ID = "hw-banner";
  const DECOR_ID = "hw-decor";
  const SIDEBAR_DECOR_ID = "hw-sidebar-decor";
  const PUMPKIN_ID = "hw-pumpkin-toggle";
  const FX_ID = "hw-fx-layer";
  const THEME_CLASS = "hw-theme-on";
  const THEME_KEY = "hw-theme-enabled";

  const WINTER_BANNER_ID = "xw-banner";
  const WINTER_DECOR_ID = "xw-decor";
  const WINTER_SIDEBAR_ID = "xw-sidebar-decor";
  const TREE_ID = "xw-tree-toggle";
  const SNOW_ID = "xw-snow";
  const WINTER_FX_ID = "xw-fx";
  const WINTER_CLASS = "xw-theme-on";
  const WINTER_KEY = "xw-theme-enabled";

  const SETTINGS_ID = "xw-settings-toggle";
  const SETTINGS_PANEL_ID = "xw-settings-panel";
  const LANG_KEY = "hw-theme-lang";

  // Keep one banner node per season for the whole session. Rebuilding a
  // filtered SVG on every route change can leave stale compositor layers.
  let bannerNode = null;
  let winterBannerNode = null;

  // A key press both runs our handler and, for native buttons, produces a
  // click. Remember the key press so the follow-up click is ignored.
  const keyboardHandledAt = new WeakMap();
  let lastWinterBurst = 0;
  let settingsOpen = false;

  // Both seasons are opt-in and mutually exclusive. The tree switches winter
  // on, the pumpkin switches Halloween on. The choice survives reloads.
  let themeOn = false;
  let winterOn = false;
  try {
    themeOn = localStorage.getItem(THEME_KEY) === "1";
    winterOn = localStorage.getItem(WINTER_KEY) === "1";
  } catch (_) {
    themeOn = false;
    winterOn = false;
  }
  if (winterOn) themeOn = false;
  else if (themeOn) winterOn = false;
  document.documentElement.classList.toggle(THEME_CLASS, themeOn);
  document.documentElement.classList.toggle(WINTER_CLASS, winterOn);

  // ----------------------------------------------------------
  // Language (Russian / English)
  // ----------------------------------------------------------

  function storedLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "ru" || saved === "en") return saved;
    } catch (_) {
      // Storage can be unavailable; fall back to the system language.
    }
    return (navigator.language || "").toLowerCase().startsWith("ru") ? "ru" : "en";
  }

  let lang = storedLang();

  const TEXT = {
    ru: {
      settings: "Настройки темы",
      close: "Закрыть",
      language: "Язык",
      treeOn: "Выключить зимнюю тему",
      treeOff: "Включить зимнюю тему",
      pumpkinOn: "Выключить хэллоуинскую тему",
      pumpkinOff: "Включить хэллоуинскую тему",
      winterAria: "Зимняя сцена: снежная деревня, рождественская ёлка и падающий снег",
      winterSigil: "пусть идёт снег",
      halloweenKicker: "31 октября · ночь теней",
      halloweenTitle: "Хэллоуин",
      halloweenSub: "Музыка, от которой по спине бегут мурашки",
      halloweenSigil: "не выключай свет",
      halloweenAria: "Хэллоуинская сцена: полная луна, призрачный дом, кладбище, тыквы, летучие мыши и паутина",
    },
    en: {
      settings: "Theme settings",
      close: "Close",
      language: "Language",
      treeOn: "Turn off the winter theme",
      treeOff: "Turn on the winter theme",
      pumpkinOn: "Turn off the Halloween theme",
      pumpkinOff: "Turn on the Halloween theme",
      winterAria: "Winter scene: a snowy village, a Christmas tree and falling snow",
      winterSigil: "let it snow",
      halloweenKicker: "October 31 · night of shadows",
      halloweenTitle: "Halloween",
      halloweenSub: "Music that sends shivers down your spine",
      halloweenSigil: "don't turn off the lights",
      halloweenAria: "Halloween scene: full moon, haunted house, graveyard, pumpkins, bats and cobwebs",
    },
  };

  const t = (key) => TEXT[lang][key];

  // ----------------------------------------------------------
  // SVG helpers
  // ----------------------------------------------------------

  function webPath(size = 180, rays = 7, rings = 5) {
    let d = "";
    for (let i = 0; i <= rays; i += 1) {
      const a = (Math.PI / 2) * (i / rays);
      d += `M0 0 L${(Math.cos(a) * size).toFixed(1)} ${(Math.sin(a) * size).toFixed(1)} `;
    }
    for (let r = 1; r <= rings; r += 1) {
      const rad = (size * r) / rings;
      const sag = 0.84 + (r % 2) * 0.03;
      for (let i = 0; i < rays; i += 1) {
        const a1 = (Math.PI / 2) * (i / rays);
        const a2 = (Math.PI / 2) * ((i + 1) / rays);
        const x1 = Math.cos(a1) * rad;
        const y1 = Math.sin(a1) * rad;
        const x2 = Math.cos(a2) * rad;
        const y2 = Math.sin(a2) * rad;
        const mx = ((x1 + x2) / 2) * sag;
        const my = ((y1 + y2) / 2) * sag;
        d += `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} `;
      }
    }
    return `<path d="${d}" />`;
  }

  function webSvg(size = 180) {
    return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" aria-hidden="true" focusable="false">${webPath(size, 7, 5)}</svg>`;
  }

  function spiderSvg() {
    return `<svg viewBox="0 0 72 164" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M36 0 V96" stroke="rgba(232,217,255,.34)" stroke-width="1" />
      <g fill="#07030c">
        <ellipse cx="36" cy="109" rx="9" ry="11" />
        <circle cx="36" cy="98" r="5.5" />
        <path d="M30 102 L19 94 M30 107 L17 107 M30 112 L20 119 M42 102 L53 94 M42 107 L55 107 M42 112 L52 119"
              stroke="#07030c" stroke-width="2.2" fill="none" stroke-linecap="round" />
        <circle cx="34" cy="97" r="1" fill="#ffb45f" />
        <circle cx="38" cy="97" r="1" fill="#ffb45f" />
      </g>
    </svg>`;
  }

  function pumpkinButtonSvg() {
    // Monochrome silhouette with real cut-outs, so the icon follows the
    // native Spotify top-bar colour instead of looking like a sticker.
    return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <mask id="hw-pumpkin-face" maskUnits="userSpaceOnUse" x="0" y="0" width="40" height="40">
          <rect width="40" height="40" fill="#fff" />
          <path d="M12.1 18.4 L16.8 17.1 L15.9 21.9Z" fill="#000" />
          <path d="M27.9 18.4 L23.2 17.1 L24.1 21.9Z" fill="#000" />
          <path d="M18.8 23.2 H21.2 L20 25.2Z" fill="#000" />
          <path d="M10.8 26.9 L13.8 25.5 L15.5 28.3 L18 25.8 L20 28.5 L22 25.8 L24.5 28.3 L26.2 25.5 L29.2 26.9 C27.1 31.9 23.9 34 20 34 C16.1 34 12.9 31.9 10.8 26.9Z" fill="#000" />
        </mask>
      </defs>
      <path d="M18.4 8.6 C17.2 5.8 18.8 3.6 22.2 3.2 C22.5 5.6 21.9 7.7 20.1 9.1Z" fill="currentColor" />
      <ellipse cx="20" cy="23" rx="13.7" ry="11.9" fill="currentColor" mask="url(#hw-pumpkin-face)" />
    </svg>`;
  }

  function treeButtonSvg() {
    // Outline tree so the top-bar colour still reads as a native icon. The
    // ornaments and star are painted by CSS only while winter is on.
    return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M20 8 L13.5 17 H16 L9.5 25 H13 L6 35 H34 L27 25 H30.5 L24 17 H26.5 Z"
            fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
      <path d="M18.6 35 V38 H21.4 V35"
            fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
      <path class="xw-tree-star"
            d="M20 1.5 L21.2 4.4 L24.2 4.6 L21.9 6.5 L22.7 9.4 L20 7.8 L17.3 9.4 L18.1 6.5 L15.8 4.6 L18.8 4.4 Z" />
      <g class="xw-tree-ornaments">
        <circle class="xw-tree-ornament" cx="20" cy="13" r="1.7" />
        <circle class="xw-tree-ornament" cx="16.5" cy="21" r="1.7" />
        <circle class="xw-tree-ornament" cx="23.5" cy="21" r="1.7" />
        <circle class="xw-tree-ornament" cx="18" cy="29" r="1.7" />
        <circle class="xw-tree-ornament" cx="24" cy="30" r="1.7" />
      </g>
    </svg>`;
  }

  function fxBatSvg() {
    return `<svg viewBox="0 0 64 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M32 14 C28 6 20 2 12 4 C14 6 14 8 12 10 C16 9 20 10 22 13 C19 12 16 13 14 15 C19 16 23 18 25 21 C27 19 29 18 32 18 C35 18 37 19 39 21 C41 18 45 16 50 15 C48 13 45 12 42 13 C44 10 48 9 52 10 C50 8 50 6 52 4 C44 2 36 6 32 14Z" />
      <ellipse cx="32" cy="17" rx="4.4" ry="5.5" />
      <path d="M28 12 L26 8 L31 10Z M36 12 L38 8 L33 10Z" />
      <circle cx="29.6" cy="12.4" r="0.9" />
      <circle cx="34.4" cy="12.4" r="0.9" />
    </svg>`;
  }

  // ----------------------------------------------------------
  // Pumpkin toggle and click effects
  // ----------------------------------------------------------

  function ensureFxLayer() {
    let layer = document.getElementById(FX_ID);
    if (!layer) {
      layer = document.createElement("div");
      layer.id = FX_ID;
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
    }
    return layer;
  }

  function spawnEyeFire(x, y, angle, layer) {
    const flame = document.createElement("span");
    flame.className = "hw-eye-fire";
    flame.style.left = `${x}px`;
    flame.style.top = `${y}px`;
    layer.appendChild(flame);

    flame.animate(
      [
        {
          transform: `translate(-50%, 0%) scale(.35, .12) rotate(${angle}deg)`,
          opacity: 0,
        },
        {
          transform: `translate(-50%, 0%) scale(.8, .55) rotate(${angle}deg)`,
          opacity: 1,
          offset: 0.18,
        },
        {
          transform: `translate(calc(-50% + ${angle * 1.1}px), 6px) scale(1.05, 1.05) rotate(${angle}deg)`,
          opacity: 0.98,
          offset: 0.5,
        },
        {
          transform: `translate(calc(-50% + ${angle * 2.4}px), 16px) scale(.85, .55) rotate(${angle}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 1150 + Math.random() * 350,
        easing: "cubic-bezier(.16,.7,.3,1)",
        fill: "both",
      }
    );
    window.setTimeout(() => flame.remove(), 1800);

    for (let i = 0; i < 6; i += 1) {
      const ember = document.createElement("span");
      ember.className = "hw-eye-ember";
      ember.style.left = `${x + (Math.random() - 0.5) * 8}px`;
      ember.style.top = `${y + 8}px`;
      layer.appendChild(ember);

      const dx = (Math.random() - 0.5) * 46 + angle * 0.5;
      const dy = 40 + Math.random() * 60;
      ember.animate(
        [
          { transform: "translate(-50%, -50%) scale(.4)", opacity: 0 },
          {
            transform: `translate(calc(-50% + ${dx * 0.35}px), calc(-50% + ${dy * 0.35}px)) scale(1)`,
            opacity: 1,
            offset: 0.3,
          },
          {
            transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.2)`,
            opacity: 0,
          },
        ],
        {
          duration: 750 + Math.random() * 550,
          delay: Math.random() * 160,
          easing: "cubic-bezier(.2,.6,.4,1)",
          fill: "both",
        }
      );
      window.setTimeout(() => ember.remove(), 1600);
    }
  }

  function playPumpkinEffect(button) {
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const layer = ensureFxLayer();
    layer.replaceChildren();

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const eyeY = rect.top + rect.height * 0.5;

    // Red flash behind the pumpkin.
    const flash = document.createElement("span");
    flash.className = "hw-eye-flash";
    flash.style.left = `${cx}px`;
    flash.style.top = `${cy}px`;
    layer.appendChild(flash);
    flash.animate(
      [
        { transform: "translate(-50%, -50%) scale(.3)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(2.2)", opacity: 0.85, offset: 0.25 },
        { transform: "translate(-50%, -50%) scale(6.2)", opacity: 0 },
      ],
      { duration: 620, easing: "ease-out", fill: "both" }
    );
    window.setTimeout(() => flash.remove(), 820);

    // Twin jets of red fire from the carved eyes.
    spawnEyeFire(rect.left + rect.width * 0.36, eyeY, -22, layer);
    spawnEyeFire(rect.left + rect.width * 0.64, eyeY, 22, layer);

    // A burst of bats fanning out across the page.
    for (let i = 0; i < 18; i += 1) {
      const bat = document.createElement("span");
      bat.className = "hw-fx-bat";
      const size = 32 + Math.random() * 26;
      bat.style.width = `${size}px`;
      bat.style.height = `${size * 0.46}px`;
      bat.innerHTML = fxBatSvg();
      layer.appendChild(bat);

      const endX = 70 + Math.random() * Math.max(260, window.innerWidth - 140);
      const endY = 120 + Math.random() * Math.min(520, Math.max(200, window.innerHeight * 0.7));
      const midX = cx + (endX - cx) * 0.32 + (Math.random() - 0.5) * 150;
      const midY = 52 + (endY - 52) * 0.18 + (Math.random() - 0.5) * 44;
      const rot = (Math.random() - 0.5) * 90;

      bat.animate(
        [
          {
            transform: `translate(${cx}px, ${cy}px) translate(-50%, -50%) scale(.12) rotate(0deg)`,
            opacity: 0,
          },
          {
            transform: `translate(${midX}px, ${midY}px) translate(-50%, -50%) scale(1) rotate(${rot * 0.35}deg)`,
            opacity: 1,
            offset: 0.24,
          },
          {
            transform: `translate(${endX}px, ${endY}px) translate(-50%, -50%) scale(.78) rotate(${rot}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 2000 + Math.random() * 1050,
          delay: Math.random() * 260,
          easing: "cubic-bezier(.16,.62,.3,1)",
          fill: "both",
        }
      );
      window.setTimeout(() => bat.remove(), 3500);
    }

    button.classList.remove("hw-pumpkin-firing");
    void button.offsetWidth;
    button.classList.add("hw-pumpkin-firing");
    window.setTimeout(() => button.classList.remove("hw-pumpkin-firing"), 1100);
  }

  function ensureWinterFx() {
    let layer = document.getElementById(WINTER_FX_ID);
    if (!layer) {
      layer = document.createElement("div");
      layer.id = WINTER_FX_ID;
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
    }
    return layer;
  }

  function spawnWinterBurst(x, y, big) {
    const layer = ensureWinterFx();

    const ring = document.createElement("span");
    ring.className = "xw-click-ring";
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    layer.appendChild(ring);
    ring.animate(
      [
        { transform: "scale(.35)", opacity: 0 },
        { transform: "scale(1)", opacity: 0.9, offset: 0.25 },
        { transform: "scale(3.2)", opacity: 0 },
      ],
      { duration: big ? 760 : 560, easing: "ease-out", fill: "both" }
    );
    window.setTimeout(() => ring.remove(), 900);

    const count = big ? 14 : 7;
    for (let i = 0; i < count; i += 1) {
      const spark = document.createElement("span");
      spark.className = "xw-spark";
      spark.textContent = "❄";
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.fontSize = `${7 + Math.random() * (big ? 12 : 9)}px`;
      layer.appendChild(spark);

      const angle = Math.random() * Math.PI * 2;
      const dist = (big ? 42 : 20) + Math.random() * (big ? 74 : 34);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 12;
      const spin = 120 + Math.random() * 220;

      spark.animate(
        [
          { transform: "translate(-50%, -50%) scale(.3) rotate(0deg)", opacity: 0 },
          {
            transform: `translate(calc(-50% + ${dx * 0.45}px), calc(-50% + ${dy * 0.45}px)) scale(1) rotate(${spin * 0.4}deg)`,
            opacity: 1,
            offset: 0.35,
          },
          {
            transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 26}px)) scale(.35) rotate(${spin}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 600 + Math.random() * 480,
          delay: Math.random() * 80,
          easing: "cubic-bezier(.16,.7,.3,1)",
          fill: "both",
        }
      );
      window.setTimeout(() => spark.remove(), 1400);
    }
  }

  function playWinterEffect(button) {
    if (!button) return;
    const rect = button.getBoundingClientRect();
    spawnWinterBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, true);

    button.classList.remove("xw-tree-firing");
    void button.offsetWidth;
    button.classList.add("xw-tree-firing");
    window.setTimeout(() => button.classList.remove("xw-tree-firing"), 700);
  }

  function removeHalloweenDecorations() {
    document.getElementById(BANNER_ID)?.remove();
    document.getElementById(DECOR_ID)?.remove();
    document.getElementById(SIDEBAR_DECOR_ID)?.remove();
  }

  function removeWinterDecorations() {
    document.getElementById(WINTER_BANNER_ID)?.remove();
    document.getElementById(WINTER_DECOR_ID)?.remove();
    document.getElementById(WINTER_SIDEBAR_ID)?.remove();
    document.getElementById(SNOW_ID)?.remove();
  }

  function removeDecorations() {
    removeHalloweenDecorations();
    removeWinterDecorations();
    document.body.classList.remove("hw-home");
    for (const cls of ROUTE_CLASSES) document.body.classList.remove(cls);
  }

  function paintPumpkin(button = document.getElementById(PUMPKIN_ID)) {
    if (!button) return;
    button.classList.toggle("hw-pumpkin-on", themeOn);
    button.setAttribute("aria-pressed", String(themeOn));
    const label = themeOn ? t("pumpkinOn") : t("pumpkinOff");
    button.title = label;
    button.setAttribute("aria-label", label);
  }

  function paintTree(button = document.getElementById(TREE_ID)) {
    if (!button) return;
    button.classList.toggle("xw-tree-on", winterOn);
    button.setAttribute("aria-pressed", String(winterOn));
    const label = winterOn ? t("treeOn") : t("treeOff");
    button.title = label;
    button.setAttribute("aria-label", label);
  }

  function setSeason(season) {
    themeOn = season === "halloween";
    winterOn = season === "winter";
    document.documentElement.classList.toggle(THEME_CLASS, themeOn);
    document.documentElement.classList.toggle(WINTER_CLASS, winterOn);
    try {
      localStorage.setItem(THEME_KEY, themeOn ? "1" : "0");
      localStorage.setItem(WINTER_KEY, winterOn ? "1" : "0");
    } catch (_) {
      // Storage can be unavailable; the toggle still works for this session.
    }

    paintPumpkin();
    paintTree();

    if (themeOn || winterOn) ensure();
    else removeDecorations();
  }

  function applyTheme(on, effect) {
    const button = document.getElementById(PUMPKIN_ID);
    setSeason(on ? "halloween" : winterOn ? "winter" : "none");
    if (effect) playPumpkinEffect(button);
  }

  function applyWinter(on, effect) {
    const button = document.getElementById(TREE_ID);
    setSeason(on ? "winter" : themeOn ? "halloween" : "none");
    if (effect) playWinterEffect(button);
  }

  function buildPumpkinButton() {
    const button = document.createElement("button");
    button.id = PUMPKIN_ID;
    button.type = "button";
    button.className = "hw-pumpkin-button";
    button.innerHTML = `<span class="hw-pumpkin-art">${pumpkinButtonSvg()}</span>`;
    paintPumpkin(button);
    button.addEventListener("keydown", (event) => {
      if (event.repeat) return;
      const key = event.key;
      if (key !== " " && key !== "Spacebar" && key !== "Enter") return;
      event.preventDefault();
      event.stopPropagation();
      applyTheme(!themeOn, true);
      keyboardHandledAt.set(button, performance.now());
    });
    return button;
  }

  function buildTreeButton() {
    const button = document.createElement("button");
    button.id = TREE_ID;
    button.type = "button";
    button.className = "xw-tree-button";
    button.innerHTML = `<span class="xw-tree-art">${treeButtonSvg()}</span>`;
    paintTree(button);
    button.addEventListener("keydown", (event) => {
      if (event.repeat) return;
      const key = event.key;
      if (key !== " " && key !== "Spacebar" && key !== "Enter") return;
      event.preventDefault();
      event.stopPropagation();
      applyWinter(!winterOn, true);
      keyboardHandledAt.set(button, performance.now());
    });
    return button;
  }

  // ----------------------------------------------------------
  // Settings panel: language switch
  // ----------------------------------------------------------

  function settingsSvg() {
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
      <path d="M4 7h7M16.5 7H20M4 17h3.5M13 17h7" />
      <circle cx="13.8" cy="7" r="2.3" />
      <circle cx="10.2" cy="17" r="2.3" />
    </svg>`;
  }

  function paintSettingsButton(button = document.getElementById(SETTINGS_ID)) {
    if (!button) return;
    const label = t("settings");
    button.title = label;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-expanded", String(settingsOpen));
  }

  function paintSettingsPanel(panel = document.getElementById(SETTINGS_PANEL_ID)) {
    if (!panel) return;
    panel.setAttribute("aria-label", t("settings"));
    panel.querySelector(".xw-settings-title").textContent = t("settings");
    panel.querySelector(".xw-settings-label").textContent = t("language");
    panel.querySelector(".xw-settings-close").setAttribute("aria-label", t("close"));
    for (const btn of panel.querySelectorAll("[data-lang]")) {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle("xw-lang-active", active);
      btn.setAttribute("aria-pressed", String(active));
    }
  }

  function setSettingsOpen(open) {
    settingsOpen = open;
    document.getElementById(SETTINGS_PANEL_ID)?.classList.toggle("xw-settings-open", open);
    paintSettingsButton();
  }

  function setLanguage(next) {
    if ((next !== "ru" && next !== "en") || next === lang) return;
    lang = next;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (_) {
      // Storage can be unavailable; the switch still works for this session.
    }

    // Rebuild both banners so their copy matches the new language.
    document.getElementById(BANNER_ID)?.remove();
    document.getElementById(WINTER_BANNER_ID)?.remove();
    bannerNode = null;
    winterBannerNode = null;
    winterCopyDay = "";
    paintPumpkin();
    paintTree();
    paintSettingsButton();
    paintSettingsPanel();
    ensure();
  }

  function buildSettingsPanel() {
    const panel = document.createElement("div");
    panel.id = SETTINGS_PANEL_ID;
    panel.className = "xw-settings-panel";
    panel.setAttribute("role", "dialog");
    panel.innerHTML = `
      <div class="xw-settings-head">
        <span class="xw-settings-title"></span>
        <button class="xw-settings-close" type="button">×</button>
      </div>
      <div class="xw-settings-row">
        <span class="xw-settings-label"></span>
        <div class="xw-lang-switch">
          <button type="button" data-lang="ru">Русский</button>
          <button type="button" data-lang="en">English</button>
        </div>
      </div>`;
    panel.querySelector(".xw-settings-close").addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setSettingsOpen(false);
    });
    panel.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest("[data-lang]") : null;
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      setLanguage(target.dataset.lang);
    });
    paintSettingsPanel(panel);
    return panel;
  }

  function toggleSettings() {
    let panel = document.getElementById(SETTINGS_PANEL_ID);
    if (!panel) {
      panel = buildSettingsPanel();
      document.documentElement.appendChild(panel);
    }
    setSettingsOpen(!settingsOpen);
  }

  function buildSettingsButton() {
    const button = document.createElement("button");
    button.id = SETTINGS_ID;
    button.type = "button";
    button.className = "xw-settings-button";
    button.innerHTML = `<span class="xw-settings-art">${settingsSvg()}</span>`;
    paintSettingsButton(button);
    return button;
  }

  function ensurePumpkin() {
    const bulb = document.getElementById("spotify-bulb-button");
    const anchor =
      bulb ||
      document.querySelector('[aria-label="Главная"]') ||
      document.querySelector('[aria-label="Home"]') ||
      document.querySelector(".main-globalNav-navLink");
    const parent = anchor?.parentElement;
    if (!parent) return;

    let button = document.getElementById(PUMPKIN_ID);
    if (!button) {
      button = buildPumpkinButton();
      parent.insertBefore(button, anchor);
      return;
    }

    // Keep the pumpkin immediately to the left of the bulb, even when the
    // bulb extension re-inserts its own button after a re-render.
    if (button.parentElement !== parent) {
      parent.insertBefore(button, anchor);
    } else if (bulb && button.nextElementSibling !== bulb) {
      parent.insertBefore(button, bulb);
    }
  }

  function ensureTree() {
    const pumpkin = document.getElementById(PUMPKIN_ID);
    const bulb = document.getElementById("spotify-bulb-button");
    const anchor =
      pumpkin ||
      bulb ||
      document.querySelector('[aria-label="Главная"]') ||
      document.querySelector('[aria-label="Home"]') ||
      document.querySelector(".main-globalNav-navLink");
    const parent = anchor?.parentElement;
    if (!parent) return;

    let button = document.getElementById(TREE_ID);
    if (!button) {
      button = buildTreeButton();
      parent.insertBefore(button, anchor);
      return;
    }

    // The tree always sits immediately left of the pumpkin.
    if (button.parentElement !== parent || button.nextElementSibling !== anchor) {
      parent.insertBefore(button, anchor);
    }
  }

  function ensureSettings() {
    const anchor =
      document.getElementById(TREE_ID) ||
      document.getElementById(PUMPKIN_ID) ||
      document.getElementById("spotify-bulb-button") ||
      document.querySelector('[aria-label="Главная"]') ||
      document.querySelector('[aria-label="Home"]') ||
      document.querySelector(".main-globalNav-navLink");
    const parent = anchor?.parentElement;
    if (!parent) return;

    let button = document.getElementById(SETTINGS_ID);
    if (!button) {
      button = buildSettingsButton();
      parent.insertBefore(button, anchor);
      return;
    }

    // The gear sits immediately left of the tree.
    if (button.parentElement !== parent || button.nextElementSibling !== anchor) {
      parent.insertBefore(button, anchor);
    }
  }

  function stars() {
    let out = "";
    for (let i = 0; i < 52; i += 1) {
      const x = (i * 197 + 73) % 1200;
      const y = (i * 53 + 11) % 164;
      if (y > 150) continue;
      const r = 0.55 + ((i * 7) % 10) / 15;
      const delay = ((i * 11) % 40) / 10;
      const opacity = 0.22 + ((i * 13) % 50) / 100;
      out += `<circle class="hw-star" cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="#ffe9c4" opacity="${opacity.toFixed(2)}" style="animation-delay:${delay}s" />`;
    }
    return out;
  }

  function bat(x, y, size, duration, delay, opacity) {
    return `<g class="hw-bat" style="--dur:${duration}s;--delay:${delay}s">
      <use href="#hwBat" x="${x}" y="${y}" width="${size}" height="${size * 0.44}" fill="#08040c" opacity="${opacity}" />
    </g>`;
  }

  function cloud(x, y, scale, opacity) {
    return `<g transform="translate(${x} ${y}) scale(${scale})" fill="#351b47" opacity="${opacity}">
      <ellipse cx="0" cy="0" rx="118" ry="15" />
      <ellipse cx="-58" cy="-7" rx="54" ry="12" />
      <ellipse cx="54" cy="-5" rx="68" ry="13" />
    </g>`;
  }

  function pumpkin(x, y, scale, extra = "") {
    return `<g class="hw-pumpkin" transform="translate(${x} ${y}) scale(${scale})" ${extra}>
      <ellipse cx="0" cy="39" rx="48" ry="8" fill="#030106" opacity=".55" />
      <path d="M-42 0 C-42 -26 -22 -38 0 -38 C22 -38 42 -26 42 0 C42 26 22 38 0 38 C-22 38 -42 26 -42 0Z" fill="url(#hwPumpkin)" />
      <path d="M-30 -8 C-30 -28 -16 -36 -4 -37 C-10 -24 -12 -6 -10 14 C-8 30 -14 37 -24 34 C-34 30 -34 12 -30 -8Z" fill="#d9680b" opacity=".5" />
      <path d="M30 -8 C30 -28 16 -36 4 -37 C10 -24 12 -6 10 14 C8 30 14 37 24 34 C34 30 34 12 30 -8Z" fill="#b44a06" opacity=".45" />
      <path d="M-5 -38 C-7 -50 0 -56 7 -57 C9 -49 7 -43 4 -37Z" fill="#4c4a21" />
      <g fill="#ffd36a" filter="url(#hwGlow)" class="hw-pumpkin-glow">
        <path d="M-22 -8 l8 10 l8 -10z" />
        <path d="M6 -8 l8 10 l8 -10z" />
        <path d="M-20 12 l6 -6 l6 8 l6 -8 l6 6 l6 -7 l4 12 q-16 7 -32 0z" />
      </g>
    </g>`;
  }

  function owl() {
    return `<g class="hw-owl" transform="translate(832 124) scale(.8)" aria-hidden="true">
      <ellipse cx="0" cy="18" rx="25" ry="30" fill="#4b2366" opacity=".14" filter="url(#hwBlur12)" />
      <path d="M-15 5 C-19 13 -18 27 -12 34 C-6 41 6 41 12 34 C18 27 19 13 15 5 C11 -2 4 -5 0 -5 C-4 -5 -11 -2 -15 5Z"
            fill="#08040d" stroke="#241333" stroke-width="1.2" />
      <path d="M-15 5 L-20 -8 L-6 -5Z" fill="#08040d" stroke="#241333" stroke-width="1.1" />
      <path d="M15 5 L20 -8 L6 -5Z" fill="#08040d" stroke="#241333" stroke-width="1.1" />
      <path d="M-13 9 C-14 2 -8 -2 -3 0 C0 2 0 6 -3 8 C-7 10 -11 10 -13 9Z" fill="#1d1029" />
      <path d="M13 9 C14 2 8 -2 3 0 C0 2 0 6 3 8 C7 10 11 10 13 9Z" fill="#1d1029" />
      <g fill="#ff2a00" filter="url(#hwGlow)">
        <circle cx="-6.5" cy="4.5" r="2.8" />
        <circle cx="6.5" cy="4.5" r="2.8" />
      </g>
      <circle cx="-6.5" cy="4.5" r=".9" fill="#ffd0c0" />
      <circle cx="6.5" cy="4.5" r=".9" fill="#ffd0c0" />
      <path d="M0 7.5 L-2.8 12.5 L2.8 12.5Z" fill="#b8863b" />
      <path d="M-11 20 C-4 24 4 24 11 20 M-10 26 C-4 29 4 29 10 26 M-7 32 C-3 34 3 34 7 32"
            stroke="#241333" stroke-width="1.1" fill="none" opacity=".9" />
      <path d="M-12 33 L-16 39 M-8 35 L-9 41 M8 35 L9 41 M12 33 L16 39"
            stroke="#b8863b" stroke-width="1.4" stroke-linecap="round" />
      <path d="M-16 13 C-21 21 -20 29 -15 34 M16 13 C21 21 20 29 15 34"
            stroke="#050208" stroke-width="3.5" fill="none" stroke-linecap="round" />
    </g>`;
  }

  function sceneSvg() {
    return `<svg viewBox="0 0 1200 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hwSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#090411" />
          <stop offset="0.42" stop-color="#1c0d2c" />
          <stop offset="0.72" stop-color="#3c173e" />
          <stop offset="0.9" stop-color="#24102a" />
          <stop offset="1" stop-color="#0a0510" />
        </linearGradient>
        <radialGradient id="hwMoon">
          <stop offset="0" stop-color="#fff5d2" />
          <stop offset="0.58" stop-color="#ffe3a4" />
          <stop offset="1" stop-color="#e6b96c" />
        </radialGradient>
        <radialGradient id="hwMoonGlow">
          <stop offset="0" stop-color="#ffe6ad" stop-opacity="0.55" />
          <stop offset="0.45" stop-color="#ffbe6b" stop-opacity="0.16" />
          <stop offset="1" stop-color="#ffbe6b" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="hwHillFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#241130" />
          <stop offset="1" stop-color="#100818" />
        </linearGradient>
        <linearGradient id="hwHillMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#170b21" />
          <stop offset="1" stop-color="#08040e" />
        </linearGradient>
        <linearGradient id="hwGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0d0615" />
          <stop offset="1" stop-color="#040207" />
        </linearGradient>
        <radialGradient id="hwPumpkin">
          <stop offset="0" stop-color="#ffb95a" />
          <stop offset="0.5" stop-color="#f07a0f" />
          <stop offset="1" stop-color="#9d3605" />
        </radialGradient>
        <radialGradient id="hwWindow">
          <stop offset="0" stop-color="#ffe6a3" />
          <stop offset="0.55" stop-color="#ffb24a" />
          <stop offset="1" stop-color="#d95f08" stop-opacity="0.55" />
        </radialGradient>
        <radialGradient id="hwFog">
          <stop offset="0" stop-color="#b99ae8" stop-opacity="0.36" />
          <stop offset="1" stop-color="#b99ae8" stop-opacity="0" />
        </radialGradient>
        <filter id="hwGlow" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="hwBlur12" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id="hwBlur18" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <symbol id="hwBat" viewBox="0 0 64 28">
          <path d="M32 14 C28 6 20 2 12 4 C14 6 14 8 12 10 C16 9 20 10 22 13 C19 12 16 13 14 15 C19 16 23 18 25 21 C27 19 29 18 32 18 C35 18 37 19 39 21 C41 18 45 16 50 15 C48 13 45 12 42 13 C44 10 48 9 52 10 C50 8 50 6 52 4 C44 2 36 6 32 14Z" />
          <ellipse cx="32" cy="17" rx="4.4" ry="5.5" />
          <path d="M28 12 L26 8 L31 10Z M36 12 L38 8 L33 10Z" />
        </symbol>
      </defs>

      <rect width="1200" height="250" fill="url(#hwSky)" />
      <g class="hw-stars">${stars()}</g>

      <circle class="hw-moon-glow" cx="1002" cy="64" r="122" fill="url(#hwMoonGlow)" />
      <circle cx="1002" cy="64" r="41" fill="url(#hwMoon)" />
      <circle cx="990" cy="53" r="7.5" fill="#e9c37c" opacity=".55" />
      <circle cx="1015" cy="76" r="5" fill="#e9c37c" opacity=".45" />
      <circle cx="1019" cy="51" r="3.6" fill="#e9c37c" opacity=".5" />
      <circle cx="987" cy="78" r="3" fill="#e9c37c" opacity=".42" />

      <g filter="url(#hwBlur12)">
        ${cloud(280, 60, 1.05, 0.34)}
        ${cloud(780, 38, 0.8, 0.26)}
        ${cloud(1100, 100, 1.2, 0.2)}
      </g>

      ${bat(-40, 34, 23, 27, -4, 0.82)}
      ${bat(-40, 67, 31, 35, -17, 0.7)}
      ${bat(-40, 21, 17, 23, -9, 0.65)}
      ${bat(-40, 89, 25, 31, -25, 0.55)}
      ${bat(-40, 46, 15, 42, -33, 0.5)}
      <g fill="#08040c">
        <g transform="translate(846 28) scale(.5)" opacity=".85">
          <use href="#hwBat" width="64" height="28" />
        </g>
        <g transform="translate(1072 104) scale(.34) rotate(-8)" opacity=".7">
          <use href="#hwBat" width="64" height="28" />
        </g>
        <g transform="translate(756 42) scale(.37)" opacity=".62">
          <use href="#hwBat" width="64" height="28" />
        </g>
      </g>

      <path d="M0 188 C120 168 230 182 340 192 C470 204 540 176 660 184 C790 193 880 168 1000 182 C1100 194 1160 184 1200 188 L1200 250 L0 250Z" fill="url(#hwHillFar)" />
      <path d="M0 214 C130 198 260 210 390 218 C540 227 700 208 850 216 C1000 224 1100 210 1200 218 L1200 250 L0 250Z" fill="url(#hwHillMid)" />
      <ellipse cx="620" cy="214" rx="240" ry="30" fill="#9a6bd0" opacity=".1" filter="url(#hwBlur18)" />

      <path d="M0 228 C160 218 300 230 460 234 C640 238 800 224 980 232 C1090 236 1150 230 1200 234 L1200 250 L0 250Z" fill="url(#hwGround)" />

      <!-- Haunted house -->
      <g class="hw-house">
        <!-- mound and soft ground shadow -->
        <path d="M506 220 Q600 190 706 214 L724 250 L496 250Z" fill="#0b0615" />
        <ellipse cx="646" cy="220" rx="118" ry="12" fill="#030106" opacity=".55" filter="url(#hwBlur12)" />

        <!-- chimney rising from the roof slope -->
        <path d="M648 140 V78 H668 V157Z" fill="#050208" />
        <rect x="644" y="74" width="28" height="6" rx="1.5" fill="#0a0510" />
        <path d="M650 88 H666 M650 99 H666 M650 110 H666 M650 121 H666"
              stroke="#24122f" stroke-width="1" opacity=".85" />

        <!-- side wing, then the main house -->
        <path d="M676 214 V164 H744 V214Z" fill="#08040f" />
        <path d="M664 166 L710 138 L758 166Z" fill="#040207" />
        <path d="M664 166 L710 138 L758 166" fill="none" stroke="#1b0d27" stroke-width="1.2" opacity=".9" />

        <path d="M552 214 V158 H676 V214Z" fill="#0a0512" />
        <path d="M536 162 L612 96 L688 162Z" fill="#040207" />
        <path d="M536 162 L612 96 L688 162" fill="none" stroke="#1b0d27" stroke-width="1.3" opacity=".9" />
        <path d="M560 150 H664 M574 138 H650 M588 126 H636"
              stroke="#160b22" stroke-width="1" opacity=".7" />
        <path d="M534 162 H690" stroke="#030106" stroke-width="4" stroke-linecap="round" />
        <path d="M660 166 H762" stroke="#030106" stroke-width="4" stroke-linecap="round" />

        <!-- round attic window and eave trim -->
        <circle cx="612" cy="132" r="8.5" fill="#07110a" stroke="#2a1539" stroke-width="1.5" />
        <circle cx="612" cy="132" r="5.6" fill="#b7e88a" opacity=".92" filter="url(#hwGlow)" />
        <path d="M612 126.5 V137.5 M606.5 132 H617.5" stroke="#07110a" stroke-width="1.2" />
        <path d="M552 158 H676" stroke="#2a1539" stroke-width="1.5" opacity=".8" />

        <!-- windows with frames and sills -->
        <g fill="url(#hwWindow)" filter="url(#hwGlow)">
          <rect x="578" y="168" width="20" height="30" rx="9" />
          <rect x="626" y="168" width="20" height="30" rx="9" />
          <rect x="700" y="180" width="16" height="24" rx="8" />
        </g>
        <path d="M588 168 V198 M578 181 H598 M636 168 V198 M626 181 H646 M708 180 V204 M700 192 H716"
              stroke="#3a1b0c" stroke-width="1.6" opacity=".8" />
        <path d="M576 198 H600 M624 198 H648 M698 204 H718"
              stroke="#2a1539" stroke-width="1.4" opacity=".9" />

        <!-- door with a dark, unlit handle -->
        <path d="M604 214 V192 Q612 184 620 192 V214Z" fill="#030105" />
        <path d="M606 214 V193 Q612 187 618 193 V214" fill="none" stroke="#241126" stroke-width="1" opacity=".9" />
        <circle cx="617" cy="198" r="2.2" fill="#6b4a27" />
        <path d="M596 214 H628" stroke="#2a1539" stroke-width="1.5" opacity=".9" />
      </g>

      <!-- Graveyard -->
      <g fill="#1a1124" stroke="#2c1a39" stroke-width="1">
        <path d="M330 216 V184 Q330 173 342 173 Q354 173 354 184 V216Z" />
        <path d="M370 216 V194 Q370 186 379 186 Q388 186 388 194 V216Z" />
        <path d="M452 216 V180 Q452 170 463 170 Q474 170 474 180 V216Z" />
        <rect x="410" y="172" width="7" height="44" rx="1" fill="#160e1f" />
        <rect x="400" y="184" width="27" height="6" rx="1" fill="#160e1f" />
      </g>
      <g stroke="#3a2748" stroke-width="1" opacity=".65">
        <path d="M338 192 V202 M345 186 V201 M378 198 V208 M461 190 V201 M466 184 V197" />
      </g>

      <!-- Fence and cat -->
      <g stroke="#08040d" stroke-width="3" fill="none" opacity=".95">
        <path d="M716 214 V188 M732 214 V184 M748 214 V188 M764 214 V184 M780 214 V188 M796 214 V184 M812 214 V188 M828 214 V184" />
        <path d="M708 198 H836 M708 208 H836" />
        <path d="M716 181 L721 173 L726 181 M748 181 L753 173 L758 181 M780 181 L785 173 L790 181 M812 181 L817 173 L822 181" />
      </g>
      <g transform="translate(728 198)" fill="#050208">
        <path d="M0 0 Q-10 -1 -10 -14 Q-10 -30 4 -31 Q18 -30 18 -14 Q18 -1 8 0Z" />
        <path d="M-7 -31 L-9 -41 L-2 -36 Q4 -39 10 -36 L17 -41 L15 -31 Q9 -34 4 -34 Q-1 -34 -7 -31Z" />
        <path d="M17 -14 Q34 -10 36 -24 Q37 -28 40 -26 Q36 -6 19 -8Z" />
        <circle cx="-1" cy="-28" r="1.2" fill="#ffb45f" />
        <circle cx="8" cy="-28" r="1.2" fill="#ffb45f" />
      </g>

      <!-- Trees -->
      <g fill="none" stroke="#050208" stroke-linecap="round" stroke-linejoin="round">
        <!-- left tree -->
        <path d="M44 238 C48 184 34 146 10 116" stroke-width="10" />
        <path d="M43 188 C62 168 78 154 98 144" stroke-width="6" />
        <path d="M36 168 C18 152 8 136 2 118" stroke-width="5" />
        <path d="M49 146 C60 128 74 116 82 100" stroke-width="4" />
        <path d="M31 148 C20 138 12 128 6 114" stroke-width="3" />
        <path d="M62 168 C74 160 84 156 94 154" stroke-width="3" />
        <path d="M22 132 C16 120 14 110 14 100" stroke-width="2" />

        <!-- right tree: proper tapered trunk, branches and an owl perch -->
        <path d="M774 238 C776 220 778 202 782 186 C785 173 789 162 795 154 L803 154 C799 164 796 176 794 190 C791 206 790 222 792 238Z"
              fill="#050208" stroke="none" />
        <path d="M774 238 C766 236 758 233 750 229 M792 238 C800 236 810 233 818 229" stroke-width="5" />
        <path d="M782 230 C784 214 786 198 790 184 M790 230 C792 216 793 202 796 188"
              stroke="#160b21" stroke-width="1.4" opacity=".9" />
        <path d="M789 190 C778 178 768 164 762 150" stroke-width="7" />
        <path d="M792 186 C804 174 816 165 830 160" stroke-width="6" />
        <path d="M794 168 C786 154 780 140 778 126" stroke-width="5" />
        <path d="M798 156 C808 142 820 133 834 130" stroke-width="5" />
        <path d="M798 156 C798 138 802 121 808 108" stroke-width="5" />
        <path d="M783 205 C770 199 758 196 746 194" stroke-width="4" />
        <path d="M792 205 C806 199 818 197 830 197" stroke-width="4" />
        <path d="M762 150 C756 140 752 128 752 116" stroke-width="3" />
        <path d="M762 150 C760 142 768 138 778 136" stroke-width="3" />
        <path d="M830 160 C838 154 846 152 854 152" stroke-width="3" />
        <path d="M830 160 C830 150 828 140 830 132" stroke-width="2.5" />
        <path d="M778 126 C772 116 768 106 768 96" stroke-width="2.5" />
        <path d="M778 126 C786 118 792 112 802 110" stroke-width="2.5" />
        <path d="M834 130 C842 122 850 118 858 116" stroke-width="2.5" />
        <path d="M834 130 C834 120 830 110 832 102" stroke-width="2.5" />
        <path d="M808 108 C802 98 800 88 800 78" stroke-width="2.5" />
        <path d="M808 108 C816 100 826 94 836 92" stroke-width="2" />
        <path d="M746 194 C740 186 738 178 738 170" stroke-width="2" />
        <path d="M830 197 C838 192 846 190 854 190" stroke-width="2" />
        <path d="M792 166 C806 164 822 162 838 162 C846 162 854 159 860 156" stroke-width="6" />
        <path d="M850 160 C854 154 860 150 866 148" stroke-width="2.5" />

        <!-- far edge tree -->
        <path d="M1178 238 C1170 208 1180 182 1196 160" stroke-width="8" />
        <path d="M1183 208 C1168 196 1160 184 1156 172" stroke-width="3" />
        <path d="M1188 190 C1200 182 1206 172 1210 160" stroke-width="3" />
      </g>
      ${owl()}

      <!-- Pumpkins -->
      <ellipse cx="990" cy="226" rx="212" ry="12" fill="#ff8a1e" opacity=".09" filter="url(#hwBlur12)" />
      ${pumpkin(838, 208, 0.46)}
      ${pumpkin(1002, 188, 1.12)}
      ${pumpkin(1115, 202, 0.68)}
      ${pumpkin(892, 197, 0.84)}
      ${pumpkin(1158, 205, 0.5)}
      <g transform="translate(936 220)">
        <rect x="-4" y="-18" width="8" height="20" rx="2" fill="#e3cba4" opacity=".9" />
        <path d="M0 -27 C6 -20 5 -14 0 -13 C-5 -15 -5 -21 0 -27Z" fill="#ffd36a" filter="url(#hwGlow)" class="hw-pumpkin-glow" />
      </g>

      <!-- Low mist -->
      <g class="hw-fog-a" opacity=".34" filter="url(#hwBlur12)">
        <path d="M-120 222 Q80 206 260 218 T620 216 T980 220 T1320 212 L1320 260 L-120 260Z" fill="url(#hwFog)" />
      </g>
      <g class="hw-fog-b" opacity=".22" filter="url(#hwBlur18)">
        <path d="M-120 236 Q160 222 380 232 T760 230 T1100 236 T1320 228 L1320 260 L-120 260Z" fill="#e0c8ff" />
      </g>

      <!-- Cobwebs -->
      <g opacity=".2" fill="none" stroke="#e8d9ff" stroke-width="1.1" stroke-linecap="round">
        <g transform="translate(0 0)">${webPath(178, 7, 5)}</g>
        <g transform="translate(1200 0) scale(-1 1)">${webPath(178, 7, 5)}</g>
      </g>
    </svg>`;
  }

  function winterStars() {
    let out = "";
    for (let i = 0; i < 60; i += 1) {
      const x = (i * 211 + 61) % 1200;
      const y = (i * 47 + 9) % 150;
      const r = 0.5 + ((i * 7) % 10) / 14;
      const delay = ((i * 13) % 40) / 10;
      const opacity = 0.25 + ((i * 17) % 55) / 100;
      out += `<circle class="hw-star" cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="#eaf6ff" opacity="${opacity.toFixed(2)}" style="animation-delay:${delay}s" />`;
    }
    return out;
  }

  function snowflakeSvg() {
    let arms = "";
    for (let i = 0; i < 6; i += 1) {
      arms += `<g transform="rotate(${i * 60} 90 90)">
        <path d="M90 90 V38 M90 54 L78 44 M90 54 L102 44 M90 72 L80 64 M90 72 L100 64" />
      </g>`;
    }
    return `<svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true" focusable="false">${arms}<circle cx="90" cy="90" r="4" /></svg>`;
  }

  const WINTER_COPY = {
    ru: [
      { kicker: "декабрь · время чудес", title: "Рождество", sub: "Тёплые песни для снежных вечеров" },
    { kicker: "зима · волшебство", title: "Зимняя сказка", sub: "Плейлисты, которые согревают" },
    { kicker: "25 декабря · светлый праздник", title: "С Рождеством", sub: "Музыка под мерцание гирлянд" },
    { kicker: "декабрь · ожидание чуда", title: "Чудеса рядом", sub: "Снег за окном, любимые песни внутри" },
    { kicker: "зимний вечер · тепло и свет", title: "У камина", sub: "Мелодии для тихих снежных вечеров" },
    { kicker: "январь · новые надежды", title: "Новый год", sub: "Начни год с любимой музыки" },
    { kicker: "мороз · горячий чай", title: "Снежный вечер", sub: "Треки, от которых теплее" },
    { kicker: "рождественская ночь", title: "Тихая ночь", sub: "Спокойные песни для позднего вечера" },
    { kicker: "зима · время мечтать", title: "Зимние мечты", sub: "Плейлисты для долгих прогулок" },
    { kicker: "семья · тепло · уют", title: "Праздник дома", sub: "Музыка, которая ждёт тебя дома" },
    { kicker: "вечер · огни · уют", title: "Снегопад", sub: "Песни под шум снега за окном" },
    { kicker: "декабрь · гирлянды и свет", title: "Огни зимы", sub: "Светлые мелодии декабря" },
    { kicker: "дорога · снег · даль", title: "Зимняя дорога", sub: "Музыка для дороги домой" },
    { kicker: "рождественский вечер", title: "Сочельник", sub: "Тёплый свет и любимые песни" },
    { kicker: "зима · варежки · какао", title: "Зимний уют", sub: "Плейлисты для уютных вечеров" },
    { kicker: "январь · снег и звёзды", title: "Звёздная ночь", sub: "Мелодии под зимним небом" },
    { kicker: "праздничное утро", title: "Свет утра", sub: "Музыка, с которой начинается день" },
    { kicker: "декабрь · последний месяц", title: "В ожидании", sub: "Песни в предвкушении праздника" },
    { kicker: "мороз · тишина · свет", title: "Морозная ночь", sub: "Спокойные треки для тишины" },
    { kicker: "зима · дом · свечи", title: "Свечи и снег", sub: "Атмосфера тёплого вечера" },
    { kicker: "рождественские огни", title: "Огни ночи", sub: "Мелодии, которые светятся теплом" },
    { kicker: "лес · снег · тишина", title: "Зимний лес", sub: "Музыка для прогулок в тишине" },
    { kicker: "декабрь · чудеса · вера", title: "Время чудес", sub: "Плейлисты с зимним настроением" },
    { kicker: "новогодняя ночь", title: "Ночь чудес", sub: "Песни до самого утра" },
    { kicker: "снег · свет · уют", title: "Снежинки", sub: "Лёгкие мелодии для снежного дня" },
    { kicker: "праздник · семья · дом", title: "Вечер семьи", sub: "Музыка для близких и тёплых встреч" },
    { kicker: "январь · чистый лист", title: "Первый снег", sub: "Плейлисты для новых начинаний" },
    { kicker: "утро · кофе · снег", title: "Зимнее утро", sub: "Неспешные песни для начала дня" },
    { kicker: "рождественское чудо", title: "Сказка зимы", sub: "Музыка, в которую хочется верить" },
    { kicker: "декабрь · тёплый свет", title: "Тёплый вечер", sub: "Мелодии для долгих зимних вечеров" },
    { kicker: "зима · тепло · покой", title: "Камин и плед", sub: "Плейлисты для полного уюта" },
    { kicker: "мороз · звёзды · тишина", title: "Звёздный снег", sub: "Спокойные песни для ночи" },
    { kicker: "праздник · дом · свет", title: "Свет огней", sub: "Музыка для украшенного дома" },
    { kicker: "зима · уют · дом", title: "Снежный дом", sub: "Треки, которые согревают изнутри" },
    { kicker: "свечи · снег · тишина", title: "Вечер декабря", sub: "Мелодии для неспешного вечера" },
    { kicker: "рождественское утро", title: "Светлое утро", sub: "Светлые песни для праздничного дня" },
    { kicker: "зима · снег · склоны", title: "Зимние горы", sub: "Музыка для снежных приключений" },
    { kicker: "январь · новый старт", title: "Новые планы", sub: "Плейлисты для будущих побед" },
    { kicker: "ночь · огни · город", title: "Зимний город", sub: "Огни, снег и любимые песни" },
    { kicker: "декабрь · дом · волшебство", title: "Чудо зимы", sub: "Музыка, которая делает вечер тёплым" },
    ],
    en: [
      { kicker: "december · season of wonders", title: "Christmas", sub: "Warm songs for snowy evenings" },
      { kicker: "winter · magic", title: "Winter Tale", sub: "Playlists that keep you warm" },
      { kicker: "december 25 · a bright holiday", title: "Merry Xmas", sub: "Music under twinkling lights" },
      { kicker: "december · waiting for a miracle", title: "Magic Nearby", sub: "Snow outside, favourite songs inside" },
      { kicker: "winter evening · warmth and light", title: "By the Fire", sub: "Melodies for quiet snowy nights" },
      { kicker: "january · new hopes", title: "New Year", sub: "Start the year with your favourite music" },
      { kicker: "frost · hot tea", title: "Snowy Evening", sub: "Tracks that make you warmer" },
      { kicker: "christmas night", title: "Silent Night", sub: "Calm songs for a late evening" },
      { kicker: "winter · time to dream", title: "Winter Dreams", sub: "Playlists for long winter walks" },
      { kicker: "family · warmth · comfort", title: "Home Holiday", sub: "Music that waits for you at home" },
      { kicker: "evening · lights · comfort", title: "Snowfall", sub: "Songs to the sound of snow outside" },
      { kicker: "december · garlands and light", title: "Winter Lights", sub: "Bright melodies of December" },
      { kicker: "road · snow · distance", title: "Winter Road", sub: "Music for the way home" },
      { kicker: "christmas evening", title: "Christmas Eve", sub: "Warm light and favourite songs" },
      { kicker: "winter · mittens · cocoa", title: "Cozy Winter", sub: "Playlists for cosy evenings" },
      { kicker: "january · snow and stars", title: "Starry Night", sub: "Melodies under the winter sky" },
      { kicker: "festive morning", title: "Morning Light", sub: "Music to start the day with" },
      { kicker: "december · the last month", title: "Waiting", sub: "Songs full of anticipation" },
      { kicker: "frost · silence · light", title: "Frosty Night", sub: "Calm tracks for the quiet" },
      { kicker: "winter · home · candles", title: "Candlelight", sub: "The mood of a warm evening" },
      { kicker: "christmas lights", title: "Lights", sub: "Melodies glowing with warmth" },
      { kicker: "forest · snow · silence", title: "Winter Forest", sub: "Music for walks in the quiet" },
      { kicker: "december · miracles · faith", title: "Wonders", sub: "Playlists with a winter mood" },
      { kicker: "new year's night", title: "Wonder Night", sub: "Songs until the morning" },
      { kicker: "snow · light · comfort", title: "Snowflakes", sub: "Light melodies for a snowy day" },
      { kicker: "holiday · family · home", title: "Family Night", sub: "Music for close ones and warm meetings" },
      { kicker: "january · clean slate", title: "First Snow", sub: "Playlists for new beginnings" },
      { kicker: "morning · coffee · snow", title: "Snowy Morning", sub: "Unhurried songs to start the day" },
      { kicker: "christmas miracle", title: "Winter Magic", sub: "Music you want to believe in" },
      { kicker: "december · warm light", title: "Warm Evening", sub: "Melodies for long winter evenings" },
      { kicker: "winter · warmth · peace", title: "Blanket", sub: "Playlists for complete comfort" },
      { kicker: "frost · stars · silence", title: "Starry Snow", sub: "Calm songs for the night" },
      { kicker: "holiday · home · light", title: "Festive Glow", sub: "Music for a decorated home" },
      { kicker: "winter · comfort · home", title: "Snowy Home", sub: "Tracks that warm you from inside" },
      { kicker: "candles · snow · silence", title: "December", sub: "Melodies for an unhurried evening" },
      { kicker: "christmas morning", title: "Bright Morn", sub: "Bright songs for a festive day" },
      { kicker: "winter · snow · slopes", title: "Winter Peaks", sub: "Music for snowy adventures" },
      { kicker: "january · new start", title: "New Plans", sub: "Playlists for future wins" },
      { kicker: "night · lights · city", title: "Winter City", sub: "Lights, snow and favourite songs" },
      { kicker: "december · home · magic", title: "Miracle", sub: "Music that makes the evening warm" },
    ],
  };

  let winterCopy = WINTER_COPY[lang][0];
  let winterCopyDay = "";

  function winterCopyForToday() {
    const d = new Date();
    const day = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
    const key = String(day);
    if (key !== winterCopyDay) {
      winterCopyDay = key;
      winterCopy = WINTER_COPY[lang][Math.abs(day) % WINTER_COPY[lang].length];
    }
    return winterCopy;
  }

  function firForest(layer) {
    let far = "";
    let near = "";
    for (let i = 0; i < 44; i += 1) {
      const x = (i * 37 + 11) % 1200;
      const h = 30 + ((i * 17) % 48);
      const w = h * 0.44;
      const base = 214 - ((i * 11) % 8);
      far += `<path d="M${x} ${base} L${(x - w).toFixed(1)} ${base} L${x} ${(base - h).toFixed(1)} L${(x + w).toFixed(1)} ${base}Z" />`;
    }
    for (let i = 0; i < 30; i += 1) {
      const x = (i * 53 + 29) % 1200;
      const h = 44 + ((i * 19) % 64);
      const w = h * 0.46;
      const base = 232 - ((i * 7) % 10);
      near += `<path d="M${x} ${base} L${(x - w).toFixed(1)} ${base} L${x} ${(base - h).toFixed(1)} L${(x + w).toFixed(1)} ${base}Z" />`;
    }
    if (layer === "far") return `<g class="xw-forest-far" fill="#0b2134" opacity="0.75">${far}</g>`;
    if (layer === "near") return `<g class="xw-forest-near" fill="#06121f" opacity="0.92">${near}</g>`;
    return `<g class="xw-forest-far" fill="#0b2134" opacity="0.75">${far}</g><g class="xw-forest-near" fill="#06121f" opacity="0.92">${near}</g>`;
  }

  function garland() {
    const tiers = [
      { a: [960, 126], c1: [969, 134], b: [980, 128], c2: [991, 122], d: [1000, 128] },
      { a: [950, 160], c1: [964, 170], b: [978, 164], c2: [998, 158], d: [1016, 164] },
      { a: [940, 198], c1: [956, 210], b: [978, 204], c2: [1006, 198], d: [1030, 204] },
    ];
    const palette = ["#ffd76a", "#ff6b6b", "#8fd4ff", "#ff9f6a", "#b58cff", "#7fe6c8"];
    const point = (a, c, b, t) => {
      const mt = 1 - t;
      return [
        mt * mt * a[0] + 2 * mt * t * c[0] + t * t * b[0],
        mt * mt * a[1] + 2 * mt * t * c[1] + t * t * b[1],
      ];
    };

    let bulbs = "";
    let index = 0;
    for (const tier of tiers) {
      const points = [];
      for (let i = 0; i <= 6; i += 1) points.push(point(tier.a, tier.c1, tier.b, i / 6));
      for (let i = 1; i <= 6; i += 1) points.push(point(tier.b, tier.c2, tier.d, i / 6));
      for (const [x, y] of points) {
        const color = palette[index % palette.length];
        const phase = index % 2 === 0 ? "xw-bulb-a" : "xw-bulb-b";
        bulbs += `<g class="xw-bulb ${phase}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="${color}" opacity="0.18" /><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" fill="${color}" /></g>`;
        index += 1;
      }
    }

    return `<g class="xw-garland" clip-path="url(#xwTreeClip)">
      <g fill="none" stroke="#d9c08a" stroke-width="1" opacity="0.5">
        <path d="M960 126 Q969 134 980 128 Q991 122 1000 128" />
        <path d="M950 160 Q964 170 978 164 Q998 158 1016 164" />
        <path d="M940 198 Q956 210 978 204 Q1006 198 1030 204" />
      </g>
      <g filter="url(#xwGlow)">${bulbs}</g>
    </g>`;
  }

  function gifts() {
    return `<g class="xw-gifts">
      <g transform="translate(936 234)">
        <rect x="-16" y="-16" width="32" height="20" rx="2" fill="#b8323a" />
        <rect x="-16" y="-16" width="32" height="20" rx="2" fill="none" stroke="#e8b45a" stroke-width="1.2" />
        <path d="M0 -16 V4 M-16 -6 H16" stroke="#e8b45a" stroke-width="2" />
        <path d="M-8 -16 C-12 -24 -2 -26 0 -18 C2 -26 12 -24 8 -16Z" fill="#e8b45a" />
      </g>
      <g transform="translate(1006 232)">
        <rect x="-18" y="-18" width="36" height="22" rx="2" fill="#1d6b4d" />
        <rect x="-18" y="-18" width="36" height="22" rx="2" fill="none" stroke="#e8b45a" stroke-width="1.2" />
        <path d="M0 -18 V4 M-18 -7 H18" stroke="#e8b45a" stroke-width="2" />
        <path d="M-9 -18 C-13 -27 -3 -29 0 -20 C3 -29 13 -27 9 -18Z" fill="#e8b45a" />
      </g>
      <g transform="translate(974 240)">
        <rect x="-13" y="-13" width="26" height="16" rx="2" fill="#d9a94a" />
        <rect x="-13" y="-13" width="26" height="16" rx="2" fill="none" stroke="#fff1d2" stroke-width="1.2" />
        <path d="M0 -13 V3 M-13 -5 H13" stroke="#b8323a" stroke-width="2" />
        <path d="M-7 -13 C-10 -20 -2 -22 0 -15 C2 -22 10 -20 7 -13Z" fill="#b8323a" />
      </g>
    </g>`;
  }

  function winterTown() {
    return `<g class="xw-town">
      <ellipse cx="250" cy="206" rx="280" ry="34" fill="#a9d4ff" opacity="0.06" filter="url(#xwBlur)" />
      <ellipse cx="240" cy="200" rx="220" ry="24" fill="#ffcf6b" opacity="0.04" filter="url(#xwBlur)" />
      <g fill="#16344f" opacity="0.9">
        <path d="M18 210 V184 H62 V210Z" />
        <path d="M12 184 L40 168 L68 184Z" />
        <path d="M78 210 V194 H112 V210Z" />
        <rect x="74" y="191" width="42" height="4" rx="1" />
        <path d="M128 210 V170 H162 V210Z" />
        <path d="M122 170 L145 148 L168 170Z" />
        <rect x="138" y="122" width="14" height="48" />
        <path d="M136 122 L145 102 L154 122Z" />
        <path d="M145 102 V92 M140 97 H150" fill="none" stroke="#16344f" stroke-width="2" />
        <path d="M176 210 V190 H216 V210Z" />
        <path d="M170 190 L196 176 L222 190Z" />
        <path d="M230 210 V142 H258 V210Z" />
        <path d="M224 142 L244 126 L264 142Z" />
        <circle cx="244" cy="156" r="5" fill="#e8f5ff" opacity="0.35" />
        <path d="M270 210 V176 H316 V210Z" />
        <path d="M264 176 L293 160 L322 176Z" />
        <path d="M330 210 V196 H380 V210Z" />
        <path d="M324 196 L355 180 L386 196Z" />
        <path d="M392 210 V170 H440 V210Z" />
        <path d="M386 170 L416 154 L446 170Z" />
        <path d="M450 210 V186 H486 V210Z" />
        <path d="M444 186 L468 172 L492 186Z" />
      </g>
      <g fill="#ffcf6b" opacity="0.75" filter="url(#xwGlow)">
        <rect x="28" y="192" width="4" height="5" />
        <rect x="48" y="192" width="4" height="5" />
        <rect x="86" y="198" width="4" height="5" />
        <rect x="100" y="198" width="4" height="5" />
        <rect x="136" y="180" width="4" height="5" />
        <rect x="146" y="132" width="4" height="5" />
        <rect x="184" y="196" width="4" height="5" />
        <rect x="202" y="196" width="4" height="5" />
        <rect x="236" y="158" width="4" height="5" />
        <rect x="248" y="158" width="4" height="5" />
        <rect x="278" y="188" width="4" height="5" />
        <rect x="300" y="188" width="4" height="5" fill="#b58cff" />
        <rect x="338" y="200" width="4" height="5" />
        <rect x="360" y="200" width="4" height="5" />
        <rect x="400" y="182" width="4" height="5" fill="#b58cff" />
        <rect x="420" y="182" width="4" height="5" />
        <rect x="458" y="194" width="4" height="5" />
        <rect x="474" y="194" width="4" height="5" />
      </g>
    </g>`;
  }

  function welcomeSign() {
    return `<g class="xw-welcome-sign">
      <path d="M634 236 V180" stroke="#3b2a1b" stroke-width="5" stroke-linecap="round" />
      <path d="M688 236 V180" stroke="#3b2a1b" stroke-width="5" stroke-linecap="round" />
      <path d="M688 180 H634" stroke="#3b2a1b" stroke-width="4" stroke-linecap="round" />
      <path d="M688 188 L662 180" stroke="#3b2a1b" stroke-width="2" stroke-linecap="round" />
      <path d="M672 236 C678 232 686 236 692 236 L692 240 H672Z" fill="#e8f5ff" opacity="0.9" />
      <g class="xw-sign">
        <path d="M646 180 V190 M674 180 V190" stroke="#d9c08a" stroke-width="1" />
        <rect x="638" y="190" width="46" height="26" rx="2" fill="#4a3524" stroke="#2a1a12" stroke-width="1.2" />
        <path d="M638 190 C646 185 656 192 663 188 C670 184 676 189 684 190 L684 194 C676 190 668 196 660 193 C652 190 644 196 638 194Z" fill="#e8f5ff" opacity="0.9" />
        <text x="661" y="208" text-anchor="middle" font-family="Georgia, serif" font-size="10.5" fill="#f6ead3" letter-spacing="0.4">Welcome</text>
        <circle cx="644" cy="212" r="1.1" fill="#e8f5ff" opacity="0.7" />
        <circle cx="678" cy="214" r="0.9" fill="#e8f5ff" opacity="0.6" />
      </g>
    </g>`;
  }

  function winterSceneSvg() {
    return `<svg viewBox="0 0 1200 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="xwSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#030814" />
          <stop offset="0.45" stop-color="#07182c" />
          <stop offset="0.75" stop-color="#0e2c46" />
          <stop offset="1" stop-color="#06101d" />
        </linearGradient>
        <linearGradient id="xwAurora" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#6fe3c0" stop-opacity="0" />
          <stop offset="0.35" stop-color="#7fe6c8" stop-opacity="0.7" />
          <stop offset="0.7" stop-color="#8fd4ff" stop-opacity="0.5" />
          <stop offset="1" stop-color="#8fd4ff" stop-opacity="0" />
        </linearGradient>
        <radialGradient id="xwMoon">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="0.6" stop-color="#eaf4ff" />
          <stop offset="1" stop-color="#b9d4ea" />
        </radialGradient>
        <radialGradient id="xwMoonGlow">
          <stop offset="0" stop-color="#dff0ff" stop-opacity="0.55" />
          <stop offset="0.5" stop-color="#a9d4ff" stop-opacity="0.16" />
          <stop offset="1" stop-color="#a9d4ff" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="xwHillFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#163a58" />
          <stop offset="1" stop-color="#0a1d30" />
        </linearGradient>
        <linearGradient id="xwHillMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0d2740" />
          <stop offset="1" stop-color="#06121f" />
        </linearGradient>
        <linearGradient id="xwSnow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e8f5ff" />
          <stop offset="1" stop-color="#9fc4de" />
        </linearGradient>
        <linearGradient id="xwTree" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1c6b4d" />
          <stop offset="1" stop-color="#0a3327" />
        </linearGradient>
        <clipPath id="xwTreeClip">
          <path d="M980 92 L944 146 H956 L924 188 H940 L906 230 H1054 L1020 188 H1036 L1004 146 H1016Z" />
        </clipPath>
        <radialGradient id="xwWindow">
          <stop offset="0" stop-color="#fff3c4" />
          <stop offset="0.55" stop-color="#ffcf6b" />
          <stop offset="1" stop-color="#e08a24" stop-opacity="0.6" />
        </radialGradient>
        <radialGradient id="xwLanternGlow">
          <stop offset="0" stop-color="#ffd76a" stop-opacity="0.8" />
          <stop offset="0.5" stop-color="#ffb347" stop-opacity="0.25" />
          <stop offset="1" stop-color="#ffb347" stop-opacity="0" />
        </radialGradient>
        <filter id="xwSmoke" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <filter id="xwGlow" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="xwBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      <rect width="1200" height="250" fill="url(#xwSky)" />
      <g class="hw-stars">${winterStars()}</g>

      <g filter="url(#xwBlur)" opacity="0.5">
        <path d="M-80 92 C180 30 330 120 560 68 C760 22 930 112 1280 48" fill="none" stroke="url(#xwAurora)" stroke-width="54" stroke-linecap="round" />
        <path d="M-80 130 C160 70 360 150 620 104 C840 66 1010 140 1280 92" fill="none" stroke="url(#xwAurora)" stroke-width="30" stroke-linecap="round" opacity="0.7" />
      </g>

      <circle cx="1010" cy="62" r="118" fill="url(#xwMoonGlow)" />
      <circle cx="1010" cy="62" r="38" fill="url(#xwMoon)" />
      <circle cx="998" cy="52" r="7" fill="#cfe4f5" opacity="0.55" />
      <circle cx="1022" cy="72" r="5" fill="#cfe4f5" opacity="0.45" />
      <circle cx="1024" cy="50" r="3.4" fill="#cfe4f5" opacity="0.5" />

      <path d="M0 186 C140 160 260 178 400 190 C560 204 700 168 860 180 C1000 190 1100 172 1200 182 L1200 250 L0 250Z" fill="url(#xwHillFar)" />
      <path d="M0 214 C150 192 300 210 460 220 C620 230 780 200 940 212 C1060 221 1140 212 1200 216 L1200 250 L0 250Z" fill="url(#xwHillMid)" />

      ${firForest("far")}
      ${winterTown()}
      ${firForest("near")}

      <path d="M0 224 C120 210 260 228 420 232 C600 236 760 218 940 226 C1060 231 1140 224 1200 228 L1200 250 L0 250Z" fill="url(#xwSnow)" opacity="0.9" />

      <!-- Log cabin -->
      <g>
        <ellipse cx="800" cy="230" rx="112" ry="10" fill="#02060d" opacity="0.45" filter="url(#xwBlur)" />

        <!-- Chimney sits behind the roof -->
        <path d="M846 160 V104 H866 V160Z" fill="#2a1a12" />
        <path d="M846 120 H866 M846 136 H866 M846 152 H866" stroke="#3b2518" stroke-width="1.2" opacity="0.8" />
        <path d="M842 104 H870 L866 98 H846Z" fill="#e8f5ff" opacity="0.95" />

        <!-- Log walls -->
        <path d="M724 226 V178 H876 V226Z" fill="#2a1a12" />
        <path d="M724 186 H876 M724 194 H876 M724 202 H876 M724 210 H876 M724 218 H876" stroke="#3b2518" stroke-width="1.4" opacity="0.85" />
        <g fill="#1a0f09">
          <circle cx="724" cy="186" r="2.2" /><circle cx="724" cy="194" r="2.2" /><circle cx="724" cy="202" r="2.2" /><circle cx="724" cy="210" r="2.2" /><circle cx="724" cy="218" r="2.2" />
          <circle cx="876" cy="186" r="2.2" /><circle cx="876" cy="194" r="2.2" /><circle cx="876" cy="202" r="2.2" /><circle cx="876" cy="210" r="2.2" /><circle cx="876" cy="218" r="2.2" />
        </g>

        <!-- Pitched roof under a snow layer -->
        <path d="M712 184 L800 132 L888 184Z" fill="#102b45" />
        <path d="M704 182 L800 122 L896 182 L884 178 L872 186 L856 180 L840 188 L824 182 L808 190 L792 184 L776 190 L760 182 L744 188 L728 180 L716 186Z" fill="#e8f5ff" opacity="0.96" />
        <path d="M708 184 H892" stroke="#07131f" stroke-width="5" stroke-linecap="round" />
        <path d="M736 184 L800 140 L864 184" fill="none" stroke="#dceeff" stroke-width="1.2" opacity="0.55" />
        <path d="M716 184 L719 194 L722 184 M744 184 L747 192 L750 184 M772 184 L775 196 L778 184 M820 184 L823 193 L826 184 M852 184 L855 195 L858 184 M880 184 L883 191 L886 184"
              fill="#dceeff" opacity="0.8" />

        <!-- Attic window -->
        <circle cx="800" cy="158" r="7" fill="#07131f" stroke="#3b2518" stroke-width="1.5" />
        <circle cx="800" cy="158" r="4.5" fill="url(#xwWindow)" filter="url(#xwGlow)" />
        <path d="M800 153.5 V162.5 M795.5 158 H804.5" stroke="#07131f" stroke-width="1" />

        <!-- Windows, shutters and snow sills -->
        <g fill="url(#xwWindow)" filter="url(#xwGlow)">
          <rect x="738" y="194" width="22" height="24" rx="2" />
          <rect x="840" y="194" width="22" height="24" rx="2" />
        </g>
        <path d="M749 194 V218 M738 206 H760 M851 194 V218 M840 206 H862" stroke="#3b2518" stroke-width="1.4" opacity="0.9" />
        <path d="M736 218 H762 M838 218 H864" stroke="#e8f5ff" stroke-width="2.5" stroke-linecap="round" />
        <path d="M732 194 H736 V218 H732Z M762 194 H766 V218 H762Z M834 194 H838 V218 H834Z M864 194 H868 V218 H864Z" fill="#143a2c" opacity="0.9" />

        <!-- Door, wreath and porch light -->
        <path d="M786 226 V198 Q800 190 814 198 V226Z" fill="#3b2518" />
        <path d="M788 226 V199 Q800 192 812 199 V226" fill="none" stroke="#1a0f09" stroke-width="1.5" />
        <circle cx="809" cy="212" r="1.6" fill="#e8b45a" />
        <circle cx="800" cy="207" r="4.5" fill="none" stroke="#1d6b4d" stroke-width="2" />
        <circle cx="800" cy="207" r="4.5" fill="none" stroke="#2a8a63" stroke-width="0.7" opacity="0.8" />
        <path d="M800 211 L797 215 M800 211 L803 215" stroke="#b8323a" stroke-width="1.6" stroke-linecap="round" />
        <circle cx="776" cy="202" r="9" fill="url(#xwLanternGlow)" opacity="0.6" />
        <rect x="773" y="200" width="6" height="8" rx="1" fill="#ffd76a" filter="url(#xwGlow)" class="xw-lantern-flame" />

        <!-- Snow drift at the base -->
        <path d="M714 226 C740 220 770 228 800 226 C830 224 860 220 886 226 L886 232 H714Z" fill="#e8f5ff" opacity="0.9" />

        <!-- Soft chimney smoke -->
        <g class="xw-smoke" fill="#cfe4f5" filter="url(#xwSmoke)">
          <circle cx="856" cy="92" r="7" opacity="0.34" />
          <circle cx="866" cy="78" r="9" opacity="0.28" />
          <circle cx="880" cy="62" r="11" opacity="0.22" />
          <circle cx="896" cy="46" r="13" opacity="0.16" />
          <circle cx="914" cy="30" r="15" opacity="0.1" />
        </g>
      </g>

      <!-- Christmas tree with a multicoloured garland -->
      <g>
        <ellipse cx="980" cy="230" rx="86" ry="9" fill="#02060d" opacity="0.4" filter="url(#xwBlur)" />
        <rect x="974" y="212" width="12" height="20" rx="2" fill="#3b2a1b" />
        <path d="M980 92 L944 146 H956 L924 188 H940 L906 230 H1054 L1020 188 H1036 L1004 146 H1016Z" fill="url(#xwTree)" />
        <path d="M980 92 L958 128 H970 L944 168 H958 L930 210 H952 L940 224 H1020 L1008 210 H1030 L1002 168 H1016 L990 128Z" fill="#2a8a63" opacity="0.28" />
        <path d="M980 70 L983 78 L991 79 L985 84 L987 92 L980 87 L973 92 L975 84 L969 79 L977 78Z" fill="#ffd76a" filter="url(#xwGlow)" />
        <g class="xw-ornaments" clip-path="url(#xwTreeClip)" filter="url(#xwGlow)">
          <circle cx="952" cy="136" r="3.6" fill="#ffd76a" />
          <circle cx="990" cy="142" r="3.6" fill="#ff5b5b" />
          <circle cx="966" cy="150" r="4" fill="#ff5b5b" />
          <circle cx="1010" cy="158" r="3.4" fill="#b58cff" />
          <circle cx="958" cy="174" r="3.8" fill="#ffd76a" />
          <circle cx="1002" cy="182" r="4.2" fill="#ffd76a" />
          <circle cx="990" cy="196" r="3.6" fill="#ff5b5b" />
          <circle cx="942" cy="200" r="3.5" fill="#ffd76a" />
          <circle cx="1024" cy="200" r="3.4" fill="#ff5b5b" />
          <circle cx="1020" cy="214" r="4" fill="#ff5b5b" />
          <circle cx="960" cy="220" r="3.5" fill="#ffd76a" />
          <circle cx="1004" cy="224" r="3.4" fill="#b58cff" />
        </g>
        ${garland()}
        ${gifts()}
      </g>

      ${welcomeSign()}

      <path d="M0 240 C160 230 300 244 470 242 C660 240 820 228 1000 238 C1090 243 1150 238 1200 240 L1200 250 L0 250Z" fill="#f2faff" opacity="0.75" />

      <g fill="#eaf6ff" opacity="0.65">
        <circle cx="120" cy="60" r="1.2" />
        <circle cx="240" cy="120" r="1.6" />
        <circle cx="380" cy="48" r="1.1" />
        <circle cx="520" cy="98" r="1.4" />
        <circle cx="660" cy="40" r="1.2" />
        <circle cx="760" cy="110" r="1.5" />
        <circle cx="880" cy="58" r="1.1" />
        <circle cx="1090" cy="132" r="1.3" />
        <circle cx="1150" cy="76" r="1.5" />
      </g>
    </svg>`;
  }

  // ----------------------------------------------------------
  // DOM pieces
  // ----------------------------------------------------------

  function buildBanner() {
    const banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.setAttribute("role", "img");
    banner.setAttribute("aria-label", t("halloweenAria"));
    banner.innerHTML = `
      <div class="hw-banner-art">${sceneSvg()}</div>
      <div class="hw-banner-copy">
        <span class="hw-banner-kicker">${t("halloweenKicker")}</span>
        <span class="hw-banner-title">${t("halloweenTitle")}</span>
        <span class="hw-banner-sub">${t("halloweenSub")}</span>
        <span class="hw-banner-sigil"><span>✦</span> ${t("halloweenSigil")}</span>
      </div>
      <div class="hw-banner-spider">${spiderSvg()}</div>
    `;
    return banner;
  }

  function decorMarkup() {
    return `
      <div class="hw-corner-web tr" aria-hidden="true">${webSvg(180)}</div>
      <div class="hw-corner-web bl" aria-hidden="true">${webSvg(180)}</div>
      <div class="hw-hanging-spider" aria-hidden="true">${spiderSvg()}</div>
    `;
  }

  function buildWinterBanner() {
    const banner = document.createElement("div");
    banner.id = WINTER_BANNER_ID;
    banner.setAttribute("role", "img");
    banner.setAttribute("aria-label", t("winterAria"));
    const copy = winterCopyForToday();
    banner.innerHTML = `
      <div class="hw-banner-art">${winterSceneSvg()}</div>
      <div class="hw-banner-copy">
        <span class="hw-banner-kicker">${copy.kicker}</span>
        <span class="hw-banner-title">${copy.title}</span>
        <span class="hw-banner-sub">${copy.sub}</span>
        <span class="hw-banner-sigil"><span>❄</span> ${t("winterSigil")}</span>
      </div>
    `;
    return banner;
  }

  function winterDecorMarkup() {
    return `
      <div class="xw-frost tr" aria-hidden="true">${snowflakeSvg()}</div>
      <div class="xw-frost bl" aria-hidden="true">${snowflakeSvg()}</div>
    `;
  }

  // ----------------------------------------------------------
  // Placement
  // ----------------------------------------------------------

  const ROUTE_CLASSES = [
    "hw-route-home",
    "hw-route-playlist",
    "hw-route-album",
    "hw-route-artist",
    "hw-route-search",
    "hw-route-other",
  ];

  function syncRouteClass() {
    let path = "";
    try {
      path = window.Spicetify?.Platform?.History?.location?.pathname || "";
    } catch (_) {
      path = "";
    }
    if (!path) path = location.pathname;

    let kind = "other";
    if (path.startsWith("/playlist/")) kind = "playlist";
    else if (path.startsWith("/album/")) kind = "album";
    else if (path.startsWith("/artist/")) kind = "artist";
    else if (path.startsWith("/search")) kind = "search";
    else if (path === "/" || path === "" || path.endsWith("/index.html")) kind = "home";

    const next = `hw-route-${kind}`;
    for (const cls of ROUTE_CLASSES) {
      if (cls !== next) document.body.classList.remove(cls);
    }
    document.body.classList.add(next);
  }

  function ensureHome() {
    const section = document.querySelector('[data-testid="home-page"]');
    document.body.classList.toggle("hw-home", Boolean(section));

    if (!section || !section.parentElement) {
      document.getElementById(BANNER_ID)?.remove();
      document.getElementById(WINTER_BANNER_ID)?.remove();
      return;
    }

    const parent = section.parentElement;

    if (winterOn) {
      document.getElementById(BANNER_ID)?.remove();
      let banner = document.getElementById(WINTER_BANNER_ID);
      if (!banner) {
        if (!winterBannerNode) winterBannerNode = buildWinterBanner();
        banner = winterBannerNode;
      }
      if (banner.parentElement !== parent || banner.nextElementSibling !== section) {
        try {
          parent.insertBefore(banner, section);
        } catch (_) {
          // React may be in the middle of a render; the next tick retries.
        }
      }
      return;
    }

    document.getElementById(WINTER_BANNER_ID)?.remove();
    let banner = document.getElementById(BANNER_ID);
    if (!banner) {
      if (!bannerNode) bannerNode = buildBanner();
      banner = bannerNode;
    }
    if (banner.parentElement !== parent || banner.nextElementSibling !== section) {
      try {
        parent.insertBefore(banner, section);
      } catch (_) {
        // React may be in the middle of a render; the next tick retries.
      }
    }
  }

  function ensureDecor() {
    const main = document.getElementById("main-view");
    if (!main) return;

    if (!document.getElementById(DECOR_ID)) {
      const decor = document.createElement("div");
      decor.id = DECOR_ID;
      decor.setAttribute("aria-hidden", "true");
      decor.innerHTML = decorMarkup();
      main.appendChild(decor);
    }
  }

  function ensureSidebarDecor() {
    const sidebar = document.querySelector(".s8fIIxwITjOk1aFOxhPv");
    if (!sidebar) return;

    if (!document.getElementById(SIDEBAR_DECOR_ID)) {
      const decor = document.createElement("div");
      decor.id = SIDEBAR_DECOR_ID;
      decor.setAttribute("aria-hidden", "true");
      decor.innerHTML = webSvg(150);
      sidebar.appendChild(decor);
    }
  }

  function ensureWinterDecor() {
    const main = document.getElementById("main-view");
    if (!main) return;

    if (!document.getElementById(WINTER_DECOR_ID)) {
      const decor = document.createElement("div");
      decor.id = WINTER_DECOR_ID;
      decor.setAttribute("aria-hidden", "true");
      decor.innerHTML = winterDecorMarkup();
      main.appendChild(decor);
    }
  }

  function ensureWinterSidebarDecor() {
    const sidebar = document.querySelector(".s8fIIxwITjOk1aFOxhPv");
    if (!sidebar) return;

    if (!document.getElementById(WINTER_SIDEBAR_ID)) {
      const decor = document.createElement("div");
      decor.id = WINTER_SIDEBAR_ID;
      decor.setAttribute("aria-hidden", "true");
      decor.innerHTML = snowflakeSvg();
      sidebar.appendChild(decor);
    }
  }

  function ensureSnow() {
    if (document.getElementById(SNOW_ID)) return;

    const layer = document.createElement("div");
    layer.id = SNOW_ID;
    layer.setAttribute("aria-hidden", "true");

    const flakes = [];
    for (let i = 0; i < 64; i += 1) {
      const size = 7 + Math.random() * 11;
      flakes.push(
        `<span class="xw-flake" style="--x:${(Math.random() * 100).toFixed(2)}%;` +
          `--s:${size.toFixed(1)}px;--o:${(0.35 + Math.random() * 0.55).toFixed(2)};` +
          `--d:${(9 + Math.random() * 13).toFixed(1)}s;--delay:${(-Math.random() * 20).toFixed(1)}s;` +
          `--drift:${(-70 + Math.random() * 140).toFixed(0)}px">❄</span>`
      );
    }
    layer.innerHTML = flakes.join("");
    document.body.appendChild(layer);
  }

  function ensure() {
    try {
      ensurePumpkin();
      ensureTree();
      ensureSettings();

      if (!themeOn) removeHalloweenDecorations();
      if (!winterOn) removeWinterDecorations();

      if (!themeOn && !winterOn) {
        document.body.classList.remove("hw-home");
        for (const cls of ROUTE_CLASSES) document.body.classList.remove(cls);
        return;
      }

      syncRouteClass();
      if (winterOn) {
        const before = winterCopyDay;
        winterCopyForToday();
        if (before && winterCopyDay !== before) {
          document.getElementById(WINTER_BANNER_ID)?.remove();
          winterBannerNode = null;
        }
      }
      ensureHome();
      if (themeOn) {
        ensureDecor();
        ensureSidebarDecor();
      }
      if (winterOn) {
        ensureWinterDecor();
        ensureWinterSidebarDecor();
        ensureSnow();
      }
    } catch (_) {
      // Keep the theme silent; Spotify re-renders frequently.
    }
  }

  // A capture listener survives Spotify re-rendering the nav and still sees
  // the click if a parent stops bubbling. The buttons stay native, so
  // Enter/Space keep working.
  document.addEventListener(
    "click",
    (event) => {
      if (!(event.target instanceof Element)) return;
      const settings = event.target.closest(`#${SETTINGS_ID}`);
      if (settings) {
        event.preventDefault();
        event.stopPropagation();
        toggleSettings();
        return;
      }
      const pumpkin = event.target.closest(`#${PUMPKIN_ID}`);
      const tree = event.target.closest(`#${TREE_ID}`);
      const target = pumpkin || tree;
      if (!target) return;

      const handledAt = keyboardHandledAt.get(target);
      if (handledAt && performance.now() - handledAt < 500) {
        keyboardHandledAt.delete(target);
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (target === pumpkin) applyTheme(!themeOn, true);
      else applyWinter(!winterOn, true);
    },
    true
  );

  // Close the settings panel on an outside click or Escape.
  document.addEventListener(
    "click",
    (event) => {
      if (!settingsOpen || !(event.target instanceof Element)) return;
      if (
        event.target.closest(`#${SETTINGS_ID}`) ||
        event.target.closest(`#${SETTINGS_PANEL_ID}`)
      ) {
        return;
      }
      setSettingsOpen(false);
    },
    true
  );

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && settingsOpen) setSettingsOpen(false);
  });

  // Every click gets a small snow puff while winter is on.
  document.addEventListener(
    "click",
    (event) => {
      if (!winterOn || !(event.target instanceof Element)) return;
      if (event.target.closest(`#${TREE_ID}`) || event.target.closest(`#${PUMPKIN_ID}`)) return;

      const now = performance.now();
      if (now - lastWinterBurst < 90) return;
      lastWinterBurst = now;

      let x = event.clientX;
      let y = event.clientY;
      if (!x && !y) {
        const rect = event.target.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
      spawnWinterBurst(x, y, false);
    },
    true
  );

  // Dev hooks: switch seasons without a click.
  window.__halloweenSetTheme = applyTheme;
  window.__halloweenToggleTheme = () => applyTheme(!themeOn, true);
  window.__winterSetTheme = applyWinter;
  window.__winterToggleTheme = () => applyWinter(!winterOn, true);

  window.__halloweenThemeCleanup = () => {
    if (window.__halloweenThemeTimer) {
      clearInterval(window.__halloweenThemeTimer);
      window.__halloweenThemeTimer = null;
    }
    removeDecorations();
    document.getElementById(PUMPKIN_ID)?.remove();
    document.getElementById(TREE_ID)?.remove();
    document.getElementById(SETTINGS_ID)?.remove();
    document.getElementById(SETTINGS_PANEL_ID)?.remove();
    settingsOpen = false;
    document.getElementById(FX_ID)?.remove();
    document.getElementById(WINTER_FX_ID)?.remove();
    document.documentElement.classList.remove(THEME_CLASS, WINTER_CLASS);
    bannerNode = null;
    winterBannerNode = null;
    window.__halloweenThemeLoaded = false;
  };

  ensure();

  if (window.__halloweenThemeTimer) clearInterval(window.__halloweenThemeTimer);
  window.__halloweenThemeTimer = setInterval(ensure, 900);

  // Re-check immediately after route-like UI changes.
  document.addEventListener("click", () => setTimeout(ensure, 60), true);
  window.addEventListener("popstate", () => setTimeout(ensure, 60));
})();
