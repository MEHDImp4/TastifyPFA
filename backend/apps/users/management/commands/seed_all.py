from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Seed the database with users, tables and menu (runs seed_dev, seed_tables and seed_menu)'

    def handle(self, *args, **options):
        commands = [
            ('seed_dev', 'Users'),
            ('seed_tables', 'Tables'),
            ('seed_menu', 'Menu'),
        ]

        for cmd, label in commands:
            self.stdout.write(f'Running {cmd} ({label})...')
            try:
                call_command(cmd)
            except Exception as e:
                raise CommandError(f'Error while running {cmd}: {e}')

        self.stdout.write(self.style.SUCCESS('All seeding tasks completed.'))
