from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from PIL import Image, ImageDraw

from apps.menu.models import Categorie, Plat


class Command(BaseCommand):
    help = 'Create placeholder files for missing menu media without modifying database rows.'

    def handle(self, *args, **options):
        image_paths = self.get_menu_image_paths()
        created = self.ensure_media_files(image_paths)

        if created:
            self.stdout.write(self.style.SUCCESS(f'Created {created} missing menu media file(s).'))
        else:
            self.stdout.write(self.style.SUCCESS('Menu media files already exist.'))

    def get_menu_image_paths(self):
        paths = []

        for image_name in Categorie.objects.exclude(image='').values_list('image', flat=True):
            if image_name:
                paths.append(image_name)

        for image_name in Plat.objects.exclude(image='').values_list('image', flat=True):
            if image_name:
                paths.append(image_name)

        return list(dict.fromkeys(paths))

    def normalize_media_path(self, image_path):
        value = str(image_path or '').strip()
        if not value:
            return None

        if value.startswith(('http://', 'https://')):
            marker = '/media/'
            if marker not in value:
                return None
            value = value.split(marker, 1)[1]

        value = value.replace('\\', '/').lstrip('/')
        media_prefix = settings.MEDIA_URL.strip('/')
        if media_prefix and value.startswith(f'{media_prefix}/'):
            value = value[len(media_prefix) + 1:]

        relative_path = Path(value)
        if not value or relative_path.is_absolute() or '..' in relative_path.parts:
            return None

        return relative_path

    def ensure_media_files(self, image_paths):
        created = 0
        colors = [
            ((121, 84, 45), (242, 228, 208)),
            ((28, 83, 75), (218, 240, 232)),
            ((126, 54, 45), (246, 221, 214)),
            ((64, 75, 112), (224, 229, 246)),
        ]

        for index, image_path in enumerate(image_paths):
            relative_path = self.normalize_media_path(image_path)
            if relative_path is None:
                self.stdout.write(self.style.WARNING(f'Skipping unsafe media path: {image_path}'))
                continue

            target = settings.MEDIA_ROOT / relative_path
            if target.exists():
                continue

            target.parent.mkdir(parents=True, exist_ok=True)
            primary, secondary = colors[index % len(colors)]
            image = Image.new('RGB', (900, 600), primary)
            draw = ImageDraw.Draw(image)
            draw.rectangle((0, 400, 900, 600), fill=secondary)
            draw.ellipse((620, 70, 820, 270), fill=secondary)
            draw.rectangle((90, 110, 550, 150), fill=secondary)
            draw.rectangle((90, 180, 430, 215), fill=secondary)
            image.save(target, format='PNG')
            created += 1

        return created
