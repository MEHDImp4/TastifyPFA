"""
Seed transactional data:
  - Commandes + CommandeLignes + Paiements (15 jours d'historique)
  - Avis + AnalyseSentiment (20 reviews variées FR/AR)
  - LoyaltyProfile + LoyaltyTransaction + Reward
  - Shift (planning des 14 prochains jours)
  - OffreEmploi + Candidature
"""
import random
from datetime import timedelta, time, date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.avis.models import Avis, AnalyseSentiment
from apps.commandes.models import Commande, CommandeLigne
from apps.hr.models import Employe, Shift, OffreEmploi, Candidature
from apps.loyalty.models import LoyaltyProfile, LoyaltyTransaction, Reward
from apps.menu.models import Plat
from apps.paiements.models import Paiement, PaiementItem
from apps.tables.models import Table

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed transactional data for demo/testing purposes.'

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                self.seed_rewards()
                self.seed_commandes_paiements()
                self.seed_avis()
                self.seed_loyalty()
                self.seed_shifts()
                self.seed_offres_emploi()
            self.stdout.write(self.style.SUCCESS('✓ All transactional data seeded.'))
        except Exception as exc:
            import traceback
            self.stdout.write(self.style.ERROR(f'Seeding failed: {exc}'))
            traceback.print_exc()

    # ─────────────────────────────────────────────
    # 1. REWARDS
    # ─────────────────────────────────────────────
    def seed_rewards(self):
        rewards = [
            {'nom': 'Café offert',         'description': 'Un café ou thé de votre choix offert',            'points_requis': 100},
            {'nom': 'Dessert offert',       'description': 'Un dessert au choix de la carte offert',          'points_requis': 300},
            {'nom': 'Entrée offerte',       'description': 'Une entrée au choix de la carte offerte',         'points_requis': 500},
            {'nom': 'Réduction 20%',        'description': '20% de réduction sur l\'addition totale',         'points_requis': 800},
            {'nom': 'Repas pour 2',         'description': 'Un repas complet pour 2 personnes offert',        'points_requis': 1500},
            {'nom': 'Table VIP',            'description': 'Réservation prioritaire en salle VIP pendant un mois', 'points_requis': 2000},
        ]
        created = 0
        for r in rewards:
            _, was_created = Reward.objects.update_or_create(
                nom=r['nom'],
                defaults={'description': r['description'], 'points_requis': r['points_requis'], 'est_actif': True},
            )
            if was_created:
                created += 1
        self.stdout.write(f'  Rewards: {created} created.')

    # ─────────────────────────────────────────────
    # 2. COMMANDES + PAIEMENTS
    # ─────────────────────────────────────────────
    def seed_commandes_paiements(self):
        serveurs = list(User.objects.filter(role=User.Role.SERVEUR))
        clients  = list(User.objects.filter(role=User.Role.CLIENT))
        tables   = list(Table.objects.filter(est_active=True))
        plats    = list(Plat.objects.filter(est_disponible=True))

        if not serveurs or not tables or not plats:
            self.stdout.write(self.style.WARNING('  Skipping orders: missing serveurs/tables/plats.'))
            return

        METHODES = [
            Paiement.Methode.ESPECES, Paiement.Methode.ESPECES,
            Paiement.Methode.ESPECES, Paiement.Methode.CARTE,
            Paiement.Methode.QR,
        ]

        today = timezone.now().date()
        commandes_created = paiements_created = 0

        # ── Historical orders (past 15 days, 2-4 per day, all PAYEE) ──
        for days_ago in range(15, 0, -1):
            nb_orders = random.randint(2, 4)
            for _ in range(nb_orders):
                table   = random.choice(tables)
                serveur = random.choice(serveurs)
                client  = random.choice(clients)

                # Pick 2-4 plats
                chosen = random.sample(plats, k=min(random.randint(2, 4), len(plats)))

                commande = Commande.objects.create(
                    table=table,
                    serveur=serveur,
                    type=Commande.Type.SUR_PLACE,
                    statut=Commande.Statut.PAYEE,
                    est_active=True,
                )

                total = Decimal('0.00')
                lignes = []
                for plat in chosen:
                    qty = random.randint(1, 2)
                    ligne = CommandeLigne.objects.create(
                        commande=commande,
                        plat=plat,
                        quantite=qty,
                        statut=CommandeLigne.Statut.SERVI,
                    )
                    lignes.append(ligne)
                    total += ligne.prix_unitaire * qty

                Commande.objects.filter(pk=commande.pk).update(montant_total=total)

                # Backdate
                past_dt = timezone.now() - timedelta(days=days_ago, hours=random.randint(0, 6))
                Commande.objects.filter(pk=commande.pk).update(created_at=past_dt, updated_at=past_dt)

                # Payment
                methode = random.choice(METHODES)
                paiement = Paiement.objects.create(
                    commande=commande,
                    client=client,
                    montant=total,
                    methode=methode,
                    statut=Paiement.Statut.COMPLETE,
                    reference_transaction=f'REF-{commande.pk:06d}',
                )
                Paiement.objects.filter(pk=paiement.pk).update(
                    created_at=past_dt + timedelta(minutes=random.randint(30, 90)),
                    updated_at=past_dt + timedelta(minutes=random.randint(30, 90)),
                )
                for ligne in lignes:
                    PaiementItem.objects.create(
                        paiement=paiement,
                        commande_ligne=ligne,
                        montant_contribue=ligne.prix_unitaire * ligne.quantite,
                    )

                commandes_created += 1
                paiements_created += 1

        # ── Active orders (today) ──
        active_specs = [
            (Commande.Statut.EN_COURS,   random.choice(tables), random.choice(serveurs), 2),
            (Commande.Statut.EN_CUISINE, random.choice(tables), random.choice(serveurs), 3),
            (Commande.Statut.PRETE,      random.choice(tables), random.choice(serveurs), 1),
        ]
        for statut, table, serveur, nb_plats in active_specs:
            chosen = random.sample(plats, k=min(nb_plats, len(plats)))
            commande = Commande.objects.create(
                table=table,
                serveur=serveur,
                type=Commande.Type.SUR_PLACE,
                statut=statut,
                est_active=True,
            )
            total = Decimal('0.00')
            for plat in chosen:
                qty = 1
                ligne = CommandeLigne.objects.create(
                    commande=commande,
                    plat=plat,
                    quantite=qty,
                    statut=CommandeLigne.Statut.EN_PREPARATION if statut == Commande.Statut.EN_CUISINE else CommandeLigne.Statut.EN_ATTENTE,
                )
                total += ligne.prix_unitaire * qty
            Commande.objects.filter(pk=commande.pk).update(montant_total=total)
            commandes_created += 1

        self.stdout.write(f'  Commandes: {commandes_created} created, Paiements: {paiements_created} created.')

    # ─────────────────────────────────────────────
    # 3. AVIS + ANALYSE SENTIMENT
    # ─────────────────────────────────────────────
    def seed_avis(self):
        plats = list(Plat.objects.filter(est_disponible=True))

        AVIS_DATA = [
            # ── Positifs ──
            {'username': 'client_test',  'note': 5, 'score': 15, 'label': 'POSITIF', 'conf': 0.92,
             'commentaire': 'Tajine de poulet excellent ! La sauce aux citrons confits était parfaite, service impeccable. Je reviendrai sans hésiter.'},
            {'username': 'client2_test', 'note': 5, 'score': 15, 'label': 'POSITIF', 'conf': 0.89,
             'commentaire': 'Le couscous aux sept légumes est un véritable délice, digne des meilleures tables de Marrakech.'},
            {'username': 'client3_test', 'note': 4, 'score': 15, 'label': 'POSITIF', 'conf': 0.81,
             'commentaire': 'Très bonne expérience dans l\'ensemble. La pastilla au poulet était particulièrement savoureuse.'},
            {'username': 'client4_test', 'note': 5, 'score': 15, 'label': 'POSITIF', 'conf': 0.94,
             'commentaire': 'هذا المطعم رائع! الطاجين كان لذيذاً جداً والخدمة ممتازة. سأعود حتماً مع عائلتي.'},
            {'username': 'client5_test', 'note': 4, 'score': 15, 'label': 'POSITIF', 'conf': 0.78,
             'commentaire': 'Ambiance chaleureuse et cuisine authentique. La harira était excellente et bien épicée.'},
            {'username': 'client6_test', 'note': 5, 'score': 15, 'label': 'POSITIF', 'conf': 0.91,
             'commentaire': 'Un repas mémorable. La tanjia marrakchia fond en bouche. Personnel très accueillant et souriant.'},
            {'username': 'client_test',  'note': 4, 'score': 15, 'label': 'POSITIF', 'conf': 0.76,
             'commentaire': 'Les briouates au fromage sont croustillantes à souhait. Excellent rapport qualité-prix.'},
            {'username': 'client2_test', 'note': 5, 'score': 15, 'label': 'POSITIF', 'conf': 0.88,
             'commentaire': 'مطعم ممتاز، الأكل لذيذ والمكان جميل جداً. أنصح بتجربة المشوي الإمبراطوري.'},
            {'username': 'client3_test', 'note': 4, 'score': 15, 'label': 'POSITIF', 'conf': 0.83,
             'commentaire': 'Le méchoui impérial vaut vraiment son prix. Cuisson parfaite, viande fondante, accompagnements soignés.'},
            {'username': 'client4_test', 'note': 5, 'score': 15, 'label': 'POSITIF', 'conf': 0.90,
             'commentaire': 'La pastilla aux fruits de mer est un vrai bijou culinaire. Félicitations au chef pour ce travail remarquable.'},
            {'username': 'client5_test', 'note': 4, 'score': 15, 'label': 'POSITIF', 'conf': 0.77,
             'commentaire': 'Très satisfait de ma visite. Les desserts marocains sont succulents, surtout les cornes de gazelle.'},
            {'username': 'client6_test', 'note': 4, 'score': 15, 'label': 'POSITIF', 'conf': 0.82,
             'commentaire': 'Le thé à la menthe est préparé à la traditionnelle, parfumé et sucré comme il se doit. Excellent !'},
            # ── Neutres ──
            {'username': 'client_test',  'note': 3, 'score': 0,  'label': 'NEUTRE',  'conf': 0.65,
             'commentaire': 'Repas correct dans l\'ensemble. Le tajine était bon mais un peu long à venir, on a attendu 50 minutes.'},
            {'username': 'client3_test', 'note': 3, 'score': 0,  'label': 'NEUTRE',  'conf': 0.61,
             'commentaire': 'Nourriture correcte, rien d\'exceptionnel. Je m\'attendais à mieux pour le prix pratiqué.'},
            {'username': 'client5_test', 'note': 3, 'score': 0,  'label': 'NEUTRE',  'conf': 0.68,
             'commentaire': 'Expérience plutôt moyenne. Les plats sont corrects mais le service est lent et peu attentionné.'},
            {'username': 'client6_test', 'note': 3, 'score': 0,  'label': 'NEUTRE',  'conf': 0.63,
             'commentaire': 'Rien de spécial à signaler. Le décor est sympathique mais la cuisine reste assez banale.'},
            # ── Négatifs ──
            {'username': 'client2_test', 'note': 2, 'score': -15, 'label': 'NEGATIF', 'conf': 0.85,
             'commentaire': 'Très déçu par la qualité. Le couscous était trop sec et le service du serveur était désagréable.'},
            {'username': 'client4_test', 'note': 1, 'score': -15, 'label': 'NEGATIF', 'conf': 0.93,
             'commentaire': 'Terrible expérience. Nous avons attendu plus d\'une heure pour recevoir une commande froide. Inadmissible !'},
            {'username': 'client_test',  'note': 2, 'score': -15, 'label': 'NEGATIF', 'conf': 0.87,
             'commentaire': 'La pastilla était froide à l\'arrivée et le personnel semblait complètement débordé et indifférent.'},
            {'username': 'client3_test', 'note': 1, 'score': -15, 'label': 'NEGATIF', 'conf': 0.91,
             'commentaire': 'الخدمة سيئة جداً والطعام لم يكن طازجاً. لن أعود مرة أخرى ولن أنصح به لأحد.'},
        ]

        MODELS = {
            'POSITIF': 'nlptown/bert-base-multilingual-uncased-sentiment',
            'NEGATIF': 'nlptown/bert-base-multilingual-uncased-sentiment',
            'NEUTRE':  'tfidf-linearsvc-local',
        }

        created = 0
        for i, data in enumerate(AVIS_DATA):
            user = User.objects.filter(username=data['username']).first()
            if not user:
                continue
            plat = plats[i % len(plats)] if plats else None
            lang = 'ar' if any('؀' <= c <= 'ۿ' for c in data['commentaire']) else 'fr'

            avis, was_created = Avis.objects.update_or_create(
                user=user,
                commentaire=data['commentaire'],
                defaults={
                    'plat': plat,
                    'note': data['note'],
                    'sentiment_score': data['score'],
                    'lang_code': lang,
                },
            )
            if was_created:
                created += 1

            AnalyseSentiment.objects.update_or_create(
                avis=avis,
                defaults={
                    'label': data['label'],
                    'score_brut': data['conf'],
                    'modele_utilise': MODELS[data['label']],
                },
            )

            # Spread reviews over the last 20 days
            past_dt = timezone.now() - timedelta(days=random.randint(0, 20))
            Avis.objects.filter(pk=avis.pk).update(created_at=past_dt, updated_at=past_dt)

        self.stdout.write(f'  Avis: {created} created with AnalyseSentiment records.')

    # ─────────────────────────────────────────────
    # 4. LOYALTY
    # ─────────────────────────────────────────────
    def seed_loyalty(self):
        PROFILES = [
            {'username': 'client_test',  'points': Decimal('1200.00'), 'tier_expected': 'SILVER'},
            {'username': 'client2_test', 'points': Decimal('350.00'),  'tier_expected': 'BRONZE'},
            {'username': 'client3_test', 'points': Decimal('2100.00'), 'tier_expected': 'GOLD'},
            {'username': 'client4_test', 'points': Decimal('820.00'),  'tier_expected': 'SILVER'},
            {'username': 'client5_test', 'points': Decimal('155.00'),  'tier_expected': 'BRONZE'},
            {'username': 'client6_test', 'points': Decimal('590.00'),  'tier_expected': 'SILVER'},
        ]

        created = 0
        for p in PROFILES:
            user = User.objects.filter(username=p['username']).first()
            if not user:
                continue
            profile, was_created = LoyaltyProfile.objects.update_or_create(
                user=user,
                defaults={'points': p['points']},
            )
            if was_created:
                created += 1

            LoyaltyTransaction.objects.filter(profile=profile).delete()

            # Reconstruct a realistic transaction history
            remaining = p['points']
            transactions = []
            # Several gain transactions
            gains = [Decimal('100'), Decimal('280'), Decimal('150'), Decimal('320'), Decimal('200'), Decimal('350')]
            for gain in gains:
                if remaining <= 0:
                    break
                amount = min(gain, remaining)
                transactions.append({'type': LoyaltyTransaction.Type.GAIN, 'points': amount, 'description': 'Points gagnés sur commande'})
                remaining -= amount

            # One spend (if enough points were earned)
            total_gained = sum(t['points'] for t in transactions)
            if total_gained > p['points']:
                spent = total_gained - p['points']
                transactions.append({'type': LoyaltyTransaction.Type.DEPENSE, 'points': spent, 'description': 'Récompense échangée'})

            for i, tx in enumerate(transactions):
                lt = LoyaltyTransaction.objects.create(
                    profile=profile,
                    points=tx['points'],
                    type=tx['type'],
                    description=tx['description'],
                )
                past_dt = timezone.now() - timedelta(days=len(transactions) - i) * 3
                LoyaltyTransaction.objects.filter(pk=lt.pk).update(created_at=past_dt)

        self.stdout.write(f'  LoyaltyProfiles: {created} created.')

    # ─────────────────────────────────────────────
    # 5. SHIFTS
    # ─────────────────────────────────────────────
    def seed_shifts(self):
        employes = list(Employe.objects.select_related('user').all())
        if not employes:
            self.stdout.write(self.style.WARNING('  Skipping shifts: no employees found.'))
            return

        MORNING  = (time(8, 0),  time(14, 0))
        EVENING  = (time(14, 0), time(22, 0))

        today = timezone.now().date()
        created = 0

        for days_ahead in range(14):
            day = today + timedelta(days=days_ahead)
            # Assign morning + evening slots to different employees
            random.shuffle(employes)
            for i, emp in enumerate(employes[:min(6, len(employes))]):
                slot = MORNING if i % 2 == 0 else EVENING
                _, was_created = Shift.objects.get_or_create(
                    employe=emp,
                    jour=day,
                    heure_debut=slot[0],
                    defaults={'heure_fin': slot[1]},
                )
                if was_created:
                    created += 1

        self.stdout.write(f'  Shifts: {created} created (next 14 days).')

    # ─────────────────────────────────────────────
    # 6. OFFRES D'EMPLOI + CANDIDATURES
    # ─────────────────────────────────────────────
    def seed_offres_emploi(self):
        OFFRES = [
            {
                'titre': 'Serveur(se) expérimenté(e)',
                'description': 'Nous recherchons un(e) serveur(se) avec au moins 2 ans d\'expérience en restauration gastronomique. Maîtrise du français et de l\'arabe exigée. Sens du service et présentation irréprochable.',
                'type_contrat': OffreEmploi.TypeContrat.CDI,
                'salaire_propose': '4 500 - 5 500 MAD / mois',
            },
            {
                'titre': 'Cuisinier junior – Cuisine marocaine',
                'description': 'Passionné(e) par la cuisine marocaine traditionnelle, vous rejoindrez notre brigade sous la direction du chef. Expérience en tajines et couscous souhaitée. Formation interne assurée.',
                'type_contrat': OffreEmploi.TypeContrat.CDD,
                'salaire_propose': '3 800 - 4 500 MAD / mois',
            },
        ]

        CANDIDATURES = [
            {'offre_idx': 0, 'nom': 'Imane Benali',    'email': 'imane.benali@gmail.com',   'tel': '0612345678', 'msg': 'Forte de 3 ans d\'expérience dans un restaurant 4 étoiles à Rabat, je suis motivée à rejoindre votre équipe.', 'statut': Candidature.Statut.ENTRETENUE},
            {'offre_idx': 0, 'nom': 'Youssef Tazi',    'email': 'youssef.tazi@outlook.com', 'tel': '0623456789', 'msg': 'Serveur depuis 2 ans dans un établissement haut de gamme à Marrakech, je souhaite évoluer dans un cadre de qualité.', 'statut': Candidature.Statut.NOUVELLE},
            {'offre_idx': 0, 'nom': 'Nadia Alami',     'email': 'nadia.alami@gmail.com',    'tel': '0634567890', 'msg': 'Diplômée de l\'ISTH, je cherche mon premier poste en restauration gastronomique.', 'statut': Candidature.Statut.REFUSEE},
            {'offre_idx': 1, 'nom': 'Khalid Mansouri', 'email': 'k.mansouri@hotmail.com',   'tel': '0645678901', 'msg': 'Formé à la cuisine marocaine traditionnelle, je maîtrise la préparation des tajines, couscous et bastillas.', 'statut': Candidature.Statut.RECRUTEE},
            {'offre_idx': 1, 'nom': 'Fatima Zahra El Amrani', 'email': 'fze@gmail.com',     'tel': '0656789012', 'msg': 'Passionnée de cuisine marocaine, j\'ai suivi une formation de 6 mois chez un chef étoilé à Fès.', 'statut': Candidature.Statut.NOUVELLE},
        ]

        created_offres = created_cand = 0
        offre_objects = []

        for o in OFFRES:
            offre, was_created = OffreEmploi.objects.update_or_create(
                titre=o['titre'],
                defaults={
                    'description': o['description'],
                    'type_contrat': o['type_contrat'],
                    'salaire_propose': o['salaire_propose'],
                    'est_publiee': True,
                },
            )
            offre_objects.append(offre)
            if was_created:
                created_offres += 1

        for c in CANDIDATURES:
            offre = offre_objects[c['offre_idx']]
            _, was_created = Candidature.objects.update_or_create(
                offre=offre,
                email=c['email'],
                defaults={
                    'nom_complet': c['nom'],
                    'telephone': c['tel'],
                    'message_motivation': c['msg'],
                    'statut': c['statut'],
                },
            )
            if was_created:
                created_cand += 1

        self.stdout.write(f'  OffreEmploi: {created_offres} created, Candidatures: {created_cand} created.')
