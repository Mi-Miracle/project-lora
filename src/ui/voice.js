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
  // ---- PIPER: нейронний офлайн-голос (onnxruntime-web, MIT — у грі; модель uk_UA ukrainian_tts — датасет CC0,
  //      3 голоси: Лада, Микита, Тетяна; ~77 МБ, завантажується один раз з GitHub/HuggingFace і зберігається локально)
  const PIPER = { gh: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-uk_UA-ukrainian_tts-medium.tar.bz2',
    hf: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/uk/uk_UA/ukrainian_tts/medium/uk_UA-ukrainian_tts-medium.onnx' };
  const ps = { st: 'none', err: '', prog: 0, w: null, pend: new Map(), id: 0, map: null };
  const base = location.href.replace(/[^/]*([?#].*)?$/, '');
  const PW = `importScripts('${base}lib/ort/ort.wasm.min.js','${base}lib/seek-bzip.js');ort.env.wasm.wasmPaths='${base}lib/ort/';ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;
let sess=null;
function untar(u8){const out={};let o=0;const dec=new TextDecoder();while(o+512<=u8.length){const name=dec.decode(u8.subarray(o,o+100)).replace(/\\0[\\s\\S]*$/,'');if(!name)break;const size=parseInt(dec.decode(u8.subarray(o+124,o+136)).replace(/\\0[\\s\\S]*$/,'').trim()||'0',8);o+=512;out[name]=u8.subarray(o,o+size);o+=Math.ceil(size/512)*512;}return out;}
async function grab(url,p0,p1){const r=await fetch(url);if(!r.ok)throw new Error('HTTP '+r.status);const len=+r.headers.get('content-length')||0;const rd=r.body.getReader();const parts=[];let got=0,last=0;for(;;){const {done,value}=await rd.read();if(done)break;parts.push(value);got+=value.length;if(len&&got-last>2e6){last=got;postMessage({prog:p0+(p1-p0)*got/len});}}const u=new Uint8Array(got);let o=0;for(const x of parts){u.set(x,o);o+=x.length;}return u;}
async function load(d){const c=await caches.open('lora-voice-v1');let m=await c.match('${base}__cache/piper/uk.onnx'),j=await c.match('${base}__cache/piper/uk.json');let model,cfg;
 if(m&&j){model=new Uint8Array(await m.arrayBuffer());cfg=await j.json();}
 else{let err='';for(const src of d.src){try{if(/\\.bz2$/.test(src.u)){const raw=await grab(src.u,0.02,0.6);postMessage({prog:0.62,msg:'unpack'});const tar=untar(SeekBzip.decode(raw));const k=Object.keys(tar);model=tar[k.find(x=>/\\.onnx$/.test(x))];cfg=JSON.parse(new TextDecoder().decode(tar[k.find(x=>/\\.onnx\\.json$/.test(x))]));}
   else{model=await grab(src.u,0.02,0.85);cfg=JSON.parse(new TextDecoder().decode(await grab(src.u+'.json',0.85,0.88)));}
   if(model&&cfg)break;}catch(e){err+=src.n+': '+e.message+'; ';model=null;}}
  if(!model)throw new Error(err||'download');await c.put('${base}__cache/piper/uk.onnx',new Response(model));await c.put('${base}__cache/piper/uk.json',new Response(JSON.stringify(cfg)));}
 postMessage({prog:0.92});try{const mj=(await (await fetch('${base}lib/ort/ort-wasm-simd-threaded.mjs')).text()).split('import.meta.url').join(JSON.stringify('${base}lib/ort/ort-wasm-simd-threaded.mjs'));const wb=await (await fetch('${base}lib/ort/ort-wasm-simd-threaded.wasm')).arrayBuffer();ort.env.wasm.wasmPaths={mjs:URL.createObjectURL(new Blob([mj],{type:'text/javascript'})),wasm:'${base}lib/ort/ort-wasm-simd-threaded.wasm'};ort.env.wasm.wasmBinary=new Uint8Array(wb);}catch(e){}sess=await ort.InferenceSession.create(model,{executionProviders:['wasm']});return cfg;}
function wav(a,sr){let mx=0;for(let i=0;i<a.length;i++){const v=Math.abs(a[i]);if(v>mx)mx=v;}const k=0.9/Math.max(0.05,mx),n=a.length,b=new ArrayBuffer(44+n*2),v=new DataView(b);const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
 w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
 for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.max(-32767,Math.min(32767,Math.round(a[i]*k*32767))),true);return b;}
onmessage=async e=>{const d=e.data;
 if(d.init){try{const cfg=await load(d);postMessage({ready:1,map:cfg.phoneme_id_map,sr:cfg.audio.sample_rate,inf:cfg.inference});}catch(err){postMessage({fail:String(err.message||err)})}return;}
 try{const ids=d.ids;const feeds={input:new ort.Tensor('int64',BigInt64Array.from(ids.map(BigInt)),[1,ids.length]),input_lengths:new ort.Tensor('int64',BigInt64Array.from([BigInt(ids.length)]),[1]),scales:new ort.Tensor('float32',Float32Array.from([0.667,d.len,0.8]),[3]),sid:new ort.Tensor('int64',BigInt64Array.from([BigInt(d.sid)]),[1])};
  const out=await sess.run(feeds);const a=out[sess.outputNames[0]].data;const b=wav(a,d.sr);postMessage({id:d.id,wav:b},[b]);}catch(err){postMessage({id:d.id,err:String(err.message||err)})}};`;
  function piperInstall(onProg) {
    if (ps.st === 'ready') return Promise.resolve(true); if (ps.P) return ps.P; ps.st = 'loading'; ps.err = ''; ps.prog = 0.01;
    const viaProxy = /^http:\/\/(localhost|127\.0\.0\.1):8642\//.test(location.href);
    const src = (window.LORA_PIPER_SRC && window.LORA_PIPER_SRC.map(x => ({ n: x.n, u: new URL(x.u, location.href).href }))) || [...(viaProxy ? [{ n: 'GitHub', u: '/__dl?u=' + encodeURIComponent(PIPER.gh) + '&f=.bz2' }] : []), { n: 'HuggingFace', u: PIPER.hf }, { n: 'GitHub', u: PIPER.gh }];
    src.forEach(x => { if (/__dl/.test(x.u) && !/\.bz2$/.test(x.u)) x.u += '&f=.bz2'; });
    ps.P = new Promise((res, rej) => {
      const w = new Worker(URL.createObjectURL(new Blob([PW], { type: 'text/javascript' })));
      w.onmessage = e => { const d = e.data; if (d.prog != null) { ps.prog = d.prog; onProg && onProg(d.prog); return; } if (d.ready) { ps.w = w; ps.map = d.map; ps.sr = d.sr; ps.st = 'ready'; ps.prog = 1; res(true); return; } if (d.fail) { rej(new Error(d.fail)); return; }
        const p = ps.pend.get(d.id); if (!p) return; ps.pend.delete(d.id); d.err ? p.rej(new Error(d.err)) : p.res(d.wav); };
      w.onerror = e => rej(new Error(e.message || 'worker'));
      w.postMessage({ init: 1, src });
    }).catch(e => { ps.st = 'error'; ps.err = String(e.message || e); ps.P = null; throw e; });
    return ps.P;
  }
  // українська нормалізація: числа словами, скорочення, одиниці
  const ONES = ['нуль', 'один', 'два', 'три', 'чотири', 'пʼять', 'шість', 'сім', 'вісім', 'девʼять', 'десять', 'одинадцять', 'дванадцять', 'тринадцять', 'чотирнадцять', 'пʼятнадцять', 'шістнадцять', 'сімнадцять', 'вісімнадцять', 'девʼятнадцять'];
  const TENS = ['', '', 'двадцять', 'тридцять', 'сорок', 'пʼятдесят', 'шістдесят', 'сімдесят', 'вісімдесят', 'девʼяносто'], HUN = ['', 'сто', 'двісті', 'триста', 'чотириста', 'пʼятсот', 'шістсот', 'сімсот', 'вісімсот', 'девʼятсот'];
  const plural = (n, f) => { n = Math.abs(n) % 100; const d = n % 10; return n > 10 && n < 20 ? f[2] : d === 1 ? f[0] : d >= 2 && d <= 4 ? f[1] : f[2]; };
  function tri(n, fem) { const h = Math.floor(n / 100), r = n % 100, o = []; if (h) o.push(HUN[h]); if (r < 20) { if (r || !o.length) o.push(fem && r === 1 ? 'одна' : fem && r === 2 ? 'дві' : ONES[r]); } else { o.push(TENS[Math.floor(r / 10)]); const d = r % 10; if (d) o.push(fem && d === 1 ? 'одна' : fem && d === 2 ? 'дві' : ONES[d]); } return o.join(' '); }
  function num(n) { n = Math.floor(Math.abs(n)); if (n === 0) return 'нуль'; const S = [[1e9, ['мільярд', 'мільярди', 'мільярдів'], 0], [1e6, ['мільйон', 'мільйони', 'мільйонів'], 0], [1e3, ['тисяча', 'тисячі', 'тисяч'], 1]]; const o = [];
    for (const [v, f, fem] of S) { const q = Math.floor(n / v); if (q) { o.push(tri(q, fem) + ' ' + plural(q, f)); n %= v; } } if (n) o.push(tri(n, 0)); return o.join(' '); }
  const UNIT = { 'млрд': ['мільярд', 'мільярди', 'мільярдів', 'мільярда'], 'млн': ['мільйон', 'мільйони', 'мільйонів', 'мільйона'], 'тис.': ['тисяча', 'тисячі', 'тисяч', 'тисячі'], 'трлн': ['трильйон', 'трильйони', 'трильйонів', 'трильйона'], '%': ['відсоток', 'відсотки', 'відсотків', 'відсотка'], 'км': ['кілометр', 'кілометри', 'кілометрів', 'кілометра'], 'дн.': ['день', 'дні', 'днів', 'дня'] };
  const ABBR = { 'ВВП': 'ве ве пе', 'США': 'сполучені штати', 'ЄС': 'євросоюз', 'ООН': 'о о ен', 'НАТО': 'нато', 'ШІ': 'ші', 'ППО': 'пе пе о', 'ВПК': 'ве пе ка', 'ПВК': 'пе ве ка', 'КАБ': 'каб', 'R&D': 'ер енд ді', 'IT': 'ай ті', 'AI': 'ші', 'MP': 'ем пі', 'LORA': 'лора' };
  function ukNorm(t) {
    t = ' ' + t + ' '; for (const k in ABBR) t = t.split(k).join(ABBR[k]);
    t = t.replace(/\$\s?(\d+(?:[.,]\d+)?)\s*(трлн|млрд|млн|тис\.)?/g, (m, a, u) => a + ' ' + (u || '') + ' доларів');
    t = t.replace(/(\d+)[.,](\d+)\s*(трлн|млрд|млн|тис\.|%|км)?/g, (m, a, b, u) => tri(0, 0) && '' || num(+a).replace(/(^| )один$/, '$1одна').replace(/(^| )два$/, '$1дві') + ' кома ' + (b.length > 2 ? b.split('').map(x => ONES[+x]).join(' ') : num(+b)) + (u ? ' ' + UNIT[u][3] : '') + ' ');
    t = t.replace(/(\d[\d\s]*\d|\d)\s*(трлн|млрд|млн|тис\.|%|км|дн\.)?/g, (m, a, u) => { const n = +a.replace(/\s/g, ''); return (u === 'тис.' ? (n === 1 ? '' : n < 1000 ? tri(n, 1) : num(n)) : num(n)) + (u ? ' ' + plural(n, UNIT[u]) : '') + ' '; });
    t = t.replace(/[−–]/g, ' мінус ').replace(/\+/g, ' плюс ').replace(/[«»"“”]/g, '').replace(/[×→·•|/]/g, ', ').replace(/[ʼ’`]/g, "'");
    return t.replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function piperIds(text) { const M = ps.map, out = [...M['^']]; for (const ch of ukNorm(text).normalize('NFD')) { const id = M[ch]; if (id) { out.push(...id, ...M['_']); } } out.push(...M['$']); return out; }
  const piperSynth = (t, S) => new Promise((res, rej) => { const id = ++ps.id; ps.pend.set(id, { res, rej }); ps.w.postMessage({ id, ids: piperIds(t), sid: +(S.piperSpk != null ? S.piperSpk : 0), len: 1 / Math.max(0.5, S.vrate || 1), sr: ps.sr || 22050 }); });
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
    const key = engine + '|' + lang + '|' + (S.vrate || 1) + '|' + (S.piperSpk || 0) + '|' + text; let blob = st.cache.get(key);
    if (!blob) {
      let r; if (engine === 'piper') { await piperInstall(); r = { buf: await piperSynth(text, S), mime: 'audio/wav' }; }
      else if (engine === 'espeak') { await esInstall(); r = { buf: await esSynth(text, lang, S.vrate, S.vpitch), mime: 'audio/wav' }; }
      else if (engine === 'azure') r = await azure(text, lang, S); else if (engine === 'eleven') r = await eleven(text, lang, S); else throw new Error('engine');
      blob = new Blob([r.buf], { type: r.mime }); st.cache.set(key, blob); if (st.cache.size > 60) st.cache.delete(st.cache.keys().next().value);
    }
    return new Promise(res => { stop(); const a = new Audio(URL.createObjectURL(blob)); a.volume = Math.min(1, (S.voiceVol != null ? S.voiceVol : 0.9)); st.audio = a;
      a.onended = a.onerror = () => { if (st.audio === a) st.audio = null; URL.revokeObjectURL(a.src); res(true); }; a.play().catch(() => res(false)); });
  }
  return { say, stop, esInstall, piperInstall, ukNorm, synth: esSynth, state: () => ({ es: st.es, err: st.esErr, prog: st.prog, ps: ps.st, perr: ps.err, pprog: ps.prog }) };
})();
