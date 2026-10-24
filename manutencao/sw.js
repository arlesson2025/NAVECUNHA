/* SMF · service worker: deixa o painel abrir sem internet. Os dados vão ao Google quando houver sinal. */
const CACHE='ctle-man-v29';
// essenciais: sem eles o SMF não abre ou o FR 049_B (óleo) não abre/salva — se algum falhar, a instalação é cancelada e o aparelho segue com a versão anterior inteira
const ESSENCIAIS=['./','./index.html','./enxuto.js','./dados/anexo1.js','./forms/FR_049_B.html','./forms/FR_027_L.html','./lib/html2canvas.min.js','./lib/jspdf.umd.min.js'];
// opcionais: se falharem (sinal fraco a bordo), usa a cópia da versão anterior ou fica para a próxima abertura com sinal
const OPCIONAIS=['./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./icon-maskable-512.png','./forms/FR_016_E.html'];
const espera=ms=>new Promise(r=>setTimeout(r,ms));
async function baixa(c,u){for(const t of [0,1000,3000]){await espera(t);try{const res=await fetch(u,{cache:'no-cache'});if(res.ok){await c.put(u,res);return true;}}catch(e){}}return false;}   // 3 tentativas
async function guarda(){
  const c=await caches.open(CACHE);
  for(const u of ESSENCIAIS)if(!await baixa(c,u))throw new Error('essencial não baixou: '+u);
  for(const u of OPCIONAIS)if(!await baixa(c,u)){const m=await caches.match(u);if(m)await c.put(u,m);}
}
self.addEventListener('install',e=>{e.waitUntil(guarda().then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('ctle-man-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;   // chamadas ao Google não passam por aqui
  e.respondWith(fetch(new Request(r.url,{cache:'no-cache',credentials:'same-origin'})).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp)).catch(()=>{});return res;})
    .catch(()=>caches.match(r).then(m=>m||caches.match('./index.html'))));
});
