import React from 'react';
import { VideoJob } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Loader2, AlertCircle } from 'lucide-react';

interface GenerationProgressProps {
  job: VideoJob;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({ job }) => {
  const { t } = useLanguage();
  const isError = job.status === 'error';

  return (
    <div className="border border-[#222220] bg-[#0a0a0a] p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isError ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <Loader2 className="w-4 h-4 text-[#f2f2f0] animate-spin" />
          )}
          <span className="text-xs font-mono uppercase tracking-wider text-[#f2f2f0]">
            {isError ? t('generationError') : t('renderingPipeline')}
          </span>
        </div>

        <span className="text-xs font-mono font-medium text-[#f2f2f0]">
          {job.progress}%
        </span>
      </div>

      {/* Monochrome Progress Bar */}
      <div className="w-full h-1 bg-[#1c1c1c] overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isError ? 'bg-red-500' : 'bg-[#f2f2f0]'
          }`}
          style={{ width: `${Math.max(5, job.progress)}%` }}
        />
      </div>

      <div className="space-y-1">
        <p className="text-xs text-[#b5b5b0] font-mono leading-relaxed">
          {job.message}
        </p>
        <p className="text-[10px] text-[#737370] font-mono">
          {t('stageLabel')} {job.stage} • {job.surahNameSimple} ({job.startVerse}–{job.endVerse}) • {job.reciterName}
        </p>
      </div>

      {isError && job.error && (
        <div className="p-3 bg-red-950/30 border border-red-900/50 text-[11px] font-mono text-red-300">
          {job.error}
        </div>
      )}
    </div>
  );
};

