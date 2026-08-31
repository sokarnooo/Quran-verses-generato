export interface SurahInfo {
  id: number;
  name_simple: string;
  name_arabic: string;
  name_english: string;
  verses_count: number;
  revelation_place: 'makkah' | 'madinah';
  bismillah_pre: boolean;
}

export interface ReciterInfo {
  id: number | string;
  name: string;
  name_arabic: string;
  style: string;
  description: string;
  sample_url?: string;
}

export interface BackgroundInfo {
  id: 'black' | 'water' | 'forest' | 'clouds' | 'rain';
  name: string;
  category: 'solid' | 'nature';
  description: string;
  previewUrl: string;
}

export const BACKGROUND_OPTIONS: BackgroundInfo[] = [
  {
    id: 'black',
    name: 'Solid Black',
    category: 'solid',
    description: 'Pure high-contrast minimalist black canvas',
    previewUrl: '/backgrounds/black.jpg'
  },
  {
    id: 'water',
    name: 'Flowing Stream',
    category: 'nature',
    description: 'Serene rippling river water with subtle specular motion',
    previewUrl: '/backgrounds/water.jpg'
  },
  {
    id: 'forest',
    name: 'Forest Canopy',
    category: 'nature',
    description: 'Deep woodland canopy with gentle atmospheric sway',
    previewUrl: '/backgrounds/forest.jpg'
  },
  {
    id: 'clouds',
    name: 'Drifting Clouds',
    category: 'nature',
    description: 'Ethereal dusk and dawn sky with slow cloud motion',
    previewUrl: '/backgrounds/clouds.jpg'
  },
  {
    id: 'rain',
    name: 'Nocturnal Rain',
    category: 'nature',
    description: 'Calm night rainfall with soft surface ripples',
    previewUrl: '/backgrounds/rain.jpg'
  }
];

