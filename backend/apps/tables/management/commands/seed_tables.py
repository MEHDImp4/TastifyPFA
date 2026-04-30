from django.core.management.base import BaseCommand
from apps.tables.models import Table

SEED_DATA = [
    # (numero, capacite)
    (1, 2), (2, 2), (3, 2), (4, 2), (5, 2),
    (6, 4), (7, 4), (8, 4), (9, 4), (10, 4),
    (11, 6), (12, 6), (13, 6), (14, 6), (15, 6),
    (16, 8), (17, 8), (18, 4), (19, 2), (20, 2),
]


class Command(BaseCommand):
    help = 'Seed 20 restaurant tables for development.'

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0
        
        for numero, capacite in SEED_DATA:
            _, created = Table.objects.update_or_create(
                numero=numero,
                defaults={
                    'capacite': capacite,
                    'statut': Table.Statut.LIBRE,
                    'est_active': True,
                    # We don't overwrite pos_x/y if they exist to avoid losing layout work
                },
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Table seeding complete: {created_count} created, {updated_count} updated.'
            )
        )
