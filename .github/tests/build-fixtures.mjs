#!/usr/bin/env node
// P0140, етап 02, крок 6.1 — будує тестові копії клієнтів AIOS 0.8.3 для перевірки 3.
// Усі люди й бізнеси вигадані. Реальних даних оператора тут немає.
//
//   node ~/aios-p0140-work/fixtures/_build/build.mjs
//
// Основа кожної копії — `git archive v0.8.3` з клону шаблону (те саме, що дає
// установка з архіву: LICENSE, README.md, .gitattributes, .gitignore туди не потрапляють).
// Файли бізнесу — з блоків скіла установки 0.8.3, так, як їх пише setup.
// Перебудова стирає й створює заново лише папки копій (a, b, c1, c2).
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, relative } from "node:path";
import { homedir } from "node:os";

const W = process.env.AIOS_WORK || join(homedir(), "aios-p0140-work");
const TPL = join(W, "aios-template");
const OUT = join(W, "fixtures");
const TAG = "v0.8.3";
const DATE = "2026-10-30";

const SH = process.platform === "win32" ? { shell: "bash" } : {};   // Git Bash on Windows CI
const show = (p) => execSync(`git -C "${TPL}" show ${TAG}:${p}`, { encoding: "utf8", ...SH });
const setupBiz = show("system/skills/setup/02_business/CONTEXT.md");
const block = (file) => {
  const m = setupBiz.match(new RegExp("^###[^\\n]*`business/<slug>/" + file.replace(/\./g, "\\.") + "`[^\\n]*\\n[\\s\\S]*?^```\\n([\\s\\S]*?)\\n```$", "m"));
  if (!m) throw new Error("no template block for " + file);
  return m[1] + "\n";
};
const T = { business: block("core/business.md"), numbers: block("core/numbers.md"), goals: block("core/goals.md"), map: block("CONTEXT.md") };

function put(root, rel, text) { const p = join(root, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); }
function edit(root, rel, fn) { const p = join(root, rel); writeFileSync(p, fn(readFileSync(p, "utf8"))); }
function insertAfter(text, anchor, add) { const i = text.indexOf(anchor); if (i < 0) throw new Error("anchor not found: " + anchor); const j = i + anchor.length; return text.slice(0, j) + add + text.slice(j); }

// Карта бізнесу так, як її лишає 0.8.3: setup підставляє назву й рядок хмари;
// папки, що вже є, переходять у «What lives here» (правило AGENTS.md › Records);
// власні папки — в «Own to this business». Логіка рядків — як bizMap у update.mjs 0.8.3.
function bizMap({ name, cloud, extraSources = [], folders = [], own = [] }) {
  const cloudRow = cloud ? `| Cloud storage | the business's files | ${cloud} |` : "| _(none yet)_ | | |";
  const L = T.map.replace("[BUSINESS_NAME]", name).replace("[CLOUD_ROW]", [cloudRow, ...extraSources].join("\n")).split("\n");
  const lives = L.indexOf("## What lives here"), noYet = L.findIndex((l) => l.startsWith("No folder yet")),
    ownAt = L.indexOf("## Own to this business"), sources = L.indexOf("## Sources");
  const none = L.findIndex((l, i) => i > ownAt && i < sources && l.startsWith("| _(none yet)_"));
  const cells = (l) => l.split("|").slice(1, -1).map((c) => c.trim());
  const folderOf = (l) => (cells(l)[1] || "").match(/^`([^`/]+)\//)?.[1];
  if (own.length) L.splice(none, 1, ...own.map(([f, what]) => `| \`${f}/\` | ${what} |`));
  const rows = [];
  for (const f of folders) {
    const mine = L.map((l, i) => ({ l, i })).filter(({ l, i }) => i > noYet && i < ownAt && l.startsWith("|") && folderOf(l) === f);
    const pairs = mine.map(({ l }) => cells(l));
    if (!pairs.length) throw new Error("folder not in template map: " + f);
    rows.push(pairs.length === 1
      ? `| \`${f}/\` | ${pairs[0][0]} | ${pairs[0][1]} |`
      : `| \`${f}/\` | ${pairs.length} kinds of fact, each with its own file | ${pairs.map(([a, g]) => `${a} → ${g}`).join(" · ")} |`);
    for (const { i } of mine.reverse()) L.splice(i, 1);
  }
  let last = lives; while (!L[last].startsWith("|")) last++; while (L[last + 1].startsWith("|")) last++;
  L.splice(last + 1, 0, ...rows);
  return L.join("\n");
}

