from io import BytesIO

from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import Image


def convert_upload_to_webp(uploaded_file, quality=80, max_dim=1920):
    if not uploaded_file:
        return None

    img = Image.open(uploaded_file)

    if img.format == "WEBP" and max(img.size) <= max_dim:
        return uploaded_file

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

    webp_bytes = BytesIO()
    img.save(webp_bytes, format="WEBP", quality=quality)
    webp_bytes.seek(0)

    original_name = getattr(uploaded_file, "name", "image.png")
    base_name = original_name.rsplit(".", 1)[0]
    new_name = f"{base_name}.webp"

    return InMemoryUploadedFile(
        file=webp_bytes,
        field_name=uploaded_file.field_name,
        name=new_name,
        content_type="image/webp",
        size=webp_bytes.getbuffer().nbytes,
        charset=None,
    )
