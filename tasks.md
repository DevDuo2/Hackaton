# AI LEARNING PLATFORM — COMPLETE UI/UX DESIGN SYSTEM & FRONTEND

Sen Senior UI/UX Designer va Senior Next.js Frontend Developer sifatida ishlaysan.

Biz o‘quvchilar va talabalar uchun zamonaviy, professional AI Learning Platform yaratmoqchimiz.

Platformaning asosiy maqsadi — foydalanuvchilarga turli fanlarni o‘rganish, AI Tutor bilan muloqot qilish, English Speaking mashqlarini bajarish, quiz va o‘yinlarda qatnashish hamda o‘z rivojlanishini kuzatish imkonini berish.

Hozirgi vazifa: platformaning to‘liq UI/UX dizaynini va frontend qismini yaratish.

---

# 1. TECHNOLOGY STACK

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Lucide Icons
- shadcn/ui (agar mavjud bo‘lsa)
- Reusable React Components
- Responsive Design

Avval mavjud projectni tekshir. Uning strukturasini, Next.js versiyasini va o‘rnatilgan kutubxonalarini o‘rgan. Mavjud ishlaydigan kodni sababsiz o‘zgartirma.

---

# 2. OFFICIAL BRAND COLOR PALETTE

Quyidagi ranglar platformaning asosiy va doimiy Design System ranglari hisoblanadi.

Ularni barcha sahifalarda bir xil ishlat.

### Primary Colors

- Primary Blue: #2563EB
- Secondary Purple: #8B5CF6

### Background & Surface

- Background: #F8FAFC
- Surface / Cards: #FFFFFF

### Typography Colors

- Primary Text: #1E293B
- Muted Text: #64748B

### Status Colors

- Success: #16A34A
- Warning: #F59E0B

### Color Usage Rules

- Blue — primary buttons, active navigation, links va asosiy interaktiv elementlar.
- Purple — AI Tutor, AI Speaking va AI bilan bog‘liq maxsus funksiyalar.
- White — cards, modals va content panels.
- Light Gray — sahifa fonlari.
- Dark Slate — asosiy matnlar.
- Green — completed lessons va muvaffaqiyatli natijalar.
- Orange — pending tasks va ogohlantirishlar.

Ranglardan ortiqcha foydalanma. Har bir rangning o‘z vazifasi bo‘lsin.

Gradientlardan faqat kerakli joylarda, masalan AI Tutor bannerida, juda me'yorida foydalan.

---

# 3. DESIGN STYLE

Dizayn yo‘nalishi: MODERN + CLEAN + PROFESSIONAL + FRIENDLY.

Platforma turli yoshdagi foydalanuvchilarga mos tushishi kerak.

Talablar:

- Light theme default.
- Minimal va tartibli UI.
- Toza white-space.
- Chiroyli rounded cards.
- Yengil va tabiiy shadows.
- Professional typography.
- Bir xil border radius va spacing tizimi.
- Tushunarli icons.
- Zamonaviy charts va progress indicators.
- Hover va transition effektlari.
- Responsive desktop, tablet va mobile layout.

Dizayn juda bolalarcha yoki haddan tashqari korporativ bo‘lmasin.

Referens sifatida zamonaviy SaaS, EdTech va AI dashboardlar dizaynidan foydalan, lekin o‘ziga xos vizual uslub yarat.

---

# 4. DESIGN SYSTEM

Barcha sahifalarda ishlatiladigan umumiy komponentlarni yarat:

- Primary Button
- Secondary Button
- Icon Button
- Input Fields
- Search Bar
- Course Card
- Stat Card
- Progress Bar
- Progress Circle
- Badge
- Tabs
- Dropdown
- Sidebar
- Header
- Modal
- Tooltip
- Empty State
- Loading State
- Notification Component

Typography, spacing, border radius, shadow va ranglar yagona tizimga asoslangan bo‘lsin.

Ranglarni CSS variables orqali boshqar. Masalan:

--primary: #2563EB;
--secondary: #8B5CF6;
--background: #F8FAFC;
--surface: #FFFFFF;
--text: #1E293B;
--muted: #64748B;
--success: #16A34A;
--warning: #F59E0B;

---

