# Roda os testes antes de publicar: sintaxe de todos os js (precisa de node + acorn; sem eles, avisa e segue), fumaça, cliques,
# horímetro e sincronização. O teste das telas (telas.py, compara com a main) roda à parte.
# Uso: python testes/todos.py
import os, shutil, subprocess, sys

sys.stdout.reconfigure(encoding='utf-8')
AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
ok = True

# cópia atrasada (Supervisor, 02/11/2026: “por que tá puxando coisas do passado?”): várias sessões publicam ao mesmo tempo, e quem
# trabalha numa cópia que não tem a versão publicada mais nova traz de volta o que já saiu ou apaga o trabalho das outras
def git(*a):
    return subprocess.run(['git', *a], cwd=RAIZ, capture_output=True, text=True, encoding='utf-8')
if git('fetch', '-q', 'origin', 'main').returncode == 0:
    atras = git('rev-list', '--count', 'HEAD..origin/main').stdout.strip()
    if atras.isdigit() and int(atras) > 0:
        print(f'FALHOU cópia atrasada · faltam {atras} alteração(ões) da versão publicada: atualize antes de publicar (git pull --rebase origin main)')
        ok = False
    else:
        print('OK     cópia em dia com a versão publicada')
else:
    print('AVISO  não deu para conferir a versão publicada (sem internet?)')

node = shutil.which('node')
if node:
    js = ("const fs=require('fs');let a;try{a=require('acorn')}catch(e){console.log('SEM_ACORN');process.exit(0)}"
          "const L=fs.readdirSync('manutencao/js').map(f=>'manutencao/js/'+f).concat(fs.readdirSync('manutencao/dados').filter(f=>f.endsWith('.js')).map(f=>'manutencao/dados/'+f),['manutencao/sw.js']);"
          "let n=0;for(const f of L)try{a.parse(fs.readFileSync(f,'utf8'),{ecmaVersion:'latest',allowReturnOutsideFunction:true})}catch(e){n++;console.log(f,e.message)}process.exit(n?1:0)")
    r = subprocess.run([node, '-e', js], cwd=RAIZ, capture_output=True, text=True, encoding='utf-8')
    if 'SEM_ACORN' in r.stdout:
        print('AVISO  sintaxe não conferida: instale o acorn (npm install acorn)')
    else:
        print(('OK     ' if r.returncode == 0 else 'FALHOU ') + 'sintaxe dos js' + ('' if r.returncode == 0 else ' · ' + r.stdout.strip()))
        ok &= r.returncode == 0
else:
    print('AVISO  sintaxe não conferida: node não encontrado')

for t in ['fumaca.py', 'graficos.py', 'cliques.py', 'horimetro.py', 'sincronizacao.py', 'comecar_do_zero.py', 'formularios.py']:
    print('\n— ' + t)
    r = subprocess.run([sys.executable, os.path.join(AQUI, t)], cwd=RAIZ, env=dict(os.environ, PYTHONIOENCODING='utf-8'))
    ok &= r.returncode == 0

print('\n' + ('TUDO OK' if ok else 'HÁ FALHAS'))
sys.exit(0 if ok else 1)
