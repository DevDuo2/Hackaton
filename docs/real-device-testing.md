# VOXY: real-device testing

The automated tests and the browser checks use a **fake** Gemini. This guide covers what has to be checked by a person, with a real key, a real microphone and real phones.

**What counts as "it works":** the student's speech reaches Gemini, the tutor answers **out loud**, and the student can interrupt.

## 0. Preparation (once)

1. `.env` must contain `BOT_TOKEN`, `GEMINI_API_KEY` and `MINI_APP_URL`, and `APP_ENV=development`. Never paste the key into chat or into the code.
2. Check the key and the model. This makes a few seconds of real API usage:
   ```
   .venv\Scripts\python scripts\check_gemini.py
   ```
   Expected output: `model check: OK`, `audio received: … ≈ N s`, `resumption handle received: True`, `tutor said: '…'`.
   - `ai_auth_failed` means the key is wrong. `ai_model_unavailable` means set a different `GEMINI_LIVE_MODEL`. `ai_quota` means the limit has run out.
3. Start the backend: `uvicorn app.main:app --port 8000`

## 1. Desktop browser

### 1a. Local (HTTPS not needed: localhost counts as a secure context)
1. Set `DEV_SKIP_TELEGRAM_AUTH=true` in `.env` and restart the server.
2. Open `http://localhost:8000/miniapp/` in Chrome or Edge.
3. The pills should show "Server: ulangan" (connected) and "AI: tayyor" (ready).

### 1b. Over HTTPS (the same address Telegram will use)
1. `ngrok http 8000` (or `cloudflared tunnel --url http://localhost:8000`).
2. Open `https://<tunnel>/miniapp/`. The dev bypass **does not work** through a tunnel (a security measure), so you'll get `invalid_init_data`. That's correct: over HTTPS, test through Telegram.

### Checklist (1a)
| # | Action | Expected result |
|---|---|---|
| 1 | Open the page | No microphone prompt appears |
| 2 | Click **Suhbatni boshlash** (Start) | The browser asks for the microphone |
| 3 | Click "Block" | The red state "Mikrofonga ruxsat berilmadi" (permission denied), with no connection to the server |
| 4 | Allow it in the site settings, then Start again | Labels change: Ulanmoqda (connecting) → Ulandi · Tinglayapti (connected, listening) |
| 5 | Say nothing | VOXY **greets you out loud** first and asks one question |
| 6 | Answer in Uzbek | The caption shows "Siz: …" (you); VOXY answers out loud and briefly |
| 7 | Interrupt VOXY mid-sentence | Its audio stops **within about 0.5 s**, and it responds to what you said |
| 8 | Mic button (mute) | "OVOZ O'CHIRILGAN" (muted); VOXY doesn't hear you |
| 9 | Unmute | It hears you again |
| 10 | **Suhbatni tugatish** (End) | The browser's microphone indicator turns off **immediately**, then the summary appears |
| 11 | Mute with headphones off | Check that VOXY doesn't interrupt itself (echo) |
| 12 | English Speaking mode | VOXY speaks mainly English and corrects mistakes politely |
| 13 | Language: Русский | VOXY speaks Russian |
| 14 | Leave the call running for 10+ minutes | A "Qayta ulanmoqda" (reconnecting) label may flash briefly; the conversation continues without losing context |

Afterwards, **turn `DEV_SKIP_TELEGRAM_AUTH` back off.**

## 2. Telegram on Android

1. Start the tunnel; `MINI_APP_URL=https://<tunnel>/miniapp/`; `DEV_SKIP_TELEGRAM_AUTH=false`.
2. Restart the bot: `python -m app.bot`. On free ngrok the address changes on every restart, so update `MINI_APP_URL` and restart the bot each time.
3. In Telegram: `/start` → **Open VOXY**.
4. Run checklist items 1–14. Things to check specifically on Android:
   - Does Telegram request the system microphone permission? If you denied it, enable it under Android Settings → Apps → Telegram → Permissions → Microphone.
   - Is audio heard **through the speaker** (not the earpiece), at normal volume?
   - Echo: with the speakerphone on, does VOXY interrupt itself?
   - Minimise Telegram mid-conversation: the session should end and the microphone indicator should turn off.
   - Switch between Wi-Fi and mobile data: you'll see "Aloqa uzildi" (connection lost) or the session continues. Note which.
5. If something doesn't work, connect Chrome DevTools (`chrome://inspect`, with "WebView debugging" enabled in Telegram's debug settings) and copy the console errors.

## 3. Telegram on iOS

1. The same setup as for Android.
2. Things to check specifically on iOS:
   - iOS 14.5 or later is required (AudioWorklet). On older versions you'll see "qo'llab-quvvatlamaydi" (not supported).
   - Settings → Telegram → Microphone must be on.
   - **The silent switch:** with silent mode on, does WebAudio produce sound? (On iOS it may be muted.)
   - Does the very first tap on Start produce sound? (Audio is unlocked by the tap; the AudioContext is created inside the tap handler.)
   - Bluetooth headphones: does switching between input and output devices work?
   - Lock the screen mid-conversation: the session should end and the microphone should be released.
3. To debug, use Safari → Develop → [iPhone] → the Telegram WebView. This needs a Mac and Web Inspector enabled on the iPhone.

## 4. What can only be checked on a real device or with a real key

- Speech recognition quality and latency of Gemini, with real Uzbek, English and Russian speech.
- Whether VAD interruption works on real speech and not just on noise.
- Whether the tutor follows the rules in the system prompt: one question at a time, short answers, polite corrections.
- Echo cancellation through the phone speaker.
- Microphone permission behaviour in the Telegram WebView on Android and iOS.
- Real Gemini reconnects (`go_away` and session resumption) after about 10 minutes.
- The real JSON output of the summary model.

## 5. Recording the results

For every device, write down: the model, OS version, Telegram version, the numbers of the checklist items that passed or failed, and for failures, the console error text (with keys and tokens removed).
