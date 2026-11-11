/** Funções de formatação compartilhadas pelas abas. */
(function (root) {
  'use strict';
  const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  root.Util = {
    $: (id) => document.getElementById(id),

    brl: brlFmt,

    pct: (v, d = 2) =>
      (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%',

    /** "80.000,50" -> 80000.5 ; "1,79" -> 1.79 */
    numero(texto) {
      const s = String(texto || '').trim().replace(/[R$\s%]/g, '');
      if (!s) return 0;
      const normalizado = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
      return Number(normalizado);
    },

    /** 30 -> "2 anos e 6 meses" */
    anos(meses) {
      const a = Math.floor(meses / 12);
      const m = meses % 12;
      const partes = [];
      if (a) partes.push(`${a} ${a === 1 ? 'ano' : 'anos'}`);
      if (m) partes.push(`${m} ${m === 1 ? 'mês' : 'meses'}`);
      return partes.join(' e ');
    },

    linha: (dt, dd) => `<dt>${dt}</dt><dd>${dd}</dd>`,

    /** Baixa linhas como CSV (separador ";", abre direto no Excel). */
    baixarCSV(nomeArquivo, linhas) {
      const csv = '﻿' + linhas.map((r) => r.join(';')).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = nomeArquivo;
      a.click();
      URL.revokeObjectURL(a.href);
    },
  };
})(window);
