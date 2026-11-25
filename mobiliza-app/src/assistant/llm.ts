/**
 * PONTO DE INTEGRAÇÃO FUTURA com um modelo de IA real. NÃO é usado na demonstração.
 *
 * Arquitetura recomendada para produção:
 *  1. O navegador NUNCA guarda chaves de API. Ele chama um backend próprio (ex.: POST /api/assistente).
 *  2. O backend monta a mensagem com o CONTEXTO ESTRUTURADO abaixo (números do motor de cálculo)
 *     e chama o modelo de IA com instruções para só explicar esses números.
 *  3. O backend valida a resposta (ex.: confere se os valores citados existem no contexto)
 *     antes de devolvê-la.
 */
import { NOME_MODALIDADE, veiculoPorId } from '../data/veiculos';
import type { ContextoAssistente, ProvedorAssistente } from './tipos';

export const INSTRUCOES_SISTEMA = `Você é o assistente do protótipo Santander Mobiliza.
Explique, em português simples e para um público da Geração X, os resultados do motor de cálculo.
Regras: use SOMENTE os números do contexto JSON; não invente taxas, preços ou condições;
não prometa aprovação de crédito nem redução de juros; diga quando algo é hipótese ou dado fictício.`;

/** Contexto enxuto e serializável enviado ao modelo. */
export function montarContextoEstruturado(ctx: ContextoAssistente) {
  const { dados, derivados } = ctx;
  return {
    horizonteMeses: dados.premissas.horizonteMeses,
    kmMensal: Math.round(derivados.km.kmMensal),
    maiorDiaKm: Math.round(derivados.km.maiorDiaKm),
    recargaEmCasa: dados.rotina.recargaEmCasa,
    orcamentoMensal: dados.perfil.orcamentoMensal,
    valorDisponivel: dados.perfil.valorDisponivel,
    recomendacao: derivados.recomendacao.melhor && {
      veiculo: veiculoPorId(derivados.recomendacao.melhor.veiculoId).nome,
      modalidade: NOME_MODALIDADE[derivados.recomendacao.melhor.modalidade],
    },
    opcoes: derivados.opcoes.map((o) => ({
      veiculo: veiculoPorId(o.veiculoId).nome,
      modalidade: NOME_MODALIDADE[o.modalidade],
      custoMensalMedio: Math.round(o.custoMensalMedio),
      custoLiquido: Math.round(o.custoLiquido),
      custoPorKm: Number(o.custoPorKm.toFixed(2)),
      gastoMensal: Math.round(o.desembolsoMensal),
      valorInicial: Math.round(o.desembolsoInicial),
      cabeNoOrcamento: o.cabeNoOrcamento,
    })),
  };
}

export const CONFIG_IA = {
  /** Endpoint do backend próprio. Vazio = desativado (padrão do protótipo). */
  endpoint: '',
};

export const ProvedorModeloIA: ProvedorAssistente = {
  nome: 'Modelo de IA (via backend próprio)',
  async responder(pergunta, ctx) {
    if (!CONFIG_IA.endpoint) throw new Error('Integração com IA não configurada neste protótipo.');
    const r = await fetch(CONFIG_IA.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instrucoes: INSTRUCOES_SISTEMA, contexto: montarContextoEstruturado(ctx), pergunta }),
    });
    if (!r.ok) throw new Error(`Assistente indisponível (${r.status})`);
    const j = await r.json();
    return { texto: String(j.texto ?? ''), fontes: ['Modelo de IA com contexto do motor de cálculo'] };
  },
};
