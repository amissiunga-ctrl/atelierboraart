/* ============================================================
   ATELIER BORAART — script.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. HEADER : ombre au défilement ──────────────────── */
  const header = document.querySelector('.site-header');

  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // état initial
  }

  /* ── 2. MENU MOBILE (burger) ──────────────────────────── */
  const burger     = document.querySelector('.burger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = burger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      // Bloque le défilement quand le menu est ouvert
      document.body.style.overflow = isOpen ? 'hidden' : '';
      burger.setAttribute('aria-expanded', isOpen);
    });

    // Ferme le menu au clic sur un lien
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── 3. NAV ACTIVE : surligne la page courante ────────── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── 4. ANIMATION D'ENTRÉE DES CARTES (Intersection Observer) ── */
  const cards = document.querySelectorAll('.card');

  if (cards.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    cards.forEach((card, i) => {
      card.style.opacity    = '0';
      card.style.transform  = 'translateY(28px)';
      card.style.transition = `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s`;
      observer.observe(card);
    });
  }

  /* (Le sélecteur de taille a été supprimé : prix unique par œuvre.) */

  /* ── 5. COMPTEUR ANIMÉ (stats) ─────────────────────────── */
  const stats = document.querySelectorAll('.stat__number[data-target]');

  if (stats.length && 'IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        let   count  = 0;
        const step   = Math.ceil(target / 60);

        const tick = () => {
          count = Math.min(count + step, target);
          el.textContent = count + suffix;
          if (count < target) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.5 });

    stats.forEach(stat => countObserver.observe(stat));
  }

});

/* ── 6. FILTRES GALERIE ────────────────────────────────── */
(function () {
  function setup() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (!filterBtns.length) return;

    const countEl   = document.querySelector('.results-count');
    const noResults = document.querySelector('.no-results');

    function updateCount(visible) {
      if (!countEl) return;
      const active = document.querySelector('.lang-btn.active');
      const lang = active ? active.dataset.langBtn : (localStorage.getItem('boraart-lang') || 'fr');
      countEl.textContent = lang === 'en'
        ? visible + ' artwork' + (visible > 1 ? 's' : '')
        : visible + ' œuvre' + (visible > 1 ? 's' : '');
    }

    function applyFilter(cat) {
      const cards = document.querySelectorAll('.card[data-category]');
      let visible = 0;
      cards.forEach(card => {
        const match = cat === 'all' || card.dataset.category === cat;
        card.classList.toggle('hidden', !match);
        if (match) visible++;
      });
      updateCount(visible);
      if (noResults) noResults.classList.toggle('visible', visible === 0);
    }

    filterBtns.forEach(btn => {
      // Évite de doubler les écouteurs lors d'un rebind
      if (btn._boraBound) return;
      btn._boraBound = true;
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        // active aussi le bouton jumeau (FR/EN) de même filtre
        document.querySelectorAll('.filter-btn[data-filter="' + btn.dataset.filter + '"]')
          .forEach(b => b.classList.add('active'));
        applyFilter(btn.dataset.filter);

        const grid = document.querySelector('.grid-galerie');
        if (grid) {
          const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
          const targetY = grid.getBoundingClientRect().top + window.scrollY - headerHeight - 24;
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }
      });
    });

    // Filtre actif courant (par défaut "all")
    const activeBtn = document.querySelector('.filter-btn.active');
    applyFilter(activeBtn ? activeBtn.dataset.filter : 'all');
  }

  setup();
  document.addEventListener('boraart:rebind', setup);
}());

/* ── 7. FORMULAIRE CONTACT (Envoi réel via Formspree) ─────────── */
(function () {
  const form    = document.querySelector('.contact-form');
  const success = document.querySelector('.form-success');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Anti-spam : si le champ honeypot est rempli, c'est un bot → on simule un succès
    const honeypot = form.querySelector('[name="_gotcha"]');
    if (honeypot && honeypot.value) {
      form.style.display = 'none';
      if (success) success.classList.add('visible');
      return;
    }

    const btn = form.querySelector('[type="submit"]');
    const originalBtnText = btn.innerHTML;
    
    btn.textContent = 'Envoi en cours…';
    btn.disabled = true;

    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        form.style.display = 'none';
        if (success) success.classList.add('visible');
      } else {
        throw new Error('Erreur lors de l\'envoi');
      }
    } catch (error) {
      alert('Oups ! Une erreur est survenue lors de l\'envoi. Veuillez réessayer plus tard.');
      btn.innerHTML = originalBtnText;
      btn.disabled = false;
    }
  });
}());

