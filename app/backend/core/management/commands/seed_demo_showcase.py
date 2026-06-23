import random
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management import BaseCommand, CommandError, call_command
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.avis.models import AnalyseSentiment, Avis
from apps.avis.tasks import analyze_review_sentiment, get_hf_api_token
from apps.commandes.models import Commande, CommandeLigne
from apps.hr.models import Candidature, Employe, OffreEmploi, Shift
from apps.loyalty.models import LoyaltyProfile, LoyaltyTransaction, Reward
from apps.menu.models import Plat
from apps.paiements.models import Paiement, PaiementItem
from apps.reservations.models import Reservation
from apps.tables.models import Table

User = get_user_model()


CLIENTS = [
    ("client_test", "Karim", "Sadiki", "karim.sadiki@gmail.com", Decimal("1280.00")),
    ("client2_test", "Salma", "Rami", "salma.rami@gmail.com", Decimal("430.00")),
    ("client3_test", "Amine", "Chraibi", "amine.chraibi@gmail.com", Decimal("2260.00")),
    ("client4_test", "Fatima", "Alaoui", "fatima.alaoui@gmail.com", Decimal("890.00")),
    ("client5_test", "Mohammed", "Aziz", "mohammed.aziz@gmail.com", Decimal("240.00")),
    ("client6_test", "Noor", "Hassan", "noor.hassan@gmail.com", Decimal("710.00")),
    ("client7_demo", "Yassine", "Benjelloun", "yassine.benjelloun@gmail.com", Decimal("1680.00")),
    ("client8_demo", "Hiba", "Mernissi", "hiba.mernissi@gmail.com", Decimal("520.00")),
    ("client9_demo", "Nabil", "Tazi", "nabil.tazi@gmail.com", Decimal("315.00")),
    ("client10_demo", "Imane", "El Fassi", "imane.elfassi@gmail.com", Decimal("1910.00")),
    ("client11_demo", "Othmane", "Berrada", "othmane.berrada@gmail.com", Decimal("760.00")),
    ("client12_demo", "Lina", "Maaroufi", "lina.maaroufi@gmail.com", Decimal("115.00")),
    ("client13_demo", "Meryem", "Kettani", "meryem.kettani@gmail.com", Decimal("1450.00")),
    ("client14_demo", "Anas", "Rachidi", "anas.rachidi@gmail.com", Decimal("2040.00")),
    ("client15_demo", "Soukaina", "Ait Lahcen", "soukaina.aitlahcen@gmail.com", Decimal("660.00")),
]

