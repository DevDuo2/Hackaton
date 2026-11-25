/**
 * VOXY responsive regression testi — 320 / 375 / 390 / 768 / 1280.
 *
 * Ishga tushirish (ikkala server ishlab turishi kerak):
 *   1) backend:  cd backend && python run.py
 *   2) frontend: npm run dev -- --port 3100
 *   3) test:     npm run qa:responsive
 *
 * Birinchi marta: npx playwright install chromium
 *
 * Har bir sahifada tekshiriladi:
 *  - gorizontal scroll (document kengligi viewportdan oshmasligi)
 *  - viewportdan chiqib ketgan elementlar
 *  - mobil navigatsiya mavjudligi (lg dan kichik ekranlarda)
 *  - matn o'lchami (10px dan kichik bo'lmasligi)
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:3100';
const WIDTHS = [320, 375, 390, 768, 1280];
const PAGES = [
  '/',
  '/login',
  '/register',
  '/onboarding',
  '/dashboard',
  '/courses',
  '/courses/fizika-mexanika-elektr',
  '/ai-tutor',
  '/speaking',
  '/games',
  '/progress',
  '/profile',
  '/settings',
  '/admin',
  '/admin/students',
];

const SESSION = {
  id: 'u_student_1',
  name: 'Zumradxon Xudoyberganova',
  email: 'student@voxy.edu',
  role: 'student',
  selectedSubject: 'matematika',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  totalXP: 2840,
  streakDays: 12,
};

const ADMIN_SESSION = { ...SESSION, id: 'u_admin_1', name: 'Admin Nazoratchi', email: 'admin@voxy.edu', role: 'admin' };

async function login(page, admin) {
  const res = await page.request.post(`${BASE}/api/${admin ? 'admin' : 'auth'}/login`, {
    data: admin
      ? { username: 'admin', password: 'admin123' }
      : { email: 'student@voxy.edu', password: 'password123' },
  });
  const body = await res.json();
  await page.addInitScript(
    ([user, token]) => {
      localStorage.setItem('voxy_auth_user', JSON.stringify(user));
      localStorage.setItem('voxy_auth_token', token);
      localStorage.setItem('voxy_active_subject', 'matematika');
    },
    [body.user ?? (admin ? ADMIN_SESSION : SESSION), body.token ?? 'yoq']
  );
}

const problems = [];

const browser = await chromium.launch();
for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await login(page, false);

  for (const path of PAGES) {
    const admin = path.startsWith('/admin');
    if (admin) await login(page, true);

    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(admin ? 2500 : 1800);

    const report = await page.evaluate((vw) => {
      const doc = document.documentElement;
      const overflow = doc.scrollWidth - vw;

      const wide = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // Faqat O'NGGA chiqib ketganlar muhim: chapga chiqqanlar — yopilgan drawer.
        if (r.right > vw + 2) {
          // Yopiq/siljitilgan panel (Tailwind v4 `translate` xossasini ishlatadi)
          let node = el;
          let hidden = false;
          while (node && node !== document.body) {
            const st = getComputedStyle(node);
            const t = st.translate;
            if (st.transform !== 'none' || (t && t !== 'none' && t !== '0px')) { hidden = true; break; }
            if (['auto', 'scroll', 'hidden'].includes(st.overflowX)) { hidden = true; break; }
            node = node.parentElement;
          }
          if (hidden) continue;
          wide.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 40)} right=${Math.round(r.right)}`);
        }
        if (wide.length > 4) break;
      }

      const tiny = [];
      for (const el of document.querySelectorAll('p, span, a, button, li, h1, h2, h3, h4, td, th, label')) {
        if (!el.textContent?.trim()) continue;
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size > 0 && size < 10) tiny.push(`${el.tagName.toLowerCase()} ${size}px "${el.textContent.trim().slice(0, 20)}"`);
        if (tiny.length > 3) break;
      }

      const appShell = Boolean(document.querySelector('aside'));
      const mobileNav =
        vw >= 1024 || !appShell
          ? true
          : Boolean(
              [...document.querySelectorAll('button, a')].some(
                (b) => (b.className || '').toString().includes('lg:hidden') || b.getAttribute('aria-label') === 'Menyuni yopish'
              )
            );

      return { overflow, wide, tiny, mobileNav, title: document.title };
    }, width);

    if (report.overflow > 2) problems.push(`${width}px ${path}: gorizontal scroll (+${report.overflow}px)`);
    if (report.wide.length) problems.push(`${width}px ${path}: chiqib ketgan element -> ${report.wide.join('; ')}`);
    if (report.tiny.length) problems.push(`${width}px ${path}: juda kichik matn -> ${report.tiny.join('; ')}`);
    if (!report.mobileNav) problems.push(`${width}px ${path}: mobil navigatsiya topilmadi`);

    const mark = report.overflow <= 2 && !report.wide.length && !report.tiny.length && report.mobileNav ? 'OK ' : 'XATO';
    console.log(`${mark} ${String(width).padStart(4)}px  ${path}`);
  }
  await context.close();
}
await browser.close();

console.log(`\n==== ${problems.length === 0 ? 'HAMMASI JOYIDA' : problems.length + ' MUAMMO'} ====`);
problems.forEach((p) => console.log('  - ' + p));
