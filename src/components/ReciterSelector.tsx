import React, { useState, useRef, useMemo } from 'react';
import { Reciter } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Play, Square, Check, Search } from 'lucide-react';

interface ReciterSelectorProps {
  reciters: Reciter[];
  selectedReciter: Reciter;
  onSelectReciter: (reciter: Reciter) => void;
  disabled?: boolean;
}

export const ReciterSelector: React.FC<ReciterSelectorProps> = ({
  reciters,
  selectedReciter,
  onSelectReciter,
  disabled = false,
}) => {
  const { lang, t } = useLanguage();
  const [playingId, setPlayingId] = useState<number | string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'Murattal' | 'Mujawwad' | 'Muallim'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleSample = (e: React.MouseEvent, reciter: Reciter) => {
    e.stopPropagation();
    if (!reciter.sample_url) return;

    if (playingId === reciter.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(reciter.sample_url);
      audioRef.current = audio;
      audio.play().catch(() => {});
      setPlayingId(reciter.id);

      audio.onended = () => {
        setPlayingId(null);
      };
    }
  };

  const filteredReciters = useMemo(() => {
    return reciters.filter((r) => {
      const matchesFilter = activeFilter === 'ALL' || r.style.toLowerCase() === activeFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        r.name.toLowerCase().includes(q) ||
        r.name_arabic.includes(q) ||
        r.description.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [reciters, activeFilter, searchQuery]);

  const styleCounts = useMemo(() => {
    const counts = { ALL: reciters.length, Murattal: 0, Mujawwad: 0, Muallim: 0 };
    for (const r of reciters) {
      if (r.style === 'Murattal') counts.Murattal++;
      else if (r.style === 'Mujawwad') counts.Mujawwad++;
      else if (r.style === 'Muallim') counts.Muallim++;
    }
    return counts;
  }, [reciters]);

  const getFilterLabel = (filter: 'ALL' | 'Murattal' | 'Mujawwad' | 'Muallim') => {
    if (filter === 'ALL') return t('all');
    if (filter === 'Murattal') return t('murattal');
    if (filter === 'Mujawwad') return t('mujawwad');
    if (filter === 'Muallim') return t('muallim');
    return filter;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-mono tracking-widest uppercase text-[#737370]">
            {t('section03')}
          </label>
          <span className="text-[10px] font-mono text-[#555552] border border-[#222220] px-1.5 py-0.5">
            {reciters.length} {t('verified')}
          </span>
        </div>
        <span className="text-xs text-[#737370] font-mono">
          {t('selectedReciterLabel')} <span className="text-[#f2f2f0]">{selectedReciter.name}</span> ({selectedReciter.style})
        </span>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1">
          {(['ALL', 'Murattal', 'Mujawwad', 'Muallim'] as const).map((filter) => {
            const isFilterActive = activeFilter === filter;
            const count = styleCounts[filter] || 0;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`text-[11px] font-mono px-2.5 py-1 transition-colors border ${
                  isFilterActive
                    ? 'border-[#f2f2f0] bg-[#f2f2f0] text-black font-semibold'
                    : 'border-[#222220] text-[#737370] hover:text-[#f2f2f0] hover:border-[#333330] bg-[#0c0c0c]'
                }`}
              >
                {getFilterLabel(filter)} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchRecitersPlaceholder')}
            className={`w-40 sm:w-48 bg-[#0c0c0c] border border-[#222220] text-xs text-[#f2f2f0] placeholder-[#555552] py-1 focus:outline-none focus:border-[#444440] ${
              lang === 'ar' ? 'pr-2.5 pl-7' : 'pl-2.5 pr-7'
            }`}
          />
          <Search className={`w-3.5 h-3.5 text-[#555552] absolute top-2 pointer-events-none ${
            lang === 'ar' ? 'left-2' : 'right-2'
          }`} />
        </div>
      </div>

      {/* Reciters scrollable grid */}
      <div className="max-h-[460px] overflow-y-auto pr-1 space-y-2 select-none scrollbar-thin scrollbar-thumb-[#262624] scrollbar-track-transparent">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredReciters.map((reciter) => {
            const isSelected = selectedReciter.id === reciter.id;
            const isPlaying = playingId === reciter.id;

            return (
              <div
                key={reciter.id}
                onClick={() => !disabled && onSelectReciter(reciter)}
                className={`p-3.5 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#f2f2f0] bg-[#141414]'
                    : 'border-[#222220] hover:border-[#444440] bg-[#0a0a0a]'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-[#f2f2f0] tracking-tight truncate">
                      {reciter.name}
                    </div>
                    <div className="text-[11px] text-[#737370] font-serif mt-0.5" dir="rtl">
                      {reciter.name_arabic}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {reciter.sample_url && (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={(e) => toggleSample(e, reciter)}
                        title={isPlaying ? 'Stop voice sample' : 'Listen to voice sample'}
                        className={`w-6 h-6 border flex items-center justify-center transition-colors ${
                          isPlaying
                            ? 'border-[#f2f2f0] bg-[#f2f2f0] text-black'
                            : 'border-[#2a2a28] text-[#737370] hover:text-[#f2f2f0] hover:border-[#555]'
                        }`}
                      >
                        {isPlaying ? (
                          <Square className="w-2.5 h-2.5 fill-current" />
                        ) : (
                          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                        )}
                      </button>
                    )}

                    {isSelected && (
                      <div className="w-6 h-6 bg-[#f2f2f0] text-black flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#181818] flex items-center justify-between text-[10px] font-mono text-[#737370]">
                  <span className={`px-1.5 py-0.2 border ${
                    reciter.style === 'Mujawwad'
                      ? 'border-[#453c20] text-[#d4af37] bg-[#1a1708]'
                      : reciter.style === 'Muallim'
                      ? 'border-[#2a3a40] text-[#70b8c8] bg-[#0a1518]'
                      : 'border-[#222220] text-[#888885] bg-[#111110]'
                  }`}>
                    {reciter.style}
                  </span>
                  <span className="truncate max-w-[150px] text-right" title={reciter.description}>
                    {reciter.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredReciters.length === 0 && (
          <div className="py-8 text-center text-xs font-mono text-[#737370] border border-dashed border-[#222220]">
            {t('noReciterFound')} "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
};