/* ── 8. ACCORDÉON FAQ ──────────────────────────────────── */
(function () {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const btn = item.querySelector('.faq-question');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Ferme tous les autres
      items.forEach(i => i.classList.remove('open'));
      // Ouvre celui cliqué (sauf s'il était déjà ouvert)
      if (!isOpen) item.classList.add('open');
    });
  });

  // Navigation latérale active au scroll
  const groups = document.querySelectorAll('.faq-group');
  const navLinks = document.querySelectorAll('.faq-nav__link');

  if (groups.length && navLinks.length) {
    const onScroll = () => {
      let current = '';
      groups.forEach(g => {
        if (window.scrollY >= g.offsetTop - 120) current = g.id;
      });
      navLinks.forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === '#' + current);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }
}());

/* ── 9. SÉLECTEUR DE LANGUE FR / EN ───────────────────────── */
(function () {
  const STORAGE_KEY = 'boraart-lang';
  const DEFAULT_LANG = 'fr';

  function applyLang(lang) {
    // 1. Met à jour les boutons du sélecteur
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.langBtn === lang);
    });

    // 2. CHANGE LA LANGUE GLOBALE : On bascule uniquement la classe de langue
    // (on ne touche pas aux autres classes comme cur-converted, scrolled, etc.)
    document.body.classList.remove('lang-fr', 'lang-en');
    document.body.classList.add('lang-' + lang);

    // (Plus de sélecteur de taille à régénérer : prix unique par œuvre.)

    // Met à jour l'attribut lang du HTML
    document.documentElement.lang = lang === 'fr' ? 'fr' : 'en';

    // Sauvegarde le choix
    localStorage.setItem(STORAGE_KEY, lang);
  }

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    applyLang(saved);

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => applyLang(btn.dataset.langBtn));
    });
  }

  // Lance dès que le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());

