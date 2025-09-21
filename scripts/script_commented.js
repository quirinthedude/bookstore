// scripts/script_commented.js

// --- DOM-Grundlagen -------------------------------------------------------
// Haupt-Referenzen
const DIALOG = document.getElementById('book-dialog');          // <dialog>
const CONTENT = DIALOG.querySelector('.dialog-content');         // Container, in den wir bookDialog() setzen
const GRID = document.querySelector('.books-grid');           // Grid mit den Karten

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
  requestAnimationFrame(() => el.classList.add('in')); // animiertes Einblenden

  const hideAt = setTimeout(() => el.classList.remove('in'), ms);
  const removeAt = setTimeout(() => el.remove(), ms + 400);

  // per Klick sofort schließen
  el.addEventListener('click', () => {
    clearTimeout(hideAt); clearTimeout(removeAt);
    el.classList.remove('in');
    setTimeout(() => el.remove(), 300);
  });
}

// --- LocalStorage: Kommentare ---------------------------------------------
const LS_KEY = 'bookstore_comments_v1';

// liest DB-Objekt { slug1: [ {name, comment}, ... ], slug2: [...] }
function loadLocalComments() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
  catch { return {}; }
}

// hängt Kommentar an ein slug an und speichert zurück
function saveLocalComment(slug, entry) {
  const db = loadLocalComments();
  (db[slug] ||= []).push(entry);
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}

// merged initiale Kommentare (aus books.js) + lokale aus LS
function getMergedComments(b) {
  const db = loadLocalComments();
  const local = db[b.slug] || [];
  return [...(b.comments || []), ...local];
}

// --- Rate-Limit pro Buch ---------------------------------------------------
const RATE_MS = 10_000;                 // 10 Sekunden zwischen Posts je Buch
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

// --- Kartenliste rendern ---------------------------------------------------
// function renderThumbs() {
//   // bookCard kommt global aus template.js (window.bookCard)
//   GRID.innerHTML = books.map((b, i) => bookCard(b, i)).join('');

//   // Click-Delegation nur EINMAL binden (Flag verhindert Doppelt-Listener)
//   if (!GRID.dataset.bound) {
//     GRID.addEventListener('click', (e) => {
//       const card = e.target.closest('.book-card');
//       if (!card) return;
//       const i = Number(card.dataset.index);
//       if (!Number.isNaN(i)) openByIndex(i);
//     });
//     GRID.dataset.bound = '1';
//   }
// }

// alt:
// function renderThumbs() {
// neu:
function renderBooks(list = books) {
  GRID.innerHTML = list.map((b) => {
    const i = books.findIndex(x => (x.slug || x.name) === (b.slug || b.name));
    return bookCard(b, i); // <-- Originalindex!
  }).join('');

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

  // WICHTIG: mit gemergten Kommentaren rendern
  const bWithComments = { ...b, comments: getMergedComments(b) };

  showToast(`„${bWithComments.name}“ geöffnet • ${bWithComments.comments.length} Kommentar(e)`, 'info', 1600);

  CONTENT.innerHTML = bookDialog(bWithComments); // bookDialog kommt global aus template.js
  DIALOG.showModal();
}

// Backdrop-Klick schließt (UX)
DIALOG.addEventListener('click', (e) => {
  if (e.target === DIALOG) DIALOG.close();
});

// --- Kommentar absenden (delegierter Submit, FormData!) -------------------
document.addEventListener('submit', (e) => {
  const form = e.target.closest('.comment-form');
  if (!form) return;
  e.preventDefault(); // verhindert, dass der Browser ein echtes Form-Submit macht

  // Werte sicher auslesen (kein name/comment Property-Conflict)
  const fd = new FormData(form);
  console.log('submit', {
    slug: form.dataset.slug,
    name: fd.get('name'),
    comment: fd.get('comment')
  });
  const name = String(fd.get('name') || '').trim();
  const text = String(fd.get('comment') || '').trim();
  const slug = form.dataset.slug || '';

  if (!name || !text || !slug) {
    showToast('Bitte Name und Kommentar ausfüllen.', 'warn', 2000);
    return;
  }

  // Rate-Limit pro Buch prüfen
  if (!canPost(slug)) {
    showToast(`Bitte warte ${secondsRemaining(slug)}s, bevor du erneut postest.`, 'warn', 2200);
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

// --- Start ---------------------------------------------------------------
renderBooks(books);
window.renderBooks = renderBooks;
