// СТРІЧКА НОВИН
function renderNews() {
  if (!G) return; const P = G.pv(), mineOnly = window._newsMine;
  const list = G.news.filter(x => !mineOnly || x.nats.includes(P) || x.kind === 'big').slice(0, 60);
  $('#news').innerHTML = `<div style="display:flex;justify-content:space-between;border:0"><b>Стрічка новин</b><label class="small mut"><input type="checkbox" ${mineOnly ? 'checked' : ''} onchange="window._newsMine=this.checked;renderNews()"> лише важливе для мене</label><button class="small" style="margin-left:8px" onclick="document.body.classList.remove('news-open')">✕</button></div>` + list.map(x => `<div class="${x.kind} ${x.nats.includes(P) ? 'me' : ''}"><span class="d">${G.dateStr(x.d)}</span>${esc(x.text)}</div>`).join('');
}
let _newsT = 0; LORA.bus.on('news', () => { if (!_newsT) _newsT = setTimeout(() => { _newsT = 0; renderNews(); }, 300); });
LORA.bus.on('capture', () => { mapDirty = true; });
