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

## Como ler `manutencao/index.html` (~1,3 MB, ~7.960 linhas)

**Nunca leia o arquivo inteiro nem as linhas gigantes.** Use Grep e Read com `offset`/`limit`. Os números de linha abaixo são aproximados e mudam a cada edição — localize pelos marcadores citados.

- Topo (~linha 22): `NUVEM_PADRAO` e `carregarLibsPdf()`. As bibliotecas de PDF (html2canvas, jsPDF) ficam em `manutencao/lib/` e só carregam quando `gerarPDF`, `lubMakePdf` ou `apPdf` são chamadas; não edite os `.min.js`.
- Linhas ~32–1217: CSS principal.
- `const LOGOS=` (~1234) é uma linha gigante (logos base64). Outras: `AP_FOTO`, `MOTOR_IMG` (imagens base64).
- **Anexo I (`A1`) fica em `manutencao/dados/anexo1.js`**, um item por linha, carregado por `<script src>` logo antes do núcleo (precisa estar disponível de forma síncrona: dezenas de blocos usam `A1` na carga). Para consultar um item, Grep em `dados/anexo1.js` por `"id":"1\.1\.1"`. Ao editar, mantenha cada linha um objeto JSON válido.
- Formulários oficiais FR 049_B, FR 027_L e FR 016_E ficam em `manutencao/forms/`, carregados por `lubFormTxt()` e postos no iframe via `srcdoc`. O FR 049_B recebe trocas de texto exatas em `lubAbrirForm` — se editar o formulário, mantenha esses trechos idênticos. `.gitattributes` (`-text`) guarda esses arquivos byte a byte (LF); não reformate nem converta quebras de linha.
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
- Menu: quem vence é o bloco “Menu por decisão” (último `<script>` do arquivo), que remonta `SECOES` como Hoje (rotina + Situação da frota + alertas P1/P2 de compressão e de óleo) · Cronograma · OMs (Sankhya) · **Condição** (Óleo da frota — com as Trocas lançadas no fim da mesma tela; `#lubreg` redireciona para lá —, Análise de óleo = view `anoleo` (matriz do laudo, tendência, programa de amostragem, limites `LAUDO_P`), Compressão do MCP, Calibração e docagem = view `controle`) · Indicadores (só KPIs e riscos) · Biblioteca · Administração. Ele parte das seções do splice do bloco “SMF v2” e da seção `compr` do bloco “Compressão do MCP”. **Mas as abas de uma seção ainda podem ser redefinidas depois** por `SECOES.find(x => x.id === '<seção>')` — ex.: as abas do Cronograma vêm da linha ~7245, não do splice. Antes de mexer em abas, procure a última ocorrência de `SECOES.find(x => x.id === '<seção>')` e confira no navegador (`nav.abas`).
- CSS adicional injetado via `<style>` criado em JS ou no fim do arquivo.

- **Nomes globais**: `const`/`let` de topo de todos os blocos dividem o mesmo escopo global. Redeclarar um nome que já existe em outro bloco (ex.: `LAY`, usado pelos painéis organizáveis) derruba o bloco inteiro com SyntaxError — e compilar o bloco isolado não acusa. Antes de criar um nome de topo, faça Grep por `(const|let|function)\s+NOME\b` no arquivo todo.
- **Janelas livres** (arrastar, redimensionar, minimizar, tela cheia): `janelasLivres(ws, chaveLocalStorage, seletorDoBotaoReorganizar)` no bloco "Compressão do MCP"; usada pela Compressão (`.cm-ws`), pelo Cronograma e pelo Óleo da frota (bloco “Óleo da frota no padrão do painel”, que usa `o3Dados()` do bloco v3 para os dados). Telas novas seguem esse padrão: `.vh` com `h1` + `p` e botões, blocos `.card` com `h2`, filtros em `.cm-chips`, cores `var(--badt/--warnt/--okt)` — sem shadow DOM nem fontes próprias. Para usar numa tela nova: envolver os cartões em `<div class="cm-v"><div class="cm-ws">…</div></div>` e chamar a função no `AFTER` da tela.

