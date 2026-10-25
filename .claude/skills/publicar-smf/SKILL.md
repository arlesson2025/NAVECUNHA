---
name: publicar-smf
description: Confere o SMF antes de publicar na main (sintaxe, nomes globais, teste de fumaça, teste das telas, cache do service worker, manual, servidor) e diz se pode publicar.
disable-model-invocation: true
---

# Publicar o SMF

A `main` vai direto para o GitHub Pages, e o SMF é usado no celular. Rode tudo abaixo, nesta ordem, e no fim diga em uma linha **"Pode publicar"** ou **o que falta**, com o arquivo e a linha. Não publique (push na `main`) sem o Supervisor pedir.

Antes de começar, veja o que mudou em relação à `main`: `git fetch origin main` e `git diff --stat origin/main...HEAD` (mais o que não foi commitado, `git status --short`).

## 1. Sintaxe e nomes globais

```bash
node .claude/hooks/checa-js.js --todos
```

Tem de dizer `OK`. Um erro de sintaxe derruba o arquivo inteiro e os seguintes quebram com "X is not defined"; um `const`/`let` de topo com nome repetido em outro arquivo faz o mesmo. Se o acorn não estiver instalado: `npm i -g acorn`.

Procure também, nas linhas mudadas, `// comentário` no meio de uma linha que continua com código: a checagem não pega e quebra só ao rodar.

## 2. Teste de fumaça

```bash
python testes/fumaca.py
```

Abre todas as telas (mais uma `#omg`, uma `#om` e a rotina do Operador) e tem de dar zero erros.

## 3. Teste das telas

```bash
python testes/telas.py
```

Compara cada tela com a da `main`. As diferenças têm de ser **só** as das telas que esta mudança quis mexer. Numa limpeza de código tem de dar tudo IGUAL. Diferença numa tela que não era para mudar: investigue antes de publicar.

## 4. Cache do service worker

Se mudou algum arquivo que o `manutencao/sw.js` guarda (qualquer coisa em `manutencao/` fora de `servidor/`), o `CACHE` (`ctle-man-vN`) tem de ter subido em relação à `main`:

```bash
git diff origin/main...HEAD -- manutencao/sw.js | grep CACHE
```

Ícones ou manifest mudados: suba também o `?v=` deles. Arquivo novo que o app precisa para abrir vai em `ESSENCIAIS`; o resto em `OPCIONAIS`.

## 5. Arquivo novo em `manutencao/js/`

Confira que o `<script src>` dele está no `manutencao/index.html` na posição certa (o número NN é a ordem).

## 6. Servidor (só se `manutencao/servidor/Code.gs` mudou)

- `VERSAO` subiu e o comentário ao lado diz o que mudou.
- A tabela do `manutencao/servidor/README.md` tem a linha nova.
- Nenhuma senha, hash, ID de planilha/pasta, token ou chave de API no código (o repositório é público).
- Lembre o Supervisor: colar o arquivo no editor do Apps Script e implantar (Implantar → Gerenciar implantações → nova versão) **antes** de publicar a tela que depende dele; o ping do SMF mostra a versão ativa.

## 7. Documentação

- Mudou tela, fluxo ou regra: o capítulo correspondente de `docs/Manual_Operacao_SMF.html` foi atualizado?
- Bloco, convenção ou decisão nova do Supervisor: está no `CLAUDE.md`?
- Tela nova: está no `NP_TAG`? Tipo de registro novo que vale buscar: está em `bqResultados`?

## 8. Commit

Mensagens em português, no formato `Área: o que mudou` (ex.: `Óleo: …`, `Busca: …`).

## Resposta

Uma lista curta, um item por passo, com ✓ ou o problema encontrado, e no fim **"Pode publicar"** ou **"Falta: …"**.
