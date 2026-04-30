from django.test import TestCase
from apps.tables.models import Table
from apps.commandes.models import Commande

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
