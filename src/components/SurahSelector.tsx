import React, { useState, useRef, useEffect } from 'react';
import { Surah } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Search, ChevronDown, Check } from 'lucide-react';

interface SurahSelectorProps {
  surahs: Surah[];
  selectedSurah: Surah;
  onSelectSurah: (surah: Surah) => void;
  disabled?: boolean;
}

export const SurahSelector: React.FC<SurahSelectorProps> = ({
  surahs,
  selectedSurah,
  onSelectSurah,
  disabled = false,
}) => {
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredSurahs = surahs.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.id.toString() === q ||
      s.name_simple.toLowerCase().includes(q) ||
      s.name_english.toLowerCase().includes(q) ||
      s.name_arabic.includes(q)
    );
  });

  const popularSurahIds = [1, 18, 36, 55, 67, 112, 113, 114];
  const quickSurahs = surahs.filter((s) => popularSurahIds.includes(s.id));

  return (
    <div className="space-y-4" ref={dropdownRef}>
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] font-mono tracking-widest uppercase text-[#737370]">
          {t('section01')}
        </label>
        <span className="text-xs text-[#737370] font-mono">
          {selectedSurah.id} {t('surahCountOf')}
        </span>
      </div>

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full text-left p-4 rounded-none border transition-colors flex items-center justify-between ${
            isOpen
              ? 'border-[#f2f2f0] bg-[#121212]'
              : 'border-[#222220] hover:border-[#444440] bg-[#0a0a0a]'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-4 min-w-0">
            <span className="text-xl sm:text-2xl font-mono font-medium text-[#737370] shrink-0">
              {String(selectedSurah.id).padStart(3, '0')}
            </span>
            <div className="truncate">
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-medium tracking-tight text-[#f2f2f0]">
                  {selectedSurah.name_simple}
                </span>
                <span className="text-xs text-[#737370] hidden sm:inline">
                  — {selectedSurah.name_english}
                </span>
              </div>
              <div className="text-xs text-[#737370] font-mono mt-0.5">
                {selectedSurah.verses_count} {t('versesCount')} • {selectedSurah.revelation_place.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 mx-2">
            <span className="text-2xl sm:text-3xl font-serif text-[#f2f2f0] font-normal" dir="rtl">
              سُورَةُ {selectedSurah.name_arabic}
            </span>
            <ChevronDown className={`w-4 h-4 text-[#737370] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-[#0d0d0d] border border-[#333330] rounded-none shadow-2xl overflow-hidden max-h-96 flex flex-col">
            <div className="p-3 border-b border-[#222220] bg-[#070707]">
              <div className="relative">
                <Search className={`w-3.5 h-3.5 text-[#737370] absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'right-3' : 'left-3'}`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchSurahPlaceholder')}
                  className={`w-full bg-[#121212] border border-[#262626] rounded-none py-2 text-xs text-[#f2f2f0] placeholder-[#555550] focus:outline-none focus:border-[#f2f2f0] ${
                    lang === 'ar' ? 'pr-8 pl-3' : 'pl-8 pr-3'
                  }`}
                />
              </div>
            </div>

            <div className="overflow-y-auto divide-y divide-[#181818] p-1">
              {filteredSurahs.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#737370] font-mono">
                  {t('noSurahFound')} "{searchQuery}"
                </div>
              ) : (
                filteredSurahs.map((surah) => {
                  const isSelected = surah.id === selectedSurah.id;
                  return (
                    <button
                      key={surah.id}
                      type="button"
                      onClick={() => {
                        onSelectSurah(surah);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full p-3 text-left flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-[#1a1a1a] text-[#f2f2f0]'
                          : 'hover:bg-[#141414] text-[#b5b5b0]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-[#737370] w-7">
                          {String(surah.id).padStart(3, '0')}
                        </span>
                        <div>
                          <div className="text-xs font-medium text-[#f2f2f0]">
                            {surah.name_simple} <span className="text-[#737370] font-normal font-sans">({surah.name_english})</span>
                          </div>
                          <div className="text-[11px] text-[#737370] font-mono">
                            {surah.verses_count} {t('ayahsCount')} • {surah.revelation_place}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-serif text-[#f2f2f0]" dir="rtl">
                          {surah.name_arabic}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#f2f2f0] shrink-0" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick selection presets */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] text-[#737370] font-mono mx-1">{t('quick')}</span>
        {quickSurahs.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectSurah(s)}
            className={`text-[11px] font-mono px-2 py-1 rounded-none border transition-colors ${
              s.id === selectedSurah.id
                ? 'border-[#f2f2f0] text-[#f2f2f0] bg-[#1c1c1a]'
                : 'border-[#222220] text-[#737370] hover:text-[#f2f2f0] hover:border-[#444440] bg-[#0a0a0a]'
            }`}
          >
            {s.name_simple}
          </button>
        ))}
      </div>
    </div>
  );
};

