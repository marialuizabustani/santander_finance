(function () {
  'use strict';
  const S = window.Simulador;
  const form = document.getElementById('form');
  const { $, brl, pct, numero, anos, linha } = window.Util;

  function lerFormulario() {
    const f = form.elements;
    return {
      valorBem: numero(f.valorBem.value),
      entrada: numero(f.entrada.value),
      prazoMeses: Number(f.prazoMeses.value),
      taxa: numero(f.taxa.value) / 100,
      taxaPeriodo: f.taxaPeriodo.value,
      sistema: form.querySelector('input[name=sistema]:checked').value,
      rendaMensal: numero(f.rendaMensal.value),
      rendaComplementar: numero(f.rendaComplementar.value),
      limiteComprometimento: numero(f.limiteComprometimento.value) / 100,
      entradaMinimaPct: numero(f.entradaMinimaPct.value) / 100,
      tarifaCadastro: numero(f.tarifaCadastro.value),
      registroContrato: numero(f.registroContrato.value),
      seguro: numero(f.seguro.value),
      outrasDespesas: numero(f.outrasDespesas.value),
      cobrarIOF: f.cobrarIOF.checked,
      financiarCustos: f.financiarCustos.checked,
    };
  }

  let linhasValores = [];

  function renderizar(r, outro) {
    const p = r.parametros;
    const sac = p.sistema === 'SAC';
    $('resultado').hidden = false;
    linhasValores = S.tabelaPorPrazos(p);

    // Destaque em linguagem simples
    if (sac) {
      $('d-parcela').textContent = `${p.prazoMeses} parcelas de ${brl.format(r.primeiraParcela)} a ${brl.format(r.ultimaParcela)}`;
      $('d-detalhe').textContent = `A primeira parcela é de ${brl.format(r.primeiraParcela)} e elas diminuem um pouco a cada mês, até ${brl.format(r.ultimaParcela)}.`;
    } else {
      $('d-parcela').textContent = `${p.prazoMeses}x de ${brl.format(r.primeiraParcela)}`;
      $('d-detalhe').textContent = `São ${p.prazoMeses} parcelas iguais, uma por mês (${anos(p.prazoMeses)}).`;
    }

    // Cabe no orçamento?
    const st = $('status');
    const rendaPct = pct(r.renda.comprometimento, 0);
    if (r.aprovado) {
      st.className = 'status ok';
      st.innerHTML = `<strong>✓ Cabe no seu orçamento.</strong> A parcela usa ${rendaPct} da sua renda.`;
    } else {
      st.className = 'status alerta';
      st.innerHTML =
        '<strong>Vale ajustar a simulação.</strong> ' +
        r.pendencias.join(' ') + sugestoes(r);
    }

    const extra = r.custoTotal - p.valorBem;
    $('c-preco').textContent = brl.format(p.valorBem);
    $('c-juros').textContent = brl.format(r.totalJuros);
    $('c-total').innerHTML = `${brl.format(r.custoTotal)}<small>${brl.format(extra)} a mais que à vista</small>`;

    renderizarValores(p);

    const price = sac ? outro : r;
    const sacR = sac ? r : outro;
    const comp = [
      ['Primeira parcela', (x) => brl.format(x.primeiraParcela)],
      ['Última parcela', (x) => brl.format(x.ultimaParcela)],
      ['Total de juros', (x) => brl.format(x.totalJuros)],
      ['Custo total do carro', (x) => brl.format(x.custoTotal)],
      ['Cabe no orçamento?', (x) => (x.aprovado ? '✓ Sim' : 'Acima do ideal')],
    ];
    $('comparativo').innerHTML = comp
      .map(([nome, f]) => `<tr><th>${nome}</th><td>${f(price)}</td><td>${f(sacR)}</td></tr>`)
      .join('');

    $('resumo').innerHTML = [
      linha('Preço do carro', brl.format(p.valorBem)),
      linha('Entrada', `${brl.format(p.entrada)} (${pct(r.entradaPct, 0)} do preço)`),
      linha('Quanto falta pagar do carro', brl.format(r.valorLiquido)),
      linha('Taxas do banco (cadastro, registro, seguro)', brl.format(r.tarifas)),
      linha('Imposto (IOF)', brl.format(r.iof)),
      linha('Pago na hora em taxas e imposto', brl.format(r.custosAVista)),
      linha('Valor total emprestado pelo banco', brl.format(r.valorFinanciado)),
      linha('Taxa de juros', `${pct(r.taxaMensal)} por mês (${pct(r.taxaAnual)} por ano)`),
      linha('Custo real do financiamento (CET)', `${pct(r.cetMensal)} por mês (${pct(r.cetAnual)} por ano)`),
      linha('Total de juros', brl.format(r.totalJuros)),
      linha('Soma de todas as parcelas', brl.format(r.totalParcelas)),
      linha('Custo total do carro', brl.format(r.custoTotal)),
      linha('Sua renda considerada', brl.format(r.renda.rendaTotal)),
      linha('Parte do salário usada pela parcela', pct(r.renda.comprometimento, 1)),
      linha('Maior parcela que cabe no seu salário', brl.format(r.renda.parcelaMaximaPermitida)),
      linha('Salário mínimo necessário para esta parcela', brl.format(r.renda.rendaMinimaNecessaria)),
    ].join('');

    $('tabela').innerHTML = r.tabela
      .map(
        (l) =>
          `<tr><td>${l.mes}</td><td>${brl.format(l.parcela)}</td><td>${brl.format(l.juros)}</td>` +
          `<td>${brl.format(l.amortizacao)}</td><td>${brl.format(l.saldo)}</td></tr>`
      )
      .join('');

    desenharGrafico(price, sacR, r.renda.parcelaMaximaPermitida);
  }

  /** Dicas práticas quando a simulação não fecha. */
  function sugestoes(r) {
    const p = r.parametros;
    const dicas = [];
    const prazoOk = linhasValores.find((l) => l.prazoMeses > p.prazoMeses && l.aprovado);
    if (r.renda.comprometimento > p.limiteComprometimento) {
      if (prazoOk) dicas.push(`pagar em <strong>${prazoOk.prazoMeses} meses</strong> (parcela de ${brl.format(prazoOk.primeiraParcela)})`);
      const entradaSugerida = entradaQueCabe(p);
      if (entradaSugerida !== null)
        dicas.push(`dar uma entrada de pelo menos <strong>${brl.format(entradaSugerida)}</strong>`);
      if (p.sistema === 'SAC') dicas.push('escolher <strong>parcelas iguais</strong>, que começam menores');
      dicas.push(`incluir a renda de alguém que ajude a pagar (é preciso uma renda de ${brl.format(r.renda.rendaMinimaNecessaria)})`);
    }
    if (r.entradaPct + 1e-9 < p.entradaMinimaPct) {
      dicas.push(`aumentar a entrada para pelo menos <strong>${brl.format(r.entradaMinima)}</strong>`);
    }
    return dicas.length ? '<p class="dicas-titulo">Algumas ideias:</p><ul>' + dicas.map((d) => `<li>${d}</li>`).join('') + '</ul>' : '';
  }

  /** Menor entrada (arredondada para cima em R$ 100) que faz a parcela caber na renda. */
  function entradaQueCabe(p) {
    const cabe = (entrada) => {
      try {
        const r = S.simular(Object.assign({}, p, { entrada }));
        return r.renda.comprometimento <= p.limiteComprometimento;
      } catch (e) {
        return false;
      }
    };
    let lo = p.entrada;
    let hi = p.valorBem - 1;
    if (!cabe(hi)) return null;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (cabe(mid)) hi = mid;
      else lo = mid;
    }
    const arredondado = Math.ceil(hi / 100) * 100;
    return arredondado < p.valorBem ? arredondado : null;
  }

  function renderizarValores(p) {
    const sac = p.sistema === 'SAC';
    $('valores').innerHTML = linhasValores
      .map((l) => {
        const mensal = sac
          ? `${brl.format(l.primeiraParcela)}<span class="sub">até ${brl.format(l.ultimaParcela)}</span>`
          : brl.format(l.primeiraParcela);
        const selo = l.aprovado
          ? '<span class="selo ok" title="Cabe no orçamento">✓ cabe</span>'
          : '<span class="selo acima" title="Parcela acima de 30% da renda">acima do ideal</span>';
        return (
          `<tr class="${l.prazoMeses === p.prazoMeses ? 'selecionado' : ''}">` +
          `<th>${l.prazoMeses}x ${selo}</th>` +
          `<td data-rotulo="Parcela">${mensal}</td>` +
          `<td data-rotulo="Juros">${brl.format(l.totalJuros)}</td>` +
          `<td data-rotulo="Custo total">${brl.format(l.valorTotal)}</td></tr>`
        );
      })
      .join('');
  }

  function baixarCSV() {
    const n = (v) => v.toFixed(2).replace('.', ',');
    const linhas = [['Meses', 'Primeira parcela', 'Última parcela', 'Total de juros', 'Custo total do carro', 'Parte do salário (%)', 'Cabe no salário?']];
    linhasValores.forEach((l) =>
      linhas.push([l.prazoMeses, n(l.primeiraParcela), n(l.ultimaParcela), n(l.totalJuros), n(l.valorTotal), n(l.comprometimento * 100), l.aprovado ? 'Sim' : 'Não'])
    );
    window.Util.baixarCSV('tabela-financiamento.csv', linhas);
  }
  $('baixar-csv').addEventListener('click', baixarCSV);

  function desenharGrafico(price, sac, limite) {
    const cv = $('grafico');
    const w = cv.clientWidth;
    if (!w) return; // seção fechada: desenha quando abrir
    const dpr = window.devicePixelRatio || 1;
    const h = 220;
    cv.width = w * dpr;
    cv.height = h * dpr;
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const css = getComputedStyle(document.documentElement);
    const cor = (v) => css.getPropertyValue(v).trim();
    const pad = { l: 64, r: 12, t: 12, b: 26 };
    const n = price.tabela.length;
    const max = Math.max(price.maiorParcela, sac.maiorParcela, limite) * 1.1;
    const x = (i) => pad.l + ((w - pad.l - pad.r) * (i - 1)) / Math.max(1, n - 1);
    const y = (v) => h - pad.b - ((h - pad.t - pad.b) * v) / max;

    ctx.font = '11px system-ui, sans-serif';
    ctx.lineWidth = 1;
    for (let k = 0; k <= 4; k++) {
      const v = (max * k) / 4;
      ctx.strokeStyle = cor('--grid');
      ctx.beginPath();
      ctx.moveTo(pad.l, y(v));
      ctx.lineTo(w - pad.r, y(v));
      ctx.stroke();
      ctx.fillStyle = cor('--muted');
      ctx.fillText(brl.format(Math.round(v)).replace(',00', ''), 4, y(v) + 4);
    }
    ctx.fillText('1º mês', pad.l, h - 8);
    ctx.fillText(`${n}º mês`, w - pad.r - 44, h - 8);

    // limite de renda: cinza tracejado, ao fundo
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = cor('--limite');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.l, y(limite));
    ctx.lineTo(w - pad.r, y(limite));
    ctx.stroke();
    ctx.setLineDash([]);

    const serie = (tab, c) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      tab.forEach((l, i) => (i ? ctx.lineTo(x(l.mes), y(l.parcela)) : ctx.moveTo(x(l.mes), y(l.parcela))));
      ctx.stroke();
      // pontos no início e no fim
      [tab[0], tab[tab.length - 1]].forEach((l) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(x(l.mes), y(l.parcela), 4, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    serie(sac.tabela, cor('--sac'));
    serie(price.tabela, cor('--price'));
  }

  // o gráfico fica numa seção recolhida: desenha ao abrir
  $('secao-tipos').addEventListener('toggle', () => {
    if ($('secao-tipos').open) form.requestSubmit();
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    $('erros').textContent = '';
    try {
      const dados = lerFormulario();
      const r = S.simular(dados);
      const outro = S.simular(Object.assign({}, dados, { sistema: dados.sistema === 'SAC' ? 'PRICE' : 'SAC' }));
      renderizar(r, outro);
      if (ev.submitter && window.innerWidth < 820) $('resultado').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      $('resultado').hidden = true;
      $('erros').textContent = e.message;
    }
  });

  // Recalcula ao trocar opções de escolha, sem precisar clicar em "Calcular"
  form.addEventListener('change', (ev) => {
    if (ev.target.type === 'radio' || ev.target.type === 'checkbox' || ev.target.tagName === 'SELECT') form.requestSubmit();
  });

  form.requestSubmit();
})();
