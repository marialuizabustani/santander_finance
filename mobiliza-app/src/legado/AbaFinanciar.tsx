import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { pct, reais } from '../components/formato';
import { Aviso, CampoNumero, Interruptor } from '../components/ui';
import Simulador from './simulador.js';
import { anos, baixarCSV, BotaoCSV, n2, Secao, SeloCabe } from './comum';

export interface FormFinanciar {
  valorBem: number;
  entrada: number;
  prazoMeses: number;
  taxaPct: number;
  taxaPeriodo: 'mensal' | 'anual';
  sistema: 'PRICE' | 'SAC';
  rendaMensal: number;
  rendaComplementar: number;
  limitePct: number;
  entradaMinimaPct: number;
  tarifaCadastro: number;
  registroContrato: number;
  seguro: number;
  outrasDespesas: number;
  cobrarIOF: boolean;
  financiarCustos: boolean;
}

export const FINANCIAR_PADRAO: FormFinanciar = {
  valorBem: 80000,
  entrada: 20000,
  prazoMeses: 48,
  taxaPct: 1.79,
  taxaPeriodo: 'mensal',
  sistema: 'PRICE',
  rendaMensal: 7000,
  rendaComplementar: 0,
  limitePct: 30,
  entradaMinimaPct: 20,
  tarifaCadastro: 850,
  registroContrato: 250,
  seguro: 0,
  outrasDespesas: 0,
  cobrarIOF: true,
  financiarCustos: true,
};

const paraMotor = (f: FormFinanciar) => ({
  valorBem: f.valorBem,
  entrada: f.entrada,
  prazoMeses: Math.round(f.prazoMeses),
  taxa: f.taxaPct / 100,
  taxaPeriodo: f.taxaPeriodo,
  sistema: f.sistema,
  rendaMensal: f.rendaMensal,
  rendaComplementar: f.rendaComplementar,
  limiteComprometimento: f.limitePct / 100,
  entradaMinimaPct: f.entradaMinimaPct / 100,
  tarifaCadastro: f.tarifaCadastro,
  registroContrato: f.registroContrato,
  seguro: f.seguro,
  outrasDespesas: f.outrasDespesas,
  cobrarIOF: f.cobrarIOF,
  financiarCustos: f.financiarCustos,
});

/** Menor entrada (arredondada em R$ 100) que faz a parcela caber na renda (busca binária no motor). */
function entradaQueCabe(base: ReturnType<typeof paraMotor>): number | null {
  const cabe = (entrada: number) => {
    try {
      const r = Simulador.simular({ ...base, entrada });
      return r.renda.comprometimento <= base.limiteComprometimento;
    } catch {
      return false;
    }
  };
  let lo = base.entrada;
  let hi = base.valorBem - 1;
  if (!cabe(hi)) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (cabe(mid)) hi = mid;
    else lo = mid;
  }
  const v = Math.ceil(hi / 100) * 100;
  return v < base.valorBem ? v : null;
}

