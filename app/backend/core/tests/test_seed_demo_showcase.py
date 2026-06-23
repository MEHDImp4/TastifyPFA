from decimal import Decimal
from unittest.mock import patch

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.avis.models import AnalyseSentiment, Avis
from apps.commandes.models import Commande, CommandeLigne
from apps.loyalty.models import LoyaltyProfile, LoyaltyTransaction
from apps.paiements.models import Paiement
from apps.tables.models import Table

User = get_user_model()


def fake_sentiment_analysis(avis_id):
    avis = Avis.objects.get(pk=avis_id)
    text = avis.commentaire.lower()
    if any(word in text for word in ["froid", "decu", "lent", "سيئة", "attendu"]):
        label = AnalyseSentiment.Label.NEGATIF
        score = -0.78
        confidence = 0.78
    elif any(word in text for word in ["correct", "moyen", "bien mais", "ordinaire"]):
        label = AnalyseSentiment.Label.NEUTRE
        score = 0.0
        confidence = 0.62
    else:
        label = AnalyseSentiment.Label.POSITIF
        score = 0.86
        confidence = 0.86

    AnalyseSentiment.objects.update_or_create(
        avis=avis,
        defaults={
            "label": label,
            "score_brut": confidence,
            "modele_utilise": "test-huggingface-model",
        },
    )
    avis.sentiment_score = score
    avis.lang_code = "ar" if any("\u0600" <= char <= "\u06ff" for char in avis.commentaire) else "fr"
    avis.save(update_fields=["sentiment_score", "lang_code", "updated_at"])


@pytest.mark.django_db
@patch("core.management.commands.seed_demo_showcase.analyze_review_sentiment", side_effect=fake_sentiment_analysis)
def test_seed_demo_showcase_populates_realistic_demo_data(mock_analysis, monkeypatch):
    monkeypatch.setenv("SEED_MEDIA_DOWNLOADS", "0")

    call_command("seed_demo_showcase", history_days=14)

    today = timezone.localdate()
    today_revenue = sum(
        payment.montant
        for payment in Paiement.objects.completed().filter(updated_at__date=today)
    )
    assert today_revenue > Decimal("2500.00")

    occupied_numbers = set(
        Table.objects.filter(statut=Table.Statut.OCCUPEE).values_list("numero", flat=True)
    )
    assert {1, 3, 4, 16, 25}.issubset(occupied_numbers)
    assert occupied_numbers != set(range(1, len(occupied_numbers) + 1))

    assert Commande.objects.filter(
        statut__in=[Commande.Statut.EN_COURS, Commande.Statut.EN_CUISINE, Commande.Statut.PRETE]
    ).count() >= 6
    assert CommandeLigne.objects.filter(statut=CommandeLigne.Statut.EN_PREPARATION).exists()
    assert CommandeLigne.objects.filter(statut=CommandeLigne.Statut.PRET).exists()
    assert CommandeLigne.objects.filter(statut=CommandeLigne.Statut.EN_ATTENTE).exists()

    assert Avis.objects.count() >= 24
    assert AnalyseSentiment.objects.count() == Avis.objects.count()
    assert set(AnalyseSentiment.objects.values_list("label", flat=True)) == {
        AnalyseSentiment.Label.POSITIF,
        AnalyseSentiment.Label.NEUTRE,
        AnalyseSentiment.Label.NEGATIF,
    }
    assert mock_analysis.call_count == Avis.objects.count()

    profiles = LoyaltyProfile.objects.select_related("user")
    assert profiles.count() >= 12
    assert {profile.tier for profile in profiles} >= {"BRONZE", "SILVER", "GOLD"}
    assert LoyaltyTransaction.objects.count() > profiles.count()

    gerant = User.objects.get(username="gerant_test")
    api = APIClient()
    api.force_authenticate(user=gerant)
    response = api.get(reverse("dashboard"))
    assert response.status_code == 200
    data = response.json()
    assert data["todayRevenue"] > 2500
    assert len(data["revenue7Days"]) == 7
    assert all("date" in point and "revenue" in point for point in data["revenue7Days"])
    assert data["activeTables"] >= 5
    assert data["pendingOrders"] >= 2
    assert 12 <= data["avgPrepTime"] <= 28


@pytest.mark.django_db
@patch("core.management.commands.seed_demo_showcase.analyze_review_sentiment", side_effect=fake_sentiment_analysis)
def test_seed_demo_showcase_is_idempotent(mock_analysis, monkeypatch):
    monkeypatch.setenv("SEED_MEDIA_DOWNLOADS", "0")

    call_command("seed_demo_showcase", history_days=14)
    first_counts = {
        "commandes": Commande.objects.count(),
        "avis": Avis.objects.count(),
        "paiements": Paiement.objects.count(),
    }

    call_command("seed_demo_showcase", history_days=14)
    second_counts = {
        "commandes": Commande.objects.count(),
        "avis": Avis.objects.count(),
        "paiements": Paiement.objects.count(),
    }

    assert second_counts == first_counts


@pytest.mark.django_db
@patch("core.management.commands.seed_demo_showcase.get_hf_api_token", return_value="")
def test_seed_demo_showcase_require_hf_fails_without_token(_mock_token):
    with pytest.raises(CommandError, match="HUGGINGFACE_API_TOKEN is required"):
        call_command("seed_demo_showcase", require_hf=True, history_days=7)
