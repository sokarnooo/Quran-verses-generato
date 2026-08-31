import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Globe } from 'lucide-react';

export const Header: React.FC = () => {
  const { lang, toggleLang, t } = useLanguage();

  return (
    <header className="border-b border-[#1e1e1e] bg-[#070707] sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-[#f2f2f0]">
            {t('appTitle')}
          </h1>
          <p className="text-xs text-[#737370] tracking-normal mt-0.5">
            {t('appSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-[#737370] mr-2">
            <span>1080 × 1920 (9:16)</span>
            <span className="text-[#333330]">•</span>
            <span>{t('amiriFont')}</span>
          </div>

          <button
            type="button"
            onClick={toggleLang}
            title={lang === 'en' ? 'التحويل إلى اللغة العربية' : 'Switch to English'}
            className="px-3 py-1.5 border border-[#2e2e2a] hover:border-[#666660] bg-[#0e0e0d] text-[#f2f2f0] text-xs font-mono font-medium tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer select-none"
          >
            <Globe className="w-3.5 h-3.5 text-[#a0a09e]" />
            <span>{t('toggleLangBtn')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

