from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.cache import cache
from apps.menu.models import Categorie, Plat
from apps.commandes.models import Commande, CommandeLigne
from apps.tables.models import Table

User = get_user_model()


class PlatRecommendationAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.serveur = User.objects.create_user(
            username='serveur_rec', password='testpass123', role=User.Role.SERVEUR
        )
        self.client.force_authenticate(user=self.serveur)

        self.categorie = Categorie.objects.create(nom='Desserts', ordre_affichage=3)
        self.plat1 = Plat.objects.create(categorie=self.categorie, nom='Tiramisu', prix='5.00')
        self.plat2 = Plat.objects.create(categorie=self.categorie, nom='Cheesecake', prix='6.00')
        self.plat3 = Plat.objects.create(categorie=self.categorie, nom='Brownie', prix='4.00')
        self.plat4 = Plat.objects.create(categorie=self.categorie, nom='Mousse', prix='4.50')
        self.plat5 = Plat.objects.create(categorie=self.categorie, nom='Fondant', prix='5.50')
        self.plat6 = Plat.objects.create(categorie=self.categorie, nom='Tarte', prix='4.00')

        self.table = Table.objects.create(numero=1, capacite=2)

        cache.clear()

    def test_recommendation_from_cache(self):
        """Test that recommendations are returned from the cache if available."""
        # Setup cache: If they order plat1, recommend plat2 and plat3
        cache.set('plat_similarities', {
            self.plat1.id: [self.plat2.id, self.plat3.id]
        })

        response = self.client.get(f'/api/plats/{self.plat1.id}/recommendations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return plat2 and plat3
        self.assertEqual(len(response.data), 2)
        noms = [p['nom'] for p in response.data]
        self.assertIn('Cheesecake', noms)
        self.assertIn('Brownie', noms)
        self.assertNotIn('Tiramisu', noms)

    def test_recommendation_fallback_popular(self):
        """Test fallback returns top 5 popular when cache is empty/misses."""
        # Create commande to generate lines
        commande = Commande.objects.create(table=self.table, serveur=self.serveur)
        
        # Make plat4 the most popular, then plat5, etc.
        for _ in range(3):
            CommandeLigne.objects.create(commande=commande, plat=self.plat4)
        for _ in range(2):
            CommandeLigne.objects.create(commande=commande, plat=self.plat5)
        CommandeLigne.objects.create(commande=commande, plat=self.plat6)

        # Cache is empty, request recommendations for plat1
        response = self.client.get(f'/api/plats/{self.plat1.id}/recommendations/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # We expect a fallback to the most popular items (limit 5).
        # Should include plat4, plat5, plat6 (which have orders), and possibly others 
        # up to 5, but we mainly care about ordering by popularity
        self.assertLessEqual(len(response.data), 5)
        noms = [p['nom'] for p in response.data]
        
        # Check that popular ones are returned first
        self.assertEqual(response.data[0]['nom'], 'Mousse') # Most popular
        self.assertEqual(response.data[1]['nom'], 'Fondant') # 2nd most popular
        self.assertEqual(response.data[2]['nom'], 'Tarte') # 3rd most popular

    def test_recommendation_cache_with_inactive_plats(self):
        """Test that inactive or unavailable plats in cache are not returned."""
        self.plat2.est_active = False
        self.plat2.save()
        self.plat3.est_disponible = False
        self.plat3.save()
        
        cache.set('plat_similarities', {
            self.plat1.id: [self.plat2.id, self.plat3.id, self.plat4.id]
        })

        response = self.client.get(f'/api/plats/{self.plat1.id}/recommendations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should only return plat4 because plat2 is inactive and plat3 is unavailable
        noms = [p['nom'] for p in response.data]
        self.assertIn('Mousse', noms)
        self.assertNotIn('Cheesecake', noms)
        self.assertNotIn('Brownie', noms)
