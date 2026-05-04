const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

let STATE = {
  claudeKey: "",
  tmdbKey: "",
  currentUser: null,
  currentAnalysis: null,
  allMovies: [],
  currentPage: 1,
  totalPages: 1,
};

function init() {
  STATE.claudeKey = localStorage.getItem("cm_claude") || "";
  STATE.tmdbKey = localStorage.getItem("cm_tmdb") || "";
  const saved = localStorage.getItem("cm_user");
  if (saved) STATE.currentUser = JSON.parse(saved);

  if (!STATE.claudeKey || !STATE.tmdbKey) {
    showScreen("setup");
    return;
  }
  if (!STATE.currentUser) {
    showScreen("auth");
    buildPosterShowcase();
    buildFilmStrips();
    return;
  }
  showScreen("app");
  document.getElementById("user-name-display").textContent =
    STATE.currentUser.name;
  document.getElementById("user-avatar").textContent =
    STATE.currentUser.name[0].toUpperCase();
}

function showScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id + "-screen").classList.add("active");
}

/* ===== SETUP ===== */
function saveSetup() {
  const c = document.getElementById("claude-key").value.trim();
  const t = document.getElementById("tmdb-key").value.trim();
  if (!c || !t) {
    showToast("Please enter both API keys.", "error");
    return;
  }
  localStorage.setItem("cm_claude", c);
  localStorage.setItem("cm_tmdb", t);
  STATE.claudeKey = c;
  STATE.tmdbKey = t;
  showScreen("auth");
  buildPosterShowcase();
  buildFilmStrips();
}

/* ===== AUTH ===== */
let authMode = "signin";
function switchTab(mode) {
  authMode = mode;
  document
    .getElementById("signin-tab")
    .classList.toggle("active", mode === "signin");
  document
    .getElementById("signup-tab")
    .classList.toggle("active", mode === "signup");
  document.getElementById("signin-view").style.display =
    mode === "signin" ? "" : "none";
  document.getElementById("signup-view").style.display =
    mode === "signup" ? "" : "none";
  document.getElementById("signup-name-group").style.display =
    mode === "signup" ? "block" : "none";
  document.getElementById("auth-btn").textContent =
    mode === "signin" ? "Sign In" : "Create Account";
  document.getElementById("switch-text").innerHTML =
    mode === "signin"
      ? "Don't have an account? <a onclick=\"switchTab('signup')\">Sign up free</a>"
      : "Already have an account? <a onclick=\"switchTab('signin')\">Sign in</a>";
}

