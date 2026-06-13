import io

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase
from PIL import Image as PILImage

from apps.configuration.models import RestaurantConfiguration
from apps.menu.models import Categorie, Plat


def make_png(name, color="red", size=(10, 10)):
    img = PILImage.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type="image/png")


def make_webp(name, color="green", size=(10, 10)):
    img = PILImage.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="WEBP")
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type="image/webp")


class ConvertImagesToWebpCommandTests(TestCase):
    def setUp(self):
        self.categorie = Categorie.objects.create(nom="Test Cat")
        self.categorie.image = make_png("cat.png")
        self.categorie.save()

        self.plat = Plat.objects.create(
            nom="Test Plat", prix="10.00", categorie=self.categorie, temps_preparation=10
        )
        self.plat.image = make_png("plat.png")
        self.plat.save()

    def test_command_converts_png_to_webp(self):
        self.assertTrue(self.categorie.image.name.endswith(".png"))
        self.assertTrue(self.plat.image.name.endswith(".png"))

        call_command("convert_images_to_webp")

        self.categorie.refresh_from_db()
        self.plat.refresh_from_db()

        self.assertTrue(self.categorie.image.name.endswith(".webp"))
        self.assertTrue(self.plat.image.name.endswith(".webp"))

    def test_command_skips_already_webp(self):
        self.categorie.image = make_webp("cat.webp")
        self.categorie.save()

        self.assertTrue(self.categorie.image.name.endswith(".webp"))

        call_command("convert_images_to_webp")

        self.categorie.refresh_from_db()
        self.plat.refresh_from_db()
        self.assertTrue(self.categorie.image.name.endswith(".webp"))
        self.assertTrue(self.plat.image.name.endswith(".webp"))

    def test_command_handles_restaurant_configuration(self):
        config = RestaurantConfiguration.get_solo()
        config.logo = make_png("logo.png")
        config.save()

        self.assertTrue(config.logo.name.endswith(".png"))

        call_command("convert_images_to_webp")

        config.refresh_from_db()
        self.assertTrue(config.logo.name.endswith(".webp"))
