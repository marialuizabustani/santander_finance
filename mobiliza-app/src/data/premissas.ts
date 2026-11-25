import type { Premissas } from '../engine/tipos';

/**
 * Hipóteses padrão do protótipo. TODOS os valores são ilustrativos, editáveis na interface
 * e NÃO representam condições comerciais do Santander nem de qualquer instituição.
 *
 * Fontes de referência apenas para ordem de grandeza (não são dados oficiais):
 * - preços de combustível e energia: médias aproximadas de mercado no Brasil;
 * - IPVA: varia por estado; alguns estados isentam ou reduzem para elétricos;
 * - seguro, manutenção e depreciação: estimativas genéricas por tecnologia.
 */
export const PREMISSAS_PADRAO: Premissas = {
  horizonteMeses: 36,
  diasPorSemanaParaMes: 4.4, // 5 dias/semana × 4,4 = 22 dias no mês
  precoGasolinaLitro: 6.2,
  precoEnergiaCasaKwh: 0.85,
  precoEnergiaPublicaKwh: 2.2,
  seguroPctAno: { eletrico: 0.045, hibrido: 0.04, combustao: 0.04 },
  ipvaPctAno: { eletrico: 0.02, hibrido: 0.03, combustao: 0.04 },
  manutencaoPorKm: { eletrico: 0.05, hibrido: 0.09, combustao: 0.12 },
  manutencaoPreventivaAno: { eletrico: 600, hibrido: 900, combustao: 1200 },
  depreciacaoPctAno: { eletrico: 0.15, hibrido: 0.12, combustao: 0.1 },
  financiamento: { entradaPct: 0.2, taxaMes: 0.0179, prazoMeses: 48, custosContratacaoPct: 0.03 },
  leasing: { entradaPct: 0.1, taxaMes: 0.0159, residualPct: 0.3 },
  assinatura: { mensalidadePctPreco: 0.025, franquiaKmMes: 1500, excedentePorKm: 0.6 },
  // Hipótese ilustrativa de redução de taxa por relacionamento. NÃO é política de crédito do banco.
  bonificacao: { conta: 0.0005, salario: 0.0015, debito: 0.0003, seguro: 0.0002 },
  eletrico: {
    fracaoRecargaCasaComTomada: 0.9, // 90% das recargas em casa quando há tomada/wallbox
    fracaoRecargaCasaSemTomada: 0.1,
    bateriaUtilPct: 0.9, // usa 90% da bateria (evita esgotar totalmente)
    margemSegurancaPct: 0.2, // planeja recarregar com 20% de folga
  },
};

/** Explicações curtas de cada premissa, em linguagem simples (usadas na tela de premissas). */
export const DESCRICAO_PREMISSAS: Record<string, string> = {
  horizonteMeses: 'Período usado para comparar todas as opções da mesma forma.',
  diasPorSemanaParaMes: 'Quantas vezes cada dia da semana acontece, em média, num mês.',
  precoGasolinaLitro: 'Preço médio do litro de gasolina.',
  precoEnergiaCasaKwh: 'Preço do kWh na conta de luz de casa.',
  precoEnergiaPublicaKwh: 'Preço do kWh em carregadores públicos rápidos.',
  seguroPctAno: 'Seguro por ano, como % do valor do carro.',
  ipvaPctAno: 'IPVA por ano, como % do valor do carro. Varia por estado.',
  manutencaoPorKm: 'Desgaste de pneus, freios e peças, em R$ por km rodado.',
  manutencaoPreventivaAno: 'Revisões preventivas programadas, em R$ por ano. Elétricos têm menos peças móveis.',
  depreciacaoPctAno: 'Quanto o carro perde de valor por ano.',
};
