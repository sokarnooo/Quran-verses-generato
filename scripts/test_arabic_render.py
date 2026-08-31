import os
import sys
from PIL import Image, ImageDraw, ImageFont

def test_render():
    font_path = os.path.abspath("fonts/AmiriQuran.ttf")
    if not os.path.exists(font_path):
        font_path = os.path.abspath("fonts/Amiri-Regular.ttf")
    
    if not os.path.exists(font_path):
        raise FileNotFoundError(f"Font file missing at {font_path}")
    
    print(f"Using font: {font_path}")
    
    # Test verse: Bismillah with full Uthmani tashkeel
    raw_text = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"
    
    # Create 1080x1920 black image
    img = Image.new("RGB", (1080, 1920), color=(0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    font_size = 72
    font = ImageFont.truetype(font_path, font_size)
    
    # Calculate bounding box using native Raqm RTL layout
    bbox = draw.textbbox((0, 0), raw_text, font=font, direction='rtl')
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (1080 - text_width) // 2 - bbox[0]
    y = (1920 - text_height) // 2 - bbox[1]
    
    draw.text((x, y), raw_text, font=font, fill=(255, 255, 255), direction='rtl')
    
    output_path = "test_render.png"
    img.save(output_path)
    print(f"Successfully generated {output_path} with size {img.size}")
    print(f"Text width: {text_width}, height: {text_height}, rendered at ({x}, {y})")

if __name__ == "__main__":
    test_render()
