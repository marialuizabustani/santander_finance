const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../src/alternativas.js');

const perto = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);

const leasingBase = {
  valorBem: 100000,
  entrada: 20000,
  prazoMeses: 36,
  taxa: 0.015,
  residualPct: 0.3,
  rendaMensal: 10000,
};

test('leasing: parcela com valor final (balão) zera a dívida', () => {
  const r = A.simularLeasing(leasingBase);
  // saldo após n parcelas deve ser igual ao valor final
  let saldo = r.valorArrendado;
  for (let k = 0; k < 36; k++) saldo = saldo * 1.015 - r.parcela;
  perto(saldo, 30000, 0.05);
  perto(r.valorResidual, 30000);
  perto(r.totalSeComprar, 20000 + r.parcela * 36 + 30000);
  perto(r.totalSeDevolver, 20000 + r.parcela * 36);
  perto(r.cetMensal, 0.015, 1e-6); // sem tarifas, CET = taxa
});

test('leasing: valor final maior => parcela menor', () => {
  const a = A.simularLeasing({ ...leasingBase, residualPct: 0.1 });
  const b = A.simularLeasing({ ...leasingBase, residualPct: 0.4 });
  assert.ok(b.parcela < a.parcela);
  assert.ok(b.totalJuros > a.totalJuros); // dívida maior por mais tempo
});

test('leasing: sem IOF sai mais barato que financiar com a mesma taxa', () => {
  const c = A.compararLeasingComFinanciamento({ ...leasingBase, residualPct: 0 });
  assert.ok(c.financiamento.iof > 0);
  assert.ok(c.diferenca > 0);
  perto(c.diferenca, c.financiamento.custoTotal - c.leasing.totalSeComprar);
});

test('leasing: tabela por prazos inclui o prazo escolhido', () => {
  const l = A.leasingPorPrazos({ ...leasingBase, prazoMeses: 30 });
  assert.deepEqual(l.map((x) => x.prazoMeses), [24, 30, 36, 48, 60]);
  for (let i = 1; i < l.length; i++) assert.ok(l[i].parcela < l[i - 1].parcela);
});

test('leasing: validações', () => {
  assert.throws(() => A.simularLeasing({ ...leasingBase, entrada: 80000 }), /não podem passar/);
  assert.throws(() => A.simularLeasing({ ...leasingBase, residualPct: 1 }), /Valor final/);
});

test('custos de posse: desvalorização e custos anuais', () => {
  const c = A.custosDePosse(100000, 24, {});
  perto(c.valorFinal, 81000);
  perto(c.seguro, 5000 + 4500);
  perto(c.ipva, 4000 + 3600);
  perto(c.manutencao, 4000);
  perto(c.total, c.seguro + c.ipva + c.manutencao);
  // ano incompleto: seguro proporcional, IPVA do ano inteiro
  const d = A.custosDePosse(100000, 18, {});
  perto(d.seguro, 5000 + 4500 * 0.5);
  perto(d.ipva, 4000 + 3600);
});

test('assinatura: mensalidade informada e estimada', () => {
  const base = { valorBem: 80000, prazoMeses: 24, rendaMensal: 9000 };
  const est = A.simularAssinatura(base);
  assert.equal(est.mensalidadeEstimada, true);
  perto(est.mensalidade, 2000);
  const inf = A.simularAssinatura({ ...base, mensalidade: 2500 });
  assert.equal(inf.mensalidadeEstimada, false);
  perto(inf.totalPago, 60000);
  assert.equal(inf.aprovado, true);
  assert.equal(A.simularAssinatura({ ...base, mensalidade: 2500, rendaMensal: 5000 }).aprovado, false);
});

test('assinatura: comparação com comprar financiado', () => {
  const r = A.simularAssinatura({ valorBem: 80000, prazoMeses: 36, mensalidade: 2400, rendaMensal: 9000 });
  const c = r.comparacao;
  perto(c.financiamento.parametros.entrada, 16000);
  perto(c.gastoTotalComprar, c.financiamento.custoTotal + c.posse.total);
  perto(c.custoRealComprar, c.gastoTotalComprar - c.posse.valorFinal);
  perto(c.economiaAssinando, c.custoRealComprar - 2400 * 36);
});

test('assinatura: validações', () => {
  assert.throws(() => A.simularAssinatura({ valorBem: 80000, prazoMeses: 0, rendaMensal: 5000 }), /Prazo/);
  assert.throws(() => A.simularAssinatura({ valorBem: 80000, prazoMeses: 24, rendaMensal: 0 }), /Renda/);
});
