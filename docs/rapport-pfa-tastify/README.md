# Rapport PFA Tastify

Ce dossier contient la version LaTeX du rapport Tastify sous forme de rapport de Projet de Fin d'Année. La structure suit l'ancien rapport fourni, mais le contenu métier est aligné sur la codebase Tastify.

## Structure

- `main.tex` : point d'entrée LaTeX.
- `chapters/` : préliminaires, chapitres, conclusion et annexes.
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
- Analyse de sentiment réelle : `nlptown/bert-base-multilingual-uncased-sentiment`, `moussaKam/MARBERT-sentiment` pour l'arabe, fallback local `mots-cles-simple`.
- Recommandation de plats simple, non présentée comme un modèle IA complet.
- Pas de résultat Locust présenté : `scripts/locustfile.py` est absent dans l'arborescence analysée.
- Les champs administratifs non vérifiables de la page de garde sont signalés comme à confirmer.