/* ── 10. LIGHTBOX — VISIONNEUSE PLEIN ÉCRAN ──────────────── */
(function () {
  let cards = document.querySelectorAll('.card');
  // On continue même sans cartes : elles peuvent arriver via gallery.js.
  const hasDynamicGrid = document.querySelector('.grid-galerie[data-dynamic], [data-featured-grid]');
  if (!cards.length && !hasDynamicGrid) return;

  // Crée la structure de la lightbox une seule fois
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <button class="lightbox__close" aria-label="Fermer">&times;</button>
    <div class="lightbox__content">
      <button class="lightbox__nav lightbox__nav--prev" aria-label="Précédent">
        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="lightbox__img-wrap"><img class="lightbox__img" src="" alt="" /></div>
      <div class="lightbox__info">
        <span class="lightbox__category"></span>
        <h3 class="lightbox__title"></h3>
        <p class="lightbox__desc"></p>
        <div class="lightbox__hd">
          <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          <span class="lightbox__hd-text"></span>
        </div>
        <div class="lightbox__actions">
          <span class="lightbox__price"></span>
          <a href="#" class="btn btn--primary lightbox__buy">Acheter</a>
        </div>
        <p class="lightbox__pay-note">
          <span data-lang="fr">Prix converti à titre indicatif · paiement final en USD</span>
          <span data-lang="en">Converted price for reference · final payment in USD</span>
        </p>
      </div>
      <button class="lightbox__nav lightbox__nav--next" aria-label="Suivant">
        <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(lightbox);

  const lbImg      = lightbox.querySelector('.lightbox__img');
  const lbCategory = lightbox.querySelector('.lightbox__category');
  const lbTitle     = lightbox.querySelector('.lightbox__title');
  const lbDesc      = lightbox.querySelector('.lightbox__desc');
  const lbPrice     = lightbox.querySelector('.lightbox__price');
  const lbBuy       = lightbox.querySelector('.lightbox__buy');
  const lbHdText    = lightbox.querySelector('.lightbox__hd-text');
  const lbClose     = lightbox.querySelector('.lightbox__close');
  const lbPrev      = lightbox.querySelector('.lightbox__nav--prev');
  const lbNext      = lightbox.querySelector('.lightbox__nav--next');

  // Filtre uniquement les cartes visibles (non masquées par un filtre actif)
  function getVisibleCards() {
    return Array.from(cards).filter(c => !c.classList.contains('hidden'));
  }

  function currentLang() {
    const active = document.querySelector('.lang-btn.active');
    return active ? active.dataset.langBtn : 'fr';
  }

  function openLightboxForCard(card) {
    const lang = currentLang();
    const img = card.querySelector('.card__img');
    if (!img) return; // pas d'image réelle (placeholder) → on n'ouvre rien

    const titleEl = card.querySelector(`.card__title [data-lang="${lang}"]`)
                 || card.querySelector('.card__title span')
                 || card.querySelector('.card__title');
    const title = titleEl ? titleEl.textContent.trim() : '';
    const buyLink = card.querySelector(`.btn--buy[data-lang="${lang}"]`) || card.querySelector('.btn--buy');

    // Catégorie et description selon la langue active
    const catEl  = card.querySelector(`.card__category[data-lang="${lang}"]`) || card.querySelector('.card__category');
    const descEl = card.querySelector(`.card__desc[data-lang="${lang}"]`) || card.querySelector('.card__desc');
    const priceEl = card.querySelector('.card__price-amount');

    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCategory.textContent = catEl ? catEl.textContent : '';
    lbTitle.textContent = title;
    lbDesc.textContent = descEl ? descEl.textContent : '';
    lbBuy.textContent = lang === 'fr' ? 'Acheter sur Payhip' : 'Buy on Payhip';
    lbBuy.href = buyLink ? buyLink.getAttribute('href') : '#';
    if (lbPrice) {
      const usd = priceEl ? priceEl.getAttribute('data-usd') : '';
      if (usd) lbPrice.setAttribute('data-usd', usd);
      lbPrice.textContent = priceEl ? priceEl.textContent : '';
    }

    // Bloc "haute résolution" : lit l'info générée sur la carte
    if (lbHdText) {
      const hdEl = card.querySelector(`.card__hd-info [data-lang="${lang}"]`)
                || card.querySelector('.card__hd-info span');
      lbHdText.textContent = hdEl
        ? hdEl.textContent.trim()
        : (lang === 'fr' ? 'Fichier haute résolution · 300 dpi' : 'High-resolution file · 300 dpi');
    }

    lightbox.dataset.currentCard = Array.from(cards).indexOf(card);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function navigate(direction) {
    const visible = getVisibleCards();
    const currentIdx = parseInt(lightbox.dataset.currentCard, 10);
    const currentCard = cards[currentIdx];
    let pos = visible.indexOf(currentCard);
    if (pos === -1) pos = 0;
    pos = (pos + direction + visible.length) % visible.length;
    openLightboxForCard(visible[pos]);
  }

  // Clique sur une image de carte → ouvre la lightbox
  function bindCards() {
    cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      const imgWrap = card.querySelector('.card__img-wrap');
      if (!imgWrap || imgWrap._lbBound) return;
      imgWrap._lbBound = true;
      imgWrap.addEventListener('click', () => openLightboxForCard(card));
    });
  }
  bindCards();
  document.addEventListener('boraart:rebind', bindCards);

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => navigate(-1));
  lbNext.addEventListener('click', () => navigate(1));

  // Si la langue change pendant que la lightbox est ouverte, on rafraîchit son contenu
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!lightbox.classList.contains('open')) return;
      const idx = parseInt(lightbox.dataset.currentCard, 10);
      const card = cards[idx];
      if (card) setTimeout(() => openLightboxForCard(card), 60);
    });
  });

  // Ferme en cliquant en dehors de l'image/infos
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Ferme avec la touche Echap, navigue avec les flèches clavier
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });
}());


/* ============================================================
   AMÉLIORATIONS COMMERCIALES
   ============================================================ */

/* ── 12. BOUTON WHATSAPP FLOTTANT (toutes les pages) ──────── */
(function () {
  // Numéro au format international sans le "+" ni espaces
  const WA_NUMBER = '27730962898';
  const lang = (localStorage.getItem('boraart-lang') || 'fr');
  const msg = lang === 'en'
    ? "Hello! I'm interested in your artworks on Atelier BoraArt."
    : "Bonjour ! Je suis intéressé(e) par vos œuvres sur l'Atelier BoraArt.";
  const a = document.createElement('a');
  a.className = 'wa-float';
  a.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', 'WhatsApp');
  a.innerHTML = '<svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.515 5.26l-.999 3.648 3.973-1.042zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>';
  document.body.appendChild(a);
})();

