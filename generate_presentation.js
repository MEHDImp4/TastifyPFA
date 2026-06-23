import PptxGenJS from 'pptxgenjs';

const FONT = 'Calibri';
const BG = 'FFFFFF';
const TEXT = '1A1A1A';
const MUTED = '888888';
const CARD_BG = 'F5F5F5';
const ACCENT = '2563EB';
const GREEN = '16A34A';
const ORANGE = 'D97706';
const RED = 'DC2626';
const FOOTER_BG = 'EEEEEE';

const pptx = new PptxGenJS();
pptx.defineLayout({ name: 'CUSTOM_16_9', width: 13.33, height: 7.5 });
pptx.layout = 'CUSTOM_16_9';

function addFooter(slide, num) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.1, w: 13.33, h: 0.4,
    fill: { color: FOOTER_BG },
  });
  slide.addText('Tastify — Analyse de sentiments avec ML & DL', {
    x: 0.5, y: 7.12, w: 8, h: 0.35,
    fontSize: 8, color: MUTED, fontFace: FONT,
  });
  slide.addText(`${num} / 14`, {
    x: 11.5, y: 7.12, w: 1.5, h: 0.35,
    fontSize: 8, color: MUTED, fontFace: FONT, align: 'right',
  });
}

function addTitleBlock(slide, title, sub, num) {
  slide.background = { fill: BG };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.05,
    fill: { color: ACCENT },
  });
  slide.addText(title, {
    x: 0.6, y: 0.3, w: 12, h: 0.6,
    fontSize: 28, fontFace: FONT, color: TEXT, bold: true,
  });
  if (sub) {
    slide.addText(sub, {
      x: 0.6, y: 0.9, w: 12, h: 0.4,
      fontSize: 16, fontFace: FONT, color: MUTED,
    });
  }
  addFooter(slide, num);
}

function addCard(slide, x, y, w, h, title, body, accent) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: CARD_BG },
    rectRadius: 0.12,
    line: { color: 'E0E0E0', width: 0.5 },
  });
  slide.addText(title, {
    x: x + 0.2, y: y + 0.15, w: w - 0.4, h: 0.35,
    fontSize: 13, fontFace: FONT, color: accent || TEXT, bold: true,
  });
  slide.addText(body, {
    x: x + 0.2, y: y + 0.55, w: w - 0.4, h: h - 0.7,
    fontSize: 11, fontFace: FONT, color: TEXT, lineSpacing: 14,
  });
}

// ─── Slide 1 : Titre ─────────────────────────────────────────────
(() => {
  const s = pptx.addSlide();
  s.background = { fill: BG };
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.1, w: 13.33, h: 0.4,
    fill: { color: FOOTER_BG },
  });
  s.addText('1 / 14', {
    x: 11.5, y: 7.12, w: 1.5, h: 0.35,
    fontSize: 8, color: MUTED, fontFace: FONT, align: 'right',
  });

  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.08,
    fill: { color: ACCENT },
  });
  s.addText('Présentation technique — Tastify', {
    x: 0.6, y: 1.8, w: 12, h: 1,
    fontSize: 38, fontFace: FONT, color: TEXT, bold: true,
  });
  s.addText('Analyse de sentiments avec Machine Learning et Deep Learning', {
    x: 0.6, y: 2.9, w: 12, h: 0.6,
    fontSize: 22, fontFace: FONT, color: MUTED,
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 0.6, y: 3.7, w: 3, h: 0.03,
    fill: { color: ACCENT },
  });
  const details = [
    'Auteurs : Mehdi & Ibtihal',
    'Date : Juin 2026',
    'Stack : Django DRF · React · MySQL · Redis · Celery · Docker',
    'Modèles : BERT Multilingue · MARBERT · Fallback lexical',
  ];
  s.addText(details.join('\n'), {
    x: 0.6, y: 4.0, w: 10, h: 2,
    fontSize: 14, fontFace: FONT, color: MUTED, lineSpacing: 20,
  });
})();

// ─── Slide 2 : Plan ──────────────────────────────────────────────
(() => {
  const s = pptx.addSlide();
  addTitleBlock(s, 'Sommaire', 'Les grandes sections de la présentation', 2);

  const items = [
    ['01', 'Introduction', 'Contexte et objectifs'],
    ['02', 'Problématique', 'Défis et critères de succès'],
    ['03', 'Étude de l\'existant', 'Solutions existantes et limites'],
    ['04', 'Solution proposée', 'Approche Tastify'],
    ['05', 'Conception & architecture', 'Organisation du codebase'],
    ['06', 'ML vs Deep Learning', 'Approches pour le NLP'],
    ['07', 'Pipeline de réalisation', 'Étapes et outils'],
    ['08', 'Outils utilisés', 'Stack technique complète'],
    ['09', 'Modèles & résultats', 'BERT, MARBERT, Fallback'],
    ['10', 'Démonstration', 'Parcours utilisateur'],
    ['11', 'Défis rencontrés', 'Obstacles et solutions'],
    ['12', 'Conclusion', 'Bilan et perspectives'],
  ];
  items.forEach((item, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 0.6 + col * 3.1;
    const y = 1.5 + row * 1.8;
    addCard(s, x, y, 2.8, 1.5, `${item[0]} — ${item[1]}`, item[2], ACCENT);
  });
  addFooter(s, 2);
})();

