# Roda os testes antes de publicar: sintaxe de todos os js (precisa de node + acorn; sem eles, avisa e segue), fumaça, cliques,
# horímetro e sincronização. O teste das telas (telas.py, compara com a main) roda à parte.
# Uso: python testes/todos.py
import os, shutil, subprocess, sys

sys.stdout.reconfigure(encoding='utf-8')
AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
ok = True

node = shutil.which('node')
if node:
    js = ("const fs=require('fs');let a;try{a=require('acorn')}catch(e){console.log('SEM_ACORN');process.exit(0)}"
          "let n=0;for(const f of fs.readdirSync('manutencao/js'))try{a.parse(fs.readFileSync('manutencao/js/'+f,'utf8'),{ecmaVersion:'latest',allowReturnOutsideFunction:true})}catch(e){n++;console.log(f,e.message)}process.exit(n?1:0)")
    r = subprocess.run([node, '-e', js], cwd=RAIZ, capture_output=True, text=True, encoding='utf-8')
    if 'SEM_ACORN' in r.stdout:
        print('AVISO  sintaxe não conferida: instale o acorn (npm install acorn)')
    else:
        print(('OK     ' if r.returncode == 0 else 'FALHOU ') + 'sintaxe dos js' + ('' if r.returncode == 0 else ' · ' + r.stdout.strip()))
        ok &= r.returncode == 0
else:
    print('AVISO  sintaxe não conferida: node não encontrado')

for t in ['fumaca.py', 'cliques.py', 'horimetro.py', 'sincronizacao.py']:
    print('\n— ' + t)
    r = subprocess.run([sys.executable, os.path.join(AQUI, t)], cwd=RAIZ, env=dict(os.environ, PYTHONIOENCODING='utf-8'))
    ok &= r.returncode == 0

print('\n' + ('TUDO OK' if ok else 'HÁ FALHAS'))
sys.exit(0 if ok else 1)
