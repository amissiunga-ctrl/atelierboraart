/* ============================================================
   ATELIER BORAART — gallery.js
   Génère les cartes d'œuvres à partir de works.json.
   - Sur galerie.html : remplit .grid-galerie avec TOUTES les œuvres
   - Sur index.html   : remplit [data-featured-grid] avec les œuvres "featured"
   Le HTML produit est identique à vos cartes d'origine,
   donc lightbox / filtres / prix / langue / schema continuent de marcher.
   ============================================================ */
(function () {
  // Conteneurs possibles sur la page courante
  const fullGrid     = document.querySelector('.grid-galerie[data-dynamic]');
  const featuredGrid = document.querySelector('[data-featured-grid]');
  if (!fullGrid && !featuredGrid) return; // page sans grille dynamique

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // Valeurs HD par défaut : garantissent que TOUTE œuvre soit marquée "haute résolution",
  // même si les champs ne sont pas renseignés dans works.json / admin.html.
  const HD_DEFAULTS = {
    dpi: 300,
    pixels: '6614 × 9449 px',
    printSize: '56 × 80 cm'
  };

  // Déduit le type de fichier (PNG/JPG…) à partir du nom de l'image
  function fileTypeFromImage(name) {
    const m = (name || '').match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toUpperCase().replace('JPEG', 'JPG') : 'JPG';
  }

  function buildCard(work) {
    const price = work.price;
    const dpi = work.dpi || HD_DEFAULTS.dpi;
    const pixels = esc(work.pixels || HD_DEFAULTS.pixels);
    const printSize = esc(work.printSize || HD_DEFAULTS.printSize);
    const fileType = esc(work.fileType || fileTypeFromImage(work.image));

    return `
      <article class="card" data-category="${esc(work.category)}">
        <div class="card__img-wrap">
          <img src="images/${esc(work.image)}" alt="${esc(work.alt || work.title.fr)}" class="card__img" loading="lazy" />
          <span class="card__badge card__badge--hd" title="Fichier haute résolution">★ HD · ${dpi} dpi</span>
        </div>
        <div class="card__body">
          <span class="card__category" data-lang="fr">${esc(work.categoryLabel.fr)}</span>
          <span class="card__category" data-lang="en">${esc(work.categoryLabel.en)}</span>
          <h3 class="card__title"><span data-lang="fr">${esc(work.title.fr)}</span><span data-lang="en">${esc(work.title.en)}</span></h3>
          <p class="card__desc" data-lang="fr">${esc(work.description.fr)}</p>
          <p class="card__desc" data-lang="en">${esc(work.description.en)}</p>
          <div class="card__hd-info" title="${fileType} ${pixels} — ${dpi} dpi">
            <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            <span data-lang="fr">Haute résolution · ${fileType} ${pixels}</span>
            <span data-lang="en">High resolution · ${fileType} ${pixels}</span>
          </div>
          <div class="card__footer">
            <div class="card__price">
              <span class="card__price-amount" data-usd="${price}">${price} USD</span>
              <span data-lang="fr">Téléchargement immédiat</span>
              <span data-lang="en">Instant download</span>
            </div>
            <a href="${esc(work.payhipUrl)}" class="btn btn--buy" data-lang="fr" target="_blank" rel="noopener">Acheter sur Payhip</a>
            <a href="${esc(work.payhipUrl)}" class="btn btn--buy" data-lang="en" target="_blank" rel="noopener">Buy on Payhip</a>
            <p class="card__pay-note">
              <span data-lang="fr">Prix converti à titre indicatif · paiement final en USD</span>
              <span data-lang="en">Converted price for reference · final payment in USD</span>
            </p>
          </div>
        </div>
      </article>`;
  }

  function render(data) {
    const works = Array.isArray(data.works) ? data.works : [];

    if (fullGrid) {
      fullGrid.innerHTML = works.map(w => buildCard(w)).join('');
    }
    if (featuredGrid) {
      const limit = parseInt(featuredGrid.getAttribute('data-featured-grid'), 10) || 6;
      const featured = works.filter(w => w.featured).slice(0, limit);
      const list = featured.length ? featured : works.slice(0, limit);
      featuredGrid.innerHTML = list.map(w => buildCard(w)).join('');
    }

    // Signale aux autres scripts que les cartes sont prêtes
    document.dispatchEvent(new CustomEvent('works:rendered'));
  }

  // 1) Priorité aux données embarquées (works-data.js) → marche partout,
  //    y compris en file:// ou dans un aperçu sans réseau.
  if (window.BORAART_WORKS) {
    render(window.BORAART_WORKS);
    return;
  }

  // 2) Sinon, on tente de charger works.json (nécessite un serveur http).
  fetch('works.json', { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error('works.json introuvable (HTTP ' + r.status + ')');
      return r.json();
    })
    .then(render)
    .catch(err => {
      console.error('[gallery.js]', err);
      const msg = '<p style="grid-column:1/-1; text-align:center; opacity:.7;">' +
        'Impossible de charger les œuvres. Ajoutez <code>works-data.js</code> à la page, ' +
        'ou ouvrez le site via un serveur (http://) plutôt qu\'en double-clic (file://).</p>';
      if (fullGrid) fullGrid.innerHTML = msg;
      if (featuredGrid) featuredGrid.innerHTML = msg;
    });
}());
