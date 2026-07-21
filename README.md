# Atelier BoraArt — Package de correction galerie

Corrige l’affichage **« Image à venir »** et renforce les chemins d’images pour `atelierboraart.com`.

## Démarrage rapide

1. Lire **`docs/AUDIT-ET-CORRECTIONS.md`** (diagnostic complet).
2. Suivre **`docs/CHECKLIST-DEPLOIEMENT.md`**.
3. Publier à la **racine du site** :
   - `works-data.js`
   - `works.json`
   - `gallery.js`
   - `galerie.html`, `index.html`, `apropos.html` (recommandé)
4. Dans `/images/` :
   - garder les noms **kebab-case sans espaces**
   - ajouter `marche-traditions-dorees.png` **ou** retirer cette œuvre du catalogue

## Cause principale identifiée

Le catalogue pointait vers :

```text

images/Market of Golden Traditions.png  →  404
```

`script.js` remplace alors le visuel par le SVG **« Image à venir »**.  
Les titres restent visibles car ils viennent de `window.BORAART_WORKS`, pas du fichier image.

## Fichiers clés

| Fichier | Description |
|---|---|
| `gallery.js` | Chemins corrigés : `/images/…` (racine) |
| `works-data.js` | Catalogue `window.BORAART_WORKS` corrigé |
| `works.json` | Même catalogue (fallback) |
| `docs/NOUVELLES-OEUVRES-MODELE.js` | Blocs FR/EN pour nouvelles œuvres |
| `docs/BLOC-MARCHE-TRADITIONS-DOREES.js` | Bloc de l’œuvre renommée |

## Ajouter de nouvelles œuvres

1. Fichier image web → `/images/mon-oeuvre.jpg`
2. Copier un bloc dans `docs/NOUVELLES-OEUVRES-MODELE.js`
3. Coller dans `works` de **`works-data.js` + `works.json`**
4. Redéployer

Fournissez-moi pour chaque nouvelle œuvre : **fichier, titre FR/EN, description FR/EN, catégorie, prix, lien Payhip** — je génère les blocs finaux.
