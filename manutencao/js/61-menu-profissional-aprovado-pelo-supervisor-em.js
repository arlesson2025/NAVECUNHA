/* ===== Menu profissional (aprovado pelo Supervisor em 22/10/2026): Operação = o ciclo numerado 1 a 4 (início, meio e fim) · Gestão = consulta =====
   Nomes no mesmo padrão (substantivo + subtítulo curto em minúsculas, sem "&"), um ícone por item, nº de empurradores como número discreto ao lado de "Frota". */
'use strict';
{ const by = id => SECOES.find(s => s.id === id), set = (id, nome, sub) => { const s = by(id); if (s) { if (nome) s.nome = nome; s.sub = sub; } };
  set('hoje', null, 'chegada, saída e viagem');
  set('prev2', '2 · Programar preventiva', 'vencidos e do mês');
  set('omsv2', '3 · Executar e lançar', 'OMs do Sankhya');
  set('conf2', '4 · Conferir e encerrar', 'fechar no SMF e no Sankhya');
  set('crono', 'Plano preventivo', 'cronograma e Anexo I');
  set('cond2', 'Condição dos equipamentos', 'óleo, compressão, parâmetros');
  const ic = { hoje: '<path d="M3 17l2 3h14l2-3"/><path d="M5 17v-6h14v6"/><path d="M12 11V4"/><path d="M12 4l5 3h-5"/>',
    prev2: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M12 13v5M9.5 15.5h5"/>',
    omsv2: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h4"/>',
    conf2: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    crono: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    cond2: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-6"/><circle cx="12" cy="18" r="1"/>' };
  Object.assign(ICO, ic); }
