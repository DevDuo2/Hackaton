"""User-facing bot texts (Uzbek, Latin script). HTML parse mode — escape user data."""

WELCOME = (
    "Assalomu alaykum, <b>{name}</b>! 👋\n\n"
    "<b>VOXY</b> — sun'iy intellekt yordamida ovozli ta'lim platformasi.\n"
    "Bu yerda siz AI ustoz bilan gaplashib o'rganasiz va ingliz tilida "
    "so'zlashishni mashq qilasiz.\n\n"
    "Boshlash uchun quyidagi menyudan tanlang."
)

VOICE_TUTOR = (
    "<b>AI Voice Tutor</b>\n\n"
    "Fan va tilni tanlang, so'ng AI ustoz bilan ovozli suhbat quring.\n\n"
    "⚠️ Hozircha ilova interfeysi va mikrofon tayyor. AI ustoz keyingi bosqichda ulanadi."
)

ENGLISH_SPEAKING = (
    "<b>English Speaking</b>\n\n"
    "Ingliz tilida erkin so'zlashishni mashq qilish rejimi.\n\n"
    "⚠️ Hozircha ilova interfeysi va mikrofon tayyor. AI suhbatdosh keyingi bosqichda ulanadi."
)

HELP = (
    "<b>Yordam</b>\n\n"
    "• <b>Open VOXY</b> — ilovani ochish\n"
    "• <b>AI Voice Tutor</b> — fanlar bo'yicha ovozli ustoz\n"
    "• <b>English Speaking</b> — ingliz tilida so'zlashuv mashqi\n\n"
    "Mikrofon faqat siz «Suhbatni boshlash» tugmasini bosganingizda yoqiladi.\n"
    "Menyuni qayta ochish: /start"
)

OPEN_APP = "Ilovani ochish"
BACK = "« Menyu"
