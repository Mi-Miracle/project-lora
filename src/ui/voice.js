// ГОЛОСОВІ РУШІЇ для озвучки (крім системних голосів браузера/Windows):
// • eSpeak NG (офлайн, українська й англійська). Не входить до гри: на вимогу гравця завантажується з публічного реєстру npm
//   (пакет espeak-ng, ліцензія GPL-3.0), перевіряється за контрольною сумою й працює окремим потоком (Web Worker).
// • Microsoft Azure Speech (нейронні голоси Поліна/Остап і англійські) — за власним ключем гравця (є безкоштовний ліміт).
// • ElevenLabs (дуже живі багатомовні голоси) — за власним ключем гравця.
// Ключі зберігаються лише локально в цьому браузері/застосунку.
const VOICE = (() => {
  const ES = { url: 'https://registry.npmjs.org/espeak-ng/-/espeak-ng-1.0.2.tgz', sri: 'Xe4YC7d/+O06zYpsqrJ3LpbETdL/IO8JrnAmWcQEMoRFmMLWU+2y2HnpEkOCnqZfb40MBDVyP4ppfusKdWbPcQ==' };
  const st = { es: 'none', esErr: '', prog: 0, worker: null, pend: new Map(), id: 0, audio: null, cache: new Map() };
  const CK = 'lora-voice-v1';
  const b64 = buf => { let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  async function gunzip(buf) { const ds = new DecompressionStream('gzip'); return new Uint8Array(await new Response(new Blob([buf]).stream().pipeThrough(ds)).arrayBuffer()); }
  function untar(u8) { const out = {}; let o = 0; const dec = new TextDecoder();
    while (o + 512 <= u8.length) { const name = dec.decode(u8.subarray(o, o + 100)).replace(/\0.*$/s, ''); if (!name) break; const pre = dec.decode(u8.subarray(o + 345, o + 500)).replace(/\0.*$/s, '');
      const size = parseInt(dec.decode(u8.subarray(o + 124, o + 136)).replace(/\0.*$/s, '').trim() || '0', 8); const full = pre ? pre + '/' + name : name; o += 512; out[full] = u8.slice(o, o + size); o += Math.ceil(size / 512) * 512; }
    return out; }
  const WORKER = `let mod=null,wm=null;
onmessage=async e=>{const d=e.data;
 if(d.init){try{const u=URL.createObjectURL(new Blob([d.js],{type:'text/javascript'}));mod=(await import(u)).default;wm=await WebAssembly.compile(d.wasm);postMessage({ready:1});}catch(err){postMessage({fail:String(err)})}return;}
 try{const inst=await mod({arguments:['-v',d.v,'-s',String(d.s),'-p',String(d.p),'-w','/o.wav',d.t],print(){},printErr(){},instantiateWasm(imp,cb){WebAssembly.instantiate(wm,imp).then(i=>cb(i));return {};}});
  const w=inst.FS.readFile('/o.wav');postMessage({id:d.id,wav:w.buffer},[w.buffer]);}catch(err){postMessage({id:d.id,err:String(err)})}};`;
  async function esLoadFiles(onProg) {
    let c = null; try { c = await caches.open(CK); } catch (e) { }
    if (c) { const j = await c.match('/es/js'), w = await c.match('/es/wasm'); if (j && w) return { js: await j.text(), wasm: await w.arrayBuffer() }; }
    onProg && onProg(0.05); const r = await fetch(window.LORA_ESPEAK_URL || ES.url); if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = await r.arrayBuffer(); onProg && onProg(0.6);
    if (!window.LORA_ESPEAK_URL) { const h = b64(await crypto.subtle.digest('SHA-512', buf)); if (h !== ES.sri) throw new Error('контрольна сума не збігається'); }
    const files = untar(await gunzip(buf)); const js = files['package/dist/espeak-ng.js'], wasm = files['package/dist/espeak-ng.wasm']; if (!js || !wasm) throw new Error('невідомий формат пакета');
    const jsT = new TextDecoder().decode(js); if (c) { await c.put('/es/js', new Response(jsT)); await c.put('/es/wasm', new Response(wasm)); } onProg && onProg(0.9);
    return { js: jsT, wasm: wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength) };
  }
  function esInstall(onProg) {
    if (st.es === 'ready') return Promise.resolve(true); if (st.esP) return st.esP;
    st.es = 'loading'; st.esErr = '';
    st.esP = esLoadFiles(p => { st.prog = p; onProg && onProg(p); }).then(f => new Promise((res, rej) => {
      const w = new Worker(URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' })), { type: 'module' });
      w.onmessage = e => { const d = e.data; if (d.ready) { st.worker = w; st.es = 'ready'; st.prog = 1; res(true); return; } if (d.fail) { rej(new Error(d.fail)); return; }
        const p = st.pend.get(d.id); if (!p) return; st.pend.delete(d.id); d.err ? p.rej(new Error(d.err)) : p.res(d.wav); };
      w.onerror = e => rej(new Error(e.message || 'worker'));
      w.postMessage({ init: 1, js: f.js.split("new URL('espeak-ng.wasm', import.meta.url).href").join("'espeak-ng.wasm'"), wasm: f.wasm }, [f.wasm]);
    })).catch(e => { st.es = 'error'; st.esErr = String(e.message || e); st.esP = null; throw e; });
    return st.esP;
  }
  const esSynth = (t, lang, rate, pitch) => new Promise((res, rej) => { const id = ++st.id; st.pend.set(id, { res, rej }); st.worker.postMessage({ id, t, v: lang === 'uk' ? 'uk' : 'en-us', s: Math.round(160 * (rate || 1)), p: Math.round(50 * (pitch || 1)) }); });
  // хмарні голоси (ключ гравця)
  const xml = s => s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
  async function azure(t, lang, S) {
    const v = lang === 'uk' ? (S.azVoice || 'uk-UA-PolinaNeural') : (S.azVoiceEn || 'en-US-AvaMultilingualNeural'); const pct = Math.round(((S.vrate || 1) - 1) * 100);
    const ssml = `<speak version="1.0" xml:lang="${v.slice(0, 5)}"><voice name="${v}"><prosody rate="${pct >= 0 ? '+' : ''}${pct}%">${xml(t)}</prosody></voice></speak>`;
    const r = await fetch(`https://${(S.azRegion || 'westeurope').trim()}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': S.azKey.trim(), 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3' }, body: ssml });
    if (!r.ok) throw new Error('Azure ' + r.status); return { buf: await r.arrayBuffer(), mime: 'audio/mpeg' };
  }
  async function eleven(t, lang, S) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent((S.elVoice || 'EXAVITQu4vr4xnSDxMaL').trim())}`, { method: 'POST', headers: { 'xi-api-key': S.elKey.trim(), 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' }, body: JSON.stringify({ text: t, model_id: 'eleven_multilingual_v2' }) });
    if (!r.ok) throw new Error('ElevenLabs ' + r.status); return { buf: await r.arrayBuffer(), mime: 'audio/mpeg' };
  }
  function stop() { if (st.audio) { try { st.audio.pause(); } catch (e) { } const a = st.audio; st.audio = null; a.onended && a.onended(); } }
  // синтез + відтворення; резолвиться після завершення звуку
  async function say(engine, text, lang, S) {
    const key = engine + '|' + lang + '|' + (S.vrate || 1) + '|' + text; let blob = st.cache.get(key);
    if (!blob) {
      let r; if (engine === 'espeak') { await esInstall(); r = { buf: await esSynth(text, lang, S.vrate, S.vpitch), mime: 'audio/wav' }; }
      else if (engine === 'azure') r = await azure(text, lang, S); else if (engine === 'eleven') r = await eleven(text, lang, S); else throw new Error('engine');
      blob = new Blob([r.buf], { type: r.mime }); st.cache.set(key, blob); if (st.cache.size > 60) st.cache.delete(st.cache.keys().next().value);
    }
    return new Promise(res => { stop(); const a = new Audio(URL.createObjectURL(blob)); a.volume = Math.min(1, (S.voiceVol != null ? S.voiceVol : 0.9)); st.audio = a;
      a.onended = a.onerror = () => { if (st.audio === a) st.audio = null; URL.revokeObjectURL(a.src); res(true); }; a.play().catch(() => res(false)); });
  }
  return { say, stop, esInstall, synth: esSynth, state: () => ({ es: st.es, err: st.esErr, prog: st.prog }) };
})();
