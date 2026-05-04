from django.test import TestCase
from apps.menu.models import Categorie


class SoftDeleteTest(TestCase):
    def setUp(self):
        self.categorie = Categorie.objects.create(
            nom='Entrées',
            description='Les entrées du restaurant',
            ordre_affichage=1,
        )

    def test_delete_sets_inactive(self):
        """D-07: DELETE must set est_active=False, not remove from DB."""
        self.categorie.delete()
        self.assertFalse(
            Categorie.objects.get(pk=self.categorie.pk).est_active
        )

    def test_delete_does_not_remove_row(self):
        """D-07: Soft delete keeps the DB row intact."""
        pk = self.categorie.pk
        self.categorie.delete()
        self.assertTrue(Categorie.objects.filter(pk=pk).exists())

    def test_active_manager_filters_inactive(self):
        """D-06 prerequisite: Manager.active() only returns est_active=True."""
        Categorie.objects.create(nom='Inactive', est_active=False)
        active = Categorie.objects.active()
        self.assertIn(self.categorie, active)
        self.assertEqual(active.filter(est_active=False).count(), 0)

    def test_active_manager_after_soft_delete(self):
        """D-06 + D-07: After soft delete, category disappears from active()."""
        self.categorie.delete()
        self.assertNotIn(self.categorie, Categorie.objects.active())
