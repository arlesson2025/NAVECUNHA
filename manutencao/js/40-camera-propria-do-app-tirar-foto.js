/* ===== câmera própria do app: "Tirar foto" abre a câmera aqui dentro (não depende do celular aceitar o atalho de câmera) ===== */
function camAbrir(input) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
  let face = 'environment', stream = null;
  const ov = document.createElement('div'); ov.className = 'camov';
  ov.innerHTML = `<video playsinline autoplay muted></video><div class="camflash"></div><div class="cammsg">Abrindo a câmera…</div>
   <div class="cambar"><button class="camx" title="Cancelar">✕</button><button class="camshot" title="Tirar foto"><i></i></button><button class="camsw" title="Trocar câmera">⟲</button></div>`;
  document.body.appendChild(ov);
  const vid = ov.querySelector('video'), msg = ov.querySelector('.cammsg');
  const parar = () => { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; };
  const fechar = () => { parar(); ov.remove(); };
  const ligar = async () => { parar(); msg.style.display = 'block'; msg.textContent = 'Abrindo a câmera…';
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: face }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }); vid.srcObject = stream; await vid.play().catch(() => { }); msg.style.display = 'none'; }
    catch (e) { msg.innerHTML = 'Não consegui abrir a câmera.<br><small>Permita o uso da câmera para este site (cadeado ao lado do endereço) ou use "Da galeria".</small>'; } };
  ov.querySelector('.camx').onclick = fechar;
  ov.querySelector('.camsw').onclick = () => { face = face === 'environment' ? 'user' : 'environment'; ligar(); };
  ov.querySelector('.camshot').onclick = () => { if (!stream || !vid.videoWidth) return;
    const c = document.createElement('canvas'); c.width = vid.videoWidth; c.height = vid.videoHeight; c.getContext('2d').drawImage(vid, 0, 0);
    ov.querySelector('.camflash').classList.add('on');
    c.toBlob(b => { if (!b) return; const f = new File([b], fotoNome(), { type: 'image/jpeg', lastModified: Date.now() });
      fechar();
      try { const W = input.ownerDocument.defaultView, dt = new W.DataTransfer(); dt.items.add(f); input.files = dt.files; input.dispatchEvent(new W.Event('change', { bubbles: true })); }
      catch (e) { toast('Este navegador não deixou anexar a foto. Use "Da galeria".'); } }, 'image/jpeg', .9); };
  ligar(); return true;
}
function camLigar(doc) {
  doc.addEventListener('click', e => { const i = e.target; if (!i || i.tagName !== 'INPUT' || i.type !== 'file' || !i.hasAttribute('capture') || i.dataset.camNativa) return;
    if (!(window.navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return;
    e.preventDefault(); e.stopPropagation(); camAbrir(i); }, true);
}
camLigar(document);
document.addEventListener('load', e => { const f = e.target; if (!f || f.tagName !== 'IFRAME') return; try { const d = f.contentDocument; if (d && !d.__camOk) { d.__camOk = 1; camLigar(d); } } catch (er) { } }, true);
{ const st = document.createElement('style'); st.textContent = `
.camov{position:fixed;inset:0;z-index:99999;background:#000;display:flex;align-items:center;justify-content:center}
.camov video{width:100%;height:100%;object-fit:contain;background:#000}
.camflash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity .25s}.camflash.on{opacity:.8}
.cammsg{position:absolute;top:40%;left:0;right:0;text-align:center;color:#fff;font-size:16px;padding:0 24px}
.cambar{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:space-around;padding:22px 16px calc(22px + env(safe-area-inset-bottom,0px));background:linear-gradient(transparent,rgba(0,0,0,.6))}
.cambar button{border:0;background:rgba(255,255,255,.18);color:#fff;width:52px;height:52px;border-radius:50%;font-size:22px;cursor:pointer}
.cambar .camshot{width:76px;height:76px;background:transparent;border:4px solid #fff;padding:5px}.cambar .camshot i{display:block;width:100%;height:100%;border-radius:50%;background:#fff}
`; document.head.appendChild(st); }

