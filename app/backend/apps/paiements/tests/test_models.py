import pytest
from decimal import Decimal
from django.db.utils import IntegrityError
from apps.paiements.models import Paiement, PaiementItem
from apps.commandes.models import Commande, CommandeLigne
from apps.tables.models import Table


@pytest.mark.django_db
class TestPaiementModels:
    def test_create_paiement(self, table):
        commande = Commande.objects.create(table=table, montant_total=Decimal('100.00'))
        paiement = Paiement.objects.create(
            commande=commande,
            montant=Decimal('100.00'),
            methode=Paiement.Methode.ESPECES,
            statut=Paiement.Statut.COMPLETE
        )
        assert paiement.id is not None
        assert str(paiement).startswith("Paiement")

    def test_paiement_amount_constraint(self, table):
        commande = Commande.objects.create(table=table, montant_total=Decimal('100.00'))
        paiement = Paiement(
            commande=commande,
            montant=Decimal('0.00'),
            methode=Paiement.Methode.ESPECES
        )
        with pytest.raises((IntegrityError, Exception)):
            # full_clean will raise ValidationError if validators are present
            # save will raise IntegrityError if DB constraints are enforced
            paiement.full_clean()
            paiement.save()

    def test_paiement_item_constraints(self, table, plat):
        commande = Commande.objects.create(table=table, montant_total=Decimal('10.00'))
        ligne = CommandeLigne.objects.create(commande=commande, plat=plat, quantite=1, prix_unitaire=Decimal('10.00'))
        paiement = Paiement.objects.create(
            commande=commande,
            montant=Decimal('10.00'),
            methode=Paiement.Methode.ESPECES
        )
        
        # Valid item
        PaiementItem.objects.create(paiement=paiement, commande_ligne=ligne, montant_contribue=Decimal('10.00'))
        
        # Unique constraint
        with pytest.raises(IntegrityError):
            PaiementItem.objects.create(paiement=paiement, commande_ligne=ligne, montant_contribue=Decimal('1.00'))

    def test_paiement_item_amount_constraint(self, table, plat):
        commande = Commande.objects.create(table=table, montant_total=Decimal('10.00'))
        ligne = CommandeLigne.objects.create(commande=commande, plat=plat, quantite=1, prix_unitaire=Decimal('10.00'))
        paiement = Paiement.objects.create(
            commande=commande,
            montant=Decimal('10.00'),
            methode=Paiement.Methode.ESPECES
        )
        with pytest.raises(IntegrityError):
            PaiementItem.objects.create(paiement=paiement, commande_ligne=ligne, montant_contribue=Decimal('0.00'))
