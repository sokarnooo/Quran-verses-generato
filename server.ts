import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { SURAHS_LIST, POPULAR_RECITERS, BACKGROUND_OPTIONS } from './src/data/quranData.ts';
import { generateVideoPipeline } from './src/server/videoGenerator.ts';

const app = express();
const PORT = 3000;

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

// Ensure job states directory exists
const JOBS_STATE_DIR = path.resolve(process.cwd(), 'temp_jobs', 'job_states');
fs.mkdirSync(JOBS_STATE_DIR, { recursive: true });

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

function saveJobState(job: JobState) {
  jobs.set(job.jobId, job);
  try {
    const jobFile = path.join(JOBS_STATE_DIR, `${job.jobId}.json`);
    fs.writeFileSync(jobFile, JSON.stringify(job));
  } catch (e) {
    // Ignore file write errors
  }
}

function getJobState(jobId: string): JobState | undefined {
  if (jobs.has(jobId)) {
    return jobs.get(jobId);
  }
  try {
    const jobFile = path.join(JOBS_STATE_DIR, `${jobId}.json`);
    if (fs.existsSync(jobFile)) {
      const data = JSON.parse(fs.readFileSync(jobFile, 'utf-8')) as JobState;
      jobs.set(jobId, data);
      return data;
    }
  } catch (e) {
    // Ignore file read errors
  }
  return undefined;
}

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

  saveJobState(initialJob);

  // Trigger video generation pipeline asynchronously
  initialJob.status = 'processing';
  saveJobState(initialJob);

  generateVideoPipeline({
    chapterNum: surahNum,
    startVerse: startNum,
    endVerse: endNum,
    reciterId: reciter.id,
    jobId,
    outputVideoPath: outputPath,
    tempDir,
    surahNameAr: `سورة ${surahMeta.name_arabic}`,
    background: selectedBg,
    onProgress: (data) => {
      const current = getJobState(jobId);
      if (!current) return;

      current.stage = data.stage || current.stage;
      current.progress = typeof data.progress === 'number' ? data.progress : current.progress;
      current.message = data.message || current.message;

      if (data.stage === 'complete') {
        current.status = 'complete';
        current.progress = 100;
        current.videoUrl = `/generated/${outputFileName}`;
        current.downloadUrl = `/api/download/${jobId}`;
        current.duration = data.duration;
        current.fileSize = data.fileSize;
        current.verseCount = data.verseCount;
      }
      saveJobState(current);
    },
  }).catch((err) => {
    console.error(`[Video Generation Error for ${jobId}]:`, err);
    const current = getJobState(jobId);
    if (current) {
      current.status = 'error';
      current.error = err.message || 'Video generation failed';
      current.message = `Failed: ${current.error}`;
      saveJobState(current);
    }
  });

  res.json({
    jobId,
    status: 'processing',
    message: 'Video generation started'
  });
});

// API: Streaming Video Generation (SSE - Single Persistent Connection)
app.post('/api/generate-stream', async (req, res) => {
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

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let isClientConnected = true;
  res.on('close', () => {
    if (!res.writableEnded) {
      isClientConnected = false;
    }
  });

  const sendSSE = (event: string, data: any) => {
    if (!isClientConnected || res.writableEnded || res.destroyed) return;
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch (e) {
      // Ignore write errors if socket closed
    }
  };

  // Heartbeat to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    if (!isClientConnected || res.writableEnded) {
      clearInterval(heartbeat);
      return;
    }
    try {
      res.write(': keep-alive\n\n');
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch (e) {}
  }, 2000);

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
    status: 'processing',
    stage: 'initializing',
    progress: 5,
    message: `Initializing: Surah ${surahMeta.name_simple} (${startNum}–${endNum}) with ${reciter.name}`,
    createdAt: Date.now(),
  };

  saveJobState(initialJob);
  sendSSE('progress', initialJob);

  try {
    const result = await generateVideoPipeline({
      chapterNum: surahNum,
      startVerse: startNum,
      endVerse: endNum,
      reciterId: reciter.id,
      jobId,
      outputVideoPath: outputPath,
      tempDir,
      surahNameAr: `سورة ${surahMeta.name_arabic}`,
      background: selectedBg,
      onProgress: (data) => {
        const updated: JobState = {
          jobId,
          surah: surahNum,
          surahNameSimple: surahMeta.name_simple,
          surahNameArabic: surahMeta.name_arabic,
          startVerse: startNum,
          endVerse: endNum,
          reciterId: reciter.id,
          reciterName: reciter.name,
          background: selectedBg,
          status: 'processing',
          stage: data.stage || 'processing',
          progress: typeof data.progress === 'number' ? data.progress : 50,
          message: data.message || 'Processing video...',
          createdAt: initialJob.createdAt,
        };
        saveJobState(updated);
        sendSSE('progress', updated);
      },
    });

    clearInterval(heartbeat);

    if (fs.existsSync(outputPath)) {
      const completedState: JobState = {
        jobId,
        surah: surahNum,
        surahNameSimple: surahMeta.name_simple,
        surahNameArabic: surahMeta.name_arabic,
        startVerse: startNum,
        endVerse: endNum,
        reciterId: reciter.id,
        reciterName: reciter.name,
        background: selectedBg,
        status: 'complete',
        stage: 'complete',
        progress: 100,
        message: 'Video generated successfully!',
        videoUrl: `/api/video/${jobId}`,
        downloadUrl: `/api/download/${jobId}`,
        duration: result.duration,
        fileSize: result.fileSize,
        verseCount: result.verseCount,
        createdAt: initialJob.createdAt,
      };

      saveJobState(completedState);
      sendSSE('complete', completedState);
    } else {
      throw new Error('Generated output video file not found on server');
    }

    res.end();
  } catch (err: any) {
    clearInterval(heartbeat);
    console.error(`[SSE Generation Error for ${jobId}]:`, err);
    const errorState: JobState = {
      jobId,
      surah: surahNum,
      surahNameSimple: surahMeta.name_simple,
      surahNameArabic: surahMeta.name_arabic,
      startVerse: startNum,
      endVerse: endNum,
      reciterId: reciter.id,
      reciterName: reciter.name,
      background: selectedBg,
      status: 'error',
      stage: 'error',
      progress: 100,
      error: err.message || 'Video generation failed',
      message: `Failed: ${err.message || 'Video generation failed'}`,
      createdAt: initialJob.createdAt,
    };
    saveJobState(errorState);
    sendSSE('error', errorState);
    res.end();
  }
});

// API: Stream Video with HTTP 206 Partial Content (Supports seeking on all browsers & iOS Safari)
app.get('/api/video/:jobId', (req, res) => {
  const { jobId } = req.params;
  const filePath = path.join(GENERATED_DIR, `${jobId}.mp4`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// API: Get Job Status
app.get('/api/jobs/:jobId', (req, res) => {
  const job = getJobState(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

// API: Download MP4
app.get('/api/download/:jobId', (req, res) => {
  const job = getJobState(req.params.jobId);
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
