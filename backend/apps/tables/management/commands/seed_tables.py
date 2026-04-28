from django.core.management.base import BaseCommand
from apps.tables.models import Table

SEED_DATA = [
    # (numero, capacite)
    (1, 2), (2, 2), (3, 2), (4, 2),
    (5, 4), (6, 4), (7, 4), (8, 4),
    (9, 6), (10, 6), (11, 6), (12, 6),
]


class Command(BaseCommand):
    help = 'Seed 12 restaurant tables for development.'

    def handle(self, *args, **options):
        created_count = 0
        for numero, capacite in SEED_DATA:
            _, created = Table.objects.get_or_create(
                numero=numero,
                defaults={
                    'capacite': capacite,
                    'statut': Table.Statut.LIBRE,
                    'est_active': True,
                    'pos_x': 0.0,
                    'pos_y': 0.0,
                },
            )
            if created:
                created_count += 1

        already = len(SEED_DATA) - created_count
        self.stdout.write(
            self.style.SUCCESS(
                f'Seeded {len(SEED_DATA)} tables '
                f'({created_count} created, {already} already existed).'
            )
        )
