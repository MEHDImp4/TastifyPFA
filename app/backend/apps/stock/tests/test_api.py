import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.stock.models import Ingredient, PlatIngredient
from apps.menu.models import Categorie, Plat

User = get_user_model()

BASE_URL = '/api/stock/ingredients/'


@pytest.fixture
def gerant(db):
    return User.objects.create_user(
        username='gerant_stock', password='pass', role=User.Role.GERANT
    )


@pytest.fixture
def serveur(db):
    return User.objects.create_user(
        username='serveur_stock', password='pass', role=User.Role.SERVEUR
    )


@pytest.fixture
def ingredient(db):
    return Ingredient.objects.create(
        nom='Farine', unite_mesure='g', stock_actuel=500, seuil_alerte=100
    )


@pytest.fixture
def inactive_ingredient(db):
    return Ingredient.objects.create(
        nom='Levure', unite_mesure='g', stock_actuel=0, seuil_alerte=50, est_active=False
    )


# --- CRUD tests (GERANT) ---

class TestIngredientCRUD:
    def test_list_ingredients_as_gerant(self, gerant, ingredient, inactive_ingredient):
        client = APIClient()
        client.force_authenticate(user=gerant)
        response = client.get(BASE_URL)
        assert response.status_code == status.HTTP_200_OK
        # GERANT sees all including inactive
        names = [i['nom'] for i in response.data['results']] if 'results' in response.data else [i['nom'] for i in response.data]
        assert 'Farine' in names
        assert 'Levure' in names

    def test_retrieve_ingredient(self, gerant, ingredient):
        client = APIClient()
        client.force_authenticate(user=gerant)
        response = client.get(f'{BASE_URL}{ingredient.pk}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['nom'] == 'Farine'

    def test_create_ingredient(self, gerant):
        client = APIClient()
        client.force_authenticate(user=gerant)
        data = {'nom': 'Sucre', 'unite_mesure': 'g', 'stock_actuel': '200.00', 'seuil_alerte': '50.00'}
        response = client.post(BASE_URL, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['nom'] == 'Sucre'
        assert Ingredient.objects.filter(nom='Sucre').exists()

    def test_update_ingredient(self, gerant, ingredient):
        client = APIClient()
        client.force_authenticate(user=gerant)
        response = client.patch(
            f'{BASE_URL}{ingredient.pk}/',
            {'stock_actuel': '750.00'},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        ingredient.refresh_from_db()
        assert ingredient.stock_actuel == 750

    def test_soft_delete_via_api(self, gerant, ingredient):
        """DELETE endpoint performs soft-delete: row persists with est_active=False."""
        client = APIClient()
        client.force_authenticate(user=gerant)
        response = client.delete(f'{BASE_URL}{ingredient.pk}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        ingredient.refresh_from_db()
        assert ingredient.est_active is False
        assert Ingredient.objects.filter(pk=ingredient.pk).exists()


# --- Permission tests ---

class TestIngredientPermissions:
    def test_serveur_can_list(self, serveur, ingredient):
        client = APIClient()
        client.force_authenticate(user=serveur)
        response = client.get(BASE_URL)
        assert response.status_code == status.HTTP_200_OK

    def test_serveur_cannot_create(self, serveur):
        client = APIClient()
        client.force_authenticate(user=serveur)
        data = {'nom': 'Beurre', 'unite_mesure': 'g', 'stock_actuel': '100.00', 'seuil_alerte': '20.00'}
        response = client.post(BASE_URL, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_serveur_cannot_update(self, serveur, ingredient):
        client = APIClient()
        client.force_authenticate(user=serveur)
        response = client.patch(
            f'{BASE_URL}{ingredient.pk}/',
            {'stock_actuel': '999.00'},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_serveur_cannot_delete(self, serveur, ingredient):
        client = APIClient()
        client.force_authenticate(user=serveur)
        response = client.delete(f'{BASE_URL}{ingredient.pk}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_list(self):
        client = APIClient()
        response = client.get(BASE_URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# --- Active filtering tests ---

class TestIngredientActiveFiltering:
    def test_non_gerant_sees_only_active(self, serveur, ingredient, inactive_ingredient):
        """Non-GERANT users see only est_active=True ingredients."""
        client = APIClient()
        client.force_authenticate(user=serveur)
        response = client.get(BASE_URL)
        assert response.status_code == status.HTTP_200_OK
        data = response.data['results'] if 'results' in response.data else response.data
        names = [i['nom'] for i in data]
        assert 'Farine' in names
        assert 'Levure' not in names

    def test_gerant_sees_inactive(self, gerant, ingredient, inactive_ingredient):
        """GERANT sees all including est_active=False ingredients."""
        client = APIClient()
        client.force_authenticate(user=gerant)
        response = client.get(BASE_URL)
        assert response.status_code == status.HTTP_200_OK
        data = response.data['results'] if 'results' in response.data else response.data
        names = [i['nom'] for i in data]
        assert 'Farine' in names
        assert 'Levure' in names

    def test_soft_deleted_hidden_from_non_gerant(self, serveur, ingredient):
        """After soft-delete, non-GERANT can no longer see the ingredient in list."""
        ingredient.delete()
        client = APIClient()
        client.force_authenticate(user=serveur)
        response = client.get(BASE_URL)
        data = response.data['results'] if 'results' in response.data else response.data
        names = [i['nom'] for i in data]
        assert 'Farine' not in names


PLAT_INGREDIENT_URL = '/api/stock/plat-ingredients/'


class TestPlatIngredientAPITest:
    @pytest.fixture(autouse=True)
    def setup(self, db):
        User = get_user_model()
        self.gerant = User.objects.create_user(
            username='gerant_pi', password='pass', role=User.Role.GERANT
        )
        self.serveur = User.objects.create_user(
            username='serveur_pi', password='pass', role=User.Role.SERVEUR
        )
        self.categorie = Categorie.objects.create(nom='Entrées', ordre_affichage=1)
        self.plat = Plat.objects.create(
            nom='Pizza Margherita',
            categorie=self.categorie,
            prix='12.50',
        )
        self.ingredient = Ingredient.objects.create(
            nom='Tomate', unite_mesure='g', stock_actuel=1000, seuil_alerte=100
        )

    def test_gerant_can_create_link(self):
        client = APIClient()
        client.force_authenticate(user=self.gerant)
        data = {
            'plat': self.plat.pk,
            'ingredient': self.ingredient.pk,
            'quantite_requise': '150.00',
        }
        response = client.post(PLAT_INGREDIENT_URL, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert PlatIngredient.objects.filter(plat=self.plat, ingredient=self.ingredient).exists()

    def test_non_gerant_cannot_create(self):
        client = APIClient()
        client.force_authenticate(user=self.serveur)
        data = {
            'plat': self.plat.pk,
            'ingredient': self.ingredient.pk,
            'quantite_requise': '150.00',
        }
        response = client.post(PLAT_INGREDIENT_URL, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_gerant_can_delete(self):
        link = PlatIngredient.objects.create(
            plat=self.plat, ingredient=self.ingredient, quantite_requise='100.00'
        )
        client = APIClient()
        client.force_authenticate(user=self.gerant)
        response = client.delete(f'{PLAT_INGREDIENT_URL}{link.pk}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not PlatIngredient.objects.filter(pk=link.pk).exists()

    def test_unique_together_violation(self):
        """Creating the same plat+ingredient link twice returns HTTP 400."""
        PlatIngredient.objects.create(
            plat=self.plat, ingredient=self.ingredient, quantite_requise='100.00'
        )
        client = APIClient()
        client.force_authenticate(user=self.gerant)
        data = {
            'plat': self.plat.pk,
            'ingredient': self.ingredient.pk,
            'quantite_requise': '200.00',
        }
        response = client.post(PLAT_INGREDIENT_URL, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
