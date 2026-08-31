export interface Surah {
  id: number;
  name_simple: string;
  name_arabic: string;
  name_english: string;
  verses_count: number;
  revelation_place: 'makkah' | 'madinah';
  bismillah_pre: boolean;
}

export interface Reciter {
  id: number | string;
  name: string;
  name_arabic: string;
  style: string;
  description: string;
  sample_url?: string;
}

export interface VerseItem {
  id: number;
  verse_key: string;
  verse_number: number;
  text_uthmani: string;
  translation?: string;
}

export interface BackgroundOption {
  id: 'black' | 'water' | 'forest' | 'clouds' | 'rain';
  name: string;
  category: 'solid' | 'nature';
  description: string;
  previewUrl: string;
}

export interface VideoJob {
  jobId: string;
  surah: number;
  surahNameSimple: string;
  surahNameArabic: string;
  startVerse: number;
  endVerse: number;
  reciterId: number | string;
  reciterName: string;
  background?: string;
  status: 'queued' | 'processing' | 'complete' | 'error';
  stage: string;
  progress: number;
  message: string;
  videoUrl?: string;
  downloadUrl?: string;
  duration?: number;
  fileSize?: number;
  verseCount?: number;
  error?: string;
  createdAt: number;
}
