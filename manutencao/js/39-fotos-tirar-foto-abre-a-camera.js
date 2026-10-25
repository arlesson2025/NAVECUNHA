/* ===== fotos: "Tirar foto" abre a câmera direto; a mesma foto vai para o formulário e uma cópia fica no celular ===== */
const ehIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function fotoNome() { const d = new Date(), p = n => String(n).padStart(2, '0'); return `SMF_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.jpg`; }
function fotoGuardar(files) {
  if (ehIOS) {   // no iPhone o navegador não grava sozinho na galeria: um toque em "Salvar imagem" resolve
    const t = document.createElement('div'); t.className = 'toast fsave'; t.innerHTML = 'Foto anexada ao formulário. <button>Salvar cópia no celular</button>'; document.body.appendChild(t);
    t.querySelector('button').onclick = async () => { try { await navigator.share({ files: files.map(f => new File([f], fotoNome(), { type: f.type || 'image/jpeg' })) }); } catch (e) { } t.remove(); };
    setTimeout(() => t.remove(), 9000); return;
  }
  files.forEach(f => { try { const a = document.createElement('a'), u = URL.createObjectURL(f); a.href = u; a.download = fotoNome(); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); } catch (e) { } });
  toast('Foto anexada ao formulário · cópia salva no celular (pasta Downloads).');
}
document.addEventListener('change', e => { const i = e.target; if (!i || i.type !== 'file' || !i.hasAttribute('capture') || !i.files || !i.files.length) return; fotoGuardar([...i.files]); }, true);
// formulários dentro de janela (FR 049_B): mesma regra
document.addEventListener('load', e => { const f = e.target; if (!f || f.tagName !== 'IFRAME') return; try { const d = f.contentDocument; if (!d || d.__fotoOk) return; d.__fotoOk = 1; d.addEventListener('change', ev => { const i = ev.target; if (i && i.type === 'file' && i.hasAttribute('capture') && i.files && i.files.length) fotoGuardar([...i.files]); }, true); } catch (er) { } }, true);
{ const st = document.createElement('style'); st.textContent = `.addph.cam{border-color:#1A73E8!important;color:#1A73E8}
.toast.fsave{display:flex;align-items:center;gap:10px}.toast.fsave button{font:inherit;font-weight:600;border:0;border-radius:6px;padding:6px 10px;background:#fff;color:#1A73E8;cursor:pointer}`; document.head.appendChild(st); }