// ─── Slide 3 : Introduction ──────────────────────────────────────
(() => {
  const s = pptx.addSlide();
  addTitleBlock(s, 'Introduction', 'Contexte métier et objectif général', 3);
  addCard(s, 0.6, 1.5, 5.8, 2.4,
    'Contexte métier',
    'Un restaurant fonctionne avec des enchaînements rapides : commandes, cuisine, stocks, paiements, avis. Les informations sont souvent dispersées entre plusieurs outils, ce qui crée des erreurs et des pertes de temps.\n\nTastify centralise la gestion d\'un restaurant avec un backend Django, deux interfaces React (staff et client), du temps réel via WebSocket, et une analyse automatique des avis clients.',
    ACCENT);
  addCard(s, 6.9, 1.5, 5.8, 2.4,
    'Valeur apportée',
    'L\'analyse de sentiment transforme les commentaires clients en indicateurs exploitables : positif, neutre ou négatif, avec un score de confiance.\n\nObjectif : aider le gérant à repérer rapidement les avis défavorables et alimenter les statistiques de satisfaction du tableau de bord.',
    ACCENT);

  const arrowData = [
    ['Texte utilisateur', ACCENT],
    ['Modèle IA', GREEN],
    ['Sentiment détecté', ORANGE],
  ];
  const arrowW = 3.2;
  const startX = 0.6;
  const gap = (12.13 - arrowW * 3) / 2;
  arrowData.forEach((item, i) => {
    const ax = startX + i * (arrowW + gap);
    s.addShape(pptx.ShapeType.roundRect, {
      x: ax, y: 5.2, w: arrowW, h: 0.6,
      fill: { color: CARD_BG },
      rectRadius: 0.08,
      line: { color: item[1], width: 1.5 },
    });
    s.addText(item[0], {
      x: ax, y: 5.2, w: arrowW, h: 0.6,
      fontSize: 13, fontFace: FONT, color: TEXT, align: 'center', valign: 'middle', bold: true,
    });
    if (i < 2) {
      s.addText('→', {
        x: ax + arrowW + 0.05, y: 5.2, w: gap - 0.1, h: 0.6,
        fontSize: 22, fontFace: FONT, color: MUTED, align: 'center', valign: 'middle',
      });
    }
  });
  addFooter(s, 3);
})();

// ─── Slide 4 : Problématique ─────────────────────────────────────
(() => {
  const s = pptx.addSlide();
  addTitleBlock(s, 'Problématique', 'Défis adressés par le projet', 4);

  addCard(s, 0.6, 1.5, 3.8, 2.2,
    'Problème',
    'Les restaurants gèrent leurs opérations avec des outils dispersés : commandes papier, suivi manuel des stocks, avis clients non exploités.\n\nConséquence : erreurs de communication, ruptures de stock non anticipées, retours clients inexploités.',
    RED);
  addCard(s, 4.7, 1.5, 3.8, 2.2,
    'Impact',
    '• Coordination salle-cuisine inefficace\n• Retards et erreurs de plats\n• Avis clients ignorés\n• Décisions basées sur des données partielles\n• Expérience client dégradée',
    ORANGE);
  addCard(s, 8.8, 1.5, 3.8, 2.2,
    'Objectif',
    'Concevoir une application centralisée, maintenable et accessible pour gérer les opérations d\'un restaurant, avec :\n• Coordination temps réel\n• Analyse de sentiment des avis\n• Architecture modulaire et testable',
    GREEN);

  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 4.2, w: 12.1, h: 1.6,
    fill: { color: CARD_BG },
    rectRadius: 0.08,
    line: { color: 'E0E0E0', width: 0.5 },
  });
  const constraints = [
    ['Entrées', 'Commentaires clients, commandes, profils utilisateurs'],
    ['Sorties', 'Sentiment (POSITIF/NEUTRE/NEGATIF), score de confiance, stats dashboard'],
    ['Contraintes', 'Multilingue (FR/EN/AR), fallback hors-ligne, API asynchrone via Celery'],
    ['Critères succès', '346 tests backend, 93% couverture, 202 scénarios E2E Playwright'],
  ];
  constraints.forEach((c, i) => {
    s.addText(`▸ ${c[0]} :  ${c[1]}`, {
      x: 1, y: 4.35 + i * 0.35, w: 11, h: 0.32,
      fontSize: 11, fontFace: FONT, color: TEXT,
    });
  });
  addFooter(s, 4);
})();

