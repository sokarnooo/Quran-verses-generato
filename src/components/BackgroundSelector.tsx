import React from 'react';
import { BackgroundOption } from '../types.ts';
import { BACKGROUND_OPTIONS } from '../data/quranData.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Check } from 'lucide-react';

interface BackgroundSelectorProps {
  selectedBg: string;
  onSelectBg: (bgId: 'black' | 'water' | 'forest' | 'clouds' | 'rain') => void;
  disabled?: boolean;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  selectedBg,
  onSelectBg,
  disabled = false,
}) => {
  const { lang, t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] font-mono tracking-widest uppercase text-[#737370]">
          {t('section04')}
        </label>
        <span className="text-xs text-[#737370] font-mono">
          {selectedBg === 'black' ? t('solidMinimal') : t('loopingNature')}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {BACKGROUND_OPTIONS.map((bg) => {
          const isSelected = selectedBg === bg.id;

          return (
            <button
              key={bg.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectBg(bg.id)}
              className={`group transition-all duration-150 p-2.5 rounded-none border flex flex-col justify-between ${
                lang === 'ar' ? 'text-right' : 'text-left'
              } ${
                isSelected
                  ? 'border-[#f2f2f0] bg-[#141414]'
                  : 'border-[#222220] hover:border-[#444440] bg-[#0c0c0c]'
              } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Thumbnail preview aspect 9:16 miniature */}
              <div className="relative w-full aspect-[9/16] bg-[#050505] overflow-hidden border border-[#222220] mb-2.5">
                {bg.id === 'black' ? (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#444440]">
                      {t('blackBg')}
                    </span>
                  </div>
                ) : (
                  <img
                    src={bg.previewUrl}
                    alt={bg.name}
                    className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-90"
                    onError={(e) => {
                      // Fallback visual if image loading
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                )}

                {/* Selected Indicator */}
                {isSelected && (
                  <div className={`absolute top-1.5 w-4 h-4 bg-[#f2f2f0] text-black flex items-center justify-center ${
                    lang === 'ar' ? 'left-1.5' : 'right-1.5'
                  }`}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Dim overlay preview tag */}
                {bg.id !== 'black' && (
                  <div className={`absolute bottom-1 px-1 py-0.5 bg-black/80 text-[9px] font-mono text-[#a0a09e] ${
                    lang === 'ar' ? 'right-1' : 'left-1'
                  }`}>
                    {t('dimmed')}
                  </div>
                )}
              </div>

              {/* Title and Category */}
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs font-medium tracking-tight ${isSelected ? 'text-[#f2f2f0]' : 'text-[#b5b5b0]'}`}>
                    {bg.name}
                  </span>
                </div>
                <p className="text-[10px] text-[#737370] leading-tight mt-0.5 line-clamp-2">
                  {bg.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

