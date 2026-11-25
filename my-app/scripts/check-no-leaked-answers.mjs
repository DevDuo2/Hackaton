/**
 * Frontend ma'lumotlarida test javoblari qolmaganini tekshiradi.
 *
 * Nega kerak: `data/mockData.ts` brauzer bundliga tushadi. Ilgari u
 * SUBJECTS[].quizzes ichida `correctIndex` va `explanation` saqlar edi,
 * shuning uchun har qanday tashrifchi bundldan to'g'ri javoblarni o'qib
 * olardi — backend ularni yashirgani behuda ketardi.
 *
 * Ishga tushirish:  node scripts/check-no-leaked-answers.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['data', 'app', 'components', 'lib'];
const FORBIDDEN = /\bcorrectIndex\s*:\s*\d/;
const offenders = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue;
    const text = readFileSync(full, 'utf8');
    // Serverdan kelgan javobni O'QISH (q.correctIndex) muammo emas —
    // muammo faqat qiymatni frontendda QATTIQ YOZIB qo'yish.
    if (FORBIDDEN.test(text)) offenders.push(full);
  }
}

for (const root of ROOTS) {
  try {
    walk(root);
  } catch {
    // papka yo'q bo'lsa o'tkazib yuboriladi
  }
}

if (offenders.length > 0) {
  console.error('Frontend fayllarida qattiq yozilgan test javoblari topildi:');
  for (const f of offenders) console.error('  - ' + f);
  console.error('\nJavoblar faqat backendda qolishi kerak (/api/admin/quizzes).');
  process.exit(1);
}
console.log('OK: frontendda qattiq yozilgan test javobi yo\'q.');
