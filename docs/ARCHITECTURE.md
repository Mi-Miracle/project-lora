# Архітектура Project LORA

Гра — це звичайні файли HTML/CSS/JS без збирача: відкрийте `index.html` у Chrome/Edge, і все працює (навіть з диска).
Скрипти підключаються в `index.html` **по порядку**; кожен файл реєструє себе в глобальному просторі `LORA`.

## Папки

```
Project LORA/
├── index.html              ← гра (порядок підключення скриптів = порядок завантаження)
├── overlay.html            ← оверлей для OBS (стрім)
├── Запустити LORA.bat       ← запускає локальний сервер і відкриває гру
├── Відкрити без сервера.bat ← відкриває index.html напряму
├── Створити ярлик на робочому столі.bat
├── Запустити LORA.bat   ← локальний сервер http://localhost:8642 (потрібен для OBS-оверлею)
├── assets/map/relief.jpg   ← растр рельєфу (Natural Earth)
├── styles/main.css         ← увесь вигляд інтерфейсу
├── data/                   ← ДАНІ (редагуються без знання коду)
│   ├── econ/countries.js       країни: населення, ВВП, армія, флот, технології, оборона, агресивність, ядерна зброя
│   ├── econ/production.js      видобуток/виробництво 14 ресурсів за країнами
│   ├── econ/resources.js       опис ресурсів і груп: ціни, транспорт, важливість
│   ├── econ/hotspots.js        реальні центри видобутку (для розподілу між регіонами)
│   ├── econ/buildings.js       будівлі, групи, транспортні маршрути, пріоритети розвитку
│   ├── econ/start-buildings.js стартова інфраструктура країн (АЕС, ГЕС, порти, оборонка…)
│   ├── difficulty.js           рівні складності
│   ├── companies.js            галузі компаній і ШІ-корпорації
│   ├── tech.js                 дерево досліджень (гілки, епохи, ефекти)
│   ├── military/units.js       арсенал: озброєння, виробництво, витрата, цілі ударів
│   ├── ui/themes.js            кольорові теми інтерфейсу для держав
│   ├── i18n/en.js, names-en.js ЗГЕНЕРОВАНО: англійський словник і назви
│   ├── balance.js              ручки балансу + цільові показники самобалансування
│   ├── econ/finance.js         борг, фонди, ставки, податки
│   ├── politics/*.js           союзи, ЄС, відносини, санкції, залежні території
│   ├── ai/profiles.js          характер ШІ-агента кожної держави
│   ├── scenarios/world2026.js  сценарії: війни, лінія фронту, розміщення військ
│   └── geo/*.js                ЗГЕНЕРОВАНО: регіони, контури, кордони, міста, морська мережа
├── src/
│   ├── core/    lora.js (простір імен), i18n.js (мова), config.js, util.js, bus.js (шина подій), i18n-data.js (переклад даних)
│   ├── sim/     world.js → helpers.js → economy.js → trade.js → military.js → buildings.js → transport.js → companies.js → research.js → arsenal.js → diplomacy.js → actions.js → game.js
│   ├── ai/      nation-agent.js (агенти держав + навчання), world-director.js (події), balance-director.js (самобалансування)
│   ├── stream/  bridge.js (трансляція подій назовні)
│   └── ui/      format.js, icons-map.js + theme.js (піксельні іконки й тема держави), map/*.js (мапа), panels/*.js (панелі), screens/start.js, main.js (цикл)
├── tools/
│   ├── build-data/   перебудова мапи з Natural Earth (00 → mapshaper → 01 → 02 → 03)
│   ├── test/sim-test.js   прогін симуляції без браузера (AUTO=1 — повний автопілот)
│   ├── test/company-test.js  прогін гри за компанію; test/ui-test.py — тест інтерфейсу (Playwright, uk|en)
│   ├── i18n-extract.js + i18n/build-en.js   збирання англійського словника
│   ├── art/icons.py      піксельні іконки (ASCII-сітки → assets/ui/icons.png)
│   ├── build-data/04_names_en.js   англійські назви регіонів/міст/країн
│   └── balance/auto-tune.js   автонастроювач балансу: node tools/balance/auto-tune.js [поколінь] [нащадків] [днів]
└── docs/   дизайн, дорожня карта, архітектура, стрім, дані
```

