from pathlib import Path
from tempfile import TemporaryDirectory

from django.test import SimpleTestCase, override_settings

from core.management.commands.ensure_menu_media import Command


class EnsureMenuMediaCommandTest(SimpleTestCase):
    def test_creates_file_for_media_url_path(self):
        with TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=Path(media_root), MEDIA_URL='/media/'):
                created = Command().ensure_media_files(['/media/plats/briouates_fromage.png'])

                self.assertEqual(created, 1)
                self.assertTrue((Path(media_root) / 'plats' / 'briouates_fromage.png').exists())

    def test_creates_file_for_absolute_media_url(self):
        with TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=Path(media_root), MEDIA_URL='/media/'):
                created = Command().ensure_media_files([
                    'https://tastify-client.mehdidiouri.dev/media/plats/salade_cesar.png'
                ])

                self.assertEqual(created, 1)
                self.assertTrue((Path(media_root) / 'plats' / 'salade_cesar.png').exists())

    def test_skips_unsafe_path(self):
        with TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=Path(media_root), MEDIA_URL='/media/'):
                created = Command().ensure_media_files(['/media/../secret.png'])

                self.assertEqual(created, 0)
                self.assertFalse((Path(media_root) / 'secret.png').exists())
