# Servidor do SMF (Google Apps Script)

Esta pasta guarda o código do back-end do SMF: o projeto Apps Script ligado à planilha **CTLE_MAN**, cuja implantação `/exec` está em `NUVEM_PADRAO`, no topo de `manutencao/index.html`.

O arquivo é `Code.gs` (versão `VERSAO = 13`). O antigo `Code.gs` da raiz era do CTLE_LUB, já removido.

**Senhas iniciais:** nesta cópia, as senhas iniciais de `configurar()` e do cabeçalho foram trocadas pelos marcadores `<<SENHA_INICIAL_ANALISTA>>` e `<<SENHA_INICIAL_SUPERVISOR>>`. O resto do código é idêntico ao do editor. Ao colar este arquivo num projeto novo, troque os marcadores antes de rodar `configurar()`; num projeto já configurado eles não têm efeito, porque as senhas valem pelo que está nas Propriedades do script.

## Fonte da verdade

O código que roda está no editor do Apps Script, não aqui. Esta pasta é a cópia versionada (backup e referência para quem edita o front-end). Toda mudança feita no editor precisa ser copiada para cá no mesmo dia, e vice-versa.

O app usa a **versão implantada**, que pode ser mais antiga que o código aberto no editor. Ao atualizar esta pasta, registre abaixo a versão ativa (Implantar → Gerenciar implantações).

| Data da cópia | Versão implantada | Observação |
|---|---|---|
| 20/10/2026 | não informada (código com `VERSAO = 8`) | primeira cópia, colada do editor; senhas iniciais trocadas por marcadores |
| 21/10/2026 | `VERSAO = 9` · implantação 9 do Google, confirmada pelo ping do SMF | tipo `saida` (registro de saída da viagem) em `TIPOS` e nas colunas legíveis; arquivo inteiro colado no editor |
| 21/10/2026 | `VERSAO = 10` · implantada e confirmada pelo ping do SMF | tipo `fr027` (FR 027_L de chegada/saída) em `TIPOS`, nome do PDF no Drive e colunas legíveis |
| 21/10/2026 | `VERSAO = 11` · não implantada sozinha: está incluída na 12 | perfil Operador (`opr`, senha `OPR_HASH` definida pelo Supervisor): grava só FR 027_L, horímetro, saída e corretiva nova |
| 21/10/2026 | `VERSAO = 12` · implantada e confirmada pelo ping do SMF | tipo `situ` (foi para a boia / voltou ao cais), também permitido ao Operador; colunas legíveis |
| 21/10/2026 | `VERSAO = 13` · implantada e confirmada pelo ping do SMF | tipo `avaria` (avaria em viagem até virar corretiva), também permitido ao Operador; colunas legíveis |

## Como atualizar esta cópia

1. Abra a planilha CTLE_MAN → Extensões → Apps Script.
2. Copie **cada** arquivo do projeto (`.gs` e `.html`, se houver) para um arquivo com o mesmo nome nesta pasta.
3. Atualize a tabela acima e faça commit (`Servidor: …`).

## O que nunca deve vir para cá

Este repositório é público. Senhas, hashes, IDs de planilha/pasta e tokens ficam nas **Propriedades do script** (Configurações do projeto), não no código. Se o código tiver algum desses valores escrito, remova-o antes do commit.