function business(root, slug, b) {
  const d = `business/${slug}`;
  put(root, `${d}/core/business.md`, T.business
    .replace("[SLUG]", slug).replace(/\[DATE\]/g, DATE).replace("[BUSINESS_NAME]", b.name)
    .replace("[NICHE]", b.niche).replace("[WHAT]", b.what).replace("[HOW]", b.how).replace("[WHO]", b.who)
    .replace("[EXTRA_BUSINESS]", b.extra || "Нічого не додано."));
  put(root, `${d}/core/numbers.md`, T.numbers.replace("[DATE]", DATE));
  put(root, `${d}/core/goals.md`, T.goals.replace("[DATE]", DATE));
  put(root, `${d}/CONTEXT.md`, bizMap(b));
  for (const [rel, text] of Object.entries(b.files || {})) put(root, `${d}/${rel}`, text);
}

function user(root, u) {
  edit(root, "user/user.md", (t) => t.replace("[DATE]", DATE).replace(/\[DISPLAY_NAME\]/g, u.name).replace("[LANGUAGE]", "українська")
    .replace("[ROLE_SENTENCE]", u.role).replace("[TONE]", u.tone).replace("[LENGTH]", u.length)
    .replace("[BUGS_LIST]", u.bugs).replace("[EXTRA_USER]", u.extra || "(порожньо — нічого не додано)"));
}

const offer = (name, status, type, url, price) =>
  `---\ntype: offer\nstatus: ${status}\noffer_type: ${type}\nurl: ${url}\nprice: ${price}\nlast_updated: ${DATE}\n---\n\n# ${name}\n\nОпис офера (вигаданий).\n`;

