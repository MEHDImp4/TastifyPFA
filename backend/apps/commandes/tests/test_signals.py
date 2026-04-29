from decimal import Decimal

from django.test import TestCase

from apps.commandes.models import Commande, CommandeLigne
from apps.menu.models import Categorie, Plat
from apps.tables.models import Table


class CommandeSignalsTest(TestCase):
    def setUp(self):
        self.table = Table.objects.create(numero=3, capacite=4)
        self.commande = Commande.objects.create(table=self.table)
        self.categorie = Categorie.objects.create(nom='Cuisine', ordre_affichage=1)
        self.plat = Plat.objects.create(
            categorie=self.categorie,
            nom='Couscous',
            prix=Decimal('70.00'),
            temps_preparation=30,
        )

    def refresh_total(self):
        self.commande.refresh_from_db()
        return self.commande.montant_total

    def test_total_updates_when_line_is_added(self):
        CommandeLigne.objects.create(
            commande=self.commande,
            plat=self.plat,
            quantite=2,
        )
        self.assertEqual(self.refresh_total(), Decimal('140.00'))

    def test_total_updates_when_quantity_changes(self):
        ligne = CommandeLigne.objects.create(
            commande=self.commande,
            plat=self.plat,
            quantite=1,
        )
        ligne.quantite = 3
        ligne.save()
        self.assertEqual(self.refresh_total(), Decimal('210.00'))

    def test_total_updates_when_line_is_deleted(self):
        ligne = CommandeLigne.objects.create(
            commande=self.commande,
            plat=self.plat,
            quantite=2,
        )
        ligne.delete()
        self.assertEqual(self.refresh_total(), Decimal('0.00'))

    def test_cancelled_line_is_excluded_from_total(self):
        ligne = CommandeLigne.objects.create(
            commande=self.commande,
            plat=self.plat,
            quantite=2,
        )
        ligne.statut = CommandeLigne.Statut.ANNULE
        ligne.save()
        self.assertEqual(self.refresh_total(), Decimal('0.00'))

    def test_uncancelled_line_is_included_in_total(self):
        ligne = CommandeLigne.objects.create(
            commande=self.commande,
            plat=self.plat,
            quantite=2,
            statut=CommandeLigne.Statut.ANNULE,
        )
        self.assertEqual(self.refresh_total(), Decimal('0.00'))
        ligne.statut = CommandeLigne.Statut.EN_ATTENTE
        ligne.save()
        self.assertEqual(self.refresh_total(), Decimal('140.00'))

    def test_total_is_zero_when_no_lines_exist(self):
        self.assertEqual(self.refresh_total(), Decimal('0.00'))
