(() => {
  "use strict";

  const HISTORY_KEY = "hassanBrowserHistory.v3";
  const SETTINGS_KEY = "hassanBrowserSettings.v2";
  const MAX_HISTORY = 30;
  const MAX_QUERY_LENGTH = 500;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const input = $("#website");
  const engine = $("#engine");
  const form = $("#searchForm");
  const historyList = $("#historyList");
  const clearBtn = $("#clearBtn");
  const menuBtn = $("#menuBtn");
  const dropdownMenu = $("#dropdownMenu");
  const themeBtn = $("#themeBtn");
  const settingsThemeBtn = $("#settingsThemeBtn");
  const settingsEngine = $("#settingsEngine");
  const toast = $("#toast");
  const installBtn = $("#installBtn");

  let deferredInstallPrompt = null;
  let toastTimer = null;

  const SEARCH_ENGINES = Object.freeze({
    google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    bing: q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
    duckduckgo: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
    brave: q => `https://search.brave.com/search?q=${encodeURIComponent(q)}`
  });

  const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
  const BLOCKED_SCHEMES = /^(javascript|data|vbscript|file|blob|about):/i;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function isSafeUrl(raw) {
    if (typeof raw !== "string" || raw.length > 2048) return false;
    const value = raw.trim();
    if (!value || BLOCKED_SCHEMES.test(value)) return false;

    try {
      const parsed = new URL(value);
      return ALLOWED_PROTOCOLS.has(parsed.protocol) &&
             !parsed.username && !parsed.password &&
             Boolean(parsed.hostname);
    } catch {
      return false;
    }
  }

  function normalizeDestination(value) {
    const query = value.trim();
    if (!query || query.length > MAX_QUERY_LENGTH) return null;

    if (/^[a-z][a-z0-9+.-]*:/i.test(query)) {
      return isSafeUrl(query) ? query : null;
    }

    if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d{1,5})?(?:[/?#].*)?$/i.test(query)) {
      const url = `https://${query}`;
      return isSafeUrl(url) ? url : null;
    }

    const selected = SEARCH_ENGINES[engine.value] || SEARCH_ENGINES.google;
    return selected(query);
  }

  function openExternal(url) {
    if (!isSafeUrl(url)) return false;
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) window.location.assign(url);
    return true;
  }

  function getSettings() {
    try {
      const data = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      return {
        theme: data.theme === "light" ? "light" : "dark",
        engine: SEARCH_ENGINES[data.engine] ? data.engine : "google"
      };
    } catch {
      return { theme: "dark", engine: "google" };
    }
  }

  function saveSettings(settings) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
  }

  function applyTheme(theme) {
    document.body.classList.toggle("light", theme === "light");
    const light = theme === "light";
    if (themeBtn) themeBtn.textContent = light ? "🌙 Dark Mode" : "☀️ Light Mode";
    if (settingsThemeBtn) settingsThemeBtn.textContent = light ? "Switch to Dark" : "Switch to Light";
    const current = getSettings();
    saveSettings({ ...current, theme });
  }

  function toggleTheme() {
    applyTheme(document.body.classList.contains("light") ? "dark" : "light");
    showToast("Theme updated");
  }

  function getHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(item => item && typeof item.query === "string" &&
          typeof item.url === "string" && typeof item.time === "string" &&
          isSafeUrl(item.url))
        .slice(0, MAX_HISTORY);
    } catch {
      return [];
    }
  }

  function setHistory(history) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY))); } catch {}
  }

  function saveHistory(query, url) {
    const history = getHistory().filter(
      item => item.query.toLowerCase() !== query.toLowerCase()
    );
    history.unshift({
      query: query.slice(0, MAX_QUERY_LENGTH),
      url,
      time: new Date().toLocaleString()
    });
    setHistory(history);
  }

  function displayHistory() {
    if (!historyList) return;
    historyList.replaceChildren();

    const history = getHistory();
    if (!history.length) {
      const empty = document.createElement("div");
      empty.className = "empty-history";
      empty.textContent = "⌕ No searches yet";
      historyList.appendChild(empty);
      return;
    }

    history.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "history-item";

      const info = document.createElement("div");
      info.className = "history-info";

      const query = document.createElement("div");
      query.className = "history-query";
      query.textContent = item.query;

      const time = document.createElement("div");
      time.className = "history-time";
      time.textContent = item.time;

      info.append(query, time);

      const open = document.createElement("button");
      open.className = "history-open";
      open.type = "button";
      open.textContent = "↗";
      open.setAttribute("aria-label", `Open ${item.query}`);
      open.addEventListener("click", () => openExternal(item.url));

      const del = document.createElement("button");
      del.className = "history-delete";
      del.type = "button";
      del.textContent = "🗑";
      del.setAttribute("aria-label", `Delete ${item.query}`);
      del.addEventListener("click", () => {
        const updated = getHistory();
        updated.splice(index, 1);
        setHistory(updated);
        displayHistory();
        showToast("History item deleted");
      });

      row.append(info, open, del);
      historyList.appendChild(row);
    });
  }

  function clearHistory() {
    if (!getHistory().length) {
      showToast("History is already empty");
      return;
    }
    if (confirm("Clear all search history?")) {
      try { localStorage.removeItem(HISTORY_KEY); } catch {}
      displayHistory();
      showToast("Search history cleared");
    }
  }

  function searchWeb() {
    const query = input.value.trim();
    if (!query) {
      input.focus();
      return;
    }

    if (query.length > MAX_QUERY_LENGTH) {
      showToast("Search text is too long");
      return;
    }

    const url = normalizeDestination(query);
    if (!url) {
      showToast("This URL is not allowed");
      return;
    }

    saveHistory(query, url);
    openExternal(url);
  }

  function closeMenu() {
    dropdownMenu?.classList.remove("show");
    menuBtn?.setAttribute("aria-expanded", "false");
  }

  function showSection(sectionId) {
    const home = $("#home");
    if (!home) return;

    const hero = $(".hero");
    const sections = $$(".page-section");

    sections.forEach(section => section.classList.add("hidden"));

    if (sectionId === "home") {
      hero?.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      hero?.classList.add("hidden");
      const page = document.getElementById(sectionId);
      if (page) {
        page.classList.remove("hidden");
        page.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    closeMenu();
  }

  function syncEngine(value) {
    if (!SEARCH_ENGINES[value]) return;
    engine.value = value;
    if (settingsEngine) settingsEngine.value = value;
    const settings = getSettings();
    saveSettings({ ...settings, engine: value });
  }

  menuBtn?.addEventListener("click", event => {
    event.stopPropagation();
    const show = !dropdownMenu.classList.contains("show");
    dropdownMenu.classList.toggle("show", show);
    menuBtn.setAttribute("aria-expanded", String(show));
  });

  document.addEventListener("click", event => {
    if (dropdownMenu && menuBtn &&
        !dropdownMenu.contains(event.target) &&
        !menuBtn.contains(event.target)) closeMenu();
  });

  $$("#dropdownMenu [data-section]").forEach(button => {
    button.addEventListener("click", () => showSection(button.dataset.section));
  });

  $$(".quick-card[data-url]").forEach(button => {
    button.addEventListener("click", () => {
      const url = button.dataset.url;
      const name = button.dataset.name || url;
      if (isSafeUrl(url)) {
        saveHistory(name, url);
        openExternal(url);
      }
    });
  });

  form?.addEventListener("submit", event => {
    event.preventDefault();
    searchWeb();
  });

  clearBtn?.addEventListener("click", clearHistory);
  themeBtn?.addEventListener("click", toggleTheme);
  settingsThemeBtn?.addEventListener("click", toggleTheme);

  engine?.addEventListener("change", () => syncEngine(engine.value));
  settingsEngine?.addEventListener("change", () => syncEngine(settingsEngine.value));

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installBtn) installBtn.hidden = false;
  });

  installBtn?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      showToast("Install is not available in this browser yet");
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    if (installBtn) installBtn.hidden = true;
    showToast("Hassan Browser installed");
  });

  const initial = getSettings();
  applyTheme(initial.theme);
  syncEngine(initial.engine);
  displayHistory();

  const hash = location.hash.slice(1);
  if (["history", "featuresSection", "aboutSection", "privacySection", "settingsSection"].includes(hash)) {
    showSection(hash);
  }
})();


// PWA Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("Hassan Browser: Service Worker registered"))
      .catch(error => console.error("Service Worker registration failed:", error));
  });
}
