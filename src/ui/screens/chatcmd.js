// КОМАНДИ ЧАТУ ДЛЯ ГЛЯДАЧІВ і статистика активності («депутати місяця»).
// !допомога (!donate) — віртуальний донат державі/компанії; !генерал — глядач очолює армію; !шпигун — свій агент із ніком глядача;
// !дрон — глядач керує ударом дронів по ворогу (спільна перезарядка); !гра — підказка зі списком команд.
const CHAT = { cd: {}, g: {}, stats: JSON.parse(localStorage.getItem('lora_chat_stats') || '{}') };
function chatStat(user, k) { const u = user.toLowerCase(); const s = CHAT.stats[u] = CHAT.stats[u] || { n: user, votes: 0, cmds: 0, don: 0 }; s[k] = (s[k] || 0) + 1; s.n = user; clearTimeout(CHAT._sv); CHAT._sv = setTimeout(() => { try { localStorage.setItem('lora_chat_stats', JSON.stringify(CHAT.stats)); } catch (e) { } }, 2000); }
function chatTop(k, n) { return Object.values(CHAT.stats).sort((a, b) => (b[k] || 0) - (a[k] || 0)).slice(0, n || 10); }
function cool(key, ms) { const t = Date.now(); if ((CHAT.cd[key] || 0) > t) return Math.ceil((CHAT.cd[key] - t) / 60000); CHAT.cd[key] = t + ms; return 0; }
LORA.bus.on('twitchVote', ({ user }) => chatStat(user, 'votes'));
LORA.bus.on('twitchChat', ({ user, text }) => {
  if (!G || AUD.S.chatCmds === false || NET.isGuest() || G.gameOver) return; const t = text.trim().toLowerCase(); if (!t.startsWith('!')) return; const u = user.toLowerCase();
  if (/^!(допомога|донат|donate|help-state)/.test(t)) { if (cool('don:' + u, 10 * 60000)) return; G.chatDonate(user); chatStat(user, 'don'); chatStat(user, 'cmds'); return; }
  if (/^!(генерал|general)/.test(t)) { if (CHAT.g[u]) return; const g = G.chatGeneral(user); if (g) { CHAT.g[u] = 1; chatStat(user, 'cmds'); hint(`🎖 ${user} — ${t_('новий генерал армії')}`, 3000); } return; }
  if (/^!(шпигун|spy)/.test(t)) { if (cool('spy', 3 * 60000) || cool('spy:' + u, 30 * 60000)) return; const r = G.chatSpy(user); if (r && r.ok) { chatStat(user, 'cmds'); hint(`🕵 ${t_('Глядач')} ${user} ${t_('вирушив на завдання')}`, 3000); } return; }
  if (/^!(дрон|drone)/.test(t)) { const left = cool('drone', (AUD.S.droneMin || 10) * 60000); if (left) return; const r = G.chatDrone(user); if (r && r.ok !== false) { chatStat(user, 'cmds'); AUD.sfx('alert'); } else CHAT.cd.drone = 0; return; }
});
function chatCmdHelp() { return `<div class="small mut">${t_('Команди для глядачів')}: <b>!допомога</b> — ${t_('донат державі')} · <b>!генерал</b> — ${t_('очолити армію')} · <b>!шпигун</b> — ${t_('свій агент')} · <b>!дрон</b> — ${t_('удар дронами (раз на 10 хв)')} · <b>!1 / !2</b> — ${t_('голосування')}</div>`; }
function chatStatsBlock() {
  const top = chatTop('votes', 8); if (!top.length || !(top[0].votes)) return '';
  return `<div class="grp">🏆 ${t_('Депутати місяця (найактивніші глядачі)')}</div>` + top.filter(x => x.votes || x.cmds).map((x, k) => `<div class="row small"><span>${k + 1}. ${esc(x.n)}</span><span class="mut">🗳 ${x.votes || 0} · ⚡ ${x.cmds || 0} · 💛 ${x.don || 0}</span></div>`).join('') + `<div class="btns"><button class="small" onclick="if(confirm(t_('Обнулити статистику чату?'))){CHAT.stats={};localStorage.removeItem('lora_chat_stats');renderTab(true)}">↺ ${t_('Обнулити')}</button></div>`;
}
