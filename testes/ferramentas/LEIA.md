# Ferramentas de limpeza do index.html (Node + acorn)

Instalar uma vez: `npm i acorn acorn-walk` (numa pasta fora do repositório, ou com `NODE_PATH`).

- `node limpa.js manutencao/index.html [--aplicar]` — tira declarações de topo que ninguém usa (nome aparece uma vez só no arquivo).
- `node mortas.js manutencao/index.html [--aplicar]` — lista atribuições trocadas depois sem uso na carga (telas/funções mortas).
- `node tira.js manutencao/index.html lista.txt` — tira as instruções de topo que começam com cada texto da lista.
- `funde.js` — ajuda para fundir embrulhos de `AFTER` na função base (usado como módulo).

Depois de qualquer limpeza: `python testes/telas.py` tem de dar tudo IGUAL.

Desde 24/10/2026 o código fica em `manutencao/js/*.js` (um arquivo por bloco, na ordem do `index.html`). As ferramentas continuam recebendo `manutencao/index.html`: `codigo.js` junta os arquivos num texto só e, ao aplicar, devolve cada bloco ao seu arquivo.
