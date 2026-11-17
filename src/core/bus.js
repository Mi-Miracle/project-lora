// Шина подій: модулі повідомляють одне одного без прямих залежностей.
// Події: 'news', 'war', 'peace', 'day', 'capture', 'gameover' … Підписка: LORA.bus.on('news', fn)
(function (L) {
  const subs = {};
  L.bus = {
    on(ev, fn) { (subs[ev] = subs[ev] || []).push(fn); return () => { subs[ev] = subs[ev].filter(f => f !== fn); }; },
    emit(ev, payload) { (subs[ev] || []).forEach(fn => { try { fn(payload); } catch (e) { console.error('bus', ev, e); } }); (subs['*'] || []).forEach(fn => { try { fn(ev, payload); } catch (e) { } }); }
  };
})(LORA);