- **Antes de publicar**, confira a sintaxe de todos os blocos `<script>` no navegador (um erro derruba o bloco inteiro em silêncio, e os seguintes quebram com “X is not defined”): `[...(await fetch('index.html').then(r=>r.text())).matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m,i)=>{try{new Function(m[1])}catch(e){return i+': '+e.message}}).filter(Boolean)` tem de dar `[]`. Nunca ponha `// comentário` no meio de uma linha que continua com código.

Consequência prática: para saber o que realmente aparece numa tela, procure a **última** atribuição (`VX\.crono\s*=`, `AFTER\.crono\s*=`) — a primeira definição pode estar morta. Ao alterar, prefira editar o bloco que hoje vence; se acrescentar um novo bloco de patch, siga o mesmo formato de cabeçalho e coloque-o no fim.

## Convenções do projeto

- Todo o código, identificadores, textos de UI e mensagens de commit em português (pt-BR). Commits no formato `Área: o que mudou` (ex.: `Óleo: …`, `Vencimentos: …`, `Menu: …`).
- Indicadores com nome único (não reaproveitar o nome para outra fórmula): **Itens em dia** = itens do Anexo I em dia agora ÷ itens com histórico e **Vencidos agora** = itens vencidos hoje (foto do momento, `frotaMatriz()`, cartão Situação da frota no Hoje); **Aderência ao cronograma** = feito no prazo ÷ o que já venceu e **Ocorrências vencidas** = serviços previstos cujo prazo passou sem execução, nos meses marcados (Cronograma, `prResumo`). Bloqueio de saída = item Crítico vencido sem OM (`bloqueioSaida`); com restrição = algum item vencido sem bloqueio.
- Papéis e assinaturas (definidos pelo Supervisor): **preventiva e corretiva** (Anexo II-B/II-A) — executa a equipe de manutenção (própria, de terra) ou terceiro; recebe a bordo o Comandante ou o Coordenador de Operações (só atesta o recebimento); o Supervisor confere e encerra. Terceiro: NP 5.8 — relatório do fornecedor anexado ao Anexo II ou, sem ele, o Supervisor registra a execução no próprio Anexo II. **Troca de óleo** (FR 049_B) — executa o CTF/MFM; recebe o Supervisor. CTF/MFM nunca são executores da preventiva.
- Lançamento rápido da OM de janela (`vOmg`, bloco “Lançamento rápido honesto”): executor = equipe de manutenção (nomes) ou terceiro (prestador do cadastro `terc` + responsável técnico + relatório anexo ou registro do Supervisor, NP 5.8); recebido a bordo = Comandante ou Coordenador de Operações; **foto do formulário de execução assinado obrigatória**. Os passos do Anexo I **não** são marcados automaticamente: `o.passosFicha = true` e o PDF mostra “form.” (ou “rel.” com relatório do fornecedor, que também dispensa as medições). Fotos de prova ficam em `fotos` com tipo `FORMULÁRIO ASSINADO` / `RELATÓRIO DO FORNECEDOR`. Atenção: um bloco antigo troca na tela a palavra “Ficha” por “Formulário”; escreva os textos novos já com “formulário”.
- FR 027_L (check-list de chegada/saída no terminal, `forms/FR_027_L.html`, cópia byte a byte da Rev. 05; bloco “FR 027_L” no fim do arquivo): “Chegou em Manaus”/“Saiu de viagem” no Hoje abrem `fr27Abrir` já identificado; o SMF esconde o Salvar/Imprimir/Limpar do próprio formulário e põe “Salvar no SMF”; assinaturas pelo toque (Operador/Líder, CTF, Coord. de Operações) entram no `<i>` do C13. Ao salvar (`fr27Salvar`): PDF das folhas visíveis no Drive (`kind: 'fr027'`), horímetros do C1 lançados (`lubHor`), cada NO com nº de OM vira corretiva (`fr27Corretivas`, origem FR 027_L, sistema por `FR27_SIS`), NO sem nº fica no cartão do empurrador no Hoje (“Informar OM”). Na saída, chama `saidaModal(vid, fr)`: vale a **pior** situação entre o plano (SMF) e o C13 do FR 027_L. Para mudar o formulário, troque o arquivo inteiro pela nova revisão e confira os seletores usados em `fr27Ler` (`#emp`, `#dt`, `#hr`, `input[name=mov|cfgmcp|mdl1|mdl2|lib|ompend|fr22s]`, `table.hrs`, `td.c[data-key]`, `table.nc`, `#sec-c13 .sgg`).
- Fotos das OMs: `fotosEnviar` (bloco “fotos pelo Google Drive”) sobe ao Drive cada foto ainda sem `fid` em **qualquer etapa** da OM, poucos segundos depois de gravada (embrulho de `saveRec`), a cada 3 min e quando o sinal volta (`online`). Cada foto mostra o selo “☁ no Drive” ou “só neste aparelho”.
- Bloco “Melhorias de fluxo” (fim do arquivo): NO do FR 027_L **sem OM** entra na situação (`fr27Pend`; Crítica bloqueia, Alta restringe) em `frotaMatriz` e `saidaFoto`; OM mostra a origem (PDF do FR 027_L) e o **histórico** (`omHistHTML`, de `o.hist`); o Hoje abre com **“O que precisa de você agora”** (`agoraLista`: saídas bloqueadas, NO sem OM, corretivas Crítica/Alta, OMs para lançar/conferir, horímetros pendentes, óleo vencido, compressão, amostra de óleo). No FR 027_L: horímetro incoerente vira `horp` (pendência do Supervisor), aviso de FR 027_L duplicado no mesmo dia e movimento, e nº de OM que já é de outra embarcação é recusado.
- Registro de saída da viagem (`kind: 'saida'`, bloco “Registro de saída” no fim do arquivo): o botão “Saiu de viagem” de um empurrador no porto abre `saidaModal`. Situação calculada como na Situação da frota (`saidaFoto`): liberada = só confirmar; com restrição = justificativa + foto do FR 027_L de saída; bloqueada/interditada = justificativa + nome do Coordenador de Operações que autorizou + foto. A lista de pendências fica **congelada** no registro. Servidor v9 aceita `saida`; v10 aceita `fr027`.
- Terminologia: “empurrador” (não “barco”); nome do sistema “SMF” (antes SGMF — chaves antigas como `localStorage 'sgmf_nome'` continuam).
- Motobomba de incêndio **genérica** (`MBINC`, itens 4.1.x) está fora do plano, do cronograma, das OMs e das listas de óleo por pedido do Supervisor; registros antigos ainda se resolvem por `A1M`. **Exceção:** o motor do canhão de incêndio do CJA XX (MCA 3, MWM D229-4; em `lubEquip` tem `key: 'inc'`, `g: 'mca'`) é controlado normalmente — plano/cronograma como MCA 3 e óleo (anel “BI” no Óleo da frota). Para excluir só a genérica, filtre por `g === 'inc'`, nunca por `key === 'inc'`.
- Compressão do MCP (Mitsubishi S6R2): padrão 1,8 MPa e limite 1,27 MPa vêm do Service Manual S6R2-MPTK p. 2-3 (ação abaixo do limite: p. 4-4); o manual da S6R2 **não** traz diferença máxima entre cilindros (pesquisado no SM, O&M, Training PT 2025 e na internet); 1,45 MPa, diferença de 0,18 MPa entre cilindros (10% do padrão, proporção de um manual Mitsubishi de outra família: 0,29 sobre 2,9 MPa) e projeção < 2.000 h são **critérios internos** (Anexo I 1.1.12). Valores gravados em MPa (`COMP`, `CMP` no código); a tela mostra manual e página de cada critério — ao mudar um critério, atualize `cmpParam()` (quadro "Parâmetros, critérios e método") e o texto dos itens 1.1.12/1.1.28 (em `dados/anexo1.js` e em `docs/Anexo_I_NP_055_visual_matriz.html`).
- Análise de óleo do MCP (Anexo I 1.1.29): amostra de **cada MCP a cada 1.000 h ou 12 meses**, na troca de óleo mais próxima, junto com os bicos e a compressão (1.1.12); coleta extra quando o laudo anterior tem alerta. Substituiu o rodízio de 1 MCP por semestre (que dava 1 laudo por motor a cada ~7 anos, sem tendência); o fabricante recomenda a cada troca (O&M 6-2). Limites do laudo em `LAUDO_P`; TBN relativo ao óleo novo (`TBN_NOVO` = 10 mg KOH/g, valor típico a confirmar na ficha do óleo): atenção < 60%, crítico < 50%. Ao mudar, atualize o item 1.1.29 em `dados/anexo1.js` e em `docs/Anexo_I_NP_055_visual_matriz.html`.
- Referências normativas aparecem no código e na UI (NP 055 itens, Anexo I/II-A/II-B, FR 049_B, FR 016_E, ISO 9001/14001/45001/14224). Mantenha-as ao mexer em formulários.
- Service worker é *network-first* (com sinal sempre pega a versão nova). Ao mudar arquivos pré-cacheados ou ícones, incremente `CACHE` em `manutencao/sw.js` (`ctle-man-vN`) e o `?v=` dos ícones/manifest.
- O `sw.js` separa **`ESSENCIAIS`** (sem eles o SMF não abre, o FR 049_B de óleo não abre/salva ou o FR 027_L de chegada/saída não abre: `index.html`, `dados/anexo1.js`, `forms/FR_049_B.html`, `forms/FR_027_L.html`, `lib/*` — salvar o FR 049_B gera o PDF) de **`OPCIONAIS`** (manifest, ícones, FR 016_E). Cada arquivo tem 3 tentativas; essencial que falha cancela a instalação (o aparelho segue com a versão anterior inteira); opcional que falha usa a cópia da versão anterior. Arquivo novo que o app precisa para abrir ou para o formulário de óleo vai em `ESSENCIAIS`; o resto em `OPCIONAIS`.

