import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { SURAHS_LIST, POPULAR_RECITERS, BACKGROUND_OPTIONS } from './src/data/quranData.ts';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Public generated videos folder
const GENERATED_DIR = path.resolve(process.cwd(), 'public', 'generated');
fs.mkdirSync(GENERATED_DIR, { recursive: true });

// Public backgrounds directory
const PUBLIC_BG_DIR = path.resolve(process.cwd(), 'public', 'backgrounds');
fs.mkdirSync(PUBLIC_BG_DIR, { recursive: true });

// Ensure fonts directory exists
const FONTS_DIR = path.resolve(process.cwd(), 'fonts');
fs.mkdirSync(FONTS_DIR, { recursive: true });

// Static routes
app.use('/generated', express.static(GENERATED_DIR));
app.use('/backgrounds', express.static(PUBLIC_BG_DIR));

export interface JobState {
  jobId: string;
  surah: number;
  surahNameSimple: string;
  surahNameArabic: string;
  startVerse: number;
  endVerse: number;
  reciterId: number | string;
  reciterName: string;
  background?: string;
  status: 'queued' | 'processing' | 'complete' | 'error';
  stage: string;
  progress: number;
  message: string;
  videoUrl?: string;
  downloadUrl?: string;
  duration?: number;
  fileSize?: number;
  verseCount?: number;
  error?: string;
  createdAt: number;
}

const jobs = new Map<string, JobState>();

// In-memory cache for verses
const versesCache = new Map<number, any[]>();

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: List Surahs
app.get('/api/surahs', (req, res) => {
  res.json({ surahs: SURAHS_LIST });
});

// API: List Reciters
app.get('/api/reciters', (req, res) => {
  res.json({ reciters: POPULAR_RECITERS });
});

// API: List Backgrounds
app.get('/api/backgrounds', (req, res) => {
  res.json({ backgrounds: BACKGROUND_OPTIONS });
});