export function AbaFinanciar({ f, set }: { f: FormFinanciar; set: (f: FormFinanciar) => void }) {
  const mudar = <K extends keyof FormFinanciar>(k: K, v: FormFinanciar[K]) => set({ ...f, [k]: v });
  const calc = useMemo(() => {
    try {
      const entrada = paraMotor(f);
      const r = Simulador.simular(entrada);
      const outro = Simulador.simular({ ...entrada, sistema: f.sistema === 'SAC' ? 'PRICE' : 'SAC' });
      return { r, outro, prazos: Simulador.tabelaPorPrazos(entrada), entrada, erro: null as string | null };
    } catch (e) {
      return { r: null, outro: null, prazos: [], entrada: paraMotor(f), erro: (e as Error).message };
    }
  }, [f]);

  const { r, outro, prazos, entrada, erro } = calc;
  const sac = f.sistema === 'SAC';
  const price = r && outro ? (sac ? outro : r) : null;
  const sacR = r && outro ? (sac ? r : outro) : null;

  const sugestoes: string[] = [];
  if (r && !r.aprovado) {
    const prazoOk = prazos.find((l) => l.prazoMeses > f.prazoMeses && l.aprovado);
    if (r.renda.comprometimento > entrada.limiteComprometimento) {
      if (prazoOk) sugestoes.push(`pagar em ${prazoOk.prazoMeses} meses (parcela de ${reais(prazoOk.primeiraParcela, 2)})`);
      const e = entradaQueCabe(entrada);
      if (e !== null) sugestoes.push(`dar uma entrada de pelo menos ${reais(e)}`);
      if (sac) sugestoes.push('escolher parcelas iguais, que começam menores');
      sugestoes.push(`incluir a renda de alguém que ajude a pagar (é preciso uma renda de ${reais(r.renda.rendaMinimaNecessaria, 2)})`);
    }
    if (r.entradaPct + 1e-9 < entrada.entradaMinimaPct) sugestoes.push(`aumentar a entrada para pelo menos ${reais(r.entradaMinima, 2)}`);
  }

  const dadosGrafico = price && sacR ? price.tabela.map((l: { mes: number; parcela: number }, i: number) => ({ mes: l.mes, iguais: Math.round(l.parcela), diminuem: Math.round(sacR.tabela[i].parcela) })) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
      <form className="cartao space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Dados do financiamento">
        <fieldset className="space-y-3">
          <legend className="mb-1 flex items-center gap-2 text-lg font-bold"><span className="grid h-7 w-7 place-items-center rounded-full bg-marca text-sm text-white">1</span>Sobre o carro</legend>
          <CampoNumero rotulo="Qual o preço do carro?" prefixo="R$" passo={1000} valor={f.valorBem} aoMudar={(v) => mudar('valorBem', v)} ajuda="O preço à vista, em reais." />
          <CampoNumero rotulo="Quanto você vai dar de entrada?" prefixo="R$" passo={1000} valor={f.entrada} aoMudar={(v) => mudar('entrada', v)} ajuda="Quanto maior a entrada, menor a dívida e os juros." />
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="mb-1 flex items-center gap-2 text-lg font-bold"><span className="grid h-7 w-7 place-items-center rounded-full bg-marca text-sm text-white">2</span>Sobre o pagamento</legend>
          <CampoNumero rotulo="Em quantos meses quer pagar?" sufixo="meses" valor={f.prazoMeses} min={1} max={420} aoMudar={(v) => mudar('prazoMeses', v)} ajuda={`Ex.: 48 meses = 4 anos. Prazo maior deixa a parcela menor, mas você paga mais juros.`} />
          <div className="grid grid-cols-2 gap-3">
            <CampoNumero rotulo="Taxa de juros (%)" passo={0.05} valor={f.taxaPct} aoMudar={(v) => mudar('taxaPct', v)} />
            <label className="block">
              <span className="rotulo">A taxa é</span>
              <select className="campo" value={f.taxaPeriodo} onChange={(e) => mudar('taxaPeriodo', e.target.value as 'mensal' | 'anual')}>
                <option value="mensal">por mês</option>
                <option value="anual">por ano</option>
              </select>
            </label>
          </div>
          <fieldset>
            <legend className="rotulo">Como prefere as parcelas?</legend>
            <div className="space-y-2">
              {([
                ['PRICE', 'Todas iguais', 'Mais fácil de planejar. Também chamado de "tabela Price".'],
                ['SAC', 'Começam maiores e vão diminuindo', 'No total, paga menos juros. Também chamado de "SAC".'],
              ] as const).map(([v, t, d]) => (
                <label key={v} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${f.sistema === v ? 'border-marca bg-marca-claro' : 'border-tinta-linha'}`}>
                  <input type="radio" name="sistema" className="mt-1 h-4 w-4 accent-marca" checked={f.sistema === v} onChange={() => mudar('sistema', v)} />
                  <span><span className="block font-semibold">{t}</span><span className="text-sm text-tinta-suave">{d}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="mb-1 flex items-center gap-2 text-lg font-bold"><span className="grid h-7 w-7 place-items-center rounded-full bg-marca text-sm text-white">3</span>Sobre você</legend>
          <CampoNumero rotulo="Quanto você ganha por mês?" prefixo="R$" passo={100} valor={f.rendaMensal} aoMudar={(v) => mudar('rendaMensal', v)} ajuda="Seu salário bruto (antes dos descontos)." />
          <CampoNumero rotulo="Alguém vai ajudar a pagar? Quanto essa pessoa ganha?" prefixo="R$" passo={100} valor={f.rendaComplementar} aoMudar={(v) => mudar('rendaComplementar', v)} ajuda="Ex.: cônjuge ou outra pessoa que assina junto. Deixe 0 se for só você." />
        </fieldset>
        <details className="rounded-xl border border-dashed border-tinta-linha p-3">
          <summary className="cursor-pointer font-semibold">Opções avançadas <span className="text-sm font-normal text-tinta-suave">(pode deixar como está)</span></summary>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <CampoNumero rotulo="Parte máxima do salário (%)" valor={f.limitePct} aoMudar={(v) => mudar('limitePct', v)} />
              <CampoNumero rotulo="Entrada mínima (%)" valor={f.entradaMinimaPct} aoMudar={(v) => mudar('entradaMinimaPct', v)} />
              <CampoNumero rotulo="Taxa de cadastro" prefixo="R$" valor={f.tarifaCadastro} aoMudar={(v) => mudar('tarifaCadastro', v)} />
              <CampoNumero rotulo="Registro do contrato" prefixo="R$" valor={f.registroContrato} aoMudar={(v) => mudar('registroContrato', v)} />
              <CampoNumero rotulo="Seguro da dívida" prefixo="R$" valor={f.seguro} aoMudar={(v) => mudar('seguro', v)} />
              <CampoNumero rotulo="Outros custos" prefixo="R$" valor={f.outrasDespesas} aoMudar={(v) => mudar('outrasDespesas', v)} />
            </div>
            <Interruptor rotulo="Incluir o imposto IOF" ajuda="Cobrado em todo empréstimo de pessoa física." ligado={f.cobrarIOF} aoMudar={(v) => mudar('cobrarIOF', v)} />
            <Interruptor rotulo="Colocar taxas e imposto dentro das parcelas" ajuda="Em vez de pagar na hora." ligado={f.financiarCustos} aoMudar={(v) => mudar('financiarCustos', v)} />
          </div>
        </details>
      </form>

      <section className="cartao min-w-0" aria-live="polite" aria-label="Resultado do financiamento">
        {erro || !r ? (
          <Aviso tipo="atencao">{erro}</Aviso>
        ) : (
          <>
            <div className="pb-2 text-center">
              <p className="text-tinta-suave">Sua parcela fica em</p>
              <p className="text-3xl font-bold text-marca sm:text-4xl">
                {sac ? `${f.prazoMeses} parcelas de ${reais(r.primeiraParcela, 2)} a ${reais(r.ultimaParcela, 2)}` : `${f.prazoMeses}x de ${reais(r.primeiraParcela, 2)}`}
              </p>
              <p className="text-sm text-tinta-suave">{sac ? 'Começam maiores e diminuem um pouco a cada mês.' : `São ${f.prazoMeses} parcelas iguais, uma por mês (${anos(f.prazoMeses)}).`}</p>
            </div>

            {r.aprovado ? (
              <Aviso tipo="ok"><strong>Cabe no seu orçamento.</strong> A parcela usa {pct(r.renda.comprometimento, 0)} da sua renda.</Aviso>
            ) : (
              <Aviso tipo="atencao">
                <strong>Vale ajustar a simulação.</strong> {r.pendencias.join(' ')}
                {sugestoes.length > 0 && (
                  <>
                    <p className="mt-2 font-semibold">Algumas ideias:</p>
                    <ul className="ml-5 list-disc">{sugestoes.map((s) => <li key={s}>{s}</li>)}</ul>
                  </>
                )}
              </Aviso>
            )}

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl bg-marca-claro p-3"><p className="text-sm text-tinta-suave">Preço à vista</p><p className="text-lg font-bold">{reais(f.valorBem, 2)}</p></div>
              <div className="rounded-xl bg-marca-claro p-3"><p className="text-sm text-tinta-suave">Juros no total</p><p className="text-lg font-bold">{reais(r.totalJuros, 2)}</p></div>
              <div className="rounded-xl bg-marca-suave p-3"><p className="text-sm text-tinta-suave">Custo total do carro</p><p className="text-lg font-bold text-marca-profundo">{reais(r.custoTotal, 2)}</p><p className="text-xs text-tinta-suave">{reais(r.custoTotal - f.valorBem, 2)} a mais que à vista</p></div>
            </div>

            <div className="mt-5 border-t border-tinta-linha">
              <Secao titulo="Comparar com outros prazos" resumo="Parcela, juros e custo total de 12 a 72 meses" aberta>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-[15px]">
                    <thead><tr className="border-b text-left text-tinta-suave"><th className="py-2">Meses</th><th className="text-right">Parcela</th><th className="text-right">Juros</th><th className="text-right">Custo total</th></tr></thead>
                    <tbody>
                      {prazos.map((l) => (
                        <tr key={l.prazoMeses} className={`border-b ${l.prazoMeses === f.prazoMeses ? 'bg-marca-suave font-semibold' : ''}`}>
                          <th className="whitespace-nowrap py-2 text-left">{l.prazoMeses}x <SeloCabe ok={l.aprovado} /></th>
                          <td className="text-right tabular-nums">{reais(l.primeiraParcela, 2)}{sac && <span className="block text-xs font-normal text-tinta-suave">até {reais(l.ultimaParcela, 2)}</span>}</td>
                          <td className="text-right tabular-nums">{reais(l.totalJuros, 2)}</td>
                          <td className="text-right tabular-nums">{reais(l.valorTotal, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-sm text-tinta-suave">Menos meses: parcela maior, mas o carro sai mais barato no final.</p>
                <BotaoCSV
                  aoClicar={() =>
                    baixarCSV('tabela-financiamento.csv', [
                      ['Meses', 'Primeira parcela', 'Última parcela', 'Total de juros', 'Custo total do carro', 'Parte do salário (%)', 'Cabe no salário?'],
                      ...prazos.map((l) => [l.prazoMeses, n2(l.primeiraParcela), n2(l.ultimaParcela), n2(l.totalJuros), n2(l.valorTotal), n2(l.comprometimento * 100), l.aprovado ? 'Sim' : 'Não']),
                    ])
                  }
                />
              </Secao>

              {price && sacR && (
                <Secao titulo="Parcelas iguais ou que diminuem?" resumo="Compare as duas formas de pagar">
                  <table className="w-full text-[15px]">
                    <thead><tr className="border-b text-left text-tinta-suave"><th className="py-2" /><th className="text-right">Todas iguais</th><th className="text-right">Vão diminuindo</th></tr></thead>
                    <tbody>
                      {([
                        ['Primeira parcela', (x: typeof r) => reais(x.primeiraParcela, 2)],
                        ['Última parcela', (x: typeof r) => reais(x.ultimaParcela, 2)],
                        ['Total de juros', (x: typeof r) => reais(x.totalJuros, 2)],
                        ['Custo total do carro', (x: typeof r) => reais(x.custoTotal, 2)],
                        ['Cabe no orçamento?', (x: typeof r) => (x.aprovado ? '✓ Sim' : 'Acima do ideal')],
                      ] as const).map(([nome, fn]) => (
                        <tr key={nome} className="border-b"><th className="py-2 text-left font-semibold">{nome}</th><td className="text-right tabular-nums">{fn(price)}</td><td className="text-right tabular-nums">{fn(sacR)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-4 text-sm font-semibold">Valor da parcela mês a mês</p>
                  <div className="h-60">
                    <ResponsiveContainer>
                      <LineChart data={dadosGrafico} margin={{ right: 12, left: 4, top: 8 }}>
                        <CartesianGrid stroke="#F1E4DA" />
                        <XAxis dataKey="mes" fontSize={12} tickFormatter={(v) => `${v}º`} />
                        <YAxis fontSize={12} width={64} tickFormatter={(v) => reais(v)} />
                        <Tooltip formatter={(v: number, nome: string) => [reais(v, 2), nome === 'iguais' ? 'Parcelas iguais' : 'Parcelas que diminuem']} labelFormatter={(l) => `${l}º mês`} />
                        <Legend formatter={(n: string) => (n === 'iguais' ? 'Parcelas iguais' : 'Parcelas que diminuem')} />
                        <ReferenceLine y={r.renda.parcelaMaximaPermitida} stroke="#9E9E9E" strokeDasharray="6 5" label={{ value: 'máximo para sua renda', fontSize: 11, fill: '#5F5F5F', position: 'insideTopRight' }} />
                        <Line type="monotone" dataKey="iguais" stroke="#EC0000" strokeWidth={3} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="diminuem" stroke="#3D3D3D" strokeWidth={3} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Secao>
              )}

              <Secao titulo="A conta em detalhes" resumo="Taxas, imposto, CET e análise da renda">
                <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[15px]">
                  {([
                    ['Preço do carro', reais(f.valorBem, 2)],
                    ['Entrada', `${reais(f.entrada, 2)} (${pct(r.entradaPct, 0)} do preço)`],
                    ['Quanto falta pagar do carro', reais(r.valorLiquido, 2)],
                    ['Taxas do banco (cadastro, registro, seguro)', reais(r.tarifas, 2)],
                    ['Imposto (IOF)', reais(r.iof, 2)],
                    ['Pago na hora em taxas e imposto', reais(r.custosAVista, 2)],
                    ['Valor total emprestado pelo banco', reais(r.valorFinanciado, 2)],
                    ['Taxa de juros', `${pct(r.taxaMensal, 2)} por mês (${pct(r.taxaAnual, 2)} por ano)`],
                    ['Custo real do financiamento (CET)', `${pct(r.cetMensal, 2)} por mês (${pct(r.cetAnual, 2)} por ano)`],
                    ['Total de juros', reais(r.totalJuros, 2)],
                    ['Soma de todas as parcelas', reais(r.totalParcelas, 2)],
                    ['Custo total do carro', reais(r.custoTotal, 2)],
                    ['Sua renda considerada', reais(r.renda.rendaTotal, 2)],
                    ['Parte do salário usada pela parcela', pct(r.renda.comprometimento, 1)],
                    ['Maior parcela que cabe no seu salário', reais(r.renda.parcelaMaximaPermitida, 2)],
                    ['Salário mínimo necessário para esta parcela', reais(r.renda.rendaMinimaNecessaria, 2)],
                  ] as const).map(([a, b]) => (
                    <div key={a} className="contents"><dt className="text-tinta-suave">{a}</dt><dd className="text-right tabular-nums">{b}</dd></div>
                  ))}
                </dl>
              </Secao>

              <Secao titulo="Parcela por parcela" resumo="Quanto de cada parcela é juros e quanto abate a dívida">
                <div className="max-h-[420px] overflow-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead className="sticky top-0 bg-white"><tr className="border-b text-left text-tinta-suave"><th className="py-2">Mês</th><th className="text-right">Parcela</th><th className="text-right">Juros</th><th className="text-right">Abate da dívida</th><th className="text-right">Ainda deve</th></tr></thead>
                    <tbody>
                      {r.tabela.map((l: { mes: number; parcela: number; juros: number; amortizacao: number; saldo: number }) => (
                        <tr key={l.mes} className="border-b"><td className="py-1.5">{l.mes}</td><td className="text-right tabular-nums">{reais(l.parcela, 2)}</td><td className="text-right tabular-nums">{reais(l.juros, 2)}</td><td className="text-right tabular-nums">{reais(l.amortizacao, 2)}</td><td className="text-right tabular-nums">{reais(l.saldo, 2)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Secao>

              <Secao titulo="O que significa cada termo" resumo="Entrada, juros, IOF, CET, Price e SAC">
                <dl className="space-y-2 text-[15px]">
                  {([
                    ['Entrada', 'Parte do preço que você paga na hora, com seu dinheiro.'],
                    ['Juros', 'O valor que o banco cobra por emprestar o dinheiro. É o quanto você paga a mais.'],
                    ['Taxa de juros', 'A porcentagem de juros cobrada a cada mês (ou ano) sobre o que você ainda deve.'],
                    ['IOF', 'Imposto do governo cobrado em empréstimos e financiamentos.'],
                    ['CET (Custo Efetivo Total)', 'A taxa "de verdade" do financiamento, somando juros, impostos e taxas. Use para comparar ofertas: quanto menor, melhor.'],
                    ['Price', 'Forma de pagamento em que todas as parcelas têm o mesmo valor.'],
                    ['SAC', 'Forma de pagamento em que as parcelas começam maiores e diminuem a cada mês. No total, sai mais barato.'],
                    ['Comprometimento de renda', 'Quanto do seu salário vai para a parcela. Os bancos costumam aceitar até 30%.'],
                  ] as const).map(([t, d]) => (
                    <div key={t}><dt className="font-semibold">{t}</dt><dd className="text-tinta-suave">{d}</dd></div>
                  ))}
                </dl>
              </Secao>
            </div>
            <p className="mt-4 text-center text-xs text-tinta-suave">Simulação para referência. Os valores finais dependem da análise de crédito.</p>
          </>
        )}
      </section>
    </div>
  );
}

