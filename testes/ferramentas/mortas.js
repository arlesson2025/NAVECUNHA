// Acha atribuições mortas no index.html do SMF: um valor (função de tela, VX.x, AFTER.x, função global) que é trocado
// depois sem que ninguém tenha guardado o valor antigo na carga da página. Lista arquivo:linha de cada atribuição morta.
// Uso: node mortas.js <index.html>
const fs = require('fs'), acorn = require('acorn'), walk = require('acorn-walk');
const arq = process.argv[2], src = fs.readFileSync(arq, 'utf8');
const linhaDe = off => src.slice(0, off).split('\n').length;
const ev = [], PAI = new Map();   // eventos em ordem de carga: {k, tipo: 'def'|'leitura', off, fim, stmtIni, stmtFim}
const chave = n => {
  if (!n) return null;
  if (n.type === 'Identifier') return n.name;
  if (n.type === 'MemberExpression' && !n.computed && n.object.type === 'Identifier' && ['VX', 'AFTER', 'VX2', 'window'].includes(n.object.name)) return (n.object.name === 'window' ? '' : n.object.name + '.') + n.property.name;
  return null;
};
const re = /<script>([\s\S]*?)<\/script>/g; let m;
while ((m = re.exec(src))) {
  const ini = m.index + 8; let ast;
  try { ast = acorn.parse(m[1], { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true }); } catch (e) { console.error('bloco não analisado', linhaDe(ini), e.message); continue; }
  // percorre só o que roda na carga: entra em blocos, ifs, try e callbacks de chamadas de topo (forEach etc.), não em corpos de função declarados
  const visita = (no, carga) => {
    if (!no || typeof no.type !== 'string') return;
    switch (no.type) {
      case 'FunctionDeclaration':
        ev.push({ k: no.id.name, tipo: 'def', off: ini + no.start, fim: ini + no.end, decl: true, no, ini });
        return;   // corpo só roda quando chamada
      case 'FunctionExpression': case 'ArrowFunctionExpression':
        if (carga === 'callback') { visita(no.body, true); }
        return;
      case 'AssignmentExpression': {
        const k = chave(no.left);
        visita(no.right, carga);
        if (k && no.operator === '=') ev.push({ k, tipo: 'def', off: ini + no.start, fim: ini + no.end, no, ini, stmt: PAI.get(no) });
        if (no.left.type === 'MemberExpression') visita(no.left.object, carga);
        return; }
      case 'CallExpression': {
        visita(no.callee, carga);
        const iife = /Function/.test(no.callee.type);
        if (iife) visita(no.callee.body, true);
        const iter = no.callee.type === 'MemberExpression' && !no.callee.computed && ['forEach', 'map', 'filter', 'some', 'every', 'reduce', 'find'].includes(no.callee.property.name);
        no.arguments.forEach(a => visita(a, /Function/.test(a.type) ? (iter ? 'callback' : false) : carga));
        return; }
      case 'Identifier': ev.push({ k: no.name, tipo: 'leitura', off: ini + no.start }); return;
      case 'MemberExpression': { const k = chave(no); if (k) ev.push({ k, tipo: 'leitura', off: ini + no.start }); visita(no.object, carga); if (no.computed) visita(no.property, carga); return; }
      case 'VariableDeclarator': visita(no.init, carga); return;
      case 'Property': visita(no.value, carga); return;
    }
    for (const key of Object.keys(no)) {
      if (key === 'type' || key === 'start' || key === 'end') continue;
      const v = no[key];
      if (Array.isArray(v)) v.forEach(x => visita(x, carga)); else if (v && typeof v.type === 'string') visita(v, carga);
    }
  };
  walk.full(ast, n => { if (n.type === 'ExpressionStatement') PAI.set(n.expression, n); });
  ast.body.forEach(st => visita(st, true));
}
// acessos dinâmicos (window[n]) não são vistos: avisa
const dyn = [...src.matchAll(/window\[\s*\w+\s*\]/g)].map(x => linhaDe(x.index));
const porK = {};
ev.sort((a, b) => a.off - b.off).forEach(e => (porK[e.k] = porK[e.k] || []).push(e));
const mortas = [];
for (const [k, L] of Object.entries(porK)) {
  const defs = L.filter(e => e.tipo === 'def'); if (defs.length < 2) continue;
  for (let i = 0; i < defs.length - 1; i++) {
    const a = defs[i], b = defs[i + 1];
    // leitura na carga entre a definição a e a próxima (inclusive dentro da própria atribuição b, como "const r0 = VX.k; VX.k = ...")
    const lido = L.some(e => e.tipo === 'leitura' && e.off > a.off && e.off < b.fim && !(e.off >= a.off && e.off < a.fim));
    if (!lido) mortas.push({ k, linha: linhaDe(a.off), depois: linhaDe(b.off), a });
  }
}
mortas.sort((a, b) => a.linha - b.linha).forEach(x => console.log(`${x.linha}\t${x.k}\t(trocada sem uso na linha ${x.depois})`));
if (process.argv.includes('--aplicar')) {
  const cortes = [];
  for (const x of mortas) { const a = x.a, no = a.no;
    if (a.decl) { const b = no.body; cortes.push({ a: a.ini + b.start, b: a.ini + b.end, por: '{}', k: x.k }); continue; }
    const fn = /Function/.test(no.right.type) || no.right.type === 'Identifier' || (no.right.type === 'MemberExpression');
    if (fn && a.stmt) { let fim = a.ini + a.stmt.end; cortes.push({ a: a.ini + a.stmt.start, b: fim, por: '', k: x.k }); }
    else console.log('pulei', x.linha, x.k); }
  let out = src; cortes.sort((p, q) => q.a - p.a); let ult = Infinity;
  for (const c of cortes) { if (c.b > ult) { console.log('sobreposto, pulei', c.k); continue; } let b = c.b; if (!c.por && out[b] === '\n') b++; out = out.slice(0, c.a) + c.por + out.slice(b); ult = c.a; }
  fs.writeFileSync(arq, out); console.log('aplicado: ' + cortes.length);
}
console.log('acessos dinâmicos window[...] nas linhas:', dyn.join(', '));