// ─── Slide 5 : Étude de l'existant ───────────────────────────────
(() => {
  const s = pptx.addSlide();
  addTitleBlock(s, 'Étude de l\'existant', 'Solutions comparées et limites identifiées', 5);

  const solutions = [
    ['Lightspeed Restaurant', 'Caisse, menu, reporting', 'Coût récurrent, dépendance commerciale'],
    ['Toast POS', 'Commande et paiement', 'Disponibilité locale variable'],
    ['Revel Systems', 'ERP large, multi-sites', 'Coût et complexité élevés'],
    ['L\'Addition', 'Caisse et service', 'Couverture variable'],
  ];
  solutions.forEach((sol, i) => {
    const y = 1.5 + i * 0.95;
    addCard(s, 0.6, y, 5.8, 0.8, sol[0], sol[1], TEXT);
    s.addText(sol[2], {
      x: 6.8, y: y + 0.1, w: 5.5, h: 0.6,
      fontSize: 11, fontFace: FONT, color: MUTED, valign: 'middle',
    });
  });

  addCard(s, 0.6, 5.6, 12.1, 0.8,
    'Limites des solutions existantes',
    'Solutions coûteuses, fermées ou liées à un matériel précis. Aucune n\'intègre d\'analyse de sentiment des avis clients avec fallback hors-ligne.',
    RED);
  addFooter(s, 5);
})();

// ─── Slide 6 : Solution proposée ─────────────────────────────────
(() => {
  const s = pptx.addSlide();
  addTitleBlock(s, 'Solution proposée', 'Tastify : approche et flux global', 6);

  const flowItems = [
    ['Données\n(avis clients)', ACCENT],
    ['Prétraitement\n(normalisation)', ORANGE],
    ['Modèle IA\n(HuggingFace)', GREEN],
    ['Prédiction\n(POSITIF/NEUTRE/NEGATIF)', ACCENT],
    ['Restitution\n(Dashboard)', GREEN],
  ];
  const fw = 2.1;
  const gap = 0.2;
  const startX = 0.5;
  flowItems.forEach((item, i) => {
    const fx = startX + i * (fw + gap);
    s.addShape(pptx.ShapeType.roundRect, {
      x: fx, y: 2.8, w: fw, h: 0.6,
      fill: { color: CARD_BG },
      rectRadius: 0.08,
      line: { color: item[1], width: 1.2 },
    });
    s.addText(item[0], {
      x: fx, y: 2.8, w: fw, h: 0.6,
      fontSize: 10, fontFace: FONT, color: TEXT, align: 'center', valign: 'middle', bold: true,
    });
    if (i < flowItems.length - 1) {
      s.addText('→', {
        x: fx + fw, y: 2.8, w: gap, h: 0.6,
        fontSize: 16, fontFace: FONT, color: MUTED, align: 'center', valign: 'middle',
      });
    }
  });

  addCard(s, 0.6, 3.8, 5.8, 2.6,
    'Périmètre fonctionnel',
    '• Deux portails : staff (gérant, serveur, cuisinier) et client\n• Menu, commandes, KDS temps réel, stocks, RH\n• Réservations, paiements QR, fidélité\n• Avis clients avec analyse de sentiment\n• Tableau de bord analytics avec indicateurs',
    ACCENT);
  addCard(s, 6.9, 3.8, 5.8, 2.6,
    'Améliorations clés',
    '• Pipeline distant HuggingFace (BERT) comme moteur principal\n• Fallback lexical local multilingue pour continuité hors-ligne\n• Détection de langue (arabe vs autres)\n• Score métier signé (-1 à +1) pour le classement des plats\n• Normalisation des labels modèles vers POSITIF/NEUTRE/NEGATIF',
    ACCENT);

  s.addText('Fichiers clés : app/backend/apps/avis/tasks.py — app/backend/apps/avis/sentiment_service.py', {
    x: 0.6, y: 6.6, w: 12, h: 0.3,
    fontSize: 9, fontFace: FONT, color: MUTED,
  });
  addFooter(s, 6);
})();

