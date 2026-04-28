from django.db import models
from django.contrib.auth.models import AbstractUser

class Utilisateur(AbstractUser):
    class Role(models.TextChoices):
        GERANT = 'GERANT', 'Gérant', 'gerant'
        SERVEUR = 'SERVEUR', 'Serveur', 'serveur'
        CUISINIER = 'CUISINIER', 'Cuisinier', 'cuisinier'
        CLIENT = 'CLIENT', 'Client', 'client'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
    )
