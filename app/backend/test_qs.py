import os
import django
import sys

# Set up django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tastify_backend.settings')
django.setup()

from apps.menu.models import Plat
from django.db.models import Count

try:
    popular_plats = Plat.objects.active().filter(
        est_disponible=True
    ).annotate(
        lignes_count=Count('lignes_commande')
    ).order_by('-lignes_count', 'nom')[:5]
    print("Query successful. Count:", popular_plats.count())
except Exception as e:
    print("Error:", e)
