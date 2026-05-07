from django.db import models
from django.contrib.auth.models import AbstractUser

class Utilisateur(AbstractUser):
    class Role(models.TextChoices):
        GERANT = 'GERANT', 'Gérant'
        SERVEUR = 'SERVEUR', 'Serveur'
        CUISINIER = 'CUISINIER', 'Cuisinier'
        CLIENT = 'CLIENT', 'Client'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CLIENT)
