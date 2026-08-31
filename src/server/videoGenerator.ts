import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';

// Register Arabic Quran Fonts
const fontAmiriQuran = path.resolve(process.cwd(), 'fonts', 'AmiriQuran.ttf');
const fontAmiriRegular = path.resolve(process.cwd(), 'fonts', 'Amiri-Regular.ttf');

if (fs.existsSync(fontAmiriQuran)) {
  GlobalFonts.registerFromPath(fontAmiriQuran, 'AmiriQuran');
}
if (fs.existsSync(fontAmiriRegular)) {
  GlobalFonts.registerFromPath(fontAmiriRegular, 'Amiri');
}

export interface VerseData {
  verse_key: string;
  verse_number: number;
  text_uthmani: string;
  translation: string;
}

export interface ProgressCallbackData {
  stage: string;
  progress: number;
  message: string;
  duration?: number;
  fileSize?: number;
  verseCount?: number;
  error?: string;
}

const RECITER_SUBFOLDERS: Record<string, string> = {
  '7': 'Alafasy_128kbps',
  '2': 'Abdul_Basit_Murattal_192kbps',
  '1': 'Abdul_Basit_Mujawwad_128kbps',
  '6': 'Husary_128kbps',
  'husary_mujawwad': 'Husary_128kbps_Mujawwad',
  '12': 'Husary_Muallim_128kbps',
  '9': 'Minshawy_Murattal_128kbps',
  '8': 'Minshawy_Mujawwad_192kbps',
  '3': 'Abdurrahmaan_As-Sudais_192kbps',
  '10': 'Saood_ash-Shuraym_128kbps',
  '4': 'Abu_Bakr_Ash-Shaatree_128kbps',
  '5': 'Hani_Rifai_192kbps',
  '11': 'Mohammad_al_Tablaway_128kbps',
  'maher_almuaiqly': 'MaherAlMuaiqly128kbps',
  'saad_alghamdi': 'Ghamadi_40kbps',
  'ali_alhudhaify': 'Hudhaify_128kbps',
  'yasser_aldosari': 'Yasser_Ad-Dussary_128kbps',
  'nasser_alqatami': 'Nasser_Alqatami_128kbps',
  'muhammad_ayyub': 'Muhammad_Ayyoub_128kbps',
  'ahmed_alajmy': 'ahmed_ibn_ali_al_ajamy_128kbps',
  'abdullah_basfar': 'Abdullah_Basfar_192kbps',
};

export function toEasternArabicNumerals(num: number): string {
  const easternDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).split('').map((d) => {
    const digit = parseInt(d, 10);
    return !isNaN(digit) ? easternDigits[digit] : d;
  }).join('');
}

export function cleanTranslationText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/<sup[^>]*>.*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch verses with Uthmani text and Saheeh International English translations
 * with automatic fallback to alquran.cloud if quran.com is slow or unreachable.
 */
export async function fetchVerses(chapterNum: number, startVerse: number, endVerse: number): Promise<VerseData[]> {
  // Try Primary Source: Quran.com API
  try {
    const url = `https://api.quran.com/api/v4/verses/by_chapter/${chapterNum}?translations=20&fields=text_uthmani&per_page=300`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'QuranVideoGenerator/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const data = await response.json() as any;
      const rawVerses = data.verses || [];
      const selected: VerseData[] = [];

      for (const v of rawVerses) {
        const parts = (v.verse_key || '').split(':');
        const vNum = parts.length > 1 ? parseInt(parts[1], 10) : (v.verse_number || 1);
        if (vNum >= startVerse && vNum <= endVerse) {
          const rawTrans = v.translations && v.translations.length > 0 ? v.translations[0].text : '';
          selected.push({
            verse_key: v.verse_key || `${chapterNum}:${vNum}`,
            verse_number: vNum,
            text_uthmani: (v.text_uthmani || '').trim(),
            translation: cleanTranslationText(rawTrans),
          });
        }
      }

      if (selected.length > 0) {
        return selected.sort((a, b) => a.verse_number - b.verse_number);
      }
    }
  } catch (err) {
    console.warn('Quran.com API fetch failed or timed out, trying alquran.cloud fallback:', err);
  }

  // Fallback Source: AlQuran Cloud API
  try {
    const url = `https://api.alquran.cloud/v1/surah/${chapterNum}/editions/quran-uthmani,en.sahih`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'QuranVideoGenerator/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const data = await response.json() as any;
      const arabicAyahs = data.data?.[0]?.ayahs || [];
      const englishAyahs = data.data?.[1]?.ayahs || [];

      const selected: VerseData[] = [];
      for (let i = 0; i < arabicAyahs.length; i++) {
        const ar = arabicAyahs[i];
        const vNum = ar.numberInSurah || (i + 1);
        if (vNum >= startVerse && vNum <= endVerse) {
          const en = englishAyahs[i];
          selected.push({
            verse_key: `${chapterNum}:${vNum}`,
            verse_number: vNum,
            text_uthmani: (ar.text || '').trim(),
            translation: cleanTranslationText(en?.text || ''),
          });
        }
      }

      if (selected.length > 0) {
        return selected.sort((a, b) => a.verse_number - b.verse_number);
      }
    }
  } catch (fallbackErr) {
    console.error('Fallback AlQuran Cloud API error:', fallbackErr);
  }

  throw new Error(`Failed to retrieve Quran verses for Surah ${chapterNum} (${startVerse}–${endVerse})`);
}

