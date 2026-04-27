from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Seeds the database with test users for development'

    def handle(self, *args, **options):
        User = get_user_model()
        
        users_data = [
            {
                'username': 'gerant_test',
                'email': 'gerant@tastify.local',
                'role': User.Role.GERANT,
                'first_name': 'Test',
                'last_name': 'Gerant'
            },
            {
                'username': 'serveur_test',
                'email': 'serveur@tastify.local',
                'role': User.Role.SERVEUR,
                'first_name': 'Test',
                'last_name': 'Serveur'
            },
            {
                'username': 'cuisinier_test',
                'email': 'cuisinier@tastify.local',
                'role': User.Role.CUISINIER,
                'first_name': 'Test',
                'last_name': 'Cuisinier'
            },
            {
                'username': 'client_test',
                'email': 'client@tastify.local',
                'role': User.Role.CLIENT,
                'first_name': 'Test',
                'last_name': 'Client'
            }
        ]

        # Mot de passe générique pour l'environnement de développement
        dummy_password = 'password123'

        for user_data in users_data:
            username = user_data['username']
            if not User.objects.filter(username=username).exists():
                User.objects.create_user(
                    **user_data,
                    password=dummy_password
                )
                self.stdout.write(self.style.SUCCESS(f"Created user: {username} ({user_data['role']})"))
            else:
                self.stdout.write(f"User {username} already exists. Skipping.")

        self.stdout.write(self.style.SUCCESS('Successfully seeded developer environment'))
