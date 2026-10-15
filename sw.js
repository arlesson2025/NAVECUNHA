/* CTLE_LUB · service worker: deixa o painel abrir sem internet. Os dados vão ao Google quando houver sinal. */
const CACHE='ctle-lub-v23';
const ARQ=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ARQ)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;   // chamadas ao Google não passam por aqui
  e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp)).catch(()=>{});return res;})   // com sinal: sempre a versão mais nova
    .catch(()=>caches.match(r).then(m=>m||caches.match('./index.html'))));                                                    // sem sinal: usa o guardado
});
