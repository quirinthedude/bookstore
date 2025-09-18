const DIALOG = document.getElementById('book-dialog');
const CONTENT = DIALOG.querySelector('.dialog-content');
const GRID = document.querySelector('.books-grid');

renderThumbs();

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

  console.log("Buchtitel:", b.name);
  console.log("Kommentare = Array?", Array.isArray(b.comments));
  console.log("Anzahl Kommentare:", b.comments ? b.comments.length : 0);

  // bookDialog(b) aus template.js generiert das Markup
  CONTENT.innerHTML = bookDialog(b);
  DIALOG.showModal();
}


  // Kommentare bauen (kompakt)
  // let comments = '';
  // if (b.comments && b.comments.length) {
  //   comments = '<h4>Kommentare</h4><ul class="comments">' +
  //     b.comments.map(c => `<li><b>${c.name}:</b> ${c.comment}</li>`).join('') +
  //     '</ul>';
  // }


// Klick aufs Backdrop -> schließen
DIALOG.addEventListener('click', (e) => {
  if (e.target === DIALOG) DIALOG.close();
});

// X-Button schließt via <form method="dialog"> automatisch
