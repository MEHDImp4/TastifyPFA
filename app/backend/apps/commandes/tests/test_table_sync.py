from django.test import TestCase
from apps.commandes.models import Commande
from apps.commandes.models import CommandeLigne
from apps.menu.models import Categorie, Plat
from apps.paiements.models import Paiement
from apps.tables.models import Table

from decimal import Decimal

class TableSyncSignalTestCase(TestCase):
    def setUp(self):
        self.table = Table.objects.create(numero=10, capacite=4)
        # Default status is LIBRE

    def test_create_order_sets_table_occupied(self):
        self.assertEqual(self.table.statut, Table.Statut.LIBRE)
        
        Commande.objects.create(table=self.table)
        
        self.table.refresh_from_db()
        self.assertEqual(self.table.statut, Table.Statut.OCCUPEE)

    def test_pay_order_sets_table_libre(self):
        commande = Commande.objects.create(table=self.table)
        self.table.refresh_from_db()
        self.assertEqual(self.table.statut, Table.Statut.OCCUPEE)
        
        commande.statut = Commande.Statut.PAYEE
        commande.save()
        
        self.table.refresh_from_db()
        self.assertEqual(self.table.statut, Table.Statut.LIBRE)

    def test_cancel_order_sets_table_libre(self):
        commande = Commande.objects.create(table=self.table)
        self.table.refresh_from_db()
        self.assertEqual(self.table.statut, Table.Statut.OCCUPEE)
        
        commande.statut = Commande.Statut.ANNULEE
        commande.save()
        
        self.table.refresh_from_db()
        self.assertEqual(self.table.statut, Table.Statut.LIBRE)

    def test_reactivate_order_sets_table_occupied(self):
        commande = Commande.objects.create(table=self.table, statut=Commande.Statut.PAYEE)
        self.table.refresh_from_db()
        self.assertEqual(self.table.statut, Table.Statut.LIBRE)
        
        commande.statut = Commande.Statut.EN_COURS
        commande.save()
        
        self.table.refresh_from_db()
        self.assertEqual(self.table.statut, Table.Statut.OCCUPEE)

    def test_payment_completion_keeps_table_release_in_existing_commande_signal(self):
        categorie = Categorie.objects.create(nom='Sync Paiement', ordre_affichage=4)
        plat = Plat.objects.create(
            categorie=categorie,
            nom='Plat sync',
            prix=Decimal('18.00'),
            temps_preparation=12,
        )
        commande = Commande.objects.create(table=self.table)
        CommandeLigne.objects.create(
            commande=commande,
            plat=plat,
            quantite=1,
        )

        with self.captureOnCommitCallbacks(execute=True):
            Paiement.objects.create(
                commande=commande,
                montant=Decimal('18.00'),
                methode=Paiement.Methode.CARTE,
                statut=Paiement.Statut.COMPLETE,
            )

        commande.refresh_from_db()
        self.table.refresh_from_db()
        self.assertEqual(commande.statut, Commande.Statut.PAYEE)
        self.assertEqual(self.table.statut, Table.Statut.LIBRE)