// ─── Slide 7 : Conception et architecture ─────────────────────────
(() => {
  const s = pptx.addSlide();
  addTitleBlock(s, 'Conception & architecture', 'Organisation modulaire de la codebase', 7);

  const arch = [
    ['Backend Django', 'app/backend/', ACCENT],
    ['  apps/avis/', 'Sentiment, avis', ''],
    ['  apps/menu/', 'Plats, ML/recommender', ''],
    ['  apps/analytics/', 'Dashboard, stats', ''],
    ['  apps/commandes/', 'Commandes, KDS', ''],
    ['  core/', 'Middleware, WS', ''],
    ['Frontend React x2', 'app/frontend/', ORANGE],
    ['  client-app/', 'Portail client :3003', ''],
    ['  backoffice-app/', 'Staff :3000', ''],
    ['Infrastructure', 'Docker, Redis, Celery', GREEN],
  ];

  arch.forEach((item, i) => {
    const y = 1.5 + i * 0.48;
    const isHeader = !item[2];
    s.addShape(pptx.ShapeType.rect, {
      x: isHeader ? 0.6 : 1.2, y, w: isHeader ? 5.5 : 4.9, h: 0.4,
      fill: { color: isHeader ? CARD_BG : BG },
      line: { color: 'E0E0E0', width: 0.5 },
    });
    s.addText(isHeader ? `${item[0]}  —  ${item[1]}` : `  ${item[0]}`, {
      x: isHeader ? 0.6 : 1.2, y, w: isHeader ? 5.5 : 4.9, h: 0.4,
      fontSize: isHeader ? 12 : 10, fontFace: FONT, color: TEXT, valign: 'middle', bold: isHeader,
    });
  });

  addCard(s, 6.9, 1.5, 5.8, 2.2,
    'Analyse de sentiment (tasks.py)',
    'MODEL_MAP = {\n  "multilingual": "nlptown/bert-base-multilingual-uncased-sentiment",\n  "arabic": "moussaKam/MARBERT-sentiment",\n}\n\n@shared_task(name="apps.avis.tasks.analyze_review_sentiment")\ndef analyze_review_sentiment(avis_id):\n    # Étape 1 : HuggingFace API\n    # Étape 2 : Fallback lexical local',
    ACCENT);

  addCard(s, 6.9, 4.2, 5.8, 2.2,
    'Fallback lexical (sentiment_service.py)',
    'POSITIVE_WORDS = [\'excellent\', \'délicieux\', \'super\', ...]\nNEGATIVE_WORDS = [\'horrible\', \'déçu\', \'mauvais\', ...]\nARABIC_POSITIVE_WORDS = [\'رائع\', \'لذيذ\', ...]\n\ndef predict_sentiment(commentaire):\n    texte = _normalize(commentaire)\n    # Détection de négation\n    # Score basé sur mots-clés multilingues',
    ORANGE);

  s.addText('Rapport : docs/rapport-pfa-tastify-final/chapters/03_conception.tex & 05_realisation.tex', {
    x: 0.6, y: 6.6, w: 12, h: 0.3,
    fontSize: 9, fontFace: FONT, color: MUTED,
  });
  addFooter(s, 7);
})();

// ─── Slide 8 : ML vs Deep Learning ──────────────────────────────
(() => {
  const s = pptx.addSlide();
  addTitleBlock(s, 'Machine Learning vs Deep Learning', 'Approches pour l\'analyse de sentiment', 8);

  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 1.5, w: 5.5, h: 3.2,
    fill: { color: CARD_BG },
    rectRadius: 0.12,
    line: { color: ORANGE, width: 1.5 },
  });
  s.addText('Machine Learning classique', {
    x: 0.8, y: 1.7, w: 5.1, h: 0.4,
    fontSize: 18, fontFace: FONT, color: ORANGE, bold: true,
  });
  s.addText('• Feature engineering manuelle (TF-IDF, Bag-of-Words)\n• Modèles interprétables (SVM, Naive Bayes)\n• Performant sur petits corpus\n• Nécessite une vectorisation explicite', {
    x: 0.8, y: 2.2, w: 5.1, h: 2.0,
    fontSize: 12, fontFace: FONT, color: TEXT, lineSpacing: 16,
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 4.2, w: 5.5, h: 0.5,
    fill: { color: BG },
    rectRadius: 0.06,
    line: { color: ORANGE, width: 0.5 },
  });
  s.addText('Fallback lexical Tastify (règles + dictionnaire)', {
    x: 0.8, y: 4.2, w: 5.1, h: 0.5,
    fontSize: 10, fontFace: FONT, color: ORANGE, align: 'center', valign: 'middle',
  });

  s.addShape(pptx.ShapeType.roundRect, {
    x: 6.6, y: 1.5, w: 5.5, h: 3.2,
    fill: { color: CARD_BG },
    rectRadius: 0.12,
    line: { color: ACCENT, width: 1.5 },
  });
  s.addText('Deep Learning (Transformers)', {
    x: 6.8, y: 1.7, w: 5.1, h: 0.4,
    fontSize: 18, fontFace: FONT, color: ACCENT, bold: true,
  });
  s.addText('• Apprentissage automatique des représentations\n• Compréhension du contexte (attention bidirectionnelle)\n• État de l\'art en NLP\n• Nécessite plus de données et de calcul', {
    x: 6.8, y: 2.2, w: 5.1, h: 2.0,
    fontSize: 12, fontFace: FONT, color: TEXT, lineSpacing: 16,
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 6.6, y: 4.2, w: 5.5, h: 0.5,
    fill: { color: BG },
    rectRadius: 0.06,
    line: { color: ACCENT, width: 0.5 },
  });
  s.addText('BERT Multilingue / MARBERT via HuggingFace API', {
    x: 6.8, y: 4.2, w: 5.1, h: 0.5,
    fontSize: 10, fontFace: FONT, color: ACCENT, align: 'center', valign: 'middle',
  });

  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 5.2, w: 11.5, h: 0.8,
    fill: { color: CARD_BG },
    rectRadius: 0.08,
    line: { color: GREEN, width: 1 },
  });
  s.addText('Choix Tastify : Pipeline hybride — BERT multilingue comme moteur principal via API HuggingFace,\nfallback lexical local (FR/EN/AR) pour garantir la continuité de service hors-ligne.', {
    x: 0.8, y: 5.3, w: 11.1, h: 0.7,
    fontSize: 12, fontFace: FONT, color: TEXT, align: 'center', valign: 'middle',
  });
  addFooter(s, 8);
})();