## Як влаштована симуляція
- `LORA.createGame()` створює об'єкт гри `G` і по черзі встановлює модулі (`LORA.sim.register(назва, порядок, функція)`).
- Кожен модуль додає до `G` свої функції; модулі спілкуються через `G.*` та шину `LORA.bus` (події `news`, `war`, `peace`, `capture`, `day`, `gameover`).
- Щоденний крок — `G.step()` у `src/sim/game.js`: агрегування → торгівля (раз на тиждень) → економіка → рух → бої → постачання → окупація → ШІ → режисер.
- Інтерфейс викликає лише `G.act.*` (дії гравця) і читає стан. Симуляцію можна ганяти без браузера: `node tools/test/sim-test.js UKR war2026 365` (`AUTO=1` — армії гравця на автопілоті).

## Локалізація
- Мова — `localStorage.lora_lang` (`uk` | `en`), перемикач на стартовому екрані. Код і дані пишуться українською.
- `src/core/i18n-data.js` до старту гри підміняє назви в даних (регіони, міста, країни, будівлі, ресурси…).
- Інтерфейс і новини перекладає спостерігач DOM за словником фрагментів `data/i18n/en.js` (найдовші збіги першими).
- Нові тексти: `node tools/i18n-extract.js` → `node tools/i18n/build-en.js` покаже неперекладені фрагменти (`tools/i18n/missing.txt`) → допишіть пари у `tools/i18n/en_extra.tsv` → знову `build-en.js`.

## Самобалансування
- Усі «ручки» складності — у `data/balance.js` (значення + межі + цілі).
- Під час гри `balance-director.js` раз на місяць міряє стан світу і зсуває параметри в межах (журнал — вкладка «Світ → Баланс і ШІ»).
- Агенти держав записують свої наступи й через 25 днів оцінюють результат: успіх — сміливіше, провал — обережніше.
- Після великих змін у правилах запустіть `node tools/balance/auto-tune.js` — він прожене десятки симуляцій і запише нові значення.

## Як додати нове (щоб нічого не зламати)
- **Нова будівля**: один рядок у `data/econ/buildings.js` (вхід, вихід, ефекти, вимоги) — радник і інтерфейс підхоплять її автоматично.
- **Новий ресурс**: `data/econ/resources.js` (опис + група + порядок) і `data/econ/production.js` (видобуток); за потреби — точки в `hotspots.js`, потім перебудувати `data/geo` (крок 03).
- **Нова система** (будівлі, дослідження…): новий файл `src/sim/<назва>.js` з `LORA.sim.register('<назва>', <порядок>, G => {...})`, підключити в `index.html`, викликати у `G.step()`.
- **Нова вкладка інтерфейсу**: файл `src/ui/panels/tab-<назва>.js` з `TAB_FN.<назва> = () => html`, додати в `TABS` (`tab-state.js`).
- **Нова подія світу**: елемент у масиві `EVENTS` у `src/ai/world-director.js`.
- **Характер країни**: `data/ai/profiles.js`.
- **Сценарій**: `data/scenarios/*.js`.

## Перебудова мапи (tools/build-data)
1. Завантажити `ne_10m_admin_1_states_provinces.geojson` і `ne_10m_populated_places.geojson` (Natural Earth, GitHub nvkelso/natural-earth-vector) та растр `NE1_50M_SR_W` (naciscdn.org).
2. `python 00_tag_regions.py <admin1> <world.json> adm1_tagged.geojson` — групування дрібних одиниць.
3. `npx mapshaper adm1_tagged.geojson -dissolve gid copy-fields=cc,nm -simplify 4% keep-shapes planar -filter-slivers min-area=30km2 -o format=topojson quantization=300000 regions.topo.json`
4. `node 01_regions.js regions.topo.json <places> <world.json>` — злиття, сусідство, порти, міста.
5. `python 02_terrain.py regions_geom.json relief_4096.jpg terrain.json` — рельєф регіонів.
6. `node 03_build.js work <world.json> <корінь проєкту>` — файли `data/geo/*.js` і розподіл економіки.