/* ── 13. BANDEAU COOKIES (RGPD / Payhip) ──────────────────── */
(function () {
  const KEY = 'boraart-cookie-consent';
  if (localStorage.getItem(KEY)) return;

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookies');
  banner.innerHTML = `
    <div class="cookie-banner__text">
      <span data-lang="fr">Ce site n'utilise aucun cookie de traçage. Notre partenaire de paiement Payhip peut déposer ses propres cookies lors de l'achat. <a href="mentions-legales.html">En savoir plus</a>.</span>
      <span data-lang="en">This site uses no tracking cookies. Our payment partner Payhip may set its own cookies at checkout. <a href="mentions-legales.html">Learn more</a>.</span>
    </div>
    <div class="cookie-banner__actions">
      <button class="cookie-accept" data-lang="fr">J'ai compris</button>
      <button class="cookie-accept" data-lang="en">Got it</button>
    </div>`;
  document.body.appendChild(banner);

  requestAnimationFrame(() => setTimeout(() => banner.classList.add('show'), 600));

  banner.querySelectorAll('.cookie-accept').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.setItem(KEY, '1');
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 400);
    });
  });
}());

/* ── 14. TRADUCTIONS DYNAMIQUES MANQUANTES (compteur, lightbox) ── */
(function () {
  function currentLang() {
    const active = document.querySelector('.lang-btn.active');
    return active ? active.dataset.langBtn : (localStorage.getItem('boraart-lang') || 'fr');
  }

  // Réécrit le compteur de résultats dans la bonne langue
  function localizeCount() {
    const countEl = document.querySelector('.results-count');
    if (!countEl) return;
    const lang = currentLang();
    const num = (countEl.textContent.match(/\d+/) || ['0'])[0];
    const n = parseInt(num, 10);
    if (lang === 'en') {
      countEl.textContent = n + ' artwork' + (n > 1 ? 's' : '');
    } else {
      countEl.textContent = n + ' œuvre' + (n > 1 ? 's' : '');
    }
  }

  // Met à jour le compteur à chaque clic sur un bouton de langue
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(() => { localizeCount(); }, 50);
    });
  });

  // Au chargement + à chaque clic sur un filtre (qui régénère le compteur)
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(localizeCount, 100);
    document.querySelectorAll('.filter-btn').forEach(b =>
      b.addEventListener('click', () => setTimeout(localizeCount, 30)));
  });
}());

/* ── 15. FALLBACK IMAGES (évite les images cassées) ───────── */
(function () {
  const PLACEHOLDER =
    'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">' +
      '<rect width="600" height="800" fill="#efe7da"/>' +
      '<g fill="#b9a98c" font-family="Georgia,serif" text-anchor="middle">' +
      '<text x="300" y="380" font-size="46" font-style="italic">Atelier BoraArt</text>' +
      '<text x="300" y="430" font-size="22">Image à venir</text>' +
      '</g></svg>'
    );

  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function handle() {
      // Évite une boucle si le placeholder lui-même échoue
      this.removeEventListener('error', handle);
      this.src = PLACEHOLDER;
      this.classList.add('img-fallback');
    });
  });
}());

/* ── 16. SCHEMA.ORG — Données structurées Produit (SEO/Google Shopping) ── */
(function () {
  function build() {
  const cards = document.querySelectorAll('.card[data-category]');
  if (!cards.length) return;

  const SITE = 'https://atelierboraart.com';
  const items = [];
  let position = 1;

  cards.forEach(card => {
    const img    = card.querySelector('.card__img');
    const titleFr = card.querySelector('.card__title [data-lang="fr"]');
    const descFr  = card.querySelector('.card__desc[data-lang="fr"]');
    const priceEl = card.querySelector('.card__price-amount');
    const buy    = card.querySelector('.btn--buy');
    if (!img || !titleFr) return;

    const name = titleFr.textContent.trim();
    // Prix unique (ex : "75 USD")
    const price = priceEl ? (priceEl.textContent.match(/\d+/) || [])[0] : null;

    // URL absolue de l'image
    let imgUrl = img.getAttribute('src') || '';
    if (imgUrl && !/^https?:/.test(imgUrl)) imgUrl = SITE + '/' + imgUrl.replace(/^\//, '');

    const product = {
      "@type": "Product",
      "name": name,
      "image": imgUrl,
      "description": descFr ? descFr.textContent.trim() : name,
      "brand": { "@type": "Brand", "name": "Atelier BoraArt" },
      "category": (card.dataset.category || "").trim()
    };

    if (price && buy) {
      product.offers = {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": price,
        "availability": "https://schema.org/InStock",
        "url": buy.getAttribute('href')
      };
    }

    items.push({ "@type": "ListItem", "position": position++, "item": product });
  });

  if (!items.length) return;

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": items
  };

  // Retire un éventuel schema produit précédent (rebind) avant d'en ajouter un neuf
  const prev = document.querySelector('script[data-bora-products]');
  if (prev) prev.remove();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-bora-products', '');
  script.textContent = JSON.stringify(jsonld);
  document.head.appendChild(script);
  }

  build();
  document.addEventListener('boraart:rebind', build);
}());