/**
 * Fetch audio URLs for verses
 */
export async function fetchAudioUrls(reciterId: string | number, chapterNum: number): Promise<Record<string, string>> {
  const strId = String(reciterId).trim();
  const audioMap: Record<string, string> = {};

  if (/^\d+$/.test(strId)) {
    try {
      const url = `https://api.quran.com/api/v4/recitations/${strId}/by_chapter/${chapterNum}?per_page=300`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'QuranVideoGenerator/1.0' },
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json() as any;
        for (const a of data.audio_files || []) {
          if (a.verse_key && a.url) {
            const fullUrl = a.url.startsWith('http') ? a.url : `https://verses.quran.com/${a.url}`;
            audioMap[a.verse_key] = fullUrl;
          }
        }
      }
    } catch (e) {
      console.warn('Quran API reciter lookup failed, using EveryAyah fallback:', e);
    }
  }

  const subfolder = RECITER_SUBFOLDERS[strId] || RECITER_SUBFOLDERS['7'];
  const ch3d = String(chapterNum).padStart(3, '0');

  for (let vNum = 1; vNum <= 300; vNum++) {
    const vKey = `${chapterNum}:${vNum}`;
    if (!audioMap[vKey]) {
      const ay3d = String(vNum).padStart(3, '0');
      audioMap[vKey] = `https://everyayah.com/data/${subfolder}/${ch3d}${ay3d}.mp3`;
    }
  }

  return audioMap;
}

/**
 * Download file from URL with timeout and fallback URL support
 */
export async function downloadFile(primaryUrl: string, destPath: string, fallbackUrl?: string): Promise<void> {
  const urls = [primaryUrl];
  if (fallbackUrl && fallbackUrl !== primaryUrl) {
    urls.push(fallbackUrl);
  }

  let lastError: any = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'QuranVideoGenerator/1.0' },
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      if (arrayBuffer.byteLength < 100) {
        throw new Error('Downloaded audio payload is too small');
      }

      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(destPath, buffer);
      return;
    } catch (err: any) {
      lastError = err;
      console.warn(`Failed download from ${url}:`, err.message);
    }
  }

  throw new Error(`Failed to download audio file: ${lastError?.message || 'Unknown network error'}`);
}

/**
 * Get media duration via ffprobe with fallback
 */
export function getMediaDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'json',
      filePath,
    ]);

    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      resolve(4.0); // Fallback safe default
    }, 6000);

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        console.warn(`ffprobe non-zero code for ${filePath}: ${stderr}`);
        return resolve(4.0);
      }
      try {
        const parsed = JSON.parse(stdout);
        const duration = parseFloat(parsed?.format?.duration);
        if (isNaN(duration) || duration <= 0) {
          return resolve(4.0);
        }
        resolve(duration);
      } catch (err) {
        resolve(4.0);
      }
    });
  });
}

/**
 * Render a high-resolution 1080x1920 Quran Verse Frame using Skia / @napi-rs/canvas
 */
