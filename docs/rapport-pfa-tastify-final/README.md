# Rapport PFA Tastify - Version finale Overleaf

Ce dossier contient la version finale LaTeX du rapport de Projet de Fin d'Année Tastify, prête à être importée dans Overleaf.

## Structure

- `main.tex` : point d'entrée du rapport.
- `chapters/` : pages liminaires, chapitres, conclusion et annexes.
- `figures/` : figures, diagrammes et captures utilisées dans le rapport.
- `bibliography.bib` : références bibliographiques.

## Compilation

Compilation recommandée sur Overleaf ou localement :

```powershell
pdflatex -interaction=nonstopmode main.tex
bibtex main
pdflatex -interaction=nonstopmode main.tex
pdflatex -interaction=nonstopmode main.tex
```

Les informations administratives non confirmées sont marquées dans les sources par des commentaires LaTeX `% À compléter`.
