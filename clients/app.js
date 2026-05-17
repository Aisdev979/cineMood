/* ============================================================
   CINEMOOD — FRONTEND APPLICATION
   ============================================================

   BACKEND API CONTRACT (implement these endpoints):
   ─────────────────────────────────────────────────────────
   POST   /api/auth/register     { name, email, password }
                                 → { user: { id, name, email } }

   POST   /api/auth/login        { email, password }
                                 → { user: { id, name, email } }

   POST   /api/auth/logout       {}
                                 → { message }

   GET    /api/auth/me           (cookie sent automatically)
                                 → { user: { id, name, email } } | 401

   POST   /api/mood/analyze      { text }
                                 → { moodLabel, moodDescription, genre, genreId }

   GET    /api/movies            ?genreId=28&page=1
                                 → { results: [...], totalPages, page, totalResults }

   GET    /api/movies/:id        → { movie details from TMDB }

   GET    /api/movies/:id/videos → { results: [{ key, site, type, name }] }

   ─────────────────────────────────────────────────────────
   Security notes:
   • All requests use credentials:'include' (cookie-based auth)
   • NO API keys stored in this file — backend handles them
   • HTML is always sanitised before insertion (textContent / escapeHtml)
   • External links use rel="noopener noreferrer"
   ============================================================ */

"use strict";

/* ════════════════════════════════════════════════
   CONFIG  – change API_BASE to match your server
   ════════════════════════════════════════════════ */
const CFG = Object.freeze({
  API_BASE: "http://localhost:5000/api/v1",
  TMDB_IMG: "https://image.tmdb.org/t/p/w500",
  TMDB_IMG_ORIG: "https://image.tmdb.org/t/p/original",
  POSTER_FALLBACK: "https://placehold.co/500x750/111827/4d5578?text=No+Poster",
  BACKDROP_FALLBACK:
    "https://placehold.co/1280x720/0c1020/4d5578?text=No+Backdrop",
  MAX_MOOD_LEN: 500,
  MIN_PASS_LEN: 8,
  TOAST_DURATION: 4500,
  MOVIEBOX_BASE: "https://moviebox.ph/",
});

/* ════════════════════════════════════════════════
   APPLICATION STATE
   ════════════════════════════════════════════════ */
const State = {
  user: null, // { id, name, email }
  moodAnalysis: null, // { moodLabel, moodDescription, genre, genreId }
  movies: [],
  currentPage: 1,
  totalPages: 1,
  totalResults: 0,
  loading: false,
};

/* ════════════════════════════════════════════════
   SECURITY HELPERS
   ════════════════════════════════════════════════ */
const Sec = {
  /** Escape HTML to prevent XSS when inserting untrusted strings into innerHTML */
  esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  /** Basic email format validation */
  validEmail(e) {
    return /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(String(e).trim());
  },

  /** Truncate a string safely */
  trunc(str, n = 200) {
    const s = String(str ?? "");
    return s.length > n ? s.slice(0, n) + "…" : s;
  },
};

/* ════════════════════════════════════════════════
   API MODULE
   ════════════════════════════════════════════════ */
