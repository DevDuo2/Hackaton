export interface Subject {
  id: string;
  name: string;
  iconName: string;
  iconSymbol: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  topicsCount: number;
  studentsCount: number;
  sampleQuestions: string[];
  aiGreeting: string;
  quizzes: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export const SUBJECTS: Subject[] = [
  {
    id: 'matematika',
    name: 'Matematika',
    iconName: 'Calculator',
    iconSymbol: '📐',
    color: '#2563EB',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Algebra, Geometriya, Matematik analiz, Ehtimollar nazariyasi va Masalalar yechish.',
    topicsCount: 42,
    studentsCount: 3840,
    sampleQuestions: [
      'Kvadrat tenglamani diskriminant orqali yechishni qadam-baqadam tushuntir',
      'Pifagor teoremasining amaliy misollar bilan isboti qanday?',
      'Hosilani geometrik ma\'nosi nima?',
      'Trigonometriya formulalarini oson eslab qolish yo\'li',
    ],
    aiGreeting: 'Assalomu alaykum! Men Matematika bo\'yicha sizning shaxsiy AI murabbiyingizman. Algebra, geometriya, formulalar yoki murakkab masalalar bo\'yicha savolingizni bering, birgalikda tahlil qilamiz!',
    quizzes: [
      {
        question: "Agar x² - 5x + 6 = 0 bo'lsa, tenglamaning ildizlari nechaga teng?",
        options: ["x = 2 va x = 3", "x = -2 va x = -3", "x = 1 va x = 6", "x = 0 va x = 5"],
        correctIndex: 0,
        explanation: "Vieta teoremasiga ko'ra: x₁ + x₂ = 5 va x₁ * x₂ = 6. Demak ildizlar 2 va 3 bo'ladi."
      },
      {
        question: "To'g'ri burchakli uchburchakda gipotenuza c=10, katet a=6 bo'lsa, ikkinchi katet b nechaga teng?",
        options: ["b = 8", "b = 7", "b = 9", "b = 4"],
        correctIndex: 0,
        explanation: "Pifagor teoremasi: b = √(c² - a²) = √(100 - 36) = √64 = 8."
      }
    ]
  },
  {
    id: 'fizika',
    name: 'Fizika',
    iconName: 'Zap',
    iconSymbol: '⚡',
    color: '#8B5CF6',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Mexanika, Termodinamika, Elektrodinamika, Optika va Kvant fizikasi.',
    topicsCount: 36,
    studentsCount: 2950,
    sampleQuestions: [
      'Nyutonning ikkinchi qonunini real hayotiy misol bilan tushuntir',
      'Arximed qonuni va jismlarning suzish shartlari',
      'Ohm qonuni va zanjir qismlari qarshiligi',
      'Kvant nima va foton qanday energiyaga ega?',
    ],
    aiGreeting: 'Salom! Men Fizika bo\'yicha AI repetitoringizman. Tabiat hodisalari, harakat qonunlari, elektr zanjirlari yoki formulalar bo\'yicha xohlagan savolingizni bering!',
    quizzes: [
      {
        question: "Jismga ta'sir etuvchi kuch 20 N va uning massasi 4 kg bo'lsa, uning tezlanishi qanday bo'ladi?",
        options: ["5 m/s²", "80 m/s²", "0.2 m/s²", "16 m/s²"],
        correctIndex: 0,
        explanation: "Nyutonning ikkinchi qonuni: a = F / m = 20 / 4 = 5 m/s²."
      },
      {
        question: "Yorug'likning vakuumdagi tarqalish tezligi taxminan qanchaga teng?",
        options: ["300,000 km/s", "150,000 km/s", "1,000,000 km/s", "30,000 km/s"],
        correctIndex: 0,
        explanation: "Vakuumdagi yorug'lik tezligi c ≈ 300,000 km/s (3×10⁸ m/s) ga teng."
      }
    ]
  },
  {
    id: 'dasturlash',
    name: 'Dasturlash & IT',
    iconName: 'Code',
    iconSymbol: '💻',
    color: '#0284C7',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    description: 'Python, JavaScript, Next.js, Algoritmlar, Ma\'lumotlar tuzilmasi va AI.',
    topicsCount: 48,
    studentsCount: 4520,
    sampleQuestions: [
      'Binary Search algoritmining ishlash prinsipi va Big-O tezligi',
      'React Server Components va Client Components farqi',
      'Python list comprehension qanday yoziladi?',
      'REST API va GraphQL o\'rtasidagi asosiy farqlar',
    ],
    aiGreeting: 'Salom dasturchi! Men Dasturlash va IT yo\'nalishidagi AI mentoriman. Kod xatolarini to\'g\'rilash, arxitektura yoki yangi texnologiyalarni o\'rganishda yordam beraman!',
    quizzes: [
      {
        question: "Qaysi ma'lumotlar tuzilmasi LIFO (Last In First Out) prinsipi asosida ishlaydi?",
        options: ["Stack (Stek)", "Queue (Navbat)", "Array (Massiv)", "Linked List"],
        correctIndex: 0,
        explanation: "Stack oxirgi kirgan elementni birinchi bo'lib chiqarish (LIFO) printsipida ishlaydi."
      },
      {
        question: "Next.js da statik sahifalarni oldindan generatsiya qilish uchun qaysi funksiya ishlatiladi?",
        options: ["generateStaticParams", "useStaticPrerender", "createStaticProps", "buildPages"],
        correctIndex: 0,
        explanation: "Next.js App Router'da dinamik [id] sahifalar uchun generateStaticParams ishlatiladi."
      }
    ]
  },
  {
    id: 'kimyo',
    name: 'Kimyo',
    iconName: 'FlaskConical',
    iconSymbol: '🧪',
    color: '#059669',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'Mendeleyev jadvali, Organik va Noorganik kimyo, Reaksiyalar tenglamalari.',
    topicsCount: 30,
    studentsCount: 2100,
    sampleQuestions: [
      'Kovalent va ionli bog\'lanishlarning asosiy farqi nimada?',
      'Kimyoviy reaksiyalar tezligiga ta\'sir etuvchi omillar',
      'Oksidlanish-qaytarilish reaksiyalarini tenglashtirish qoidasi',
      'Organik kimyoda uglevodorodlar guruhlari',
    ],
    aiGreeting: 'Salom! Men Kimyo fani bo\'yicha shaxsiy AI yordamchingizman. Elementlar, reaksiyalar va formulalar bo\'yicha savollaringizni bering!',
    quizzes: [
      {
        question: "Suv molekulasining (H₂O) kimyoviy bog'lanish turi qanday?",
        options: ["Qutbli kovalent bog'lanish", "Ionli bog'lanish", "Metall bog'lanish", "Qutbsiz kovalent bog'lanish"],
        correctIndex: 0,
        explanation: "Suvda turli elektromanzifiylikka ega vodorod va kislorod atomlari qutbli kovalent bog' hosil qiladi."
      }
    ]
  },
  {
    id: 'biologiya',
    name: 'Biologiya',
    iconName: 'HeartPulse',
    iconSymbol: '🧬',
    color: '#16A34A',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Hujayra biologiyasi, Genetika, Inson anatomiyasi va Ekologiya.',
    topicsCount: 32,
    studentsCount: 2300,
    sampleQuestions: [
      'DNK va RNK o\'rtasidagi tuzilish farqlari',
      'Mitoz va Meyoz bo\'linish fazalari',
      'Fotosintez jarayonining yorug\'lik va qorong\'ilik bosqichlari',
      'Inson qon aylanish sistemasi qanday ishlaydi?',
    ],
    aiGreeting: 'Assalomu alaykum! Men Biologiya bo\'yicha AI repetitoringizman. Tirik organizmlar, genetika yoki anatomiya haqida istalgan mavzuni birgalikda o\'rganamiz!',
    quizzes: [
      {
        question: "Hujayraning 'energiya stansiyasi' deb qaysi organoid ataladi?",
        options: ["Mitoxondriya", "Ribosoma", "Lizosoma", "Golji majmuasi"],
        correctIndex: 0,
        explanation: "Mitoxondriyalar hujayra nafas olishida ATF energiyasini sintez qiladi."
      }
    ]
  },
  {
    id: 'ingliz-tili',
    name: 'Ingliz tili (ESL & IELTS)',
    iconName: 'Globe',
    iconSymbol: '🇬🇧',
    color: '#D97706',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'Grammar, Speaking Fluency, Vocabulary, Reading va IELTS Writing tayyorgarligi.',
    topicsCount: 40,
    studentsCount: 5120,
    sampleQuestions: [
      'Present Perfect va Past Simple qachon qanday farqlanadi?',
      'IELTS Speaking Part 2 uchun qanday qoliplar (templates) bor?',
      'Kundalik nutqda eng ko\'p ishlatiladigan 10 ta phrasal verb',
      'Formal va informal ingliz tili farqlari',
    ],
    aiGreeting: 'Hello there! I am your AI English coach. Ask me about grammar rules, essay writing tips, or idioms to speak like a native speaker!',
    quizzes: [
      {
        question: "Choose the correct sentence: 'She has been working here _____ 2021.'",
        options: ["since", "for", "during", "from"],
        correctIndex: 0,
        explanation: "Muayyan boshlanish nuqtasi (2021) ko'rsatilganda 'since' ishlatiladi."
      }
    ]
  },
  {
    id: 'ona-tili',
    name: 'Ona tili va Adabiyot',
    iconName: 'BookMarked',
    iconSymbol: '📚',
    color: '#E11D48',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    description: 'Morfologiya, Sintaksis, Imlo qoidalari, Mumtoz va Zamonaviy adabiyot.',
    topicsCount: 28,
    studentsCount: 1980,
    sampleQuestions: [
      'Ergash gapli qo\'shma gaplar turlari va tinish belgilari',
      'Alisher Navoiy "Xamsa" dostonlari ketma-ketligi',
      'Tutruq belgisi va harf birikmalari qoidalari',
      'She\'riy san\'atlar (tashbeh, istiora, tazod)',
    ],
    aiGreeting: 'Assalomu alaykum! Ona tili va adabiyot bo\'yicha shaxsiy AI ustozi bilan suhbatdasiz. Grammatika qoidalari yoki adabiy tahlillar bo\'yicha savollaringizni kutaman!',
    quizzes: [
      {
        question: "Alisher Navoiyning 'Xamsa'siga kirmaydigan dostonni toping:",
        options: ["Lison ut-tayr", "Hayrat ul-abror", "Farhod va Shirin", "Saddi Iskandariy"],
        correctIndex: 0,
        explanation: "'Lison ut-tayr' alohida falsafiy doston bo'lib, beshlik (Xamsa) dostonlari tarkibiga kirmaydi."
      }
    ]
  }
];

export interface Course {
  id: string;
  title: string;
  description: string;
  category: 'English' | 'Programming' | 'AI' | 'Mathematics' | 'Science' | 'Business' | 'Design';
  subjectId?: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  lessonsCount: number;
  completedLessons?: number;
  duration: string;
  rating: number;
  studentsCount: number;
  instructor: {
    name: string;
    role: string;
    avatar: string;
  };
  progress?: number;
  isPopular?: boolean;
  isRecommended?: boolean;
  image: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  module: string;
}

export const MOCK_COURSES: Course[] = [
  {
    id: 'matematika-algebra-mastery',
    title: 'Matematika: Algebra va Analiz Asoslari',
    description: 'Tenglamalar, funksiyalar, logarifmlar va differensial hisob bo\'yicha chuqur amaliy kurs.',
    category: 'Mathematics',
    subjectId: 'matematika',
    level: 'Intermediate',
    lessonsCount: 24,
    completedLessons: 12,
    duration: '10 hours',
    rating: 4.95,
    studentsCount: 3840,
    instructor: {
      name: 'Prof. Anvar Rasulov',
      role: 'Oliy Matematika Kafedrasi Mudiri',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    },
    progress: 50,
    isPopular: true,
    isRecommended: true,
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'fizika-mexanika-elektr',
    title: 'Fizika: Mexanika va Elektrodinamika',
    description: 'Nyuton qonunlari, energiya saqlanishi, zanjirlar va optik hodisalar tajribalar bilan.',
    category: 'Science',
    subjectId: 'fizika',
    level: 'Beginner',
    lessonsCount: 20,
    completedLessons: 6,
    duration: '8 hours',
    rating: 4.88,
    studentsCount: 2950,
    instructor: {
      name: 'Dr. Jasur Aliyev',
      role: 'Nazariy Fizika Bo\'limi Yetakchisi',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    },
    progress: 30,
    isPopular: true,
    isRecommended: true,
    image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'fullstack-nextjs-typescript',
    title: 'Dasturlash: Next.js & Algoritmlar',
    description: 'TypeScript, zamonaviy App Router, server komponentlari va ma\'lumotlar tuzilmasi.',
    category: 'Programming',
    subjectId: 'dasturlash',
    level: 'Intermediate',
    lessonsCount: 30,
    completedLessons: 10,
    duration: '14 hours',
    rating: 4.92,
    studentsCount: 4520,
    instructor: {
      name: 'Bekzod Fayzullayev',
      role: 'Senior Software Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    progress: 33,
    isPopular: true,
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'kimyo-organik-asoslari',
    title: 'Kimyo: Organik va Noorganik Reaksiyalar',
    description: 'Mendeleyev jadvali, moddalar tuzilishi va laboratoriya tenglamalarini yechish sirlari.',
    category: 'Science',
    subjectId: 'kimyo',
    level: 'Beginner',
    lessonsCount: 18,
    completedLessons: 0,
    duration: '7 hours',
    rating: 4.85,
    studentsCount: 2100,
    instructor: {
      name: 'Nilufar Salimova',
      role: 'Kimyo Fanlari Nomzodi',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    },
    progress: 0,
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'biologiya-hujayra-genetika',
    title: 'Biologiya: Hujayra va Genetika',
    description: 'DNK tuzilishi, irsiyat qonunlari va inson tanasi anatomiyasi bo\'yicha interaktiv qo\'llanma.',
    category: 'Science',
    subjectId: 'biologiya',
    level: 'Intermediate',
    lessonsCount: 16,
    completedLessons: 0,
    duration: '6.5 hours',
    rating: 4.9,
    studentsCount: 2300,
    instructor: {
      name: 'Dr. Shahnoza Qodirova',
      role: 'Biologiya va Genetika Tadqiqotchisi',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    },
    progress: 0,
    image: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'english-speaking-fluency',
    title: 'Ingliz tili: Grammatika va Suhbat',
    description: 'Barcha zamonlar, IELTS nutq qoliplari va xato qilmasdan ravon gapirish texnikalari.',
    category: 'English',
    subjectId: 'ingliz-tili',
    level: 'Intermediate',
    lessonsCount: 24,
    completedLessons: 18,
    duration: '10 hours',
    rating: 4.95,
    studentsCount: 5120,
    instructor: {
      name: 'James Wilson',
      role: 'IELTS 8.5 & ESL Murabbiy',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    },
    progress: 75,
    isPopular: true,
    isRecommended: true,
    image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80',
  },
];

export const MOCK_QUIZ_QUESTIONS = SUBJECTS.flatMap((s, sIdx) =>
  s.quizzes.map((q, qIdx) => ({
    id: sIdx * 100 + qIdx + 1,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    subjectName: s.name,
  }))
);

export const MOCK_LESSONS: Lesson[] = [
  { id: '1', title: 'Kirish: Asosiy qoidalar va tushunchalar', duration: '12 min', completed: true, module: '1-Modul: Asoslar' },
  { id: '2', title: 'Nazariy qonuniyatlar va formulalar', duration: '18 min', completed: true, module: '1-Modul: Asoslar' },
  { id: '3', title: 'Amaliy masalalarni tahlil qilish', duration: '25 min', completed: true, module: '1-Modul: Asoslar' },
  { id: '4', title: 'Murakkab misollar va yechish usullari', duration: '20 min', completed: false, module: '2-Modul: Chuqur o\'rganish' },
  { id: '5', title: 'Testlar va nazorat savollari tahlili', duration: '22 min', completed: false, module: '2-Modul: Chuqur o\'rganish' },
  { id: '6', title: 'Yakuniy sinov topshiriqlari', duration: '30 min', completed: false, module: '3-Modul: Natijalar' },
];

export const MOCK_USER = {
  name: "Zumradxon Xudoyberganova",
  email: "zumradxon@voxy.edu",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  role: "O'quvchi",
  selectedSubject: "matematika",
  level: "Boshlang'ich - O'rta",
  streakDays: 12,
  dailyGoalHours: 1.5,
  dailyDoneHours: 1.1,
  completedLessonsTotal: 42,
  totalPoints: 2840,
  rank: "#4 Umumiy reyting",
  enrolledCoursesCount: 4,
  certificatesCount: 3,
  interests: ["Matematika", "Dasturlash & IT", "Fizika", "Sun'iy Intellekt"],
  weeklyActivity: [
    { day: "Dush", hours: 2.1, score: 92 },
    { day: "Sesh", hours: 1.8, score: 88 },
    { day: "Chor", hours: 2.5, score: 96 },
    { day: "Pay", hours: 1.2, score: 80 },
    { day: "Jum", hours: 2.8, score: 98 },
    { day: "Shan", hours: 3.2, score: 95 },
    { day: "Yak", hours: 1.5, score: 90 },
  ],
  badges: [
    { id: '1', title: 'Tezkor Bilimdon', icon: 'Zap', desc: 'Bir kunda 5 ta mavzuni yakunladi', unlocked: true },
    { id: '2', title: 'Masalalar Ustasi', icon: 'Calculator', desc: 'Matematika bo\'yicha 20 ta test yechdi', unlocked: true },
    { id: '3', title: 'Quiz Chempioni', icon: 'Trophy', desc: 'Testlarda ketma-ket 100% natija', unlocked: true },
    { id: '4', title: 'Doimiylik Sohibi', icon: 'Flame', desc: '10 kunlik to\'xtovsiz o\'qish seriyasi', unlocked: true },
    { id: '5', title: 'IT Koder', icon: 'Code', desc: 'Dasturlash bo\'yicha modulni tugatdi', unlocked: false },
    { id: '6', title: 'Fanlar Bilimdoni', icon: 'Sparkles', desc: '3 ta fandan sinovdan o\'tdi', unlocked: false },
  ]
};

export const MOCK_ADMIN_STATS = {
  totalStudents: 14820,
  activeNow: 412,
  totalCourses: 28,
  totalLessons: 420,
  avgCompletionRate: "78.4%",
  revenueMonthly: "$42,500",
  recentStudents: [
    { id: 's1', name: 'Alisher Qodirov', email: 'alisher@example.com', course: 'Matematika: Algebra Asoslari', progress: 65, joined: '2 soat oldin' },
    { id: 's2', name: 'Madina Karimova', email: 'madina@example.com', course: 'Fizika: Mexanika', progress: 88, joined: '5 soat oldin' },
    { id: 's3', name: 'Javohir Toshpulatov', email: 'javohir@example.com', course: 'Dasturlash: Next.js & TS', progress: 42, joined: '1 kun oldin' },
    { id: 's4', name: 'Nodira Umarova', email: 'nodira@example.com', course: 'Kimyo: Organik Reaksiyalar', progress: 20, joined: '2 kun oldin' },
  ]
};
