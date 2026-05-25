# Définition de l'utilisateur personnalisé pour Tastify
# On hérite d'AbstractUser pour garder toutes les fonctionnalités de base de Django (login, email, password)

from django.db import models
from django.contrib.auth.models import AbstractUser

class Utilisateur(AbstractUser):
    # On définit les rôles possibles dans le restaurant
    # TextChoices permet d'avoir une liste propre et facile à utiliser
    class Role(models.TextChoices):
        GERANT = 'GERANT', 'Gérant' # Le patron, accès à tout
        SERVEUR = 'SERVEUR', 'Serveur' # Prend les commandes en salle
        CUISINIER = 'CUISINIER', 'Cuisinier' # Voit les commandes en cuisine (KDS)
        CLIENT = 'CLIENT', 'Client' # Utilise l'application pour commander à table

    # On ajoute un champ "role" à notre utilisateur
    # Par défaut, tout nouvel inscrit est un Client
    role = models.CharField(
        max_length=20, 
        choices=Role.choices, 
        default=Role.CLIENT
    )
