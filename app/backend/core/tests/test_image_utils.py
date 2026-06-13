import io

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from PIL import Image as PILImage

from core.image_utils import convert_upload_to_webp


def make_png(name="test.png", color="red", size=(10, 10)):
    img = PILImage.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type="image/png")


def make_large_png(name="large.png", color="blue", size=(3000, 2000)):
    img = PILImage.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type="image/png")


def make_webp(name="test.webp", color="green", size=(10, 10)):
    img = PILImage.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="WEBP")
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type="image/webp")


def make_rgba_png(name="alpha.png", size=(10, 10)):
    img = PILImage.new("RGBA", size, color=(255, 0, 0, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type="image/png")


class ConvertUploadToWebpTests(TestCase):
    def test_converts_png_to_webp(self):
        result = convert_upload_to_webp(make_png())
        self.assertEqual(result.content_type, "image/webp")
        self.assertTrue(result.name.endswith(".webp"))
        reopened = PILImage.open(result.file)
        self.assertEqual(reopened.format, "WEBP")

    def test_resizes_large_image(self):
        result = convert_upload_to_webp(make_large_png(), max_dim=1920)
        reopened = PILImage.open(result.file)
        width, height = reopened.size
        self.assertLessEqual(width, 1920)
        self.assertLessEqual(height, 1920)

    def test_preserves_already_webp_within_limits(self):
        original = make_webp()
        result = convert_upload_to_webp(original)
        self.assertIs(result, original)

    def test_strips_alpha_channel(self):
        result = convert_upload_to_webp(make_rgba_png())
        reopened = PILImage.open(result.file)
        self.assertEqual(reopened.mode, "RGB")
        self.assertEqual(reopened.format, "WEBP")

    def test_returns_none_for_none_input(self):
        self.assertIsNone(convert_upload_to_webp(None))

    def test_keeps_base_name(self):
        result = convert_upload_to_webp(make_png("tajine.png"))
        self.assertEqual(result.name, "tajine.webp")

    def test_preserves_field_name(self):
        original = make_png()
        original.field_name = "image"
        result = convert_upload_to_webp(original)
        self.assertEqual(result.field_name, "image")
