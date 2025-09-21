// filter.js
const filterState = { genre: '', sort: '', priceDir: 'asc' };
const renderBooks = window.renderBooks || window.renderThumbs;
const books = window.books;

function initFilters(){
  const nav = document.querySelector('.sidebar .stack');
  if (!nav) return;

  nav.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;

    if (btn.dataset.genre !== undefined) {
      filterState.genre = btn.dataset.genre;
      markActive(btn, '[data-genre]');
    }
    if (btn.dataset.filter === 'all') {
      filterState.genre = '';
      clearGroup('[data-genre]');
      btn.classList.add('is-active');
    }
    if (btn.dataset.sort === 'popular') { filterState.sort = 'popular'; markActive(btn, '[data-sort]'); }
    if (btn.dataset.sort === 'newest')  { filterState.sort = 'newest';  markActive(btn, '[data-sort]'); }
    if (btn.dataset.sort === 'price')   {
      filterState.sort = 'price';
      filterState.priceDir = (filterState.priceDir === 'asc') ? 'desc' : 'asc';
      markActive(btn, '[data-sort]');
    }
    syncFilters();
  });

  syncFilters();
}

function syncFilters(){
  let out = books.slice();
  if (filterState.genre) out = out.filter(b => b.genre === filterState.genre);

  if (filterState.sort === 'popular') out.sort((a,b) => (b.likes||0) - (a.likes||0));
  else if (filterState.sort === 'newest') out.sort((a,b) => (b.year||0) - (a.year||0));
  else if (filterState.sort === 'price') {
    out.sort((a,b) => (a.price||0) - (b.price||0));
    if (filterState.priceDir === 'desc') out.reverse();
  }

  renderBooks(out);
}

function markActive(activeBtn, selector){
  clearGroup(selector);
  activeBtn.classList.add('is-active');
}
function clearGroup(selector){
  document.querySelectorAll(`.sidebar .stack ${selector}`)
    .forEach(b => b.classList.remove('is-active'));
}

export { initFilters };
