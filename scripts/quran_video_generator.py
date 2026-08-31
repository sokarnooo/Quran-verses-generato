#!/usr/bin/env python3
"""
Quran Verse Video Generator
Generates a synchronized 1080x1920 (9:16) MP4 video of Arabic Quran verses
with reciter audio, smooth verse fade transitions (300-400ms),
and optional looping dimmed nature video backgrounds (or solid black).
"""

import os
import sys
import json
import time
import shutil
import argparse
import subprocess
import re
import html
import urllib.request
import urllib.error
from PIL import Image, ImageDraw, ImageFont

try:
    import requests
except ImportError:
    requests = None

class SimpleHttpResponse:
    def __init__(self, status_code: int, content: bytes):
        self.status_code = status_code
        self.content = content
        self.text = content.decode('utf-8', errors='ignore') if isinstance(content, bytes) else str(content)

    def json(self):
        return json.loads(self.text)

def http_get(url: str, timeout: int = 20) -> SimpleHttpResponse:
    """Robust HTTP GET supporting both requests and Python's standard urllib."""
    if requests is not None:
        try:
            r = requests.get(url, timeout=timeout, headers={"User-Agent": "QuranVideoGenerator/1.0"})
            return SimpleHttpResponse(r.status_code, r.content)
        except Exception:
            pass
    # Fallback to standard library urllib.request
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) QuranVideoGenerator/1.0"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            content = response.read()
            return SimpleHttpResponse(getattr(response, "status", 200), content)
    except urllib.error.HTTPError as e:
        content = e.read()
        return SimpleHttpResponse(e.code, content)
    except Exception as e:
        raise RuntimeError(f"Network error requesting {url}: {e}")

# Explicitly verified Arabic Quranic font paths
FONT_PRIMARY = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "fonts", "AmiriQuran.ttf"))
FONT_FALLBACK = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "fonts", "Amiri-Regular.ttf"))
BACKGROUNDS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "backgrounds"))

def get_font_path():
    if os.path.exists(FONT_PRIMARY):
        return FONT_PRIMARY
    if os.path.exists(FONT_FALLBACK):
        return FONT_FALLBACK
    raise FileNotFoundError(
        f"Critical error: Arabic font file missing! Looked for '{FONT_PRIMARY}' and '{FONT_FALLBACK}'. "
        "Arabic text rendering requires a true Arabic font file."
    )