// ─── Slide 9 : Pipeline de réalisation ──────────────────────────
(() => {
  const s = pptx.addSlide();
  addTitleBlock(s, 'Pipeline de réalisation du modèle', 'Étapes du traitement des avis', 9);

  const steps = [
    ['1. Acquisition', 'Commentaires clients\nvia API REST Django\n(apps/avis/views.py)', ACCENT],
    ['2. Nettoyage', 'Normalisation Unicode\nMinuscules, regex\n(sentiment_service.py)', ORANGE],
    ['3. Détection langue', 'Caractères arabes → ar\nSinon → en\n(tasks.py)', ACCENT],
    ['4. Inférence IA', 'HuggingFace API\nBERT / MARBERT\nou fallback local', GREEN],
    ['5. Conversion', '5 stars → POSITIF\n1 star → NEGATIF\nNormalisation labels', ORANGE],
    ['6. Stockage', 'AnalyseSentiment\nlabel + score\nMySQL + Dashboard', ACCENT],
  ];

  const cols = 3;
  const cardW = 3.6;
  const cardH = 2.0;
  const gapX = 0.3;
  const gapY = 0.3;
  const startX = 0.6;

  steps.forEach((step, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gapX);
    const y = 1.5 + row * (cardH + gapY);

    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: cardW, h: cardH,
      fill: { color: CARD_BG },
      rectRadius: 0.08,
      line: { color: step[2], width: 0.8 },
    });
    s.addText(step[0], {
      x: x + 0.15, y: y + 0.1, w: cardW - 0.3, h: 0.35,
      fontSize: 14, fontFace: FONT, color: step[2], bold: true,
    });
    s.addText(step[1], {
      x: x + 0.15, y: y + 0.5, w: cardW - 0.3, h: cardH - 0.6,
      fontSize: 10, fontFace: FONT, color: TEXT, lineSpacing: 14,
    });
    if (i < steps.length - 1 && col < cols - 1) {
      s.addText('→', {
        x: x + cardW, y: y + cardH / 2 - 0.2, w: gapX, h: 0.4,
        fontSize: 18, fontFace: FONT, color: MUTED, align: 'center', valign: 'middle',
      });
    }
  });
  addFooter(s, 9);
})();

// ─── Slide 10 : Outils utilisés ─────────────────────────────────
(() => {
  const s = pptx.addSlide();
  addTitleBlock(s, 'Outils utilisés', 'Technologies et bibliothèques du projet', 10);

  const tools = [
    ['Langage & Env.', 'Python 3, Node.js 20, Docker', ACCENT],
    ['Backend', 'Django 5, DRF 3.15, Daphne', ACCENT],
    ['Base de données', 'MySQL 8, Redis 7', ACCENT],
    ['Tâches async', 'Celery 5.6, Celery Beat', ACCENT],
    ['Temps réel', 'Django Channels, WebSocket', ACCENT],
    ['Frontend staff', 'React 19, Vite 8, TypeScript 6', ORANGE],
    ['Frontend client', 'React 19, Tailwind CSS 4', ORANGE],
    ['NLP / ML', 'HuggingFace API, BERT, MARBERT', GREEN],
    ['Tests backend', 'pytest 9, pytest-django', GREEN],
    ['Tests frontend', 'Vitest 4, Playwright 1.56', GREEN],
    ['CI / Qualité', 'GitHub Actions, ESLint', GREEN],
    ['Auth', 'JWT, SimpleJWT, PyJWT', ACCENT],
  ];

  const cols = 4;
  const cw = 2.8;
  const ch = 1.2;
  tools.forEach((tool, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 0.5 + col * (cw + 0.3);
    const y = 1.5 + row * (ch + 0.15);

    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: cw, h: ch,
      fill: { color: CARD_BG },
      rectRadius: 0.08,
      line: { color: 'E0E0E0', width: 0.5 },
    });
    s.addText(tool[0], {
      x: x + 0.15, y: y + 0.1, w: cw - 0.3, h: 0.3,
      fontSize: 11, fontFace: FONT, color: tool[2], bold: true,
    });
    s.addText(tool[1], {
      x: x + 0.15, y: y + 0.45, w: cw - 0.3, h: 0.6,
      fontSize: 9, fontFace: FONT, color: TEXT,
    });
  });
  addFooter(s, 10);
})();

