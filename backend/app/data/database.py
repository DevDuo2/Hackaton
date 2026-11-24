import time

# Predefined subjects data
SUBJECTS_DB = [
    {
        "id": "matematika",
        "name": "Matematika",
        "iconSymbol": "📐",
        "color": "#2563EB",
        "description": "Algebra, Geometriya, Matematik analiz va Ehtimollar nazariyasi.",
        "topicsCount": 42,
        "sampleQuestions": [
            "Kvadrat tenglamani diskriminant orqali yechishni tushuntir",
            "Pifagor teoremasining amaliy isboti",
            "Trigonometriya formulalarini eslab qolish"
        ],
        "quizzes": [
            {
                "id": 101,
                "question": "x² - 5x + 6 = 0 tenglamaning ildizlari nechaga teng?",
                "options": ["x = 2 va x = 3", "x = -2 va x = -3", "x = 1 va x = 6", "x = 0 va x = 5"],
                "correctIndex": 0,
                "explanation": "Vieta teoremasiga ko'ra x₁ + x₂ = 5 va x₁ * x₂ = 6."
            }
        ]
    },
    {
        "id": "fizika",
        "name": "Fizika",
        "iconSymbol": "⚡",
        "color": "#8B5CF6",
        "description": "Mexanika, Termodinamika, Elektrodinamika va Optika.",
        "topicsCount": 36,
        "sampleQuestions": [
            "Nyutonning ikkinchi qonuni formulasi",
            "Arximed qonuni va suzish shartlari",
            "Ohm qonuni va elektr zanjirlari"
        ],
        "quizzes": [
            {
                "id": 201,
                "question": "Jism massasi 4 kg, unga ta'sir etuvchi kuch 20 N bo'lsa, tezlanishi qancha?",
                "options": ["5 m/s²", "80 m/s²", "0.2 m/s²", "16 m/s²"],
                "correctIndex": 0,
                "explanation": "a = F / m = 20 / 4 = 5 m/s²."
            }
        ]
    },
    {
        "id": "dasturlash",
        "name": "Dasturlash & IT",
        "iconSymbol": "💻",
        "color": "#0284C7",
        "description": "Python, Next.js, Algoritmlar va Ma'lumotlar tuzilmasi.",
        "topicsCount": 48,
        "sampleQuestions": [
            "Binary Search algoritmi qanday ishlaydi?",
            "React Server Components nima?",
            "Stack va Queue farqlari"
        ],
        "quizzes": [
            {
                "id": 301,
                "question": "Qaysi ma'lumotlar tuzilmasi LIFO prinsipi asosida ishlaydi?",
                "options": ["Stack (Stek)", "Queue (Navbat)", "Array", "Graph"],
                "correctIndex": 0,
                "explanation": "Stack oxirgi kirgan elementni birinchi bo'lib chiqaradi."
            }
        ]
    }
]

# Users DB
USERS_DB = [
    {
        "id": "u_student_1",
        "name": "Zumradxon Xudoyberganova",
        "email": "student@voxy.edu",
        "password": "password123",
        "role": "student",
        "selectedSubject": "matematika",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
        "totalXP": 2840,
        "streakDays": 12
    },
    {
        "id": "u_admin_1",
        "name": "Admin Nazoratchi",
        "email": "admin@voxy.edu",
        "password": "admin123",
        "role": "admin",
        "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
        "totalXP": 0,
        "streakDays": 0
    }
]

# Courses DB
COURSES_DB = [
    {
        "id": "matematika-algebra",
        "title": "Matematika: Algebra va Analiz Asoslari",
        "subjectId": "matematika",
        "lessonsCount": 24,
        "studentsCount": 3840,
        "rating": 4.95,
        "duration": "10 hours"
    },
    {
        "id": "fizika-mexanika",
        "title": "Fizika: Mexanika va Elektr Qonunlari",
        "subjectId": "fizika",
        "lessonsCount": 20,
        "studentsCount": 2950,
        "rating": 4.88,
        "duration": "8 hours"
    },
    {
        "id": "dasturlash-nextjs",
        "title": "Dasturlash: Next.js & Algoritmlar",
        "subjectId": "dasturlash",
        "lessonsCount": 30,
        "studentsCount": 4520,
        "rating": 4.92,
        "duration": "14 hours"
    }
]
