# Rapport PFA Tastify

Ce dossier contient une reconstruction LaTeX du rapport Tastify sous forme de rapport de Projet de Fin d'Année.

## Structure

- `main.tex` : point d'entrée LaTeX.
- `chapters/` : chapitres du rapport.
- `assets/figures/` : schémas et maquettes extraits du document source.
- `references.bib` : bibliographie technique.

## Compilation

Compilation recommandée avec `latexmk` :

```powershell
latexmk -pdf -interaction=nonstopmode main.tex
```

Fallback manuel :

```powershell
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```

Si aucun moteur LaTeX n'est installé, installer TinyTeX ou MiKTeX puis relancer la compilation depuis ce dossier.

## Notes de cohérence

Le contenu a été aligné avec la codebase réelle :

- Python 3.12 côté Docker.
- Refresh token JWT : 1 jour.
- Deux applications React : staff et client.
- Recommandation de plats simple, non présentée comme un modèle IA complet.
- Prévision de stock basée sur une moyenne des ventes récentes.
- Météo simulée si aucune API réelle n'est configurée.
