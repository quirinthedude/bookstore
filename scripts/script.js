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

function openByIndex(i){
  const b = books[i];

  // Kommentare bauen (kompakt)
  let comments = '';
  if (b.comments && b.comments.length){
    comments = '<h4>Kommentare</h4><ul class="comments">' +
      b.comments.map(c => `<li><b>${c.name}:</b> ${c.comment}</li>`).join('') +
      '</ul>';
  }

  CONTENT.innerHTML = `
    <img class="cover" src="${b.image}" alt="${b.alt}">
    <div>
      <h2>${b.name}</h2>
      <p><i>${b.author}</i></p>
      <ul class="meta">
        <li><b>Genre:</b> ${b.genre}</li>
        <li><b>Erschienen:</b> ${b.publishedYear}</li>
        <li><b>Preis:</b> € ${b.price.toFixed(2)}</li>
        <li><b>Likes:</b> ${b.likes} ${b.liked ? '❤️' : ''}</li>
      </ul>
      <p class="summary">${b.summary}</p>
      ${comments}
    </div>
  `;

  DIALOG.showModal();
}

// Klick aufs Backdrop -> schließen
DIALOG.addEventListener('click', (e) => {
  if (e.target === DIALOG) DIALOG.close();
});

// X-Button schließt via <form method="dialog"> automatisch
