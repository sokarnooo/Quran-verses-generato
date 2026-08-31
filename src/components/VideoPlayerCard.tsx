import React, { useEffect, useRef, useState } from 'react';
import { VideoJob } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Download, RefreshCw, Loader2, Check, AlertCircle } from 'lucide-react';

interface VideoPlayerCardProps {
  job: VideoJob;
  onReset: () => void;
}

export const VideoPlayerCard: React.FC<VideoPlayerCardProps> = ({ job, onReset }) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (sec?: number) => {
    if (!sec) return '—';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Pre-fetch the generated video as an in-memory Blob for instant playback and reliable in-page download
  useEffect(() => {
    let isMounted = true;
    let activeBlobUrl: string | null = null;

    const fetchVideoBlob = async () => {
      const targetUrl = job.videoUrl || (job.jobId ? `/api/download/${job.jobId}` : null);
      if (!targetUrl) return;

      try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
          throw new Error(`Failed to load video file (status ${response.status})`);
        }
        const blob = await response.blob();
        if (isMounted) {
          activeBlobUrl = URL.createObjectURL(blob);
          setBlobUrl(activeBlobUrl);
        }
      } catch (err) {
        console.warn('Direct blob fetch failed, fallback to relative path:', err);
      }
    };

    fetchVideoBlob();

    return () => {
      isMounted = false;
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
      }
    };
  }, [job.videoUrl, job.jobId]);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(false);

    const safeFilename = `Quran_${job.surahNameSimple || 'Surah'}_${job.startVerse}-${job.endVerse}_${(job.reciterName || 'Reciter').replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;

    try {
      let currentBlobUrl = blobUrl;

      // If blob is not cached yet, fetch on-the-fly inside the page
      if (!currentBlobUrl) {
        const targetUrl = job.videoUrl || `/api/download/${job.jobId}`;
        const response = await fetch(targetUrl);
        if (!response.ok) {
          throw new Error(`Download request failed with status ${response.status}`);
        }
        const blob = await response.blob();
        currentBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(currentBlobUrl);
      }

      // Trigger programmatic download via hidden element
      const anchor = document.createElement('a');
      anchor.style.display = 'none';
      anchor.href = currentBlobUrl;
      anchor.download = safeFilename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      console.error('In-page video download error:', err);
      setDownloadError(err.message || t('downloadFailed'));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] font-mono tracking-widest uppercase text-[#737370]">
          {t('generatedOutput')}
        </label>
        <span className="text-xs text-[#737370] font-mono">
          {t('readyForDownload')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* 9:16 Video Player Container */}
        <div className="md:col-span-6 lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-[320px] aspect-[9/16] bg-black border border-[#333330] overflow-hidden shadow-2xl">
            <video
              ref={videoRef}
              src={blobUrl || job.videoUrl}
              controls
              autoPlay
              playsInline
              loop
              className="w-full h-full object-contain bg-black"
            />
          </div>
        </div>

        {/* Video metadata and actions */}
        <div className="md:col-span-6 lg:col-span-7 space-y-6">
          <div className="border border-[#222220] bg-[#0a0a0a] p-5 space-y-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#737370]">
                {t('surahAndVerses')}
              </div>
              <div className="text-xl font-medium text-[#f2f2f0] mt-0.5">
                Surah {job.surahNameSimple} ({job.startVerse}–{job.endVerse})
              </div>
              <div className="text-sm font-serif text-[#737370] mt-0.5" dir="rtl">
                سورة {job.surahNameArabic}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#181818] text-xs font-mono">
              <div>
                <span className="text-[#737370] block text-[10px]">{t('recitingQari')}</span>
                <span className="text-[#f2f2f0]">{job.reciterName}</span>
              </div>
              <div>
                <span className="text-[#737370] block text-[10px]">{t('backgroundLabel')}</span>
                <span className="text-[#f2f2f0] capitalize">{job.background || t('solidMinimal')}</span>
              </div>
              <div>
                <span className="text-[#737370] block text-[10px]">{t('resolutionLabel')}</span>
                <span className="text-[#f2f2f0]">1080 × 1920 (9:16)</span>
              </div>
              <div>
                <span className="text-[#737370] block text-[10px]">{t('durationLabel')}</span>
                <span className="text-[#f2f2f0]">{formatDuration(job.duration)}</span>
              </div>
              <div>
                <span className="text-[#737370] block text-[10px]">{t('fileSizeLabel')}</span>
                <span className="text-[#f2f2f0]">{formatFileSize(job.fileSize)}</span>
              </div>
              <div>
                <span className="text-[#737370] block text-[10px]">{t('transitionLabel')}</span>
                <span className="text-[#f2f2f0]">{t('fade350ms')}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full py-3.5 px-4 bg-[#f2f2f0] hover:bg-white disabled:bg-[#333330] disabled:text-[#888] text-black font-medium text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('preparingDownload')}
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  {t('downloadMp4')} ({formatFileSize(job.fileSize)})
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  {t('downloadMp4')} ({formatFileSize(job.fileSize)})
                </>
              )}
            </button>

            {downloadError && (
              <div className="p-3 bg-red-950/40 border border-red-900/60 text-red-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{downloadError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={onReset}
              className="w-full py-3 px-4 border border-[#333330] hover:border-[#666] text-[#b5b5b0] hover:text-[#f2f2f0] text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors bg-[#0a0a0a]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('generateAnother')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


