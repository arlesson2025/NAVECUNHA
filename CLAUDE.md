# CLAUDE.md

Orientação para o Claude Code neste repositório. Aqui ficam só as **regras e o mapa de hoje**. O histórico de cada decisão (o que mudou, em que versão e por quê) está nas notas de versão `manutencao/dados/versoes.js` e no histórico do git (o CLAUDE.md completo até a 3.158 está no commit `1c4e600^`: `git show 1c4e600^:CLAUDE.md`). Consulte só para entender um bloco antigo; **nunca traga de volta o que ele diga que saiu**.

## O que é

**SMF · Sistema de Manutenção da Frota** da Navecunha (Grupo VDA): PWA sem build, sem gerenciador de pacotes, publicado pelo GitHub Pages da `main` (https://arlesson2025.github.io/NAVECUNHA/manutencao/). Duas frotas: **12 empurradores** (NP Navecunha 055) e **29 balsas petroleiras** (NP Navecunha 024). Quem decide telas e regras é o **Supervisor de Manutenção** (o usuário). Tudo em português do Brasil: código, textos de tela e mensagens de commit.

| Pasta | Conteúdo |
|---|---|
| `manutencao/` | o SMF: `index.html` (só a estrutura), `js/NN-assunto.js` (o código, carregado na ordem do número), `css/smf.css` e `css/tema-vidro.css`, `dados/anexo1.js` (plano do Anexo I, um item por linha, JSON válido) e `dados/versoes.js` (notas de versão), `forms/` (FR 049_B, FR 027_L, FR 027_A, FR 016_E), `lib/` (html2canvas, jsPDF, pdf.js: carregados só no uso; não edite os `.min.js`), `img/`, `sw.js` |
| `manutencao/servidor/` | cópia versionada do servidor Google Apps Script (`Code.gs`, hoje **v16**) |
| `docs/` | documentos de origem por frota (`docs/LEIAME.md`): `empurradores/` (NP 055, Anexo I visual, Matriz técnica, Como a frota trabalha, fluxogramas), `balsas/` (NP 024 e anexos), na raiz o comum (Manual de operação, FR 049_B). Linkados pela Biblioteca do SMF (`ENXB_DOCS` no js/85): ao mover ou renomear, atualize os links |
| `testes/` | testes de funcionamento (ver abaixo); saída em `testes/saida/` (fora do git) |
| `index.html` (raiz) | só redireciona para `manutencao/` |

## Várias sessões ao mesmo tempo (leia antes de mexer)

Várias sessões do Claude trabalham no projeto em paralelo (locais e na nuvem). Para não trazer de volta o que já saiu nem apagar o trabalho de outra sessão:
- **Ao começar**: `git fetch` e partir da `main` atual (`git switch main && git pull`, ou branch nova a partir de `origin/main`). A pasta principal fica sempre na `main`.
- **Ao publicar**: `git pull --rebase origin main` e pegar o número da versão **na hora** (`VERSAO_APP` da `origin/main` + 1, o mesmo para `CACHE`); publicar logo depois dos testes. O `testes/todos.py` **falha com a cópia atrasada**.
- Branch já publicada pode ser apagada; trabalho não publicado que não vai seguir vira etiqueta `arquivo/<nome>` antes de apagar. **O histórico da `main` nunca se apaga** (registro de mudanças, ISO 9001 8.5.6; é por ele que se recupera gráfico ou tela que sumiu).
- **Nunca tirar gráfico, quadro ou tela que o Supervisor vê sem perguntar a ele.** Retirada aprovada = tirar a linha de `testes/graficos.txt` (ou `python testes/graficos.py --gravar`) e registrar nas notas de versão.

## Publicar

- **Só quando o Supervisor disser “publica”.** Antes disso, commit local.
- Passos (Supervisor, 02/11/2026: **publicar primeiro, testar depois**): (1) `git pull --rebase origin main`; (2) subir `VERSAO_APP` (`js/02-nucleo.js`), `CACHE` (`ctle-man-vN` no `sw.js`) e acrescentar a versão **no topo** de `VERSOES` em `dados/versoes.js` (o que mudou, em palavras do Supervisor); (3) sintaxe dos js pelo node/acorn e `git push origin HEAD:main`; (4) logo depois, em segundo plano, `python testes/todos.py --rapido` (cópia, sintaxe, fumaça e gráficos, ~2 min); o completo (`python testes/todos.py`) uma vez por dia, e `python testes/telas.py` só em limpeza ou refatoração; falhou, corrigir e publicar de novo na hora. A versão sai do número da `origin/main` na hora (outra sessão pode ter publicado antes).
- Commit: `Área: o que mudou` (ex.: `Óleo: …`, `Balsas: …`, `Relatório: …`) e, no fim, `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Servidor** (Apps Script): o código é colado no editor e implantado como App da Web. Para atualizar: **Implantar → Gerenciar implantações → lápis → Versão: Nova versão**. “Nova implantação” muda o endereço. O endereço fica em `NUVEM_PADRAO` (`js/01-nuvem-e-pdf.js`, hoje `…NIakZtAkyWagP8Lal/exec`); endereços antigos guardados nos aparelhos passam sozinhos para o novo na carga (`js/02`). Mudança de contrato (ação, tipo de registro, campo) exige mexer nos dois lados e na cópia em `manutencao/servidor/`.

## Testes

- `python testes/todos.py`: cópia em dia com a publicada · sintaxe de todos os js (acorn; precisa de `node` + `acorn`) · `fumaca.py` (todas as telas em uso, balsas, links do menu, Operador) · `graficos.py` (inventário: cada gráfico de `testes/graficos.txt` tem de continuar lá) · `cliques.py` (todos os botões, Supervisor e Operador, sem gravar) · `horimetro.py` · `sincronizacao.py` (servidor simulado) · `comecar_do_zero.py` · `formularios.py` (PDF do FR 049_B, FR 049_B e FR 027_A das balsas). Base comum em `testes/_base.py`.
- `python testes/telas.py`: compara HTML e estilo calculado de cada tela com a `main` (mesma data, mesmos dados de exemplo). Numa limpeza tem de dar tudo IGUAL.
- Rodar à mão: `python -m http.server 8765 --bind 127.0.0.1` na raiz e abrir `/manutencao/`. O service worker só registra em `https:`; o modo sem sinal se testa no celular, pelo GitHub Pages.
- **Endereço local deste PC** (Supervisor, 06/11/2026: o celular não é prioridade agora; cada mudança levava 10 min): o atalho “SMF local” na área de trabalho liga `testes/servidor_local.pyw` (sem janela, porta 8780 em 127.0.0.1 e ::1, sem cache: F5 traz o código novo) e abre `http://localhost:8780/manutencao/`. Em `localhost` (`SO_LER`, js/02) o SMF pede a senha, **lê os dados reais da planilha e não envia nada** (`api` recusa tudo menos ping, login, list e getFile; `saveRec` grava só no navegador e avisa). O Supervisor confere cada mudança ali com F5 e só depois diz “publica”. Os testes usam 127.0.0.1 e não entram nesse modo.
- Dados de exemplo: frota simulada (`gerarExemplo`/`carregarExemplo`, `exemploDemo` no js/81, `balExemplo` no js/83), registros `seed`. “Começar do zero” (Administração, js/94) apaga tudo e aplica o marco zero.

## Como o código funciona

- **Escopo global único**: `const`/`let`/`function` de topo de todos os arquivos dividem o mesmo escopo. Redeclarar um nome derruba o arquivo inteiro em silêncio. Antes de criar um nome de topo: Grep `(const|let|function)\s+NOME\b` em `manutencao/js/`.
- **Telas**: `VX.<view>` devolve o HTML e `AFTER.<view>` liga os eventos (delegados em `#main` por atributos `data-*`). `render()` usa `{ admin: vAdmin, ...VX }[VIEW] || VX.enxhoje`. Hash `#view/arg`. A **última** atribuição vence: procure `VX\.x\s*=` e `AFTER\.x\s*=`. Edite a função original; não embrulhe uma função por cima da outra.
- **Núcleo** (`js/02-nucleo.js`): `A1`/`A1M` (Anexo I), `EQN`, `FROTA_MATRIZ`, `CLASSES`; utilidades `$`, `$$`, `esc` (sempre escapar ao montar HTML), `nf`, `pD`/`isoD`/`brD` (datas locais ao meio-dia), `uid`, `toast`, `modal`; `recs(kind)` com cache por versão de `S.recs` (mudar `kind` ou `excluido` só vale depois de `saveRec`); IndexedDB `ctle_man`; estado global `S` (`recs`, `cfg`, `session`, `pending`, `pdfPend`).
- **Gravação e sincronização**: `saveRec(r)` grava local, põe na fila e agenda `syncNow()` (envia a fila e lista desde `lastSync`; registro recusado pelo servidor fica na fila, os outros seguem). `api(acao, corpo)` faz POST `text/plain` para `S.url`. Fotos sobem ao Drive pelo `fotosEnviar`; a planilha recebe só a referência (`stripForCloud`).
- **Perfis**: `admin` = Supervisor, `op` = Analista, `opr` = Operador (só Chegada e saída: FR 027_L, avaria, cais/boia; tela `vOperador`).
- **Padrão das telas**: cabeçalho `enxCab(título, uma linha, botões)` (empurradores) ou `balCab` (balsas); quadros `.card` com `h2` dentro de `<div class="cm-v"><div class="cm-ws">…</div></div>` e `janelasLivres(ws, chave, '[data-enxreset]')` (arrastar, redimensionar, Reorganizar); elemento clicável dentro de SVG precisa de `data-nodrag`; pílulas `p-bad`/`p-warn`/`p-ok`/`p-mut`; cores `var(--badt/--warnt/--okt)`; textos curtos, sem “&”. Tela nova dos empurradores entra em `ENX_OK`, `PCM_MENU` (js/85), `PCM_ETAPAS` (js/87) e `NP_TAG`; das balsas, em `BAL_VIEWS`, `balNav` e `NP_TAG` (“NP 024 · item”). Gráfico novo: `python testes/graficos.py --gravar`.
- **Impressos** (Anexo II, relatórios, cronograma): abertos em janela própria **no clique** (o navegador bloqueia janela aberta depois de preparar fotos), CSS e logos embutidos (`docCab`, `LOGO64`), título da janela em ASCII (`tituloArq`: o Microsoft Print to PDF corrompe acento). Linhas finas: na impressão não existe linha abaixo de 1 px.
- **Formulários oficiais** em `forms/` (cópias das revisões em papel): `.gitattributes` (`-text`) guarda byte a byte; não reformate. O FR 049_B recebe trocas de texto exatas em `lubAbrirForm`; o FR 027_L é lido por seletores em `fr27Ler` (`#emp`, `#dt`, `#hr`, `table.hrs`, `td.c[data-key]`, `table.nc`, `#sec-c13 .sgg`…). Para trocar de revisão, troque o arquivo inteiro e confira esses pontos.
- **Service worker** (`sw.js`): busca primeiro na rede. `ESSENCIAIS` (sem eles o SMF não abre ou o FR 049_B/FR 027_L não funcionam: index, anexo1, FR 049_B, FR 027_L, lib, logos) × `OPCIONAIS` (manifest, ícones, FR 016_E, imagens, `dados/versoes.js`). Arquivo novo que o app precisa entra numa das listas; suba o `CACHE` a cada publicação.
- **Cuidados**: confira a sintaxe com acorn antes de publicar (um erro derruba o arquivo inteiro e os seguintes quebram com “X is not defined”); nunca ponha `// comentário` no meio de uma linha que continua com código; os arquivos misturam quebras de linha CRLF e LF (edição exata pode falhar por `\r\n`); no PowerShell leia com `-Encoding UTF8`.

## Menu de hoje

**Empurradores** (`PCM_MENU` no js/85; faixa das etapas `pcmFaixa`):
- **Integridade técnica da frota** (`enxhoje`: Matriz `sfMatriz` ou Cartões `sfCartoes`; “Pontos de atenção”) · **Layout da frota** (`enxviag`, js/94 e js/102-103: mapa, comboios, painel) · **Pendências** (`enxpend`)
- **1 Recebimento do empurrador**: 1.1 Horímetros (`enxhor`) · 1.2 Manutenção corretiva (`enxcor`, aba Análise de falhas `enxfal`, js/89)
- **2 Planejamento (PCM)**: 2.1 Cronograma de manutenção (`enxcr`) · 2.2 Backlog e OM preventiva (`enx`) · 2.3 Plano preventivo (`enxplano`, js/91: o Anexo I da NP 055 dentro do SMF) · 2.4 Equipamentos críticos e riscos (`enxrisco`, js/91)
- **3 Monitoramento de condição**: 3.1 Lubrificação (`oleo`) · 3.2 Controles (abas `MC_VIEWS`: Calibração `enxcal`, Compressão `compr`, Análise de óleo `anoleo`, Arrefecimento `enxarr`, Sensores `enxsen`, Docagem `enxdoca` js/96) · 3.3 Diagnóstico (`enxdiag`)
- **4 Gestão semanal**: 4.1 Solicitações e requisições (`semsc`, js/93; lê o PDF do Sankhya; a mesma tela no menu das balsas, com Todas · Empurradores · Balsas no cabeçalho)
- **5 Fechamento mensal**: 5.1 Indicadores da NP 055 (`enxkpi`, js/90) · 5.2 Plano de ação (`enxacao`) · 5.3 Relatório gerencial (`enxrel`, js/86) · 5.4 Apresentação técnica (`enxapres`, js/92)
- **Apoio**: Histórico dos equipamentos (`enxeq`, js/95) · Biblioteca técnica (`enxbib`, botões Empurradores · Balsas · Comuns) · Administração (`admin`)

**Balsas** (`balNav` no js/83; frota escolhida no seletor do topo do menu, `FROTA_TIPO = 'bal'`; só Biblioteca e Administração são comuns): Integridade técnica da frota (`bal`, Matriz ou Lista; botão Empurradores | Balsas `frotaSw` no cabeçalho, também na dos empurradores) · 1 Recebimento: 1.1 Horímetros (`balhor`), 1.2 Manutenção corretiva (`balcor`, com Análise de falhas) · 2 Planejamento (PCM): 2.1 Cronograma de manutenção (`balcr`), 2.2 Backlog e OM preventiva (`balprog`), 2.3 Plano preventivo (`balpl`, um quadro só), 2.4 Equipamentos críticos e riscos (`balrisco`, js/97: equipamentos com item Crítico no BA1 e matriz de risco 5 × 5 dos sistemas do item 7 da NP 024, severidade proposta a revisar) · 3 Monitoramento de condição: 3.1 Lubrificação (`ballub`, js/97: troca do óleo do motor-bomba e dos mancais da bomba pelo plano, FR 049_B) · 3.2 Controles (abas `BAL_MC` no js/87: Calibração `balcal`, Compressão `balcmp`, Docagem `baldoca`) · 3.3 Diagnóstico dos motores-bomba (`baldiag`, js/97: compressão, bicos, óleo, horímetro e falha no motor → recomendação) · 4 Gestão semanal: 4.1 Solicitações e requisições (a mesma `semsc` dos empurradores) · 5 Fechamento mensal: 5.1 Indicadores da NP 024 (`balkpi`), 5.3 Relatório gerencial (`balrel`) · Apoio: Ficha técnica (`balft`), Biblioteca, Administração. Mesmos números e mesma ordem do menu dos empurradores (Supervisor, 06/11/2026); os que faltam (5.2, 5.4, Layout e Pendências) entram quando as balsas ganharem a tela. Código em `js/83` e `js/97` a `js/100`. As balsas **não** entram em `S.cfg.frota` nem nas contas dos empurradores.

## Regras que valem hoje

**Papéis e documentos**
- Preventiva e corretiva (Anexo II-B e II-A): executa a equipe de manutenção (própria) ou terceiro; recebe a bordo o Comandante ou o Coordenador de Operações; o Supervisor confere e encerra. Terceiro: relatório do fornecedor anexado ou registro do Supervisor (NP 5.8).
- Troca de óleo (FR 049_B): executa o CTF/MFM, recebe o Supervisor. **O FR 049_B é só óleo e filtro de óleo**; os demais itens de 250 h são da preventiva de terra (II-B). Nas balsas, o mesmo FR 049_B dá baixa no plano do motor-bomba.
- FR 027_L (chegada e saída do empurrador): preenche e assina o Operador de Medição/Líder, atesta o CTF, valida o Coordenador de Operações. Cada NO com nº de OM vira corretiva; sem nº, fica pendente (“Informar OM”). FR 027_A (balsa): cada não conformidade tem destino Manutenção (OM e falha) ou Operação.
- **Anexo II-B** = relatório de serviço realizado de uma OM, sem número de item do Anexo I, no máximo 5 folhas; troca de óleo não sai no II-B (é do FR 049_B). **Anexo II-A** = relatório da corretiva anexado à OM do Sankhya (dados, falha, serviço executado, tempo de reparo, assinaturas, fotos ANTES | DEPOIS). Campo vazio não aparece. Formulário de campo em branco para levar a bordo (II-B e II-A).
- **Fotos de antes e de depois obrigatórias** na preventiva feita e na corretiva.
- **Sankhya** = nº da OM, compras, requisição e encerramento com as evidências; o SMF não fala com o Sankhya (o Supervisor anexa os PDFs lá). O SMF não registra custo.
- Sem ISO 14224 em lugar nenhum: a empresa é certificada só nas ISO 9001, 14001 e 45001.

**Plano e execução**
- Fazer preventiva = o que vence no mês (vencido · vence no mês · “vence antes de voltar, adiantar?” só como aviso · em dia). OM embarcada: os itens de `EMBARCA` que vencem antes da volta saem marcados para o CTF/MFM; zincos, reversores e itens de 1.000 h ficam no porto.
- **Registrar feito** grava `base` com nº da OM obrigatório, quem executou e horímetro por motor. **Não feito** (`nf`) não reinicia o prazo. **Inspecionado · sem intervenção** (`insp`, `prox`/`proxH`, nunca além do intervalo; docagem nunca além do CSN) conta como atendido com a marca **I**.
- Corretiva: abre na falha (indisponível até a liberação), modo de falha obrigatório; na liberação, causa, serviço e teste. Corretiva que refaz serviço do Anexo I alimenta o cronograma (`itensRefeitos`).
- Cronograma do ano: aprovado uma vez (data, hora e quem; sem número de revisão e sem “Aprovar de novo”).
- Críticos = equipamentos da tabela da NP 6.3 com prioridade Crítica (`enxCrit`). Combate a incêndio: 4.1.1 e 4.1.2 Crítica em todos; no CJA XX a motobomba do canhão é o MCA 3. Motor de popa: só a troca de óleo, por saída. A motobomba de convés saiu do plano.
- Rotas: a rota é escolhida no registro de saída e vale para a viagem em curso; no porto não há rota.

**Horímetros**
- **Horímetro possível** (`horPossivel(vid, pos, h, data)`): entre a leitura anterior e a seguinte do motor, no máximo 24 h por dia + 24 h de folga. Chame antes de gravar qualquer registro com horímetro. Serviço com horímetro impossível vira “horímetro inconsistente” e aparece em 1.1 para corrigir a data ou o horímetro.
- MCP volta a zero a cada 10.000 h (`VOLTA`). Reversor conta pelas horas do MCP do mesmo bordo. MCA no cais não trabalha; sem horímetro, estimativa por estado. Troca de horímetro (`horOff`) e de reversor têm registro próprio.
- Marco zero: horímetro do dia do marco (ou até 30 dias antes); sem leitura perto da data, o motor fica sem horímetro no marco e entra no aviso.

**Condição dos motores**
- Compressão do MCP (Mitsubishi S6R2): padrão 1,80 MPa e limite 1,27 MPa (Service Manual p. 2-3); 1,45 MPa, diferença de 0,18 MPa entre cilindros e projeção < 2.000 h são critérios internos (Anexo I 1.1.12). Valores em MPa. Ao mudar um critério, atualize `cmpParam()` e o texto do 1.1.12/1.1.28 em `dados/anexo1.js` e no Anexo I visual.
- Análise de óleo do MCP (1.1.29): cada MCP a cada 1.000 h ou 12 meses; limites em `LAUDO_P`.
- Parâmetros do MCP em viagem (1.1.30): o Supervisor lança em terra; limites do fabricante em `PMC_LIM`.
- Balsas: plano `BA1` (bomba, motores MWM 6.10 TCA / Cummins Série C / MWM D229-6, válvulas, PSV, luzes, alarme, baterias, casco, escotilhas, manômetro); docagem vence na data-limite do CSN; compressão em bar (`BAL_CMP`).

**Indicadores**
- Nome único por fórmula. **Aderência ao cronograma** = feito no prazo ÷ o que venceu. **Serviços preventivos não realizados dentro do prazo** = previstos cujo prazo passou sem execução. **Itens em dia** e **Vencidos agora** = foto do momento.
- NP 055 item 9 (5.1): disponibilidade (só corretiva que impediu a operação + horas paradas da preventiva), MTBF e MTTR só de falhas Crítica e Alta, backlog lançado do Sankhya toda segunda, registro fotográfico, plano preditivo (1.1.12 e 1.1.29) no trimestre.
- Balsas (NP 024 item 10): disponibilidade, MTBF só Crítica e Alta, MTTR, backlog (falhas abertas há mais de 15 dias), cobertura preditiva (balsas com compressão em dia ÷ 29).

**Relatórios**
- 5.3 Relatório gerencial (js/86): capa com foto e sumário, painel, preventiva, corretiva, compressão (pressão medida do pior cilindro, todos os motores), calibração (barras de atraso e saldo), plano de ação e aprovação, evidências fotográficas, contracapa; anexo técnico opcional. **Todo número no período e no acumulado do ano.** Sem menção ao SGI (não é documento controlado). Gráficos `rmeGraf` (barras finas, acumulado em curva suave) e `rmeDiv` (zero no meio, atraso à esquerda). “Emitir” congela a cópia (`snap` `relmes`).
- 5.4 Apresentação técnica: slides com os números do 5.3; apresentar em tela cheia ou PDF.

**Palavras**
- “empurrador” (nunca “barco” nem “embarcação”, salvo texto citado da NP); “Registrar a execução”; “Local não informado”; “ficha técnica do empurrador”; “Ordens de Máquinas” (documento do CTF/MFM). Nome do sistema: **SMF**.

## Pendências para produção

1. Usuário por pessoa (cadastro pelo Supervisor, senha e papel próprios), no lugar das senhas compartilhadas e do nome digitado: rastreabilidade exigida pela NP 055/ISO.
2. Servidor preparado para volume: hoje cada envio lê a planilha inteira (`linhas_()`); faltam índice por id e controle do tamanho do registro (50.000 caracteres por célula). A configuração compartilhada tem limite de ~9 KB.
3. Conflito entre aparelhos decidido pelo horário do servidor, não pelo do celular.
4. Conferir o cadastro da frota real e, quando o uso real estiver firme, tirar os geradores de dados de exemplo.
5. Manual de operação (`docs/Manual_Operacao_SMF.html`) ainda descreve o menu antigo; texto da NP 055 ainda cita o ClickUp no papel do SMF/Sankhya.
