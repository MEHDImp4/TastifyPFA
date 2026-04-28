from django.test import TestCase
from apps.menu.models import Categorie, Plat


class PlatSoftDeleteTest(TestCase):
    def setUp(self):
        self.categorie = Categorie.objects.create(
            nom='Entrées Test',
            ordre_affichage=1,
        )
        self.plat = Plat.objects.create(
            categorie=self.categorie,
            nom='Salade César',
            prix='12.50',
            temps_preparation=10,
        )

    def test_delete_sets_inactive(self):
        self.plat.delete()
        self.assertFalse(Plat.objects.get(pk=self.plat.pk).est_active)

    def test_delete_does_not_remove_row(self):
        pk = self.plat.pk
        self.plat.delete()
        self.assertTrue(Plat.objects.filter(pk=pk).exists())

    def test_active_manager_filters_inactive(self):
        Plat.objects.create(
            categorie=self.categorie,
            nom='Plat Inactif',
            prix='5.00',
            est_active=False,
        )
        active = Plat.objects.active()
        self.assertIn(self.plat, active)
        self.assertEqual(active.filter(est_active=False).count(), 0)

    def test_active_manager_after_soft_delete(self):
        self.plat.delete()
        self.assertNotIn(self.plat, Plat.objects.active())
