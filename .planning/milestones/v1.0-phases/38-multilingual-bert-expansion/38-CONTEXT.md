---
phase: 38
slug: multilingual-bert-expansion
status: discussion
---

# Phase 38: Multilingual BERT Expansion

## Goal
Optimize the AI sentiment analysis to handle Moroccan-specific linguistic nuances (Darija mixed with French).

## Context
Our current model (`nlptown/bert-base-multilingual-uncased-sentiment`) is robust for French and Standard Arabic but may struggle with Moroccan Darija (e.g., "Mekla bnina", "Service dial walou").

## Proposed Scope

### 1. Model Selection
- **Primary**: Continue using `nlptown` for French/English.
- **Moroccan Support**: Integrate `CAMeL-Lab/bert-base-arabic-camelbert-da-sentiment` or `moussaKam/MARBERT` specifically for Arabic/Darija snippets.
- **Logic**: Detect language (simple heuristic or library like `langdetect`) and route to the best model.

### 2. Detection & Routing
- Use `langdetect` to distinguish between French and Arabic/Darija.
- If Arabic/Darija is detected, use the MARBERT/CamelBERT model.
- If French is detected, use the current Multilingual BERT.

### 3. Translation Support (Optional)
- For extreme cases, use a translation layer before sentiment analysis? (Maybe too slow for real-time).

## Questions for Discussion
- [ ] Should we install `langdetect` in the backend? (Yes, it's lightweight).
- [ ] Do we want to store the detected language in the `Avis` model? (Yes, useful for analytics).

## Success Criteria
1.  Review in Darija ("Mekla khayba") correctly tagged as Negative.
2.  Review in French ("C'était délicieux") correctly tagged as Positive.
3.  Language detected and stored for each review.
