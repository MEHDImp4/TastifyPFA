from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Flush all data and re-seed with fresh test data (base + transactions).'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('⚠  Flushing all database tables...'))
        call_command('flush', '--no-input')
        self.stdout.write(self.style.SUCCESS('✓ Database flushed.\n'))

        self.stdout.write('Seeding base data (users, tables, menu, HR, stock)...')
        call_command('seed_all')

        self.stdout.write('\nSeeding transactional data (orders, payments, reviews, loyalty, shifts)...')
        call_command('seed_transactions')

        self.stdout.write(self.style.SUCCESS(
            '\n🎉  Database reset complete! All test data is ready.'
        ))