export const POPULAR_RECITERS: ReciterInfo[] = [
  {
    id: 7,
    name: "Mishary Rashid Alafasy",
    name_arabic: "مشاري بن راشد العفاسي",
    style: "Murattal",
    description: "Grand Mosque of Kuwait, clear & melodic",
    sample_url: "https://everyayah.com/data/Alafasy_128kbps/001001.mp3"
  },
  {
    id: 2,
    name: "AbdulBaset AbdulSamad",
    name_arabic: "عبد الباسط عبد الصمد",
    style: "Murattal",
    description: "Classic measured pace & textbook Tajweed (Egypt)",
    sample_url: "https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/001001.mp3"
  },
  {
    id: 1,
    name: "AbdulBaset AbdulSamad",
    name_arabic: "عبد الباسط عبد الصمد",
    style: "Mujawwad",
    description: "Golden Voice of Egypt, majestic melodic Tajweed",
    sample_url: "https://everyayah.com/data/Abdul_Basit_Mujawwad_128kbps/001001.mp3"
  },
  {
    id: 6,
    name: "Mahmoud Khalil Al-Husary",
    name_arabic: "محمود خليل الحصري",
    style: "Murattal",
    description: "Pioneering Shaykh of Tajweed, pristine articulation (Egypt)",
    sample_url: "https://everyayah.com/data/Husary_128kbps/001001.mp3"
  },
  {
    id: "husary_mujawwad",
    name: "Mahmoud Khalil Al-Husary",
    name_arabic: "محمود خليل الحصري",
    style: "Mujawwad",
    description: "Classical Egyptian melodic Tajweed cadence",
    sample_url: "https://everyayah.com/data/Husary_128kbps_Mujawwad/001001.mp3"
  },
  {
    id: 12,
    name: "Mahmoud Khalil Al-Husary",
    name_arabic: "محمود خليل الحصري",
    style: "Muallim",
    description: "Educational master recitation with pause intervals",
    sample_url: "https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3"
  },
  {
    id: 9,
    name: "Mohamed Siddiq Al-Minshawi",
    name_arabic: "محمد صديق المنشاوي",
    style: "Murattal",
    description: "Revered Egyptian Qari, deeply poignant smooth delivery",
    sample_url: "https://everyayah.com/data/Minshawy_Murattal_128kbps/001001.mp3"
  },
  {
    id: 8,
    name: "Mohamed Siddiq Al-Minshawi",
    name_arabic: "محمد صديق المنشاوي",
    style: "Mujawwad",
    description: "Soul-stirring melodic recitation filled with deep reverence",
    sample_url: "https://everyayah.com/data/Minshawy_Mujawwad_192kbps/001001.mp3"
  },
  {
    id: 3,
    name: "Abdur-Rahman As-Sudais",
    name_arabic: "عبد الرحمن السديس",
    style: "Murattal",
    description: "Chief Imam of the Grand Mosque of Makkah",
    sample_url: "https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/001001.mp3"
  },
  {
    id: 10,
    name: "Saud Al-Shuraim",
    name_arabic: "سعود الشريم",
    style: "Murattal",
    description: "Former Imam & Khateeb of Masjid al-Haram in Makkah",
    sample_url: "https://everyayah.com/data/Saood_ash-Shuraym_128kbps/001001.mp3"
  },
  {
    id: "maher_almuaiqly",
    name: "Maher Al Muaiqly",
    name_arabic: "ماهر المعيقلي",
    style: "Murattal",
    description: "Imam of Masjid al-Haram in Makkah, heartfelt tone",
    sample_url: "https://everyayah.com/data/MaherAlMuaiqly128kbps/001001.mp3"
  },
  {
    id: 4,
    name: "Abu Bakr Al-Shatri",
    name_arabic: "أبو بكر الشاطري",
    style: "Murattal",
    description: "Jeddah Imam, distinctive warm and resonant pacing",
    sample_url: "https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps/001001.mp3"
  },
  {
    id: "saad_alghamdi",
    name: "Saad Al-Ghamdi",
    name_arabic: "سعد الغامدي",
    style: "Murattal",
    description: "Acclaimed Saudi reciter, rhythmic and uplifting flow",
    sample_url: "https://everyayah.com/data/Ghamadi_40kbps/001001.mp3"
  },
  {
    id: "yasser_aldosari",
    name: "Yasser Al-Dosari",
    name_arabic: "ياسر الدوسري",
    style: "Murattal",
    description: "Imam of the Grand Mosque in Makkah, powerful delivery",
    sample_url: "https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/001001.mp3"
  },
  {
    id: "ali_alhudhaify",
    name: "Ali Al-Hudhaify",
    name_arabic: "علي بن عبد الرحمن الحذيفي",
    style: "Murattal",
    description: "Chief Imam of the Prophet’s Mosque in Madinah",
    sample_url: "https://everyayah.com/data/Hudhaify_128kbps/001001.mp3"
  },
  {
    id: "nasser_alqatami",
    name: "Nasser Al Qatami",
    name_arabic: "ناصر القطامي",
    style: "Murattal",
    description: "Prominent Riyadh Imam with stirring vocal nuance",
    sample_url: "https://everyayah.com/data/Nasser_Alqatami_128kbps/001001.mp3"
  },
  {
    id: "muhammad_ayyub",
    name: "Muhammad Ayyub",
    name_arabic: "محمد أيوب",
    style: "Murattal",
    description: "Renowned Imam of the Prophet’s Mosque in Madinah",
    sample_url: "https://everyayah.com/data/Muhammad_Ayyoub_128kbps/001001.mp3"
  },
  {
    id: "ahmed_alajmy",
    name: "Ahmed Al-Ajmy",
    name_arabic: "أحمد بن علي العجمي",
    style: "Murattal",
    description: "Saudi Qari celebrated for melodic and passionate pace",
    sample_url: "https://everyayah.com/data/ahmed_ibn_ali_al_ajamy_128kbps/001001.mp3"
  },
  {
    id: 5,
    name: "Hani Ar-Rifai",
    name_arabic: "هاني الرفاعي",
    style: "Murattal",
    description: "Imam of Anani Mosque in Jeddah, poignant emotive tone",
    sample_url: "https://everyayah.com/data/Hani_Rifai_192kbps/001001.mp3"
  },
  {
    id: 11,
    name: "Mohamed Al-Tablawi",
    name_arabic: "محمد محمود الطبلاوي",
    style: "Murattal",
    description: "Legendary Egyptian Qari with rich classical resonance",
    sample_url: "https://everyayah.com/data/Mohammad_al_Tablaway_128kbps/001001.mp3"
  },
  {
    id: "abdullah_basfar",
    name: "Abdullah Basfar",
    name_arabic: "عبد الله بصفر",
    style: "Murattal",
    description: "Prominent scholar and international Qari (Jeddah)",
    sample_url: "https://everyayah.com/data/Abdullah_Basfar_192kbps/001001.mp3"
  }
];