## Situação e pendências

O SMF está **em construção**: o Supervisor ainda define telas e funcionalidades e **não há dados reais** (só dados de exemplo). Não trate riscos de produção como urgentes enquanto isso.

**Durante a construção** (custo de agora):
- Ao criar uma tela ou fazer mudança grande numa existente, consolidar aquela tela num bloco só, eliminando os patches antigos dela (hoje são ~2 versões por tela, 33 funções reembrulhadas e 10 injeções de HTML por `indexOf`).
- Levar para o repositório um teste das telas (comparar o HTML de cada tela com a versão da `main`) e rodá-lo antes de cada push.

**Pendências para produção** (só depois que as definições pararem, antes do primeiro dado real):
1. Usuário por pessoa (cadastro feito pelo Supervisor, senha e papel próprios), no lugar das duas senhas compartilhadas e do nome digitado — rastreabilidade exigida pela NP 055/ISO. Hoje o autor é gravado via `S.session.name`.
2. Servidor preparado para volume: não ler a planilha inteira a cada `push`/`list` (`linhas_()`), índice por id, e controle do tamanho do registro (o JSON vai numa célula; limite do Google Sheets: 50.000 caracteres). Configuração compartilhada nas Propriedades do script tem limite (~9 KB; o código recusa acima de 8.800).
3. Conflito entre aparelhos decidido pelo horário do servidor, não pelo `updatedAt` do celular.
4. Entrada em produção: limpar os dados de exemplo (e desligar os geradores de exemplo), cadastrar a frota real e definir o marco zero.
