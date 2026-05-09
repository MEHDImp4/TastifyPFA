---
phase: 38
slug: multilingual-bert-expansion
status: research
---

# Phase 38 Research: Multilingual Sentiment

## Model 1: nlptown/bert-base-multilingual-uncased-sentiment
- **Languages**: 6 (English, Dutch, German, French, Italian and Spanish).
- **Pros**: Already integrated, works great for French.
- **Cons**: No native support for Darija.

## Model 2: moussaKam/MARBERT-sentiment
- **Type**: Specifically trained for Arabic dialects (including Maghrebi/Darija).
- **Endpoint**: [https://huggingface.co/moussaKam/MARBERT-sentiment](https://huggingface.co/moussaKam/MARBERT-sentiment)
- **Labels**: Positive, Negative, Neutral.

## Language Detection: langdetect
- **Library**: `pip install langdetect`
- **Reliability**: Good for distinguishing major families (FR vs AR).

## Heuristic Routing
1.  Check for Arabic script presence using regex.
2.  If Arabic script found -> Use MARBERT.
3.  If no Arabic script -> Use `langdetect`.
4.  If `langdetect` == 'fr' -> Use Multilingual BERT.
5.  Else -> Use Multilingual BERT (default).
