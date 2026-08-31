import React from 'react';
import { VerseItem, Surah } from '../types.ts';
import { arabicNumToEastern } from '../utils/arabic.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface VersePreviewProps {
  surah: Surah;
  verses: VerseItem[];
  startVerse: number;
  endVerse: number;
  selectedBg: string;
  loading?: boolean;
}

export const VersePreview: React.FC<VersePreviewProps> = ({
  surah,
  verses,
  startVerse,
  endVerse,
  selectedBg,
  loading = false,
}) => {
  const { t } = useLanguage();
  const selectedVerses = verses.filter(
    (v) => v.verse_number >= startVerse && v.verse_number <= endVerse
  );

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] font-mono tracking-widest uppercase text-[#737370]">
          {t('section05')}
        </label>
        <span className="text-xs text-[#737370] font-mono">
          {selectedVerses.length} {selectedVerses.length === 1 ? t('ayahSelected') : t('ayahsSelected')}
        </span>
      </div>

      {/* Frame Preview container styled like 9:16 canvas preview */}
      <div className="relative border border-[#222220] bg-[#050505] overflow-hidden min-h-[260px] flex flex-col justify-between p-6 sm:p-8">
        {/* If nature background, show dimmed background image preview */}
        {selectedBg !== 'black' && (
          <div className="absolute inset-0 z-0">
            <img
              src={`/backgrounds/${selectedBg}.jpg`}
              alt="Background preview"
              className="w-full h-full object-cover opacity-35 filter blur-[0.5px]"
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[0.5px]" />
          </div>
        )}

        <div className="relative z-10">
          {/* Header Badge */}
          <div className="text-center mb-6">
            <div className="text-[11px] font-mono tracking-widest text-[#737370] uppercase">
              {surah.name_simple} • {surah.name_english}
            </div>
            <div className="text-xl font-serif text-[#a0a09e] mt-1" dir="rtl">
              سُورَةُ {surah.name_arabic}
            </div>
            {surah.bismillah_pre && startVerse === 1 && (
              <div className="text-lg font-serif text-[#737370] mt-2" dir="rtl">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </div>
            )}
          </div>

          {/* Verses stream */}
          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-[#737370]">
              {t('fetchingUthmani')}
            </div>
          ) : selectedVerses.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[#737370]">
              {t('noVersesLoaded')}
            </div>
          ) : (
            <div className="space-y-6 max-h-72 overflow-y-auto pr-2" dir="rtl">
              {selectedVerses.map((v) => (
                <div
                  key={v.verse_key}
                  className="p-3 border-r-2 border-[#333330] bg-black/40 backdrop-blur-sm"
                >
                  <p className="text-xl sm:text-2xl font-serif leading-loose text-[#f2f2f0] text-right font-normal">
                    {v.text_uthmani}{' '}
                    <span className="text-[#a0a09e] font-serif text-lg inline-block mr-1">
                      ﴿{arabicNumToEastern(v.verse_number)}﴾
                    </span>
                  </p>
                  {v.translation && (
                    <p className="text-xs sm:text-sm font-sans text-[#a1a1aa] mt-2 text-left leading-relaxed font-light" dir="ltr">
                      {v.translation}
                    </p>
                  )}
                  <div className="text-[10px] font-mono text-[#737370] mt-2 text-left" dir="ltr">
                    Ayah {v.verse_number} {t('ayahOf')} {surah.verses_count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-4 mt-4 border-t border-[#1a1a18] flex items-center justify-between text-[10px] font-mono text-[#737370]">
          <span>{t('renderTag')}</span>
          <span>{t('fadeTag')}</span>
        </div>
      </div>
    </div>
  );
};

