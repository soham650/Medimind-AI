import os
import base64
from typing import Tuple, Dict, Any
from PIL import Image

class ImageProcessor:
    """
    Validates image medical reports and optimizes them for visual analysis.
    """
    @staticmethod
    def process_image(image_path: str) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validates and processes image.
        Returns:
            is_valid: bool
            base64_data: str (RFC 4648 base64 encoded image)
            metadata: Dict with width, height, format, mode
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError("Image file does not exist.")

        try:
            with Image.open(image_path) as img:
                # Verify that it's a real, readable image
                img.verify()

            # Re-open for metadata (verify closes the image)
            with Image.open(image_path) as img:
                format_name = img.format or "JPEG"
                width, height = img.size
                mode = img.mode

            with open(image_path, "rb") as f:
                b64_str = base64.b64encode(f.read()).decode("utf-8")

            metadata = {
                "format": format_name,
                "width": width,
                "height": height,
                "mode": mode,
                "mime_type": f"image/{format_name.lower()}"
            }
            return True, b64_str, metadata
        except Exception as e:
            return False, "", {"error": str(e)}
