from decimal import Decimal

from django.test import TestCase

from apps.commandes.models import Commande, CommandeLigne
from apps.menu.models import Categorie, Plat
from apps.tables.models import Table


class CommandeModelTest(TestCase):
    def setUp(self):
        self.table = Table.objects.create(numero=1, capacite=4)
        self.commande = Commande.objects.create(table=self.table)

    def test_delete_sets_inactive(self):
        self.commande.delete()
        self.assertFalse(Commande.objects.get(pk=self.commande.pk).est_active)

    def test_delete_does_not_remove_row(self):
        pk = self.commande.pk
        self.commande.delete()
        self.assertTrue(Commande.objects.filter(pk=pk).exists())

    def test_active_manager_filters_inactive(self):
        Commande.objects.create(table=self.table, est_active=False)
        active = Commande.objects.active()
        self.assertIn(self.commande, active)
        self.assertEqual(active.filter(est_active=False).count(), 0)

    def test_defaults_are_set(self):
        self.assertEqual(self.commande.statut, Commande.Statut.EN_COURS)
        self.assertEqual(self.commande.montant_total, Decimal('0'))
        self.assertTrue(self.commande.est_active)


class CommandeLigneModelTest(TestCase):
    def setUp(self):
        self.table = Table.objects.create(numero=2, capacite=4)
        self.commande = Commande.objects.create(table=self.table)
        self.categorie = Categorie.objects.create(nom='Plats', ordre_affichage=1)
        self.plat = Plat.objects.create(
            categorie=self.categorie,
            nom='Tajine',
            prix=Decimal('85.50'),
            temps_preparation=25,
        )

    def test_save_snapshots_plat_price_when_empty(self):
        ligne = CommandeLigne.objects.create(
            commande=self.commande,
            plat=self.plat,
            quantite=2,
        )
        self.assertEqual(ligne.prix_unitaire, Decimal('85.50'))

    def test_existing_snapshot_is_not_overwritten(self):
        ligne = CommandeLigne.objects.create(
            commande=self.commande,
            plat=self.plat,
            quantite=1,
            prix_unitaire=Decimal('80.00'),
        )
        self.plat.prix = Decimal('99.00')
        self.plat.save()
        ligne.notes = 'Prix conserve'
        ligne.save()
        ligne.refresh_from_db()
        self.assertEqual(ligne.prix_unitaire, Decimal('80.00'))

    def test_ligne_references_commande_and_plat(self):
        ligne = CommandeLigne.objects.create(
            commande=self.commande,
            plat=self.plat,
            quantite=3,
        )
        self.assertEqual(ligne.commande, self.commande)
        self.assertEqual(ligne.plat, self.plat)
        self.assertEqual(str(ligne), 'Tajine x3')
