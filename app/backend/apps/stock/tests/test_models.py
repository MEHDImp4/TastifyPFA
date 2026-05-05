import pytest
from decimal import Decimal

from django.db import IntegrityError

from apps.menu.models import Categorie, Plat
from apps.stock.models import Ingredient, PlatIngredient


@pytest.fixture
def categorie(db):
    return Categorie.objects.create(nom='Viandes', ordre_affichage=1)


@pytest.fixture
def plat(db, categorie):
    return Plat.objects.create(
        categorie=categorie,
        nom='Tajine poulet',
        prix=Decimal('65.00'),
    )


@pytest.fixture
def ingredient(db):
    return Ingredient.objects.create(
        nom='Poulet',
        unite_mesure='g',
        stock_actuel=Decimal('5000.00'),
        seuil_alerte=Decimal('500.00'),
    )


class TestIngredientModel:
    def test_creation(self, ingredient):
        assert ingredient.pk is not None
        assert ingredient.est_active is True
        assert ingredient.unite_mesure == 'g'

    def test_nom_unique_constraint(self, ingredient, db):
        with pytest.raises(IntegrityError):
            Ingredient.objects.create(
                nom='Poulet',
                unite_mesure='g',
                stock_actuel=Decimal('100.00'),
                seuil_alerte=Decimal('50.00'),
            )

    def test_soft_delete_sets_inactive(self, ingredient):
        """Soft delete must set est_active=False without removing the DB row."""
        ingredient.delete()
        refreshed = Ingredient.objects.get(pk=ingredient.pk)
        assert refreshed.est_active is False

    def test_soft_delete_preserves_row(self, ingredient):
        """Row must remain in the database after soft delete."""
        pk = ingredient.pk
        ingredient.delete()
        assert Ingredient.objects.filter(pk=pk).exists()

    def test_str_representation(self, ingredient):
        assert str(ingredient) == 'Poulet'

    def test_default_stock_and_alert(self, db):
        i = Ingredient.objects.create(nom='Sel', unite_mesure='g')
        assert i.stock_actuel == Decimal('0')
        assert i.seuil_alerte == Decimal('0')

    def test_unite_mesure_choices(self, db):
        for code, _ in Ingredient.UNITE_CHOICES:
            i = Ingredient.objects.create(nom=f'Ingr-{code}', unite_mesure=code)
            assert i.unite_mesure == code

    def test_ordering_by_nom(self, db):
        Ingredient.objects.create(nom='Zafran', unite_mesure='g')
        Ingredient.objects.create(nom='Ail', unite_mesure='g')
        names = list(Ingredient.objects.values_list('nom', flat=True))
        assert names == sorted(names)


class TestPlatIngredientModel:
    def test_creation(self, plat, ingredient, db):
        pi = PlatIngredient.objects.create(
            plat=plat,
            ingredient=ingredient,
            quantite_requise=Decimal('300.00'),
        )
        assert pi.pk is not None
        assert pi.quantite_requise == Decimal('300.00')

    def test_unique_together_constraint(self, plat, ingredient, db):
        """unique_together on (plat, ingredient) must prevent duplicate entries."""
        PlatIngredient.objects.create(
            plat=plat,
            ingredient=ingredient,
            quantite_requise=Decimal('300.00'),
        )
        with pytest.raises(IntegrityError):
            PlatIngredient.objects.create(
                plat=plat,
                ingredient=ingredient,
                quantite_requise=Decimal('150.00'),
            )

    def test_plat_m2m_relation(self, plat, ingredient, db):
        """Plat.ingredients M2M must be accessible after linking via PlatIngredient."""
        PlatIngredient.objects.create(
            plat=plat,
            ingredient=ingredient,
            quantite_requise=Decimal('300.00'),
        )
        assert ingredient in plat.ingredients.all()

    def test_ingredient_plats_reverse_relation(self, plat, ingredient, db):
        """Reverse relation ingredient.plats must resolve back to the Plat."""
        PlatIngredient.objects.create(
            plat=plat,
            ingredient=ingredient,
            quantite_requise=Decimal('300.00'),
        )
        assert plat in ingredient.plats.all()

    def test_multiple_ingredients_per_plat(self, plat, db):
        """A plat can have multiple distinct ingredients linked."""
        i1 = Ingredient.objects.create(nom='Tomate', unite_mesure='g')
        i2 = Ingredient.objects.create(nom='Oignon', unite_mesure='g')
        PlatIngredient.objects.create(plat=plat, ingredient=i1, quantite_requise=Decimal('200.00'))
        PlatIngredient.objects.create(plat=plat, ingredient=i2, quantite_requise=Decimal('100.00'))
        assert plat.ingredients.count() == 2

    def test_str_representation(self, plat, ingredient, db):
        pi = PlatIngredient.objects.create(
            plat=plat,
            ingredient=ingredient,
            quantite_requise=Decimal('300.00'),
        )
        assert 'Poulet' in str(pi)
        assert '300.00' in str(pi)