/* ── 17. RÉ-INITIALISATION après rendu dynamique (gallery.js) ──
   Quand gallery.js a injecté les cartes depuis works.json, on
   (ré)applique : animations, prix, langue, filtres, lightbox,
   compteur, filigrane(déjà CSS), schema.org, fallback images. */
(function () {
  document.addEventListener('works:rendered', () => {

    /* a) Animation d'entrée des cartes */
    const cards = document.querySelectorAll('.card');
    if (cards.length && 'IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.style.opacity = '1';
            e.target.style.transform = 'translateY(0)';
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.12 });
      cards.forEach((c, i) => {
        c.style.opacity = '0';
        c.style.transform = 'translateY(28px)';
        c.style.transition = `opacity .5s ease ${i * 0.07}s, transform .5s ease ${i * 0.07}s`;
        obs.observe(c);
      });
    }

    /* b) (Plus de sélecteur de taille : le prix unique est déjà affiché par gallery.js.) */

    /* c) Applique la langue courante aux nouvelles cartes */
    const activeLangBtn = document.querySelector('.lang-btn.active');
    if (activeLangBtn) activeLangBtn.click();
    // (le clic ré-applique body.lang-* et régénère les <option> traduits)

    /* d) Fallback images sur les nouvelles <img> */
    const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">' +
      '<rect width="600" height="800" fill="#efe7da"/>' +
      '<g fill="#b9a98c" font-family="Georgia,serif" text-anchor="middle">' +
      '<text x="300" y="380" font-size="46" font-style="italic">Atelier BoraArt</text>' +
      '<text x="300" y="430" font-size="22">Image à venir</text></g></svg>');
    document.querySelectorAll('.card img').forEach(img => {
      img.addEventListener('error', function h() {
        this.removeEventListener('error', h);
        this.src = PLACEHOLDER; this.classList.add('img-fallback');
      });
    });

    /* e) Re-déclenche le système de filtres + lightbox + schema
          en signalant aux modules concernés de se reconstruire. */
    document.dispatchEvent(new CustomEvent('boraart:rebind'));
  });
}());