// ---------- випадки перевірки 3 ----------
const CASES = {
  // (а) один бізнес, без дописів клієнта
  a: (r) => {
    user(r, { name: "Олена Коваль", role: "Я власниця невеликої кав'ярні в Луцьку і сама веду її соцмережі.", tone: "дружній, без офіціозу", length: "коротко, до 5 речень", bugs: "довгі вступи; англіцизми" });
    business(r, "kavarnia-zerno", {
      name: "Кав'ярня «Зерно»", niche: "кав'ярня спешелті-кави біля університету", what: "Каву, випічку й абонементи на ранкову каву для студентів.",
      how: "Продаж у залі, передзамовлення через Instagram, абонементи через сайт.", who: "Студенти й викладачі університету, 18–35 років.",
      folders: ["avatars", "offers"],
      files: { "avatars/studenty.md": "---\ntype: avatar\nlast_updated: 2026-10-30\n---\n\n# Студенти\n\nВигаданий сегмент.\n",
        "offers/ranok-kava.md": offer("Ранкова кава — абонемент", "live", "core", "https://example.com/zerno/ranok", "450 UAH") },
    });
  },
  // (б) два бізнеси з різними папками і різною хмарою
  b: (r) => {
    user(r, { name: "Марко Дорош", role: "Я веду йога-студію і паралельно продаю онлайн-курс з фотографії.", tone: "спокійний, по суті", length: "середньо, списками", bugs: "вигадані цифри" });
    business(r, "yoga-studio-prana", {
      name: "Йога-студія «Прана»", niche: "йога-студія для початківців", what: "Групові заняття, абонементи, виїзні ретрити.", how: "Запис через Telegram-бот, оплата на рецепції.", who: "Жінки 25–45 у Львові, офісна робота.",
      cloud: "Google Drive › Мій диск › Прана", extraSources: ["| CRM | клієнти й абонементи | KeyCRM, акаунт студії |"],
      folders: ["avatars", "content"], own: [["retreaty", "виїзні ретрити: програми, локації, кошториси"]],
      files: { "avatars/ofisni-zhinky.md": "---\ntype: avatar\nlast_updated: 2026-10-30\n---\n\n# Офісні жінки 25–45\n", "content/posts/start-oseni.md": "---\ntype: post\nchannel: instagram\nlast_updated: 2026-10-30\n---\n\nВигаданий пост.\n",
        "retreaty/karpaty-2026.md": "# Ретрит у Карпатах 2026\n\nВигадана програма.\n" },
    });
    business(r, "foto-kurs", {
      name: "Онлайн-курс фотографії", niche: "онлайн-навчання мобільній фотографії", what: "Відеокурс із 12 уроків і живі воркшопи.", how: "Вебінар → продаж курсу, допродаж воркшопу.", who: "Мами в декреті й блогери-початківці.",
      cloud: "Dropbox › /foto-kurs", folders: ["offers", "products"], own: [["vorkshopy", "живі воркшопи: дати, міста, учасники"]],
      files: { "offers/kurs-bazovyi.md": offer("Базовий курс", "live", "core", "https://example.com/foto/kurs", "2900 UAH"),
        "offers/vebinar.md": offer("Безкоштовний вебінар", "live", "lead-magnet", "https://example.com/foto/webinar", "0 UAH"),
        "products/kurs.md": "---\ntype: product\nlast_updated: 2026-10-30\n---\n\n# Курс\n", "vorkshopy/kyiv-lystopad.md": "# Воркшоп у Києві\n" },
    });
  },
  // (в1) дописи клієнта в AGENTS.md, кореневому CONTEXT.md і змінені файли ядра; SOUL.md немає
  c1: (r) => dopysy(r, false),
  // (в2) те саме, але клієнт уже має свій SOUL.md (з правилом, що суперечить user.md)
  c2: (r) => dopysy(r, true),
};

