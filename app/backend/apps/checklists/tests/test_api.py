import datetime

from django.test import TestCase
from rest_framework.test import APIClient

from apps.checklists.models import Checklist, ChecklistExecution, ChecklistItemResponse
from apps.users.models import Utilisateur


class ChecklistAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.gerant = Utilisateur.objects.create_user(
            username='gerant_checklist',
            password='pass',
            role='GERANT',
        )
        self.serveur = Utilisateur.objects.create_user(
            username='serveur_checklist',
            password='pass',
            role='SERVEUR',
        )
        self.cuisinier = Utilisateur.objects.create_user(
            username='cuisinier_checklist',
            password='pass',
            role='CUISINIER',
        )
        self.customer = Utilisateur.objects.create_user(
            username='client_checklist',
            password='pass',
            role='CLIENT',
        )
        self.checklist_payload = {
            'titre': 'Ouverture Cuisine',
            'type': Checklist.Type.OUVERTURE,
            'active': True,
            'tasks': [
                {
                    'description': 'Allumer les fours',
                    'ordre': 1,
                    'est_obligatoire': True,
                },
                {
                    'description': 'Verifier les frigos',
                    'ordre': 2,
                    'est_obligatoire': False,
                },
            ],
        }

    def _create_checklist(self):
        self.client.force_authenticate(user=self.gerant)
        response = self.client.post('/api/checklists/', self.checklist_payload, format='json')
        self.assertEqual(response.status_code, 201)
        return Checklist.objects.get(pk=response.data['id'])

    def test_gerant_can_create_template_with_tasks(self):
        checklist = self._create_checklist()
        self.assertEqual(checklist.tasks.count(), 2)

    def test_non_gerant_cannot_create_template(self):
        self.client.force_authenticate(user=self.serveur)
        response = self.client.post('/api/checklists/', self.checklist_payload, format='json')
        self.assertEqual(response.status_code, 403)

    def test_staff_can_list_templates(self):
        checklist = self._create_checklist()
        self.client.force_authenticate(user=self.cuisinier)
        response = self.client.get('/api/checklists/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['id'], checklist.id)
        self.assertEqual(len(response.data[0]['tasks']), 2)

    def test_client_cannot_list_templates(self):
        self._create_checklist()
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/checklists/')
        self.assertEqual(response.status_code, 403)

    def test_staff_can_create_execution_with_generated_responses(self):
        checklist = self._create_checklist()
        self.client.force_authenticate(user=self.serveur)
        response = self.client.post(
            '/api/checklists/executions/',
            {'checklist': checklist.id, 'date': timezone_today_iso()},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        execution = ChecklistExecution.objects.get(pk=response.data['id'])
        self.assertEqual(execution.execute_par, self.serveur)
        self.assertEqual(execution.responses.count(), 2)
        self.assertEqual(response.data['statut'], ChecklistExecution.Statut.EN_COURS)

    def test_execution_list_defaults_to_current_day(self):
        checklist = self._create_checklist()
        ChecklistExecution.objects.create(
            checklist=checklist,
            date=datetime.date.today() - datetime.timedelta(days=1),
            execute_par=self.gerant,
        )
        today_execution = ChecklistExecution.objects.create(
            checklist=checklist,
            date=datetime.date.today(),
            execute_par=self.gerant,
        )
        for execution in ChecklistExecution.objects.all():
            for task in checklist.tasks.all():
                ChecklistItemResponse.objects.create(execution=execution, task=task)

        self.client.force_authenticate(user=self.cuisinier)
        response = self.client.get('/api/checklists/executions/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], today_execution.id)

    def test_patch_response_marks_item_complete_and_execution_done(self):
        checklist = self._create_checklist()
        execution = ChecklistExecution.objects.create(
            checklist=checklist,
            date=datetime.date.today(),
            execute_par=self.serveur,
        )
        responses = [
            ChecklistItemResponse.objects.create(execution=execution, task=task)
            for task in checklist.tasks.all()
        ]

        self.client.force_authenticate(user=self.cuisinier)
        first_patch = self.client.patch(
            f'/api/checklists/responses/{responses[0].id}/',
            {'est_complete': True},
            format='json',
        )
        self.assertEqual(first_patch.status_code, 200)
        execution.refresh_from_db()
        self.assertEqual(execution.statut, ChecklistExecution.Statut.TERMINE)
        responses[0].refresh_from_db()
        self.assertEqual(responses[0].completed_by, self.cuisinier)
        self.assertIsNotNone(responses[0].completed_at)

    def test_execution_unique_per_checklist_per_day(self):
        checklist = self._create_checklist()
        ChecklistExecution.objects.create(
            checklist=checklist,
            date=datetime.date.today(),
            execute_par=self.gerant,
        )
        self.client.force_authenticate(user=self.serveur)
        response = self.client.post(
            '/api/checklists/executions/',
            {'checklist': checklist.id, 'date': timezone_today_iso()},
            format='json',
        )
        self.assertEqual(response.status_code, 400)


def timezone_today_iso():
    return datetime.date.today().isoformat()

