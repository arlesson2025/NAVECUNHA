// Remove do index.html do SMF declarações de topo (function / const / let) que ninguém mais usa.
// Uso: node limpa.js <index.html> [--aplicar]   (sem --aplicar só lista)
// "Ninguém usa" = o nome aparece uma vez só no arquivo inteiro (a própria declaração), contando também textos e HTML.
const fs = require('fs'), acorn = require('acorn');
const arq = process.argv[2], aplicar = process.argv.includes('--aplicar');
let src = fs.readFileSync(arq, 'utf8');
const conta = n => (src.match(new RegExp('(?<![\\w$])' + n.replace(/\$/g, '\\$') + '(?![\\w$])', 'g')) || []).length;
let total = [], volta = 0;
while (true) {
  volta++;
  const alvos = [];
  const re = /<script>([\s\S]*?)<\/script>/g; let m;
  while ((m = re.exec(src))) {
    const ini = m.index + 8, code = m[1];
    let ast; try { ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true }); } catch (e) { console.error('não analisei um bloco:', e.message); continue; }
    for (const st of ast.body) {
      let nomes = [];
      if (st.type === 'FunctionDeclaration' && st.id) nomes = [st.id.name];
      else if (st.type === 'VariableDeclaration' && st.declarations.every(d => d.id.type === 'Identifier')) nomes = st.declarations.map(d => d.id.name);
      if (!nomes.length) continue;
      // só tira se todos os nomes da declaração estiverem sem uso e o valor não tiver efeito colateral óbvio (chamada no topo)
      if (!nomes.every(n => conta(n) === 1)) continue;
      if (st.type === 'VariableDeclaration' && st.declarations.some(d => d.init && /CallExpression|NewExpression|AwaitExpression|AssignmentExpression/.test(d.init.type) && !/^(Arrow)?FunctionExpression$/.test(d.init.type))) continue;
      alvos.push({ a: ini + st.start, b: ini + st.end, nomes });
    }
  }
  if (!alvos.length) break;
  alvos.sort((x, y) => y.a - x.a);
  for (const t of alvos) { let b = t.b; if (src[b] === '\n') b++; src = src.slice(0, t.a) + src.slice(b); total.push(...t.nomes); }
  if (!aplicar) break;
}
console.log((aplicar ? 'removidos ' : 'sem uso ') + total.length + ': ' + total.join(', '));
if (aplicar) fs.writeFileSync(arq, src);