function dopysy(r, withSoul) {
  user(r, { name: "Ірина Бойко", role: "Я власниця сімейної пекарні й шукаю, як продавати більше через доставку.", tone: "теплий, простий", length: "коротко", bugs: "емодзі; канцелярит" });
  business(r, "pekarnia-khlib", {
    name: "Пекарня «Хліб»", niche: "ремісничий хліб на заквасці", what: "Хліб, випічку, підписку на щотижневу доставку.", how: "Магазин при пекарні й доставка по місту.", who: "Сім'ї в спальних районах Вінниці.",
    cloud: "iCloud Drive › Пекарня", folders: ["offers"], own: [["retsepty", "рецептури й техкарти"]],
    files: { "offers/pidpyska.md": offer("Підписка на хліб", "live", "continuity", "https://example.com/khlib/sub", "600 UAH/міс"),
      "retsepty/zakvaska.md": "# Закваска\n\nВигадана рецептура.\n",
      ...(withSoul ? { "offers/CONTEXT.md": "# Мої офери\n\nПідписку пропонуй першою.\n",
        "products/CONTEXT.md": "# Продукти пекарні\n\n| Папка | Продукт |\n|---|---|\n| `khlib-na-zakvasci/` | хліб на заквасці |\n",
        "products/khlib-na-zakvasci/product.md": "---\ntype: product\nlast_updated: 2026-10-30\n---\n\n# Хліб на заквасці\n" } : {}) },
  });
  // дописи в AGENTS.md: правило людини; правило бізнесу; змінений рядок шаблону
  edit(r, "AGENTS.md", (t) => {
    t = insertAfter(t, "invent the user's identity or a business — when a task needs them, suggest the `setup` skill.\n",
      "\n## Мої правила\n\n- Завжди відповідай українською, без англіцизмів.\n- Перед відповіддю не вибачайся.\n");
    t = insertAfter(t, "- **Names:** the file of one thing (a segment, a competitor, a product) has a stable name\n  without a date; a dated report ends with `-<YYMMDD>`.\n",
      "- Ціни пекарні пиши в гривнях з ПДВ (`business/pekarnia-khlib`).\n");
    return t.replace("Heavy files, code and other apps stay outside AIOS and are only referenced.", "Heavy files, code and other apps stay outside AIOS and are only referenced. Фото пекарні — лише в iCloud.");
  });
  // дописи в кореневий CONTEXT.md: власний маршрут людини і маршрут бізнесу
  edit(r, "CONTEXT.md", (t) => t.replace(/\n?$/, "\n") +
    "| Мої рецепти для дому | `knowledge/recipes/` | шукай за назвою страви |\n" +
    "| Постачальники пекарні | `business/pekarnia-khlib/retsepty/` | список постачальників борошна — у файлі `postachalnyky.md` |\n");
  // змінені клієнтом файли, які 0.9 видаляє
  edit(r, "CLAUDE.md", (t) => t + "\nНе використовуй емодзі.\n");
  edit(r, "system/offers.md", (t) => t + "\n- Підписку завжди пропонуй першою.\n");
  edit(r, "system/agents/marketer/AGENT.md", (t) => t + "\n- Для пекарні пиши про запах свіжого хліба.\n");
  // карта user/: клієнт створив папку з «No folder yet» і власну папку
  put(r, "user/health/health.md", "---\ntype: health\nlast_updated: 2026-10-30\n---\n\n# Здоров'я\n\nВигадано: алергія на горіхи.\n");
  put(r, "user/sport/plan.md", "# Біг\n\nВигаданий план тренувань.\n");
  edit(r, "user/CONTEXT.md", (t) => {
    t = t.replace(/^\| health now:[^\n]*\n/m, "");
    t = insertAfter(t, "| a change to any of these |\n", "| `health/` | health now: conditions, limits, allergies, medication, food and training routine | `health/health.md`; a dated record (a test, a doctor's conclusion) → `health/<what>-<YYMMDD>.md` |\n| `sport/` | мої пробіжки й плани тренувань | `sport/plan.md` |\n");
    return t;
  });
  if (withSoul) put(r, "SOUL.md", "# Мій SOUL\n\n- Пиши детально, з прикладами.\n- Звертайся до мене на «ти».\n");
}

// ---------- збірка ----------
function walk(dir, out = []) {
  for (const n of readdirSync(dir).sort()) { const p = join(dir, n); statSync(p).isDirectory() ? walk(p, out) : out.push(p); }
  return out;
}
for (const [id, fill] of Object.entries(CASES)) {
  const root = join(OUT, id);
  if (existsSync(root)) rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  // tar runs inside the folder: GNU tar on Windows reads "D:\\…" in -C as a remote host.
  execSync(`git -C "${TPL}" archive ${TAG} | tar -x`, { ...SH, cwd: root });
  fill(root);
  const sums = walk(root).filter((p) => !p.endsWith("SHA256SUMS")).map((p) => `${createHash("sha256").update(readFileSync(p)).digest("hex")}  ${relative(root, p)}`);
  writeFileSync(join(OUT, `${id}.SHA256SUMS`), sums.join("\n") + "\n");
  const left = execSync(`grep -rlE '\\[(DATE|DISPLAY_NAME|LANGUAGE|ROLE_SENTENCE|TONE|LENGTH|BUGS_LIST|EXTRA_USER)\\]' "${root}/user" || true`, { encoding: "utf8", ...SH }).trim();
  if (left) throw new Error(`${id}: placeholders left in ${left}`);
  console.log(`${id}: ${sums.length} files`);
}
