# Audit technique — Atelier BoraArt (`atelierboraart.com`)

Date : 2026-07-10  
Site inspecté : https://www.atelierboraart.com/  
Stack observée : site statique (HTML/CSS/JS) servi via **Vercel** (pas Hostinger pour le front public), ventes via **Payhip**.

---

## 1. Architecture actuelle (résumé)

| Fichier | Rôle |
|---|---|
| `works-data.js` | Définit `window.BORAART_WORKS` (données embarquées) |
| `works.json` | Même catalogue (fallback `fetch` si `works-data.js` absent) |
| `gallery.js` | Génère les cartes HTML (`.grid-galerie` + featured) |
| `script.js` | Langue, filtres, lightbox, schema.org, **fallback « Image à venir »** |
| `/images/*` | Visuels des œuvres |

Flux d’affichage :

```
works-data.js  →  window.BORAART_WORKS
       ↓
  gallery.js   →  <img src="…"> dans chaque carte
       ↓
  script.js    →  si l’image échoue (404) → SVG « Image à venir »
```

C’est pour cela que **les titres/descriptions s’affichent** (données JS OK) alors que **les visuels basculent sur le placeholder** (le `src` de l’image échoue).

---

## 2. Diagnostic — pourquoi « Image à venir »

### Cause A (confirmée) — fichier manquant + espaces dans le nom

Dans le catalogue live (`works-data.js` / `works.json`), l’œuvre n°17 :

```text
id:    market-of-golden-traditions
image: "Market of Golden Traditions.png"
```

Test HTTP live :

```text
GET /images/Market%20of%20Golden%20Traditions.png  →  404
```

Le navigateur reçoit une erreur, `script.js` intercepte `error` sur `<img>` et remplace par le SVG **« Image à venir »**.

Problèmes combinés :
1. Le fichier **n’est pas déployé** dans `/images/`.
2. Le nom contient des **espaces et des majuscules** (fragile en FTP/Vercel/CLI, mauvais pour le SEO et les URLs).

### Cause B (risque structurel) — chemins relatifs `images/…`

`gallery.js` générait :

```html
<img src="images/mon-fichier.jpg" …>
```

Cela fonctionne sur :
- `/`
- `/galerie.html`
- `/galerie` (sans slash final — cas Vercel actuel)

Mais **casse** dès que l’URL se termine par un slash, ex. `/galerie/` :

```text
images/foo.jpg  →  /galerie/images/foo.jpg  →  404
```

Même problème pour les scripts relatifs si un hébergeur sert `galerie/` en dossier.

**Correction appliquée** : chemins **absolus depuis la racine** :

```text
/images/foo.jpg
/works-data.js
/gallery.js
/script.js
/styles.css
```

### Cause C (partielle) — versions web vs masters 300 DPI

Exemple `reine-or-saphir.jpg` :
- version live : ~839 Ko
- version fournie (web) : ~1,2 Mo
- master `reine-or-saphir300DPI.jpg` : ~22 Mo (5932×6000 @ 300 DPI)

Les masters 300 DPI sont destinés à **Payhip (fichier livré à l’acheteur)**, pas à l’affichage galerie (trop lourds).  
Les miniatures galerie doivent rester des **JPG/PNG web optimisés** (idéalement ≤ 1–1,5 Mo, côté ~1500–2000 px).

### Ce qui fonctionne déjà

| Élément | Statut live |
|---|---|
| 16/17 images catalogue (hors Market…) | HTTP 200 |
| `works-data.js` + `gallery.js` + `script.js` | HTTP 200 |
| Titres / descriptions FR+EN | OK |
| Liens Payhip | OK |
| Domaine `atelierboraart.com` | OK (Vercel) |

---

## 3. Corrections livrées dans ce dossier

| Fichier | Correction |
|---|---|
| `gallery.js` | `imageSrc()` → toujours `/images/<fichier>` + `encodeURIComponent` |
| `works-data.js` | Catalogue synchronisé ; `Market of Golden Traditions.png` → `marche-traditions-dorees.png` |
| `works.json` | Même contenu que `works-data.js` |
| `galerie.html` | Assets en chemins racine (`/styles.css`, `/works-data.js`, …) |
| `index.html` | Idem + images hero `/images/…` |
| `apropos.html` | Idem |
| `script.js` | Copie de référence (fallback « Image à venir » inchangé, utile) |
| `docs/NOUVELLES-OEUVRES-MODELE.js` | Blocs prêts à coller pour de nouvelles œuvres |
| `docs/CHECKLIST-DEPLOIEMENT.md` | Étapes Hostinger / Vercel / File Manager |

---

## 4. Règles de nommage (à appliquer désormais)

**Bon :**
```text
reine-or-saphir.jpg
marche-traditions-dorees.png
crepuscule-village.jpg
```

**À éviter :**
```text
Market of Golden Traditions.png   ← espaces + majuscules
Reine Or & Saphir (300DPI).JPG    ← espaces, &, majuscules, parenthèses
```

