from django.test import TestCase
from apps.users.models import Utilisateur
from django.contrib.auth.models import AbstractUser

class UtilisateurModelTest(TestCase):
    def test_utilisateur_extends_abstract_user(self):
        self.assertTrue(issubclass(Utilisateur, AbstractUser))
        
    def test_role_choices(self):
        self.assertEqual(Utilisateur.Role.GERANT, "GERANT")
        self.assertEqual(Utilisateur.Role.SERVEUR, "SERVEUR")
        self.assertEqual(Utilisateur.Role.CUISINIER, "CUISINIER")
        self.assertEqual(Utilisateur.Role.CLIENT, "CLIENT")

    def test_default_role_is_client(self):
        user = Utilisateur.objects.create(username="testuser", password="password123")
        self.assertEqual(user.role, Utilisateur.Role.CLIENT)
