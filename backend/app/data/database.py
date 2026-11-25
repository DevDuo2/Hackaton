"""Boshlang'ich ma'lumotlar: fanlar, testlar, kurslar va demo foydalanuvchilar.

MongoDB bo'sh bo'lsa shu ro'yxatlar seed qilinadi (app/core/seeder.py), baza mavjud
bo'lmasa esa API shu ro'yxatlar bilan zaxira rejimda ishlaydi.

Fanlar ro'yxati frontenddagi `my-app/data/mockData.ts` dagi `SUBJECTS` bilan bir xil
`id` larga ega bo'lishi SHART: aks holda foydalanuvchi "Kimyo" ni tanlaganda server
uni topa olmaydi. Test savollarining `id` lari esa barqaror bo'lishi kerak — javob
yuborilganda shu `id` orqali topiladi.
"""

from app.core.security import hash_password

SUBJECTS_DB = [
    {
        "id": "matematika",
        "name": "Matematika",
        "iconSymbol": "📐",
        "color": "#2563EB",
        "description": "Algebra, Geometriya, Matematik analiz va Ehtimollar nazariyasi.",
        "topicsCount": 42,
        "studentsCount": 3840,
        "sampleQuestions": [
            "Kvadrat tenglamani diskriminant orqali yechishni tushuntir",
            "Pifagor teoremasining amaliy isboti",
            "Hosilaning geometrik ma'nosi nima?",
            "Trigonometriya formulalarini eslab qolish",
        ],
        "quizzes": [
            {
                "id": 101,
                "question": "x² - 5x + 6 = 0 tenglamaning ildizlari nechaga teng?",
                "options": ["x = -2 va x = -3", "x = 2 va x = 3", "x = 1 va x = 6", "x = 0 va x = 5"],
                "correctIndex": 1,
                "explanation": "Vieta teoremasiga ko'ra x₁ + x₂ = 5 va x₁ * x₂ = 6. Demak ildizlar 2 va 3.",
            },
            {
                "id": 102,
                "question": "To'g'ri burchakli uchburchakda gipotenuza c=10, katet a=6 bo'lsa, ikkinchi katet b nechaga teng?",
                "options": ["b = 7", "b = 9", "b = 8", "b = 4"],
                "correctIndex": 2,
                "explanation": "Pifagor teoremasi: b = √(c² - a²) = √(100 - 36) = √64 = 8.",
            },
        ],
    },
    {
        "id": "fizika",
        "name": "Fizika",
        "iconSymbol": "⚡",
        "color": "#8B5CF6",
        "description": "Mexanika, Termodinamika, Elektrodinamika va Optika.",
        "topicsCount": 36,
        "studentsCount": 2950,
        "sampleQuestions": [
            "Nyutonning ikkinchi qonuni formulasi",
            "Arximed qonuni va suzish shartlari",
            "Ohm qonuni va elektr zanjirlari",
            "Kvant nima va foton qanday energiyaga ega?",
        ],
        "quizzes": [
            {
                "id": 201,
                "question": "Jism massasi 4 kg, unga ta'sir etuvchi kuch 20 N bo'lsa, tezlanishi qancha?",
                "options": ["80 m/s²", "0.2 m/s²", "16 m/s²", "5 m/s²"],
                "correctIndex": 3,
                "explanation": "Nyutonning ikkinchi qonuni: a = F / m = 20 / 4 = 5 m/s².",
            },
            {
                "id": 202,
                "question": "Yorug'likning vakuumdagi tarqalish tezligi taxminan qanchaga teng?",
                "options": ["300 000 km/s", "150 000 km/s", "1 000 000 km/s", "30 000 km/s"],
                "correctIndex": 0,
                "explanation": "Vakuumdagi yorug'lik tezligi c ≈ 300 000 km/s (3×10⁸ m/s).",
            },
        ],
    },
    {
        "id": "dasturlash",
        "name": "Dasturlash & IT",
        "iconSymbol": "💻",
        "color": "#0284C7",
        "description": "Python, Next.js, Algoritmlar va Ma'lumotlar tuzilmasi.",
        "topicsCount": 48,
        "studentsCount": 4520,
        "sampleQuestions": [
            "Binary Search algoritmi qanday ishlaydi?",
            "React Server Components nima?",
            "Stack va Queue farqlari",
            "REST API va GraphQL o'rtasidagi farqlar",
        ],
        "quizzes": [
            {
                "id": 301,
                "question": "Qaysi ma'lumotlar tuzilmasi LIFO prinsipi asosida ishlaydi?",
                "options": ["Queue (Navbat)", "Stack (Stek)", "Array (Massiv)", "Linked List"],
                "correctIndex": 1,
                "explanation": "Stack oxirgi kirgan elementni birinchi bo'lib chiqaradi (LIFO).",
            },
            {
                "id": 302,
                "question": "Next.js App Router'da dinamik sahifalarni oldindan generatsiya qilish uchun qaysi funksiya ishlatiladi?",
                "options": ["useStaticPrerender", "createStaticProps", "generateStaticParams", "buildPages"],
                "correctIndex": 2,
                "explanation": "Dinamik [id] sahifalar uchun generateStaticParams ishlatiladi.",
            },
        ],
    },
    {
        "id": "kimyo",
        "name": "Kimyo",
        "iconSymbol": "🧪",
        "color": "#059669",
        "description": "Mendeleyev jadvali, Organik va Noorganik kimyo, Reaksiya tenglamalari.",
        "topicsCount": 30,
        "studentsCount": 2100,
        "sampleQuestions": [
            "Kovalent va ionli bog'lanishning asosiy farqi nimada?",
            "Reaksiya tezligiga ta'sir etuvchi omillar",
            "Oksidlanish-qaytarilish reaksiyalarini tenglashtirish qoidasi",
            "Organik kimyoda uglevodorodlar guruhlari",
        ],
        "quizzes": [
            {
                "id": 401,
                "question": "Suv molekulasidagi (H₂O) kimyoviy bog'lanish turi qanday?",
                "options": [
                    "Ionli bog'lanish",
                    "Metall bog'lanish",
                    "Qutbsiz kovalent bog'lanish",
                    "Qutbli kovalent bog'lanish",
                ],
                "correctIndex": 3,
                "explanation": "Elektromanfiyligi turlicha vodorod va kislorod atomlari qutbli kovalent bog' hosil qiladi.",
            },
        ],
    },
    {
        "id": "biologiya",
        "name": "Biologiya",
        "iconSymbol": "🧬",
        "color": "#16A34A",
        "description": "Hujayra biologiyasi, Genetika, Inson anatomiyasi va Ekologiya.",
        "topicsCount": 32,
        "studentsCount": 2300,
        "sampleQuestions": [
            "DNK va RNK o'rtasidagi tuzilish farqlari",
            "Mitoz va Meyoz bo'linish fazalari",
            "Fotosintezning yorug'lik va qorong'ilik bosqichlari",
            "Inson qon aylanish sistemasi qanday ishlaydi?",
        ],
        "quizzes": [
            {
                "id": 501,
                "question": "Hujayraning «energiya stansiyasi» deb qaysi organoid ataladi?",
                "options": ["Mitoxondriya", "Ribosoma", "Lizosoma", "Golji majmuasi"],
                "correctIndex": 0,
                "explanation": "Mitoxondriyalar hujayra nafas olishida ATF energiyasini sintez qiladi.",
            },
        ],
    },
    {
        "id": "ingliz-tili",
        "name": "Ingliz tili (ESL & IELTS)",
        "iconSymbol": "🇬🇧",
        "color": "#D97706",
        "description": "Grammar, Speaking, Vocabulary, Reading va IELTS Writing tayyorgarligi.",
        "topicsCount": 40,
        "studentsCount": 5120,
        "sampleQuestions": [
            "Present Perfect va Past Simple qanday farqlanadi?",
            "IELTS Speaking Part 2 uchun qoliplar",
            "Eng ko'p ishlatiladigan 10 ta phrasal verb",
            "Formal va informal ingliz tili farqlari",
        ],
        "quizzes": [
            {
                "id": 601,
                "question": "Choose the correct word: «She has been working here _____ 2021.»",
                "options": ["for", "since", "during", "from"],
                "correctIndex": 1,
                "explanation": "Muayyan boshlanish nuqtasi (2021) ko'rsatilganda «since» ishlatiladi.",
            },
        ],
    },
    {
        "id": "ona-tili",
        "name": "Ona tili va Adabiyot",
        "iconSymbol": "📚",
        "color": "#E11D48",
        "description": "Morfologiya, Sintaksis, Imlo qoidalari, Mumtoz va Zamonaviy adabiyot.",
        "topicsCount": 28,
        "studentsCount": 1980,
        "sampleQuestions": [
            "Ergash gapli qo'shma gaplar turlari va tinish belgilari",
            "Alisher Navoiy «Xamsa» dostonlari ketma-ketligi",
            "Tutuq belgisi va harf birikmalari qoidalari",
            "She'riy san'atlar (tashbeh, istiora, tazod)",
        ],
        "quizzes": [
            {
                "id": 701,
                "question": "Alisher Navoiyning «Xamsa»siga kirmaydigan dostonni toping:",
                "options": ["Hayrat ul-abror", "Farhod va Shirin", "Lison ut-tayr", "Saddi Iskandariy"],
                "correctIndex": 2,
                "explanation": "«Lison ut-tayr» alohida falsafiy doston bo'lib, beshlik tarkibiga kirmaydi.",
            },
        ],
    },
]

