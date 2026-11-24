import { Microphone, MicState, isSupported, queryPermission } from "./mic.js";
import { AudioEngine, createAudioContext, isAudioEngineSupported } from "./audio.js";
import { ConnState, VoiceClient } from "./voice-client.js";
import { BUSY_PHASES, LIVE_PHASES, Phase, SessionController } from "./session.js";

const tg = window.Telegram?.WebApp;
const $ = (selector) => document.querySelector(selector);
// Older Telegram clients lack some APIs; calling them only logs warnings, so check first.
const tgSupports = (version) => Boolean(tg?.isVersionAtLeast?.(version));
const haptic = tgSupports("6.1") ? tg.HapticFeedback : null;
const BASE_URL = new URL("../", location.href); // Mini App lives at /miniapp/, API at /api/

const ui = {
  app: $(".app"),
  serverPill: $("#server-status"),
  aiPill: $("#ai-status"),
  micPill: $("#mic-status"),
  modeInputs: document.querySelectorAll('input[name="mode"]'),
  language: $("#language"),
  subject: $("#subject"),
  subjectField: $("#subject-field"),
  modeHint: $("#mode-hint"),
  micButton: $("#mic-button"),
  micButtonLabel: $("#mic-button-label"),
  meterBars: document.querySelectorAll("#meter span"),
  status: $("#stage-status"),
  stateChip: $("#state-chip"),
  caption: $("#caption"),
  notice: $("#notice"),
  noticeTitle: $("#notice-title"),
  noticeText: $("#notice-text"),
  summary: $("#summary"),
  summaryBody: $("#summary-body"),
  summaryClose: $("#summary-close"),
  start: $("#start-button"),
  end: $("#end-button"),
};

/* View states = session phases (see session.js): mic states (idle, requesting, denied, no-device,
   busy, unsupported, error) plus connecting, listening, speaking, reconnecting, ending, disconnected. */
const View = Phase;
const LIVE_VIEWS = LIVE_PHASES;
const BUSY_VIEWS = BUSY_PHASES;
// Views caused by the microphone itself (other errors must not mark the mic as broken).
const MIC_VIEWS = new Set([View.REQUESTING, MicState.DENIED, MicState.NO_DEVICE, MicState.BUSY, MicState.UNSUPPORTED]);

const STATUS_TEXT = {
  [View.IDLE]: "Boshlash uchun tugmani bosing. Mikrofon faqat shundan keyin so'raladi.",
  [View.REQUESTING]: "Mikrofonga ruxsat so'ralmoqda…",
  [View.CONNECTING]: "AI ustozga ulanmoqda…",
  [View.LISTENING]: "Tinglayapman — gapiring.",
  [View.SPEAKING]: "VOXY gapiryapti. Gapirsangiz, u to'xtaydi.",
  [View.RECONNECTING]: "Aloqa tiklanmoqda… Suhbat shu joyidan davom etadi.",
  [View.ENDING]: "Suhbat yakunlandi. Xulosa tayyorlanmoqda…",
  [View.DISCONNECTED]: "Aloqa uzildi. Qaytadan boshlash uchun tugmani bosing.",
  [MicState.DENIED]:
    "Mikrofonga ruxsat berilmadi. Telegram yoki brauzer sozlamalarida ruxsat bering va qayta urinib ko'ring.",
  [MicState.NO_DEVICE]: "Mikrofon topilmadi. Qurilmangizga mikrofon ulang.",
  [MicState.BUSY]: "Mikrofon boshqa ilova tomonidan band. Uni yopib, qayta urinib ko'ring.",
  [MicState.UNSUPPORTED]:
    "Bu qurilma yoki brauzer ovozli suhbatni qo'llab-quvvatlamaydi (HTTPS va zamonaviy brauzer kerak).",
  [View.ERROR]: "Xatolik yuz berdi. Qayta urinib ko'ring.",
};

const MIC_PILL_TEXT = {
  granted: "ruxsat berilgan",
  prompt: "ruxsat so'raladi",
  denied: "ruxsat yo'q",
  unknown: "noma'lum",
  [MicState.REQUESTING]: "so'ralmoqda…",
  [MicState.ACTIVE]: "yoqilgan",
  muted: "o'chirilgan",
  [MicState.NO_DEVICE]: "topilmadi",
  [MicState.BUSY]: "band",
  [MicState.UNSUPPORTED]: "qo'llab-quvvatlanmaydi",
  [MicState.ERROR]: "xatolik",
};

