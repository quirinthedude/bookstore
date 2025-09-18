// scripts/template.js (global)

const escapeHTML = (s = "") =>
  String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

// Preis als € mit 2 Nachkommastellen
const fmtEUR = (n) => Number(n).toFixed(2);

// Kartenansicht für das Grid
function bookCard(b, index) {
  const src = b.thumb || b.image; // im Grid bevorzugt Thumb
  return `
    <article class="book-card" data-index="${index}" tabindex="0" role="button" aria-label="${escapeHTML(b.name)} öffnen">
      <img class="book-thumb" src="${src}" alt="${escapeHTML(b.alt || b.name)}">
      <h3>${escapeHTML(b.name)}</h3>
      <p>${escapeHTML(b.author)}</p>
      <button class="price btn btn-primary"><b>Kaufen € ${fmtEUR(b.price)}</b></button>
    </article>
  `;
}

// Dialog/Detailansicht – passt zur vorhandenen CSS-Struktur (.dialog-card, .dialog-info, .cover)
function bookDialog(b) {
  const comments = (b.comments?.length)
    ? `<h4>Kommentare</h4><ul class="comments">${
        b.comments.map(c => `<li><b>${escapeHTML(c.name)}:</b> ${escapeHTML(c.comment)}</li>`).join("")
      }</ul>`
    : "";

  return `
    <div class="dialog-card">
      <!-- linke Spalte -->
      <div class="dialog-info">
        <button class="cart-btn">🛒 In den Warenkorb – € ${fmtEUR(b.price)}</button>

        <div class="title-row">
          <h2>${escapeHTML(b.name)}</h2>
          <div class="likes">${b.likes ?? 0} ❤️</div>
        </div>

        <p class="author">von ${escapeHTML(b.author)}</p>
        <p class="year">Erschienen: ${escapeHTML(String(b.publishedYear))}</p>
        <p class="genre">Genre: ${escapeHTML(b.genre)}</p>

        <p class="summary">${escapeHTML(b.summary)}</p>
        ${comments}
      </div>

      <!-- rechte Spalte -->
      <img class="cover" src="${b.image}" alt="${escapeHTML(b.alt || b.name)}">
    </div>
  `;
}

// global machen 
window.bookCard = bookCard;
window.bookDialog = bookDialog;
