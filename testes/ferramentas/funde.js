// Funde os embrulhos de AFTER na função base. node funde.js index.html
const fs = require('fs'), acorn = require('acorn');
const arq = process.argv[2]; let src = fs.readFileSync(arq, 'utf8');
function stmts() { const out = []; const re = /<script>([\s\S]*?)<\/script>/g; let m;
  while ((m = re.exec(src))) { const ini = m.index + 8; const ast = acorn.parse(m[1], { ecmaVersion: 'latest' }); ast.body.forEach(st => out.push({ st, ini })); } return out; }
function base(nome) { // última atribuição de topo AFTER.nome = function
  const L = stmts().filter(({ st }) => st.type === 'ExpressionStatement' && st.expression.type === 'AssignmentExpression' && src.slice(st.expression.left.start + 0, 0) === '' && st.expression.left.type === 'MemberExpression' && st.expression.left.object.name === 'AFTER' && st.expression.left.property.name === nome);
  if (L.length !== 1) throw new Error('base ' + nome + ' ' + L.length); const { st, ini } = L[0], f = st.expression.right;
  const tops = f.body.body.filter(s => s.type === 'ReturnStatement' || (s.type === 'IfStatement' && /return/.test(src.slice(ini + s.start, ini + s.end)) && !/=>/.test(src.slice(ini + s.start, ini + s.end))));
  return { fim: ini + f.body.end - 1, ini: ini + f.body.start + 1, tops: tops.map(s => src.slice(ini + s.start, ini + s.end).slice(0, 80)), f, off: ini };
}
function onclickIni(nome) { // começo do corpo do m.onclick dentro da base
  const b = base(nome); let achou = null;
  require('acorn-walk').full(b.f.body, n => { if (!achou && n.type === 'AssignmentExpression' && n.left.type === 'MemberExpression' && n.left.property.name === 'onclick' && /Function/.test(n.right.type)) achou = b.off + n.right.body.start + 1; });
  if (!achou) throw new Error('sem onclick ' + nome); return achou; }
function wrapper(txt) { const i = src.indexOf(txt); if (i < 0 || src.indexOf(txt, i + 1) >= 0) throw new Error('wrapper ' + txt);
  const x = stmts().find(({ st, ini }) => ini + st.start === i); if (!x) throw new Error('não é instrução ' + txt); return [i, x.ini + x.st.end]; }
const ins = (pos, code) => { src = src.slice(0, pos) + code + src.slice(pos); };
const tira = ([a, b]) => { if (src[b] === '\n') b++; src = src.slice(0, a) + src.slice(b); };
module.exports = { get src() { return src; }, set src(v) { src = v; }, base, onclickIni, wrapper, ins, tira, salva: () => fs.writeFileSync(arq, src) };
if (require.main === module) for (const n of ['om', 'acomp', 'cxr', 'compr', 'barco', 'rotina']) console.log(n, JSON.stringify(base(n).tops));
