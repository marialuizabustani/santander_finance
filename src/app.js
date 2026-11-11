(function () {
  'use strict';
  const S = window.Simulador;
  const form = document.getElementById('form');
  const $ = (id) => document.getElementById(id);

  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const pct = (v, d = 2) => (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';

  /** "80.000,50" -> 80000.5 ; "1,79" -> 1.79 */
  function numero(texto) {
    const s = String(texto || '').trim().replace(/[R$\s%]/g, '');
    if (!s) return 0;
    const normalizado = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
    return Number(normalizado);
  }

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

  function linha(dt, dd) {
    return `<dt>${dt}</dt><dd>${dd}</dd>`;
  }

  function renderizar(r, outro) {
    const p = r.parametros;
    $('resultado').hidden = false;

    const st = $('status');
    st.className = 'status ' + (r.aprovado ? 'ok' : 'alerta');
    st.innerHTML = r.aprovado
      ? '<strong>Dentro dos critérios.</strong> A parcela cabe na renda e a entrada atende ao mínimo.'
      : '<strong>Atenção:</strong><ul>' + r.pendencias.map((x) => `<li>${x}</li>`).join('') + '</ul>';

    $('r-primeira').textContent = brl.format(r.primeiraParcela);
    $('r-ultima').textContent = brl.format(r.ultimaParcela);
    $('r-financiado').textContent = brl.format(r.valorFinanciado);
    $('r-cet').textContent = `${pct(r.cetMensal)} a.m. · ${pct(r.cetAnual)} a.a.`;

    $('resumo').innerHTML = [
      linha('Sistema de amortização', p.sistema === 'SAC' ? 'SAC' : 'Price'),
      linha('Taxa de juros', `${pct(r.taxaMensal)} a.m. · ${pct(r.taxaAnual)} a.a.`),
      linha('Entrada', `${brl.format(p.entrada)} (${pct(r.entradaPct, 1)})`),
      linha('Crédito para o bem', brl.format(r.valorLiquido)),
      linha('Tarifas e seguros', brl.format(r.tarifas)),
      linha('IOF', brl.format(r.iof)),
      linha('Custos pagos à vista', brl.format(r.custosAVista)),
      linha('Total de juros', brl.format(r.totalJuros)),
      linha('Total das parcelas', brl.format(r.totalParcelas)),
      linha('Custo total (entrada + parcelas + custos)', brl.format(r.custoTotal)),
      linha('Renda considerada', brl.format(r.renda.rendaTotal)),
      linha('Comprometimento da renda (maior parcela)', pct(r.renda.comprometimento, 1)),
      linha('Parcela máxima permitida', brl.format(r.renda.parcelaMaximaPermitida)),
      linha('Renda mínima necessária', brl.format(r.renda.rendaMinimaNecessaria)),
      linha('Valor máximo financiável pela renda', brl.format(r.renda.valorMaximoFinanciavel)),
    ].join('');

    const price = p.sistema === 'PRICE' ? r : outro;
    const sac = p.sistema === 'SAC' ? r : outro;
    const comp = [
      ['1ª parcela', (x) => brl.format(x.primeiraParcela)],
      ['Última parcela', (x) => brl.format(x.ultimaParcela)],
      ['Total de juros', (x) => brl.format(x.totalJuros)],
      ['Total pago', (x) => brl.format(x.totalParcelas)],
      ['CET a.a.', (x) => pct(x.cetAnual)],
      ['Comprometimento', (x) => pct(x.renda.comprometimento, 1)],
      ['Situação', (x) => (x.aprovado ? 'OK' : 'Pendente')],
    ];
    $('comparativo').innerHTML = comp
      .map(([nome, f]) => `<tr><th>${nome}</th><td>${f(price)}</td><td>${f(sac)}</td></tr>`)
      .join('');

    $('tabela').innerHTML = r.tabela
      .map(
        (l) =>
          `<tr><td>${l.mes}</td><td>${brl.format(l.parcela)}</td><td>${brl.format(l.juros)}</td>` +
          `<td>${brl.format(l.amortizacao)}</td><td>${brl.format(l.saldo)}</td></tr>`
      )
      .join('');

    desenharGrafico(price, sac, r.renda.parcelaMaximaPermitida);
  }

  function desenharGrafico(price, sac, limite) {
    const cv = $('grafico');
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth;
    const h = 220;
    cv.width = w * dpr;
    cv.height = h * dpr;
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const css = getComputedStyle(document.documentElement);
    const cor = (v) => css.getPropertyValue(v).trim();
    const pad = { l: 70, r: 12, t: 12, b: 28 };
    const n = price.tabela.length;
    const max = Math.max(price.maiorParcela, sac.maiorParcela, limite) * 1.08;
    const x = (i) => pad.l + ((w - pad.l - pad.r) * (i - 1)) / Math.max(1, n - 1);
    const y = (v) => h - pad.b - ((h - pad.t - pad.b) * v) / max;

    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = cor('--muted');
    ctx.strokeStyle = cor('--grid');
    ctx.lineWidth = 1;
    for (let k = 0; k <= 4; k++) {
      const v = (max * k) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.l, y(v));
      ctx.lineTo(w - pad.r, y(v));
      ctx.stroke();
      ctx.fillText(brl.format(v).replace(',00', ''), 4, y(v) + 4);
    }
    ctx.fillText('mês 1', pad.l, h - 8);
    ctx.fillText(`mês ${n}`, w - pad.r - 40, h - 8);

    const serie = (tab, c) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.beginPath();
      tab.forEach((l, i) => (i ? ctx.lineTo(x(l.mes), y(l.parcela)) : ctx.moveTo(x(l.mes), y(l.parcela))));
      ctx.stroke();
    };
    serie(price.tabela, cor('--price'));
    serie(sac.tabela, cor('--sac'));

    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = cor('--limite');
    ctx.beginPath();
    ctx.moveTo(pad.l, y(limite));
    ctx.lineTo(w - pad.r, y(limite));
    ctx.stroke();
    ctx.setLineDash([]);

    const legenda = [
      ['Price', cor('--price')],
      ['SAC', cor('--sac')],
      ['Limite de renda', cor('--limite')],
    ];
    let lx = pad.l + 8;
    legenda.forEach(([t, c]) => {
      ctx.fillStyle = c;
      ctx.fillRect(lx, pad.t + 2, 10, 10);
      ctx.fillStyle = cor('--text');
      ctx.fillText(t, lx + 14, pad.t + 11);
      lx += ctx.measureText(t).width + 30;
    });
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    $('erros').textContent = '';
    try {
      const dados = lerFormulario();
      const r = S.simular(dados);
      const outro = S.simular(Object.assign({}, dados, { sistema: dados.sistema === 'SAC' ? 'PRICE' : 'SAC' }));
      renderizar(r, outro);
    } catch (e) {
      $('resultado').hidden = true;
      $('erros').textContent = e.message;
    }
  });

  form.requestSubmit();
})();
