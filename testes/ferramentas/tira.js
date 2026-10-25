// Tira do index.html as instruções de topo de bloco <script> que começam com cada texto dado (um por linha no arquivo de lista).
// Uso: node tira.js <index.html> <lista.txt>   — falha se algum texto não for o começo exato de uma instrução, ou aparecer mais de uma vez.
const fs = require('fs'), acorn = require('acorn');
const [arq, lista] = [process.argv[2], process.argv[3]];
const COD = require('./codigo'); let src = COD.ler(arq);
const alvos = fs.readFileSync(lista, 'utf8').split('\n').filter(l => l.trim());
const cortes = [];
for (const txt of alvos) {
  const pos = src.indexOf(txt);
  if (pos < 0 || src.indexOf(txt, pos + 1) >= 0) { console.error('não achei ou repetido:', txt.slice(0, 80)); process.exit(1); }
  const re = /<script>([\s\S]*?)<\/script>/g; let m, achou = null;
  while ((m = re.exec(src))) { const ini = m.index + 8; if (pos < ini || pos > ini + m[1].length) continue;
    const ast = acorn.parse(m[1], { ecmaVersion: 'latest' });
    for (const st of ast.body) if (ini + st.start === pos) achou = [ini + st.start, ini + st.end]; }
  if (!achou) { console.error('não é começo de instrução:', txt.slice(0, 80)); process.exit(1); }
  cortes.push(achou);
}
cortes.sort((a, b) => b[0] - a[0]);
for (const [a, b0] of cortes) { let b = b0; if (src[b] === '\n') b++; src = src.slice(0, a) + src.slice(b); }
COD.gravar(arq, src); console.log('tiradas ' + cortes.length + ' instruções');