function handleAuth() {
  const email = document.getElementById("auth-email").value.trim();
  const pass = document.getElementById("auth-password").value;
  const name = document.getElementById("auth-name").value.trim();
  if (!email || !pass) {
    showToast("Please fill in all fields.", "error");
    return;
  }
  const users = JSON.parse(localStorage.getItem("cm_users") || "[]");

  if (authMode === "signup") {
    if (!name) {
      showToast("Please enter your name.", "error");
      return;
    }
    if (users.find((u) => u.email === email)) {
      showToast("Email already registered.", "error");
      return;
    }
    if (pass.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    const newUser = { id: Date.now(), name, email, password: pass };
    users.push(newUser);
    localStorage.setItem("cm_users", JSON.stringify(users));
    STATE.currentUser = newUser;
  } else {
    const user = users.find((u) => u.email === email && u.password === pass);
    if (!user) {
      showToast("Invalid email or password.", "error");
      return;
    }
    STATE.currentUser = user;
  }
  localStorage.setItem("cm_user", JSON.stringify(STATE.currentUser));
  document.getElementById("user-name-display").textContent =
    STATE.currentUser.name;
  document.getElementById("user-avatar").textContent =
    STATE.currentUser.name[0].toUpperCase();
  showScreen("app");
  showToast("Welcome, " + STATE.currentUser.name + "! 🎬", "success");
}

function signOut() {
  STATE.currentUser = null;
  localStorage.removeItem("cm_user");
  showScreen("auth");
  showToast("Signed out successfully.", "success");
}

/* ===== MOOD ANALYSIS ===== */
function setMood(el) {
  document.getElementById("mood-input").value = el.textContent.replace(
    /^[^\s]+\s/,
    "",
  );
}
function handleKey(e) {
  if (e.ctrlKey && e.key === "Enter") analyzeMood();
}

async function analyzeMood() {
  const text = document.getElementById("mood-input").value.trim();
  if (!text) {
    showToast("Please describe how you're feeling first.", "error");
    return;
  }

  setAnalyzing(true, "Analyzing your mood with AI...");
  document.getElementById("analysis-result").style.display = "none";
  document.getElementById("results-section").style.display = "none";

  try {
    setAnalyzing(true, "Reading your emotions...");
    const moodData = await callClaude(text);
    STATE.currentAnalysis = moodData;
    showAnalysisResult(moodData);

    setAnalyzing(true, "Searching TMDB for matching films...");
    const movies = await fetchMovies(moodData.genres, moodData.keywords || []);
    STATE.allMovies = movies;
    STATE.currentPage = 1;

    setAnalyzing(false);
    renderMovies(movies, moodData);
  } catch (err) {
    setAnalyzing(false);
    showToast("Error: " + err.message, "error");
    console.error(err);
  }
}

async function callClaude(moodText){
  const res = await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'x-api-key':STATE.claudeKey,
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true'
    },
    body:JSON.stringify({
      model:'claude-sonnet-4-20250514',
      max_tokens:600,
      messages:[{
        role:'user',
        content:`Analyze this mood and return ONLY a valid JSON object, no markdown, no explanation:
"${moodText}"

Return EXACTLY this structure:
{
  "mood": ["list","of","2-5","mood","adjectives"],
  "genres": [list of 2-4 TMDB genre ID numbers],
  "keywords": ["2-4 thematic keywords for the films e.g. friendship, redemption"],
  "vibe": "one evocative sentence about what kind of film would suit this mood"
}

TMDB genre IDs: 28=Action, 12=Adventure, 16=Animation, 35=Comedy, 80=Crime, 99=Documentary, 18=Drama, 10751=Family, 14=Fantasy, 36=History, 27=Horror, 10402=Music, 9648=Mystery, 10749=Romance, 878=Sci-Fi, 53=Thriller, 10752=War, 37=Western

Return only the JSON object.`
      }]
    })
  });
  if(!res.ok){
    const e = await res.json();
    throw new Error(e.error?.message || 'Claude API error');
  }
  const data = await res.json();
  const raw = data.content[0].text.trim().replace(/```json|```/g,'').trim();
  return JSON.parse(raw);
}

// async function callClaude(moodText) {
//   const res = await fetch(
//     `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${STATE.claudeKey}`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         contents: [
//           {
//             parts: [
//               {
//                 text: `Analyze this mood and return ONLY a valid JSON object, no markdown, no explanation:
// "${moodText}"

// Return EXACTLY this structure:
// {
//   "mood": ["list","of","2-5","mood","adjectives"],
//   "genres": [list of 2-4 TMDB genre ID numbers],
//   "keywords": ["2-4 thematic keywords for the films e.g. friendship, redemption"],
//   "vibe": "one evocative sentence about what kind of film would suit this mood"
// }

// TMDB genre IDs: 28=Action, 12=Adventure, 16=Animation, 35=Comedy, 80=Crime, 99=Documentary, 18=Drama, 10751=Family, 14=Fantasy, 36=History, 27=Horror, 10402=Music, 9648=Mystery, 10749=Romance, 878=Sci-Fi, 53=Thriller, 10752=War, 37=Western

// Return only the JSON object.`,
//               },
//             ],
//           },
//         ],
//       }),
//     },
//   );

//   if (!res.ok) {
//     const e = await res.json();
//     throw new Error(e.error?.message || "Gemini API error");
//   }

//   const data = await res.json();
//   const raw = data.candidates[0].content.parts[0].text
//     .trim()
//     .replace(/```json|```/g, "")
//     .trim();

//   return JSON.parse(raw);
// }