# 5. MAIN WEBSITE — LANDING PAGE

Landing Page professional va zamonaviy bo‘lsin.

Sections:

1. Navbar
   - Logo
   - Home
   - Courses
   - AI Tutor
   - Games
   - About
   - Login
   - Get Started

2. Hero Section
   - Katta va tushunarli headline.
   - Platforma haqida qisqa ma'lumot.
   - Get Started CTA.
   - AI Learning platformani ifodalovchi vizual element.

3. Features Section
   - AI Tutor
   - AI Speaking
   - Interactive Courses
   - Games & Quizzes
   - Progress Tracking

4. Popular Courses
5. How It Works
6. Learning Statistics
7. Testimonials (demo content)
8. Final CTA
9. Footer

---

# 6. STUDENT DASHBOARD

Bu platformaning eng muhim sahifasi.

Dashboard layout:

### Sidebar
- Logo
- Dashboard
- My Courses
- AI Tutor
- AI Speaking
- Games & Quizzes
- My Progress
- Profile
- Settings

### Header
- Search
- Notifications
- User Avatar
- User Profile Menu

### Main Content

1. Welcome Section
   - Welcome back!
   - User name
   - Short motivational message.

2. Daily Learning Goal
   - Daily goal.
   - Completed lessons.
   - Progress indicator.

3. Continue Learning
   - Kurs rasmi.
   - Kurs nomi.
   - Progress percentage.
   - Continue button.

4. My Courses
   - Enrolled courses.
   - Course progress.
   - Course status.

5. Weekly Activity
   - Weekly learning chart.

6. Learning Statistics
   - Completed lessons.
   - Learning hours.
   - Quiz scores.
   - Current streak.

7. Recommended Courses

8. Upcoming Tasks

9. AI Tutor Shortcut

Dashboard tartibli va vizual jihatdan muvozanatli bo‘lsin.

---

# 7. COURSES PAGE

Kurslar sahifasida:

- Search courses.
- Category filters.
- Difficulty filters.
- Popular courses.
- Recommended courses.
- Course cards.
- Course progress.

Kurs kategoriyalari:

- English
- Programming
- Mathematics
- Artificial Intelligence
- Science
- Business
- Marketing
- Design

Har bir course card ichida:
- Course image.
- Course title.
- Short description.
- Difficulty level.
- Number of lessons.
- Progress (agar kurs boshlangan bo‘lsa).
- View Course button.

---

# 8. COURSE DETAILS PAGE

- Course cover.
- Course title.
- Description.
- Instructor information (demo).
- Learning objectives.
- Course curriculum.
- Lessons list.
- Lesson completion status.
- Start Learning button.

Darslar modul va mavzular bo‘yicha tartiblangan bo‘lsin.

---

# 9. AI TUTOR PAGE

AI Tutor alohida zamonaviy interfeysga ega bo‘lsin.

- Chat interface.
- Message bubbles.
- Text input.
- Send button.
- Suggested questions.
- Topic selection.
- Conversation history.
- AI status indicator.

AI bilan bog‘liq elementlarda Secondary Purple rangidan foydalan.

Hozircha mock AI responses ishlat. Haqiqiy AI API integratsiyasi qilma.

---

# 10. AI SPEAKING PAGE

AI Speaking uchun maxsus voice learning interface yarat.

UI elementlari:

- Katta microphone button.
- Start Conversation.
- End Conversation.
- Audio waveform visualization.
- Listening status.
- AI Speaking status.
- Conversation duration.
- Language selector.
- Speaking topic selector.

Holatlar:
- Idle
- Connecting
- Listening
- AI Speaking
- Finished
- Error

Hozircha faqat demo UI. Real mikrofon, WebSocket yoki Gemini Live integratsiyasini hozircha qilma.

---

# 11. GAMES & QUIZZES PAGE

Gamification dizayni:

- Quiz cards.
- Daily challenges.
- Categories.
- Difficulty levels.
- Points.
- Leaderboard.
- Achievement badges.
- Quiz history.

Quiz oynasi:
- Question.
- Multiple choice answers.
- Timer.
- Progress indicator.
- Next Question.
- Final Result.

Kamida bitta ishlaydigan demo quiz yarat.

