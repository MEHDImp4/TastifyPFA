import datetime
from unittest.mock import patch

from django.apps import apps
from django.test import TestCase

from apps.checklists.models import Checklist, ChecklistExecution
from apps.checklists.signals import ensure_daily_checklist_periodic_task
from apps.checklists.tasks import generate_daily_checklists
from apps.users.models import Utilisateur


class GenerateDailyChecklistsTaskTest(TestCase):
    def setUp(self):
        self.gerant = Utilisateur.objects.create_user(
            username='gerant_daily_checklists',
            password='pass',
            role=Utilisateur.Role.GERANT,
        )
        self.active_checklist = Checklist.objects.create(
            titre='Ouverture Salle',
            type=Checklist.Type.OUVERTURE,
            active=True,
        )
        self.active_checklist.tasks.create(
            description='Allumer les lumieres',
            ordre=1,
            est_obligatoire=True,
        )
        self.active_checklist.tasks.create(
            description='Verifier la caisse',
            ordre=2,
            est_obligatoire=False,
        )
        self.inactive_checklist = Checklist.objects.create(
            titre='Archive',
            type=Checklist.Type.FERMETURE,
            active=False,
        )
        self.inactive_checklist.tasks.create(
            description='Ne pas executer',
            ordre=1,
            est_obligatoire=True,
        )

    @patch('apps.checklists.tasks.timezone.localdate')
    def test_generate_daily_checklists_creates_execution_and_responses(self, localdate_mock):
        localdate_mock.return_value = datetime.date(2026, 5, 8)

        result = generate_daily_checklists()

        execution = ChecklistExecution.objects.get(
            checklist=self.active_checklist,
            date=datetime.date(2026, 5, 8),
        )
        self.assertEqual(execution.execute_par, self.gerant)
        self.assertEqual(execution.responses.count(), 2)
        self.assertEqual(result['created'], 1)
        self.assertEqual(result['skipped'], 0)
        self.assertFalse(
            ChecklistExecution.objects.filter(
                checklist=self.inactive_checklist,
                date=datetime.date(2026, 5, 8),
            ).exists()
        )

    @patch('apps.checklists.tasks.timezone.localdate')
    def test_generate_daily_checklists_is_idempotent_for_same_day(self, localdate_mock):
        localdate_mock.return_value = datetime.date(2026, 5, 8)

        first_result = generate_daily_checklists()
        second_result = generate_daily_checklists()

        self.assertEqual(first_result['created'], 1)
        self.assertEqual(second_result['created'], 0)
        self.assertEqual(second_result['skipped'], 1)
        self.assertEqual(
            ChecklistExecution.objects.filter(
                checklist=self.active_checklist,
                date=datetime.date(2026, 5, 8),
            ).count(),
            1,
        )

    @patch('apps.checklists.tasks.timezone.localdate')
    def test_generate_daily_checklists_skips_when_no_staff_exists(self, localdate_mock):
        localdate_mock.return_value = datetime.date(2026, 5, 8)
        Utilisateur.objects.all().delete()

        result = generate_daily_checklists()

        self.assertEqual(result['created'], 0)
        self.assertEqual(result['reason'], 'no_executor')
        self.assertFalse(ChecklistExecution.objects.exists())


class DailyChecklistPeriodicTaskRegistrationTest(TestCase):
    def test_registration_creates_or_updates_periodic_task(self):
        sender = apps.get_app_config('django_celery_beat')

        ensure_daily_checklist_periodic_task(sender=sender)

        PeriodicTask = apps.get_model('django_celery_beat', 'PeriodicTask')
        periodic_task = PeriodicTask.objects.get(
            task='apps.checklists.tasks.generate_daily_checklists'
        )
        self.assertEqual(periodic_task.crontab.hour, '4')
        self.assertEqual(periodic_task.crontab.minute, '0')
        self.assertEqual(str(periodic_task.crontab.timezone), 'Africa/Casablanca')

    def test_registration_is_idempotent(self):
        sender = apps.get_app_config('django_celery_beat')

        ensure_daily_checklist_periodic_task(sender=sender)
        ensure_daily_checklist_periodic_task(sender=sender)

        PeriodicTask = apps.get_model('django_celery_beat', 'PeriodicTask')
        self.assertEqual(
            PeriodicTask.objects.filter(
                task='apps.checklists.tasks.generate_daily_checklists'
            ).count(),
            1,
        )