const AI_PILL = {
  checking: ["checking", "AI: tekshirilmoqda…"],
  ready: ["prompt", "AI: tayyor"],
  unconfigured: ["offline", "AI: sozlanmagan"],
  unknown: ["unknown", "AI: noma'lum"],
  [ConnState.CONNECTING]: ["checking", "AI: ulanmoqda…"],
  [ConnState.CONNECTED]: ["online", "AI: ulangan"],
  reconnecting: ["checking", "AI: qayta ulanmoqda…"],
  [ConnState.ENDING]: ["checking", "AI: yakunlanmoqda…"],
  [ConnState.DISCONNECTED]: ["offline", "AI: uzildi"],
  [ConnState.ERROR]: ["offline", "AI: xato"],
};

const STORAGE_KEY = "voxy:prefs";

// Visible state label (Connecting / Connected·Listening / AI speaking / Muted / ...).
const STATE_CHIP = {
  [View.REQUESTING]: "Ruxsat",
  [View.CONNECTING]: "Ulanmoqda",
  [View.LISTENING]: "Ulandi · Tinglayapti",
  [View.SPEAKING]: "VOXY gapiryapti",
  [View.RECONNECTING]: "Qayta ulanmoqda",
  [View.ENDING]: "Yakunlanmoqda",
  [View.DISCONNECTED]: "Aloqa uzildi",
  [View.ERROR]: "Xato",
  muted: "Ovoz o'chirilgan",
};

let view = View.IDLE;
let muted = false;
let meter = null;
let aiIdleState = "checking";
let session = null; // SessionController, created in init()

/* ---------- Rendering ---------- */

function setPill(pill, state, text) {
  pill.dataset.state = state;
  pill.querySelector(".pill__label").textContent = text;
}

function setMicPill(state) {
  setPill(ui.micPill, state === "muted" ? "prompt" : state, `Mikrofon: ${MIC_PILL_TEXT[state] ?? MIC_PILL_TEXT.unknown}`);
}

function setAiPill(key) {
  const [state, text] = AI_PILL[key] ?? AI_PILL.unknown;
  setPill(ui.aiPill, state, text);
}

function render(next, message) {
  view = next;
  const live = LIVE_VIEWS.has(view);
  const busy = BUSY_VIEWS.has(view);
  const unconfigured = aiIdleState === "unconfigured";

  ui.app.dataset.state = view;
  ui.app.dataset.live = String(live);
  ui.app.dataset.muted = String(live && muted);
  ui.status.textContent = live && muted ? "Mikrofon o'chirib qo'yilgan (mute)." : message ?? STATUS_TEXT[view];
  const chip = live && muted ? STATE_CHIP.muted : STATE_CHIP[view];
  ui.stateChip.hidden = !chip;
  ui.stateChip.textContent = chip ?? "";
  ui.stateChip.dataset.state = live && muted ? "muted" : view;

  ui.start.disabled = live || busy || view === MicState.UNSUPPORTED || unconfigured;
  ui.start.setAttribute("aria-busy", String(busy));
  ui.start.textContent =
    view === View.REQUESTING ? "Ruxsat kutilmoqda…" : view === View.CONNECTING ? "Ulanmoqda…" : "Suhbatni boshlash";
  ui.end.disabled = !live && view !== View.REQUESTING && view !== View.CONNECTING;

  ui.micButton.disabled = busy || view === MicState.UNSUPPORTED || (!live && unconfigured);
  ui.micButton.setAttribute("aria-pressed", String(live && !muted));
  ui.micButtonLabel.textContent = live ? (muted ? "Mikrofonni yoqish" : "Mikrofonni o'chirish (mute)") : "Suhbatni boshlash";

  const locked = live || busy;
  ui.modeInputs.forEach((input) => (input.disabled = locked));
  ui.subject.disabled = locked;
  ui.language.disabled = locked || currentMode() === "english";

  if (live || view === View.CONNECTING) setMicPill(muted ? "muted" : MicState.ACTIVE);
  else if (MIC_VIEWS.has(view)) setMicPill(view === MicState.DENIED ? "denied" : view);
  else if (!busy) refreshPermission();
  if (!live && !busy) ui.caption.hidden = true;
}

function renderNotice() {
  if (aiIdleState === "unconfigured") {
    ui.notice.dataset.tone = "warn";
    ui.noticeTitle.textContent = "AI ustoz serverda sozlanmagan.";
    ui.noticeText.textContent = "Administrator GEMINI_API_KEY ni sozlashi kerak. Hozircha suhbatni boshlab bo'lmaydi.";
  } else {
    ui.notice.dataset.tone = "info";
    ui.noticeTitle.textContent = "Maxfiylik";
    ui.noticeText.textContent =
      "Suhbat davomida ovozingiz AI ustozga (Google Gemini) yuboriladi. Mikrofon faqat siz boshlaganingizda yoqiladi.";
  }
}

/* ---------- Captions ---------- */

