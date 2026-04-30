from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Seeds the database with test users for development, updating all fields if they exist.'

    def handle(self, *args, **options):
        User = get_user_model()
        
        users_data = [
            # Gérant
            {
                'username': 'gerant_test',
                'email': 'gerant@tastify.local',
                'role': User.Role.GERANT,
                'first_name': 'Mehdi',
                'last_name': 'Tastify',
                'is_staff': True,
                'is_superuser': True
            },
            
            # Serveurs
            {
                'username': 'serveur_test',
                'email': 'serveur@tastify.local',
                'role': User.Role.SERVEUR,
                'first_name': 'Omar',
                'last_name': 'Alami',
                'is_staff': True
            },
            {
                'username': 'serveur2_test',
                'email': 'serveur2@tastify.local',
                'role': User.Role.SERVEUR,
                'first_name': 'Sara',
                'last_name': 'Bennani',
                'is_staff': True
            },
            {
                'username': 'serveur3_test',
                'email': 'serveur3@tastify.local',
                'role': User.Role.SERVEUR,
                'first_name': 'Youssef',
                'last_name': 'Idrissi',
                'is_staff': True
            },
            
            # Cuisiniers
            {
                'username': 'cuisinier_test',
                'email': 'cuisinier@tastify.local',
                'role': User.Role.CUISINIER,
                'first_name': 'Fatine',
                'last_name': 'Zahra',
                'is_staff': True
            },
            {
                'username': 'cuisinier2_test',
                'email': 'cuisinier2@tastify.local',
                'role': User.Role.CUISINIER,
                'first_name': 'Driss',
                'last_name': 'Mansouri',
                'is_staff': True
            },
            {
                'username': 'cuisinier3_test',
                'email': 'cuisinier3@tastify.local',
                'role': User.Role.CUISINIER,
                'first_name': 'Amina',
                'last_name': 'Tazi',
                'is_staff': True
            },
            
            # Clients
            {
                'username': 'client_test',
                'email': 'client@tastify.local',
                'role': User.Role.CLIENT,
                'first_name': 'Karim',
                'last_name': 'Sadiki',
                'is_staff': False
            },
            {
                'username': 'client2_test',
                'email': 'client2@tastify.local',
                'role': User.Role.CLIENT,
                'first_name': 'Salma',
                'last_name': 'Rami',
                'is_staff': False
            },
            {
                'username': 'client3_test',
                'email': 'client3@tastify.local',
                'role': User.Role.CLIENT,
                'first_name': 'Amine',
                'last_name': 'Chraibi',
                'is_staff': False
            },
        ]

        # Mot de passe générique pour l'environnement de développement
        dummy_password = 'password123'

        for data in users_data:
            username = data.pop('username')
            user, created = User.objects.update_or_create(
                username=username,
                defaults=data
            )
            
            # Always reset password to the generic one in dev
            user.set_password(dummy_password)
            user.save()

            if created:
                self.stdout.write(self.style.SUCCESS(f"Created user: {username} ({user.get_full_name()})"))
            else:
                self.stdout.write(f"Updated user: {username} ({user.get_full_name()})")

        self.stdout.write(self.style.SUCCESS('Successfully seeded developer environment'))