// ─── Slide 11 : Modèles et comparaison ──────────────────────────
(() => {
  const s = pptx.addSlide();
  addTitleBlock(s, 'Modèles & comparaison des résultats', 'Deep Learning et métriques d\'évaluation', 11);

  const models = [
    ['nlptown/bert-base-multilingual-uncased-sentiment', 'BERT multilingue fine-tuné sur des avis (6 langues).\nModèle principal pour les textes français/anglais.', ACCENT],
    ['moussaKam/MARBERT-sentiment', 'Modèle arabe basé sur MARBERT.\nUtilisé quand la langue détectée est l\'arabe.', GREEN],
    ['fallback-lexique-multilingue', 'Moteur lexical local (FR/EN/AR) avec dictionnaires\net détection de négation. Secours hors-ligne.', ORANGE],
  ];
  models.forEach((m, i) => {
    const y = 1.5 + i * 0.85;
    addCard(s, 0.6, y, 5.5, 0.75, m[0], m[1], m[2]);
  });

  // Table
  const metricHeaders = ['Modèle / Classe', 'Accuracy', 'Précision', 'Rappel', 'F1-Score'];
  const metricRows = [
    ['Fallback lexical', '0.53', '—', '—', '—'],
    ['  POSITIF', '', '0.75', '0.50', '0.60'],
    ['  NEUTRE', '', '0.33', '0.75', '0.46'],
    ['  NÉGATIF', '', '1.00', '0.40', '0.57'],
    ['Pipeline distant', '0.93', '—', '—', '—'],
    ['  POSITIF', '', '1.00', '1.00', '1.00'],
    ['  NEUTRE', '', '1.00', '0.75', '0.86'],
    ['  NÉGATIF', '', '0.83', '1.00', '0.91'],
  ];

  const rows = [metricHeaders, ...metricRows];
  const tableData = rows.map(row => row.map(cell => ({
    text: cell,
    options: {
      fontSize: 8, fontFace: FONT,
      bold: row === metricHeaders || cell === 'Fallback lexical' || cell === 'Pipeline distant',
      color: row === metricHeaders ? BG : ((cell === 'Fallback lexical' || cell === 'Pipeline distant') ? ACCENT : TEXT),
      align: 'center',
    },
  })));

  s.addTable(tableData, {
    x: 6.9, y: 1.5, w: 5.8,
    colW: [1.5, 0.8, 0.8, 0.8, 0.8],
    border: { type: 'solid', color: 'E0E0E0', pt: 0.5 },
    rowH: [0.35, 0.28, 0.28, 0.28, 0.28, 0.35, 0.28, 0.28, 0.28],
    autoPage: false,
    fill: { color: BG },
    headerFill: { color: ACCENT },
  });

  // Bar chart
  const chartData = [
    { name: 'Accuracy', labels: ['Accuracy'], values: [53] },
    { name: 'F1 Positif', labels: ['F1 Positif'], values: [60] },
    { name: 'F1 Neutre', labels: ['F1 Neutre'], values: [46] },
    { name: 'F1 Négatif', labels: ['F1 Négatif'], values: [57] },
    { name: 'Accuracy (Distant)', labels: ['Accuracy'], values: [93] },
    { name: 'F1 Positif (Distant)', labels: ['F1 Positif'], values: [100] },
    { name: 'F1 Neutre (Distant)', labels: ['F1 Neutre'], values: [86] },
    { name: 'F1 Négatif (Distant)', labels: ['F1 Négatif'], values: [91] },
  ];

  s.addChart(pptx.charts.BAR, chartData, {
    x: 6.9, y: 4.5, w: 5.8, h: 2.0,
    barGrouping: 'clustered',
    barDir: 'col',
    catAxisLabelFontSize: 8,
    catAxisLabelFontFace: FONT,
    catAxisLabelColor: TEXT,
    valAxisLabelFontSize: 7,
    valAxisLabelColor: MUTED,
    chartColors: [ORANGE, ACCENT, ORANGE, ACCENT, ORANGE, ACCENT, ORANGE, ACCENT],
    showLegend: false,
    valAxisMinVal: 0,
    valAxisMaxVal: 100,
  });

  s.addShape(pptx.ShapeType.roundRect, { x: 7.0, y: 6.55, w: 0.25, h: 0.18, fill: { color: ORANGE } });
  s.addText('Fallback lexical', { x: 7.3, y: 6.5, w: 1.8, h: 0.25, fontSize: 8, fontFace: FONT, color: TEXT });
  s.addShape(pptx.ShapeType.roundRect, { x: 9.2, y: 6.55, w: 0.25, h: 0.18, fill: { color: ACCENT } });
  s.addText('Pipeline distant', { x: 9.5, y: 6.5, w: 1.8, h: 0.25, fontSize: 8, fontFace: FONT, color: TEXT });

  s.addText('Source : rapport ch.04 — Corpus de 15 avis annotés manuellement', {
    x: 0.6, y: 6.6, w: 12, h: 0.3,
    fontSize: 8, fontFace: FONT, color: MUTED,
  });
  addFooter(s, 11);
})();