def get_latin_font_path():
    candidates = [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
        "/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "fonts", "Amiri-Regular.ttf")),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return get_font_path()

def clean_translation_text(raw_text: str) -> str:
    if not raw_text:
        return ""
    # Strip footnote tags like <sup foot_note=123>1</sup> or <sup>...</sup>
    text = re.sub(r'<sup[^>]*>.*?</sup>', '', raw_text)
    # Strip any remaining HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Unescape HTML entities
    text = html.unescape(text)
    # Normalize whitespaces
    return " ".join(text.split()).strip()

def emit_progress(job_id, stage, progress, message, extra=None):
    payload = {
        "job_id": job_id,
        "stage": stage,
        "progress": progress,
        "message": message
    }
    if extra:
        payload.update(extra)
    print(json.dumps(payload), flush=True)

def fetch_surah_verses(chapter_num: int, start_verse: int, end_verse: int):
    """
    Fetches Uthmani text and Saheeh International English translation for given surah and verse range from Quran API.
    """
    url = f"https://api.quran.com/api/v4/verses/by_chapter/{chapter_num}?translations=20&fields=text_uthmani&per_page=300"
    resp = http_get(url, timeout=15)
    
    all_verses = []
    if resp.status_code == 200:
        data = resp.json()
        all_verses = data.get("verses", [])
    else:
        # Fallback to separate endpoints
        url_uth = f"https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number={chapter_num}"
        r_uth = http_get(url_uth, timeout=15)
        if r_uth.status_code != 200:
            raise RuntimeError(f"Failed to fetch Quran verses from API (Status {r_uth.status_code}): {r_uth.text}")
        data_uth = r_uth.json()
        all_verses = data_uth.get("verses", [])
        
        # Also try fetching translation
        trans_map = {}
        try:
            r_tr = http_get(f"https://api.quran.com/api/v4/quran/translations/20?chapter_number={chapter_num}", timeout=15)
            if r_tr.status_code == 200:
                for t in r_tr.json().get("translations", []):
                    trans_map[t.get("verse_key")] = clean_translation_text(t.get("text", ""))
        except Exception:
            pass
            
        selected = []
        for v in all_verses:
            v_key = v.get("verse_key", "")
            try:
                v_num = int(v_key.split(":")[1])
                if start_verse <= v_num <= end_verse:
                    selected.append({
                        "verse_key": v_key,
                        "verse_number": v_num,
                        "text_uthmani": v.get("text_uthmani", "").strip(),
                        "translation": trans_map.get(v_key, "")
                    })
            except Exception:
                continue
        if not selected:
            raise ValueError(f"No verses found for Surah {chapter_num} in range {start_verse}–{end_verse}")
        return sorted(selected, key=lambda x: x["verse_number"])
    
    selected_verses = []
    for v in all_verses:
        v_key = v.get("verse_key", "")
        try:
            v_num = int(v_key.split(":")[1]) if ":" in v_key else v.get("verse_number", 1)
            if start_verse <= v_num <= end_verse:
                raw_trans = ""
                trans_list = v.get("translations", [])
                if trans_list and len(trans_list) > 0:
                    raw_trans = trans_list[0].get("text", "")
                    
                selected_verses.append({
                    "verse_key": v_key,
                    "verse_number": v_num,
                    "text_uthmani": v.get("text_uthmani", "").strip(),
                    "translation": clean_translation_text(raw_trans)
                })
        except Exception:
            continue
            
    if not selected_verses:
        raise ValueError(f"No verses found for Surah {chapter_num} in range {start_verse}–{end_verse}")
        
    return sorted(selected_verses, key=lambda x: x["verse_number"])

RECITER_SUBFOLDERS = {
    "7": "Alafasy_128kbps",
    "2": "Abdul_Basit_Murattal_192kbps",
    "1": "Abdul_Basit_Mujawwad_128kbps",
    "6": "Husary_128kbps",
    "husary_mujawwad": "Husary_128kbps_Mujawwad",
    "12": "Husary_Muallim_128kbps",
    "9": "Minshawy_Murattal_128kbps",
    "8": "Minshawy_Mujawwad_192kbps",
    "3": "Abdurrahmaan_As-Sudais_192kbps",
    "10": "Saood_ash-Shuraym_128kbps",
    "4": "Abu_Bakr_Ash-Shaatree_128kbps",
    "5": "Hani_Rifai_192kbps",
    "11": "Mohammad_al_Tablaway_128kbps",
    "maher_almuaiqly": "MaherAlMuaiqly128kbps",
    "saad_alghamdi": "Ghamadi_40kbps",
    "ali_alhudhaify": "Hudhaify_128kbps",
    "yasser_aldosari": "Yasser_Ad-Dussary_128kbps",
    "nasser_alqatami": "Nasser_Alqatami_128kbps",
    "muhammad_ayyub": "Muhammad_Ayyoub_128kbps",
    "ahmed_alajmy": "ahmed_ibn_ali_al_ajamy_128kbps",
    "abdullah_basfar": "Abdullah_Basfar_192kbps",
}

def fetch_reciter_audio_map(reciter_id: str, chapter_num: int):
    """
    Fetches per-verse audio file URLs for a given reciter and chapter from Quran API or verified EveryAyah audio paths.
    """
    str_id = str(reciter_id).strip()
    audio_map = {}
    
    # 1. Try Quran.com API if reciter_id is numeric
    if str_id.isdigit():
        try:
            url = f"https://api.quran.com/api/v4/recitations/{str_id}/by_chapter/{chapter_num}?per_page=300"
            resp = http_get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                for a in data.get("audio_files", []):
                    v_key = a.get("verse_key")
                    audio_url = a.get("url", "")
                    if audio_url:
                        if not audio_url.startswith("http"):
                            audio_url = f"https://verses.quran.com/{audio_url}"
                        audio_map[v_key] = audio_url
        except Exception:
            pass
            
    # 2. Complete mapping using verified EveryAyah subfolder
    subfolder = RECITER_SUBFOLDERS.get(str_id) or RECITER_SUBFOLDERS.get("7")
    ch_3d = f"{chapter_num:03d}"
    
    for v_num in range(1, 300):
        v_key = f"{chapter_num}:{v_num}"
        if v_key not in audio_map:
            audio_map[v_key] = f"https://everyayah.com/data/{subfolder}/{ch_3d}{v_num:03d}.mp3"
            
    return audio_map

def arabic_num_to_eastern(num: int) -> str:
    """Converts standard digits to Arabic-Indic digits."""
    eastern_digits = "٠١٢٣٤٥٦٧٨٩"
    return "".join(eastern_digits[int(d)] for d in str(num))

def render_verse_frame(
    verse_text: str,
    translation_text: str,
    surah_name_ar: str,
    verse_num: int,
    total_surah_verses: int,
    output_path: str,
    width: int = 1080,
    height: int = 1920,
    transparent_bg: bool = False
):
    """
    Renders Arabic Quran verse using native OpenType shaping (HarfBuzz/Raqm) with RTL direction,
    along with its English translation underneath in a secondary muted font.
    Vertically centers the pair (Arabic block + translation block) on the 1080x1920 canvas.
    Supports transparent RGBA mode for nature video overlays or pure black RGB mode.
    """
    font_path = get_font_path()
    latin_font_path = get_latin_font_path()
    
    if transparent_bg:
        img = Image.new("RGBA", (width, height), color=(0, 0, 0, 0))
    else:
        img = Image.new("RGB", (width, height), color=(0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 1. Arabic Verse Layout
    eastern_num = arabic_num_to_eastern(verse_num)
    verse_with_number = f"{verse_text} ﴿{eastern_num}﴾"
    
    words = verse_with_number.split()
    word_count = len(words)
    
    # Dynamic typography sizing based on verse length
    if word_count <= 8:
        ar_font_size = 60
        ar_line_spacing = 36
    elif word_count <= 18:
        ar_font_size = 50
        ar_line_spacing = 30
    elif word_count <= 35:
        ar_font_size = 42
        ar_line_spacing = 26
    elif word_count <= 60:
        ar_font_size = 36
        ar_line_spacing = 22
    elif word_count <= 90:
        ar_font_size = 30
        ar_line_spacing = 18
    else:
        ar_font_size = 26
        ar_line_spacing = 16
        
    ar_font = ImageFont.truetype(font_path, ar_font_size)
    max_ar_width = int(width * 0.84)
    
    # Arabic word wrapping using native RTL text measurement
    ar_lines = []
    current_ar_words = []
    
    for word in words:
        test_words = current_ar_words + [word]
        test_str = " ".join(test_words)
        bbox = draw.textbbox((0, 0), test_str, font=ar_font, direction='rtl')
        test_w = bbox[2] - bbox[0]
        
        if test_w > max_ar_width and current_ar_words:
            ar_lines.append(" ".join(current_ar_words))
            current_ar_words = [word]
        else:
            current_ar_words = test_words
            
    if current_ar_words:
        ar_lines.append(" ".join(current_ar_words))
        
    # Process Arabic line dimensions
    ar_line_metrics = []
    total_ar_height = 0
    
    for line in ar_lines:
        bbox = draw.textbbox((0, 0), line, font=ar_font, direction='rtl')
        lw = bbox[2] - bbox[0]
        lh = bbox[3] - bbox[1]
        ar_line_metrics.append((line, lw, lh, bbox[0], bbox[1]))
        total_ar_height += lh
        
    total_ar_height += (len(ar_lines) - 1) * ar_line_spacing
    
    # 2. English Translation Layout
    clean_trans = clean_translation_text(translation_text)
    trans_line_metrics = []
    total_trans_height = 0
    trans_line_spacing = 14
    block_gap = 0
    
    if clean_trans:
        trans_words = clean_trans.split()
        trans_word_count = len(trans_words)
        
        # Scaling English translation font size (smaller than Arabic text, clearly secondary)
        if trans_word_count <= 12:
            en_font_size = 28
            trans_line_spacing = 14
        elif trans_word_count <= 28:
            en_font_size = 25
            trans_line_spacing = 12
        elif trans_word_count <= 50:
            en_font_size = 22
            trans_line_spacing = 11
        elif trans_word_count <= 80:
            en_font_size = 20
            trans_line_spacing = 10
        else:
            en_font_size = 18
            trans_line_spacing = 9
            
        en_font = ImageFont.truetype(latin_font_path, en_font_size)
        max_trans_width = int(width * 0.78)
        
        trans_lines = []
        curr_trans_words = []
        for word in trans_words:
            test_words = curr_trans_words + [word]
            test_str = " ".join(test_words)
            bbox = draw.textbbox((0, 0), test_str, font=en_font)
            test_w = bbox[2] - bbox[0]
            if test_w > max_trans_width and curr_trans_words:
                trans_lines.append(" ".join(curr_trans_words))
                curr_trans_words = [word]
            else:
                curr_trans_words = test_words
        if curr_trans_words:
            trans_lines.append(" ".join(curr_trans_words))
            
        for line in trans_lines:
            bbox = draw.textbbox((0, 0), line, font=en_font)
            lw = bbox[2] - bbox[0]
            lh = bbox[3] - bbox[1]
            trans_line_metrics.append((line, lw, lh, bbox[0], bbox[1], en_font))
            total_trans_height += lh
        total_trans_height += (len(trans_lines) - 1) * trans_line_spacing
        
        block_gap = 48  # vertical spacing between Arabic and English blocks
        
    # 3. Vertically center the pair (Arabic block + translation block) on 1080x1920 canvas
    total_combined_height = total_ar_height + (block_gap + total_trans_height if clean_trans else 0)
    start_y = max(220, (height - total_combined_height) // 2)
    
    # Draw header badge: Surah name + Ayah count
    if surah_name_ar:
        header_font = ImageFont.truetype(font_path, 26)
        header_raw = f"{surah_name_ar}  •  الآية {eastern_num}"
        h_bbox = draw.textbbox((0, 0), header_raw, font=header_font, direction='rtl')
        h_w = h_bbox[2] - h_bbox[0]
        h_x = (width - h_w) // 2 - h_bbox[0]
        h_y = 170 - h_bbox[1]
        
        # Subtle drop shadow for nature overlay readability
        if transparent_bg:
            draw.text((h_x + 1, h_y + 1), header_raw, font=header_font, fill=(0, 0, 0, 180), direction='rtl')
            draw.text((h_x, h_y), header_raw, font=header_font, fill=(210, 210, 208, 255), direction='rtl')
        else:
            draw.text((h_x, h_y), header_raw, font=header_font, fill=(140, 140, 140), direction='rtl')
        
    # Draw Arabic lines centered horizontally
    cur_y = start_y
    for line, lw, lh, left_off, top_off in ar_line_metrics:
        line_x = (width - lw) // 2 - left_off
        line_y = cur_y - top_off
        
        if transparent_bg:
            # Multi-directional subtle shadow for crisp contrast over nature video
            for sx, sy in [(-1, 0), (1, 0), (0, -1), (0, 1), (0, 2)]:
                draw.text((line_x + sx, line_y + sy), line, font=ar_font, fill=(0, 0, 0, 160), direction='rtl')
            draw.text((line_x, line_y), line, font=ar_font, fill=(245, 245, 242, 255), direction='rtl')
        else:
            draw.text((line_x, line_y), line, font=ar_font, fill=(245, 245, 242), direction='rtl')
            
        cur_y += lh + ar_line_spacing
        
    # Draw English Translation lines centered horizontally
    if clean_trans and trans_line_metrics:
        cur_y += block_gap - ar_line_spacing
        for line, lw, lh, left_off, top_off, t_font in trans_line_metrics:
            line_x = (width - lw) // 2 - left_off
            line_y = cur_y - top_off
            
            if transparent_bg:
                for sx, sy in [(-1, 0), (1, 0), (0, -1), (0, 1), (0, 1)]:
                    draw.text((line_x + sx, line_y + sy), line, font=t_font, fill=(0, 0, 0, 150))
                draw.text((line_x, line_y), line, font=t_font, fill=(175, 175, 172, 240))
            else:
                draw.text((line_x, line_y), line, font=t_font, fill=(160, 160, 158))
                
            cur_y += lh + trans_line_spacing
        
    if os.path.dirname(output_path):
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "PNG")
    return output_path

def get_media_duration(file_path: str) -> float:
    """Uses ffprobe to obtain exact media duration in seconds."""
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "json",
        file_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    data = json.loads(res.stdout)
    return float(data["format"]["duration"])

def generate_video_pipeline(
    chapter_num: int,
    start_verse: int,
    end_verse: int,
    reciter_id: str,
    job_id: str,
    output_video_path: str,
    temp_dir: str,
    surah_name_ar: str = "",
    background: str = "black"
):
    """
    Full video generation pipeline:
    1. Fetch verse texts & audio links
    2. Render Arabic image frame per verse (with RTL HarfBuzz font shaping)
    3. Generate per-verse video segment with smooth 350ms text fade transitions
    4. Composite over dimmed looping nature background video if selected
    5. Concat all segments into final 1080x1920 MP4
    """
    emit_progress(job_id, "fetching_data", 10, f"Fetching verses {start_verse} to {end_verse} for Surah {chapter_num}...")
    
    verses = fetch_surah_verses(chapter_num, start_verse, end_verse)
    total_selected = len(verses)
    
    emit_progress(job_id, "fetching_data", 25, f"Fetching reciter audio files (Reciter #{reciter_id})...")
    audio_map = fetch_reciter_audio_map(reciter_id, chapter_num)
    
    os.makedirs(temp_dir, exist_ok=True)
    segment_paths = []
    total_duration = 0.0
    accumulated_time = 0.0
    
    # Check background video
    is_nature_bg = background in ["water", "forest", "clouds", "rain"]
    bg_video_path = os.path.join(BACKGROUNDS_DIR, f"{background}.mp4") if is_nature_bg else None
    
    if is_nature_bg:
        if not os.path.exists(bg_video_path) or os.path.getsize(bg_video_path) < 1000:
            raise FileNotFoundError(
                f"Background video file missing for '{background}'. "
                f"Expected a real nature MP4 video at '{bg_video_path}'."
            )
        
    bg_loop_dur = 6.0
    if is_nature_bg and bg_video_path:
        bg_loop_dur = get_media_duration(bg_video_path)

    for idx, v in enumerate(verses):
        v_key = v["verse_key"]
        v_num = v["verse_number"]
        v_text = v["text_uthmani"]
        v_trans = v.get("translation", "")
        
        # Audio URL
        audio_url = audio_map.get(v_key)
        if not audio_url:
            ch_3d = f"{chapter_num:03d}"
            ay_3d = f"{v_num:03d}"
            audio_url = f"https://everyayah.com/data/Alafasy_128kbps/{ch_3d}{ay_3d}.mp3"
            
        progress_pct = 30 + int((idx / total_selected) * 45)
        emit_progress(
            job_id,
            "processing_verses",
            progress_pct,
            f"Processing Verse {v_num} ({idx + 1} of {total_selected}): downloading audio, rendering Arabic typography & English translation..."
        )
        
        # Download audio
        audio_dest = os.path.join(temp_dir, f"audio_{v_num}.mp3")
        r_audio = http_get(audio_url, timeout=20)
        if r_audio.status_code != 200:
            raise RuntimeError(f"Failed to download audio for Ayah {v_key} from {audio_url}")
        with open(audio_dest, "wb") as f:
            f.write(r_audio.content)
            
        # Measure duration
        dur = get_media_duration(audio_dest)
        total_duration += dur
        
        # Calculate subtle fade timing (300-350ms)
        fade_d = min(0.35, dur / 3.0)
        fade_out_st = max(0.0, dur - fade_d)
        
        # Render Arabic + English translation image frame
        img_dest = os.path.join(temp_dir, f"frame_{v_num}.png")
        render_verse_frame(
            verse_text=v_text,
            translation_text=v_trans,
            surah_name_ar=surah_name_ar,
            verse_num=v_num,
            total_surah_verses=total_selected,
            output_path=img_dest,
            transparent_bg=is_nature_bg
        )
        
        seg_dest = os.path.join(temp_dir, f"segment_{v_num}.mp4")
        
        if is_nature_bg and bg_video_path:
            # Offset into looping background video so it streams continuously across verses
            bg_offset = (accumulated_time) % bg_loop_dur
            
            # Semi-transparent dark overlay (32% black) + soft vignette for maximum Arabic legibility
            filter_complex = (
                f"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
                f"drawbox=c=black@0.32:t=fill,vignette=PI/4.5[bg];"
                f"[1:v]format=rgba,fade=t=in:st=0:d={fade_d:.2f}:alpha=1,fade=t=out:st={fade_out_st:.2f}:d={fade_d:.2f}:alpha=1[txt];"
                f"[bg][txt]overlay=0:0[outv]"
            )
            
            seg_cmd = [
                "ffmpeg", "-y",
                "-ss", f"{bg_offset:.2f}",
                "-stream_loop", "-1",
                "-i", bg_video_path,
                "-loop", "1",
                "-framerate", "25",
                "-i", img_dest,
                "-i", audio_dest,
                "-filter_complex", filter_complex,
                "-map", "[outv]",
                "-map", "2:a",
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-c:a", "aac",
                "-b:a", "192k",
                "-ar", "44100",
                "-ac", "2",
                "-pix_fmt", "yuv420p",
                "-t", str(dur),
                "-shortest",
                seg_dest
            ]
        else:
            # Solid black background with smooth verse text fade-in and fade-out
            vf = f"fade=t=in:st=0:d={fade_d:.2f},fade=t=out:st={fade_out_st:.2f}:d={fade_d:.2f}"
            seg_cmd = [
                "ffmpeg", "-y",
                "-loop", "1",
                "-framerate", "25",
                "-i", img_dest,
                "-i", audio_dest,
                "-vf", vf,
                "-c:v", "libx264",
                "-tune", "stillimage",
                "-preset", "ultrafast",
                "-c:a", "aac",
                "-b:a", "192k",
                "-ar", "44100",
                "-ac", "2",
                "-pix_fmt", "yuv420p",
                "-t", str(dur),
                "-shortest",
                seg_dest
            ]
            
        res_seg = subprocess.run(seg_cmd, capture_output=True, text=True)
        if res_seg.returncode != 0:
            raise RuntimeError(f"FFmpeg segment error for verse {v_key}: {res_seg.stderr}")
            
        segment_paths.append(seg_dest)
        accumulated_time += dur
        
    emit_progress(job_id, "assembling_video", 85, "Concatenating verse segments into final MP4 video...")
    
    # Write concat list
    concat_list_path = os.path.join(temp_dir, "concat_list.txt")
    with open(concat_list_path, "w") as f:
        for seg in segment_paths:
            f.write(f"file '{os.path.abspath(seg)}'\n")
            
    os.makedirs(os.path.dirname(output_video_path), exist_ok=True)
    
    # Concat segments
    concat_cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_path,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-c:a", "aac",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        output_video_path
    ]
    res_concat = subprocess.run(concat_cmd, capture_output=True, text=True)
    if res_concat.returncode != 0:
        raise RuntimeError(f"FFmpeg concat error: {res_concat.stderr}")
        
    file_size = os.path.getsize(output_video_path)
    
    emit_progress(
        job_id,
        "complete",
        100,
        "Video generated successfully!",
        extra={
            "duration": round(total_duration, 2),
            "file_size": file_size,
            "verse_count": total_selected,
            "output_path": output_video_path
        }
    )
    
    # Cleanup temp folder
    try:
        shutil.rmtree(temp_dir)
    except Exception:
        pass

def main():
    parser = argparse.ArgumentParser(description="Quran Verse Video Generator")
    parser.add_argument("--surah", type=int, required=True, help="Surah number (1-114)")
    parser.add_argument("--start_verse", type=int, required=True, help="Start verse number")
    parser.add_argument("--end_verse", type=int, required=True, help="End verse number")
    parser.add_argument("--reciter_id", type=str, default="7", help="Reciter ID (default: 7 - Mishary Alafasy)")
    parser.add_argument("--job_id", type=str, default="test_job", help="Unique Job ID")
    parser.add_argument("--output", type=str, required=True, help="Path for output MP4 file")
    parser.add_argument("--temp_dir", type=str, default=None, help="Directory for intermediate files")
    parser.add_argument("--surah_name_ar", type=str, default="", help="Arabic Surah Name for header")
    parser.add_argument("--background", type=str, default="black", help="Background option (black, water, forest, clouds, rain)")
    
    args = parser.parse_args()
    
    temp_directory = args.temp_dir or os.path.abspath(f"temp_jobs/{args.job_id}")
    
    try:
        generate_video_pipeline(
            chapter_num=args.surah,
            start_verse=args.start_verse,
            end_verse=args.end_verse,
            reciter_id=args.reciter_id,
            job_id=args.job_id,
            output_video_path=os.path.abspath(args.output),
            temp_dir=temp_directory,
            surah_name_ar=args.surah_name_ar,
            background=args.background
        )
    except Exception as e:
        emit_progress(args.job_id, "error", 0, str(e), extra={"error": str(e)})
        sys.exit(1)

if __name__ == "__main__":
    main()
