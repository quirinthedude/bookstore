const DIALOG = document.getElementById('book-dialog');
const CONTENT = DIALOG.querySelector('.dialog-content');
const GRID = document.querySelector('.books-grid');

// Optional: Mini-Rate-Limit (10s)
let lastPostAt = 0;

// Delegierter Submit-Handler für Kommentar-Formulare
document.addEventListener('submit', (e) => {
  const form = e.target.closest('.comment-form');
  if (!form) return;
  e.preventDefault(); // NICHT den Dialog schließen

  const now = Date.now();
  if (now - lastPostAt < 10_000) {
    alert('Bitte warte kurz, bevor du erneut postest.');
    return;
  }

  const name = form.name.value.trim();
  const text = form.comment.value.trim();
  const slug = form.dataset.slug || '';

  if (!name || !text || !slug) return;

  // speichern (nur lokal)
  saveLocalComment(slug, { name, comment: text });

  // Felder leeren & Dialog neu rendern (damit der neue Kommentar erscheint)
  form.reset();
  lastPostAt = now;

  // Finde das Buch neu und öffne nochmal (mit Merge)
  const idx = books.findIndex(b => (b.slug || '') === slug);
  if (idx !== -1) openByIndex(idx);
});

// Start: Bücher-Grid rendern
renderThumbs();

// --- Toasts ---------------------------------------------------------------
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

  // Ein-/Ausblenden
  requestAnimationFrame(() => el.classList.add('in'));
  const hideAt = setTimeout(() => el.classList.remove('in'), ms);
  const removeAt = setTimeout(() => el.remove(), ms + 400);

  // vorzeitig schließen per Klick
  el.addEventListener('click', () => {
    clearTimeout(hideAt); clearTimeout(removeAt);
    el.classList.remove('in');
    setTimeout(() => el.remove(), 300);
  });
}

function renderThumbs() {
  // Karten per Template erzeugen (bookCard erwartet b und index)
  GRID.innerHTML = books.map((b, i) => bookCard(b, i)).join('');

  // Click nur EINMAL binden
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

function openByIndex(i) {
  const b = books[i];
  if (!b) return;

  // Merge initial + local comments für die Anzeige
  const bWithComments = { ...b, comments: getMergedComments(b) };

  // Debug-Ausgabe (kannst du später löschen)
  console.log("Öffne", b.slug, "Kommentare:", bWithComments.comments);

  // bookDialog(b) aus template.js generiert das Markup
  CONTENT.innerHTML = bookDialog(bWithComments);
  DIALOG.showModal();
}

// Klick aufs Backdrop -> schließen
DIALOG.addEventListener('click', (e) => {
  if (e.target === DIALOG) DIALOG.close();
});

// X-Button schließt via <form method="dialog"> automatisch

const LS_KEY = 'bookstore_comments_v1';

// Kommentare aus localStorage lesen
function loadLocalComments() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
  catch { return {}; }
}

// Kommentar speichern (append)
function saveLocalComment(slug, entry) {
  const db = loadLocalComments();
  db[slug] = db[slug] || [];
  db[slug].push(entry);
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}

// Kommentare eines Buchs mergen (initial + lokal)
function getMergedComments(b) {
  const db = loadLocalComments();
  const local = db[b.slug] || [];
  return [...(b.comments || []), ...local];
}
