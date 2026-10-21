# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este repositório

Um PWA de arquivo único, sem build, para a frota de empurradores da Navecunha (Grupo VDA):

| Pasta | Conteúdo |
|---|---|
| `manutencao/` | **SMF** · Sistema de Manutenção da Frota (NP Navecunha 055: Anexo I, OMs preventivas/corretivas, óleo, cronograma, indicadores). Quase todo trabalho é em `manutencao/index.html` |
| `manutencao/servidor/` | Cópia versionada do servidor Google Apps Script do SMF (ver o README da pasta) |
| `docs/` | Documentos normativos de origem (NP 055, Anexo I visual, FR 049_B, Matriz técnica) em HTML/DOCX. Linkados pela Biblioteca do SMF (`../docs/...`) — não mover nem renomear |
| `index.html` (raiz) | Só redireciona para `manutencao/` |

O antigo CTLE_LUB (Controle de Lubrificação, que ficava na raiz) foi um teste, está descontinuado e foi removido; seu módulo foi absorvido pelo SMF. Menções a “CTLE_LUB” no código do SMF são só históricas.

O SMF fala com o deployment Apps Script em `NUVEM_PADRAO` (topo de `manutencao/index.html`). A fonte da verdade do servidor é o editor do Apps Script; mudanças de contrato (ações, campos) exigem atualizar os dois lados e a cópia em `manutencao/servidor/`.

## Comandos