Convention :
- minuscules
- tirets `-` (kebab-case)
- extension en minuscules (`.jpg` / `.png`)
- **pas d’espaces, pas d’accents dans le nom de fichier**
- le champ `image` dans `works-data.js` = **uniquement le nom du fichier** (pas `images/…`)

---

## 5. Mapping des fichiers que vous avez fournis

### Œuvres déjà dans le catalogue (à uploader/rafraîchir dans `/images/`)

| Fichier local | Champ `image` | Statut serveur |
|---|---|---|
| `Atelierboraart.png` | `Atelierboraart.png` | 200 |
| `reine-des-couleurs.jpg` | `reine-des-couleurs.jpg` | 200 |
| `explosion-chromatique.jpg` | `explosion-chromatique.jpg` | 200 |
| `pirogue-crepuscule.png` | `pirogue-crepuscule.png` | 200 |
| `porteuse-clocher.png` | `porteuse-clocher.png` | 200 |
| `cour-aux-poules.png` | `cour-aux-poules.png` | 200 |
| `couronne-azur.jpg` | `couronne-azur.jpg` | 200 |
| `reine-or-saphir.jpg` | `reine-or-saphir.jpg` | 200 (version plus légère en live) |
| `tempete-couleurs.jpg` | `tempete-couleurs.jpg` | 200 |
| `crepuscule-village.jpg` | `crepuscule-village.jpg` | 200 |
| `retour-des-champs.jpg` | `retour-des-champs.jpg` | 200 |
| `lumiere-soir-village.jpg` | `lumiere-soir-village.jpg` | 200 |
| `fragments-memoire.jpg` | `fragments-memoire.jpg` | 200 |
| `eclosion.jpg` | `eclosion.jpg` | 200 |
| `cercles-ancestraux.jpg` | `cercles-ancestraux.jpg` | 200 |
| `tambours-soleil.jpg` | `tambours-soleil.jpg` | 200 |

### Assets site (hors catalogue œuvres)

| Fichier | Usage |
|---|---|
| `portrait-unga.jpg` / `unga-amissi.png` | Page À propos / home |
| `logo.png`, `favicon.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | Branding / PWA |
| `reine-or-saphir300DPI.jpg` | **Fichier de vente Payhip** (pas pour la galerie web) |

### Œuvre absente côté serveur

| Ancien nom (cassé) | Nouveau nom recommandé |
|---|---|
| `Market of Golden Traditions.png` | `marche-traditions-dorees.png` |

→ Déposez l’image renommée dans `/images/`, ou retirez le bloc de `works-data.js` / `works.json` si l’œuvre n’est plus vendue.

---

## 6. Note Hostinger / Payhip / Vercel

- Le front public répond avec les en-têtes **Vercel** (pas le File Manager Hostinger classique).
- Hostinger semble surtout utilisé pour le **domaine** (`atelierboraart.com`) et éventuellement l’e-mail pro.
- Payhip gère le **paiement + livraison du fichier HD**.
- Conséquence : uploader uniquement dans le File Manager Hostinger **ne mettra pas à jour** le site si le déploiement se fait via Vercel/Git.  
  Il faut publier les fichiers là où le site est réellement hébergé (repo Git lié à Vercel, ou drag-and-drop Vercel, selon votre setup).

---

## 7. Comment ajouter un nouveau groupe d’œuvres

1. Optimiser chaque visuel web (JPG/PNG, sans espaces dans le nom).
2. Déposer les fichiers dans `/images/`.
3. Copier un bloc depuis `docs/NOUVELLES-OEUVRES-MODELE.js`.
4. Remplir `id`, `image`, titres FR/EN, descriptions, `category`, `payhipUrl`, `price`.
5. Coller le bloc dans le tableau `works` de **`works-data.js` ET `works.json`** (les deux doivent rester synchrones).
6. Redéployer / vider le cache navigateur (Ctrl+F5).

---

## 8. Tests de validation après déploiement

1. Ouvrir https://www.atelierboraart.com/galerie  
2. Vérifier qu’**aucune** carte n’affiche « Image à venir ».  
3. Ouvrir la console (F12) → onglet Network → filtrer `Img` → aucun 404.  
4. Tester aussi :
   - https://www.atelierboraart.com/
   - https://www.atelierboraart.com/galerie.html (redirige vers `/galerie`)
5. Cliquer une image → lightbox OK.  
6. Filtrer par catégorie → compteur et cartes OK.  
7. Basculer FR/EN → textes OK.

---

## 9. Prochaines étapes possibles (si vous le souhaitez)

- Intégrer de **vraies nouvelles œuvres** (fournir titres + liens Payhip + fichiers).
- Générer des **miniatures web** automatiques à partir des masters 300 DPI.
- Ajouter un `vercel.json` pour forcer les redirections propres.
- Remplacer les témoignages « illustratifs » par de vrais avis.
- Corriger l’e-mail pro Hostinger (`unga@atelierboraart.com`) si besoin.