---

# 12. MY PROGRESS PAGE

Student progress dashboard:

- Overall learning progress.
- Weekly activity chart.
- Monthly activity chart.
- Completed courses.
- Completed lessons.
- Quiz performance.
- Learning time.
- Achievement badges.
- Learning streak.

Chart va statistikalar tushunarli bo‘lsin.

---

# 13. PROFILE & SETTINGS

Profile:
- Avatar.
- Full name.
- Email (demo).
- Learning interests.
- Enrolled courses.
- Achievements.

Settings:
- Account settings.
- Language settings.
- Notification preferences.
- Theme settings (Dark Mode keyingi bosqich uchun tayyor bo‘lsin).

---

# 14. ADMIN DASHBOARD

Hozircha faqat UI dizaynini yarat.

Admin uchun:
- Overview.
- Total Students.
- Total Courses.
- Total Lessons.
- Active Users.
- Course Management.
- Student Management.
- Quiz Management.
- Analytics.
- Recent Activities.

Admin va Student dashboard dizayni bir xil Design Systemdan foydalansin.

---

# 15. RESPONSIVE DESIGN

Platforma quyidagi qurilmalarda to‘g‘ri ishlasin:

- Desktop
- Laptop
- Tablet
- Mobile

Mobile'da sidebar qulay mobile navigationga aylansin.

Cards, charts, tables va boshqa elementlar ekran o‘lchamiga moslashsin.

---

# 16. FUNCTIONAL REQUIREMENTS

- Barcha sahifalarda routing ishlasin.
- Sidebar linklari ishlasin.
- Buttons ishlasin.
- Search va filterlar demo holatda ishlasin.
- Quiz ishlasin.
- Course cards tegishli sahifaga olib borsin.
- Tabs va dropdownlar ishlasin.
- Mock data ishlatish mumkin.

Hech qanday tugma shunchaki dekorativ bo‘lib qolmasin.

Backend, database, authentication va real AI integratsiyasi bu bosqichga kirmaydi.

---

# 17. DEVELOPMENT ORDER

Ishni quyidagi tartibda bajar:

1. Existing project audit.
2. Design System.
3. Global styles va CSS variables.
4. Shared components.
5. Landing Page.
6. Student Dashboard.
7. Courses va Course Details.
8. AI Tutor.
9. AI Speaking.
10. Games & Quizzes.
11. My Progress.
12. Profile & Settings.
13. Admin Dashboard.
14. Responsive optimization.
15. Testing va bug fixing.

Har bir bosqichni tugatgandan keyin natijani tekshir.

---

# 18. FINAL QUALITY REQUIREMENTS

- Professional production-quality UI.
- Consistent color palette.
- Consistent spacing.
- No broken routes.
- No broken components.
- No unnecessary duplicate code.
- No horizontal overflow on mobile.
- No fake real AI functionality.
- No placeholder sections without meaningful UI.
- Clean and maintainable code.

Ish yakunida:
1. Yaratilgan sahifalar ro‘yxatini ber.
2. Yaratilgan komponentlarni tushuntir.
3. Qaysi funksiyalar demo ekanini ko‘rsat.
4. Qanday ishga tushirishni yoz.
5. Tekshiruv natijalarini bildir.

**ENG MUHIM QOIDA:** Biz tanlagan rasmiy ranglar palitrasini o‘zboshimchalik bilan o‘zgartirma. Barcha sahifalar bitta yaxlit AI Learning Platform mahsulotidek ko‘rinishi kerak.
Update the project branding.

Official product name: **VOXY**

Brand identity:
- Brand name: VOXY
- Product category: AI-powered Learning Platform (EdTech)
- Tagline: "Learn smarter. Grow faster."
- Logo text: VOXY
- Primary color: #2563EB
- Secondary color: #8B5CF6

Requirements:
1. Replace all generic project names with VOXY.
2. Use VOXY in the navbar, sidebar, dashboard, login/register pages, browser metadata and footer.
3. Create a clean, modern VOXY text-based logo with a distinctive visual identity.
4. Keep the previously selected official color palette unchanged.
5. Maintain consistent branding across every page.
6. Do not change existing functionality or project architecture unnecessarily.