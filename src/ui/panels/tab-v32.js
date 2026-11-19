// UI v3.2: сцени космодрому (центрифуга, невагомість, вихід у космос, вибух ракети, звʼязок з орбітою),
// статус комори й хліва на дачі, підказка порядку проходження в аеропорту.
if (typeof FX !== 'undefined' && FX.add) {
  FX.add('centri', { bg: ['#101828', '#03060c'], items: [['🌀', 'orbit', 10, 50], ['😵', 'pulse', 1, 140], ['💫', 'burst', 20, 26]], shake: 1 }, ['🌀 6g!', '6g!']);
  FX.add('zerog', { bg: ['#020818', '#000'], items: [['🧑‍🚀', 'float', 3, 90], ['🥪', 'float', 4, 40], ['⭐', 'rain', 40, 12], ['🪐', 'orbit', 3, 40]] }, ['🧑‍🚀 НЕВАГОМІСТЬ', 'ZERO GRAVITY']);
  FX.add('spacewalk', { bg: ['#03102a', '#000'], items: [['🧑‍🚀', 'pulse', 1, 130], ['🛰', 'fly', 2, 60], ['🌍', 'rise', 1, 160], ['⭐', 'rain', 30, 12]] }, ['🌌 ВИХІД У КОСМОС', 'SPACEWALK']);
  FX.add('boom', { bg: ['#2a0a02', '#0a0200'], items: [['🚀', 'rise', 1, 110], ['💥', 'burst', 40, 44], ['🔥', 'rise', 14, 40], ['📸', 'float', 6, 34]], shake: 1, flash: 1 }, ['💥 НЕВДАЛИЙ ЗАПУСК', 'LAUNCH FAILURE']);
  FX.add('orbitcall', { bg: ['#020818', '#000'], items: [['📡', 'pulse', 1, 110], ['🛰', 'orbit', 4, 50], ['👋', 'float', 5, 40]] }, ['📡 ЗВʼЯЗОК З ОРБІТОЮ', 'ORBIT CALL']);
  FX.add('pigeons', { bg: ['#1a2a3a', '#060a10'], items: [['🕊', 'fly', 14, 44], ['🍞', 'rain', 20, 26], ['👑', 'pulse', 1, 90]] }, ['🕊 ЛІДЕР ГОЛУБІВ', 'PIGEON LEADER']);
}
if (typeof CITY_BIG_FX !== 'undefined') CITY_BIG_FX.push('launch', 'boom', 'centri', 'zerog', 'spacewalk', 'orbitcall', 'photoshoot', 'pigeons', 'dacha', 'parliament', 'army', 'exercise');
{ const b = window.citySide; window.citySide = function () { b(); if (!locUI || !G) return; const el = $('#citySide'); if (!el) return; const L = G.leader; let h = '';
  if (locUI.loc === 'dacha' && G.farmStock) { const S = G.farmStock(), F = L.farm || {}; const A = F.ani || {};
    h += `<div class="grp">🧺 ${t_('Комора')}: ≈ ${money(S.total / 1e9)}</div><div class="small">${S.kg ? `🥕 ${S.kg} ${t_('кг')} (${money(S.veg / 1e9)})` : t_('овочів нема')}${S.jars ? ` · 🫙 ${S.jars}` : ''}${S.prod ? ` · 🥚🥛🍯 ${money(S.prod / 1e9)}` : ''}</div>`;
    h += `<div class="mut small">${t_('Продати')}: 🧺 ${t_('Комора')} (85%) · 🛣 ${t_('Лоток біля траси')} (70%) · 🐓 ${t_('продукцію — сусідам')} · 🏪 ${t_('Ринок «Привоз» у місті')} (100%)</div>`;
    if (Object.values(A).some(v => v > 0)) h += `<div class="grp">🐓 ${t_('Хлів і курник')}</div><div class="small">${Object.entries(A).filter(([, v]) => v > 0).map(([a, v]) => `${G.FARM_SHOP[a].ic} ${esc(t_(G.FARM_SHOP[a].n))} ×${v}`).join(' · ')}${(F.fed || -9) >= G.day - 3 ? ` · 😋 ${t_('нагодовані')}` : ` · <span class="y">${t_('голодні')}</span>`}</div>`; }
  if (locUI.loc === 'airport') { const A = L.air && L.air.d >= G.day - 1 ? L.air.s : 0; const ST = ['1. Реєстрація', '2. Паспортний контроль', '3. Огляд безпеки', '4. Посадка'];
    h += `<div class="grp">🪧 ${t_('Порядок проходження')}</div><div class="small">${ST.map((x, i) => `<span class="${i < A ? 'g' : i === A ? 'y' : 'mut'}">${i < A ? '✅' : i === A ? '➡' : '▫'} ${t_(x)}</span>`).join('<br>')}</div><div class="mut small">${t_('Порушите порядок — штраф. Жарти про бомбу — дуже погана ідея.')}</div>`; }
  if (h) el.insertAdjacentHTML('beforeend', h); }; }
