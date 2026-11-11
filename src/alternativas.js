/**
 * Alternativas ao financiamento:
 *  - Leasing (arrendamento mercantil): aluguel com opção de compra no final.
 *  - Carro por assinatura / locação: aluguel sem compra no final.
 *
 * Depende de simulador.js (window.Simulador no navegador).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./simulador.js'));
  else root.Alternativas = factory(root.Simulador);
})(typeof self !== 'undefined' ? self : this, function (S) {
  'use strict';

  /** Premissas de quanto custa manter um carro próprio (valores médios, editáveis). */
  const PREMISSAS_POSSE = {
    seguroPctAno: 0.05, // seguro: ~5% do valor do carro por ano
    ipvaPctAno: 0.04, // IPVA: varia por estado, ~4% em vários estados
    manutencaoAno: 2000, // revisões, pneus, licenciamento
    depreciacaoPctAno: 0.1, // carro perde ~10% do valor por ano
  };

  /** Estimativa de mensalidade de assinatura quando o usuário não informa. */
  const ASSINATURA_PCT_MES_ESTIMADA = 0.025;

  const num = (v) => typeof v === 'number' && Number.isFinite(v);

  function erro(lista) {
    const e = new Error(lista.join(' '));
    e.erros = lista;
    return e;
  }

  function taxaMensalDe(taxa, periodo) {
    return periodo === 'anual' ? S.anualParaMensal(taxa) : taxa;
  }

  function analiseRenda(valorMensal, renda, complementar, limite) {
    const rendaTotal = renda + (complementar || 0);
    const comprometimento = valorMensal / rendaTotal;
    return {
      rendaTotal,
      comprometimento,
      parcelaMaximaPermitida: rendaTotal * limite,
      rendaMinimaNecessaria: valorMensal / limite,
      cabe: comprometimento <= limite + 1e-9,
    };
  }

  /**
   * Quanto custa ter o carro durante N meses (seguro, IPVA, manutenção) e
   * quanto ele vale no final. Seguro e IPVA são calculados ano a ano sobre o
   * valor já desvalorizado.
   */
  function custosDePosse(valorBem, meses, premissas) {
    const p = Object.assign({}, PREMISSAS_POSSE, premissas);
    let seguro = 0;
    let ipva = 0;
    let manutencao = 0;
    for (let inicio = 0; inicio < meses; inicio += 12) {
      const mesesNoAno = Math.min(12, meses - inicio);
      const fracao = mesesNoAno / 12;
      const valorNoAno = valorBem * Math.pow(1 - p.depreciacaoPctAno, inicio / 12);
      seguro += valorNoAno * p.seguroPctAno * fracao;
      ipva += valorNoAno * p.ipvaPctAno; // IPVA é cobrado pelo ano inteiro
      manutencao += p.manutencaoAno * fracao;
    }
    const valorFinal = valorBem * Math.pow(1 - p.depreciacaoPctAno, meses / 12);
    const total = seguro + ipva + manutencao;
    return {
      premissas: p,
      seguro,
      ipva,
      manutencao,
      total,
      porMes: total / meses,
      valorFinal,
      desvalorizacao: valorBem - valorFinal,
    };
  }

  // ---------------------------------------------------------------------------
  // Leasing: aluguel com compra no final
  // ---------------------------------------------------------------------------

  const PADROES_LEASING = {
    entrada: 0,
    taxaPeriodo: 'mensal',
    residualPct: 0.2,
    tarifaCadastro: 0,
    registroContrato: 0,
    outrasDespesas: 0,
    rendaComplementar: 0,
    limiteComprometimento: 0.3,
  };

  /**
   * Leasing com valor residual pago no final (parcela "balão").
   * Leasing é isento de IOF.
   */
  function simularLeasing(entrada) {
    const p = Object.assign({}, PADROES_LEASING, entrada);
    const erros = [];
    if (!num(p.valorBem) || p.valorBem <= 0) erros.push('Preço do carro deve ser maior que zero.');
    if (!num(p.entrada) || p.entrada < 0) erros.push('Entrada não pode ser negativa.');
    if (!Number.isInteger(p.prazoMeses) || p.prazoMeses < 1 || p.prazoMeses > 120)
      erros.push('Prazo deve ser um número inteiro entre 1 e 120 meses.');
    if (!num(p.taxa) || p.taxa < 0 || p.taxa > 1) erros.push('Taxa de juros inválida.');
    if (!num(p.residualPct) || p.residualPct < 0 || p.residualPct >= 1)
      erros.push('Valor final para ficar com o carro deve estar entre 0% e 99%.');
    if (!num(p.rendaMensal) || p.rendaMensal <= 0) erros.push('Renda mensal deve ser maior que zero.');
    if (num(p.valorBem) && num(p.entrada) && num(p.residualPct) && p.entrada + p.valorBem * p.residualPct >= p.valorBem)
      erros.push('Entrada mais valor final não podem passar do preço do carro.');
    if (erros.length) throw erro(erros);

    const i = taxaMensalDe(p.taxa, p.taxaPeriodo);
    const n = p.prazoMeses;
    const tarifas = p.tarifaCadastro + p.registroContrato + p.outrasDespesas;
    const valorArrendado = p.valorBem - p.entrada + tarifas;
    const valorResidual = p.valorBem * p.residualPct;
    const vpResidual = valorResidual / Math.pow(1 + i, n);
    const parcela = i === 0 ? (valorArrendado - valorResidual) / n : ((valorArrendado - vpResidual) * i) / (1 - Math.pow(1 + i, -n));

    const totalParcelas = parcela * n;
    const totalSeComprar = p.entrada + totalParcelas + valorResidual;
    const totalSeDevolver = p.entrada + totalParcelas;
    const totalJuros = totalParcelas + valorResidual - valorArrendado;

    const fluxos = Array.from({ length: n }, (_, k) => parcela + (k === n - 1 ? valorResidual : 0));
    const cetMensal = S.taxaInterna(p.valorBem - p.entrada, fluxos);

    const renda = analiseRenda(parcela, p.rendaMensal, p.rendaComplementar, p.limiteComprometimento);

    return {
      parametros: p,
      taxaMensal: i,
      valorArrendado,
      tarifas,
      valorResidual,
      parcela,
      totalParcelas,
      totalJuros,
      totalSeComprar,
      totalSeDevolver,
      cetMensal,
      cetAnual: S.mensalParaAnual(cetMensal),
      renda,
      aprovado: renda.cabe,
    };
  }

  /**
   * Compara o leasing com financiar o mesmo carro (mesma entrada, prazo e
   * taxa, parcelas iguais, com IOF). Nos dois casos você termina dono do carro.
   */
  function compararLeasingComFinanciamento(entrada) {
    const leasing = simularLeasing(entrada);
    const p = leasing.parametros;
    const financiamento = S.simular({
      valorBem: p.valorBem,
      entrada: p.entrada,
      prazoMeses: p.prazoMeses,
      taxa: p.taxa,
      taxaPeriodo: p.taxaPeriodo,
      sistema: 'PRICE',
      rendaMensal: p.rendaMensal,
      rendaComplementar: p.rendaComplementar,
      limiteComprometimento: p.limiteComprometimento,
      entradaMinimaPct: 0,
      tarifaCadastro: p.tarifaCadastro,
      registroContrato: p.registroContrato,
      outrasDespesas: p.outrasDespesas,
      cobrarIOF: true,
      financiarCustos: true,
    });
    return { leasing, financiamento, diferenca: financiamento.custoTotal - leasing.totalSeComprar };
  }

  function leasingPorPrazos(entrada, prazos) {
    const lista = (prazos && prazos.length ? prazos : [24, 36, 48, 60]).slice();
    if (Number.isInteger(entrada.prazoMeses) && !lista.includes(entrada.prazoMeses)) lista.push(entrada.prazoMeses);
    lista.sort((a, b) => a - b);
    return lista.map((prazoMeses) => {
      const r = simularLeasing(Object.assign({}, entrada, { prazoMeses }));
      return {
        prazoMeses,
        parcela: r.parcela,
        valorResidual: r.valorResidual,
        totalJuros: r.totalJuros,
        totalSeComprar: r.totalSeComprar,
        comprometimento: r.renda.comprometimento,
        aprovado: r.aprovado,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Assinatura / locação: aluguel sem compra no final
  // ---------------------------------------------------------------------------

  const PADROES_ASSINATURA = {
    mensalidade: 0, // 0 = estimar
    rendaComplementar: 0,
    limiteComprometimento: 0.3,
    // para comparar com comprar financiado
    entradaCompraPct: 0.2,
    taxaCompra: 0.0179,
    taxaCompraPeriodo: 'mensal',
    premissas: {},
  };

  function simularAssinatura(entrada) {
    const p = Object.assign({}, PADROES_ASSINATURA, entrada);
    const erros = [];
    if (!num(p.valorBem) || p.valorBem <= 0) erros.push('Preço do carro deve ser maior que zero.');
    if (!Number.isInteger(p.prazoMeses) || p.prazoMeses < 1 || p.prazoMeses > 60)
      erros.push('Prazo deve ser um número inteiro entre 1 e 60 meses.');
    if (!num(p.mensalidade) || p.mensalidade < 0) erros.push('Mensalidade não pode ser negativa.');
    if (!num(p.rendaMensal) || p.rendaMensal <= 0) erros.push('Renda mensal deve ser maior que zero.');
    if (!num(p.entradaCompraPct) || p.entradaCompraPct < 0 || p.entradaCompraPct >= 1)
      erros.push('Entrada para comparação deve estar entre 0% e 99%.');
    if (!num(p.taxaCompra) || p.taxaCompra < 0 || p.taxaCompra > 1) erros.push('Taxa de juros para comparação inválida.');
    if (erros.length) throw erro(erros);

    const estimada = p.mensalidade === 0;
    const mensalidade = estimada ? p.valorBem * ASSINATURA_PCT_MES_ESTIMADA : p.mensalidade;
    const totalPago = mensalidade * p.prazoMeses;
    const renda = analiseRenda(mensalidade, p.rendaMensal, p.rendaComplementar, p.limiteComprometimento);

    // Comparação: comprar o mesmo carro financiado no mesmo prazo
    const financiamento = S.simular({
      valorBem: p.valorBem,
      entrada: p.valorBem * p.entradaCompraPct,
      prazoMeses: p.prazoMeses,
      taxa: p.taxaCompra,
      taxaPeriodo: p.taxaCompraPeriodo,
      sistema: 'PRICE',
      rendaMensal: p.rendaMensal,
      rendaComplementar: p.rendaComplementar,
      limiteComprometimento: p.limiteComprometimento,
      entradaMinimaPct: 0,
      cobrarIOF: true,
    });
    const posse = custosDePosse(p.valorBem, p.prazoMeses, p.premissas);
    const gastoTotalComprar = financiamento.custoTotal + posse.total;
    const custoRealComprar = gastoTotalComprar - posse.valorFinal;
    const gastoMensalComprar = financiamento.primeiraParcela + posse.porMes;

    return {
      parametros: p,
      mensalidade,
      mensalidadeEstimada: estimada,
      totalPago,
      renda,
      aprovado: renda.cabe,
      comparacao: {
        financiamento,
        posse,
        gastoTotalComprar,
        gastoMensalComprar,
        custoRealComprar,
        custoRealAssinar: totalPago,
        // > 0: assinar sai mais barato; < 0: comprar sai mais barato
        economiaAssinando: custoRealComprar - totalPago,
      },
    };
  }

  return {
    PREMISSAS_POSSE,
    ASSINATURA_PCT_MES_ESTIMADA,
    custosDePosse,
    simularLeasing,
    compararLeasingComFinanciamento,
    leasingPorPrazos,
    simularAssinatura,
  };
});
