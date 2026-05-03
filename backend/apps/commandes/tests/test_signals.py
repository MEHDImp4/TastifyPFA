from decimal import Decimal

from django.test import TestCase
from unittest.mock import patch

from apps.commandes.models import Commande, CommandeLigne
from apps.menu.models import Categorie, Plat
from apps.tables.models import Table


class CommandeSignalsTest(TestCase):
    def setUp(self):
        self.table = Table.objects.create(numero=3, capacite=4)
        self.commande = Commande.objects.create(table=self.table)
        self.categorie = Categorie.objects.create(nom='Cuisine', ordre_affichage=1)
        self.plat = Plat.objects.create(
            categorie=self.categorie,
            nom='Couscous',
            prix=Decimal('70.00'),
            temps_preparation=30,
        )

    def refresh_total(self):
        self.commande.refresh_from_db()
        return self.commande.montant_total

    def test_total_updates_when_line_is_added(self):
        CommandeLigne.objects.create(
            commande=self.commande,
            plat=self.plat,
            quantite=2,
        )
        self.assertEqual(self.refresh_total(), Decimal('140.00'))

    def test_total_updates_when_quantity_changes(self):
        ligne = CommandeLigne.objects.create(
            commande=self.commande,
            plat=self.plat,
            quantite=1,
        )
        ligne.quantite = 3
        ligne.save()
        self.assertEqual(self.refresh_total(), Decimal('210.00'))

    def test_total_updates_when_line_is_deleted(self):
        ligne = CommandeLigne.objects.create(
            commande=self.commande,
            plat=self.plat,
            quantite=2,
        )
        ligne.delete()
        self.assertEqual(self.refresh_total(), Decimal('0.00'))

    def test_cancelled_line_is_excluded_from_total(self):
        ligne = CommandeLigne.objects.create(
            commande=self.commande,
            plat=self.plat,
            quantite=2,
        )
        ligne.statut = CommandeLigne.Statut.ANNULE
        ligne.save()
        self.assertEqual(self.refresh_total(), Decimal('0.00'))

    def test_uncancelled_line_is_included_in_total(self):
        ligne = CommandeLigne.objects.create(
            commande=self.commande,
            plat=self.plat,
            quantite=2,
            statut=CommandeLigne.Statut.ANNULE,
        )
        self.assertEqual(self.refresh_total(), Decimal('0.00'))
        ligne.statut = CommandeLigne.Statut.EN_ATTENTE
        ligne.save()
        self.assertEqual(self.refresh_total(), Decimal('140.00'))

    def test_total_is_zero_when_no_lines_exist(self):
        self.assertEqual(self.refresh_total(), Decimal('0.00'))

    def test_commande_created_broadcast_runs_after_commit_with_lines(self):
        with patch('apps.commandes.signals.broadcast_staff_event') as broadcast_mock:
            with self.captureOnCommitCallbacks(execute=True):
                commande = Commande.objects.create(table=self.table)
                CommandeLigne.objects.create(
                    commande=commande,
                    plat=self.plat,
                    quantite=2,
                )

        created_events = [
            call.args for call in broadcast_mock.call_args_list
            if call.args and call.args[0] == 'order_created'
        ]
        self.assertEqual(len(created_events), 1)
        payload = created_events[0][1]["order"]
        self.assertEqual(len(payload["lignes"]), 1)
        self.assertEqual(payload["lignes"][0]["quantite"], 2)


class TestCommandeFireTransitionSignal(TestCase):
    """Phase 16: Signal must trigger orchestration ONLY on EN_COURS -> EN_CUISINE transition."""

    def setUp(self):
        self.table = Table.objects.create(numero=42, capacite=4)
        self.commande = Commande.objects.create(
            table=self.table,
            statut=Commande.Statut.EN_COURS,
        )

    @patch('apps.commandes.signals.KdsOrchestrator.schedule_reorchestration_after_commit')
    def test_fire_transition_triggers_orchestrator(self, mock_schedule):
        """P16-BE-01: EN_COURS -> EN_CUISINE must call schedule_reorchestration_after_commit."""
        self.commande.statut = Commande.Statut.EN_CUISINE
        self.commande.save()
        mock_schedule.assert_called_once_with(self.commande.pk)

    @patch('apps.commandes.signals.KdsOrchestrator.schedule_reorchestration_after_commit')
    def test_en_cuisine_to_prete_does_not_trigger_orchestrator(self, mock_schedule):
        """P16-BE-02: Subsequent transitions must NOT re-trigger orchestration."""
        self.commande.statut = Commande.Statut.EN_CUISINE
        self.commande.save()
        mock_schedule.reset_mock()
        self.commande.statut = Commande.Statut.PRETE
        self.commande.save()
        mock_schedule.assert_not_called()

    @patch('apps.commandes.signals.KdsOrchestrator.schedule_reorchestration_after_commit')
    def test_no_op_save_does_not_trigger_orchestrator(self, mock_schedule):
        """P16-BE-02: Saving without statut change must NOT trigger orchestration."""
        self.commande.save()
        mock_schedule.assert_not_called()

    @patch('apps.commandes.signals.KdsOrchestrator.schedule_reorchestration_after_commit')
    def test_create_with_en_cuisine_does_not_trigger_orchestrator(self, mock_schedule):
        """P16-BE-02: Initial creation with statut=EN_CUISINE is not a transition — must not fire."""
        table = Table.objects.create(numero=99, capacite=2)
        Commande.objects.create(table=table, statut=Commande.Statut.EN_CUISINE)
        mock_schedule.assert_not_called()
