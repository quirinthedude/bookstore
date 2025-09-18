// scripts/script.js

// --- DOM-Grundlagen -------------------------------------------------------
const DIALOG  = document.getElementById('book-dialog');
const CONTENT = DIALOG.querySelector('.dialog-content');
const GRID    = document.querySelector('.books-grid');

// --- Toasts (dezente Einblendungen) ---------------------------------------
function ensureToastHost() {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    document.body.appendChild(host);
  }
  return host;
}

function showToast(message, type = 'info', ms = 2500) {
  const host = ensureToastHost();
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.role = 'status';
  el.ariaLive = 'polite';
  el.textContent = message;

  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));

  const hideAt   = setTimeout(() => el.classList.remove('in'), ms);
  const removeAt = setTimeout(() => el.remove(), ms + 400);

  el.addEventListener('click', () => {
    clearTimeout(hideAt); clearTimeout(removeAt);
    el.classList.remove('in');
    setTimeout(() => el.remove(), 300);
  });
}

// --- LocalStorage: Kommentare ---------------------------------------------
const LS_KEY = 'bookstore_comments_v1';

function loadLocalComments() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
  catch { return {}; }
}

function saveLocalComment(slug, entry) {
  const db = loadLocalComments();
  (db[slug] ||= []).push(entry);
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}

function getMergedComments(b) {
  const db = loadLocalComments();
  const local = db[b.slug] || [];
  return [...(b.comments || []), ...local];
}

// --- Rate-Limit pro Buch (Slug) -------------------------------------------
const RATE_MS  = 10_000;                 // 10 Sekunden zwischen Posts je Buch
const RATE_KEY = 'bookstore_rate_v1';

function _rateDB() {
  try { return JSON.parse(localStorage.getItem(RATE_KEY) || '{}'); }
  catch { return {}; }
}
function _saveRateDB(db) {
  localStorage.setItem(RATE_KEY, JSON.stringify(db));
}
function canPost(slug) {
  const db = _rateDB();
  const last = db[slug] || 0;
  return (Date.now() - last) >= RATE_MS;
}
function stampPost(slug) {
  const db = _rateDB();
  db[slug] = Date.now();
  _saveRateDB(db);
}
function secondsRemaining(slug) {
  const db = _rateDB();
  const last = db[slug] || 0;
  const left = RATE_MS - (Date.now() - last);
  return Math.max(0, Math.ceil(left / 1000));
}

// --- Render Liste (Thumbnails) --------------------------------------------
function renderThumbs() {
  GRID.innerHTML = books.map((b, i) => bookCard(b, i)).join('');

  // Click-Delegation nur EINMAL binden
  if (!GRID.dataset.bound) {
    GRID.addEventListener('click', (e) => {
      const card = e.target.closest('.book-card');
      if (!card) return;
      const i = Number(card.dataset.index);
      if (!Number.isNaN(i)) openByIndex(i);
    });
    GRID.dataset.bound = '1';
  }
}

// --- Dialog öffnen ---------------------------------------------------------
function openByIndex(i) {
  const b = books[i];
  if (!b) return;

  const bWithComments = { ...b, comments: getMergedComments(b) };

  showToast(`„${bWithComments.name}“ geöffnet • ${bWithComments.comments.length} Kommentar(e)`, 'info', 1600);

  CONTENT.innerHTML = bookDialog(bWithComments); // wichtig: mit gemergten Kommentaren
  DIALOG.showModal();
}

// Backdrop-Klick schließt
DIALOG.addEventListener('click', (e) => {
  if (e.target === DIALOG) DIALOG.close();
});

// --- Kommentar-Submit (delegiert) -----------------------------------------
document.addEventListener('submit', (e) => {
  const form = e.target.closest('.comment-form');
  if (!form) return;
  e.preventDefault(); // Dialog NICHT schließen

  const name = form.name.value.trim();
  const text = form.comment.value.trim();
  const slug = form.dataset.slug || '';
  if (!name || !text || !slug) return;

  // Rate-Limit pro Buch prüfen
  if (!canPost(slug)) {
    showToast(`Bitte warte ${secondsRemaining(slug)}s, bevor du erneut für dieses Buch postest.`, 'warn', 2200);
    return;
  }

  // Speichern (nur lokal)
  saveLocalComment(slug, { name, comment: text });
  stampPost(slug);
  form.reset();
  showToast('Kommentar gespeichert (nur lokal)', 'success', 2200);

  // Dialog neu öffnen, damit der frische Kommentar sichtbar ist
  const idx = books.findIndex(b => (b.slug || '') === slug);
  if (idx !== -1) openByIndex(idx);
});

// --- Start -----------------------------------------------------------------
renderThumbs();