export const SURAHS_LIST: SurahInfo[] = [
  { id: 1, name_simple: "Al-Fatihah", name_arabic: "الفاتحة", name_english: "The Opener", verses_count: 7, revelation_place: "makkah", bismillah_pre: false },
  { id: 2, name_simple: "Al-Baqarah", name_arabic: "البقرة", name_english: "The Cow", verses_count: 286, revelation_place: "madinah", bismillah_pre: true },
  { id: 3, name_simple: "Ali 'Imran", name_arabic: "آل عمران", name_english: "Family of Imran", verses_count: 200, revelation_place: "madinah", bismillah_pre: true },
  { id: 4, name_simple: "An-Nisa", name_arabic: "النساء", name_english: "The Women", verses_count: 176, revelation_place: "madinah", bismillah_pre: true },
  { id: 5, name_simple: "Al-Ma'idah", name_arabic: "المائدة", name_english: "The Table Spread", verses_count: 120, revelation_place: "madinah", bismillah_pre: true },
  { id: 6, name_simple: "Al-An'am", name_arabic: "الأنعام", name_english: "The Cattle", verses_count: 165, revelation_place: "makkah", bismillah_pre: true },
  { id: 7, name_simple: "Al-A'raf", name_arabic: "الأعراف", name_english: "The Heights", verses_count: 206, revelation_place: "makkah", bismillah_pre: true },
  { id: 8, name_simple: "Al-Anfal", name_arabic: "الأنفال", name_english: "The Spoils of War", verses_count: 75, revelation_place: "madinah", bismillah_pre: true },
  { id: 9, name_simple: "At-Tawbah", name_arabic: "التوبة", name_english: "The Repentance", verses_count: 129, revelation_place: "madinah", bismillah_pre: false },
  { id: 10, name_simple: "Yunus", name_arabic: "يونس", name_english: "Jonah", verses_count: 109, revelation_place: "makkah", bismillah_pre: true },
  { id: 11, name_simple: "Hud", name_arabic: "هود", name_english: "Hud", verses_count: 123, revelation_place: "makkah", bismillah_pre: true },
  { id: 12, name_simple: "Yusuf", name_arabic: "يوسف", name_english: "Joseph", verses_count: 111, revelation_place: "makkah", bismillah_pre: true },
  { id: 13, name_simple: "Ar-Ra'd", name_arabic: "الرعد", name_english: "The Thunder", verses_count: 43, revelation_place: "madinah", bismillah_pre: true },
  { id: 14, name_simple: "Ibrahim", name_arabic: "إبراهيم", name_english: "Abraham", verses_count: 52, revelation_place: "makkah", bismillah_pre: true },
  { id: 15, name_simple: "Al-Hijr", name_arabic: "الحجر", name_english: "The Rocky Tract", verses_count: 99, revelation_place: "makkah", bismillah_pre: true },
  { id: 16, name_simple: "An-Nahl", name_arabic: "النحل", name_english: "The Bee", verses_count: 128, revelation_place: "makkah", bismillah_pre: true },
  { id: 17, name_simple: "Al-Isra", name_arabic: "الإسراء", name_english: "The Night Journey", verses_count: 111, revelation_place: "makkah", bismillah_pre: true },
  { id: 18, name_simple: "Al-Kahf", name_arabic: "الكهف", name_english: "The Cave", verses_count: 110, revelation_place: "makkah", bismillah_pre: true },
  { id: 19, name_simple: "Maryam", name_arabic: "مريم", name_english: "Mary", verses_count: 98, revelation_place: "makkah", bismillah_pre: true },
  { id: 20, name_simple: "Taha", name_arabic: "طه", name_english: "Ta-Ha", verses_count: 135, revelation_place: "makkah", bismillah_pre: true },
  { id: 21, name_simple: "Al-Anbiya", name_arabic: "الأنبياء", name_english: "The Prophets", verses_count: 112, revelation_place: "makkah", bismillah_pre: true },
  { id: 22, name_simple: "Al-Hajj", name_arabic: "الحج", name_english: "The Pilgrimage", verses_count: 78, revelation_place: "madinah", bismillah_pre: true },
  { id: 23, name_simple: "Al-Mu'minun", name_arabic: "المؤمنون", name_english: "The Believers", verses_count: 118, revelation_place: "makkah", bismillah_pre: true },
  { id: 24, name_simple: "An-Nur", name_arabic: "النور", name_english: "The Light", verses_count: 64, revelation_place: "madinah", bismillah_pre: true },
  { id: 25, name_simple: "Al-Furqan", name_arabic: "الفرقان", name_english: "The Criterion", verses_count: 77, revelation_place: "makkah", bismillah_pre: true },
  { id: 26, name_simple: "Ash-Shu'ara", name_arabic: "الشعراء", name_english: "The Poets", verses_count: 227, revelation_place: "makkah", bismillah_pre: true },
  { id: 27, name_simple: "An-Naml", name_arabic: "النمل", name_english: "The Ant", verses_count: 93, revelation_place: "makkah", bismillah_pre: true },
  { id: 28, name_simple: "Al-Qasas", name_arabic: "القصص", name_english: "The Stories", verses_count: 88, revelation_place: "makkah", bismillah_pre: true },
  { id: 29, name_simple: "Al-'Ankabut", name_arabic: "العنكبوت", name_english: "The Spider", verses_count: 69, revelation_place: "makkah", bismillah_pre: true },
  { id: 30, name_simple: "Ar-Rum", name_arabic: "الروم", name_english: "The Romans", verses_count: 60, revelation_place: "makkah", bismillah_pre: true },
  { id: 31, name_simple: "Luqman", name_arabic: "لقمان", name_english: "Luqman", verses_count: 34, revelation_place: "makkah", bismillah_pre: true },
  { id: 32, name_simple: "As-Sajdah", name_arabic: "السجدة", name_english: "The Prostration", verses_count: 30, revelation_place: "makkah", bismillah_pre: true },
  { id: 33, name_simple: "Al-Ahzab", name_arabic: "الأحزاب", name_english: "The Combined Forces", verses_count: 73, revelation_place: "madinah", bismillah_pre: true },
  { id: 34, name_simple: "Saba", name_arabic: "سبأ", name_english: "Sheba", verses_count: 54, revelation_place: "makkah", bismillah_pre: true },
  { id: 35, name_simple: "Fatir", name_arabic: "فاطر", name_english: "Originator", verses_count: 45, revelation_place: "makkah", bismillah_pre: true },
  { id: 36, name_simple: "Ya-Sin", name_arabic: "يس", name_english: "Ya-Sin", verses_count: 83, revelation_place: "makkah", bismillah_pre: true },
  { id: 37, name_simple: "As-Saffat", name_arabic: "الصافات", name_english: "Those who set the Ranks", verses_count: 182, revelation_place: "makkah", bismillah_pre: true },
  { id: 38, name_simple: "Sad", name_arabic: "ص", name_english: "The Letter Sad", verses_count: 88, revelation_place: "makkah", bismillah_pre: true },
  { id: 39, name_simple: "Az-Zumar", name_arabic: "الزمر", name_english: "The Troops", verses_count: 75, revelation_place: "makkah", bismillah_pre: true },
  { id: 40, name_simple: "Ghafir", name_arabic: "غافر", name_english: "The Forgiver", verses_count: 85, revelation_place: "makkah", bismillah_pre: true },
  { id: 41, name_simple: "Fussilat", name_arabic: "فصلت", name_english: "Explained in Detail", verses_count: 54, revelation_place: "makkah", bismillah_pre: true },
  { id: 42, name_simple: "Ash-Shuraa", name_arabic: "الشورى", name_english: "The Consultation", verses_count: 53, revelation_place: "makkah", bismillah_pre: true },
  { id: 43, name_simple: "Az-Zukhruf", name_arabic: "الزخرف", name_english: "The Ornaments of Gold", verses_count: 89, revelation_place: "makkah", bismillah_pre: true },
  { id: 44, name_simple: "Ad-Dukhan", name_arabic: "الدخان", name_english: "The Smoke", verses_count: 59, revelation_place: "makkah", bismillah_pre: true },
  { id: 45, name_simple: "Al-Jathiyah", name_arabic: "الجاثية", name_english: "The Crouching", verses_count: 37, revelation_place: "makkah", bismillah_pre: true },
  { id: 46, name_simple: "Al-Ahqaf", name_arabic: "الأحقاف", name_english: "The Wind-Curved Sandhills", verses_count: 35, revelation_place: "makkah", bismillah_pre: true },
  { id: 47, name_simple: "Muhammad", name_arabic: "محمد", name_english: "Muhammad", verses_count: 38, revelation_place: "madinah", bismillah_pre: true },
  { id: 48, name_simple: "Al-Fath", name_arabic: "الفتح", name_english: "The Victory", verses_count: 29, revelation_place: "madinah", bismillah_pre: true },
  { id: 49, name_simple: "Al-Hujurat", name_arabic: "الحجرات", name_english: "The Rooms", verses_count: 18, revelation_place: "madinah", bismillah_pre: true },
  { id: 50, name_simple: "Qaf", name_arabic: "ق", name_english: "The Letter Qaf", verses_count: 45, revelation_place: "makkah", bismillah_pre: true },
  { id: 51, name_simple: "Adh-Dhariyat", name_arabic: "الذاريات", name_english: "The Winnowing Winds", verses_count: 60, revelation_place: "makkah", bismillah_pre: true },
  { id: 52, name_simple: "At-Tur", name_arabic: "الطور", name_english: "The Mount", verses_count: 49, revelation_place: "makkah", bismillah_pre: true },
  { id: 53, name_simple: "An-Najm", name_arabic: "النجم", name_english: "The Star", verses_count: 62, revelation_place: "makkah", bismillah_pre: true },
  { id: 54, name_simple: "Al-Qamar", name_arabic: "القمر", name_english: "The Moon", verses_count: 55, revelation_place: "makkah", bismillah_pre: true },
  { id: 55, name_simple: "Ar-Rahman", name_arabic: "الرحمن", name_english: "The Beneficent", verses_count: 78, revelation_place: "madinah", bismillah_pre: true },
  { id: 56, name_simple: "Al-Waqi'ah", name_arabic: "الواقعة", name_english: "The Inevitable", verses_count: 96, revelation_place: "makkah", bismillah_pre: true },
  { id: 57, name_simple: "Al-Hadid", name_arabic: "الحديد", name_english: "The Iron", verses_count: 29, revelation_place: "madinah", bismillah_pre: true },
  { id: 58, name_simple: "Al-Mujadila", name_arabic: "المجادلة", name_english: "The Pleading Woman", verses_count: 22, revelation_place: "madinah", bismillah_pre: true },
  { id: 59, name_simple: "Al-Hashr", name_arabic: "الحشر", name_english: "The Exile", verses_count: 24, revelation_place: "madinah", bismillah_pre: true },
  { id: 60, name_simple: "Al-Mumtahanah", name_arabic: "الممتحنة", name_english: "She that is to be examined", verses_count: 13, revelation_place: "madinah", bismillah_pre: true },
  { id: 61, name_simple: "As-Saf", name_arabic: "الصف", name_english: "The Ranks", verses_count: 14, revelation_place: "madinah", bismillah_pre: true },
  { id: 62, name_simple: "Al-Jumu'ah", name_arabic: "الجمعة", name_english: "The Congregation", verses_count: 11, revelation_place: "madinah", bismillah_pre: true },
  { id: 63, name_simple: "Al-Munafiqun", name_arabic: "المنافقون", name_english: "The Hypocrites", verses_count: 11, revelation_place: "madinah", bismillah_pre: true },
  { id: 64, name_simple: "At-Taghabun", name_arabic: "التغابن", name_english: "The Mutual Disillusion", verses_count: 18, revelation_place: "madinah", bismillah_pre: true },
  { id: 65, name_simple: "At-Talaq", name_arabic: "الطلاق", name_english: "The Divorce", verses_count: 12, revelation_place: "madinah", bismillah_pre: true },
  { id: 66, name_simple: "At-Tahrim", name_arabic: "التحريم", name_english: "The Prohibition", verses_count: 12, revelation_place: "madinah", bismillah_pre: true },
  { id: 67, name_simple: "Al-Mulk", name_arabic: "الملك", name_english: "The Sovereignty", verses_count: 30, revelation_place: "makkah", bismillah_pre: true },
  { id: 68, name_simple: "Al-Qalam", name_arabic: "القلم", name_english: "The Pen", verses_count: 52, revelation_place: "makkah", bismillah_pre: true },
  { id: 69, name_simple: "Al-Haqqah", name_arabic: "الحاقة", name_english: "The Reality", verses_count: 52, revelation_place: "makkah", bismillah_pre: true },
  { id: 70, name_simple: "Al-Ma'arij", name_arabic: "المعارج", name_english: "The Ascending Stairways", verses_count: 44, revelation_place: "makkah", bismillah_pre: true },
  { id: 71, name_simple: "Nuh", name_arabic: "نوح", name_english: "Noah", verses_count: 28, revelation_place: "makkah", bismillah_pre: true },
  { id: 72, name_simple: "Al-Jinn", name_arabic: "الجن", name_english: "The Jinn", verses_count: 28, revelation_place: "makkah", bismillah_pre: true },
  { id: 73, name_simple: "Al-Muzzammil", name_arabic: "المزمل", name_english: "The Enshrouded One", verses_count: 20, revelation_place: "makkah", bismillah_pre: true },
  { id: 74, name_simple: "Al-Muddaththir", name_arabic: "المدثر", name_english: "The Cloaked One", verses_count: 56, revelation_place: "makkah", bismillah_pre: true },
  { id: 75, name_simple: "Al-Qiyamah", name_arabic: "القيامة", name_english: "The Resurrection", verses_count: 40, revelation_place: "makkah", bismillah_pre: true },
  { id: 76, name_simple: "Al-Insan", name_arabic: "الإنسان", name_english: "Man", verses_count: 31, revelation_place: "madinah", bismillah_pre: true },
  { id: 77, name_simple: "Al-Mursalat", name_arabic: "المرسلات", name_english: "The Emissaries", verses_count: 50, revelation_place: "makkah", bismillah_pre: true },
  { id: 78, name_simple: "An-Naba", name_arabic: "النبأ", name_english: "The Tidings", verses_count: 40, revelation_place: "makkah", bismillah_pre: true },
  { id: 79, name_simple: "An-Nazi'at", name_arabic: "النازعات", name_english: "Those who drag forth", verses_count: 46, revelation_place: "makkah", bismillah_pre: true },
  { id: 80, name_simple: "'Abasa", name_arabic: "عبس", name_english: "He Frowned", verses_count: 42, revelation_place: "makkah", bismillah_pre: true },
  { id: 81, name_simple: "At-Takwir", name_arabic: "التكوير", name_english: "The Overthrowing", verses_count: 29, revelation_place: "makkah", bismillah_pre: true },
  { id: 82, name_simple: "Al-Infitar", name_arabic: "الانفطار", name_english: "The Cleaving", verses_count: 19, revelation_place: "makkah", bismillah_pre: true },
  { id: 83, name_simple: "Al-Mutaffifin", name_arabic: "المطففين", name_english: "The Defrauding", verses_count: 36, revelation_place: "makkah", bismillah_pre: true },
  { id: 84, name_simple: "Al-Inshiqaq", name_arabic: "الانشقاق", name_english: "The Splitting Open", verses_count: 25, revelation_place: "makkah", bismillah_pre: true },
  { id: 85, name_simple: "Al-Buruj", name_arabic: "البروج", name_english: "The Mansions of the Stars", verses_count: 22, revelation_place: "makkah", bismillah_pre: true },
  { id: 86, name_simple: "At-Tariq", name_arabic: "الطارق", name_english: "The Nightcommer", verses_count: 17, revelation_place: "makkah", bismillah_pre: true },
  { id: 87, name_simple: "Al-A'la", name_arabic: "الأعلى", name_english: "The Most High", verses_count: 19, revelation_place: "makkah", bismillah_pre: true },
  { id: 88, name_simple: "Al-Ghashiyah", name_arabic: "الغاشية", name_english: "The Overwhelming", verses_count: 26, revelation_place: "makkah", bismillah_pre: true },
  { id: 89, name_simple: "Al-Fajr", name_arabic: "الفجر", name_english: "The Dawn", verses_count: 30, revelation_place: "makkah", bismillah_pre: true },
  { id: 90, name_simple: "Al-Balad", name_arabic: "البلد", name_english: "The City", verses_count: 20, revelation_place: "makkah", bismillah_pre: true },
  { id: 91, name_simple: "Ash-Shams", name_arabic: "الشمس", name_english: "The Sun", verses_count: 15, revelation_place: "makkah", bismillah_pre: true },
  { id: 92, name_simple: "Al-Layl", name_arabic: "الليل", name_english: "The Night", verses_count: 21, revelation_place: "makkah", bismillah_pre: true },
  { id: 93, name_simple: "Ad-Duhaa", name_arabic: "الضحى", name_english: "The Morning Hours", verses_count: 11, revelation_place: "makkah", bismillah_pre: true },
  { id: 94, name_simple: "Ash-Sharh", name_arabic: "الشرح", name_english: "The Relief", verses_count: 8, revelation_place: "makkah", bismillah_pre: true },
  { id: 95, name_simple: "At-Tin", name_arabic: "التين", name_english: "The Fig", verses_count: 8, revelation_place: "makkah", bismillah_pre: true },
  { id: 96, name_simple: "Al-'Alaq", name_arabic: "العلق", name_english: "The Clot", verses_count: 19, revelation_place: "makkah", bismillah_pre: true },
  { id: 97, name_simple: "Al-Qadr", name_arabic: "القدر", name_english: "The Power", verses_count: 5, revelation_place: "makkah", bismillah_pre: true },
  { id: 98, name_simple: "Al-Bayyinah", name_arabic: "البينة", name_english: "The Clear Proof", verses_count: 8, revelation_place: "madinah", bismillah_pre: true },
  { id: 99, name_simple: "Az-Zalzalah", name_arabic: "الزلزلة", name_english: "The Earthquake", verses_count: 8, revelation_place: "madinah", bismillah_pre: true },
  { id: 100, name_simple: "Al-'Adiyat", name_arabic: "العاديات", name_english: "The Courser", verses_count: 11, revelation_place: "makkah", bismillah_pre: true },
  { id: 101, name_simple: "Al-Qari'ah", name_arabic: "القارعة", name_english: "The Calamity", verses_count: 11, revelation_place: "makkah", bismillah_pre: true },
  { id: 102, name_simple: "At-Takathur", name_arabic: "التكاثر", name_english: "The Rivalry in world increase", verses_count: 8, revelation_place: "makkah", bismillah_pre: true },
  { id: 103, name_simple: "Al-'Asr", name_arabic: "العصر", name_english: "The Declining Day", verses_count: 3, revelation_place: "makkah", bismillah_pre: true },
  { id: 104, name_simple: "Al-Humazah", name_arabic: "الهمزة", name_english: "The Traducer", verses_count: 9, revelation_place: "makkah", bismillah_pre: true },
  { id: 105, name_simple: "Al-Fil", name_arabic: "الفيل", name_english: "The Elephant", verses_count: 5, revelation_place: "makkah", bismillah_pre: true },
  { id: 106, name_simple: "Quraysh", name_arabic: "قريش", name_english: "Quraysh", verses_count: 4, revelation_place: "makkah", bismillah_pre: true },
  { id: 107, name_simple: "Al-Ma'un", name_arabic: "الماعون", name_english: "The Small Kindnesses", verses_count: 7, revelation_place: "makkah", bismillah_pre: true },
  { id: 108, name_simple: "Al-Kawthar", name_arabic: "الكوثر", name_english: "The Abundance", verses_count: 3, revelation_place: "makkah", bismillah_pre: true },
  { id: 109, name_simple: "Al-Kafirun", name_arabic: "الكافرون", name_english: "The Disbelievers", verses_count: 6, revelation_place: "makkah", bismillah_pre: true },
  { id: 110, name_simple: "An-Nasr", name_arabic: "النصر", name_english: "The Divine Support", verses_count: 3, revelation_place: "madinah", bismillah_pre: true },
  { id: 111, name_simple: "Al-Masad", name_arabic: "المسد", name_english: "The Palm Fiber", verses_count: 5, revelation_place: "makkah", bismillah_pre: true },
  { id: 112, name_simple: "Al-Ikhlas", name_arabic: "الإخلاص", name_english: "The Sincerity", verses_count: 4, revelation_place: "makkah", bismillah_pre: true },
  { id: 113, name_simple: "Al-Falaq", name_arabic: "الفلق", name_english: "The Daybreak", verses_count: 5, revelation_place: "makkah", bismillah_pre: true },
  { id: 114, name_simple: "An-Nas", name_arabic: "الناس", name_english: "Mankind", verses_count: 6, revelation_place: "makkah", bismillah_pre: true }
];
