from django.test import TestCase
from django.core.management import call_command
from django.contrib.auth import get_user_model
from io import StringIO

class SeedTests(TestCase):
    def test_seed_all_command_creates_users(self):
        """Test that seed_all creates the current seeded user roster."""
        User = get_user_model()
        
        # Verify database is empty initially
        self.assertEqual(User.objects.count(), 0)
        
        # Run command
        out = StringIO()
        call_command('seed_all', stdout=out)
        
        # Verify the current seeded roster is created.
        self.assertEqual(User.objects.count(), 15)
        
        # Verify each role exists
        roles = User.objects.values_list('role', flat=True)
        self.assertIn(User.Role.GERANT, roles)
        self.assertIn(User.Role.SERVEUR, roles)
        self.assertIn(User.Role.CUISINIER, roles)
        self.assertIn(User.Role.CLIENT, roles)
        
        # Verify output contains completion message
        self.assertIn('All seeding tasks completed.', out.getvalue())

    def test_seed_all_command_idempotent(self):
        """Test that running seed_all twice stays idempotent for user records."""
        User = get_user_model()
        
        # Run command twice
        out = StringIO()
        call_command('seed_all', stdout=out)
        call_command('seed_all', stdout=out)

        # Verify still only the seeded user roster exists
        self.assertEqual(User.objects.count(), 15)
