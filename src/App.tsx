import React, { useState, useEffect } from 'react';
import { Surah, Reciter, VideoJob, VerseItem } from './types.ts';
import { SURAHS_LIST, POPULAR_RECITERS } from './data/quranData.ts';
import { LanguageProvider, useLanguage } from './context/LanguageContext.tsx';
import { Header } from './components/Header.tsx';
import { SurahSelector } from './components/SurahSelector.tsx';
import { VerseRangeSelector } from './components/VerseRangeSelector.tsx';
import { ReciterSelector } from './components/ReciterSelector.tsx';
import { BackgroundSelector } from './components/BackgroundSelector.tsx';
import { VersePreview } from './components/VersePreview.tsx';
import { GenerationProgress } from './components/GenerationProgress.tsx';
import { VideoPlayerCard } from './components/VideoPlayerCard.tsx';
import { Film, AlertCircle } from 'lucide-react';

function MainApp() {
  const { lang, t } = useLanguage();
  const [surahs, setSurahs] = useState<Surah[]>(SURAHS_LIST);
  const [reciters, setReciters] = useState<Reciter[]>(POPULAR_RECITERS);
  
  // Default to Surah 112 (Al-Ikhlas), 4 verses, Mishary Alafasy, solid black background
  const [selectedSurah, setSelectedSurah] = useState<Surah>(
    SURAHS_LIST.find((s) => s.id === 112) || SURAHS_LIST[0]
  );
  const [startVerse, setStartVerse] = useState<number>(1);
  const [endVerse, setEndVerse] = useState<number>(4);
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(POPULAR_RECITERS[0]);
  const [selectedBg, setSelectedBg] = useState<'black' | 'water' | 'forest' | 'clouds' | 'rain'>('black');

  const [verses, setVerses] = useState<VerseItem[]>([]);
  const [loadingVerses, setLoadingVerses] = useState<boolean>(false);

  const [currentJob, setCurrentJob] = useState<VideoJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Fetch live surahs & reciters from backend if available
  useEffect(() => {
    fetch('/api/surahs')
      .then((res) => res.json())
      .then((data) => {
        if (data.surahs && data.surahs.length > 0) {
          setSurahs(data.surahs);
        }
      })
      .catch(() => {});

    fetch('/api/reciters')
      .then((res) => res.json())
      .then((data) => {
        if (data.reciters && data.reciters.length > 0) {
          setReciters(data.reciters);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Surah verse texts for live preview
  useEffect(() => {
    setLoadingVerses(true);
    fetch(`/api/surahs/${selectedSurah.id}/verses`)
      .then((res) => res.json())
      .then((data) => {
        if (data.verses) {
          setVerses(data.verses);
        }
      })
      .catch((err) => {
        console.error('Error fetching verses:', err);
      })
      .finally(() => {
        setLoadingVerses(false);
      });
  }, [selectedSurah.id]);

  // When selected Surah changes, reset start/end verses safely
  const handleSelectSurah = (newSurah: Surah) => {
    setSelectedSurah(newSurah);
    setStartVerse(1);
    const defaultEnd = Math.min(newSurah.verses_count, newSurah.verses_count <= 7 ? newSurah.verses_count : 3);
    setEndVerse(defaultEnd);
    setGlobalError(null);
  };

  // Job polling loop
  useEffect(() => {
    if (!currentJob || currentJob.status === 'complete' || currentJob.status === 'error') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${currentJob.jobId}`);
        if (!res.ok) return;
        const updated = (await res.json()) as VideoJob;
        setCurrentJob(updated);
      } catch (e) {
        console.error('Error polling job status:', e);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentJob?.jobId, currentJob?.status]);

  const handleGenerate = async () => {
    setGlobalError(null);

    // Validate range
    if (startVerse < 1 || endVerse > selectedSurah.verses_count || startVerse > endVerse) {
      setGlobalError(`Please select a valid verse range between 1 and ${selectedSurah.verses_count}.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surah: selectedSurah.id,
          startVerse,
          endVerse,
          reciterId: selectedReciter.id,
          background: selectedBg,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start video generation');
      }

      // Initial job state
      setCurrentJob({
        jobId: data.jobId,
        surah: selectedSurah.id,
        surahNameSimple: selectedSurah.name_simple,
        surahNameArabic: selectedSurah.name_arabic,
        startVerse,
        endVerse,
        reciterId: selectedReciter.id,
        reciterName: selectedReciter.name,
        background: selectedBg,
        status: 'processing',
        stage: 'fetching_data',
        progress: 10,
        message: 'Job submitted, fetching verse text and audio files...',
        createdAt: Date.now(),
      });
    } catch (err: any) {
      setGlobalError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentJob(null);
    setGlobalError(null);
  };

  const isGenerating = currentJob && (currentJob.status === 'processing' || currentJob.status === 'queued');

  return (
    <div className="min-h-screen bg-[#070707] text-[#f2f2f0] flex flex-col selection:bg-[#333330] selection:text-white">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Global Error Banner */}
        {globalError && (
          <div className="p-4 bg-red-950/20 border border-red-900/60 flex items-start gap-3 text-red-200 text-xs font-mono">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-red-300">Error: </span>
              {globalError}
            </div>
          </div>
        )}

        {/* Active Generation Progress Card */}
        {isGenerating && currentJob && (
          <GenerationProgress job={currentJob} />
        )}

        {/* Completed Video Player Card */}
        {currentJob && currentJob.status === 'complete' && (
          <VideoPlayerCard job={currentJob} onReset={handleReset} />
        )}

        {/* Generation Form — Hairline separation, typography-led, generous negative space */}
        <div
          className={`space-y-10 transition-opacity duration-200 ${
            isGenerating ? 'opacity-40 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Section 1: Surah Selector */}
          <section>
            <SurahSelector
              surahs={surahs}
              selectedSurah={selectedSurah}
              onSelectSurah={handleSelectSurah}
              disabled={isGenerating}
            />
          </section>

          <div className="border-t border-[#1a1a18]" />

          {/* Section 2: Verse Range Selector */}
          <section>
            <VerseRangeSelector
              surah={selectedSurah}
              startVerse={startVerse}
              endVerse={endVerse}
              onStartVerseChange={setStartVerse}
              onEndVerseChange={setEndVerse}
              disabled={isGenerating}
            />
          </section>

          <div className="border-t border-[#1a1a18]" />

          {/* Section 3: Reciter Selector */}
          <section>
            <ReciterSelector
              reciters={reciters}
              selectedReciter={selectedReciter}
              onSelectReciter={setSelectedReciter}
              disabled={isGenerating}
            />
          </section>

          <div className="border-t border-[#1a1a18]" />

          {/* Section 4: Background Selector */}
          <section>
            <BackgroundSelector
              selectedBg={selectedBg}
              onSelectBg={setSelectedBg}
              disabled={isGenerating}
            />
          </section>

          <div className="border-t border-[#1a1a18]" />

          {/* Section 5: Live Verse Preview */}
          <section>
            <VersePreview
              surah={selectedSurah}
              verses={verses}
              startVerse={startVerse}
              endVerse={endVerse}
              selectedBg={selectedBg}
              loading={loadingVerses}
            />
          </section>

          {/* Submit Action */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-[#1a1a18]">
            <div className="text-xs text-[#737370] font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#f2f2f0]" />
              <span>1080×1920 MP4 • {t('fade350ms')} • {t('syncedRecitation')}</span>
            </div>

            <button
              type="button"
              disabled={isGenerating || isSubmitting}
              onClick={handleGenerate}
              className="w-full sm:w-auto min-w-[220px] px-6 py-4 bg-[#f2f2f0] hover:bg-white text-black font-mono text-xs uppercase font-semibold tracking-wider flex items-center justify-center gap-2.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Film className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? t('initializing') : t('generateVideo')}</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#161614] py-8 text-center text-xs text-[#555550] font-mono">
        <p>{t('appTitle')} • 1080×1920 MP4 • Quran Foundation API</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}

