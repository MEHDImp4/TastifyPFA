from django.test import TestCase
from apps.tables.models import Table


class TableSoftDeleteTest(TestCase):
    def setUp(self):
        self.table = Table.objects.create(numero=1, capacite=4)

    def test_delete_sets_inactive(self):
        self.table.delete()
        self.assertFalse(Table.objects.get(pk=self.table.pk).est_active)

    def test_delete_does_not_remove_row(self):
        pk = self.table.pk
        self.table.delete()
        self.assertTrue(Table.objects.filter(pk=pk).exists())

    def test_active_manager_filters_inactive(self):
        Table.objects.create(numero=2, capacite=2, est_active=False)
        active = Table.objects.active()
        self.assertIn(self.table, active)
        self.assertEqual(active.filter(est_active=False).count(), 0)
