import { NOME_MODALIDADE, NOME_TECNOLOGIA, VEICULOS, veiculoPorId } from '../data/veiculos';
import type { ResultadoOpcao } from '../engine';
import type { ContextoAssistente, ProvedorAssistente } from './tipos';

const R = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const KM = (v: number) => `${Math.round(v).toLocaleString('pt-BR')} km`;
const nomeOpcao = (o: ResultadoOpcao) => `${veiculoPorId(o.veiculoId).nome.replace(' (fictício)', '')} por ${NOME_MODALIDADE[o.modalidade].toLowerCase()}`;

/** Normaliza texto para comparar palavras-chave sem acentos. */
export function normalizar(t: string): string {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export type Intencao =
  | 'recomendacao'
  | 'economia-eletrico'
  | 'financiar-ou-assinar'
  | 'e-se-km'
  | 'autonomia'
  | 'termos'
  | 'conta'
  | 'humano'
  | 'orcamento'
  | 'ajuda';

/** Classificação por palavras-chave (determinística). */
export function identificarIntencao(pergunta: string): Intencao {
  const p = normalizar(pergunta);
  const tem = (...ps: string[]) => ps.some((x) => p.includes(x));
  if (tem('e se', 'aumentar', 'rodar mais', 'rodar menos', 'diminuir', 'quilometragem')) return 'e-se-km';
  if (tem('autonomia', 'bateria', 'recarga', 'carregador', 'estrada', 'viagem')) return 'autonomia';
  if (tem('economi', 'eletrico')) return 'economia-eletrico';
  if (tem('financiar ou', 'assinar', 'assinatura', 'financiamento')) return 'financiar-ou-assinar';
  if (tem('combina', 'melhor', 'recomend', 'ideal', 'escolher', 'qual alternativa')) return 'recomendacao';
  if (tem('orcamento', 'cabe', 'parcela')) return 'orcamento';
  if (tem('cet', 'juros', 'taxa', 'leasing', 'residual', 'deprecia', 'o que e', 'significa')) return 'termos';
  if (tem('conta', 'relacionamento', 'correntista')) return 'conta';
  if (tem('pessoa', 'atendente', 'humano', 'especialista', 'falar com')) return 'humano';
  return 'ajuda';
}

/** Extrai um número de km da pergunta ("2000 km", "2.000") ou um percentual ("30%"). */
export function extrairVariacaoKm(pergunta: string, kmAtual: number): number {
  const p = normalizar(pergunta).replace(/(\d)\.(\d{3})/g, '$1$2');
  const pct = p.match(/(\d+(?:,\d+)?)\s*%/);
  const diminuir = /diminu|menos|reduz/.test(p);
  if (pct) {
    const f = Number(pct[1].replace(',', '.')) / 100;
    return kmAtual * (diminuir ? 1 - f : 1 + f);
  }
  const n = p.match(/(\d{3,5})\s*(km)?/);
  if (n) return Number(n[1]);
  return kmAtual * (diminuir ? 0.7 : 1.3);
}

function melhorPor(opcoes: ResultadoOpcao[], filtro: (o: ResultadoOpcao) => boolean): ResultadoOpcao | undefined {
  return opcoes.filter(filtro).sort((a, b) => a.custoLiquido - b.custoLiquido)[0];
}

export const PERGUNTAS_SUGERIDAS = [
  'Qual alternativa combina mais com minha rotina?',
  'Quanto eu economizaria com um elétrico?',
  'Vale mais a pena financiar ou assinar?',
  'E se minha quilometragem aumentar 30%?',
  'A autonomia do elétrico dá para minhas viagens?',
  'O que é CET?',
];

export const ProvedorRegras: ProvedorAssistente = {
  nome: 'Regras demonstrativas (sem IA externa)',
  async responder(pergunta, ctx: ContextoAssistente) {
    const { dados, derivados } = ctx;
    const { km, opcoes, recomendacao, eletrico } = derivados;
    const H = dados.premissas.horizonteMeses;

    if (km.kmMensal === 0 && !['termos', 'conta', 'humano', 'ajuda'].includes(identificarIntencao(pergunta))) {
      return {
        texto: 'Ainda não sei como é a sua rotina. Cadastre seus trajetos em "Minha Rotina" ou carregue o cenário demonstrativo, e eu explico os resultados com base neles.',
        acoes: [{ rotulo: 'Ir para Minha Rotina', pagina: 'rotina' }],
      };
    }

    switch (identificarIntencao(pergunta)) {
      case 'recomendacao': {
        const m = recomendacao.melhor;
        if (!m) return { texto: 'Selecione pelo menos um veículo no comparador para eu poder recomendar.' };
        const alt = recomendacao.alternativas[0];
        return {
          texto:
            `Com a sua rotina de ${KM(km.kmMensal)} por mês, a opção que mais combina é **${nomeOpcao(m)}**. ` +
            `${recomendacao.motivo} ` +
            `Ela custa em média ${R(m.custoMensalMedio)} por mês ao longo de ${H} meses (${R(m.custoPorKm)} por km), com um gasto mensal de ${R(m.desembolsoMensal)} e ${m.desembolsoInicial ? `${R(m.desembolsoInicial)} no início` : 'sem entrada'}.` +
            (alt ? ` A segunda melhor é ${nomeOpcao(alt)}, com custo médio de ${R(alt.custoMensalMedio)} por mês.` : ''),
          fontes: ['Comparador: custo líquido no período', 'Minha Rotina: quilometragem mensal', 'Perfil: orçamento e valor disponível'],
          acoes: [{ rotulo: 'Ver a comparação completa', pagina: 'comparador' }],
        };
      }
      case 'economia-eletrico': {
        const ev = melhorPor(opcoes, (o) => o.tecnologia === 'eletrico');
        const comb = melhorPor(opcoes, (o) => o.tecnologia === 'combustao' && (!ev || o.modalidade === ev.modalidade)) ?? melhorPor(opcoes, (o) => o.tecnologia === 'combustao');
        const an = eletrico[dados.veiculoEletricoId];
        if (!ev || !comb) return { texto: 'Para comparar, inclua pelo menos um elétrico e um carro a combustão no comparador.', acoes: [{ rotulo: 'Abrir comparador', pagina: 'comparador' }] };
        const dif = comb.custoLiquido - ev.custoLiquido;
        return {
          texto:
            `Só no "abastecimento", o elétrico gasta cerca de ${R(an.custoRecargaMes)} por mês com recarga, contra ${R(an.custoCombustivelMes)} de gasolina: ` +
            `uma economia de **${R(an.economiaMes)} por mês** (${R(an.economiaMes * H)} em ${H} meses)` +
            (dados.rotina.recargaEmCasa ? ', considerando que você carrega quase sempre em casa.' : '. Como você não tem recarga em casa, a economia é menor, porque o carregador público é mais caro.') +
            ` Mas o carro elétrico costuma custar mais e perder valor mais rápido. Somando tudo (compra, seguro, IPVA, manutenção e valor no final), ` +
            (dif >= 0
              ? `${nomeOpcao(ev)} sai ${R(dif)} mais barato que ${nomeOpcao(comb)} no período.`
              : `${nomeOpcao(ev)} sai ${R(-dif)} mais caro que ${nomeOpcao(comb)} no período.`),
          fontes: ['Mobilidade Elétrica: custo de recarga e de combustível', 'Comparador: custo líquido no período'],
          acoes: [{ rotulo: 'Ver Mobilidade Elétrica', pagina: 'eletrico' }],
        };
      }
      case 'financiar-ou-assinar': {
        const tec = veiculoPorId(dados.escolha.veiculoId).tecnologia;
        const doVeiculo = (m: string) => opcoes.find((o) => o.veiculoId === dados.escolha.veiculoId && o.modalidade === m);
        const fin = doVeiculo('financiamento');
        const ass = doVeiculo('assinatura');
        if (!fin || !ass) return { texto: 'Inclua o veículo escolhido no comparador para eu comparar financiamento e assinatura.' };
        const melhor = fin.custoLiquido <= ass.custoLiquido ? 'financiar' : 'assinar';
        return {
          texto:
            `Para o ${veiculoPorId(dados.escolha.veiculoId).nome.replace(' (fictício)', '')} (${NOME_TECNOLOGIA[tec].toLowerCase()}), em ${H} meses:\n` +
            `• **Financiar**: entrada de ${R(fin.desembolsoInicial)} e cerca de ${R(fin.desembolsoMensal)} por mês (parcela + uso). No fim, o carro é seu (vale cerca de ${R(fin.patrimonioFinal)} já descontando o que falta pagar). Custo líquido: ${R(fin.custoLiquido)}.\n` +
            `• **Assinar**: sem entrada e cerca de ${R(ass.desembolsoMensal)} por mês, já com seguro, IPVA e manutenção. No fim, você devolve o carro. Custo líquido: ${R(ass.custoLiquido)}.\n` +
            `Pelos números, **${melhor}** sai mais barato no período. ` +
            (fin.cabeNoOrcamento === false && ass.cabeNoOrcamento ? 'Além disso, só a assinatura cabe no seu orçamento mensal. ' : '') +
            (ass.cabeNoOrcamento === false && fin.cabeNoOrcamento ? 'Além disso, só o financiamento cabe no seu orçamento mensal. ' : '') +
            'Assinar costuma valer mais para quem quer previsibilidade e trocar de carro em poucos anos; financiar, para quem quer ficar com o carro.',
          fontes: ['Comparador: financiamento e assinatura do veículo escolhido'],
          acoes: [{ rotulo: 'Simular em detalhes', pagina: 'simulacao' }],
        };
      }
      case 'e-se-km': {
        const novoKm = extrairVariacaoKm(pergunta, km.kmMensal);
        const extra = novoKm - km.kmMensal;
        const d2 = { ...dados, rotina: { ...dados.rotina, kmExtrasMes: Math.max(0, dados.rotina.kmExtrasMes + extra) } };
        const novo = ctx.recalcular(d2);
        const m1 = recomendacao.melhor;
        const m2 = novo.recomendacao.melhor;
        const mudou = m1 && m2 && (m1.veiculoId !== m2.veiculoId || m1.modalidade !== m2.modalidade);
        const ev1 = melhorPor(opcoes, (o) => o.tecnologia === 'eletrico');
        const ev2 = melhorPor(novo.opcoes, (o) => o.tecnologia === 'eletrico');
        const c1 = melhorPor(opcoes, (o) => o.tecnologia === 'combustao');
        const c2 = melhorPor(novo.opcoes, (o) => o.tecnologia === 'combustao');
        return {
          texto:
            `Se você passar de ${KM(km.kmMensal)} para **${KM(novo.km.kmMensal)} por mês**:\n` +
            (c1 && c2 ? `• A melhor opção a combustão passa de ${R(c1.custoMensalMedio)} para ${R(c2.custoMensalMedio)} por mês em média.\n` : '') +
            (ev1 && ev2 ? `• A melhor opção elétrica passa de ${R(ev1.custoMensalMedio)} para ${R(ev2.custoMensalMedio)} por mês em média.\n` : '') +
            (mudou && m2 ? `• A recomendação muda para **${nomeOpcao(m2)}**.` : m2 ? `• A recomendação continua sendo ${nomeOpcao(m2)}.` : '') +
            ' Quanto mais você roda, mais pesa o custo por km, e mais o elétrico tende a compensar.',
          fontes: ['Recalculado pelo motor com a nova quilometragem (seus dados não foram alterados)'],
          acoes: [{ rotulo: 'Ajustar minha rotina', pagina: 'rotina' }],
        };
      }
      case 'autonomia': {
        const ev = VEICULOS.find((v) => v.id === dados.veiculoEletricoId)!;
        const an = eletrico[ev.id];
        const viagens = an.viagens.map((v) => `"${v.viagem.nome}": ${v.trechoCabe ? (v.paradasNaIda ? `${v.paradasNaIda} parada(s) para recarga na ida` : 'dá para ir sem parar') : `trecho de ${v.viagem.maiorTrechoKm} km maior que a autonomia segura, planeje carregadores`}`);
        return {
          texto:
            `O ${ev.nome.replace(' (fictício)', '')} tem autonomia estimada de ${KM(an.autonomiaEstimadaKm)}; para planejar com folga, considere ${KM(an.autonomiaPlanejadaKm)}. ` +
            `Seu dia mais longo tem ${KM(km.maiorDiaKm)}, então você recarregaria cerca de ${an.recargasPorSemana.toFixed(1).replace('.', ',')} vez(es) por semana. ` +
            (viagens.length ? `Nas viagens: ${viagens.join('; ')}. ` : '') +
            'Em estrada a autonomia cai, porque a velocidade é maior. É uma preocupação comum, e por isso mostramos os carregadores no mapa da Mobilidade Elétrica.',
          fontes: ['Mobilidade Elétrica: autonomia e compatibilidade com a rotina'],
          acoes: [{ rotulo: 'Ver mapa de carregadores', pagina: 'eletrico' }],
        };
      }
      case 'orcamento': {
        const cabem = opcoes.filter((o) => o.cabeNoOrcamento && o.cabeNoDisponivel);
        return {
          texto:
            `Seu orçamento é de ${R(dados.perfil.orcamentoMensal)} por mês, com ${R(dados.perfil.valorDisponivel)} disponíveis para entrada. ` +
            (cabem.length
              ? `${cabem.length} opção(ões) cabem: ${cabem.slice(0, 4).map((o) => `${nomeOpcao(o)} (${R(o.desembolsoMensal)}/mês)`).join(', ')}.`
              : 'Nenhuma opção cabe totalmente. Experimente aumentar o prazo, a entrada ou escolher um carro mais barato.'),
          fontes: ['Comparador: gasto mensal e valor inicial de cada opção'],
        };
      }
      case 'termos':
        return {
          texto:
            '• **Juros**: o "aluguel" do dinheiro emprestado.\n' +
            '• **CET (Custo Efetivo Total)**: a taxa que soma juros, tarifas e impostos; é a melhor forma de comparar propostas.\n' +
            '• **Leasing**: você paga parcelas como num aluguel e, no fim, pode pagar um valor final e ficar com o carro.\n' +
            '• **Valor residual**: quanto o carro ainda vale no fim do período.\n' +
            '• **Depreciação**: quanto o carro perde de valor com o tempo.\n' +
            'Neste protótipo, as taxas são hipóteses editáveis e não condições reais.',
          acoes: [{ rotulo: 'Ver e editar premissas', pagina: 'premissas' }],
        };
      case 'conta':
        return {
          texto:
            'Ter conta e histórico no banco pode ajudar na análise de crédito, mas condições como taxa e aprovação dependem sempre de análise individual. Este protótipo não abre contas nem promete redução de juros.',
          acoes: [{ rotulo: 'Ver Minha Conta (demonstrativo)', pagina: 'conta' }],
        };
      case 'humano':
        return {
          texto:
            'Posso resolver a maioria das dúvidas na hora com os seus próprios números. Se preferir uma pessoa, em uma versão real você seria encaminhado a um especialista já com o resumo da simulação, sem precisar repetir nada. Neste protótipo, use "Exportar resumo" em Próximos passos.',
          acoes: [{ rotulo: 'Ir para Próximos passos', pagina: 'proximos-passos' }],
        };
      default:
        return {
          texto: 'Posso explicar os resultados da sua simulação. Experimente perguntar: qual opção combina com a minha rotina, quanto eu economizaria com um elétrico, se vale financiar ou assinar, ou o que acontece se você rodar mais.',
        };
    }
  },
};
