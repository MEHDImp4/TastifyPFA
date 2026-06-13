from io import BytesIO
import os

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from PIL import Image

from apps.menu.models import Categorie, Plat
from apps.configuration.models import RestaurantConfiguration


def convert_disk_image_to_webp(image_field, quality=80, max_dim=1920):
    img = Image.open(image_field.path)

    if img.format == "WEBP" and max(img.size) <= max_dim:
        return False

    if img.mode in ("RGBA", "LA", "P"):
        if img.mode == "P":
            img = img.convert("RGBA")
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "RGBA":
            background.paste(img, mask=img.split()[3])
        else:
            background.paste(img)
        img = background

    elif img.mode != "RGB":
        img = img.convert("RGB")

    width, height = img.size
    if width > max_dim or height > max_dim:
        ratio = min(max_dim / width, max_dim / height)
        img = img.resize((int(width * ratio), int(height * ratio)), Image.LANCZOS)

    original_path = image_field.path
    base_name = os.path.splitext(os.path.basename(original_path))[0]
    new_name = f"{base_name}.webp"

    webp_bytes = BytesIO()
    img.save(webp_bytes, format="WEBP", quality=quality)
    webp_bytes.seek(0)

    image_field.save(new_name, ContentFile(webp_bytes.read()), save=False)
    return True


class Command(BaseCommand):
    help = "Convertit toutes les images existantes en WebP"

    def handle(self, *args, **options):
        models_to_check = [
            (Categorie, "image", False),
            (Plat, "image", False),
            (RestaurantConfiguration, "logo", True),
        ]

        total_converted = 0

        for model, field_name, is_singleton in models_to_check:
            if is_singleton:
                instance = model.get_solo()
                queryset = [instance]
            else:
                queryset = model.objects.all()

            for obj in queryset:
                image_field = getattr(obj, field_name, None)
                if not image_field:
                    continue

                try:
                    changed = convert_disk_image_to_webp(image_field)
                    if changed:
                        obj.save()
                        total_converted += 1
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"✓ {model.__name__} id={obj.pk}: {image_field.name}"
                            )
                        )
                except Exception as e:
                    self.stderr.write(
                        self.style.WARNING(
                            f"✗ {model.__name__} id={obj.pk}: {e}"
                        )
                    )

        self.stdout.write(
            self.style.SUCCESS(f"\nTotal convertis: {total_converted}")
        )
