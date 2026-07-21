# Checklist de déploiement — correction images BoraArt

## A. Avant upload

- [ ] Renommer tout fichier image avec **espaces** ou majuscules inutiles en kebab-case.
- [ ] Exemple : `Market of Golden Traditions.png` → `marche-traditions-dorees.png`
- [ ] Ne **pas** mettre les masters 300 DPI (20+ Mo) dans `/images/` de la galerie.
- [ ] Les masters HD restent sur **Payhip** (fichier livré après achat).

## B. Fichiers à publier (racine du site)

Remplacer / ajouter :

```text
/
├── works-data.js      ← OBLIGATOIRE (catalogue embarqué)
├── works.json         ← OBLIGATOIRE (même contenu)
├── gallery.js         ← OBLIGATOIRE (chemins /images/ corrigés)
├── galerie.html
├── index.html
├── apropos.html
├── script.js          (optionnel si inchangé chez vous)
└── images/
    ├── … (toutes les œuvres du catalogue)
    └── marche-traditions-dorees.png   ← si vous gardez cette œuvre
```

## C. Où uploader (important)

Le site public répond via **Vercel**.  
Si vous uploadez seulement dans le File Manager **Hostinger**, le site live peut ne **pas** changer.

Selon votre configuration réelle :

### Option 1 — Projet Git + Vercel (recommandé)
1. Remplacer les fichiers dans le dépôt local.
2. `git add` / `git commit` / `git push`.
3. Vercel redéploie automatiquement.

### Option 2 — Dashboard Vercel (drag & drop / file browser)
1. Ouvrir le projet Vercel lié à `atelierboraart.com`.
2. Remplacer les fichiers listés ci-dessus.
3. Redeploy.

### Option 3 — Hostinger uniquement (si un jour vous basculez l’hébergement web)
1. File Manager → `public_html` (ou dossier racine du domaine).
2. Coller les fichiers à la racine + dossier `images/`.
3. Vider le cache Hostinger / Cloudflare si actif.

## D. Après publication

- [ ] Hard refresh : `Ctrl+F5` (Windows) / `Cmd+Shift+R` (Mac)
- [ ] Ouvrir https://www.atelierboraart.com/galerie
- [ ] Vérifier qu’aucune carte n’affiche « Image à venir »
- [ ] F12 → Network → Img → aucun 404
- [ ] Tester un achat Payhip sur 1 œuvre (fichier HD bien attaché)

## E. Si une image affiche encore le placeholder

1. Noter le `src` exact dans l’inspecteur (clic droit → Inspecter).
2. Vérifier que le fichier existe **au même nom** dans `/images/`.
3. Vérifier extension : `.jpg` ≠ `.jpeg` ≠ `.png`.
4. Vérifier casse : `Reine.jpg` ≠ `reine.jpg` (Linux/Vercel = sensible à la casse).
5. Confirmer que `works-data.js` déployé contient bien ce nom dans le champ `"image"`.
