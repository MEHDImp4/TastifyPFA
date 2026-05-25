# Paramètres spécifiques au mode DÉVELOPPEMENT
from .base import *  # On importe toute la configuration de base

# En développement, on active le mode DEBUG pour voir les erreurs détaillées
DEBUG = True

# On autorise toutes les adresses à se connecter au serveur de dev
ALLOWED_HOSTS = ['*']

# Configuration CORS : On autorise explicitement nos serveurs frontend (Vite)
# à communiquer avec ce backend pendant qu'on développe.
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000", # Port par défaut du backoffice
    "http://127.0.0.1:3000",
    "http://localhost:3003", # Port par défaut du client-app
    "http://127.0.0.1:3003",
]
CORS_ALLOW_CREDENTIALS = True # Permet d'envoyer les cookies/tokens JWT