REVIEW_TEXTS = [
    (5, "Tajine de Poulet", "Le tajine etait parfumé, service attentif, on sent une vraie cuisine maison."),
    (4, "Couscous aux Sept Légumes", "Très bon couscous, légumes généreux, juste un peu d'attente au début."),
    (3, "Pastilla au Poulet", "Bien mais pas exceptionnel, la pastilla était correcte et le service assez neutre."),
    (5, "Tanjia Marrakchia", "La tanjia fondait en bouche, ambiance agréable et personnel souriant."),
    (2, "Pastilla au Poulet", "La pastilla est arrivée froide et on a attendu trop longtemps."),
    (4, "Mechoui Impérial", "Viande tendre et portions solides, prix élevé mais expérience réussie."),
    (3, "Salade Marocaine", "Repas moyen, les produits sont frais mais l'assaisonnement reste ordinaire."),
    (5, "Thé à la Menthe", "الشاي رائع والخدمة ممتازة، تجربة جميلة مع العائلة."),
    (1, "Tajine de Mer", "الخدمة سيئة والطبق لم يكن طازجا، لن أعود قريبا."),
    (4, "Soupe Harira", "Harira très réconfortante, épices équilibrées et accueil chaleureux."),
    (5, "Pastilla aux Fruits de Mer", "Pastilla croustillante, garniture généreuse, bravo au chef."),
    (3, "Tajine de Légumes Jardinier", "Correct pour un déjeuner rapide, bon goût mais présentation simple."),
    (2, "Couscous aux Sept Légumes", "Déçu par le couscous, un peu sec et service lent ce soir-là."),
    (4, "Cornes de Gazelle", "Desserts très bons, surtout les cornes de gazelle avec le thé."),
    (5, "Rfissa de la Casbah", "Rfissa généreuse et très savoureuse, on reviendra pour ce plat."),
    (3, "Café au Lait", "Café correct, rien de spécial mais service rapide."),
    (4, "Briouates au Fromage", "Briouates croustillantes et bien chaudes, très bon début de repas."),
    (2, "Tajine de Poulet", "Le poulet était bon mais la sauce manquait de chaleur, dommage."),
    (5, "Mechoui Impérial", "المشوي ممتاز واللحم طري جدا، أنصح به."),
    (4, "Tajine de Mer", "Poisson bien cuit, sauce parfumée, salle un peu bruyante."),
    (3, "Msemen au Miel", "Msemen moyen, bon miel mais texture un peu lourde."),
    (5, "Zaalouk", "Zaalouk excellent, fumé juste comme il faut."),
    (4, "Jus d'Orange Frais", "Jus frais et bien servi, parfait avec les entrées."),
    (1, "Pastilla aux Fruits de Mer", "Très déçu, beaucoup d'attente et plat servi presque froid."),
]


