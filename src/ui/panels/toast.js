// СПОВІЩЕННЯ (тости): важливі події для гравця — напади, війни, лиха, проблеми й успіхи економіки. Зі звуком.
(function () {
  const box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box);
  let lastStrike = -99, recent = [];
  const isStrike = t => /^(✈|🚀) /.test(t);
  function classify(it) {
    if (!G || G.day < 1) return null; const P = G.pv(); const mine = it.nats.includes(P);
    if (isStrike(it.text)) { if (!mine || G.ter.length === 0) return null; const onMe = !it.text.replace(/^\S+\s/, '').startsWith(nat(P).name); if (!onMe) return null; if (G.day - lastStrike < 21) return null; lastStrike = G.day; return { lvl: 'war', snd: 'boom', ttl: t_('Удар по вашій території') }; }
    if (/Землетрус|Цунамі|Повінь|пожежі|Супертайфун|вулкана|метеорита|сонячна буря|спека/.test(it.text)) return mine || it.kind === 'big' ? { lvl: 'bad', snd: 'quake', ttl: t_('Стихійне лихо') } : null;
    if (it.kind === 'war' && mine && /війн|нападає|вступає|оголошує/i.test(it.text)) return { lvl: 'war', snd: 'war', ttl: t_('Війна') };
    if (/встановлює контроль|Звільнено|капітул/.test(it.text) && mine) return { lvl: it.text.includes('(раніше — ' + nat(P).name) ? 'bad' : 'good', snd: it.text.includes('(раніше — ' + nat(P).name) ? 'bad' : 'good', ttl: t_('Фронт') };
    if (it.kind === 'bad' && mine) return { lvl: 'bad', snd: 'bad', ttl: t_('Проблема') };
    if (it.kind === 'good' && mine && !/Будівництво:|будує:/.test(it.text)) return { lvl: 'good', snd: 'good', ttl: t_('Добра новина') };
    if (it.kind === 'big') return { lvl: 'big', snd: 'alert', ttl: t_('Світ') };
    return null;
  }
  function show(it, c) {
    if (!AUD.S.toasts) return; recent = recent.filter(r => G.day - r < 1); if (recent.length > 3) return; recent.push(G.day);
    const tx = t_(it.text); const m = tx.match(/^(\p{Extended_Pictographic}️?)\s*/u); const ic = m ? m[1] : '•'; const txt = m ? tx.slice(m[0].length) : tx;
    const el = document.createElement('div'); el.className = 'toast ' + c.lvl; el.innerHTML = `<div class="ti">${ic}</div><div><b>${esc(c.ttl)}</b><div>${esc(txt)}</div></div>`;
    el.onclick = () => el.remove(); box.prepend(el); while (box.children.length > 4) box.lastChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 7000);
    AUD.sfx(c.snd); if (AUD.S.vEvents && /war|big|bad/.test(c.lvl)) AUD.speak(c.ttl + '. ' + txt, null, 'queue');
  }
  LORA.bus.on('news', it => { try { if (window.ADV && ADV.handles(it)) return; const c = classify(it); if (c) show(it, c); } catch (e) { } });
})();
