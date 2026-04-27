from django.test import TestCase
from django.core.management import call_command
from django.contrib.auth import get_user_model
from io import StringIO

class SeedTests(TestCase):
    def test_seed_dev_command_creates_users(self):
        """Test that seed_dev creates 4 distinct users with correct roles"""
        User = get_user_model()
        
        # Verify database is empty initially
        self.assertEqual(User.objects.count(), 0)
        
        # Run command
        out = StringIO()
        call_command('seed_dev', stdout=out)
        
        # Verify 4 users created
        self.assertEqual(User.objects.count(), 4)
        
        # Verify each role exists
        roles = User.objects.values_list('role', flat=True)
        self.assertIn(User.Role.GERANT, roles)
        self.assertIn(User.Role.SERVEUR, roles)
        self.assertIn(User.Role.CUISINIER, roles)
        self.assertIn(User.Role.CLIENT, roles)
        
        # Verify output contains success message
        self.assertIn('Successfully seeded developer environment', out.getvalue())

    def test_seed_dev_command_idempotent(self):
        """Test that running seed_dev twice doesn't crash or duplicate incorrectly"""
        User = get_user_model()
        
        # Run command twice
        out = StringIO()
        call_command('seed_dev', stdout=out)
        call_command('seed_dev', stdout=out)
        
        # Verify still only 4 users
        self.assertEqual(User.objects.count(), 4)
