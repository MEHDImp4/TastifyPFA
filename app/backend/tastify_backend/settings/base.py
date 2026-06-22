# Paramètres de base de Django pour le projet Tastify
# Ce fichier contient la configuration partagée entre le développement et la production

from pathlib import Path
from decouple import config

# BASE_DIR est le chemin vers le dossier racine du projet backend
# Cela permet d'utiliser des chemins relatifs pour les fichiers (images, dossiers, etc.)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Paramètres de sécurité récupérés depuis le fichier .env
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', cast=bool, default=False)
ALLOWED_HOSTS = config('DJANGO_ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# Liste des applications installées dans le projet
# On y trouve les applications natives de Django, les librairies externes et NOS applications
INSTALLED_APPS = [
    'daphne', # Gère les connexions en temps réel (WebSockets)
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Librairies tierces
    'rest_framework', # Framework pour créer des APIs (DRF)
    'drf_spectacular', # Pour la documentation Swagger
    'corsheaders', # Autorise le frontend à appeler le backend
    'rest_framework_simplejwt', # Authentification par Token JWT
    'rest_framework_simplejwt.token_blacklist',
    'channels', # Infrastructure WebSockets
    'django_celery_beat', # Tâches planifiées (ex: envoyer un rapport chaque matin)
    'django_celery_results',
    
    # Nos applications (le cœur du projet)
    'core', # Utilitaires partagés
    'apps.users', # Utilisateurs et rôles
    'apps.menu', # Carte du restaurant
    'apps.tables', # Plan de salle
    'apps.commandes', # Prise de commande et cuisine
    'apps.stock', # Gestion des stocks d'ingrédients
    'apps.hr', # Ressources Humaines (employés)
    'apps.reservations', # Réservations clients
    'apps.paiements.apps.PaiementsConfig', # Encaissement
    'apps.avis', # Commentaires clients
    'apps.analytics', # Statistiques et KPIs
    'apps.loyalty.apps.LoyaltyConfig', # Programme de fidélité
    'apps.configuration', # Réglages du restaurant
    'django_cleanup', # Supprime automatiquement les images orphelines
]

# Configuration de Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication', # Utilise JWT pour s'authentifier
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated', # Par défaut, il faut être connecté pour accéder aux APIs
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# Paramètres pour la documentation de l'API
SPECTACULAR_SETTINGS = {
    'TITLE': 'Tastify API',
    'DESCRIPTION': "Documentation OpenAPI de l'API Tastify.",
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': r'/api',
}

# Configuration des Tokens de sécurité (JWT)
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15), # Le token expire après 15 min pour plus de sécurité
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1), # Le refresh token permet d'en obtenir un nouveau pendant 24h
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'AUTH_COOKIE': 'refresh_token',
}

REFRESH_COOKIE_SECURE = config('DJANGO_REFRESH_COOKIE_SECURE', cast=bool, default=not DEBUG)
REFRESH_COOKIE_SAMESITE = config('DJANGO_REFRESH_COOKIE_SAMESITE', default='Lax')

# Headers autorisés pour les requêtes CORS
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-tastify-portal',
]

# Middlewares : des petits programmes qui s'exécutent à chaque requête/réponse
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # Gère la sécurité des domaines frontend/backend
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Aide à servir les fichiers statiques efficacement
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware', # Protection contre les attaques CSRF
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'tastify_backend.urls'

# Configuration des templates (utilisés principalement pour l'admin Django)
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'tastify_backend.wsgi.application'
ASGI_APPLICATION = 'tastify_backend.asgi.application' # Requis pour WebSockets (Channels)

# Configuration de la base de données (MySQL)
DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.mysql'),
        'NAME': config('DB_NAME', default=config('MYSQL_DATABASE', default='tastify_db')),
        'USER': config('DB_USER', default=config('MYSQL_USER', default='tastify_user')),
        'PASSWORD': config('DB_PASSWORD', default=config('MYSQL_PASSWORD', default='tastify_password')),
        'HOST': config('DB_HOST', default=config('MYSQL_HOST', default='db')),
        'PORT': config('DB_PORT', default=config('MYSQL_PORT', default='3306')),
        'CONN_MAX_AGE': config('CONN_MAX_AGE', cast=int, default=60),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}

# Configuration de Redis (pour les messages en temps réel et les tâches de fond)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(config('REDIS_HOST', default='redis'), config('REDIS_PORT', cast=int, default=6379))],
        },
    },
}

# Validateurs de mots de passe pour forcer les utilisateurs à avoir des mots de passe robustes
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Paramètres de langue et fuseau horaire
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Casablanca'
USE_I18N = True
USE_TZ = True

# Chemins pour les fichiers statiques (CSS, JS) et média (Images des plats)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
SERVE_MEDIA_FILES = config('DJANGO_SERVE_MEDIA_FILES', cast=bool, default=DEBUG)

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# On définit notre modèle d'utilisateur personnalisé
AUTH_USER_MODEL = 'users.Utilisateur'
PASSWORD_RESET_TIMEOUT = config('PASSWORD_RESET_TIMEOUT', cast=int, default=3600)

FRONTEND_BASE_URL = config('FRONTEND_BASE_URL', default='http://localhost:3003')

# Configuration de Celery (Gestion des tâches asynchrones en arrière-plan)
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://redis:6379/1')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='django-db')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_CACHE_BACKEND = config('CELERY_CACHE_BACKEND', default='django-cache')
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TIME_LIMIT = 60
CELERY_TASK_SOFT_TIME_LIMIT = 30
CELERY_BROKER_TRANSPORT_OPTIONS = {'visibility_timeout': 43200}
