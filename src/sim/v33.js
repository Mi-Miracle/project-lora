// v3.3.1: реальний час у локаціях.
// • Вахти, контракти, відпустки й місії: персонаж «відсутній» до повернення — місто/дача/дім недоступні, а день завершується.
// • Нічні дії (нічна зміна, сон до ранку): лише з 19:00, тривають до кінця доби.
// • Суд: справи веде лише юрист чи суддя з навичкою права.
LORA.sim.register('v33', 99.995, function (G) {
  if (!G.locCan || !G.LOCS) return;
  const pick = a => a[Math.floor(G.rnd() * a.length)];
  const actOf = (loc, k, a) => { const Lc = G.LOCS[loc]; const P = Lc && Lc.places[k]; return P && P.acts[a]; };
  const awayErr = L => L && L.away && L.away.till > G.day ? `Ви відсутні («${L.away.n}») — повернетесь ${G.dateStr ? G.dateStr(L.away.till) : 'день ' + L.away.till}` : '';
  G.locAway = () => awayErr(G.leader);

  const baseCan = G.locCan, baseDo = G.locDo;
  G.locCan = function (loc, k, a) {
    const L = G.leader; const ae = awayErr(L); if (ae) return ae;
    const A = actOf(loc, k, a); if (!A || !A.night) return baseCan(loc, k, a);
    const h = A.h, op = G.LOCS[loc].places[k].open; A.h = 0; G.LOCS[loc].places[k].open = null;
    let e; try { e = baseCan(loc, k, a); } finally { A.h = h; G.LOCS[loc].places[k].open = op; }
    if (e) return e; if (L.city.h < 19) return 'Лише ввечері й уночі (з 19:00)'; return '';
  };
  G.locDo = function (loc, k, a) {
    const e = G.locCan(loc, k, a); if (e) return { ok: false, err: e };
    const L = G.leader, A = actOf(loc, k, a), b0 = L.busy || 0; let r;
    if (A.night) { const h = A.h, P = G.LOCS[loc].places[k], op = P.open; A.h = 0; P.open = null; try { r = baseDo(loc, k, a); } finally { A.h = h; P.open = op; } if (r.ok) L.city.h = 26; }
    else r = baseDo(loc, k, a);
    // дія забрала кілька днів (вахта, контракт, відпустка, затримання) — персонаж відсутній, день закінчено
    if (r && r.ok && (L.busy || 0) > Math.max(b0, G.day + 1) && A.away !== false) { L.away = { till: L.busy, n: (A.n || '').replace(/\s*\(.*\)$/, '') }; L.city.h = 26; }
    return r;
  };
  G.cityCan = (k, a) => G.locCan('city', k, a); G.cityDo = (k, a) => G.locDo('city', k, a);
  G.act.cityDo = (k, a) => G.locDo('city', k, a); G.act.locDo = (loc, k, a) => G.locDo(loc, k, a);

  // нічні роботи
  const C = G.LOCS.city.places;
  if (C.jobs) { C.jobs.open = [8, 26];
    const nightJob = (key, n) => { const J = C.jobs.acts[key]; if (!J) return; J.night = true; J.n = n; };
    nightJob('guard', 'Нічний охоронець складу (до ранку)'); nightJob('bakery', 'Нічна зміна в пекарні (до ранку)'); nightJob('call', 'Нічна зміна в кол-центрі (до ранку)');
    for (const a in C.jobs.acts) { const J = C.jobs.acts[a]; if (J.tab !== 'night' && J.tab !== 'long' && !J.night) { const n0 = J.need; J.need = L => L.city.h >= 21 ? 'Біржа праці видає денні підробітки до 21:00' : (n0 ? n0(L) : ''); } } }
  // сон уночі: дім і дача
  const H = G.LOCS.home && G.LOCS.home.places;
  if (H && H.bed && H.bed.acts.sleep) Object.assign(H.bed.acts.sleep, { n: 'Лягти спати (до ранку)', night: true, r: () => [pick(['виспалися як немовля. Без жодного сповіщення', 'наснилося, що бюджет збалансовано. Прокинулися щасливим']), { hp: 15, mood: 10 }] });
  const D = G.LOCS.dacha && G.LOCS.dacha.places;
  if (D && D.ham) D.ham.acts.night = { n: 'Заночувати на дачі (до ранку)', h: 8, c: 0, night: true, r: () => [pick(['цвіркуни співали всю ніч. Ви теж трохи', 'спали під зорями. Комарі — під вами', 'зранку роса, туман і запах кави від Петровича']), { hp: 12, mood: 12 }] };

  // суд: лише юрист або суддя
  const lawyer = L => { const j = L.job && L.job.k; if (j !== 'lawyer' && j !== 'judge') return 'Справи веде лише юрист або суддя (влаштуйтеся юристом у «Карʼєрі»)'; if ((G.skill ? G.skill(L, 'law') : 0) < 1) return 'Потрібна навичка права (рівень 1+)'; return ''; };
  if (C.court) ['pros', 'def'].forEach(a => { const A = C.court.acts[a]; if (!A) return; const n0 = A.need; A.need = L => lawyer(L) || (n0 ? n0(L) : ''); });
  if (G.courtTake) { const ct = G.courtTake; G.courtTake = function (role) { const L = G.leader; const e = L ? lawyer(L) : '?'; if (e) return { ok: false, err: e }; return ct(role); }; }

  // відсутність знімається сама, коли день настав
  G.h29 && G.h29.d && G.h29.d.push(() => { const L = G.leader; if (L && L.away && L.away.till <= G.day) { G.say(`🏠 ${L.name} повернувся(лась): «${L.away.n}» завершено`, 'info', [G.leaderNation ? G.leaderNation() : G.player]); L.away = null; } });
});
