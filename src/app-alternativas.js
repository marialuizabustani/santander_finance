/** Abas "Alugar e comprar no final" (leasing) e "Alugar sem comprar" (assinatura). */
(function () {
  'use strict';
  const A = window.Alternativas;
  const { $, brl, pct, numero, anos, linha } = window.Util;

  const selo = (ok) =>
    ok
      ? '<span class="selo ok" title="Cabe no orçamento">✓ cabe</span>'
      : '<span class="selo acima" title="Acima de 30% da renda">acima do ideal</span>';

  function statusRenda(el, renda, limite, nome) {
    if (renda.cabe) {
      el.className = 'status ok';
      el.innerHTML = `<strong>✓ Cabe no seu orçamento.</strong> A ${nome} usa ${pct(renda.comprometimento, 0)} da sua renda.`;
    } else {
      el.className = 'status alerta';
      el.innerHTML =
        `<strong>Vale ajustar a simulação.</strong> A ${nome} usa ${pct(renda.comprometimento, 0)} da sua renda, ` +
        `e o ideal é até ${pct(limite, 0)}. Experimente um prazo maior ou uma entrada maior. ` +
        `Para esta ${nome}, a renda ideal seria de ${brl.format(renda.rendaMinimaNecessaria)}.`;
    }
  }

  function ligar(form, calcular, erros, resultado) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      erros.textContent = '';
      try {
        calcular();
        resultado.hidden = false;
        if (ev.submitter && window.innerWidth < 820) resultado.scrollIntoView({ behavior: 'smooth' });
      } catch (e) {
        resultado.hidden = true;
        erros.textContent = e.message;
      }
    });
    form.addEventListener('change', (ev) => {
      if (ev.target.tagName === 'SELECT' || ev.target.type === 'checkbox') form.requestSubmit();
    });
  }

  // ---------------------------------------------------------------------------
  // Leasing
  // ---------------------------------------------------------------------------
  const fl = $('form-leasing');
  let linhasLeasing = [];

  function lerLeasing() {
    const f = fl.elements;
    return {
      valorBem: numero(f.valorBem.value),
      entrada: numero(f.entrada.value),
      prazoMeses: Number(f.prazoMeses.value),
      taxa: numero(f.taxa.value) / 100,
      taxaPeriodo: f.taxaPeriodo.value,
      residualPct: numero(f.residualPct.value) / 100,
      rendaMensal: numero(f.rendaMensal.value),
      rendaComplementar: numero(f.rendaComplementar.value),
      limiteComprometimento: numero(f.limiteComprometimento.value) / 100,
      tarifaCadastro: numero(f.tarifaCadastro.value),
      registroContrato: numero(f.registroContrato.value),
      outrasDespesas: numero(f.outrasDespesas.value),
    };
  }

  function calcularLeasing() {
    const dados = lerLeasing();
    const { leasing: r, financiamento: fin, diferenca } = A.compararLeasingComFinanciamento(dados);
    const p = r.parametros;

    $('l-parcela').textContent = `${p.prazoMeses}x de ${brl.format(r.parcela)}`;
    $('l-detalhe').textContent = `Parcelas iguais durante ${anos(p.prazoMeses)}` + (p.entrada ? `, além da entrada de ${brl.format(p.entrada)}.` : '.');
    statusRenda($('l-status'), r.renda, p.limiteComprometimento, 'parcela');

    $('l-residual').textContent = brl.format(r.valorResidual);
    $('l-total-comprar').textContent = brl.format(r.totalSeComprar);
    $('l-juros').textContent = `Se ficar com o carro, ${brl.format(r.totalJuros)} do total são juros e taxas.`;
    $('l-total-devolver').textContent = brl.format(r.totalSeDevolver);

    const comp = [
      ['Entrada', brl.format(p.entrada), brl.format(fin.parametros.entrada)],
      ['Parcela por mês', brl.format(r.parcela), brl.format(fin.primeiraParcela)],
      ['Pago no final', brl.format(r.valorResidual), brl.format(0)],
      ['Imposto IOF', 'Não tem', brl.format(fin.iof)],
      ['Custo total do carro', brl.format(r.totalSeComprar), brl.format(fin.custoTotal)],
      ['Carro fica no seu nome', 'Só no final', 'Desde o início'],
    ];
    $('l-comparativo').innerHTML = comp.map(([n, a, b]) => `<tr><th>${n}</th><td>${a}</td><td>${b}</td></tr>`).join('');

    $('l-resumo-comparacao').textContent =
      Math.abs(diferenca) < 1 ? 'Custam praticamente o mesmo'
        : diferenca > 0 ? `Este sai ${brl.format(diferenca)} mais barato`
        : `Financiar sai ${brl.format(-diferenca)} mais barato`;
    const conc = $('l-conclusao');
    if (Math.abs(diferenca) < 1) {
      conc.textContent = 'Os dois custam praticamente o mesmo no total.';
    } else if (diferenca > 0) {
      conc.innerHTML = `Alugar e comprar no final sai <strong>${brl.format(diferenca)} mais barato</strong> no total, principalmente porque não tem IOF.` +
        (r.valorResidual > 0 ? ` Mas lembre: você precisa ter <strong>${brl.format(r.valorResidual)}</strong> no final para ficar com o carro.` : '');
    } else {
      conc.innerHTML = `Financiar sai <strong>${brl.format(-diferenca)} mais barato</strong> no total. Deixar um valor alto para o final aumenta os juros do leasing.`;
    }

    linhasLeasing = A.leasingPorPrazos(dados);
    $('l-valores').innerHTML = linhasLeasing
      .map(
        (l) =>
          `<tr class="${l.prazoMeses === p.prazoMeses ? 'selecionado' : ''}">` +
          `<th>${l.prazoMeses}x ${selo(l.aprovado)}</th>` +
          `<td data-rotulo="Parcela">${brl.format(l.parcela)}</td>` +
          `<td data-rotulo="Valor final">${brl.format(l.valorResidual)}</td>` +
          `<td data-rotulo="Custo total">${brl.format(l.totalSeComprar)}</td></tr>`
      )
      .join('');

    $('l-resumo').innerHTML = [
      linha('Preço do carro', brl.format(p.valorBem)),
      linha('Entrada', brl.format(p.entrada)),
      linha('Taxas do banco', brl.format(r.tarifas)),
      linha('Valor alugado pelo banco', brl.format(r.valorArrendado)),
      linha('Valor final para ficar com o carro', `${brl.format(r.valorResidual)} (${pct(p.residualPct, 0)} do preço)`),
      linha('Taxa de juros', `${pct(r.taxaMensal)} por mês (${pct((1 + r.taxaMensal) ** 12 - 1)} por ano)`),
      linha('Custo real (CET)', `${pct(r.cetMensal)} por mês (${pct(r.cetAnual)} por ano)`),
      linha('Soma das parcelas', brl.format(r.totalParcelas)),
      linha('Juros e taxas no total', brl.format(r.totalJuros)),
      linha('Maior parcela que cabe no seu salário', brl.format(r.renda.parcelaMaximaPermitida)),
    ].join('');
  }

  $('l-baixar-csv').addEventListener('click', () => {
    const n = (v) => v.toFixed(2).replace('.', ',');
    const linhas = [['Meses', 'Parcela por mês', 'Valor final', 'Juros e taxas', 'Total se ficar com o carro', 'Parte do salário (%)', 'Cabe no salário?']];
    linhasLeasing.forEach((l) =>
      linhas.push([l.prazoMeses, n(l.parcela), n(l.valorResidual), n(l.totalJuros), n(l.totalSeComprar), n(l.comprometimento * 100), l.aprovado ? 'Sim' : 'Não'])
    );
    window.Util.baixarCSV('tabela-leasing.csv', linhas);
  });

  ligar(fl, calcularLeasing, $('l-erros'), $('l-resultado'));

  // ---------------------------------------------------------------------------
  // Assinatura
  // ---------------------------------------------------------------------------
  const fa = $('form-assinatura');

  function lerAssinatura() {
    const f = fa.elements;
    return {
      valorBem: numero(f.valorBem.value),
      mensalidade: numero(f.mensalidade.value),
      prazoMeses: Number(f.prazoMeses.value),
      rendaMensal: numero(f.rendaMensal.value),
      rendaComplementar: numero(f.rendaComplementar.value),
      limiteComprometimento: numero(f.limiteComprometimento.value) / 100,
      entradaCompraPct: numero(f.entradaCompraPct.value) / 100,
      taxaCompra: numero(f.taxaCompra.value) / 100,
      premissas: {
        seguroPctAno: numero(f.seguroPctAno.value) / 100,
        ipvaPctAno: numero(f.ipvaPctAno.value) / 100,
        manutencaoAno: numero(f.manutencaoAno.value),
        depreciacaoPctAno: numero(f.depreciacaoPctAno.value) / 100,
      },
    };
  }

  function calcularAssinatura() {
    const r = A.simularAssinatura(lerAssinatura());
    const p = r.parametros;
    const c = r.comparacao;
    const fin = c.financiamento;

    $('a-mensalidade').textContent = `${p.prazoMeses}x de ${brl.format(r.mensalidade)}`;
    $('a-detalhe').textContent = r.mensalidadeEstimada
      ? `Valor estimado. Se tiver uma proposta, coloque a mensalidade dela.`
      : `Valor fixo por ${anos(p.prazoMeses)}, sem entrada.`;
    statusRenda($('a-status'), r.renda, p.limiteComprometimento, 'mensalidade');
    $('a-total').textContent = brl.format(r.totalPago);

    $('a-nota-comparacao').textContent =
      `Comprando o mesmo carro com ${pct(p.entradaCompraPct, 0)} de entrada, financiado em ${p.prazoMeses} meses, ` +
      'e pagando você mesmo seguro, IPVA e revisões.';

    const comp = [
      ['Entrada', brl.format(0), brl.format(fin.parametros.entrada)],
      ['Gasto por mês', brl.format(r.mensalidade), `${brl.format(c.gastoMensalComprar)}<span class="sub">parcela ${brl.format(fin.primeiraParcela)} + ${brl.format(c.posse.porMes)} de seguro, IPVA e revisões</span>`],
      ['Gasto total no período', brl.format(r.totalPago), brl.format(c.gastoTotalComprar)],
      ['No final você tem', 'Nada (devolve o carro)', `Um carro que vale cerca de ${brl.format(c.posse.valorFinal)}`],
      ['Custo real (gasto − valor do carro)', `<strong>${brl.format(c.custoRealAssinar)}</strong>`, `<strong>${brl.format(c.custoRealComprar)}</strong>`],
    ];
    $('a-comparativo').innerHTML = comp.map(([n, a, b]) => `<tr><th>${n}</th><td>${a}</td><td>${b}</td></tr>`).join('');

    const conc = $('a-conclusao');
    const e = c.economiaAssinando;
    if (Math.abs(e) < 100) {
      conc.textContent = 'Na prática, assinar e comprar custam quase o mesmo. Escolha pelo que for mais cômodo para você.';
    } else if (e > 0) {
      conc.innerHTML = `Em ${anos(p.prazoMeses)}, <strong>assinar sai cerca de ${brl.format(e)} mais barato</strong> do que comprar financiado, já considerando quanto o carro valeria no final.`;
    } else {
      conc.innerHTML = `Em ${anos(p.prazoMeses)}, <strong>comprar financiado sai cerca de ${brl.format(-e)} mais barato</strong>, porque no final o carro é seu. ` +
        'Já assinar não pede entrada e não tem gastos surpresa.';
    }

    $('a-resumo').innerHTML = [
      linha('Mensalidade da assinatura', brl.format(r.mensalidade) + (r.mensalidadeEstimada ? ' (estimada)' : '')),
      linha('Total pago na assinatura', brl.format(r.totalPago)),
      linha('Maior mensalidade que cabe no seu salário', brl.format(r.renda.parcelaMaximaPermitida)),
      linha('<strong>Se comprasse financiado:</strong>', ''),
      linha('Entrada', brl.format(fin.parametros.entrada)),
      linha('Parcela do financiamento', brl.format(fin.primeiraParcela)),
      linha('Total pago ao banco (entrada + parcelas)', brl.format(fin.custoTotal)),
      linha('Seguro no período', brl.format(c.posse.seguro)),
      linha('IPVA no período', brl.format(c.posse.ipva)),
      linha('Revisões, pneus e documentos', brl.format(c.posse.manutencao)),
      linha('Gasto total', brl.format(c.gastoTotalComprar)),
      linha('Valor do carro no final', brl.format(c.posse.valorFinal)),
      linha('Quanto o carro perdeu de valor', brl.format(c.posse.desvalorizacao)),
      linha('Custo real de comprar', brl.format(c.custoRealComprar)),
    ].join('');
  }

  ligar(fa, calcularAssinatura, $('a-erros'), $('a-resultado'));

  fl.requestSubmit();
  fa.requestSubmit();
})();
