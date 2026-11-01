/* =====================================================================
   CORRETIVA (Anexo II-A) SIMPLIFICADA · 5 blocos, campos conforme a classe
   ISO 9001 10.2 (reagir, causa, ação, eficácia) · ISO 14001 / 45001 (contenção)
   Os campos gravados são os mesmos de antes: indicadores, relatório e planilha continuam iguais.
   ===================================================================== */
'use strict';
// modo de falha e causa padronizados
const MODOS = ['Vazamento', 'Superaquecimento', 'Perda de pressão ou vazão', 'Vibração ou ruído anormal', 'Falha elétrica ou sem partida', 'Quebra ou ruptura', 'Desgaste ou folga excessiva', 'Contaminação (água, combustível, partículas)', 'Não funciona quando acionado', 'Indicação falsa ou instrumento', 'Outro'];
const CAUSAS = ['Desgaste natural (fim de vida)', 'Montagem ou instalação incorreta', 'Operação inadequada', 'Manutenção não feita ou fora do prazo', 'Peça ou material com defeito', 'Projeto ou especificação inadequada', 'Lubrificação inadequada', 'Causa externa (detrito, colisão, água do rio)', 'Causa não identificada'];
const IMPACTOS = ['Segurança da tripulação', 'Meio ambiente (vazamento / descarte)', 'Operação (parada ou atraso)', 'Sem impacto além do equipamento'];
const EF_DIAS = 90;   // verificação da eficácia: 90 dias após a liberação (ou o prazo da medida)
const efPrev = o => o.efPrev || (() => { const b = o.mitigPrazo ? pD(o.mitigPrazo) : o.liberacao ? pD(o.liberacao) : null; return b ? isoD(new Date(b.getTime() + EF_DIAS * 864e5)) : ''; })();
const ehCA = o => o.classe === 'Crítica' || o.classe === 'Alta';
const efPend = () => oms().filter(o => o.tipo === 'C' && o.status === 'encerrada' && ehCA(o) && !o.efRes && efPrev(o) && efPrev(o) <= isoD(hoje()));
// verificação da eficácia: fica editável depois de encerrada (fora do formulário bloqueado)

