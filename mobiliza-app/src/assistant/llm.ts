/**
 * Integração com IA generativa (LLM) via OpenRouter, SEM chave no navegador.
 *
 * Fluxo: navegador → Supabase Edge Function "mobiliza-ia" → OpenRouter.
 * A chave fica só no secret OPENROUTER_API_KEY do projeto Supabase (código da função em
 * supabase/functions/mobiliza-ia/index.ts). Se a função falhar ou estiver sem chave,
 * a Mobiliza IA responde com as regras locais (modo híbrido).
 */
import { NOME_MODALIDADE, veiculoPorId } from '../data/veiculos';
import { bonusTaxa, calcularOpcao, custosMensais, ratingRelacionamento } from '../engine';
import type { ContextoAssistente, Mensagem } from './tipos';

export const CONFIG_IA = {
  /** URL pública da função (não é segredo). Vazio = desliga a IA generativa. */
  endpoint: 'https://uazqexuhlfpogzbptxhc.supabase.co/functions/v1/mobiliza-ia',
  /** Chave PUBLICÁVEL do Supabase (feita para o navegador; não dá acesso a segredos). */
  chavePublicavel: 'sb_publishable_AzW6GS58CFnwuckqw4C_qw_WZ_pmoBf',
  timeoutMs: 30000,
};

const n = (v: number) => Math.round(v);

/** Contexto enxuto e serializável enviado à IA: SÓ números produzidos pelo motor de cálculo. */
export function montarContextoEstruturado(ctx: ContextoAssistente) {
  const { dados, derivados } = ctx;
  const p = derivados.premissasEfetivas;
  const base = { kmMensal: derivados.km.kmMensal, recargaEmCasa: dados.rotina.recargaEmCasa, premissas: p, perfil: dados.perfil };
  const frente = (id: string, m: 'financiamento' | 'assinatura' | 'leasing') => {
    const o = calcularOpcao(veiculoPorId(id), m, base);
    const c = custosMensais(o);
    return {
      veiculo: veiculoPorId(id).nome,
      modalidade: NOME_MODALIDADE[m],
      entrada: n(o.desembolsoInicial),
      parcelaOuMensalidade: n(o.parcelaMensal),
      energiaMes: n(c.energia),
      manutencaoMes: n(c.manutencao),
      ipvaMes: n(c.ipva),
      seguroMes: n(c.seguro),
      totalPorMes: n(o.desembolsoMensal),
      custoTotalNoPeriodo: n(o.custoLiquido),
    };
  };
  const ev = derivados.eletrico[dados.veiculoEletricoId];
  const rating = ratingRelacionamento(dados.relacionamento);
  return {
    aviso: 'Protótipo acadêmico não oficial; veículos, preços e taxas fictícios ou hipóteses editáveis.',
    horizonteMeses: p.horizonteMeses,
    rotina: {
      kmMensal: n(derivados.km.kmMensal),
      maiorDiaKm: n(derivados.km.maiorDiaKm),
      diasPorSemana: derivados.km.diasComDeslocamento,
      viagensLongas: dados.rotina.viagens.map((v) => ({ nome: v.nome, kmIdaEVolta: v.kmIdaEVolta, vezesPorAno: v.vezesPorAno })),
      recargaEmCasa: dados.rotina.recargaEmCasa,
    },
    perfil: { orcamentoMensal: dados.perfil.orcamentoMensal, valorDisponivel: dados.perfil.valorDisponivel },
    premissas: {
      gasolinaLitro: p.precoGasolinaLitro,
      energiaCasaKwh: p.precoEnergiaCasaKwh,
      energiaPublicaKwh: p.precoEnergiaPublicaKwh,
      ipvaEletricoPctAno: p.ipvaPctAno.eletrico,
      ipvaCombustaoPctAno: p.ipvaPctAno.combustao,
      taxaFinanciamentoSemRelacionamentoMes: dados.premissas.financiamento.taxaMes,
      taxaFinanciamentoEfetivaMes: p.financiamento.taxaMes,
    },
    relacionamento: { ...dados.relacionamento, reducaoTaxaMes: bonusTaxa(dados.relacionamento, dados.premissas), rating: rating.nivel, pontos: rating.pontos },
    tresFrentes: {
      eletrico: frente(dados.veiculoEletricoId, 'financiamento'),
      combustao: frente(dados.veiculoReferenciaCombustaoId, 'financiamento'),
      assinatura: frente(dados.veiculoEletricoId, 'assinatura'),
      leasing: frente(dados.veiculoEletricoId, 'leasing'),
    },
    eletrico: {
      veiculo: veiculoPorId(dados.veiculoEletricoId).nome,
      adequacao: ev.adequacao,
      autonomiaSeguraKm: n(ev.autonomiaPlanejadaKm),
      recargasPorSemana: Number(ev.recargasPorSemana.toFixed(1)),
      recargaMes: n(ev.custoRecargaMes),
      combustivelMes: n(ev.custoCombustivelMes),
      economiaEnergiaMes: n(ev.economiaMes),
      santanderParticipacaoMercadoEletricos: '50% a 60% (citado pela banca avaliadora; a confirmar)',
    },
    recomendacao: derivados.recomendacao.melhor && {
      veiculo: veiculoPorId(derivados.recomendacao.melhor.veiculoId).nome,
      modalidade: NOME_MODALIDADE[derivados.recomendacao.melhor.modalidade],
      totalPorMes: n(derivados.recomendacao.melhor.desembolsoMensal),
      motivo: derivados.recomendacao.motivo,
    },
    opcoes: derivados.opcoes.map((o) => ({
      veiculo: veiculoPorId(o.veiculoId).nome,
      modalidade: NOME_MODALIDADE[o.modalidade],
      totalPorMes: n(o.desembolsoMensal),
      custoTotal: n(o.custoLiquido),
      custoPorKm: Number(o.custoPorKm.toFixed(2)),
      valorInicial: n(o.desembolsoInicial),
      cabeNoOrcamento: o.cabeNoOrcamento,
    })),
  };
}

/**
 * Pergunta à IA generativa. `calculoDeReferencia` é a resposta das regras locais, enviada para
 * a IA explicar sem inventar números. Lança erro se a IA estiver indisponível.
 */
export async function perguntarIA(pergunta: string, ctx: ContextoAssistente, calculoDeReferencia: string, historico: Mensagem[]): Promise<{ texto: string; modelo: string | null }> {
  if (!CONFIG_IA.endpoint) throw new Error('IA generativa desligada');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CONFIG_IA.timeoutMs);
  try {
    const r = await fetch(CONFIG_IA.endpoint, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', apikey: CONFIG_IA.chavePublicavel },
      body: JSON.stringify({
        pergunta,
        contexto: { ...montarContextoEstruturado(ctx), calculoDeReferencia },
        historico: historico.slice(-6).map((m) => ({ autor: m.autor, texto: m.texto })),
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || typeof j.texto !== 'string') throw new Error(j.erro || `status ${r.status}`);
    return { texto: j.texto, modelo: j.modelo ?? null };
  } finally {
    clearTimeout(timer);
  }
}