function cleanTranslation(raw: string): string {
  if (!raw) return '';
  return raw
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

// API: Get Surah Verses text for live preview
app.get('/api/surahs/:id/verses', async (req, res) => {
  const surahId = parseInt(req.params.id, 10);
  if (isNaN(surahId) || surahId < 1 || surahId > 114) {
    return res.status(400).json({ error: 'Invalid Surah number. Must be 1–114.' });
  }

  if (versesCache.has(surahId)) {
    return res.json({ surah: surahId, verses: versesCache.get(surahId) });
  }

  try {
    const fetchResp = await fetch(
      `https://api.quran.com/api/v4/verses/by_chapter/${surahId}?translations=20&fields=text_uthmani&per_page=300`
    );
    if (!fetchResp.ok) {
      throw new Error(`Quran API responded with status ${fetchResp.status}`);
    }
    const data = await fetchResp.json() as any;
    const rawVerses = data.verses || [];
    
    const formatted = rawVerses.map((v: any) => {
      const parts = (v.verse_key || '').split(':');
      const vNum = parts.length > 1 ? parseInt(parts[1], 10) : (v.verse_number || 1);
      const rawTrans = v.translations && v.translations.length > 0 ? v.translations[0].text : '';
      return {
        id: v.id,
        verse_key: v.verse_key,
        verse_number: vNum,
        text_uthmani: v.text_uthmani,
        translation: cleanTranslation(rawTrans)
      };
    });

    versesCache.set(surahId, formatted);
    res.json({ surah: surahId, verses: formatted });
  } catch (err: any) {
    console.error(`Error fetching verses for Surah ${surahId}:`, err);
    res.status(502).json({ error: 'Failed to fetch Quran verses from upstream API', details: err.message });
  }
});

// API: Start Video Generation Job
app.post('/api/generate', (req, res) => {
  const { surah, startVerse, endVerse, reciterId, background } = req.body;

  const surahNum = parseInt(surah, 10);
  const startNum = parseInt(startVerse, 10);
  const endNum = parseInt(endVerse, 10);
  const selectedBg = typeof background === 'string' && ['black', 'water', 'forest', 'clouds', 'rain'].includes(background)
    ? background
    : 'black';

  if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
    return res.status(400).json({ error: 'Invalid Surah number. Must be between 1 and 114.' });
  }

  const surahMeta = SURAHS_LIST.find((s) => s.id === surahNum);
  if (!surahMeta) {
    return res.status(404).json({ error: 'Surah not found.' });
  }

  if (isNaN(startNum) || startNum < 1 || startNum > surahMeta.verses_count) {
    return res.status(400).json({
      error: `Invalid start verse. Surah ${surahMeta.name_simple} has ${surahMeta.verses_count} verses (range 1–${surahMeta.verses_count}).`
    });
  }

  if (isNaN(endNum) || endNum < startNum || endNum > surahMeta.verses_count) {
    return res.status(400).json({
      error: `Invalid end verse. Must be between start verse (${startNum}) and total verses (${surahMeta.verses_count}).`
    });
  }

  const reciter = POPULAR_RECITERS.find((r) => String(r.id) === String(reciterId)) || POPULAR_RECITERS[0];
  const jobId = `quran_vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const outputFileName = `${jobId}.mp4`;
  const outputPath = path.join(GENERATED_DIR, outputFileName);
  const tempDir = path.resolve(process.cwd(), 'temp_jobs', jobId);

  const initialJob: JobState = {
    jobId,
    surah: surahNum,
    surahNameSimple: surahMeta.name_simple,
    surahNameArabic: surahMeta.name_arabic,
    startVerse: startNum,
    endVerse: endNum,
    reciterId: reciter.id,
    reciterName: reciter.name,
    background: selectedBg,
    status: 'queued',
    stage: 'initializing',
    progress: 5,
    message: `Job queued: Surah ${surahMeta.name_simple} (${startNum}–${endNum}) with ${reciter.name}`,
    createdAt: Date.now()
  };

  jobs.set(jobId, initialJob);

  // Spawn Python generator script
  const pythonScript = path.resolve(process.cwd(), 'scripts', 'quran_video_generator.py');
  const pythonArgs = [
    pythonScript,
    '--surah', String(surahNum),
    '--start_verse', String(startNum),
    '--end_verse', String(endNum),
    '--reciter_id', String(reciter.id),
    '--job_id', jobId,
    '--output', outputPath,
    '--temp_dir', tempDir,
    '--surah_name_ar', `سورة ${surahMeta.name_arabic}`,
    '--background', selectedBg
  ];

  const pyProcess = spawn('python3', pythonArgs, {
    cwd: process.cwd()
  });

  initialJob.status = 'processing';

  pyProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.job_id === jobId) {
          const current = jobs.get(jobId);
          if (current) {
            current.stage = parsed.stage || current.stage;
            current.progress = typeof parsed.progress === 'number' ? parsed.progress : current.progress;
            current.message = parsed.message || current.message;

            if (parsed.stage === 'complete') {
              current.status = 'complete';
              current.progress = 100;
              current.videoUrl = `/generated/${outputFileName}`;
              current.downloadUrl = `/api/download/${jobId}`;
              current.duration = parsed.duration;
              current.fileSize = parsed.file_size;
              current.verseCount = parsed.verse_count;
            } else if (parsed.stage === 'error') {
              current.status = 'error';
              current.error = parsed.error || 'Video generation failed';
            }
          }
        }
      } catch (e) {
        // Non-JSON output
        console.log(`[Python Worker ${jobId}]`, line);
      }
    }
  });

  pyProcess.stderr.on('data', (data) => {
    console.error(`[Python Worker ${jobId} Error]`, data.toString());
  });

  pyProcess.on('close', (code) => {
    const current = jobs.get(jobId);
    if (!current) return;
    if (code !== 0 && current.status !== 'complete') {
      current.status = 'error';
      current.error = current.error || `Process exited with error code ${code}`;
      current.message = `Failed: ${current.error}`;
    }
  });

  res.json({
    jobId,
    status: 'processing',
    message: 'Video generation started'
  });
});

// API: Get Job Status
app.get('/api/jobs/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

// API: Download MP4
app.get('/api/download/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job || job.status !== 'complete') {
    return res.status(404).json({ error: 'Video not ready or not found' });
  }

  const filePath = path.join(GENERATED_DIR, `${job.jobId}.mp4`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Video file not found on disk' });
  }

  const safeFilename = `Quran_${job.surahNameSimple}_${job.startVerse}-${job.endVerse}_${job.reciterName.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');
  res.download(filePath, safeFilename, (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'Failed to stream video file' });
    }
  });
});

// Clean up old jobs (> 2 hours)
setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of jobs.entries()) {
    if (now - job.createdAt > 2 * 60 * 60 * 1000) {
      try {
        const filePath = path.join(GENERATED_DIR, `${jobId}.mp4`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {}
      jobs.delete(jobId);
    }
  }
}, 15 * 60 * 1000);

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Production build not found. Please run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quran Verse Video Generator server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
