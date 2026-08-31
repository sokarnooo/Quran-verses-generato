import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Surah } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Minus, Plus } from 'lucide-react';

interface VerseRangeSelectorProps {
  surah: Surah;
  startVerse: number;
  endVerse: number;
  onStartVerseChange: (val: number) => void;
  onEndVerseChange: (val: number) => void;
  disabled?: boolean;
}

function usePressAndHold(action: () => void, disabled: boolean) {
  const actionRef = useRef(action);
  actionRef.current = action;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      stop();
      actionRef.current();

      let speed = 180;
      const repeat = () => {
        actionRef.current();
        speed = Math.max(25, speed * 0.82);
        intervalRef.current = setTimeout(repeat, speed);
      };

      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setTimeout(repeat, speed);
      }, 300);
    },
    [disabled, stop]
  );

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
  };
}

export const VerseRangeSelector: React.FC<VerseRangeSelectorProps> = ({
  surah,
  startVerse,
  endVerse,
  onStartVerseChange,
  onEndVerseChange,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const totalVerses = surah.verses_count;
  const count = endVerse - startVerse + 1;

  const [startVal, setStartVal] = useState<string>(String(startVerse));
  const [endVal, setEndVal] = useState<string>(String(endVerse));

  useEffect(() => {
    setStartVal(String(startVerse));
  }, [startVerse]);

  useEffect(() => {
    setEndVal(String(endVerse));
  }, [endVerse]);

  const handleStartChange = (newVal: number) => {
    const clamped = Math.max(1, Math.min(newVal, totalVerses));
    onStartVerseChange(clamped);
    if (clamped > endVerse) {
      onEndVerseChange(clamped);
    }
  };

  const handleEndChange = (newVal: number) => {
    const clamped = Math.max(startVerse, Math.min(newVal, totalVerses));
    onEndVerseChange(clamped);
  };

  const commitStartVal = (valStr: string) => {
    const num = parseInt(valStr, 10);
    if (isNaN(num)) {
      setStartVal(String(startVerse));
      return;
    }
    const clamped = Math.max(1, Math.min(num, totalVerses));
    onStartVerseChange(clamped);
    if (clamped > endVerse) {
      onEndVerseChange(clamped);
    }
    setStartVal(String(clamped));
  };

  const commitEndVal = (valStr: string) => {
    const num = parseInt(valStr, 10);
    if (isNaN(num)) {
      setEndVal(String(endVerse));
      return;
    }
    const clamped = Math.max(startVerse, Math.min(num, totalVerses));
    onEndVerseChange(clamped);
    setEndVal(String(clamped));
  };

  const startMinusEvents = usePressAndHold(
    () => handleStartChange(startVerse - 1),
    disabled || startVerse <= 1
  );

  const startPlusEvents = usePressAndHold(
    () => handleStartChange(startVerse + 1),
    disabled || startVerse >= totalVerses
  );

  const endMinusEvents = usePressAndHold(
    () => handleEndChange(endVerse - 1),
    disabled || endVerse <= startVerse
  );

  const endPlusEvents = usePressAndHold(
    () => handleEndChange(endVerse + 1),
    disabled || endVerse >= totalVerses
  );

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] font-mono tracking-widest uppercase text-[#737370]">
          {t('section02')}
        </label>
        <span className="text-xs text-[#737370] font-mono">
          {count} {count === 1 ? t('ayahSelected') : t('ayahsSelected')} (1–{totalVerses})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Start Verse Stepper & Direct Entry */}
        <div className="border border-[#222220] bg-[#0a0a0a] p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#737370]">
              {t('startAyah')}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min={1}
                max={totalVerses}
                disabled={disabled}
                value={startVal}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartVal(val);
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num >= 1 && num <= totalVerses) {
                    onStartVerseChange(num);
                    if (num > endVerse) {
                      onEndVerseChange(num);
                    }
                  }
                }}
                onBlur={(e) => commitStartVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitStartVal(startVal);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                onFocus={(e) => e.target.select()}
                className="w-20 sm:w-24 text-2xl sm:text-3xl font-mono font-medium text-[#f2f2f0] bg-transparent border-b-2 border-[#333330] hover:border-[#666660] focus:border-[#f2f2f0] focus:bg-[#141414] focus:outline-none transition-all px-1 py-0.5 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="text-[10px] font-mono text-[#555550] mt-1">
              (1 – {totalVerses})
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={disabled || startVerse <= 1}
              {...startMinusEvents}
              className="w-9 h-9 border border-[#262626] hover:border-[#555] disabled:opacity-30 disabled:hover:border-[#262626] flex items-center justify-center text-[#f2f2f0] transition-colors select-none touch-none"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled || startVerse >= totalVerses}
              {...startPlusEvents}
              className="w-9 h-9 border border-[#262626] hover:border-[#555] disabled:opacity-30 disabled:hover:border-[#262626] flex items-center justify-center text-[#f2f2f0] transition-colors select-none touch-none"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* End Verse Stepper & Direct Entry */}
        <div className="border border-[#222220] bg-[#0a0a0a] p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#737370]">
              {t('endAyah')}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min={startVerse}
                max={totalVerses}
                disabled={disabled}
                value={endVal}
                onChange={(e) => {
                  const val = e.target.value;
                  setEndVal(val);
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num >= startVerse && num <= totalVerses) {
                    onEndVerseChange(num);
                  }
                }}
                onBlur={(e) => commitEndVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitEndVal(endVal);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                onFocus={(e) => e.target.select()}
                className="w-20 sm:w-24 text-2xl sm:text-3xl font-mono font-medium text-[#f2f2f0] bg-transparent border-b-2 border-[#333330] hover:border-[#666660] focus:border-[#f2f2f0] focus:bg-[#141414] focus:outline-none transition-all px-1 py-0.5 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="text-[10px] font-mono text-[#555550] mt-1">
              ({startVerse} – {totalVerses})
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={disabled || endVerse <= startVerse}
              {...endMinusEvents}
              className="w-9 h-9 border border-[#262626] hover:border-[#555] disabled:opacity-30 disabled:hover:border-[#262626] flex items-center justify-center text-[#f2f2f0] transition-colors select-none touch-none"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled || endVerse >= totalVerses}
              {...endPlusEvents}
              className="w-9 h-9 border border-[#262626] hover:border-[#555] disabled:opacity-30 disabled:hover:border-[#262626] flex items-center justify-center text-[#f2f2f0] transition-colors select-none touch-none"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Preset shortcuts */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] text-[#737370] font-mono mx-1">{t('presets')}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onStartVerseChange(1);
            onEndVerseChange(Math.min(3, totalVerses));
          }}
          className="text-[11px] font-mono px-2 py-1 border border-[#222220] text-[#737370] hover:text-[#f2f2f0] hover:border-[#444440] bg-[#0a0a0a] transition-colors"
        >
          {t('firstNAyahs', { n: Math.min(3, totalVerses) })}
        </button>

        {totalVerses >= 5 && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onStartVerseChange(1);
              onEndVerseChange(5);
            }}
            className="text-[11px] font-mono px-2 py-1 border border-[#222220] text-[#737370] hover:text-[#f2f2f0] hover:border-[#444440] bg-[#0a0a0a] transition-colors"
          >
            {t('firstNAyahs', { n: 5 })}
          </button>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onStartVerseChange(1);
            onEndVerseChange(totalVerses);
          }}
          className="text-[11px] font-mono px-2 py-1 border border-[#222220] text-[#737370] hover:text-[#f2f2f0] hover:border-[#444440] bg-[#0a0a0a] transition-colors"
        >
          {t('allNAyahs', { n: totalVerses })}
        </button>
      </div>
    </div>
  );
};