// ─── Slide 12 : Démonstration ────────────────────────────────────
(() => {
  const s = pptx.addSlide();
  addTitleBlock(s, 'Démonstration', 'Parcours utilisateur complet', 12);

  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 1.5, w: 5.5, h: 2.8,
    fill: { color: CARD_BG },
    rectRadius: 0.12,
    line: { color: ACCENT, width: 1, dashType: 'dash' },
  });
  s.addText('▶', {
    x: 0.6, y: 1.8, w: 5.5, h: 1.0,
    fontSize: 48, fontFace: FONT, color: MUTED, align: 'center', valign: 'middle',
  });
  s.addText('Espace réservé à la vidéo de démonstration', {
    x: 0.6, y: 2.8, w: 5.5, h: 0.4,
    fontSize: 12, fontFace: FONT, color: MUTED, align: 'center',
  });
  s.addText('Vidéo de démonstration à intégrer.', {
    x: 0.6, y: 3.2, w: 5.5, h: 0.4,
    fontSize: 10, fontFace: FONT, color: ORANGE, align: 'center',
  });

  const steps = [
    ['1', 'Saisie d\'un avis client', 'Le client se connecte au portail, accède à ses commandes\npayées et rédige un commentaire.', ACCENT],
    ['2', 'Analyse automatique', 'La tâche Celery analyse le texte : HuggingFace API\n(BERT/MARBERT) ou fallback lexical local.', GREEN],
    ['3', 'Affichage du résultat', 'Le gérant voit le sentiment (POSITIF/NEUTRE/NEGATIF)\ndans le back-office, avec le score de confiance.', ORANGE],
  ];
  steps.forEach((step, i) => {
    const y = 1.5 + i * 1.5;
    s.addShape(pptx.ShapeType.roundRect, {
      x: 6.9, y, w: 5.8, h: 1.2,
      fill: { color: CARD_BG },
      rectRadius: 0.08,
      line: { color: step[3], width: 0.8 },
    });
    s.addText(step[0], {
      x: 7.0, y: y + 0.1, w: 0.5, h: 0.35,
      fontSize: 20, fontFace: FONT, color: step[3], bold: true,
    });
    s.addText(step[1], {
      x: 7.6, y: y + 0.1, w: 5, h: 0.3,
      fontSize: 14, fontFace: FONT, color: TEXT, bold: true,
    });
    s.addText(step[2], {
      x: 7.0, y: y + 0.5, w: 5.6, h: 0.65,
      fontSize: 10, fontFace: FONT, color: MUTED, lineSpacing: 13,
    });
  });

  s.addText('Comptes démo : gerant_test / client_test — password123', {
    x: 0.6, y: 6.5, w: 12, h: 0.3,
    fontSize: 9, fontFace: FONT, color: MUTED,
  });
  addFooter(s, 12);
})();

