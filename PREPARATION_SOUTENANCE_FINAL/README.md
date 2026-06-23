# Préparation soutenance finale Tastify

## Fichiers

- `00_Audit_Projet.md` : audit des faits confirmés, risques et formulations à éviter.
- `01_Guide_Preparation_Soutenance.tex` : source LaTeX du guide imprimable.
- `01_Guide_Preparation_Soutenance.pdf` : guide final compilé.
- `02_Questions_Reponses.md` : 50 questions-réponses de jury.
- `03_Checklist_Jour_J.md` : checklist veille, jour J et démo.

## Ordre de lecture conseillé

1. Lire `00_Audit_Projet.md` pour verrouiller ce qui est vrai dans la version 21 slides.
2. Lire les scripts slide par slide dans le PDF.
3. Répéter avec la checklist.
4. Réviser les 10 questions les plus dangereuses.

## Compilation

Depuis ce dossier :

```powershell
pdflatex 01_Guide_Preparation_Soutenance.tex
pdflatex 01_Guide_Preparation_Soutenance.tex
```

Si `pdflatex` n’est pas disponible, utiliser le compilateur LaTeX fourni par Codex.

## Recommandation de démo

Recommandation : utiliser la slide 18 comme point officiel de démonstration. Garder la vidéo intégrée comme plan sûr, et préparer une démo live courte en plan B. La démo live ne doit être lancée que si Docker Desktop, `start-demo-local.bat`, les comptes de test et les onglets sont prêts avant l’entrée en salle.

## Avis sur la présentation mise à jour

La version 21 slides est meilleure que l'ancienne version : elle respire davantage grâce aux slides `Conception` et `Réalisation`, et la slide démo rend le passage vers l'application plus naturel. Le risque principal est le temps : les slides de transition doivent durer 10 à 15 secondes seulement.

## À retenir

- Dire que Tastify est un prototype académique de mini-ERP restaurant.
- Dire que le paiement est simulé.
- Dire que les modèles sont pré-entraînés/fine-tunés via Hugging Face.
- Dire que les résultats IA sont indicatifs sur 15 avis.
- Dire que le temps réel concerne les flux WebSocket/Redis du staff et du KDS.
