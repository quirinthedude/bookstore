const DIALOG = document.getElementById('book-dialog');
const CONTENT = DIALOG.querySelector('.dialog-content');
const GRID = document.querySelector('.books-grid');

renderThumbs();

function renderThumbs() {
    let html = '';
    for (let index = 0; index < books.length; index++) {
        const CURRENT_BOOK = books[index];
        html += `
    <article class="book-card" onclick="openByIndex(${index})">
    <img class="book-thumb" src="${CURRENT_BOOK.thumb}" alt="${CURRENT_BOOK.alt}">
    <h3>${CURRENT_BOOK.name}</h3>
    <p>${CURRENT_BOOK.author}</p>
    <button class="price btn btn-primary"><b>Kaufen € ${CURRENT_BOOK.price.toFixed(2)}</b></button>
</article>
    `;
    }
    GRID.innerHTML = html;
}

function openByIndex(i) {
    const b = books[i];

    // Kommentare bauen (kompakt)
    let comments = '';
    if (b.comments && b.comments.length) {
        comments = '<h4>Kommentare</h4><ul class="comments">' +
            b.comments.map(c => `<li><b>${c.name}:</b> ${c.comment}</li>`).join('') +
            '</ul>';
    }

    CONTENT.innerHTML = `
    <div class="dialog-card">
  <!-- linke Spalte -->
  <div class="dialog-info">
    <button class="cart-btn">🛒 In den Warenkorb – € 19,99</button>

    <div class="title-row">
      <h2>Das Rätsel der Zeit</h2>
      <div class="likes">750 ❤️</div>
    </div>

    <p class="author">von Alexander Weiss</p>
    <p class="year">Erschienen: 2020</p>
    <p class="genre">Genre: Science-Fiction</p>

    <p class="summary">Ein Experiment lässt Sekunden überspringen …</p>
  </div>

  <!-- rechte Spalte -->
  <img class="cover" src="assets/img/das-raetsel-der-zeit.jpg" alt="">
</div>

  `;

    DIALOG.showModal();
}

// Klick aufs Backdrop -> schließen
DIALOG.addEventListener('click', (e) => {
    if (e.target === DIALOG) DIALOG.close();
});

// X-Button schließt via <form method="dialog"> automatisch
