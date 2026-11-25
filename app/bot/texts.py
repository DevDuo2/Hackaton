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
    "Ilovani ochib «Suhbatni boshlash» tugmasini bosing — mikrofon faqat shundan keyin yoqiladi. "
    "Suhbat oxirida siz uchun qisqa xulosa tayyorlanadi.\n"
    "🎧 Naushnikdan foydalanish tavsiya etiladi: aks holda ustozning ovozi mikrofonga qaytib, "
    "uning gapini bo'lib yuborishi mumkin."
)

ENGLISH_SPEAKING = (
    "<b>English Speaking</b>\n\n"
    "Ingliz tilida erkin so'zlashishni mashq qilish rejimi.\n\n"
    "AI suhbatdosh siz bilan ingliz tilida gaplashadi, xatolaringizni muloyim tuzatadi va "
    "yangi so'zlarni tushuntiradi. Ilovani ochib «Suhbatni boshlash» tugmasini bosing."
)

HELP = (
    "<b>Yordam</b>\n\n"
    "• <b>Open VOXY</b> — ilovani ochish\n"
    "• <b>AI Voice Tutor</b> — fanlar bo'yicha ovozli ustoz\n"
    "• <b>English Speaking</b> — ingliz tilida so'zlashuv mashqi\n\n"
    "Suhbat <b>ilova ichida</b>, jonli ovozda bo'lib o'tadi — botga ovozli xabar yuborish shart emas.\n"
    "Mikrofon faqat siz «Suhbatni boshlash» tugmasini bosganingizda yoqiladi.\n"
    "Menyuni qayta ochish: /start"
)

# Ovozli xabar yuborilganda. Bot ovozli xabarlarni tahlil qilmaydi: suhbat Mini App ichida,
# jonli rejimda kechadi — foydalanuvchini aldab "92% to'g'ri" kabi baho bermaymiz.
VOICE_MESSAGE = (
    "Ovozli xabarni eshitdim, lekin VOXY ovozli xabarlarni alohida tahlil qilmaydi. 🙂\n\n"
    "Suhbat <b>jonli</b> kechadi: ilovani ochib «Suhbatni boshlash» tugmasini bosing va "
    "AI ustoz bilan xuddi telefonda gaplashgandek gaplashing — u sizni eshitadi va darhol javob beradi."
)

# Har qanday boshqa xabar (matn, rasm, fayl...) uchun. Jim turish — eng yomon javob.
FALLBACK = (
    "Bu xabarni tushunmadim. 🙂\n\n"
    "VOXY bilan <b>ovozli</b> suhbat quriladi: quyidagi tugma bilan ilovani ochib, "
    "«Suhbatni boshlash» ni bosing.\n"
    "Menyu: /start · Yordam: /help"
)

# Noma'lum buyruq (/menu, /voice, /foo ...) uchun. Ilgari bunday buyruqqa
# HECH QANDAY javob kelmasdi: fallback handleri `~filters.COMMAND` bilan
# ro'yxatdan o'tgani uchun buyruqlarni butunlay chetlab o'tardi va bot jim
# qolardi — aynan shu holatdan qochish uchun fallback yozilgan edi.
UNKNOWN_COMMAND = (
    "Bunday buyruq yo'q. 🙂\n\n"
    "Mavjud buyruqlar:\n"
    "• /start — menyuni ochish\n"
    "• /help — yordam va qisqa qo'llanma"
)

OPEN_APP = "Ilovani ochish"
BACK = "« Menyu"
