import os
import sys
import json
import time
import subprocess
import urllib.request
import urllib.error
from PIL import Image, ImageDraw, ImageFont

try:
    import requests
except ImportError:
    requests = None

def http_get_json(url: str, timeout: int = 15):
    if requests is not None:
        try:
            return requests.get(url, timeout=timeout).json()
        except Exception:
            pass
    req = urllib.request.Request(url, headers={"User-Agent": "QuranPipeline/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode('utf-8'))

def http_download(url: str, dest_path: str, timeout: int = 20):
    if requests is not None:
        try:
            r = requests.get(url, timeout=timeout)
            if r.status_code == 200:
                with open(dest_path, "wb") as f:
                    f.write(r.content)
                return
        except Exception:
            pass
    req = urllib.request.Request(url, headers={"User-Agent": "QuranPipeline/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        with open(dest_path, "wb") as f:
            f.write(resp.read())

FONT_PATH = os.path.abspath("fonts/AmiriQuran.ttf")
if not os.path.exists(FONT_PATH):
    FONT_PATH = os.path.abspath("fonts/Amiri-Regular.ttf")

if not os.path.exists(FONT_PATH):
    raise FileNotFoundError(f"Missing required Arabic font at {FONT_PATH}")

def render_verse_image(verse_text: str, surah_name: str, verse_number: int, total_verses: int, output_path: str, width=1080, height=1920):
    """
    Renders Arabic Quran verse text centered on a 1080x1920 black canvas.
    Uses native OpenType HarfBuzz/Raqm shaping in Pillow for full ligature and tashkeel support.
    """
    img = Image.new("RGB", (width, height), color=(0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Choose font size depending on verse length
    words = verse_text.strip().split()
    word_count = len(words)
    
    if word_count <= 8:
        base_font_size = 64
        line_spacing = 40
    elif word_count <= 20:
        base_font_size = 54
        line_spacing = 34
    elif word_count <= 45:
        base_font_size = 46
        line_spacing = 30
    elif word_count <= 80:
        base_font_size = 38
        line_spacing = 26
    else:
        base_font_size = 32
        line_spacing = 22
        
    font = ImageFont.truetype(FONT_PATH, base_font_size)
    max_line_width = int(width * 0.82) # 82% of screen width to leave balanced margins
    
    # Word wrapping for Arabic text using native RTL measurement
    lines = []
    current_words = []
    
    for word in words:
        test_words = current_words + [word]
        test_line = " ".join(test_words)
        bbox = draw.textbbox((0, 0), test_line, font=font, direction='rtl')
        line_w = bbox[2] - bbox[0]
        
        if line_w > max_line_width and current_words:
            # Wrap current line
            final_line = " ".join(current_words)
            lines.append(final_line)
            current_words = [word]
        else:
            current_words = test_words
            
    if current_words:
        lines.append(" ".join(current_words))
        
    # Process all line dimensions
    line_metrics = []
    total_text_height = 0
    
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font, direction='rtl')
        h = bbox[3] - bbox[1]
        w = bbox[2] - bbox[0]
        line_metrics.append((line, w, h, bbox[0], bbox[1]))
        total_text_height += h
        
    total_text_height += (len(lines) - 1) * line_spacing
    
    # Compute start Y to center block vertically
    start_y = (height - total_text_height) // 2
    
    # Draw Surah metadata badge at the top
    if surah_name:
        meta_font = ImageFont.truetype(FONT_PATH, 28)
        meta_text_raw = f"{surah_name}  •  {verse_number}/{total_verses}"
        meta_bbox = draw.textbbox((0, 0), meta_text_raw, font=meta_font, direction='rtl')
        meta_w = meta_bbox[2] - meta_bbox[0]
        meta_x = (width - meta_w) // 2 - meta_bbox[0]
        meta_y = 180 - meta_bbox[1]
        draw.text((meta_x, meta_y), meta_text_raw, font=meta_font, fill=(160, 160, 160), direction='rtl')
    
    current_y = start_y
    for line, lw, lh, left_off, top_off in line_metrics:
        line_x = (width - lw) // 2 - left_off
        line_y = current_y - top_off
        draw.text((line_x, line_y), line, font=font, fill=(255, 255, 255), direction='rtl')
        current_y += lh + line_spacing
        
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "PNG")
    return output_path

def test_full_pipeline():
    print("Testing full Quran video generation pipeline for Surah 112 (Al-Ikhlas)...")
    work_dir = "temp_test_pipeline"
    os.makedirs(work_dir, exist_ok=True)
    
    # Fetch Surah 112 verses
    verses_data = http_get_json("https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=112", timeout=10)
    verses = verses_data["verses"]
    
    # Fetch Surah 112 audio (reciter 7: Mishary Alafasy)
    audio_data = http_get_json("https://api.quran.com/api/v4/recitations/7/by_chapter/112", timeout=10)
    audio_files = audio_data["audio_files"]
    
    audio_map = {a["verse_key"]: a["url"] for a in audio_files}
    
    segment_paths = []
    
    for i, v in enumerate(verses):
        v_key = v["verse_key"]
        v_num = int(v_key.split(":")[1])
        text = v["text_uthmani"]
        audio_rel_url = audio_map[v_key]
        audio_url = audio_rel_url if audio_rel_url.startswith("http") else f"https://verses.quran.com/{audio_rel_url}"
        
        # Download audio
        audio_path = os.path.join(work_dir, f"audio_{v_num}.mp3")
        http_download(audio_url, audio_path, timeout=10)
            
        # Get duration
        cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", audio_path]
        res = subprocess.run(cmd, capture_output=True, text=True)
        dur = float(json.loads(res.stdout)["format"]["duration"])
        print(f"Verse {v_key}: audio duration = {dur:.3f}s")
        
        # Render image
        img_path = os.path.join(work_dir, f"image_{v_num}.png")
        render_verse_image(text, "سُورَةُ الإِخْلَاصِ", v_num, len(verses), img_path)
        
        # Create segment mp4
        seg_path = os.path.join(work_dir, f"segment_{v_num}.mp4")
        seg_cmd = [
            "ffmpeg", "-y",
            "-loop", "1",
            "-framerate", "25",
            "-i", img_path,
            "-i", audio_path,
            "-c:v", "libx264",
            "-tune", "stillimage",
            "-c:a", "aac",
            "-b:a", "192k",
            "-ar", "44100",
            "-ac", "2",
            "-pix_fmt", "yuv420p",
            "-t", str(dur),
            "-shortest",
            seg_path
        ]
        subprocess.run(seg_cmd, capture_output=True, check=True)
        segment_paths.append(seg_path)
        print(f"Created segment for {v_key}")
        
    # Concatenate all segments
    concat_list_path = os.path.join(work_dir, "concat_list.txt")
    with open(concat_list_path, "w") as f:
        for p in segment_paths:
            f.write(f"file '{os.path.abspath(p)}'\n")
            
    final_output = "public/test_output.mp4"
    os.makedirs("public", exist_ok=True)
    
    concat_cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_path,
        "-c:v", "libx264",
        "-c:a", "aac",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        final_output
    ]
    subprocess.run(concat_cmd, capture_output=True, check=True)
    
    final_size = os.path.getsize(final_output)
    print(f"Pipeline complete! Output video: {final_output} ({final_size} bytes)")

if __name__ == "__main__":
    test_full_pipeline()
