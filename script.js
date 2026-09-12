/* HISTORY HIDDEN ON HOME PAGE: history is intentionally not displayed on the main page. */
/*
============================================================
Hassan Browser — JAVASCRIPT / FUNCTIONALITY FILE
============================================================
PURPOSE:
This file controls all interactive functionality:
- Search-engine selection
- Web searching
- Safe URL validation
- Secure external links
- Search history
- Delete/clear history
- Three-dot menu
- About / Features / Privacy / Terms navigation
- XSS-safe history rendering
- LocalStorage handling

HTML:
The UI elements controlled by this file are in index.html.

CSS:
The visual appearance is controlled by style.css.
============================================================
*/


(() => {
  "use strict";

  const HISTORY_KEY = "Hassan BrowserHistory.v2";
  const MAX_HISTORY = 30;
  const MAX_QUERY_LENGTH = 500;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const input = $("#website");
  const engine = $("#engine");
  const form = $("#searchForm");
  const clearBtn = $("#clearBtn");
  const historyList = $("#historyList");
  const menuBtn = $("#menuBtn");
  const dropdownMenu = $("#dropdownMenu");
  const installBtn = $("#installBtn");
  const accountArea = $("#accountArea");
  const signInBtn = $("#signInBtn");
  const createAccountBtn = $("#createAccountBtn");
  const authBackdrop = $("#authBackdrop");
  const authCloseBtn = $("#authCloseBtn");
  const authForm = $("#authForm");
  const authName = $("#authName");
  const authNameLabel = $("#authNameLabel");
  const authEmail = $("#authEmail");
  const authPassword = $("#authPassword");
  const authTitle = $("#authTitle");
  const authSubtitle = $("#authSubtitle");
  const authSubmit = $("#authSubmit");
  const authMessage = $("#authMessage");
  const signInTab = $("#signInTab");
  const createAccountTab = $("#createAccountTab");

  const ACCOUNT_KEY = "HassanBrowserAccount.v1";
  const SESSION_KEY = "HassanBrowserSession.v1";

  let deferredInstallPrompt;
  let authMode = "signin";

  // ============================================================
  // SEARCH ENGINE CONFIGURATION
  // ============================================================
  const SEARCH_ENGINES = Object.freeze({
    google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    bing: q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
    duckduckgo: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
    brave: q => `https://search.brave.com/search?q=${encodeURIComponent(q)}`
  });

  const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
  const BLOCKED_SCHEMES = /^(javascript|data|vbscript|file|blob|about):/i;

  function setAuthMode(mode) {
    authMode = mode;
    const isCreate = mode === "create";
    authTitle.textContent = isCreate ? "Create your account" : "Welcome back";
    authSubtitle.textContent = isCreate
      ? "Create a local account to keep your browser data connected."
      : "Sign in to keep your browser data connected.";
    authName.hidden = !isCreate;
    authNameLabel.hidden = !isCreate;
    authName.required = isCreate;
    authPassword.autocomplete = isCreate ? "new-password" : "current-password";
    authSubmit.textContent = isCreate ? "Create account" : "Sign in";
    signInTab.classList.toggle("active", !isCreate);
    createAccountTab.classList.toggle("active", isCreate);
    signInTab.setAttribute("aria-selected", String(!isCreate));
    createAccountTab.setAttribute("aria-selected", String(isCreate));
    authMessage.textContent = "";
    authMessage.className = "auth-message";
  }

  function openAuth(mode = "signin") {
    setAuthMode(mode);
    authBackdrop.hidden = false;
    document.body.classList.add("auth-open");
    (mode === "create" ? authName : authEmail).focus();
  }

  function closeAuth() {
    authBackdrop.hidden = true;
    document.body.classList.remove("auth-open");
    authForm.reset();
    authMessage.textContent = "";
  }

  function getStoredAccount() {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null");
    } catch {
      return null;
    }
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  async function hashPassword(password) {
    if (!window.crypto?.subtle) throw new Error("Secure password storage is unavailable.");
    const bytes = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  }

  function renderAccount() {
    if (!accountArea) return;
    const session = getSession();
    accountArea.replaceChildren();
    if (!session) {
      const signIn = document.createElement("button");
      signIn.className = "auth-btn auth-btn-secondary";
      signIn.type = "button";
      signIn.textContent = "Sign in";
      signIn.addEventListener("click", () => openAuth("signin"));
      const create = document.createElement("button");
      create.className = "auth-btn auth-btn-primary";
      create.type = "button";
      create.textContent = "Create account";
      create.addEventListener("click", () => openAuth("create"));
      accountArea.append(signIn, create);
      return;
    }
    const welcome = document.createElement("span");
    welcome.className = "account-name";
    welcome.textContent = `Hi, ${session.name}`;
    const signOut = document.createElement("button");
    signOut.className = "auth-btn auth-btn-secondary";
    signOut.type = "button";
    signOut.textContent = "Sign out";
    signOut.addEventListener("click", () => {
      localStorage.removeItem(SESSION_KEY);
      renderAccount();
    });
    accountArea.append(welcome, signOut);
  }

  signInBtn?.addEventListener("click", () => openAuth("signin"));
  createAccountBtn?.addEventListener("click", () => openAuth("create"));
  authCloseBtn?.addEventListener("click", closeAuth);
  signInTab?.addEventListener("click", () => setAuthMode("signin"));
  createAccountTab?.addEventListener("click", () => setAuthMode("create"));
  authBackdrop?.addEventListener("click", event => {
    if (event.target === authBackdrop) closeAuth();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && authBackdrop && !authBackdrop.hidden) closeAuth();
  });

  authForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const email = authEmail.value.trim().toLowerCase();
    const password = authPassword.value;
    authSubmit.disabled = true;
    try {
      const passwordHash = await hashPassword(password);
      if (authMode === "create") {
        const name = authName.value.trim();
        localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ name, email, passwordHash }));
        localStorage.setItem(SESSION_KEY, JSON.stringify({ name, email }));
        authMessage.textContent = "Account created. You are now signed in.";
        authMessage.className = "auth-message success";
      } else {
        const account = getStoredAccount();
        if (!account || account.email !== email || account.passwordHash !== passwordHash) {
          throw new Error("Email or password is incorrect. Create an account first if needed.");
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify({ name: account.name, email: account.email }));
        authMessage.textContent = `Welcome back, ${account.name}.`;
        authMessage.className = "auth-message success";
      }
      renderAccount();
      window.setTimeout(closeAuth, 700);
    } catch (error) {
      authMessage.textContent = error.message || "Unable to save the account in this browser.";
      authMessage.className = "auth-message error";
    } finally {
      authSubmit.disabled = false;
    }
  });

  // ============================================================
  // SEARCH HISTORY — READ / WRITE / VALIDATE
  // ============================================================
  function getHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(item =>
          item &&
          typeof item.query === "string" &&
          typeof item.url === "string" &&
          typeof item.time === "string" &&
          isSafeUrl(item.url)
        )
        .slice(0, MAX_HISTORY);
    } catch {
      return [];
    }
  }

  function setHistory(history) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
    } catch {
      // Storage can be disabled or full; search should still work.
    }
  }

  function saveHistory(query, url) {
    const history = getHistory().filter(item => item.query.toLowerCase() !== query.toLowerCase());
    history.unshift({
      query: query.slice(0, MAX_QUERY_LENGTH),
      url,
      time: new Date().toLocaleString()
    });
    setHistory(history);
    displayHistory();
  }

  // ============================================================
  // URL SECURITY — ONLY HTTP/HTTPS DESTINATIONS ARE ALLOWED
  // ============================================================
  function isSafeUrl(raw) {
    if (typeof raw !== "string" || raw.length > 2048) return false;
    const value = raw.trim();
    if (!value || BLOCKED_SCHEMES.test(value)) return false;

    try {
      const parsed = new URL(value);
      if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return false;
      if (parsed.username || parsed.password) return false;
      return Boolean(parsed.hostname);
    } catch {
      return false;
    }
  }

  function normalizeDestination(value) {
    const query = value.trim();
    if (!query || query.length > MAX_QUERY_LENGTH) return null;

    // Explicit scheme: only HTTP(S) is accepted.
    if (/^[a-z][a-z0-9+.-]*:/i.test(query)) {
      return isSafeUrl(query) ? query : null;
    }

    // Looks like a hostname/domain: open over HTTPS.
    if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d{1,5})?(?:[/?#].*)?$/i.test(query)) {
      const url = `https://${query}`;
      return isSafeUrl(url) ? url : null;
    }

    const selectedEngine = SEARCH_ENGINES[engine.value] || SEARCH_ENGINES.google;
    return selectedEngine(query);
  }

  function openExternal(url) {
    if (!isSafeUrl(url)) return false;
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) {
      // Popup blockers can prevent the new tab. Navigating current tab is safer than
      // silently doing nothing, but only after the URL has passed validation.
      window.location.assign(url);
    }
    return true;
  }

  // ============================================================
  // MAIN SEARCH FUNCTION
  // ============================================================
  function searchWeb() {
    const query = input.value.trim();
    if (!query) {
      input.focus();
      return;
    }

    if (query.length > MAX_QUERY_LENGTH) {
      input.value = query.slice(0, MAX_QUERY_LENGTH);
      return;
    }

    const url = normalizeDestination(query);
    if (!url) {
      input.setCustomValidity("This URL is not allowed. Use an http:// or https:// address.");
      input.reportValidity();
      input.setCustomValidity("");
      return;
    }

    saveHistory(query, url);
    openExternal(url);
  }

  // ============================================================
  // DISPLAY HISTORY SAFELY — NO UNSAFE HTML INJECTION
  // ============================================================
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
      open.addEventListener("click", () => openHistory(index));

      const del = document.createElement("button");
      del.className = "history-delete";
      del.type = "button";
      del.textContent = "🗑";
      del.setAttribute("aria-label", `Delete ${item.query}`);
      del.addEventListener("click", () => deleteHistory(index));

      row.append(info, open, del);
      historyList.appendChild(row);
    });
  }

  function openHistory(index) {
    const item = getHistory()[index];
    if (item) openExternal(item.url);
  }

  function deleteHistory(index) {
    const history = getHistory();
    if (!history[index]) return;
    history.splice(index, 1);
    setHistory(history);
    displayHistory();
  }

  function clearHistory() {
    if (!getHistory().length) return;
    if (window.confirm("Clear all search history?")) {
      try { localStorage.removeItem(HISTORY_KEY); } catch { }
      displayHistory();
    }
  }

  // ============================================================
  // MENU / PAGE SECTION NAVIGATION
  // ============================================================
  function showSection(sectionId) {
    const home = $("#home");
    if (!home) return;

    const sections = $$(".info-section");
    sections.forEach(section => section.classList.add("hidden"));
    document.body.classList.remove("history-view");

    if (sectionId === "home") {
      home.style.display = "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (sectionId === "history") {
      home.style.display = "";
      document.body.classList.add("history-view");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      home.style.display = "block";
      const page = document.getElementById(sectionId);
      if (page) {
        // Hide the regular home content while showing an info page.
        sections.forEach(section => section.classList.add("hidden"));
        page.classList.remove("hidden");
        page.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    closeMenu();
  }

  function closeMenu() {
    dropdownMenu?.classList.remove("show");
    menuBtn?.setAttribute("aria-expanded", "false");
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
      !menuBtn.contains(event.target)) {
      closeMenu();
    }
  });

  $$("#dropdownMenu [data-section]").forEach(button => {
    button.addEventListener("click", () => showSection(button.dataset.section));
  });

  $$(".quick-links [data-url]").forEach(button => {
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

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installBtn) installBtn.hidden = false;
  });

  installBtn?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      window.alert("Install is not available here yet. Open the browser menu and choose Install Hassan Browser.");
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
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => { });
    });
  }

  // If the page is opened from a fragment, show the relevant section.
  const hash = location.hash.slice(1);
  if (["history", "aboutSection", "featuresSection", "privacySection", "termsSection"].includes(hash)) {
    showSection(hash);
  }

  renderAccount();
  displayHistory();
})();