Não há build, lint, testes nem gerenciador de pacotes. Publicação: GitHub Pages da `main` (https://arlesson2025.github.io/NAVECUNHA/manutencao/).

- Rodar: servir a raiz do repositório por HTTP (ex.: `python -m http.server 8765 --bind 127.0.0.1`) e abrir `/manutencao/`. O app só registra o service worker em `https:`; o comportamento offline real se testa no celular, pelo GitHub Pages. Ao mudar arquivos pré-cacheados, confira que todos baixam (`caches.open(...).addAll(ARQ)` no console).
- Dados de exemplo: o app gera uma frota simulada (`gerarExemplo` / `carregarExemplo`); o banner “Dados de exemplo” aparece enquanto existirem.
- Servidor: o código é colado manualmente no editor do Apps Script e implantado como App da Web; a URL `/exec` vai em Administração → Nuvem.

## Como ler `manutencao/index.html` (~1,7 MB, ~7.950 linhas)

**Nunca leia o arquivo inteiro nem as linhas gigantes.** Use Grep e Read com `offset`/`limit`. Os números de linha abaixo são aproximados e mudam a cada edição — localize pelos marcadores citados.

- Topo (~linha 22): `NUVEM_PADRAO` e `carregarLibsPdf()`. As bibliotecas de PDF (html2canvas, jsPDF) ficam em `manutencao/lib/` e só carregam quando `gerarPDF`, `lubMakePdf` ou `apPdf` são chamadas; não edite os `.min.js`.
- Linhas ~32–1217: CSS principal.
- `const LOGOS=` e `const A1=` (~1234–1235) têm centenas de KB cada (logos base64 e o Anexo I inteiro em JSON). Para consultar itens do Anexo I, use Grep com `-o` e um padrão específico (ex.: `"id":"1\.1\.1"[^}]*`). Outras linhas gigantes: `FR049_B64`/`FR016_B64` (formulários em base64), `AP_FOTO`, `MOTOR_IMG`.
- No PowerShell, leia com `-Encoding UTF8`; sem isso os acentos saem corrompidos.

### Núcleo (bloco `<script>` que começa em `const LOGOS=`, até antes de “LUBRIFICAÇÃO · módulo”)

- **Dados de domínio**: `A1` (itens do plano — Anexo I; `A1M` indexado por id), `EQN` (equipamentos), `FROTA_MATRIZ`/`FROTA_PADRAO` (cadastro dos empurradores CJA…), `CLASSES` (criticidade corretiva), `ETAPAS_P`/`ETAPAS_C` (fluxo das OMs).
- **Utilidades**: `$`, `$$`, `esc` (sempre escapar ao montar HTML), `nf`, `pD`/`isoD`/`brD` (datas locais ao meio-dia), `uid`, `toast`, `modal`.
- **Armazenamento**: IndexedDB `ctle_man` (stores `recs` e `kv`), com fallback em memória (`MEM`). Estado global em `S` (`recs` Map, `cfg` compartilhada, `session`, `pending`, `pdfPend`).
- **Gravação/sincronização**: `saveRec(r)` → grava local, põe o id em `S.pending`, agenda `syncNow()`. `syncNow` faz *push* da fila e depois `list` desde `lastSync`; `cfg` remota vence se `cfgAt` for mais novo. `api(action, body)` faz POST `text/plain` para `S.url` (evita preflight CORS do Apps Script).
- **Perfis**: `can.edit()` (logado) e `can.admin()` (`role === 'admin'` = Supervisor; `op` = Analista).
- **Roteamento**: hash `#view/arg` → `route()` → `render()`. `render()` escolhe a função da view no mapa base **mesclado com `VX`**, escreve `#main.innerHTML`, e chama `AFTER[view]()` para ligar eventos. Eventos são delegados em `#main.onclick/onchange` via atributos `data-*`.

### Camadas de patch (blocos `<script>` de “LUBRIFICAÇÃO · módulo”, ~linha 3170, até o fim)

O app cresceu empilhando ~50 blocos, cada um com um cabeçalho `/* ===== … ===== */` descrevendo a mudança. **Blocos posteriores sobrescrevem os anteriores**, por estes padrões:

- `VX.<view> = novaFuncao` — troca a tela.
- Envolver handlers: `{ const a0 = AFTER.x; AFTER.x = () => { a0(); const m = $('#main'), c0 = m.onclick; m.onclick = e => { …; return c0 && c0(e); }; }; }`
- Envolver views: `{ const v0 = vHor; vHor = function () { const h = v0(); … }; }`, inclusive injetando HTML via `indexOf` no HTML de outra view.
- Menu: o último `SECOES.splice(0, SECOES.length, …)` (bloco “SMF v2”, ~linha 7045) define as seções: Hoje · OMs (Sankhya) · Óleo · Cronograma · Indicadores · Biblioteca · Administração. **Mas as abas de uma seção ainda podem ser redefinidas depois** por `SECOES.find(x => x.id === '<seção>')` — ex.: as abas do Cronograma vêm da linha ~7245, não do splice. Antes de mexer em abas, procure a última ocorrência de `SECOES.find(x => x.id === '<seção>')` e confira no navegador (`nav.abas`).
- CSS adicional injetado via `<style>` criado em JS ou no fim do arquivo.

Consequência prática: para saber o que realmente aparece numa tela, procure a **última** atribuição (`VX\.crono\s*=`, `AFTER\.crono\s*=`) — a primeira definição pode estar morta. Ao alterar, prefira editar o bloco que hoje vence; se acrescentar um novo bloco de patch, siga o mesmo formato de cabeçalho e coloque-o no fim.

## Convenções do projeto

- Todo o código, identificadores, textos de UI e mensagens de commit em português (pt-BR). Commits no formato `Área: o que mudou` (ex.: `Óleo: …`, `Vencimentos: …`, `Menu: …`).
- Terminologia: “empurrador” (não “barco”); nome do sistema “SMF” (antes SGMF — chaves antigas como `localStorage 'sgmf_nome'` continuam).
- Motobomba de incêndio (`MBINC`, itens 4.1.x) está fora do plano, do cronograma, das OMs e das listas de óleo por pedido do Supervisor; registros antigos ainda se resolvem por `A1M`.
- Referências normativas aparecem no código e na UI (NP 055 itens, Anexo I/II-A/II-B, FR 049_B, FR 016_E, ISO 9001/14001/45001/14224). Mantenha-as ao mexer em formulários.
- Service worker é *network-first* (com sinal sempre pega a versão nova). Ao mudar a lista de arquivos pré-cacheados ou ícones, incremente `CACHE` em `manutencao/sw.js` (`ctle-man-vN`) e o `?v=` dos ícones/manifest.