async function fetchMovies(genreIds, keywords) {
  const genreStr = genreIds.join("|");
  const pages = await Promise.all(
    [1, 2].map((p) =>
      fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${STATE.tmdbKey}&with_genres=${genreStr}&sort_by=vote_average.desc&vote_count.gte=80&page=${p}&language=en-US`,
      ).then((r) => r.json()),
    ),
  );
  let movies = [];
  pages.forEach((p) => {
    if (p.results) movies.push(...p.results);
  });
  // deduplicate
  const seen = new Set();
  movies = movies.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
  return movies.slice(0, 40);
}

function showAnalysisResult(data) {
  const el = document.getElementById("analysis-result");
  const genreNames = (data.genres || [])
    .map((id) => GENRE_MAP[id] || id)
    .filter(Boolean);
  const moodTags = (data.mood || [])
    .map(
      (m, i) =>
        `<span class="mood-tag ${i < 2 ? "primary" : "secondary"}">${m}</span>`,
    )
    .join("");

  el.innerHTML = `
    <div class="analysis-result">
      <div class="analysis-result-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
        Mood Analysis
        <button class="json-toggle" onclick="toggleJson()" style="margin-left:auto">{ } JSON</button>
      </div>
      <div class="analysis-grid">
        <div>
          <p class="analysis-label">Detected Moods</p>
          <div class="mood-tags">${moodTags}</div>
        </div>
        <div>
          <p class="analysis-label">Film Genres</p>
          <div class="mood-tags">${genreNames.map((g) => `<span class="mood-tag secondary">${g}</span>`).join("")}</div>
        </div>
        <div style="flex:1;min-width:200px">
          <p class="analysis-label">Film Vibe</p>
          <p class="vibe-text">"${data.vibe || ""}"</p>
        </div>
      </div>
      <pre class="json-block" id="json-block">${JSON.stringify(data, null, 2)}</pre>
    </div>`;
  el.style.display = "block";
}

function toggleJson() {
  document.getElementById("json-block").classList.toggle("show");
}

function renderMovies(movies, analysis) {
  const section = document.getElementById("results-section");
  const grid = document.getElementById("movie-grid");
  const genres = (analysis.genres || [])
    .map((id) => GENRE_MAP[id])
    .filter(Boolean);

  document.getElementById("results-title").textContent =
    `${genres.slice(0, 2).join(" & ")} films for your mood`;
  document.getElementById("results-count").textContent =
    `${movies.length} films found`;

  const perPage = 20;
  STATE.totalPages = Math.ceil(movies.length / perPage);
  renderPage(movies, STATE.currentPage, perPage);
  renderPagination();
  section.style.display = "block";
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPage(movies, page, perPage = 20) {
  const grid = document.getElementById("movie-grid");
  const start = (page - 1) * perPage,
    end = start + perPage;
  const slice = movies.slice(start, end);
  grid.innerHTML = slice.map((m) => movieCardHTML(m)).join("");
}

function movieCardHTML(m) {
  const poster = m.poster_path
    ? `<img class="movie-poster" src="https://image.tmdb.org/t/p/w342${m.poster_path}" alt="${escHtml(m.title)}" loading="lazy">`
    : `<div class="movie-poster-placeholder">🎬</div>`;
  const year = m.release_date ? m.release_date.slice(0, 4) : "—";
  const rating = m.vote_average ? m.vote_average.toFixed(1) : "—";
  const overview =
    (m.overview || "No overview available.").slice(0, 180) + "...";
  const genreBadges = (m.genre_ids || [])
    .slice(0, 3)
    .map((id) => `<span class="genre-badge">${GENRE_MAP[id] || ""}</span>`)
    .join("");

  return `<div class="movie-card" onclick="showMovie(${m.id})">
    ${poster}
    <div class="movie-overlay">
      <p class="movie-overlay-title">${escHtml(m.title)}</p>
      <p class="movie-overview">${escHtml(m.overview || "")}</p>
      <div class="movie-genre-badges">${genreBadges}</div>
    </div>
    <div class="movie-info">
      <p class="movie-title">${escHtml(m.title)}</p>
      <div class="movie-meta">
        <span class="movie-year">${year}</span>
        <span class="movie-rating">
          <svg class="star-icon" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
          ${rating}
        </span>
      </div>
    </div>
  </div>`;
}

function renderPagination() {
  const p = document.getElementById("pagination");
  if (STATE.totalPages <= 1) {
    p.innerHTML = "";
    return;
  }
  let html = "";
  for (let i = 1; i <= STATE.totalPages; i++) {
    html += `<button class="page-btn ${i === STATE.currentPage ? "active" : ""}" onclick="goPage(${i})">${i}</button>`;
  }
  p.innerHTML = html;
}

function goPage(n) {
  STATE.currentPage = n;
  renderPage(STATE.allMovies, n);
  renderPagination();
  document
    .getElementById("results-section")
    .scrollIntoView({ behavior: "smooth" });
}

/* ===== MOVIE DETAIL ===== */
async function showMovie(id) {
  const movie = STATE.allMovies.find((m) => m.id === id);
  if (!movie) return;
  document.getElementById("modal-title").textContent = movie.title;
  const poster = movie.poster_path
    ? `<img class="movie-detail-poster" src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${escHtml(movie.title)}">`
    : "";
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "";
  const genres = (movie.genre_ids || [])
    .map((id) => GENRE_MAP[id])
    .filter(Boolean);

  document.getElementById("modal-body").innerHTML = `
    ${poster}
    <h2 class="movie-detail-title">${escHtml(movie.title)}</h2>
    <div class="movie-detail-meta">
      ${year ? `<span class="badge">📅 ${year}</span>` : ""}
      ${rating ? `<span class="badge">⭐ ${rating}/10</span>` : ""}
      ${genres
        .slice(0, 3)
        .map((g) => `<span class="badge">${g}</span>`)
        .join("")}
    </div>
    <p class="movie-detail-overview">${escHtml(movie.overview || "No overview available.")}</p>
  `;
  document.getElementById("movie-modal").classList.add("open");
}

function closeModal(e) {
  if (e.target.id === "movie-modal")
    document.getElementById("movie-modal").classList.remove("open");
}

/* ===== HELPERS ===== */
function setAnalyzing(show, text = "") {
  const s = document.getElementById("analyzing-state");
  const b = document.getElementById("analyze-btn");
  s.style.display = show ? "flex" : "none";
  b.disabled = show;
  if (text) document.getElementById("analyzing-text").textContent = text;
}

function resetSearch() {
  document.getElementById("results-section").style.display = "none";
  document.getElementById("analysis-result").style.display = "none";
  document.getElementById("mood-input").value = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

let toastTimer;
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3500);
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ===== UI DECORATIONS ===== */
function buildFilmStrips() {
  const c = document.getElementById("film-strips");
  if (!c) return;
  const positions = [5, 92];
  positions.forEach((left) => {
    const strip = document.createElement("div");
    strip.className = "strip";
    strip.style.cssText = `left:${left}%;top:0;height:100%;`;
    for (let i = 0; i < 30; i++) {
      const h = document.createElement("div");
      h.className = "strip-hole";
      strip.appendChild(h);
    }
    c.appendChild(strip);
  });
}

function buildPosterShowcase() {
  const grid = document.getElementById("poster-showcase");
  if (!grid) return;
  const popular = [603, 550, 27205, 238, 278, 680, 13, 424, 637, 129];
  const four = popular.slice(0, 4);
  grid.innerHTML = four
    .map(
      (id) => `
    <div class="poster-card">
      <img src="https://image.tmdb.org/t/p/w342" alt="" style="display:none"
           onerror="this.style.display='none'"
           data-id="${id}">
      <div class="poster-placeholder" style="background:linear-gradient(135deg,#${Math.floor(
        Math.random() * 0x444 + 0x222,
      )
        .toString(16)
        .padStart(6, "0")} 0%,#${Math.floor(Math.random() * 0x222 + 0x111)
        .toString(16)
        .padStart(6, "0")} 100%)">🎬</div>
    </div>`,
    )
    .join("");

  // Try to load real posters from TMDB
  if (STATE.tmdbKey) {
    four.forEach(async (id, i) => {
      try {
        const r = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${STATE.tmdbKey}`,
        );
        const d = await r.json();
        if (d.poster_path) {
          const card = grid.children[i];
          if (card)
            ((card.style.backgroundImage = `url(https://image.tmdb.org/t/p/w342${d.poster_path})`),
              (card.style.backgroundSize = "cover"),
              (card.style.backgroundPosition = "center"));
          const ph = card && card.querySelector(".poster-placeholder");
          if (ph) ph.style.display = "none";
        }
      } catch (e) {}
    });
  }
}

init();