# Demo akkauntlar. Parollar import vaqtida hashlanadi (pastdagi loop), shuning uchun
# bu yerdagi ochiq matndagi qiymat faqat "demo login" sifatida qoladi.
DEMO_CREDENTIALS = {"u_student_1": "password123", "u_admin_1": "admin123"}

USERS_DB = [
    {
        "id": "u_student_1",
        "name": "Zumradxon Xudoyberganova",
        "email": "student@voxy.edu",
        "role": "student",
        "selectedSubject": "matematika",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
        "totalXP": 2840,
        "streakDays": 12,
    },
    {
        "id": "u_admin_1",
        "name": "Admin Nazoratchi",
        "username": "admin",
        "email": "admin@voxy.edu",
        "role": "admin",
        "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
        "totalXP": 0,
        "streakDays": 0,
    },
]

for _user in USERS_DB:
    _user["password"] = hash_password(DEMO_CREDENTIALS[_user["id"]])

COURSES_DB = [
    {
        "id": "matematika-algebra",
        "title": "Matematika: Algebra va Analiz Asoslari",
        "subjectId": "matematika",
        "lessonsCount": 24,
        "studentsCount": 3840,
        "rating": 4.95,
        "duration": "10 hours",
    },
    {
        "id": "fizika-mexanika",
        "title": "Fizika: Mexanika va Elektr Qonunlari",
        "subjectId": "fizika",
        "lessonsCount": 20,
        "studentsCount": 2950,
        "rating": 4.88,
        "duration": "8 hours",
    },
    {
        "id": "dasturlash-nextjs",
        "title": "Dasturlash: Next.js & Algoritmlar",
        "subjectId": "dasturlash",
        "lessonsCount": 30,
        "studentsCount": 4520,
        "rating": 4.92,
        "duration": "14 hours",
    },
    {
        "id": "kimyo-organik",
        "title": "Kimyo: Organik Kimyo Asoslari",
        "subjectId": "kimyo",
        "lessonsCount": 18,
        "studentsCount": 2100,
        "rating": 4.85,
        "duration": "7 hours",
    },
    {
        "id": "biologiya-hujayra",
        "title": "Biologiya: Hujayra va Genetika",
        "subjectId": "biologiya",
        "lessonsCount": 22,
        "studentsCount": 2300,
        "rating": 4.87,
        "duration": "9 hours",
    },
    {
        "id": "ingliz-tili-ielts",
        "title": "Ingliz tili: IELTS Speaking & Writing",
        "subjectId": "ingliz-tili",
        "lessonsCount": 28,
        "studentsCount": 5120,
        "rating": 4.94,
        "duration": "12 hours",
    },
    {
        "id": "ona-tili-adabiyot",
        "title": "Ona tili va Adabiyot: Imlo va Tahlil",
        "subjectId": "ona-tili",
        "lessonsCount": 20,
        "studentsCount": 1980,
        "rating": 4.82,
        "duration": "8 hours",
    },
]
