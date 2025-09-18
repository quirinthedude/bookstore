// scripts/script.js - kommentierte Version

// --- DOM-Grundlagen -------------------------------------------------------
// globale Referenzen auf die wichtigsten DOM-Elemente
const DIALOG  = document.getElementById('book-dialog');           // <dialog>
const CONTENT = DIALOG.querySelector('.dialog-content');         // Container, in den wir bookDialog() setzen
const GRID    = document.querySelector('.books-grid');           // Haupt-Grid für Karten

// --- Toasts (dezente Einblendungen) ---------------------------------------
/*
  Kleine helper, die einen Toast-Host erstellen und kurz sichtbare Meldungen zeigen.
  showToast('Text', 'success'|'warn'|'info', millis)
*/
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
  // Animation: add class in next frame
  requestAnimationFrame(() => el.classList.add('in'));

  // automatisches Ausblenden / Entfernen
  const hideAt   = setTimeout(() => el.classList.remove('in'), ms);
  const removeAt = setTimeout(() => el.remove(), ms + 400);

  // Klick schliesst sofort
  el.addEventListener('click', () => {
    clearTimeout(hideAt); clearTimeout(removeAt);
    el.classList.remove('in');
    setTimeout(() => el.remove(), 300);
  });
}

// --- LocalStorage: Kommentare ---------------------------------------------
/*
  LS_KEY: Key im localStorage.
  loadLocalComments() liest das DB-Objekt { slug1: [...], slug2: [...] }
  saveLocalComment(slug, entry) hängt einen neuen Kommentar an.
  getMergedComments(b): kombiniert initiale (books.js) comments mit lokalen.
*/
const LS_KEY = 'bookstore_comments_v1';

function loadLocalComments() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
  catch { return {}; } // defensive fallback
}

function saveLocalComment(slug, entry) {
  const db = loadLocalComments();
  (db[slug] ||= []).push(entry);            // ||= ist kurz für: db[slug] = db[slug] || []
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}

function getMergedComments(b) {
  const db = loadLocalComments();
  const local = db[b.slug] || [];
  // initial comments aus books.js zuerst, dann lokales (so bleiben originale als "Quelle")
  return [...(b.comments || []), ...local];
}

// --- Rate-Limit pro Buch (Slug) -------------------------------------------
/*
  RATE_MS verhindert Flooding pro Buch.
  _rateDB/_saveRateDB lesen/schreiben ein kleines registry-Objekt in localStorage.
  canPost(stub) prüft, stampPost setzt timestamp.
*/
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
/*
  renderThumbs() baut GRID via bookCard(template) auf.
  Wichtig: Click-Delegation einmalig binden (Flag in dataset verhindert doppelte Listener).
*/
function renderThumbs() {
  // benutze dein template(bookCard) - muss global verfügbar sein (window.bookCard)
  GRID.innerHTML = books.map((b, i) => bookCard(b, i)).join('');

  // Click-Delegation nur EINMAL binden (Verhindert mehrfaches Anhängen)
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
/*
  openByIndex(i) sucht das Buch, merged lokale Kommentare und setzt den Dialogcontent.
  Wir benachrichtigen per Toast und rufen showModal() auf.
*/
function openByIndex(i) {
  const b = books[i];
  if (!b) return;

  const bWithComments = { ...b, comments: getMergedComments(b) };

  showToast(`„${bWithComments.name}“ geöffnet • ${bWithComments.comments.length} Kommentar(e)`, 'info', 1600);

  // sehr wichtig: benutze bookDialog(bWithComments) (nicht bookDialog(b))
  CONTENT.innerHTML = bookDialog(bWithComments);
  DIALOG.showModal();
}

// Backdrop-Klick schließt (UX)
DIALOG.addEventListener('click', (e) => {
  if (e.target === DIALOG) DIALOG.close();
});

// --- Kommentar-Submit (delegiert) -----------------------------------------
/*
  Delegiertes submit: fängt jede comment-form im Dialog.
  Prüft canPost(slug) und speichert lokal, dann stampPost(slug) und rendert Dialog neu.
*/
document.addEventListener('submit', (e) => {
  const form = e.target.closest('.comment-form');
  if (!form) return;
  e.preventDefault(); // wichtig: verhindern, dass Browser default-Submit läuft

  const name = form.name.value.trim();
  const text = form.comment.value.trim();
  const slug = form.dataset.slug || '';
  if (!name || !text || !slug) return;

  // Rate-Limit pro Buch prüfen
  if (!canPost(slug)) {
    showToast(`Bitte warte ${secondsRemaining(slug)}s, bevor du erneut für dieses Buch postest.`, 'warn', 2200);
    return;
  }

  // speichern (lokal)
  saveLocalComment(slug, { name, comment: text });
  stampPost(slug);
  form.reset();
  showToast('Kommentar gespeichert (nur lokal)', 'success', 2200);

  // Dialog neu öffnen, damit der neue Kommentar sichtbar ist
  const idx = books.findIndex(b => (b.slug || '') === slug);
  if (idx !== -1) openByIndex(idx);
});

// --- Start -----------------------------------------------------------------
renderThumbs();
