import { useMemo } from 'react';
import { pct, reais } from '../components/formato';
import { Aviso, CampoNumero } from '../components/ui';
import Alternativas from './alternativas.js';
import { anos, baixarCSV, BotaoCSV, n2, Secao, SeloCabe } from './comum';

export interface FormLeasing {
  valorBem: number;
  entrada: number;
  prazoMeses: number;
  taxaPct: number;
  taxaPeriodo: 'mensal' | 'anual';
  residualPct: number;
  rendaMensal: number;
  rendaComplementar: number;
  limitePct: number;
  tarifaCadastro: number;
  registroContrato: number;
  outrasDespesas: number;
}

export const LEASING_PADRAO: FormLeasing = {
  valorBem: 80000,
  entrada: 16000,
  prazoMeses: 36,
  taxaPct: 1.59,
  taxaPeriodo: 'mensal',
  residualPct: 30,
  rendaMensal: 7000,
  rendaComplementar: 0,
  limitePct: 30,
  tarifaCadastro: 850,
  registroContrato: 250,
  outrasDespesas: 0,
};

export function AbaLeasing({ f, set }: { f: FormLeasing; set: (f: FormLeasing) => void }) {
  const mudar = <K extends keyof FormLeasing>(k: K, v: FormLeasing[K]) => set({ ...f, [k]: v });
  const calc = useMemo(() => {
    const entrada = {
      valorBem: f.valorBem,
      entrada: f.entrada,
      prazoMeses: Math.round(f.prazoMeses),
      taxa: f.taxaPct / 100,
      taxaPeriodo: f.taxaPeriodo,
      residualPct: f.residualPct / 100,
      rendaMensal: f.rendaMensal,
      rendaComplementar: f.rendaComplementar,
      limiteComprometimento: f.limitePct / 100,
      tarifaCadastro: f.tarifaCadastro,
      registroContrato: f.registroContrato,
      outrasDespesas: f.outrasDespesas,
    };
    try {
      return { ...Alternativas.compararLeasingComFinanciamento(entrada), prazos: Alternativas.leasingPorPrazos(entrada), erro: null as string | null };
    } catch (e) {
      return { leasing: null, financiamento: null, diferenca: 0, prazos: [], erro: (e as Error).message };
    }
  }, [f]);
  const { leasing: r, financiamento: fin, diferenca, prazos, erro } = calc;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
      <form className="cartao space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Dados do leasing">
        <fieldset className="space-y-3">
          <legend className="mb-1 flex items-center gap-2 text-lg font-bold"><span className="grid h-7 w-7 place-items-center rounded-full bg-marca text-sm text-white">1</span>Sobre o carro</legend>
          <CampoNumero rotulo="Qual o preço do carro?" prefixo="R$" passo={1000} valor={f.valorBem} aoMudar={(v) => mudar('valorBem', v)} />
          <CampoNumero rotulo="Quanto você vai dar de entrada?" prefixo="R$" passo={1000} valor={f.entrada} aoMudar={(v) => mudar('entrada', v)} ajuda="Pode ser zero. Quanto maior, menores as parcelas." />
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="mb-1 flex items-center gap-2 text-lg font-bold"><span className="grid h-7 w-7 place-items-center rounded-full bg-marca text-sm text-white">2</span>Sobre o contrato</legend>
          <CampoNumero rotulo="Quantos meses de contrato?" sufixo="meses" valor={f.prazoMeses} min={1} max={120} aoMudar={(v) => mudar('prazoMeses', v)} ajuda="Costuma ser entre 24 e 60 meses." />
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
          <CampoNumero rotulo="Quanto deixar para pagar no final? (% do preço)" sufixo="%" valor={f.residualPct} aoMudar={(v) => mudar('residualPct', v)} ajuda="É o valor pago no fim para ficar com o carro. Quanto maior, menores as parcelas." />
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="mb-1 flex items-center gap-2 text-lg font-bold"><span className="grid h-7 w-7 place-items-center rounded-full bg-marca text-sm text-white">3</span>Sobre você</legend>
          <CampoNumero rotulo="Quanto você ganha por mês?" prefixo="R$" passo={100} valor={f.rendaMensal} aoMudar={(v) => mudar('rendaMensal', v)} />
          <CampoNumero rotulo="Renda de quem vai ajudar a pagar" prefixo="R$" passo={100} valor={f.rendaComplementar} aoMudar={(v) => mudar('rendaComplementar', v)} ajuda="Deixe 0 se for só você." />
        </fieldset>
        <details className="rounded-xl border border-dashed border-tinta-linha p-3">
          <summary className="cursor-pointer font-semibold">Opções avançadas <span className="text-sm font-normal text-tinta-suave">(pode deixar como está)</span></summary>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <CampoNumero rotulo="Parte máxima do salário (%)" valor={f.limitePct} aoMudar={(v) => mudar('limitePct', v)} />
            <CampoNumero rotulo="Taxa de cadastro" prefixo="R$" valor={f.tarifaCadastro} aoMudar={(v) => mudar('tarifaCadastro', v)} />
            <CampoNumero rotulo="Registro do contrato" prefixo="R$" valor={f.registroContrato} aoMudar={(v) => mudar('registroContrato', v)} />
            <CampoNumero rotulo="Outros custos" prefixo="R$" valor={f.outrasDespesas} aoMudar={(v) => mudar('outrasDespesas', v)} />
          </div>
        </details>
      </form>

      <section className="cartao min-w-0" aria-live="polite" aria-label="Resultado do leasing">
        {erro || !r || !fin ? (
          <Aviso tipo="atencao">{erro}</Aviso>
        ) : (
          <>
            <div className="pb-2 text-center">
              <p className="text-tinta-suave">Sua parcela fica em</p>
              <p className="text-3xl font-bold text-marca sm:text-4xl">{f.prazoMeses}x de {reais(r.parcela, 2)}</p>
              <p className="text-sm text-tinta-suave">Parcelas iguais durante {anos(f.prazoMeses)}{f.entrada ? `, além da entrada de ${reais(f.entrada, 2)}.` : '.'}</p>
            </div>
            {r.renda.cabe ? (
              <Aviso tipo="ok"><strong>Cabe no seu orçamento.</strong> A parcela usa {pct(r.renda.comprometimento, 0)} da sua renda.</Aviso>
            ) : (
              <Aviso tipo="atencao">
                <strong>Vale ajustar a simulação.</strong> A parcela usa {pct(r.renda.comprometimento, 0)} da sua renda, e o ideal é até {f.limitePct}%. Experimente um prazo maior ou uma entrada maior. Para esta parcela, a renda ideal seria de {reais(r.renda.rendaMinimaNecessaria, 2)}.
              </Aviso>
            )}

            <p className="mb-2 mt-5 font-semibold">No fim do contrato, você escolhe:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-marca-claro p-4">
                <p className="font-bold">Ficar com o carro</p>
                <p>Paga mais <strong>{reais(r.valorResidual, 2)}</strong></p>
                <p className="mt-1">Total: <strong className="text-marca">{reais(r.totalSeComprar, 2)}</strong></p>
              </div>
              <div className="rounded-xl bg-marca-claro p-4">
                <p className="font-bold">Devolver o carro</p>
                <p>Não paga mais nada</p>
                <p className="mt-1">Total: <strong className="text-marca">{reais(r.totalSeDevolver, 2)}</strong></p>
              </div>
            </div>

            <div className="mt-5 border-t border-tinta-linha">
              <Secao titulo="Comparar com financiar" resumo={Math.abs(diferenca) < 1 ? 'Custam praticamente o mesmo' : diferenca > 0 ? `Este sai ${reais(diferenca, 2)} mais barato` : `Financiar sai ${reais(-diferenca, 2)} mais barato`}>
                <p className="mb-2 text-sm text-tinta-suave">Mesmo carro, entrada, prazo e taxa. Nos dois casos você termina com o carro.</p>
                <table className="w-full text-[15px]">
                  <thead><tr className="border-b text-left text-tinta-suave"><th className="py-2" /><th className="text-right">Alugar e comprar</th><th className="text-right">Financiar</th></tr></thead>
                  <tbody>
                    {([
                      ['Entrada', reais(f.entrada, 2), reais(fin.parametros.entrada, 2)],
                      ['Parcela por mês', reais(r.parcela, 2), reais(fin.primeiraParcela, 2)],
                      ['Pago no final', reais(r.valorResidual, 2), reais(0, 2)],
                      ['Imposto IOF', 'Não tem', reais(fin.iof, 2)],
                      ['Custo total do carro', reais(r.totalSeComprar, 2), reais(fin.custoTotal, 2)],
                      ['Carro fica no seu nome', 'Só no final', 'Desde o início'],
                    ] as const).map(([a, b, c]) => (
                      <tr key={a} className="border-b"><th className="py-2 text-left font-semibold">{a}</th><td className="text-right tabular-nums">{b}</td><td className="text-right tabular-nums">{c}</td></tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 rounded-xl bg-marca-claro px-3 py-2 text-[15px]">
                  {Math.abs(diferenca) < 1
                    ? 'Os dois custam praticamente o mesmo no total.'
                    : diferenca > 0
                      ? `Alugar e comprar no final sai ${reais(diferenca, 2)} mais barato no total, principalmente porque não tem IOF. Mas é preciso ter ${reais(r.valorResidual, 2)} no final para ficar com o carro.`
                      : `Financiar sai ${reais(-diferenca, 2)} mais barato no total. Deixar um valor alto para o final aumenta os juros do leasing.`}
                </p>
              </Secao>

              <Secao titulo="Comparar com outros prazos" resumo="Parcela e custo total de 24 a 60 meses">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-[15px]">
                    <thead><tr className="border-b text-left text-tinta-suave"><th className="py-2">Meses</th><th className="text-right">Parcela</th><th className="text-right">Valor final</th><th className="text-right">Custo total</th></tr></thead>
                    <tbody>
                      {prazos.map((l) => (
                        <tr key={l.prazoMeses} className={`border-b ${l.prazoMeses === f.prazoMeses ? 'bg-marca-suave font-semibold' : ''}`}>
                          <th className="whitespace-nowrap py-2 text-left">{l.prazoMeses}x <SeloCabe ok={l.aprovado} /></th>
                          <td className="text-right tabular-nums">{reais(l.parcela, 2)}</td>
                          <td className="text-right tabular-nums">{reais(l.valorResidual, 2)}</td>
                          <td className="text-right tabular-nums">{reais(l.totalSeComprar, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <BotaoCSV
                  aoClicar={() =>
                    baixarCSV('tabela-leasing.csv', [
                      ['Meses', 'Parcela por mês', 'Valor final', 'Juros e taxas', 'Total se ficar com o carro', 'Parte do salário (%)', 'Cabe no salário?'],
                      ...prazos.map((l) => [l.prazoMeses, n2(l.parcela), n2(l.valorResidual), n2(l.totalJuros), n2(l.totalSeComprar), n2(l.comprometimento * 100), l.aprovado ? 'Sim' : 'Não']),
                    ])
                  }
                />
              </Secao>

              <Secao titulo="A conta em detalhes" resumo="Taxas, juros e CET">
                <p className="mb-2 text-sm text-tinta-suave">Se ficar com o carro, {reais(r.totalJuros, 2)} do total são juros e taxas.</p>
                <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[15px]">
                  {([
                    ['Preço do carro', reais(f.valorBem, 2)],
                    ['Entrada', reais(f.entrada, 2)],
                    ['Taxas do banco', reais(r.tarifas, 2)],
                    ['Valor alugado pelo banco', reais(r.valorArrendado, 2)],
                    ['Valor final para ficar com o carro', `${reais(r.valorResidual, 2)} (${f.residualPct}% do preço)`],
                    ['Taxa de juros', `${pct(r.taxaMensal, 2)} por mês`],
                    ['Custo real (CET)', `${pct(r.cetMensal, 2)} por mês (${pct(r.cetAnual, 2)} por ano)`],
                    ['Soma das parcelas', reais(r.totalParcelas, 2)],
                    ['Juros e taxas no total', reais(r.totalJuros, 2)],
                    ['Maior parcela que cabe no seu salário', reais(r.renda.parcelaMaximaPermitida, 2)],
                  ] as const).map(([a, b]) => (
                    <div key={a} className="contents"><dt className="text-tinta-suave">{a}</dt><dd className="text-right tabular-nums">{b}</dd></div>
                  ))}
                </dl>
                <p className="mt-2 text-sm text-tinta-suave">Se devolver o carro, parte da entrada pode voltar, conforme o contrato.</p>
              </Secao>
            </div>
            <p className="mt-4 text-center text-xs text-tinta-suave">Simulação para referência. Regras de devolução, seguro e valor final dependem do contrato.</p>
          </>
        )}
      </section>
    </div>
  );
}
