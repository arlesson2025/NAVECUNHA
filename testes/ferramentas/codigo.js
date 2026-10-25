// Junta o código do SMF num texto só, no formato antigo (<script>…</script> na ordem do index.html), e devolve cada bloco ao seu arquivo js/*.js.
// Assim as ferramentas que liam o index.html de arquivo único continuam funcionando depois da divisão em arquivos (24/10/2026).
const fs = require('fs'), path = require('path');
const MARCA = n => `<script>/*@@arquivo ${n}@@*/`;
function ler(indexHtml) {
  const dir = path.dirname(indexHtml), html = fs.readFileSync(indexHtml, 'utf8');
  const arqs = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]);
  return arqs.map(a => MARCA(a) + fs.readFileSync(path.join(dir, a), 'utf8') + '</script>').join('\n');
}
function gravar(indexHtml, src) {
  const dir = path.dirname(indexHtml); let n = 0;
  for (const m of src.matchAll(/<script>\/\*@@arquivo ([^@]+)@@\*\/([\s\S]*?)<\/script>/g)) { const f = path.join(dir, m[1]); if (fs.readFileSync(f, 'utf8') !== m[2]) { fs.writeFileSync(f, m[2]); n++; } }
  return n;
}
module.exports = { ler, gravar };
