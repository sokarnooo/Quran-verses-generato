export type Language = 'en' | 'ar';

export const translations = {
  en: {
    // Header
    appTitle: 'Quran Verse Video Generator',
    appSubtitle: 'Synchronized Arabic Uthmani scripture on 1080×1920 portrait canvas with reciter audio',
    amiriFont: 'Amiri Quran OpenType',
    toggleLangBtn: 'EN / ع',

    // Sections
    section01: '01 — Surah (Chapter)',
    section02: '02 — Verse Range',
    section03: '03 — Reciter (Qari)',
    section04: '04 — Visual Background',
    section05: '05 — Scripture Frame Preview',
    generatedOutput: 'Generated Output Video',

    // Surah Selector
    surahCountOf: 'of 114',
    versesCount: 'Verses',
    ayahsCount: 'Ayahs',
    searchSurahPlaceholder: 'Search by chapter number or title (e.g. 112, Al-Ikhlas)...',
    noSurahFound: 'No Surah found matching',
    quick: 'Quick:',

    // Verse Range Selector
    startAyah: 'Start Ayah',
    endAyah: 'End Ayah',
    ayahSelected: 'Ayah selected',
    ayahsSelected: 'Ayahs selected',
    presets: 'Presets:',
    firstNAyahs: 'First {n} Ayahs',
    allNAyahs: 'All {n} Ayahs',

    // Reciter Selector
    verified: 'verified',
    selectedReciterLabel: 'Selected:',
    all: 'All',
    murattal: 'Murattal',
    mujawwad: 'Mujawwad',
    muallim: 'Muallim',
    searchRecitersPlaceholder: 'Search reciters...',
    noReciterFound: 'No reciters found matching',

    // Background Selector
    solidMinimal: 'Solid Minimal',
    loopingNature: 'Looping Nature Video (Dimmed)',
    blackBg: 'BLACK',
    dimmed: '50% DIM',

    // Verse Preview
    fetchingUthmani: 'Fetching Uthmani text from Quran API...',
    noVersesLoaded: 'No verses loaded.',
    ayahOf: 'of',
    renderTag: 'RENDER: NATIVE HARFBUZZ / RAQM OPEN-TYPE',
    fadeTag: 'FADE TRANSITION: 350MS',

    // Progress & Status
    renderingPipeline: 'Rendering Video Pipeline',
    generationError: 'Generation Error',
    stageLabel: 'Stage:',
    errorLabel: 'Error:',

    // Video Output Card
    readyForDownload: 'Ready for download',
    surahAndVerses: 'Surah & Verses',
    recitingQari: 'RECITING QARI',
    backgroundLabel: 'BACKGROUND',
    resolutionLabel: 'RESOLUTION',
    durationLabel: 'DURATION',
    fileSizeLabel: 'FILE SIZE',
    transitionLabel: 'TRANSITION',
    fade350ms: '350ms Ayah Fade',
    downloadMp4: 'Download MP4 Video',
    preparingDownload: 'Preparing Download...',
    downloadFailed: 'Download failed, click to retry',
    generateAnother: 'Generate Another Video',

    // Actions & Buttons
    generateVideo: 'Generate Video',
    initializing: 'Initializing...',
    syncedRecitation: 'Synced Recitation',
    specsFooter: '1080×1920 MP4 • 350ms Ayah Fade • Synced Recitation',
    footerText: 'Quran Verse Video Generator • 1080×1920 MP4 • Quran Foundation API',
  },
  ar: {
    // Header
    appTitle: 'مولد فيديوهات الآيات القرآنية',
    appSubtitle: 'نص قرآني عثماني متزامن على لوحة عمودية 1080×1920 مع صوت القارئ',
    amiriFont: 'خط الأميري القرآني',
    toggleLangBtn: 'ع / EN',

    // Sections
    section01: '01 — السورة',
    section02: '02 — نطاق الآيات',
    section03: '03 — القارئ',
    section04: '04 — الخلفية المرئية',
    section05: '05 — معاينة إطار الآيات',
    generatedOutput: 'الفيديو الناتج',

    // Surah Selector
    surahCountOf: 'من 114',
    versesCount: 'آية',
    ayahsCount: 'آيات',
    searchSurahPlaceholder: 'ابحث برقم السورة أو اسمها (مثال: 112، الإخلاص)...',
    noSurahFound: 'لم يتم العثور على سورة تطابق',
    quick: 'السور الشائعة:',

    // Verse Range Selector
    startAyah: 'آية البداية',
    endAyah: 'آية النهاية',
    ayahSelected: 'آية مختارة',
    ayahsSelected: 'آيات مختارة',
    presets: 'اختصارات:',
    firstNAyahs: 'أول {n} آيات',
    allNAyahs: 'جميع الـ {n} آية',

    // Reciter Selector
    verified: 'مُعتمَد',
    selectedReciterLabel: 'المختار:',
    all: 'الكل',
    murattal: 'مرتل',
    mujawwad: 'مجود',
    muallim: 'معلم',
    searchRecitersPlaceholder: 'البحث عن القراء...',
    noReciterFound: 'لم يتم العثور على قارئ يطابق',

    // Background Selector
    solidMinimal: 'خلفية سوداء مبسطة',
    loopingNature: 'فيديو طبيعة متكرر (معتم)',
    blackBg: 'سوداء',
    dimmed: 'إعتام 50%',

    // Verse Preview
    fetchingUthmani: 'جاري جلب الرسم العثماني من مكتبة القرآن الكريم...',
    noVersesLoaded: 'لم يتم تحميل أي آيات.',
    ayahOf: 'من',
    renderTag: 'العرض: نمط الخط القرآني العثماني',
    fadeTag: 'الانتقال: تلاشي 350 مللي ثانية',

    // Progress & Status
    renderingPipeline: 'جاري معالجة فيديو التلاوة',
    generationError: 'خطأ في إنشاء الفيديو',
    stageLabel: 'المرحلة:',
    errorLabel: 'خطأ:',

    // Video Output Card
    readyForDownload: 'جاهز للتحميل',
    surahAndVerses: 'السورة والآيات',
    recitingQari: 'القارئ',
    backgroundLabel: 'الخلفية',
    resolutionLabel: 'الدقة',
    durationLabel: 'المدة',
    fileSizeLabel: 'حجم الملف',
    transitionLabel: 'الانتقال',
    fade350ms: 'تلاوة متزامنة مع تلاشي 350 مللي ثانية',
    downloadMp4: 'تحميل فيديو MP4',
    preparingDownload: 'جاري تجهيز التحميل...',
    downloadFailed: 'فشل التحميل، انقر للمحاولة ثانية',
    generateAnother: 'إنشاء فيديو آخر',

    // Actions & Buttons
    generateVideo: 'إنشاء الفيديو',
    initializing: 'جاري البدء...',
    syncedRecitation: 'تلاوة متزامنة',
    specsFooter: 'MP4 1080×1920 • تلاشي 350 مللي ثانية • تلاوة متزامنة',
    footerText: 'مولد فيديوهات الآيات القرآنية • MP4 1080×1920 • مكتبة القرآن الكريم',
  },
};