// ─── Slide 13 : Défis rencontrés ────────────────────────────────
(() => {
  const s = pptx.addSlide();
  addTitleBlock(s, 'Défis rencontrés', 'Obstacles et réponses apportées', 13);

  const defis = [
    ['Qualité des données', 'Avis courts, multilingues', 'Normalisation Unicode, detection langue (ar/autres)', ORANGE],
    ['Disponibilité API', 'HuggingFace peut être indisponible', 'Fallback lexical local multilingue (FR/EN/AR) garantissant la continuité', RED],
    ['Multilinguisme', 'FR/EN/AR + darija', 'Dictionnaires séparés, routage vers MARBERT pour l\'arabe', ACCENT],
    ['Surapprentissage', 'Pas de grand corpus local', 'Évaluation sur 15 avis annotés manuellement, métriques documentées', ORANGE],
    ['Temps réel', 'Sync salle-cuisine', 'Django Channels + Redis + WebSocket pour notifications instantanées', GREEN],
    ['Tests', 'Couverture multi-couches', '346 tests pytest (93%), 29 Vitest, 202 scénarios Playwright', GREEN],
    ['Déploiement', 'Reproductibilité', 'Docker Compose avec 6 services orchestrés', ACCENT],
  ];

  defis.forEach((d, i) => {
    const y = 1.5 + i * 0.7;
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y, w: 2.8, h: 0.55,
      fill: { color: CARD_BG },
      rectRadius: 0.06,
      line: { color: d[3], width: 0.8 },
    });
    s.addText(d[0], {
      x: 0.7, y, w: 2.6, h: 0.28,
      fontSize: 11, fontFace: FONT, color: d[3], bold: true,
    });
    s.addText(d[1], {
      x: 0.7, y: y + 0.28, w: 2.6, h: 0.25,
      fontSize: 8, fontFace: FONT, color: MUTED,
    });
    s.addText('→', {
      x: 3.5, y, w: 0.3, h: 0.55,
      fontSize: 14, fontFace: FONT, color: MUTED, align: 'center', valign: 'middle',
    });
    s.addShape(pptx.ShapeType.roundRect, {
      x: 3.9, y, w: 8.7, h: 0.55,
      fill: { color: BG },
      rectRadius: 0.06,
      line: { color: 'E0E0E0', width: 0.5 },
    });
    s.addText(d[2], {
      x: 4.0, y, w: 8.5, h: 0.55,
      fontSize: 10, fontFace: FONT, color: TEXT, valign: 'middle',
    });
  });

  s.addText('Fichiers : app/backend/apps/avis/tasks.py, sentiment_service.py, tests.py', {
    x: 0.6, y: 6.6, w: 12, h: 0.3,
    fontSize: 9, fontFace: FONT, color: MUTED,
  });
  addFooter(s, 13);
})();

// ─── Slide 14 : Conclusion ───────────────────────────────────────
(() => {
  const s = pptx.addSlide();
  s.background = { fill: BG };

  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.05,
    fill: { color: ACCENT },
  });

  s.addText('Conclusion & perspectives', {
    x: 0.6, y: 0.4, w: 12, h: 0.7,
    fontSize: 32, fontFace: FONT, color: TEXT, bold: true,
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 0.6, y: 1.1, w: 2.5, h: 0.03,
    fill: { color: ACCENT },
  });

  const points = [
    ['Problématique', 'Centraliser la gestion d\'un restaurant et analyser automatiquement les avis clients'],
    ['Solution', 'Application web full-stack (Django + React) avec pipeline d\'analyse de sentiment hybride'],
    ['Apport', 'Architecture modulaire, testable (346 tests, 93% couverture), déployable avec Docker'],
    ['Modèle retenu', 'Pipeline distant BERT Multilingue (Acc. 93%) + fallback lexical local pour la résilience'],
    ['Limites', 'Fallback simple, pas de corpus local annoté de grande taille, recommandation à enrichir'],
  ];
  points.forEach((p, i) => {
    const y = 1.4 + i * 0.65;
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y, w: 12.1, h: 0.52,
      fill: { color: CARD_BG },
      rectRadius: 0.06,
    });
    s.addText(p[0], {
      x: 0.8, y, w: 2.2, h: 0.52,
      fontSize: 11, fontFace: FONT, color: ACCENT, bold: true, valign: 'middle',
    });
    s.addText(p[1], {
      x: 3.2, y, w: 9.3, h: 0.52,
      fontSize: 10, fontFace: FONT, color: TEXT, valign: 'middle',
    });
  });

  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 4.8, w: 12.1, h: 1.5,
    fill: { color: CARD_BG },
    rectRadius: 0.08,
  });
  s.addText('Perspectives', {
    x: 0.8, y: 4.85, w: 5, h: 0.3,
    fontSize: 14, fontFace: FONT, color: ACCENT, bold: true,
  });
  const perspectives = [
    '1. Constituer un corpus d\'avis annotés pour évaluer objectivement les modèles de sentiment',
    '2. Améliorer le fallback avec un modèle TF-IDF + classifieur linéaire entraîné',
    '3. Combiner commentaire et note client pour fiabiliser la prédiction',
    '4. Enrichir la recommandation avec l\'historique client et les contraintes de stock',
    '5. Consolider le déploiement production (HTTPS, monitoring, sauvegardes)',
  ];
  s.addText(perspectives.join('\n'), {
    x: 0.8, y: 5.2, w: 11.6, h: 1.0,
    fontSize: 10, fontFace: FONT, color: TEXT, lineSpacing: 14,
  });

  s.addText('« Tastify : une solution cohérente et défendable dans le cadre d\'un Projet de Fin d\'Année. »', {
    x: 0.6, y: 6.6, w: 12, h: 0.4,
    fontSize: 11, fontFace: FONT, color: MUTED, italic: true, align: 'center',
  });
  addFooter(s, 14);
})();

// ─── Generate ────────────────────────────────────────────────────
const OUTPUT = 'presentation_codebase_analyse_sentiments.pptx';
await pptx.writeFile({ fileName: OUTPUT });
console.log(`✅ Présentation générée : ${OUTPUT}`);
