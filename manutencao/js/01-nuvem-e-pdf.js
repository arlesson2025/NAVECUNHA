const NUVEM_PADRAO = 'https://script.google.com/macros/s/AKfycbwXXNSYq-wClpZQrOR0LasSxyr_56gdFIK8wEAyeD-Vbh8rfJ0lhNZZlbT29hJ8enKA/exec';   // planilha CTLE_MAN: todo aparelho novo já abre ligado à nuvem
/* bibliotecas de PDF (html2canvas 1.4.1, jsPDF 2.5.1) ficam em lib/ e só carregam ao gerar um PDF; o sw.js guarda as duas para funcionar sem internet */
let LIBS_PDF = null;
function carregarLibsPdf() {
  if (window.jspdf && window.html2canvas) return Promise.resolve();
  const js = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('não carregou ' + src)); document.head.appendChild(s); });
  return LIBS_PDF || (LIBS_PDF = Promise.all([js('lib/html2canvas.min.js'), js('lib/jspdf.umd.min.js')]).catch(e => { LIBS_PDF = null; throw e; }));
}