export function renderVerseFrameCanvas({
  verseText,
  translationText,
  surahNameAr,
  verseNum,
  outputPath,
  background = 'black',
  transparentBg = false,
  width = 1080,
  height = 1920,
}: {
  verseText: string;
  translationText: string;
  surahNameAr: string;
  verseNum: number;
  outputPath: string;
  background?: string;
  transparentBg?: boolean;
  width?: number;
  height?: number;
}): void {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Procedural thematic backgrounds
  const bgType = background || 'black';

  if (transparentBg) {
    ctx.clearRect(0, 0, width, height);
  } else if (bgType === 'water') {
    // Deep Sapphire Oceanic Theme
    const grad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, width * 0.95);
    grad.addColorStop(0, '#0a2540');
    grad.addColorStop(0.5, '#051829');
    grad.addColorStop(1, '#020b14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle ambient water glow
    const glow = ctx.createLinearGradient(0, height * 0.3, 0, height * 0.7);
    glow.addColorStop(0, 'rgba(14, 165, 233, 0.08)');
    glow.addColorStop(0.5, 'rgba(6, 182, 212, 0.12)');
    glow.addColorStop(1, 'rgba(2, 132, 199, 0.05)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  } else if (bgType === 'forest') {
    // Deep Pine Forest Twilight Theme
    const grad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, width * 0.95);
    grad.addColorStop(0, '#062817');
    grad.addColorStop(0.5, '#041d10');
    grad.addColorStop(1, '#010c07');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Ambient emerald mist
    const glow = ctx.createLinearGradient(0, 0, width, height);
    glow.addColorStop(0, 'rgba(16, 185, 129, 0.06)');
    glow.addColorStop(0.5, 'rgba(5, 150, 105, 0.10)');
    glow.addColorStop(1, 'rgba(4, 120, 87, 0.04)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  } else if (bgType === 'clouds') {
    // Dusk Sunset Indigo Theme
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.4, '#1e1b4b');
    grad.addColorStop(0.75, '#2e1065');
    grad.addColorStop(1, '#111827');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Warm amber dusk glow
    const dusk = ctx.createRadialGradient(width / 2, height * 0.85, 40, width / 2, height * 0.85, width * 0.7);
    dusk.addColorStop(0, 'rgba(245, 158, 11, 0.12)');
    dusk.addColorStop(0.5, 'rgba(217, 119, 6, 0.06)');
    dusk.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = dusk;
    ctx.fillRect(0, 0, width, height);
  } else if (bgType === 'rain') {
    // Deep Slate Storm Theme
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#0b1120');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle storm glow
    const storm = ctx.createRadialGradient(width / 2, height * 0.4, 60, width / 2, height * 0.4, width * 0.85);
    storm.addColorStop(0, 'rgba(148, 163, 184, 0.09)');
    storm.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = storm;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Obsidian Cosmic Theme with subtle gold warmth
    const grad = ctx.createRadialGradient(width / 2, height / 2, 60, width / 2, height / 2, width * 0.9);
    grad.addColorStop(0, '#0d0e12');
    grad.addColorStop(0.6, '#07080a');
    grad.addColorStop(1, '#020304');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle warm golden center ambience
    const goldAura = ctx.createRadialGradient(width / 2, height * 0.5, 20, width / 2, height * 0.5, width * 0.5);
    goldAura.addColorStop(0, 'rgba(234, 179, 8, 0.05)');
    goldAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = goldAura;
    ctx.fillRect(0, 0, width, height);
  }

  // Decorative border vignette
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  const easternNum = toEasternArabicNumerals(verseNum);
  const fullVerseText = `${verseText} ﴿${easternNum}﴾`;
  const words = fullVerseText.split(/\s+/);
  const wordCount = words.length;

  // Dynamic Arabic Typography scale
  let arFontSize = 54;
  let arLineSpacing = 32;

  if (wordCount <= 8) {
    arFontSize = 62;
    arLineSpacing = 38;
  } else if (wordCount <= 18) {
    arFontSize = 52;
    arLineSpacing = 32;
  } else if (wordCount <= 35) {
    arFontSize = 42;
    arLineSpacing = 26;
  } else if (wordCount <= 60) {
    arFontSize = 36;
    arLineSpacing = 22;
  } else if (wordCount <= 90) {
    arFontSize = 30;
    arLineSpacing = 18;
  } else {
    arFontSize = 26;
    arLineSpacing = 16;
  }

  ctx.font = `${arFontSize}px AmiriQuran, Amiri, serif`;
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxArWidth = width * 0.84;

  // Arabic Word Wrapping
  const arLines: string[] = [];
  let currentArWords: string[] = [];

  for (const word of words) {
    const testWords = [...currentArWords, word];
    const testLine = testWords.join(' ');
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxArWidth && currentArWords.length > 0) {
      arLines.push(currentArWords.join(' '));
      currentArWords = [word];
    } else {
      currentArWords = testWords;
    }
  }
  if (currentArWords.length > 0) {
    arLines.push(currentArWords.join(' '));
  }

  const totalArHeight = arLines.length * arFontSize + (arLines.length - 1) * arLineSpacing;

  // English Translation Wrapping
  const cleanTrans = cleanTranslationText(translationText);
  const transLines: string[] = [];
  let enFontSize = 22;
  let transLineSpacing = 12;

  if (cleanTrans) {
    const transWords = cleanTrans.split(/\s+/);
    if (transWords.length <= 12) {
      enFontSize = 28;
      transLineSpacing = 14;
    } else if (transWords.length <= 28) {
      enFontSize = 24;
      transLineSpacing = 12;
    } else if (transWords.length <= 55) {
      enFontSize = 21;
      transLineSpacing = 10;
    } else {
      enFontSize = 18;
      transLineSpacing = 9;
    }

    ctx.font = `400 ${enFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.direction = 'ltr';
    const maxTransWidth = width * 0.78;

    let currEnWords: string[] = [];
    for (const w of transWords) {
      const testLine = [...currEnWords, w].join(' ');
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTransWidth && currEnWords.length > 0) {
        transLines.push(currEnWords.join(' '));
        currEnWords = [w];
      } else {
        currEnWords.push(w);
      }
    }
    if (currEnWords.length > 0) {
      transLines.push(currEnWords.join(' '));
    }
  }

  const totalTransHeight = transLines.length > 0
    ? transLines.length * enFontSize + (transLines.length - 1) * transLineSpacing
    : 0;

  const blockGap = cleanTrans ? 48 : 0;
  const totalCombinedHeight = totalArHeight + (cleanTrans ? blockGap + totalTransHeight : 0);
  const startY = Math.max(240, Math.floor((height - totalCombinedHeight) / 2));

  // 1. Draw Top Header: Surah name & Verse Number
  if (surahNameAr) {
    ctx.font = '26px AmiriQuran, Amiri, serif';
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const headerText = `${surahNameAr}  •  الآية ${easternNum}`;
    const headerY = 175;

    if (transparentBg) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillText(headerText, width / 2 + 1, headerY + 1);
      ctx.fillStyle = 'rgba(220, 220, 218, 0.95)';
      ctx.fillText(headerText, width / 2, headerY);
    } else {
      ctx.fillStyle = '#8e8e8a';
      ctx.fillText(headerText, width / 2, headerY);
    }
  }

  // 2. Draw Arabic Verse Lines (RTL Centered)
  ctx.font = `${arFontSize}px AmiriQuran, Amiri, serif`;
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let currentY = startY + arFontSize / 2;

  for (const line of arLines) {
    if (transparentBg) {
      // Subtle multi-directional shadow for nature backgrounds
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillText(line, width / 2 - 1, currentY);
      ctx.fillText(line, width / 2 + 1, currentY);
      ctx.fillText(line, width / 2, currentY - 1);
      ctx.fillText(line, width / 2, currentY + 1);
      ctx.fillText(line, width / 2, currentY + 2);

      ctx.fillStyle = '#f8f8f5';
      ctx.fillText(line, width / 2, currentY);
    } else {
      ctx.fillStyle = '#f8f8f5';
      ctx.fillText(line, width / 2, currentY);
    }
    currentY += arFontSize + arLineSpacing;
  }

  // 3. Draw English Translation Lines (LTR Centered)
  if (cleanTrans && transLines.length > 0) {
    currentY += blockGap - arLineSpacing;
    ctx.font = `400 ${enFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.direction = 'ltr';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const line of transLines) {
      if (transparentBg) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillText(line, width / 2 + 1, currentY + 1);
        ctx.fillStyle = 'rgba(195, 195, 190, 0.92)';
        ctx.fillText(line, width / 2, currentY);
      } else {
        ctx.fillStyle = '#a6a6a0';
        ctx.fillText(line, width / 2, currentY);
      }
      currentY += enFontSize + transLineSpacing;
    }
  }

  // Save to PNG
  const buffer = canvas.toBuffer('image/png');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
}