/* ── 18. BOUTON "RETOUR EN HAUT" ──────────────────────────── */
(function () {
  const btn = document.createElement('button');
  btn.className = 'to-top';
  btn.setAttribute('aria-label', 'Retour en haut');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><polyline points="6 15 12 9 18 15"/></svg>';
  document.body.appendChild(btn);

  const onScroll = () => {
    btn.classList.toggle('show', window.scrollY > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}());

/* ── 19. SÉLECTEUR DE DEVISE (affichage converti) ────────────
   Affiche les prix dans la devise choisie (taux temps réel via API,
   repli sur taux fixes). Le PAIEMENT reste en USD sur Payhip. */
(function () {
  const STORE_KEY = 'boraart-currency';

  // Devises proposées (focus Afrique + international). symbol + position.
  const CURRENCIES = {
    USD: { label: 'USD $',  symbol: '$',   name: { fr: 'Dollar US', en: 'US Dollar' } },
    EUR: { label: 'EUR €',  symbol: '€',   name: { fr: 'Euro', en: 'Euro' } },
    ZAR: { label: 'ZAR R',  symbol: 'R',   name: { fr: 'Rand sud-africain', en: 'South African Rand' } },
    XOF: { label: 'XOF',    symbol: 'CFA', name: { fr: 'Franc CFA (Ouest)', en: 'West African CFA' } },
    XAF: { label: 'XAF',    symbol: 'FCFA',name: { fr: 'Franc CFA (Centre)', en: 'Central African CFA' } },
    NGN: { label: 'NGN ₦',  symbol: '₦',   name: { fr: 'Naira', en: 'Nigerian Naira' } },
    GBP: { label: 'GBP £',  symbol: '£',   name: { fr: 'Livre sterling', en: 'British Pound' } },
    CDF: { label: 'CDF',    symbol: 'FC',  name: { fr: 'Franc congolais', en: 'Congolese Franc' } }
  };

  // Taux de repli (1 USD = X) — utilisés si l'API échoue. À ajuster si besoin.
  let rates = {
    USD: 1, EUR: 0.92, ZAR: 18.2, XOF: 605, XAF: 605, NGN: 1600, GBP: 0.79, CDF: 2800
  };

  let current = localStorage.getItem(STORE_KEY) || 'USD';

  function format(amountUsd, code) {
    const r = rates[code] || 1;
    const val = amountUsd * r;
    const c = CURRENCIES[code];
    // Arrondi : pas de décimales pour grosses devises (XOF, NGN, CDF, ZAR), 2 sinon
    const big = ['XOF','XAF','NGN','CDF','ZAR'].includes(code);
    const rounded = big ? Math.round(val) : Math.round(val * 100) / 100;
    const num = rounded.toLocaleString(undefined, big ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    // Symbole devant pour $/£/€, derrière pour CFA
    if (['XOF','XAF','CDF'].includes(code)) return num + ' ' + c.symbol;
    return c.symbol + num;
  }

  // Met à jour TOUS les prix affichés (cartes + lightbox)
  function applyCurrency() {
    document.querySelectorAll('.card__price-amount').forEach(el => {
      const usd = parseFloat(el.getAttribute('data-usd') || (el.textContent.match(/[\d.]+/) || [])[0]);
      if (isNaN(usd)) return;
      el.setAttribute('data-usd', usd);
      if (current === 'USD') {
        el.textContent = usd + ' USD';
      } else {
        el.textContent = format(usd, current) + ' ≈';
      }
    });
    // Lightbox
    const lbP = document.querySelector('.lightbox__price');
    if (lbP && lbP.getAttribute('data-usd')) {
      const usd = parseFloat(lbP.getAttribute('data-usd'));
      lbP.textContent = current === 'USD' ? usd + ' USD' : format(usd, current) + ' ≈';
    }
    // Bouton du sélecteur
    document.querySelectorAll('.cur-btn').forEach(b => {
      b.textContent = CURRENCIES[current].label;
    });
    document.body.classList.toggle('cur-converted', current !== 'USD');
  }

  // Construit le sélecteur de devise (menu déroulant), inséré AVANT un élément repère
  function buildSelector(refEl) {
    const wrap = document.createElement('div');
    wrap.className = 'cur-switcher';
    wrap.innerHTML =
      '<button class="cur-btn" aria-haspopup="true" aria-expanded="false">' + CURRENCIES[current].label + '</button>' +
      '<div class="cur-menu" role="menu">' +
        Object.keys(CURRENCIES).map(code =>
          `<button class="cur-option" data-cur="${code}" role="menuitem">${CURRENCIES[code].label} — <span class="cur-name">${CURRENCIES[code].name.fr}</span></button>`
        ).join('') +
      '</div>';
    refEl.parentNode.insertBefore(wrap, refEl);

    const btn = wrap.querySelector('.cur-btn');
    const menu = wrap.querySelector('.cur-menu');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
    wrap.querySelectorAll('.cur-option').forEach(opt => {
      opt.addEventListener('click', () => {
        current = opt.dataset.cur;
        localStorage.setItem(STORE_KEY, current);
        wrap.classList.remove('open');
        applyCurrency();
      });
    });
    document.addEventListener('click', () => wrap.classList.remove('open'));
  }

  // Récupère les taux en temps réel (API gratuite, sans clé)
  function fetchRates() {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data && data.rates) {
          Object.keys(rates).forEach(code => {
            if (data.rates[code]) rates[code] = data.rates[code];
          });
          applyCurrency();
        }
      })
      .catch(() => { /* on garde les taux de repli */ });
  }

  function init() {
    // Insère le sélecteur juste avant chaque .lang-switcher (présent sur toutes les pages)
    document.querySelectorAll('.lang-switcher').forEach(buildSelector);
    fetchRates();
    applyCurrency();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  // Réapplique après rendu dynamique des cartes (gallery.js) et changement de langue
  document.addEventListener('works:rendered', () => setTimeout(applyCurrency, 60));
  document.addEventListener('boraart:rebind', () => setTimeout(applyCurrency, 60));
}());