class Command(BaseCommand):
    help = "Seed a stable PFA showcase dataset with realistic restaurant history."

    def add_arguments(self, parser):
        parser.add_argument(
            "--require-hf",
            action="store_true",
            help="Fail if HUGGINGFACE_API_TOKEN is missing before analysing reviews.",
        )
        parser.add_argument(
            "--history-days",
            type=int,
            default=120,
            help="Number of historical operating days to generate.",
        )

    def handle(self, *args, **options):
        if options["require_hf"] and not get_hf_api_token():
            raise CommandError(
                "HUGGINGFACE_API_TOKEN is required for seed_demo_showcase --require-hf."
            )

        random.seed(20260623)
        with transaction.atomic():
            self.history_days = max(7, options["history_days"])
            self.ensure_base_dataset()
            self.clear_transactional_dataset()
            self.clients = self.ensure_clients()
            self.serveurs = list(User.objects.filter(role=User.Role.SERVEUR).order_by("id"))
            self.plats = list(Plat.objects.filter(est_disponible=True).order_by("id"))
            self.tables = list(Table.objects.filter(est_active=True).order_by("numero"))
            if not self.serveurs or not self.plats or not self.tables:
                raise CommandError("seed_all did not create the required staff, menu, and tables.")

            self.seed_rewards()
            self.seed_historical_orders()
            self.seed_today_completed_orders()
            self.seed_active_service_scene()
            self.seed_reviews()
            self.seed_loyalty()
            self.seed_reservations()
            self.seed_hr_activity()

        self.write_summary()

    def ensure_base_dataset(self):
        if not User.objects.filter(username="gerant_test").exists() or not Plat.objects.exists():
            call_command("seed_all")
        elif Table.objects.count() < 25:
            call_command("seed_all")

    def clear_transactional_dataset(self):
        AnalyseSentiment.objects.all().delete()
        Avis.objects.all().delete()
        PaiementItem.objects.all().delete()
        Paiement.objects.all().delete()
        CommandeLigne.objects.all().delete()
        Commande.objects.all().delete()
        Reservation.objects.all().delete()
        LoyaltyTransaction.objects.all().delete()
        LoyaltyProfile.objects.all().delete()
        Reward.objects.all().delete()
        Shift.objects.all().delete()
        Candidature.objects.all().delete()
        OffreEmploi.objects.all().delete()
        Table.objects.update(statut=Table.Statut.LIBRE)

    def ensure_clients(self):
        clients = []
        for username, first_name, last_name, email, _points in CLIENTS:
            user, _ = User.objects.update_or_create(
                username=username,
                defaults={
                    "email": email,
                    "role": User.Role.CLIENT,
                    "first_name": first_name,
                    "last_name": last_name,
                    "is_staff": False,
                },
            )
            user.set_password("password123")
            user.save(update_fields=["password", "updated_at"] if hasattr(user, "updated_at") else ["password"])
            clients.append(user)
        return clients

    def seed_rewards(self):
        rewards = [
            ("Café offert", "Un café ou thé offert", Decimal("100.00")),
            ("Dessert offert", "Un dessert marocain au choix", Decimal("300.00")),
            ("Entrée offerte", "Une entrée au choix de la carte", Decimal("500.00")),
            ("Réduction 20%", "Réduction sur l'addition totale", Decimal("800.00")),
            ("Repas pour 2", "Menu complet pour deux personnes", Decimal("1500.00")),
            ("Table VIP", "Réservation prioritaire pendant un mois", Decimal("2000.00")),
        ]
        for nom, description, points in rewards:
            Reward.objects.create(
                nom=nom,
                description=description,
                points_requis=points,
                est_actif=True,
            )

    def seed_historical_orders(self):
        today = timezone.localdate()
        for days_ago in range(self.history_days, 0, -1):
            service_day = today - timedelta(days=days_ago)
            is_weekend = service_day.weekday() >= 5
            order_count = random.randint(5, 9) if is_weekend else random.randint(3, 7)
            for index in range(order_count):
                service_time = self.random_service_time(service_day)
                self.create_paid_order(
                    service_time,
                    table=random.choice(self.tables),
                    serveur=random.choice(self.serveurs),
                    client=random.choice(self.clients),
                    item_count=random.randint(2, 5),
                    reference=f"SHOW-{service_day:%Y%m%d}-{index:03d}",
                )

    def seed_today_completed_orders(self):
        today = timezone.localdate()
        windows = [
            (time(11, 45), 5),
            (time(12, 20), 6),
            (time(13, 10), 5),
            (time(19, 15), 4),
        ]
        index = 0
        for start, count in windows:
            for offset in range(count):
                served_at = timezone.make_aware(
                    datetime.combine(today, start) + timedelta(minutes=offset * 11)
                )
                self.create_paid_order(
                    served_at,
                    table=random.choice(self.tables),
                    serveur=random.choice(self.serveurs),
                    client=random.choice(self.clients),
                    item_count=random.randint(2, 4),
                    reference=f"SHOW-TODAY-{index:03d}",
                )
                index += 1

    def seed_active_service_scene(self):
        table_specs = [
            (1, Commande.Statut.EN_COURS, CommandeLigne.Statut.EN_ATTENTE, 3),
            (3, Commande.Statut.EN_CUISINE, CommandeLigne.Statut.EN_PREPARATION, 4),
            (4, Commande.Statut.PRETE, CommandeLigne.Statut.PRET, 2),
            (16, Commande.Statut.EN_CUISINE, CommandeLigne.Statut.EN_PREPARATION, 3),
            (25, Commande.Statut.EN_COURS, CommandeLigne.Statut.EN_ATTENTE, 2),
            (8, Commande.Statut.PRETE, CommandeLigne.Statut.PRET, 3),
            (19, Commande.Statut.EN_CUISINE, CommandeLigne.Statut.EN_PREPARATION, 4),
        ]
        now = timezone.now()
        for idx, (numero, statut, line_statut, item_count) in enumerate(table_specs):
            table = Table.objects.get(numero=numero)
            commande = Commande.objects.create(
                table=table,
                serveur=self.serveurs[idx % len(self.serveurs)],
                client=self.clients[idx % len(self.clients)],
                type=Commande.Type.SUR_PLACE,
                statut=statut,
                est_active=True,
            )
            created_at = now - timedelta(minutes=35 - idx * 4)
            total = Decimal("0.00")
            for plat in self.pick_plats(item_count):
                ligne = CommandeLigne.objects.create(
                    commande=commande,
                    plat=plat,
                    quantite=1,
                    statut=line_statut,
                )
                line_created = created_at + timedelta(minutes=random.randint(0, 8))
                update_values = {"created_at": line_created}
                if line_statut == CommandeLigne.Statut.EN_PREPARATION:
                    update_values["heure_lancement"] = now - timedelta(minutes=random.randint(4, 16))
                    update_values["updated_at"] = now - timedelta(minutes=random.randint(1, 4))
                elif line_statut == CommandeLigne.Statut.PRET:
                    update_values["heure_lancement"] = now - timedelta(minutes=random.randint(18, 26))
                    update_values["updated_at"] = now - timedelta(minutes=random.randint(1, 6))
                else:
                    update_values["updated_at"] = line_created
                CommandeLigne.objects.filter(pk=ligne.pk).update(**update_values)
                total += ligne.prix_unitaire
            Commande.objects.filter(pk=commande.pk).update(
                montant_total=total,
                created_at=created_at,
                updated_at=now - timedelta(minutes=idx),
            )

        for numero in [8, 22]:
            Table.objects.filter(numero=numero).update(statut=Table.Statut.ENCAISSEMENT)
        for numero in [6, 14]:
            Table.objects.filter(numero=numero).update(statut=Table.Statut.RESERVEE)

    def seed_reviews(self):
        review_orders = list(
            Commande.objects.filter(statut=Commande.Statut.PAYEE, client__isnull=False)
            .prefetch_related("lignes__plat")
            .order_by("-created_at")[:80]
        )
        if not review_orders:
            raise CommandError("No paid orders available to attach reviews.")

        for index, (note, plat_name, commentaire) in enumerate(REVIEW_TEXTS):
            commande = review_orders[index % len(review_orders)]
            ligne = (
                commande.lignes.filter(plat__nom=plat_name).first()
                or commande.lignes.select_related("plat").first()
            )
            if ligne is None:
                continue
            avis = Avis.objects.create(
                user=commande.client,
                commande=commande,
                plat=ligne.plat,
                note=note,
                commentaire=commentaire,
            )
            created_at = timezone.now() - timedelta(days=index % 35, hours=index % 8)
            Avis.objects.filter(pk=avis.pk).update(created_at=created_at, updated_at=created_at)
            analyze_review_sentiment(avis.id)

    def seed_loyalty(self):
        point_map = {username: points for username, *_rest, points in CLIENTS}
        for client in self.clients:
            points = point_map[client.username]
            profile, _ = LoyaltyProfile.objects.update_or_create(
                user=client,
                defaults={"points": points},
            )
            LoyaltyTransaction.objects.filter(profile=profile).delete()
            gain_total = Decimal("0.00")
            for index in range(5):
                gain = Decimal(random.choice([85, 120, 160, 220, 280, 340]))
                gain_total += gain
                tx = LoyaltyTransaction.objects.create(
                    profile=profile,
                    points=gain,
                    type=LoyaltyTransaction.Type.GAIN,
                    description="Points gagnés sur commande",
                )
                LoyaltyTransaction.objects.filter(pk=tx.pk).update(
                    created_at=timezone.now() - timedelta(days=90 - index * 12)
                )
            if gain_total > points:
                spent = gain_total - points
                tx = LoyaltyTransaction.objects.create(
                    profile=profile,
                    points=-spent,
                    type=LoyaltyTransaction.Type.DEPENSE,
                    description="Récompense échangée",
                )
                LoyaltyTransaction.objects.filter(pk=tx.pk).update(
                    created_at=timezone.now() - timedelta(days=9)
                )

    def seed_reservations(self):
        today = timezone.localdate()
        lunch_slots = [time(12, 0), time(12, 30), time(13, 0), time(13, 30)]
        dinner_slots = [time(19, 0), time(19, 30), time(20, 0), time(20, 30), time(21, 0)]
        notes = [
            "",
            "Table près de la fenêtre si possible",
            "Anniversaire",
            "Allergie fruits de mer",
            "Repas d'affaires",
            "Besoin d'une chaise haute",
        ]
        reservation_history_days = min(90, self.history_days)
        for day_offset in range(-reservation_history_days, 15):
            reservation_day = today + timedelta(days=day_offset)
            count = random.randint(1, 4 if day_offset <= 0 else 3)
            used = set()
            for _ in range(count):
                client = random.choice(self.clients)
                persons = random.randint(2, 6)
                matching_tables = [table for table in self.tables if table.capacite >= persons]
                table = random.choice(matching_tables or self.tables)
                slot_pool = lunch_slots if random.random() < 0.42 else dinner_slots
                start_time = random.choice(slot_pool)
                key = (table.id, reservation_day, start_time)
                if key in used:
                    continue
                used.add(key)
                end_dt = datetime.combine(reservation_day, start_time) + timedelta(minutes=105)
                if day_offset < 0:
                    statut = random.choices(
                        [Reservation.Statut.PRESENTE, Reservation.Statut.ABSENTE, Reservation.Statut.ANNULEE],
                        weights=[75, 12, 13],
                    )[0]
                elif day_offset == 0 and start_time < timezone.localtime().time():
                    statut = Reservation.Statut.PRESENTE
                else:
                    statut = Reservation.Statut.CONFIRMEE
                try:
                    Reservation.objects.create(
                        client=client,
                        table=table,
                        date_reservation=reservation_day,
                        heure_debut=start_time,
                        heure_fin=end_dt.time(),
                        nombre_personnes=persons,
                        statut=statut,
                        notes=random.choice(notes),
                    )
                except Exception:
                    continue

    def seed_hr_activity(self):
        employes = list(Employe.objects.select_related("user").order_by("id"))
        if employes:
            today = timezone.localdate()
            for day_offset in range(-14, 15):
                day = today + timedelta(days=day_offset)
                random.shuffle(employes)
                for index, employe in enumerate(employes[: min(7, len(employes))]):
                    start, end = (time(8, 0), time(14, 0)) if index % 2 == 0 else (time(14, 0), time(22, 0))
                    Shift.objects.get_or_create(
                        employe=employe,
                        jour=day,
                        heure_debut=start,
                        defaults={"heure_fin": end},
                    )

        serveur_offer = OffreEmploi.objects.create(
            titre="Serveur(se) extra week-end",
            description="Renfort salle pour services chargés et événements privés.",
            type_contrat=OffreEmploi.TypeContrat.CDD,
            salaire_propose="300 MAD / service",
            est_publiee=True,
        )
        cuisine_offer = OffreEmploi.objects.create(
            titre="Commis cuisine marocaine",
            description="Préparation entrées, dressage et soutien brigade chaude.",
            type_contrat=OffreEmploi.TypeContrat.CDI,
            salaire_propose="4 000 - 4 800 MAD / mois",
            est_publiee=True,
        )
        for offer, name, email, status in [
            (serveur_offer, "Imane Benali", "imane.benali@gmail.com", Candidature.Statut.ENTRETENUE),
            (serveur_offer, "Youssef Tazi", "youssef.tazi@outlook.com", Candidature.Statut.NOUVELLE),
            (cuisine_offer, "Khalid Mansouri", "k.mansouri@hotmail.com", Candidature.Statut.RECRUTEE),
            (cuisine_offer, "Fatima Zahra El Amrani", "fze@gmail.com", Candidature.Statut.NOUVELLE),
        ]:
            Candidature.objects.create(
                offre=offer,
                nom_complet=name,
                email=email,
                telephone="06" + str(random.randint(10000000, 99999999)),
                message_motivation="Candidature de démonstration pour la soutenance.",
                statut=status,
            )

    def random_service_time(self, service_day):
        if random.random() < 0.43:
            hour = random.randint(12, 14)
        else:
            hour = random.randint(19, 22)
        return timezone.make_aware(
            datetime.combine(service_day, time(hour, random.randint(0, 59), random.randint(0, 59)))
        )

    def pick_plats(self, count):
        weighted = sorted(self.plats, key=lambda plat: (plat.categorie.ordre_affichage, plat.nom))
        return random.sample(weighted, k=min(count, len(weighted)))

    def create_paid_order(self, served_at, table, serveur, client, item_count, reference):
        commande = Commande.objects.create(
            table=table,
            serveur=serveur,
            client=client,
            type=Commande.Type.SUR_PLACE,
            statut=Commande.Statut.PRETE,
            est_active=True,
        )
        total = Decimal("0.00")
        lignes = []
        for plat in self.pick_plats(item_count):
            qty = random.choices([1, 2, 3], weights=[70, 25, 5])[0]
            prep_minutes = random.randint(12, 28)
            ligne = CommandeLigne.objects.create(
                commande=commande,
                plat=plat,
                quantite=qty,
                statut=CommandeLigne.Statut.SERVI,
            )
            line_done_at = served_at - timedelta(minutes=random.randint(0, 6))
            CommandeLigne.objects.filter(pk=ligne.pk).update(
                created_at=line_done_at - timedelta(minutes=prep_minutes + random.randint(2, 8)),
                updated_at=line_done_at,
                heure_lancement=line_done_at - timedelta(minutes=prep_minutes),
            )
            total += ligne.prix_unitaire * qty
            lignes.append(ligne)

        Commande.objects.filter(pk=commande.pk).update(
            statut=Commande.Statut.PRETE,
            montant_total=total,
            created_at=served_at - timedelta(minutes=random.randint(35, 75)),
            updated_at=served_at,
        )
        paiement = Paiement.objects.create(
            commande=commande,
            client=client,
            montant=total,
            methode=random.choice([Paiement.Methode.ESPECES, Paiement.Methode.CARTE, Paiement.Methode.QR]),
            statut=Paiement.Statut.COMPLETE,
            reference_transaction=reference,
        )
        pay_time = served_at + timedelta(minutes=random.randint(5, 24))
        Paiement.objects.filter(pk=paiement.pk).update(created_at=pay_time, updated_at=pay_time)
        for ligne in lignes:
            PaiementItem.objects.create(
                paiement=paiement,
                commande_ligne=ligne,
                montant_contribue=ligne.prix_unitaire * ligne.quantite,
            )
        Commande.objects.filter(pk=commande.pk).update(
            statut=Commande.Statut.PAYEE,
            updated_at=pay_time,
        )
        Table.objects.filter(pk=table.pk).update(statut=Table.Statut.LIBRE)
        return commande

    def write_summary(self):
        today = timezone.localdate()
        today_revenue = (
            Paiement.objects.completed()
            .filter(updated_at__date=today)
            .aggregate(total=Sum("montant"))["total"]
            or Decimal("0.00")
        )
        analysed = AnalyseSentiment.objects.count()
        hf_analysed = AnalyseSentiment.objects.exclude(
            modele_utilise="fallback-lexique-multilingue"
        ).count()
        self.stdout.write(self.style.SUCCESS("Tastify showcase demo data ready."))
        self.stdout.write(f"  CA aujourd'hui: {today_revenue:.2f} DH")
        self.stdout.write(f"  Commandes aujourd'hui: {Commande.objects.filter(created_at__date=today).count()}")
        self.stdout.write(f"  Tables occupees: {Table.objects.filter(statut=Table.Statut.OCCUPEE).count()}")
        self.stdout.write(f"  Avis analyses: {analysed} ({hf_analysed} via HuggingFace/non-fallback)")
        self.stdout.write(f"  Clients fideles: {LoyaltyProfile.objects.count()}")