/**
 * Execute FFmpeg command safely with timeout and promise
 */
function runFfmpeg(args: string[], timeoutMs: number = 60000): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);
    let stderr = '';

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error(`FFmpeg timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg error (code ${code}): ${stderr.slice(-350)}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Main Video Generation Pipeline (TypeScript + @napi-rs/canvas + FFmpeg)
 */
export async function generateVideoPipeline({
  chapterNum,
  startVerse,
  endVerse,
  reciterId,
  jobId,
  outputVideoPath,
  tempDir,
  surahNameAr = '',
  background = 'black',
  onProgress,
}: {
  chapterNum: number;
  startVerse: number;
  endVerse: number;
  reciterId: string | number;
  jobId: string;
  outputVideoPath: string;
  tempDir: string;
  surahNameAr?: string;
  background?: string;
  onProgress?: (data: ProgressCallbackData) => void;
}): Promise<{ duration: number; fileSize: number; verseCount: number; outputPath: string }> {
  onProgress?.({
    stage: 'fetching_data',
    progress: 12,
    message: `Fetching verses ${startVerse} to ${endVerse} for Surah ${chapterNum}...`,
  });

  const verses = await fetchVerses(chapterNum, startVerse, endVerse);
  const totalSelected = verses.length;

  onProgress?.({
    stage: 'fetching_data',
    progress: 24,
    message: `Locating reciter audio streams...`,
  });

  const audioMap = await fetchAudioUrls(reciterId, chapterNum);

  fs.mkdirSync(tempDir, { recursive: true });
  const segmentPaths: string[] = [];
  let totalDuration = 0.0;
  let accumulatedTime = 0.0;

  // Background resolution
  const isNatureBg = ['water', 'forest', 'clouds', 'rain'].includes(background);
  let bgVideoPath: string | null = null;
  let bgImagePath: string | null = null;

  if (isNatureBg) {
    const videoCandidate = path.resolve(process.cwd(), 'assets', 'backgrounds', `${background}.mp4`);
    const imageCandidate = path.resolve(process.cwd(), 'public', 'backgrounds', `${background}.jpg`);

    if (fs.existsSync(videoCandidate) && fs.statSync(videoCandidate).size > 1000) {
      bgVideoPath = videoCandidate;
    } else if (fs.existsSync(imageCandidate)) {
      bgImagePath = imageCandidate;
    }
  }

  let bgLoopDur = 6.0;
  if (bgVideoPath) {
    try {
      bgLoopDur = await getMediaDuration(bgVideoPath);
    } catch (e) {
      bgLoopDur = 6.0;
    }
  }

  const strId = String(reciterId).trim();
  const subfolder = RECITER_SUBFOLDERS[strId] || RECITER_SUBFOLDERS['7'];
  const ch3d = String(chapterNum).padStart(3, '0');

  for (let idx = 0; idx < totalSelected; idx++) {
    const v = verses[idx];
    const vKey = v.verse_key;
    const vNum = v.verse_number;
    const vText = v.text_uthmani;
    const vTrans = v.translation;

    const ay3d = String(vNum).padStart(3, '0');
    const fallbackAudio = `https://everyayah.com/data/${subfolder}/${ch3d}${ay3d}.mp3`;
    const primaryAudio = audioMap[vKey] || fallbackAudio;

    const vBasePct = 25 + Math.floor((idx / totalSelected) * 55);
    const vStepSpan = Math.floor(55 / totalSelected);

    onProgress?.({
      stage: 'processing_verses',
      progress: vBasePct,
      message: `Verse ${vNum} (${idx + 1}/${totalSelected}): Downloading reciter audio...`,
    });

    // 1. Download Audio
    const audioDest = path.join(tempDir, `audio_${vNum}.mp3`);
    await downloadFile(primaryAudio, audioDest, fallbackAudio);

    // 2. Measure Duration
    const dur = await getMediaDuration(audioDest);
    totalDuration += dur;

    // 3. Fade timing (300-350ms)
    const fadeD = Math.min(0.35, dur / 3.0);
    const fadeOutSt = Math.max(0.0, dur - fadeD);

    onProgress?.({
      stage: 'processing_verses',
      progress: Math.min(80, vBasePct + Math.floor(vStepSpan * 0.35)),
      message: `Verse ${vNum} (${idx + 1}/${totalSelected}): Rendering Arabic calligraphy & translation...`,
    });

    // 4. Render Canvas Image Frame
    const imgDest = path.join(tempDir, `frame_${vNum}.png`);
    renderVerseFrameCanvas({
      verseText: vText,
      translationText: vTrans,
      surahNameAr,
      verseNum: vNum,
      outputPath: imgDest,
      background: background || 'black',
      transparentBg: Boolean(bgVideoPath || bgImagePath),
    });

    onProgress?.({
      stage: 'processing_verses',
      progress: Math.min(80, vBasePct + Math.floor(vStepSpan * 0.7)),
      message: `Verse ${vNum} (${idx + 1}/${totalSelected}): Encoding HD video segment with audio...`,
    });

    // 5. Generate Verse Segment Video with FFmpeg
    const segDest = path.join(tempDir, `segment_${vNum}.mp4`);

    if (bgVideoPath) {
      const bgOffset = accumulatedTime % bgLoopDur;
      const filterComplex = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,drawbox=c=black@0.36:t=fill,vignette=PI/4.5[bg];[1:v]format=rgba,fade=t=in:st=0:d=${fadeD.toFixed(2)}:alpha=1,fade=t=out:st=${fadeOutSt.toFixed(2)}:d=${fadeD.toFixed(2)}:alpha=1[txt];[bg][txt]overlay=0:0[outv]`;

      await runFfmpeg([
        '-y',
        '-threads', '2',
        '-ss', bgOffset.toFixed(2),
        '-stream_loop', '-1',
        '-i', bgVideoPath,
        '-loop', '1',
        '-framerate', '25',
        '-i', imgDest,
        '-i', audioDest,
        '-filter_complex', filterComplex,
        '-map', '[outv]',
        '-map', '2:a',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ar', '44100',
        '-ac', '2',
        '-pix_fmt', 'yuv420p',
        '-t', String(dur),
        '-shortest',
        segDest,
      ]);
    } else if (bgImagePath) {
      const filterComplex = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,drawbox=c=black@0.40:t=fill,vignette=PI/4.5[bg];[1:v]format=rgba,fade=t=in:st=0:d=${fadeD.toFixed(2)}:alpha=1,fade=t=out:st=${fadeOutSt.toFixed(2)}:d=${fadeD.toFixed(2)}:alpha=1[txt];[bg][txt]overlay=0:0[outv]`;

      await runFfmpeg([
        '-y',
        '-threads', '2',
        '-loop', '1',
        '-framerate', '25',
        '-i', bgImagePath,
        '-loop', '1',
        '-framerate', '25',
        '-i', imgDest,
        '-i', audioDest,
        '-filter_complex', filterComplex,
        '-map', '[outv]',
        '-map', '2:a',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ar', '44100',
        '-ac', '2',
        '-pix_fmt', 'yuv420p',
        '-t', String(dur),
        '-shortest',
        segDest,
      ]);
    } else {
      const vf = `fade=t=in:st=0:d=${fadeD.toFixed(2)},fade=t=out:st=${fadeOutSt.toFixed(2)}:d=${fadeD.toFixed(2)}`;
      await runFfmpeg([
        '-y',
        '-threads', '2',
        '-loop', '1',
        '-framerate', '25',
        '-i', imgDest,
        '-i', audioDest,
        '-vf', vf,
        '-c:v', 'libx264',
        '-tune', 'stillimage',
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ar', '44100',
        '-ac', '2',
        '-pix_fmt', 'yuv420p',
        '-t', String(dur),
        '-shortest',
        segDest,
      ]);
    }

    segmentPaths.push(segDest);
    accumulatedTime += dur;
  }

  onProgress?.({
    stage: 'assembling_video',
    progress: 85,
    message: 'Stitching verse segments into final MP4 video...',
  });

  // Write concat list
  const concatListPath = path.join(tempDir, 'concat_list.txt');
  const concatContent = segmentPaths.map((s) => `file '${path.resolve(s)}'`).join('\n') + '\n';
  fs.writeFileSync(concatListPath, concatContent);

  fs.mkdirSync(path.dirname(outputVideoPath), { recursive: true });

  // Concat segments
  await runFfmpeg([
    '-y',
    '-threads', '2',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatListPath,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-c:a', 'aac',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputVideoPath,
  ], 120000);

  const stats = fs.statSync(outputVideoPath);
  const fileSize = stats.size;

  onProgress?.({
    stage: 'complete',
    progress: 100,
    message: 'Video generated successfully!',
    duration: Math.round(totalDuration * 100) / 100,
    fileSize,
    verseCount: totalSelected,
  });

  // Cleanup temp files
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }

  return {
    duration: Math.round(totalDuration * 100) / 100,
    fileSize,
    verseCount: totalSelected,
    outputPath: outputVideoPath,
  };
}
