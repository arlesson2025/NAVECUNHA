#!/usr/bin/env node
/* Checagem do SMF (CLAUDE.md, "Antes de publicar" e "Nomes globais").
   - Como hook (PostToolUse em Edit/Write): lê o JSON do Claude Code na entrada padrão e, se o arquivo editado é
     manutencao/js/*.js, confere a sintaxe dele com o acorn e se algum nome de topo choca com outro arquivo.
     Problema → sai com código 2 e a mensagem vai para o Claude corrigir na hora.
   - Manual: `node .claude/hooks/checa-js.js --todos` confere todos os arquivos (usado pelo /publicar-smf).
   Nomes de topo de todos os arquivos dividem um escopo global só: `const`/`let`/`class` com o mesmo nome de outra
   declaração de topo em outro arquivo derruba o arquivo inteiro com SyntaxError — e compilar o arquivo isolado não acusa.
   `function` repetida em dois arquivos é permitida (a última vence), por isso não é erro. */
'use strict';
const fs = require('fs'), path = require('path');

function carregaAcorn() {
  try { return require('acorn'); } catch (e) { }
  try { const g = require('child_process').execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); return require(path.join(g, 'acorn')); } catch (e) { }
  return null;
}

const RAIZ = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const PASTA = path.join(RAIZ, 'manutencao', 'js');

function analisa(acorn, arq) {
  const txt = fs.readFileSync(arq, 'utf8');
  try {
    const ast = acorn.parse(txt, { ecmaVersion: 'latest', allowReturnOutsideFunction: true, locations: true });
    const nomes = [];
    for (const n of ast.body) {
      if (n.type === 'VariableDeclaration') for (const d of n.declarations) juntaIds(d.id, n.kind, n.loc.start.line, nomes);
      else if (n.type === 'FunctionDeclaration' && n.id) nomes.push({ nome: n.id.name, tipo: 'function', linha: n.loc.start.line });
      else if (n.type === 'ClassDeclaration' && n.id) nomes.push({ nome: n.id.name, tipo: 'class', linha: n.loc.start.line });
    }
    return { nomes };
  } catch (e) { return { erro: `${e.message}` }; }
}
function juntaIds(p, tipo, linha, out) {
  if (!p) return;
  if (p.type === 'Identifier') out.push({ nome: p.name, tipo, linha });
  else if (p.type === 'ObjectPattern') p.properties.forEach(x => juntaIds(x.type === 'RestElement' ? x.argument : x.value, tipo, linha, out));
  else if (p.type === 'ArrayPattern') p.elements.forEach(x => juntaIds(x && x.type === 'RestElement' ? x.argument : x, tipo, linha, out));
  else if (p.type === 'AssignmentPattern') juntaIds(p.left, tipo, linha, out);
}

function confere(acorn, alvos) {
  const todos = fs.readdirSync(PASTA).filter(f => f.endsWith('.js')).sort();
  const info = {}; for (const f of todos) info[f] = analisa(acorn, path.join(PASTA, f));
  const probs = [];
  for (const f of alvos) {
    const a = info[f]; if (!a) continue;
    if (a.erro) { probs.push(`manutencao/js/${f}: ERRO DE SINTAXE — ${a.erro}. Um erro derruba o arquivo inteiro e os seguintes quebram com "X is not defined".`); continue; }
    for (const n of a.nomes) for (const g of todos) {
      if (g === f || !info[g].nomes) continue;
      const o = info[g].nomes.find(x => x.nome === n.nome); if (!o) continue;
      if (n.tipo === 'function' && o.tipo === 'function') continue;
      if (n.tipo === 'var' && (o.tipo === 'var' || o.tipo === 'function')) continue;
      if (n.tipo === 'function' && o.tipo === 'var') continue;
      probs.push(`manutencao/js/${f}:${n.linha}: nome de topo "${n.nome}" (${n.tipo}) já existe em manutencao/js/${g}:${o.linha} (${o.tipo}). Todos os arquivos dividem o mesmo escopo global: renomeie.`);
    }
  }
  return [...new Set(probs)];
}

const acorn = carregaAcorn();
if (process.argv.includes('--todos')) {
  if (!acorn) { console.error('acorn não encontrado: instale com `npm i -g acorn`.'); process.exit(1); }
  const fs_ = fs.readdirSync(PASTA).filter(f => f.endsWith('.js'));
  const p = confere(acorn, fs_);
  if (p.length) { console.log(p.join('\n')); process.exit(1); }
  console.log(`OK · ${fs_.length} arquivos sem erro de sintaxe e sem nome de topo repetido.`); process.exit(0);
}

let entrada = ''; process.stdin.on('data', c => entrada += c); process.stdin.on('end', () => {
  let arq = ''; try { const j = JSON.parse(entrada || '{}'); arq = (j.tool_input && (j.tool_input.file_path || j.tool_input.path)) || ''; } catch (e) { process.exit(0); }
  const rel = path.relative(PASTA, path.resolve(arq));
  if (!arq || rel.startsWith('..') || path.isAbsolute(rel) || rel.includes(path.sep) || !rel.endsWith('.js')) process.exit(0);   // só manutencao/js/*.js
  if (!acorn) { console.error('Checagem do SMF pulada: acorn não encontrado (instale com `npm i -g acorn`).'); process.exit(0); }
  const p = confere(acorn, [rel]);
  if (p.length) { console.error(p.join('\n')); process.exit(2); }
  process.exit(0);
});
