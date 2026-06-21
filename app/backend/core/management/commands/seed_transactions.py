"""
Seed transactional data:
  - Commandes + CommandeLignes + Paiements (15 jours d'historique)
  - Avis + AnalyseSentiment (20 reviews variées FR/AR)
  - LoyaltyProfile + LoyaltyTransaction + Reward
  - Shift (planning des 14 prochains jours)
  - OffreEmploi + Candidature
"""
import random
from datetime import timedelta, time, date, datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.avis.models import Avis, AnalyseSentiment
from apps.commandes.models import Commande, CommandeLigne
from apps.hr.models import Employe, Shift, OffreEmploi, Candidature
from apps.loyalty.models import LoyaltyProfile, LoyaltyTransaction, Reward
from apps.menu.models import Plat
from apps.paiements.models import Paiement, PaiementItem
from apps.reservations.models import Reservation
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
                self.seed_reservations()
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

        # ── Historical orders (past 30 days, 8-15 per day, all PAYEE) ──
        for days_ago in range(30, 0, -1):
            base_date = today - timedelta(days=days_ago)
            nb_orders = random.randint(8, 15)
            for _ in range(nb_orders):
                table   = random.choice(tables)
                serveur = random.choice(serveurs)
                client  = random.choice(clients)

                # Pick 1-4 plats
                chosen = random.sample(plats, k=min(random.randint(1, 4), len(plats)))

                # spread times in typical restaurant peak hours
                # 40% lunch (12:00 - 15:00), 60% dinner (19:00 - 22:30)
                if random.random() < 0.40:
                    hour = random.randint(12, 14)
                else:
                    hour = random.randint(19, 22)
                minute = random.randint(0, 59)
                second = random.randint(0, 59)

                naive_dt = datetime.combine(base_date, time(hour, minute, second))
                past_dt = timezone.make_aware(naive_dt)

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

                Commande.objects.filter(pk=commande.pk).update(
                    montant_total=total,
                    created_at=past_dt,
                    updated_at=past_dt
                )

                # Backdate lines and set preparation times
                for ligne in lignes:
                    prep_minutes = random.randint(10, 25)
                    heure_lancement = past_dt - timedelta(minutes=prep_minutes)
                    CommandeLigne.objects.filter(pk=ligne.pk).update(
                        created_at=heure_lancement,
                        updated_at=past_dt,
                        heure_lancement=heure_lancement
                    )

                # Payment
                pay_dt = past_dt + timedelta(minutes=random.randint(15, 45))
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
                    created_at=pay_dt,
                    updated_at=pay_dt,
                )
                for ligne in lignes:
                    PaiementItem.objects.create(
                        paiement=paiement,
                        commande_ligne=ligne,
                        montant_contribue=ligne.prix_unitaire * ligne.quantite,
                    )

                commandes_created += 1
                paiements_created += 1

        # ── Today's completed orders (to show revenue and prep time today) ──
        nb_today_orders = random.randint(6, 12)
        now = timezone.now()
        for i in range(nb_today_orders):
            table   = random.choice(tables)
            serveur = random.choice(serveurs)
            client  = random.choice(clients)

            # Pick 1-3 plats
            chosen = random.sample(plats, k=min(random.randint(1, 3), len(plats)))

            # Order time is between 0.5 and 12 hours ago
            past_dt = now - timedelta(hours=random.uniform(0.5, 12))

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

            Commande.objects.filter(pk=commande.pk).update(
                montant_total=total,
                created_at=past_dt,
                updated_at=past_dt
            )

            # Backdate lines and set preparation times (which will compute avgPrepTime)
            for ligne in lignes:
                prep_minutes = random.randint(10, 25)
                heure_lancement = past_dt - timedelta(minutes=prep_minutes)
                CommandeLigne.objects.filter(pk=ligne.pk).update(
                    created_at=heure_lancement,
                    updated_at=past_dt,
                    heure_lancement=heure_lancement
                )

            # Payment
            pay_dt = past_dt + timedelta(minutes=random.randint(15, 45))
            methode = random.choice(METHODES)
            paiement = Paiement.objects.create(
                commande=commande,
                client=client,
                montant=total,
                methode=methode,
                statut=Paiement.Statut.COMPLETE,
                reference_transaction=f'REF-TODAY-{commande.pk:04d}',
            )
            Paiement.objects.filter(pk=paiement.pk).update(
                created_at=pay_dt,
                updated_at=pay_dt,
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
        demo_tables = sorted(tables, key=lambda table: table.numero)[:5]
        active_specs = [
            (Commande.Statut.EN_COURS, demo_tables[0], serveurs[0], 2, CommandeLigne.Statut.EN_ATTENTE),
            (Commande.Statut.EN_CUISINE, demo_tables[1], serveurs[0], 3, CommandeLigne.Statut.EN_PREPARATION),
            (Commande.Statut.PRETE, demo_tables[2], serveurs[0], 1, CommandeLigne.Statut.PRET),
            (Commande.Statut.EN_CUISINE, demo_tables[3], serveurs[1 % len(serveurs)], 2, CommandeLigne.Statut.EN_PREPARATION),
            (Commande.Statut.EN_COURS, demo_tables[4], serveurs[1 % len(serveurs)], 1, CommandeLigne.Statut.EN_ATTENTE),
        ]
        for statut, table, serveur, nb_plats, line_statut in active_specs:
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
                    statut=line_statut,
                )
                if line_statut == CommandeLigne.Statut.EN_PREPARATION:
                    lancement_time = timezone.now() - timedelta(minutes=random.randint(2, 10))
                    CommandeLigne.objects.filter(pk=ligne.pk).update(heure_lancement=lancement_time)
                elif line_statut == CommandeLigne.Statut.PRET:
                    lancement_time = timezone.now() - timedelta(minutes=random.randint(15, 25))
                    CommandeLigne.objects.filter(pk=ligne.pk).update(
                        heure_lancement=lancement_time,
                        updated_at=timezone.now() - timedelta(minutes=random.randint(1, 3))
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
        plat_dict = {p.nom: p for p in Plat.objects.all()}

        AVIS_DATA = [
            # ── Positifs ──
            {'username': 'client_test',  'note': 5, 'score': 15, 'label': 'POSITIF', 'conf': 0.92, 'plat_nom': 'Tajine de Poulet',
             'commentaire': 'Tajine de poulet excellent ! La sauce aux citrons confits était parfaite, service impeccable. Je reviendrai sans hésiter.'},
            {'username': 'client2_test', 'note': 5, 'score': 15, 'label': 'POSITIF', 'conf': 0.89, 'plat_nom': 'Couscous aux Sept Légumes',
             'commentaire': 'Le couscous aux sept légumes est un véritable délice, digne des meilleures tables de Marrakech.'},
            {'username': 'client3_test', 'note': 4, 'score': 15, 'label': 'POSITIF', 'conf': 0.81, 'plat_nom': 'Pastilla au Poulet',
             'commentaire': 'Très bonne expérience dans l\'ensemble. La pastilla au poulet était particulièrement savoureuse.'},
            {'username': 'client4_test', 'note': 5, 'score': 15, 'label': 'POSITIF', 'conf': 0.94, 'plat_nom': 'Tajine de Poulet',
             'commentaire': 'هذا المطعم رائع! الطاجين كان لذيذاً جداً والخدمة ممتازة. سأعود حتماً مع عائلتي.'},
            {'username': 'client5_test', 'note': 4, 'score': 15, 'label': 'POSITIF', 'conf': 0.78, 'plat_nom': 'Soupe Harira',
             'commentaire': 'Ambiance chaleureuse et cuisine authentique. La harira était excellente et bien épicée.'},
            {'username': 'client6_test', 'note': 5, 'score': 15, 'label': 'POSITIF', 'conf': 0.91, 'plat_nom': 'Tanjia Marrakchia',
             'commentaire': 'Un repas mémorable. La tanjia marrakchia fond en bouche. Personnel très accueillant et souriant.'},
            {'username': 'client_test',  'note': 4, 'score': 15, 'label': 'POSITIF', 'conf': 0.76, 'plat_nom': 'Briouates au Fromage',
             'commentaire': 'Les briouates au fromage sont croustillantes à souhait. Excellent rapport qualité-prix.'},
            {'username': 'client2_test', 'note': 5, 'score': 15, 'label': 'POSITIF', 'conf': 0.88, 'plat_nom': 'Mechoui Impérial',
             'commentaire': 'مطعم ممتاز، الأكل لذيذ والمكان جميل جداً. أنصح بتجربة المشوي الإمبراطوري.'},
            {'username': 'client3_test', 'note': 4, 'score': 15, 'label': 'POSITIF', 'conf': 0.83, 'plat_nom': 'Mechoui Impérial',
             'commentaire': 'Le méchoui impérial vaut vraiment son prix. Cuisson parfaite, viande fondante, accompagnements soignés.'},
            {'username': 'client4_test', 'note': 5, 'score': 15, 'label': 'POSITIF', 'conf': 0.90, 'plat_nom': 'Pastilla aux Fruits de Mer',
             'commentaire': 'La pastilla aux fruits de mer est un vrai bijou culinaire. Félicitations au chef pour ce travail remarquable.'},
            {'username': 'client5_test', 'note': 4, 'score': 15, 'label': 'POSITIF', 'conf': 0.77, 'plat_nom': 'Cornes de Gazelle',
             'commentaire': 'Très satisfait de ma visite. Les desserts marocains sont succulents, surtout les cornes de gazelle.'},
            {'username': 'client6_test', 'note': 4, 'score': 15, 'label': 'POSITIF', 'conf': 0.82, 'plat_nom': 'Thé à la Menthe',
             'commentaire': 'Le thé à la menthe est préparé à la traditionnelle, parfumé et sucré comme il se doit. Excellent !'},
            # ── Neutres ──
            {'username': 'client_test',  'note': 3, 'score': 0,  'label': 'NEUTRE',  'conf': 0.65, 'plat_nom': 'Tajine de Poulet',
             'commentaire': 'Repas correct dans l\'ensemble. Le tajine était bon mais un peu long à venir, on a attendu 50 minutes.'},
            {'username': 'client3_test', 'note': 3, 'score': 0,  'label': 'NEUTRE',  'conf': 0.61, 'plat_nom': 'Tanjia Marrakchia',
             'commentaire': 'Nourriture correcte, rien d\'exceptionnel. Je m\'attendais à mieux pour le prix pratiqué.'},
            {'username': 'client5_test', 'note': 3, 'score': 0,  'label': 'NEUTRE',  'conf': 0.68, 'plat_nom': 'Couscous aux Sept Légumes',
             'commentaire': 'Expérience plutôt moyenne. Les plats sont corrects mais le service est lent et peu attentionné.'},
            {'username': 'client6_test', 'note': 3, 'score': 0,  'label': 'NEUTRE',  'conf': 0.63, 'plat_nom': 'Salade Marocaine',
             'commentaire': 'Rien de spécial à signaler. Le décor est sympathique mais la cuisine reste assez banale.'},
            # ── Négatifs ──
            {'username': 'client2_test', 'note': 2, 'score': -15, 'label': 'NEGATIF', 'conf': 0.85, 'plat_nom': 'Couscous aux Sept Légumes',
             'commentaire': 'Très déçu par la qualité. Le couscous était trop sec et le service du serveur était désagréable.'},
            {'username': 'client4_test', 'note': 1, 'score': -15, 'label': 'NEGATIF', 'conf': 0.93, 'plat_nom': 'Pastilla au Poulet',
             'commentaire': 'Terrible expérience. Nous avons attendu plus d\'une heure pour recevoir une commande froide. Inadmissible !'},
            {'username': 'client_test',  'note': 2, 'score': -15, 'label': 'NEGATIF', 'conf': 0.87, 'plat_nom': 'Pastilla au Poulet',
             'commentaire': 'La pastilla était froide à l\'arrivée et le personnel semblait complètement débordé et indifférent.'},
            {'username': 'client3_test', 'note': 1, 'score': -15, 'label': 'NEGATIF', 'conf': 0.91, 'plat_nom': 'Tajine de Mer',
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
            plat = plat_dict.get(data.get('plat_nom'))
            if not plat and plats:
                plat = random.choice(plats)
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

    # ─────────────────────────────────────────────
    # 7. RESERVATIONS
    # ─────────────────────────────────────────────
    def seed_reservations(self):
        clients = list(User.objects.filter(role=User.Role.CLIENT))
        tables = list(Table.objects.filter(est_active=True))

        if not clients or not tables:
            self.stdout.write(self.style.WARNING('  Skipping reservations: missing clients/tables.'))
            return

        today = timezone.now().date()
        created = 0

        # Typical reservation slots and notes
        LUNCH_SLOTS = [time(12, 0), time(12, 30), time(13, 0), time(13, 30)]
        DINNER_SLOTS = [time(19, 0), time(19, 30), time(20, 0), time(20, 30), time(21, 0)]
        
        RESERV_NOTES = [
            "", "", "", "", # 50% chance of empty note
            "Besoin d'une chaise haute",
            "Table près de la fenêtre si possible",
            "Célébration d'anniversaire",
            "Allergie aux fruits de mer signalée",
            "Repas d'affaires",
            "Au calme"
        ]

        # ── Historical Reservations (past 30 days) ──
        for days_ago in range(30, 0, -1):
            res_date = today - timedelta(days=days_ago)
            # 1 to 3 reservations per day
            nb_res = random.randint(1, 3)
            for _ in range(nb_res):
                client = random.choice(clients)
                nb_pers = random.randint(2, 6)
                
                # find tables with enough capacity
                matching_tables = [t for t in tables if t.capacite >= nb_pers]
                table = random.choice(matching_tables) if matching_tables else random.choice(tables)
                
                is_lunch = random.random() < 0.40
                start_time = random.choice(LUNCH_SLOTS) if is_lunch else random.choice(DINNER_SLOTS)
                # Durée 1.5 - 2h
                end_hour = start_time.hour + (2 if start_time.minute > 0 or random.random() < 0.5 else 1)
                end_minute = (start_time.minute + 30) % 60 if end_hour != start_time.hour + 2 else start_time.minute
                end_time = time(end_hour, end_minute)
                
                # Status: 70% Present, 15% Absent, 15% Cancelled
                rand_val = random.random()
                if rand_val < 0.70:
                    statut = Reservation.Statut.PRESENTE
                elif rand_val < 0.85:
                    statut = Reservation.Statut.ABSENTE
                else:
                    statut = Reservation.Statut.ANNULEE

                notes = random.choice(RESERV_NOTES)
                
                try:
                    Reservation.objects.create(
                        client=client,
                        table=table,
                        date_reservation=res_date,
                        heure_debut=start_time,
                        heure_fin=end_time,
                        nombre_personnes=nb_pers,
                        statut=statut,
                        notes=notes
                    )
                    created += 1
                except ValidationError:
                    pass

        # ── Today's Reservations ──
        # 3 to 6 reservations for today
        nb_res_today = random.randint(3, 6)
        for i in range(nb_res_today):
            client = random.choice(clients)
            nb_pers = random.randint(2, 6)
            matching_tables = [t for t in tables if t.capacite >= nb_pers]
            table = random.choice(matching_tables) if matching_tables else random.choice(tables)
            
            is_lunch = random.random() < 0.40
            start_time = random.choice(LUNCH_SLOTS) if is_lunch else random.choice(DINNER_SLOTS)
            
            end_hour = start_time.hour + (2 if start_time.minute > 0 or random.random() < 0.5 else 1)
            end_minute = (start_time.minute + 30) % 60 if end_hour != start_time.hour + 2 else start_time.minute
            end_time = time(end_hour, end_minute)
            
            # If start_time is in the past compared to current time, status is PRESENTE or ABSENTE
            # If in the future, it is CONFIRMEE
            now_time = timezone.now().time()
            if start_time < now_time:
                statut = Reservation.Statut.PRESENTE if random.random() < 0.85 else Reservation.Statut.ABSENTE
            else:
                statut = Reservation.Statut.CONFIRMEE

            notes = random.choice(RESERV_NOTES)
            
            try:
                Reservation.objects.create(
                    client=client,
                    table=table,
                    date_reservation=today,
                    heure_debut=start_time,
                    heure_fin=end_time,
                    nombre_personnes=nb_pers,
                    statut=statut,
                    notes=notes
                )
                created += 1
            except ValidationError:
                pass

        # ── Upcoming Reservations (next 7 days) ──
        for days_ahead in range(1, 8):
            res_date = today + timedelta(days=days_ahead)
            # 1 to 3 reservations per day
            nb_res = random.randint(1, 3)
            for _ in range(nb_res):
                client = random.choice(clients)
                nb_pers = random.randint(2, 6)
                matching_tables = [t for t in tables if t.capacite >= nb_pers]
                table = random.choice(matching_tables) if matching_tables else random.choice(tables)
                
                is_lunch = random.random() < 0.40
                start_time = random.choice(LUNCH_SLOTS) if is_lunch else random.choice(DINNER_SLOTS)
                
                end_hour = start_time.hour + (2 if start_time.minute > 0 or random.random() < 0.5 else 1)
                end_minute = (start_time.minute + 30) % 60 if end_hour != start_time.hour + 2 else start_time.minute
                end_time = time(end_hour, end_minute)
                
                statut = Reservation.Statut.CONFIRMEE
                notes = random.choice(RESERV_NOTES)
                
                try:
                    Reservation.objects.create(
                        client=client,
                        table=table,
                        date_reservation=res_date,
                        heure_debut=start_time,
                        heure_fin=end_time,
                        nombre_personnes=nb_pers,
                        statut=statut,
                        notes=notes
                    )
                    created += 1
                except ValidationError:
                    pass

        self.stdout.write(f'  Reservations: {created} created.')