let captionRole = null;
let captionText = "";

function showCaption(role, text) {
  if (role !== captionRole) {
    captionRole = role;
    captionText = "";
  }
  captionText = (captionText + text).slice(-280);
  ui.caption.hidden = false;
  ui.caption.dataset.role = role;
  ui.caption.textContent = `${role === "tutor" ? "VOXY" : "Siz"}: ${captionText.trim()}`;
}

function resetCaption() {
  captionRole = null;
  captionText = "";
  ui.caption.textContent = "";
  ui.caption.hidden = true;
}

/* ---------- Summary ---------- */

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text; // textContent only: model output is never parsed as HTML
  if (className) node.className = className;
  return node;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m} daq ${s} son` : `${s} son`;
}

function listSection(title, items, toText) {
  if (!items?.length) return null;
  const section = el("section", null, "summary__section");
  section.append(el("h3", title));
  const ul = el("ul");
  items.forEach((item) => ul.append(el("li", toText ? toText(item) : item)));
  section.append(ul);
  return section;
}

function showSummary(summary) {
  ui.summaryBody.replaceChildren();
  if (!summary) {
    ui.summaryBody.append(el("p", "Xulosani olib bo'lmadi: aloqa vaqtida uzildi.", "summary__note"));
  } else {
    ui.summaryBody.append(
      el(
        "p",
        `Davomiyligi: ${formatDuration(summary.duration_seconds)} · Sizning javoblaringiz: ${summary.student_turns}`,
        "summary__meta",
      ),
    );
    if (summary.note) ui.summaryBody.append(el("p", summary.note, "summary__note"));
    const c = summary.content;
    if (c) {
      const sections = [
        listSection("Muhokama qilingan mavzular", c.topics),
        listSection("Javob berilgan savollar", c.questions_answered),
        listSection("Yangi so'zlar", c.new_vocabulary, (v) => `${v.term} — ${v.meaning}`),
        listSection("Grammatik tuzatishlar", c.grammar_corrections, (g) =>
          `${g.original} → ${g.corrected}${g.explanation ? ` (${g.explanation})` : ""}`,
        ),
        listSection("Tavsiyalar", c.recommendations),
      ].filter(Boolean);
      if (sections.length) ui.summaryBody.append(...sections);
      else ui.summaryBody.append(el("p", "Bu suhbatdan alohida qayd etiladigan narsa topilmadi.", "summary__note"));
    }
  }
  ui.summary.hidden = false;
  ui.summary.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  ui.summaryClose.focus({ preventScroll: true });
}

function hideSummary() {
  ui.summary.hidden = true;
}

/* ---------- Mode / preferences ---------- */

function currentMode() {
  return document.querySelector('input[name="mode"]:checked')?.value ?? "tutor";
}

function applyMode() {
  const english = currentMode() === "english";
  ui.subjectField.hidden = english;
  ui.modeHint.hidden = !english;
  if (english) ui.language.value = "en";
  ui.language.disabled = english || LIVE_VIEWS.has(view) || BUSY_VIEWS.has(view);
}

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function savePrefs() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode: currentMode(), language: ui.language.value, subject: ui.subject.value }),
    );
  } catch {
    /* storage unavailable (private mode / WebView) — preferences just won't persist */
  }
}

function selectIfValid(select, value) {
  if (value && [...select.options].some((o) => o.value === value)) select.value = value;
}

function initPreferences() {
  const prefs = loadPrefs();
  const urlMode = new URLSearchParams(location.search).get("mode"); // set by the bot buttons
  const mode = ["tutor", "english"].includes(urlMode) ? urlMode : prefs.mode;
  ui.modeInputs.forEach((input) => (input.checked = input.value === (mode ?? "tutor")));
  selectIfValid(ui.language, prefs.language);
  selectIfValid(ui.subject, prefs.subject);
  applyMode();

  ui.modeInputs.forEach((input) =>
    input.addEventListener("change", () => {
      applyMode();
      savePrefs();
    }),
  );
  ui.language.addEventListener("change", savePrefs);
  ui.subject.addEventListener("change", savePrefs);
}

/* ---------- Audio level meter (real levels: mic while listening, tutor while speaking) ---------- */

function startMeter(audio) {
  const bars = [...ui.meterBars];
  const bins = new Uint8Array(audio.inputAnalyser.frequencyBinCount);
  const step = Math.floor(bins.length / 2 / bars.length); // voice lives in the lower half
  let frame = 0;

  const tick = () => {
    const speaking = audio.speaking;
    (speaking ? audio.outputAnalyser : audio.inputAnalyser).getByteFrequencyData(bins);
    let total = 0;
    bars.forEach((bar, i) => {
      let sum = 0;
      for (let j = i * step; j < (i + 1) * step; j++) sum += bins[j];
      const value = muted && !speaking ? 0 : sum / step / 255;
      total += value;
      bar.style.transform = `scaleY(${Math.max(0.12, Math.min(1, value * 1.6))})`;
    });
    ui.app.style.setProperty("--level", (total / bars.length).toFixed(3));
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    stop() {
      cancelAnimationFrame(frame);
      ui.app.style.setProperty("--level", "0");
      bars.forEach((bar) => (bar.style.transform = ""));
    },
  };
}

/* ---------- Conversation lifecycle (logic and its tests live in session.js) ---------- */

let previousPhase = View.IDLE;

function createSession() {
  return new SessionController({
    createMic: (options) => new Microphone(options),
    micSupported: () => isSupported(),
    createAudioContext,
    isAudioSupported: isAudioEngineSupported,
    createEngine: (ctx, handlers) => new AudioEngine(ctx, handlers),
    createClient: (handlers) => new VoiceClient({ baseUrl: BASE_URL, ...handlers }),
    // Only preferences come from the UI; who the student is comes from initData, verified on the server.
    getParams: () => ({
      initData: tg?.initData ?? "",
      mode: currentMode(),
      language: ui.language.value,
      subject: currentMode() === "english" ? null : ui.subject.value,
    }),
    onChange: onSessionChange,
    onCaption: showCaption,
  });
}

function onSessionChange(state) {
  muted = state.muted;
  setAiPill(state.ai ?? aiIdleState);

  // The level meter lives exactly as long as the audio engine.
  const engine = session?.engine;
  if (engine && !meter) meter = startMeter(engine);
  if (!engine && meter) {
    meter.stop();
    meter = null;
  }

  if (state.phase !== previousPhase) {
    if (LIVE_VIEWS.has(state.phase) && previousPhase === View.CONNECTING) haptic?.impactOccurred("medium");
    if ([View.ERROR, View.DENIED, View.NO_DEVICE, View.BUSY, View.DISCONNECTED].includes(state.phase)) {
      haptic?.notificationOccurred("error");
    }
    previousPhase = state.phase;
  }
  render(state.phase, state.message ?? undefined);
}

function startConversation() {
  if (session.isLive || session.isBusy) return; // one session at a time
  hideSummary();
  resetCaption();
  session.start(); // not awaited: its first, synchronous step must stay inside this click
}

async function endConversation() {
  const { ended, summary } = await session.end(); // mic + audio are released before this resolves
  refreshPermission();
  if (ended) showSummary(summary);
}

function toggleMute() {
  session.toggleMute();
  haptic?.selectionChanged();
}

async function refreshPermission() {
  if (!isSupported()) return setMicPill(MicState.UNSUPPORTED);
  if (session && (session.isLive || session.isBusy)) return;
  setMicPill(await queryPermission());
}

/* ---------- Server / AI availability (real requests) ---------- */

async function getJson(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(new URL(path, BASE_URL), { signal: controller.signal, cache: "no-store" });
    return response.ok ? await response.json() : null;
  } finally {
    clearTimeout(timer);
  }
}

async function checkServer() {
  setPill(ui.serverPill, "checking", "Server: tekshirilmoqda…");
  setAiPill("checking");
  try {
    const health = await getJson("api/health");
    const ok = health?.status === "ok";
    setPill(ui.serverPill, ok ? "online" : "offline", ok ? "Server: ulangan" : "Server: javob yo'q");
    const status = ok ? await getJson("api/voice/status") : null;
    aiIdleState = status == null ? "unknown" : status.configured ? "ready" : "unconfigured";
  } catch {
    setPill(ui.serverPill, "offline", "Server: ulanmadi");
    aiIdleState = "unknown";
  }
  if (!session?.state.ai) setAiPill(aiIdleState);
  renderNotice();
  render(view);
}

/* ---------- Boot ---------- */

function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  if (tgSupports("6.1")) {
    tg.setHeaderColor("#0d0e11");
    tg.setBackgroundColor("#0d0e11");
  }
}

function init() {
  initTelegram();
  session = createSession();
  initPreferences();
  renderNotice();

  ui.start.addEventListener("click", startConversation);
  ui.end.addEventListener("click", endConversation);
  ui.micButton.addEventListener("click", () => (LIVE_VIEWS.has(view) ? toggleMute() : startConversation()));
  ui.summaryClose.addEventListener("click", hideSummary);

  // Never keep the microphone open in the background.
  window.addEventListener("pagehide", () => session.abort());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && (LIVE_VIEWS.has(view) || BUSY_VIEWS.has(view))) endConversation();
  });

  render(View.IDLE);
  refreshPermission();
  checkServer();
}

init();