const API = {
  async _request(method, path, body = null) {
  const opts = {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  let res = await fetch(CFG.API_BASE + path, opts);
  console.log(`API ${method} ${path} →`, res.status, res.ok);

  // If access token expired, try to refresh once
  if (res.status === 401) {
    const refreshRes = await fetch(`${CFG.API_BASE}/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      // Retry original request — browser now has new accessToken cookie
      res = await fetch(CFG.API_BASE + path, opts);
    }
  }

  if (res.status === 401) {
    State.user = null;
    Views.show("auth");
    throw new Error("Session expired. Please sign in again.");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
},

  get: (path) => API._request("GET", path),
  post: (path, body) => API._request("POST", path, body),
  delete: (path) => API._request("DELETE", path),

  /* ── Auth ── */
  me() {
    return API.get("/me");
  },
  login(email, pass) {
    return API.post("/signin", { email, password: pass });
  },
  register(name, email, pass, confirmPass) {
    return API.post("/signup", { name, email, password: pass, passwordConfirm: confirmPass });
  },
  logout() {
    return API.post("/logout", {});
  },
  verifyOTP(email, otp) {
    return API.post("/verify-otp", { email, otp });
  },
  resendOTP(email) {
    return API.post("/auth/resend-otp", { email });
  },

  /* ── Mood & Movies ── */
  analyzeMood(text) {
    return API.post("/mood/analyze", { text });
  },
  getMovies(genreId, keywords, page) {
    return API.get(
      `/mood/movies?genreId=${encodeURIComponent(genreId.join("|"))}&keywords=${encodeURIComponent(keywords.join("|"))}&page=${encodeURIComponent(page)}`,
    );
  },
  getMovie(id) {
    return API.get(`/mood/movies/${encodeURIComponent(id)}`);
  },
  getVideos(id) {
    return API.get(`/mood/movies/${encodeURIComponent(id)}/videos`);
  },
};

/* ════════════════════════════════════════════════
   TOAST MODULE
   ════════════════════════════════════════════════ */
const Toast = (() => {
  const container = () => document.getElementById("toast-container");
  let _id = 0;

  const ICONS = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    loading: null, // spinner shown instead
  };

  function show({
    type = "info",
    title,
    message,
    duration = CFG.TOAST_DURATION,
  }) {
    const id = ++_id;
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.id = `toast-${id}`;

    const iconHtml =
      type === "loading"
        ? `<div class="toast-spin"></div>`
        : `<span class="toast-icon">${ICONS[type] || "📢"}</span>`;

    el.innerHTML = `
      ${iconHtml}
      <div class="toast-body">
        ${title ? `<div class="toast-title">${Sec.esc(title)}</div>` : ""}
        ${message ? `<div class="toast-msg">${Sec.esc(message)}</div>` : ""}
      </div>`;

    container().appendChild(el);

    if (type !== "loading" && duration > 0) {
      setTimeout(() => Toast.dismiss(id), duration);
    }

    return id;
  }

  function dismiss(id) {
    const el = document.getElementById(`toast-${id}`);
    if (!el) return;
    el.classList.add("removing");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }

  function dismissAll() {
    document.querySelectorAll(".toast").forEach((el) => {
      el.classList.add("removing");
      el.addEventListener("animationend", () => el.remove(), { once: true });
    });
  }

  return {
    success: (title, message, duration) =>
      show({ type: "success", title, message, duration }),
    error: (title, message, duration) =>
      show({ type: "error", title, message, duration }),
    info: (title, message, duration) =>
      show({ type: "info", title, message, duration }),
    loading: (title, message) =>
      show({ type: "loading", title, message, duration: 0 }),
    dismiss,
    dismissAll,
  };
})();

/* ════════════════════════════════════════════════
   VIEWS — show / hide sections
   ════════════════════════════════════════════════ */
const Views = {
  show(name) {
    // name: 'auth' | 'home' | 'results'
    const authView = document.getElementById("auth-view");
    const appView = document.getElementById("app-view");
    const homeSection = document.getElementById("home-section");
    const resSection = document.getElementById("results-section");

    if (name === "auth") {
      authView.classList.remove("hidden");
      appView.classList.add("hidden");
    } else {
      authView.classList.add("hidden");
      appView.classList.remove("hidden");
      homeSection.classList.toggle("hidden", name !== "home");
      resSection.classList.toggle("hidden", name !== "results");
      // Scroll top on section change
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
};

/* ════════════════════════════════════════════════
   NAV MODULE
   ════════════════════════════════════════════════ */
const Nav = {
  setUser(user) {
    document.getElementById("user-avatar").textContent = (
      user?.name?.[0] ??
      user?.email?.[0] ??
      "U"
    ).toUpperCase();
    document.getElementById("user-name-el").textContent =
      user?.name ?? user?.email ?? "User";
  },

  goHome() {
    Views.show("home");
    document.getElementById("mood-textarea").value = "";
    Home.updateCharCount();
    document
      .querySelectorAll(".chip")
      .forEach((c) => c.classList.remove("selected"));
  },
};

/* ════════════════════════════════════════════════
   AUTH MODULE
   ════════════════════════════════════════════════ */
const Auth = {
  // Holds the email that just registered (needed for OTP calls)
  _pendingEmail: "",
  // Countdown interval reference
  _countdownTimer: null,

  switchPanel(to) {
    // to: 'signin' | 'signup' | 'otp'
    document
      .getElementById("signin-panel")
      .classList.toggle("active-panel", to === "signin");
    document
      .getElementById("signup-panel")
      .classList.toggle("active-panel", to === "signup");
    document
      .getElementById("otp-panel")
      .classList.toggle("active-panel", to === "otp");

    if (to !== "otp") {
      // Clear auth fields and error states
      ["si-email", "si-password", "su-name", "su-email", "su-password", "su-confirm-password"].forEach(
        (id) => {
          const el = document.getElementById(id);
          if (el) el.value = "";
        },
      );
      document
        .querySelectorAll(".field-input")
        .forEach((el) => el.classList.remove("error"));
      // Stop any running countdown
      Auth._stopCountdown();
    }
  },

  /* ────────────────────────────────────────
     OTP PANEL helpers
  ──────────────────────────────────────── */
  showOTP(email) {
    Auth._pendingEmail = email;

    // Mask email: ab***@domain.com
    const [local, domain] = email.split("@");
    const masked = local.slice(0, 2) + "***@" + domain;
    document.getElementById("otp-email-display").textContent = masked;

    // Clear any previous digits / states
    document.querySelectorAll(".otp-digit").forEach((inp) => {
      inp.value = "";
      inp.classList.remove("filled", "error-shake", "verified");
    });
    document.getElementById("otp-progress-fill").style.width = "0%";
    document.getElementById("otp-verify-btn").disabled = true;

    Auth.switchPanel("otp");

    // Focus first box after transition
    setTimeout(() => document.querySelector(".otp-digit")?.focus(), 350);

    // Start resend countdown (60 s)
    Auth._startCountdown(60);
  },

  _startCountdown(seconds) {
    Auth._stopCountdown();
    const timerEl = document.getElementById("otp-timer");
    const countEl = document.getElementById("otp-countdown");
    const resendBtn = document.getElementById("otp-resend-btn");

    resendBtn.disabled = true;
    countEl.style.display = "";
    timerEl.textContent = seconds;

    let remaining = seconds;
    Auth._countdownTimer = setInterval(() => {
      remaining--;
      timerEl.textContent = remaining;
      if (remaining <= 0) {
        Auth._stopCountdown();
        resendBtn.disabled = false;
        countEl.style.display = "none";
      }
    }, 1000);
  },

  _stopCountdown() {
    if (Auth._countdownTimer) {
      clearInterval(Auth._countdownTimer);
      Auth._countdownTimer = null;
    }
  },

  /* ────────────────────────────────────────
     READ current OTP from boxes
  ──────────────────────────────────────── */
  _getOTPValue() {
    return [...document.querySelectorAll(".otp-digit")]
      .map((inp) => inp.value)
      .join("");
  },

  /* ────────────────────────────────────────
     VERIFY OTP
  ──────────────────────────────────────── */
  async verifyOTP() {
    const otp = Auth._getOTPValue();
    if (otp.length !== 6) {
      OTP.shakeAll();
      return Toast.error("Incomplete code", "Please fill in all 6 digits.");
    }

    Auth._setLoading("otp-verify-btn", true);
    const tid = Toast.loading(
      "Verifying your code…",
      "Checking with the server",
    );

    try {
      const data = await API.verifyOTP(Auth._pendingEmail, otp);
      State.user = data.user;
      Toast.dismiss(tid);

      // Briefly flash green on all boxes
      document.querySelectorAll(".otp-digit").forEach((inp) => {
        inp.classList.remove("filled");
        inp.classList.add("verified");
      });

      await _delay(600); // let animation play

      Toast.success(
        "Email verified! 🎉",
        `Welcome to CineMood, ${Sec.trunc(data.user?.name ?? "", 20)}!`,
      );
      Auth._pendingEmail = "";
      Auth._stopCountdown();
      Nav.setUser(data.user);
      Views.show("home");
    } catch (err) {
      Toast.dismiss(tid);
      Toast.error("Incorrect code", err.message);
      OTP.shakeAll();
      // Clear boxes so user can retry
      document.querySelectorAll(".otp-digit").forEach((inp) => {
        inp.value = "";
        inp.classList.remove("filled", "verified");
      });
      document.getElementById("otp-progress-fill").style.width = "0%";
      document.getElementById("otp-verify-btn").disabled = true;
      document.querySelector(".otp-digit")?.focus();
    } finally {
      Auth._setLoading("otp-verify-btn", false);
    }
  },

  /* ────────────────────────────────────────
     RESEND OTP
  ──────────────────────────────────────── */
  async resendOTP() {
    if (!Auth._pendingEmail) return;
    const resendBtn = document.getElementById("otp-resend-btn");
    resendBtn.disabled = true;

    const tid = Toast.loading("Sending new code…", `To ${Auth._pendingEmail}`);
    try {
      await API.resendOTP(Auth._pendingEmail);
      Toast.dismiss(tid);
      Toast.success(
        "Code sent!",
        "Check your inbox for the new 6-digit code.",
        5000,
      );
      // Clear boxes
      document.querySelectorAll(".otp-digit").forEach((inp) => {
        inp.value = "";
        inp.classList.remove("filled", "error-shake", "verified");
      });
      document.getElementById("otp-progress-fill").style.width = "0%";
      document.getElementById("otp-verify-btn").disabled = true;
      document.querySelector(".otp-digit")?.focus();
      Auth._startCountdown(60);
    } catch (err) {
      Toast.dismiss(tid);
      Toast.error("Failed to resend", err.message);
      resendBtn.disabled = false;
    }
  },

  /* ────────────────────────────────────────
     SIGN IN
  ──────────────────────────────────────── */
  _setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const lbl = btn.querySelector(".btn-auth__label");
    const spin = btn.querySelector(".btn-auth__spin");
    btn.disabled = loading;
    if (lbl) lbl.style.opacity = loading ? "0" : "1";
    if (spin) spin.classList.toggle("hidden", !loading);
  },

  async signin() {
    const email = document.getElementById("si-email").value.trim();
    const password = document.getElementById("si-password").value;

    // Validation
    if (!Sec.validEmail(email)) {
      document.getElementById("si-email").classList.add("error");
      return Toast.error(
        "Invalid email",
        "Please enter a valid email address.",
      );
    }
    if (password.length < CFG.MIN_PASS_LEN) {
      document.getElementById("si-password").classList.add("error");
      return Toast.error(
        "Too short",
        `Password must be at least ${CFG.MIN_PASS_LEN} characters.`,
      );
    }

    Auth._setLoading("signin-btn", true);
    const tid = Toast.loading("Signing in…", "Verifying your credentials");
    try {
      const data = await API.login(email, password);
      State.user = data.user;
      Toast.dismiss(tid);
      Toast.success(
        "Welcome back! 🎬",
        `Good to see you, ${Sec.trunc(data.user.name ?? data.user.email, 24)}`,
      );
      Nav.setUser(data.user);
      Views.show("home");
    } catch (err) {
      Toast.dismiss(tid);
      Toast.error("Sign-in failed", err.message);
    } finally {
      Auth._setLoading("signin-btn", false);
    }
  },

  async signup() {
    const name = document.getElementById("su-name").value.trim();
    const email = document.getElementById("su-email").value.trim();
    const password = document.getElementById("su-password").value;
    const confirmPassword = document.getElementById("su-confirm-password").value;

    if (!name || name.length < 2) {
      document.getElementById("su-name").classList.add("error");
      return Toast.error("Name required", "Please enter your full name.");
    }
    if (!Sec.validEmail(email)) {
      document.getElementById("su-email").classList.add("error");
      return Toast.error(
        "Invalid email",
        "Please enter a valid email address.",
      );
    }
    if (password.length < CFG.MIN_PASS_LEN) {
      document.getElementById("su-password").classList.add("error");
      return Toast.error(
        "Weak password",
        `Password must be at least ${CFG.MIN_PASS_LEN} characters.`,
      );
    }

    Auth._setLoading("signup-btn", true);
    const tid = Toast.loading(
      "Creating account…",
      "Setting up your CineMood profile",
    );
    try {
      // Backend registers user AND sends OTP email
      await API.register(name, email, password, confirmPassword);
      Toast.dismiss(tid);
      Toast.info(
        "Account created!",
        `A 6-digit verification code has been sent to ${email}`,
        5000,
      );
      // ── Redirect to OTP step ──
      Auth.showOTP(email);
    } catch (err) {
      Toast.dismiss(tid);
      Toast.error("Registration failed", err.message);
    } finally {
      Auth._setLoading("signup-btn", false);
    }
  },

  async logout() {
    const tid = Toast.loading("Signing out…");
    try {
      await API.logout();
    } catch {
      /* ignore */
    }
    State.user = null;
    Toast.dismiss(tid);
    Toast.info("Signed out", "See you next time! 👋");
    Views.show("auth");
    Auth.switchPanel("signin");
  },
};

/* ════════════════════════════════════════════════
   HOME MODULE
   ════════════════════════════════════════════════ */
const Home = {
  updateCharCount() {
    const ta = document.getElementById("mood-textarea");
    const counter = document.getElementById("char-counter");
    const len = ta.value.length;
    counter.textContent = `${len} / ${CFG.MAX_MOOD_LEN}`;
    counter.classList.toggle(
      "near-limit",
      len > CFG.MAX_MOOD_LEN * 0.8 && len < CFG.MAX_MOOD_LEN,
    );
    counter.classList.toggle("at-limit", len >= CFG.MAX_MOOD_LEN);
  },

  async findFilms() {
    const ta = document.getElementById("mood-textarea");
    const text = ta.value.trim();

    if (!text || text.length < 8) {
      Toast.info(
        "Tell us more",
        "Describe how you feel — a few words are enough.",
      );
      ta.focus();
      return;
    }

    // Lock UI
    const btn = document.getElementById("find-btn");
    btn.disabled = true;
    btn.querySelector(".find-label").style.opacity = "0";
    btn.querySelector(".find-spin").classList.remove("hidden");
    btn.querySelector(".find-spark").classList.add("hidden");

    /* ── STEP 1: Analyse mood ── */
    const t1 = Toast.loading(
      "Analysing your mood…",
      "Our AI is reading between the lines",
    );
    let moodData;
    try {
      moodData = await API.analyzeMood(text);
    } catch (err) {
      Toast.dismiss(t1);
      Toast.error("Analysis failed", err.message);
      _unlockFindBtn();
      return;
    }
    Toast.dismiss(t1);

    /* Show detected mood */
    State.moodAnalysis = moodData;
    Toast.success(
      `Mood detected: ${Sec.trunc(moodData.mood, 30)}`,
      Sec.trunc(moodData.vibe, 100),
      6000,
    );

    /* ── STEP 2: Fetch movies ── */
    await Movies.load(moodData.genreId, moodData.keywords, 1);

    _unlockFindBtn();
  },
};

function _unlockFindBtn() {
  const btn = document.getElementById("find-btn");
  btn.disabled = false;
  btn.querySelector(".find-label").style.opacity = "1";
  btn.querySelector(".find-spin").classList.add("hidden");
  btn.querySelector(".find-spark").classList.remove("hidden");
}

/* ════════════════════════════════════════════════
   MOVIES MODULE
   ════════════════════════════════════════════════ */
const Movies = {
  async load(genreId, keywords, page) {
    const t2 = Toast.loading(
      "Finding your films…",
      `Searching ${Sec.esc(State.moodAnalysis?.genreId ?? "curated")} movies`,
    );

    let data;
    try {
      data = await API.getMovies(genreId, keywords, page);
    } catch (err) {
      Toast.dismiss(t2);
      Toast.error("Could not load movies", err.message);
      return;
    }
    Toast.dismiss(t2);
    State.movies = data.recommendations ?? [];
    State.currentPage = data.page ?? page;
    State.totalPages = data.totalPages ?? 1;
    State.totalResults = data.totalResults ?? data.results?.length ?? 0;

    // Switch to results view
    Views.show("results");
    Movies.renderBanner();
    Movies.renderGrid();
    Movies.renderPagination();

    Toast.success(
      "🎬 Films ready!",
      `Found ${State.totalResults.toLocaleString()} movies for you`,
      3500,
    );
  },

  renderBanner() {
    const m = State.moodAnalysis;
    
    if (!m) return;
    document.getElementById("mood-banner").innerHTML = `
      <div class="mood-banner__tag">✦ YOUR MOOD</div>
      <div class="mood-banner__label">${Sec.esc(m.mood)} · ${Sec.esc(m.genres)}</div>
      <div class="mood-banner__desc">${Sec.esc(m.vibe)}</div>
    `;
    document.getElementById("results-meta").innerHTML = `
      Showing <strong>${State.movies.length}</strong> of
      <strong>${State.totalResults.toLocaleString()}</strong> films —
      page <strong>${State.currentPage}</strong> of <strong>${State.totalPages}</strong>
    `;
  },

  renderGrid() {
    const grid = document.getElementById("movies-grid");
    const movie = State.movies;
    grid.innerHTML = "";

    if (!State.movies.length) {
      grid.innerHTML = `
        <div class="state-msg" style="grid-column:1/-1">
          <div class="state-msg__icon">🎞️</div>
          <h3>No films found</h3>
          <p>We couldn't find movies for this mood. Try describing how you feel differently.</p>
        </div>`;
      return;
    }

    State.movies.forEach((movie, i) => {
      const card = document.createElement("article");
      card.className = "movie-card";
      card.role = "listitem";
      card.style.animationDelay = `${i * 40}ms`;
      card.dataset.id = String(movie.id ?? "");

      const poster = movie.poster_path
        ? `${CFG.TMDB_IMG}${movie.poster_path}`
        : CFG.POSTER_FALLBACK;

      const rating = movie.vote_average
        ? `★ ${Number(movie.vote_average).toFixed(1)}`
        : "—";

      const year = movie.release_date ? movie.release_date.slice(0, 4) : "";

      // We use textContent assignments below to avoid XSS
      card.innerHTML = `
        <img class="movie-card__poster" src="${Sec.esc(poster)}" alt="" loading="lazy" />
        <div class="movie-card__overlay">
          <div class="movie-card__rating">${Sec.esc(rating)}</div>
          <h3 class="movie-card__title"></h3>
          <div class="movie-card__meta">
            <span></span>
          </div>
          <button class="movie-card__view" type="button" aria-label="View details">View Details</button>
        </div>`;

      // Safe text assignment
      card.querySelector(".movie-card__title").textContent =
        movie.title ?? "Untitled";
      card.querySelector(".movie-card__meta span").textContent = year;

      card.addEventListener("click", () => Modal.open(movie.id));
      grid.appendChild(card);
    });
  },

  renderPagination() {
    const nav = document.getElementById("pagination");
    nav.innerHTML = "";

    const total = State.totalPages;
    const current = State.currentPage;
    if (total <= 1) return;

    const genreId = State.moodAnalysis?.genreId;

    function mkBtn(label, page, disabled = false, active = false) {
      const btn = document.createElement("button");
      btn.className = `pg-btn${active ? " active" : ""}`;
      btn.type = "button";
      btn.disabled = disabled;
      btn.setAttribute("aria-label", `Page ${page}`);
      btn.innerHTML = Sec.esc(String(label));
      if (!disabled && !active) {
        btn.addEventListener("click", () => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          Movies.load(genreId, page);
        });
      }
      return btn;
    }

    function mkEllipsis() {
      const span = document.createElement("span");
      span.className = "pg-ellipsis";
      span.textContent = "…";
      return span;
    }

    // Prev
    nav.appendChild(mkBtn("←", current - 1, current === 1));

    // Page numbers with ellipsis
    const pages = _pagesToShow(current, total);
    let prev = null;
    pages.forEach((p) => {
      if (prev !== null && p - prev > 1) nav.appendChild(mkEllipsis());
      nav.appendChild(mkBtn(p, p, false, p === current));
      prev = p;
    });

    // Next
    nav.appendChild(mkBtn("→", current + 1, current === total));
  },
};

/** Generate a smart set of page numbers around the current page */
function _pagesToShow(current, total) {
  const delta = 2;
  const range = [];
  const around = [];

  for (
    let i = Math.max(2, current - delta);
    i <= Math.min(total - 1, current + delta);
    i++
  ) {
    around.push(i);
  }

  range.push(1);
  around.forEach((p) => range.push(p));
  if (total > 1) range.push(total);

  return [...new Set(range)].sort((a, b) => a - b);
}

/* ════════════════════════════════════════════════
   MODAL MODULE
   ════════════════════════════════════════════════ */
const Modal = {
  _currentId: null,

  open(movieId) {
    if (!movieId) return;
    Modal._currentId = movieId;
    const modal = document.getElementById("movie-modal");
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    document.getElementById("modal-body").innerHTML = `
      <div class="modal-loading">
        <div class="modal-spinner"></div>
        <p>Loading film details…</p>
      </div>`;

    Modal._fetchAndRender(movieId);

    // Trap focus
    document.getElementById("modal-close").focus();
  },

  close() {
    const modal = document.getElementById("movie-modal");
    modal.classList.add("hidden");
    document.body.style.overflow = "";
    // Stop any playing video
    const iframe = document.querySelector("#modal-body iframe");
    if (iframe) iframe.src = iframe.src; // reload to stop
    Modal._currentId = null;
  },

  async _fetchAndRender(id) {
    const t = Toast.loading("Loading film details…");
    try {
      const [movie, videosData] = await Promise.all([
        API.getMovie(id),
        API.getVideos(id),
      ]);
      Toast.dismiss(t);
      Modal._render(movie?.movieDetails, videosData?.movieVideos ?? []);
    } catch (err) {
      Toast.dismiss(t);
      Toast.error("Could not load film", err.message);
      document.getElementById("modal-body").innerHTML = `
        <div class="state-msg" style="padding:3rem">
          <div class="state-msg__icon">😕</div>
          <h3>Failed to load</h3>
          <p>${Sec.esc(err.message)}</p>
        </div>`;
    }
  },

  _render(movie, videos) {
    const body = document.getElementById("modal-body");

    const backdrop = movie.backdrop_path
      ? `${CFG.TMDB_IMG_ORIG}${movie.backdrop_path}`
      : CFG.BACKDROP_FALLBACK;

    const poster = movie.poster_path
      ? `${CFG.TMDB_IMG}${movie.poster_path}`
      : CFG.POSTER_FALLBACK;

    const year = movie.release_date ? movie.release_date.slice(0, 4) : "";
    const runtime = movie.runtime
      ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
      : "";
    const rating = movie.vote_average
      ? Number(movie.vote_average).toFixed(1)
      : "—";
    const genres = Array.isArray(movie.genres) ? movie.genres : [];

    // Find best trailer (prefer YouTube Official Trailer, fall back to any YouTube)
    const ytVideos = videos.results.filter(
      (v) =>
        v.site === "YouTube" && ["Trailer", "Teaser", "Clip"].includes(v.type),
    );
    const trailer =
      ytVideos.find((v) => v.type === "Trailer") || ytVideos[0] || null;

    // MovieBox search link (legal streaming finder)
    const movieBoxUrl = `${CFG.MOVIEBOX_BASE}web/searchResult?keyword=${encodeURIComponent(movie.title ?? "")}`;

    // Build genres HTML safely
    const genresHtml = genres
      .map((g) => `<span class="detail-tag">${Sec.esc(g.name)}</span>`)
      .join("");

    // Tags
    const metaTags = [
      year && `<span class="detail-tag">${Sec.esc(year)}</span>`,
      runtime && `<span class="detail-tag">${Sec.esc(runtime)}</span>`,
      `<span class="detail-tag detail-tag--gold">★ ${Sec.esc(rating)}</span>`,
    ]
      .filter(Boolean)
      .join("");

    // Video section
    const videoHtml = trailer
      ? `<div class="video-player-wrap">
           <iframe
             src="https://www.youtube-nocookie.com/embed/${Sec.esc(trailer.key)}?rel=0&modestbranding=1"
             title="${Sec.esc(trailer.name ?? "Trailer")}"
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
             allowfullscreen
             loading="lazy">
           </iframe>
         </div>`
      : `<div class="no-video">
           <span style="font-size:2rem">🎥</span>
           <span>No trailer available for this title</span>
         </div>`;

    body.innerHTML = `
      <div class="movie-detail__backdrop-wrap">
        <img class="movie-detail__backdrop" src="${Sec.esc(backdrop)}" alt="" loading="lazy" />
        <div class="movie-detail__backdrop-fade"></div>
      </div>

      <div class="movie-detail__body">
        <div class="movie-detail__top">
          <img class="movie-detail__poster" src="${Sec.esc(poster)}" alt="" loading="lazy" />
          <div class="movie-detail__info">
            <h2 class="movie-detail__title"></h2>
            <div class="movie-detail__tags">${metaTags}</div>
            ${genresHtml ? `<div class="genres-row">${genresHtml}</div>` : ""}
          </div>
        </div>

        <p class="movie-detail__overview"></p>

        <div class="detail-actions">
          ${
            trailer
              ? `<button class="btn-trailer" type="button" id="scroll-to-trailer">
                 ▶ Watch Trailer
               </button>`
              : ""
          }
          <a
            class="btn-watch-where"
            href="${Sec.esc(movieBoxUrl)}"
            target="_blank"
            rel="noopener noreferrer">
            🍿 Where to Watch / Download
          </a>
        </div>

        <div class="detail-section-title">TRAILER</div>
        ${videoHtml}
      </div>`;

    // Safe text injection
    body.querySelector(".movie-detail__title").textContent =
      movie.title ?? "Untitled";
    body.querySelector(".movie-detail__overview").textContent =
      movie.overview ?? "No overview available.";

    // Scroll-to-trailer button
    const trBtn = body.querySelector("#scroll-to-trailer");
    if (trBtn) {
      trBtn.addEventListener("click", () => {
        body
          .querySelector(".video-player-wrap, .no-video")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  },
};

/* ════════════════════════════════════════════════
   TINY UTILITY
   ════════════════════════════════════════════════ */
const _delay = (ms) => new Promise((res) => setTimeout(res, ms));

/* ════════════════════════════════════════════════
   OTP KEYBOARD & INPUT MODULE
   ════════════════════════════════════════════════ */
const OTP = {
  /** Wire up keyboard navigation across all 6 digit boxes */
  init() {
    const boxes = [...document.querySelectorAll(".otp-digit")];

    boxes.forEach((box, idx) => {
      /* ── Input: only allow digits, auto-advance ── */
      box.addEventListener("input", (e) => {
        // Strip non-digits
        box.value = box.value.replace(/\D/g, "").slice(-1);

        if (box.value) {
          box.classList.add("filled");
          box.classList.remove("error-shake");
          // Advance to next
          if (idx < boxes.length - 1) boxes[idx + 1].focus();
        } else {
          box.classList.remove("filled");
        }

        OTP._onUpdate(boxes);
      });

      /* ── Keydown: backspace, arrow navigation ── */
      box.addEventListener("keydown", (e) => {
        if (e.key === "Backspace") {
          if (box.value) {
            box.value = "";
            box.classList.remove("filled");
            OTP._onUpdate(boxes);
          } else if (idx > 0) {
            boxes[idx - 1].focus();
            boxes[idx - 1].value = "";
            boxes[idx - 1].classList.remove("filled");
            OTP._onUpdate(boxes);
          }
          e.preventDefault();
        }

        if (e.key === "ArrowLeft" && idx > 0) boxes[idx - 1].focus();
        if (e.key === "ArrowRight" && idx < boxes.length - 1)
          boxes[idx + 1].focus();

        if (e.key === "Enter") {
          const otp = boxes.map((b) => b.value).join("");
          if (otp.length === 6) Auth.verifyOTP();
        }
      });

      /* ── Focus: select existing digit ── */
      box.addEventListener("focus", () => box.select());

      /* ── Paste: fill all boxes from clipboard ── */
      box.addEventListener("paste", (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData)
          .getData("text")
          .replace(/\D/g, "")
          .slice(0, 6);

        if (!pasted) return;

        pasted.split("").forEach((digit, i) => {
          if (boxes[i]) {
            boxes[i].value = digit;
            boxes[i].classList.add("filled");
          }
        });

        // Focus the box after last filled
        const next = boxes[pasted.length] ?? boxes[boxes.length - 1];
        next.focus();
        OTP._onUpdate(boxes);
      });
    });
  },

  /** Called every time a digit changes — updates progress bar + verify button */
  _onUpdate(boxes) {
    const filled = boxes.filter((b) => b.value).length;
    const pct = (filled / boxes.length) * 100;
    document.getElementById("otp-progress-fill").style.width = pct + "%";
    document.getElementById("otp-verify-btn").disabled = filled < boxes.length;
  },

  /** Shake all boxes to indicate a wrong code */
  shakeAll() {
    document.querySelectorAll(".otp-digit").forEach((inp) => {
      inp.classList.remove("error-shake");
      // Trigger reflow so animation replays
      void inp.offsetWidth;
      inp.classList.add("error-shake");
    });
  },
};

/* ════════════════════════════════════════════════
   PASSWORD TOGGLE
   ════════════════════════════════════════════════ */
function _initPasswordToggles() {
  document.querySelectorAll(".eye-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.for);
      const isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      btn.querySelector(".eye-open").classList.toggle("hidden", isPass);
      btn.querySelector(".eye-closed").classList.toggle("hidden", !isPass);
    });
  });
}

/* ════════════════════════════════════════════════
   KEYBOARD NAVIGATION
   ════════════════════════════════════════════════ */
function _initKeyboard() {
  // Close modal on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") Modal.close();
  });

  // Submit forms on Enter (auth)
  document.getElementById("si-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") Auth.signin();
  });
  
  document.getElementById("su-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") Auth.signup();
  });

  document.getElementById("su-confirm-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") Auth.signup();
  });

  // Find films on Ctrl+Enter in textarea
  document.getElementById("mood-textarea").addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") Home.findFilms();
  });
}

/* ════════════════════════════════════════════════
   PAGE LOADER
   ════════════════════════════════════════════════ */
const Loader = {
  hide() {
    const el = document.getElementById("page-loader");
    el.classList.add("fade-out");
    el.addEventListener("transitionend", () => el.remove(), { once: true });
  },
};

/* ════════════════════════════════════════════════
   EVENT BINDINGS
   ════════════════════════════════════════════════ */
function _bindEvents() {
  // Auth
  document.getElementById("signin-btn").addEventListener("click", Auth.signin);
  document.getElementById("signup-btn").addEventListener("click", Auth.signup);
  document.getElementById("signout-btn").addEventListener("click", Auth.logout);

  // Clear error state on input
  document.querySelectorAll(".field-input").forEach((el) => {
    el.addEventListener("input", () => el.classList.remove("error"));
  });

  // Home
  document.getElementById("find-btn").addEventListener("click", Home.findFilms);
  document
    .getElementById("mood-textarea")
    .addEventListener("input", Home.updateCharCount);

  // Mood chips
  document.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".chip")
        .forEach((c) => c.classList.remove("selected"));
      btn.classList.add("selected");
      const ta = document.getElementById("mood-textarea");
      ta.value = btn.dataset.mood ?? "";
      Home.updateCharCount();
      ta.focus();
    });
  });

  // Results
  document.getElementById("back-btn").addEventListener("click", Nav.goHome);

  // Modal
  document.getElementById("modal-close").addEventListener("click", Modal.close);
  document
    .getElementById("modal-backdrop")
    .addEventListener("click", Modal.close);

  // OTP
  document
    .getElementById("otp-verify-btn")
    .addEventListener("click", Auth.verifyOTP);
  document
    .getElementById("otp-resend-btn")
    .addEventListener("click", Auth.resendOTP);
}

/* ════════════════════════════════════════════════
   EXPOSE to HTML onclick attributes (namespaced)
   ════════════════════════════════════════════════ */
window.CineMood = { Auth, Nav };

/* ════════════════════════════════════════════════
   APP INITIALISATION
   ════════════════════════════════════════════════ */
async function initApp() {
  _initPasswordToggles();
  _initKeyboard();
  _bindEvents();
  OTP.init(); // Wire OTP digit boxes

  // Check existing session (cookie sent automatically)
  try {
    const data = await API.me();
    State.user = data.user;
    Nav.setUser(data.user);
    Views.show("home");
  } catch {
    // 401 = not logged in → show auth
    Views.show("auth");
  } finally {
    Loader.hide();
  }
}

// Bootstrap on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
