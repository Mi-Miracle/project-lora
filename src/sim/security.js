// БЕЗПЕКА: загрози персонажам (пограбування, шантаж, викрадення, замах) і компаніям (диверсії, рейдерство, крадіжки, шпигунство).
// Охорону наймають у приватних військових компаній (ВПК-сектор): ШІ або іншого гравця, який отримує оплату.
LORA.sim.register('security', 99.68, function (G) {
  const { N, ter, T } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const human = c => c && !c.ai && c.alive;
  G.SEC_LV = [
    { n: 'Без охорони', k: 0 },
    { n: 'Особистий охоронець', k: 0.25, base: 0.000004 },
    { n: 'Група охорони', k: 0.45, base: 0.000015 },
    { n: 'Броньований кортеж і група', k: 0.65, base: 0.00006 },
    { n: 'Приватна армія (ПВК)', k: 0.82, base: 0.0004 }
  ];
  G.secContracts = G.secContracts || [];
  // постачальники: компанії ВПК; ціна залежить від репутації та розробок якості, місткість — від заводів
  G.secProviders = function (clientHome) {
    return G.companies.filter(c => c.alive && c.sector === 'military' && (clientHome == null || !G.atWar(c.home, clientHome))).map(c => {
      const q = clamp(0.85 + (c.rep || 50) / 250 + (G.corpFx && c.rd ? G.corpFx(c, 'qual') : 0) * 0.5, 0.7, 1.4);
      const cap = 2 + Math.floor(c.assets.reduce((s, a) => s + a.lvl, 0) / 2) + Math.floor((c.base || 0) / 20);
      const used = G.secContracts.filter(k => k.prov === c.id).reduce((s, k) => s + k.lvl, 0);
      return { id: c.id, name: c.name, q, mul: c.ai ? q : (c.secMul || 1), cap, used, human: !c.ai };
    }).sort((a, b) => b.q - a.q);
  };
  G.secFee = (p, lvl, big) => G.SEC_LV[lvl].base * p.mul * (big ? 6 : 1); // $ млрд на місяць (для компанії — дорожче)
  const clientKey = () => G._lk != null ? 'L' + G._lk : 'L' + (G.player >= 0 ? G.player : 'me');
  G.secOf = key => G.secContracts.find(k => k.cl === key);
  G.secLevel = key => { const k = G.secOf(key); if (!k) return 0; const p = G.secProviders().find(x => x.id === k.prov); return G.SEC_LV[k.lvl].k * (p ? Math.min(1.2, p.q) : 1); };
  G.secHire = function (who, provId, lvl) {
    const key = who === 'co' ? 'co' + G.pc : clientKey(); const c = G.companies[provId]; const P = G.secProviders().find(p => p.id === provId);
    if (!c || !P) return { ok: false, err: 'Невідомий постачальник' }; if (!(lvl >= 1 && lvl <= 4)) return { ok: false, err: 'Оберіть рівень' };
    if (who === 'co' && G.pc === provId) return { ok: false, err: 'Своя ПВК охороняє вас безкоштовно — найміть себе через рівень' };
    const old = G.secOf(key); const free = P.cap - P.used + (old && old.prov === provId ? old.lvl : 0); if (free < lvl) return { ok: false, err: `У «${c.name}» немає вільних людей (вільно ${free})` };
    G.secContracts = G.secContracts.filter(k => k.cl !== key);
    const fee = G.secFee(P, lvl, who === 'co'); G.secContracts.push({ cl: key, prov: provId, lvl, fee, d: G.day });
    if (human(c)) G.say(`🛡 «${c.name}»: новий клієнт охорони — ${G.SEC_LV[lvl].n}, ${G.fmt$(fee)}/міс.`, 'good', [c.home]);
    return { ok: true, msg: `${G.SEC_LV[lvl].n} від «${c.name}»: ${G.fmt$(fee)}/міс.` };
  };
  G.secFire = function (who) { const key = who === 'co' ? 'co' + G.pc : clientKey(); const n0 = G.secContracts.length; G.secContracts = G.secContracts.filter(k => k.cl !== key); return n0 !== G.secContracts.length ? { ok: true, msg: 'Контракт розірвано' } : { ok: false, err: 'Охорони немає' }; };
  G.secSetPrice = function (mul) { const c = G.pc >= 0 && G.companies[G.pc]; if (!c || c.sector !== 'military') return { ok: false, err: 'Лише для компаній ВПК' }; c.secMul = clamp(+mul, 0.5, 3); return { ok: true }; };
  const payer = key => key[0] === 'c' ? { get: () => G.companies[+key.slice(2)] && G.companies[+key.slice(2)].cash, pay: v => { G.companies[+key.slice(2)].cash -= v; } }
    : { L: (G.leaders || {})[key.slice(1)], get() { return this.L ? this.L.money : -1; }, pay(v) { if (this.L) this.L.money -= v; } };
  // ---- щомісяця: оплата охорони й загрози
  G.securityMonthly = function () {
    G.secContracts = G.secContracts.filter(k => { const c = G.companies[k.prov]; const P = payer(k.cl); if (!c || !c.alive || P.get() == null || P.get() < 0) return false;
      if (P.get() < k.fee) { return false; } P.pay(k.fee); c.cash += k.fee * 0.6; c.secInc = (c.secInc || 0) * 0.9 + k.fee * 12 * 0.6 * 0.1; return true; });
    // персонажі
    Object.entries(G.leaders || {}).forEach(([lk, L]) => {
      if (!L || L.role !== 'char') return; const key = 'L' + lk; const sec = clamp(G.secLevel(key) + (G.lifeSec ? G.lifeSec(L) * 0.06 : 0), 0, 0.95);
      const wealth = G.lifeWealth ? G.lifeWealth(L) : L.money; const nid = L.mv ? -1 : ter[L.at].ctrl; if (nid < 0) return; const n = N[nid];
      const danger = (n.stab < 40 ? 0.6 : 0.2) + (G.enemiesOf(nid).length ? 0.6 : 0) + (n.pc < 8000 ? 0.4 : 0) + (L.mp != null || L.party || L.cand != null ? 0.3 : 0);
      const risk = clamp((0.004 + Math.min(0.03, wealth * 0.01) + L.fame * 0.0004) * danger * (1 - sec), 0, 0.15);
      if (G.rnd() > risk) return; const me = G.leader === L || lk === String(G._lk); const tell = (m, k) => G.say(m, k || 'bad', [nid]); const r = G.rnd();
      if (r < 0.4) { const v = Math.min(L.money * 0.08, 0.000002 + wealth * 0.01); L.money -= v; tell(`🦹 ${L.name}: пограбування в ${n.name} — втрачено ${G.fmt$(v)}`); }
      else if (r < 0.65) { const v = Math.min(L.money * 0.15, 0.000005 + wealth * 0.02); if (G.rnd() < 0.5 + sec) tell(`🕵 ${L.name}: спроба шантажу — охорона й юристи відбилися`, 'info'); else { L.money -= v; tell(`🕵 ${L.name}: шантаж компроматом — заплачено ${G.fmt$(v)}`); } }
      else if (r < 0.85) { const v = Math.min(L.money * 0.3, 0.00002 + wealth * 0.05); L.money -= v; L.busy = Math.max(L.busy || 0, G.day + 14); L.fame += 1; tell(`🚐 ${L.name} викрадено в ${n.name}! Викуп ${G.fmt$(v)}, 2 тижні на відновлення`); }
      else { const hurt = G.rnd() > 0.35 + sec; L.busy = Math.max(L.busy || 0, G.day + (hurt ? 60 : 3)); L.popu[nid] = clamp((L.popu[nid] || 0) + 6, 0, 100); L.fame += 3;
        tell(hurt ? `🔫 Замах на ${L.name} в ${n.name}: тяжке поранення, 2 місяці лікування. Хвиля співчуття: популярність +6` : `🔫 Замах на ${L.name} в ${n.name} зірвано охороною! Популярність +6`, 'big'); }
    });
    // компанії гравців
    G.companies.forEach(c => {
      if (!human(c) || !c.assets.length) return; const sec = clamp(G.secLevel('co' + c.id) + (c.sector === 'military' ? 0.4 : 0), 0, 0.95);
      const hot = c.assets.filter(a => { const h = N[ter[a.t].owner]; return h && (h.stab < 40 || G.enemiesOf(h.id).length); }).length;
      const risk = clamp((0.01 + hot * 0.01 + Math.min(0.03, G.coValue(c) * 0.0004)) * (1 - sec), 0, 0.2); if (G.rnd() > risk) return; const r = G.rnd();
      const a = c.assets[Math.floor(G.rnd() * c.assets.length)], t = ter[a.t];
      if (r < 0.35) { t.dmg = Math.min(0.5, t.dmg + 0.12); G.say(`💥 Диверсія на активі «${c.name}»: ${G.D.buildings[a.type].n} (${T[a.t].n}) пошкоджено`, 'bad', [c.home]); }
      else if (r < 0.6) { const k = Object.keys(c.res || {}).filter(x => c.res[x] > 1e-6)[0]; if (k) { const q = c.res[k] * 0.3; c.res[k] -= q; G.say(`📦 «${c.name}»: розкрадання складу — втрачено 30% ${G.D.resources[k] ? G.D.resources[k].n.toLowerCase() : k}`, 'bad', [c.home]); } }
      else if (r < 0.8) { if (c.rd) { const v = c.rd.pts * 0.4; c.rd.pts -= v; G.say(`🕵 Промислове шпигунство: «${c.name}» втрачає ${v.toFixed(0)} очок R&D`, 'bad', [c.home]); } }
      else { const v = Math.min(c.cash * 0.05, 0.05 + G.coValue(c) * 0.003); c.cash -= v; G.say(`⚖ Рейдерська атака на «${c.name}»: судові витрати ${G.fmt$(v)}`, 'bad', [c.home]); }
    });
  };
  G.act.secHire = (who, p, l) => G.secHire(who, p, l);
  G.act.secFire = who => G.secFire(who);
  G.act.secPrice = m => G.secSetPrice(m);
});
