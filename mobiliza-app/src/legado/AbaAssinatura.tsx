import { useMemo } from 'react';
import { pct, reais } from '../components/formato';
import { Aviso, CampoNumero } from '../components/ui';
import Alternativas from './alternativas.js';
import { anos, Secao } from './comum';

export interface FormAssinatura {
  valorBem: number;
  mensalidade: number; // 0 = estimar
  prazoMeses: number;
  rendaMensal: number;
  rendaComplementar: number;
  limitePct: number;
  entradaCompraPct: number;
  taxaCompraPct: number;
  seguroPctAno: number;
  ipvaPctAno: number;
  manutencaoAno: number;
  depreciacaoPctAno: number;
}

export const ASSINATURA_PADRAO: FormAssinatura = {
  valorBem: 80000,
  mensalidade: 0,
  prazoMeses: 24,
  rendaMensal: 7000,
  rendaComplementar: 0,
  limitePct: 30,
  entradaCompraPct: 20,
  taxaCompraPct: 1.79,
  seguroPctAno: 5,
  ipvaPctAno: 4,
  manutencaoAno: 2000,
  depreciacaoPctAno: 10,
};

export function AbaAssinatura({ f, set }: { f: FormAssinatura; set: (f: FormAssinatura) => void }) {
  const mudar = <K extends keyof FormAssinatura>(k: K, v: FormAssinatura[K]) => set({ ...f, [k]: v });
  const calc = useMemo(() => {
    try {
      const r = Alternativas.simularAssinatura({
        valorBem: f.valorBem,
        mensalidade: f.mensalidade,
        prazoMeses: f.prazoMeses,
        rendaMensal: f.rendaMensal,
        rendaComplementar: f.rendaComplementar,
        limiteComprometimento: f.limitePct / 100,
        entradaCompraPct: f.entradaCompraPct / 100,
        taxaCompra: f.taxaCompraPct / 100,
        premissas: { seguroPctAno: f.seguroPctAno / 100, ipvaPctAno: f.ipvaPctAno / 100, manutencaoAno: f.manutencaoAno, depreciacaoPctAno: f.depreciacaoPctAno / 100 },
      });
      return { r, erro: null as string | null };
    } catch (e) {
      return { r: null, erro: (e as Error).message };
    }
  }, [f]);
  const { r, erro } = calc;
  const c = r?.comparacao;
  const fin = c?.financiamento;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
      <form className="cartao space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Dados da assinatura">
        <fieldset className="space-y-3">
          <legend className="mb-1 flex items-center gap-2 text-lg font-bold"><span className="grid h-7 w-7 place-items-center rounded-full bg-marca text-sm text-white">1</span>Sobre o carro e a assinatura</legend>
          <CampoNumero rotulo="Qual o preço do carro, se fosse comprar?" prefixo="R$" passo={1000} valor={f.valorBem} aoMudar={(v) => mudar('valorBem', v)} ajuda="Serve para comparar com comprar." />
          <CampoNumero rotulo="Quanto é a mensalidade oferecida?" prefixo="R$" passo={50} valor={f.mensalidade} aoMudar={(v) => mudar('mensalidade', v)} ajuda={`Deixe 0 para estimarmos ${pct(Alternativas.ASSINATURA_PCT_MES_ESTIMADA, 1)} do preço do carro por mês.`} />
          <label className="block">
            <span className="rotulo">Quantos meses de contrato?</span>
            <select className="campo" value={f.prazoMeses} onChange={(e) => mudar('prazoMeses', Number(e.target.value))}>
              {[12, 18, 24, 36].map((m) => <option key={m} value={m}>{m} meses ({anos(m)})</option>)}
            </select>
          </label>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="mb-1 flex items-center gap-2 text-lg font-bold"><span className="grid h-7 w-7 place-items-center rounded-full bg-marca text-sm text-white">2</span>Sobre você</legend>
          <CampoNumero rotulo="Quanto você ganha por mês?" prefixo="R$" passo={100} valor={f.rendaMensal} aoMudar={(v) => mudar('rendaMensal', v)} />
          <CampoNumero rotulo="Renda de quem vai ajudar a pagar" prefixo="R$" passo={100} valor={f.rendaComplementar} aoMudar={(v) => mudar('rendaComplementar', v)} ajuda="Deixe 0 se for só você." />
        </fieldset>
        <details className="rounded-xl border border-dashed border-tinta-linha p-3">
          <summary className="cursor-pointer font-semibold">Opções avançadas <span className="text-sm font-normal text-tinta-suave">(pode deixar como está)</span></summary>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <CampoNumero rotulo="Parte máxima do salário (%)" valor={f.limitePct} aoMudar={(v) => mudar('limitePct', v)} />
            <CampoNumero rotulo="Entrada se comprar (%)" valor={f.entradaCompraPct} aoMudar={(v) => mudar('entradaCompraPct', v)} />
            <CampoNumero rotulo="Juros se financiar (% a.m.)" passo={0.05} valor={f.taxaCompraPct} aoMudar={(v) => mudar('taxaCompraPct', v)} />
            <CampoNumero rotulo="Seguro por ano (%)" passo={0.5} valor={f.seguroPctAno} aoMudar={(v) => mudar('seguroPctAno', v)} />
            <CampoNumero rotulo="IPVA por ano (%)" passo={0.5} valor={f.ipvaPctAno} aoMudar={(v) => mudar('ipvaPctAno', v)} />
            <CampoNumero rotulo="Revisões e documentos (R$/ano)" passo={100} valor={f.manutencaoAno} aoMudar={(v) => mudar('manutencaoAno', v)} />
            <CampoNumero rotulo="Perda de valor por ano (%)" valor={f.depreciacaoPctAno} aoMudar={(v) => mudar('depreciacaoPctAno', v)} />
          </div>
        </details>
      </form>

      <section className="cartao min-w-0" aria-live="polite" aria-label="Resultado da assinatura">
        {erro || !r || !c || !fin ? (
          <Aviso tipo="atencao">{erro}</Aviso>
        ) : (
          <>
            <div className="pb-2 text-center">
              <p className="text-tinta-suave">Sua mensalidade fica em</p>
              <p className="text-3xl font-bold text-marca sm:text-4xl">{f.prazoMeses}x de {reais(r.mensalidade, 2)}</p>
              <p className="text-sm text-tinta-suave">{r.mensalidadeEstimada ? 'Valor estimado. Se tiver uma proposta, coloque a mensalidade dela.' : `Valor fixo por ${anos(f.prazoMeses)}, sem entrada.`}</p>
            </div>
            {r.renda.cabe ? (
              <Aviso tipo="ok"><strong>Cabe no seu orçamento.</strong> A mensalidade usa {pct(r.renda.comprometimento, 0)} da sua renda.</Aviso>
            ) : (
              <Aviso tipo="atencao"><strong>Vale ajustar a simulação.</strong> A mensalidade usa {pct(r.renda.comprometimento, 0)} da sua renda, e o ideal é até {f.limitePct}%. A renda ideal seria de {reais(r.renda.rendaMinimaNecessaria, 2)}.</Aviso>
            )}

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl bg-marca-claro p-3"><p className="text-sm text-tinta-suave">Total no contrato</p><p className="text-lg font-bold">{reais(r.totalPago, 2)}</p></div>
              <div className="rounded-xl bg-marca-claro p-3"><p className="text-sm text-tinta-suave">Entrada</p><p className="text-lg font-bold">Sem entrada</p></div>
              <div className="rounded-xl bg-marca-claro p-3"><p className="text-sm text-tinta-suave">Já incluso</p><p className="font-bold">Seguro, IPVA e revisões</p></div>
            </div>
            <p className="mt-3 rounded-xl bg-marca-claro px-3 py-2 text-[15px]">
              {Math.abs(c.economiaAssinando) < 100
                ? 'Na prática, assinar e comprar custam quase o mesmo. Escolha pelo que for mais cômodo para você.'
                : c.economiaAssinando > 0
                  ? `Em ${anos(f.prazoMeses)}, assinar sai cerca de ${reais(c.economiaAssinando, 2)} mais barato do que comprar financiado, já considerando quanto o carro valeria no final.`
                  : `Em ${anos(f.prazoMeses)}, comprar financiado sai cerca de ${reais(-c.economiaAssinando, 2)} mais barato, porque no final o carro é seu. Já assinar não pede entrada e não tem gastos surpresa.`}
            </p>

            <div className="mt-5 border-t border-tinta-linha">
              <Secao titulo="Assinar ou comprar: a conta completa" resumo="Entrada, gasto por mês e valor do carro no final" aberta>
                <p className="mb-2 text-sm text-tinta-suave">Comprando o mesmo carro com {f.entradaCompraPct}% de entrada, financiado em {f.prazoMeses} meses, e pagando você mesmo seguro, IPVA e revisões.</p>
                <table className="w-full text-[15px]">
                  <thead><tr className="border-b text-left text-tinta-suave"><th className="py-2" /><th className="text-right">Assinar</th><th className="text-right">Comprar</th></tr></thead>
                  <tbody>
                    {([
                      ['Entrada', reais(0, 2), reais(fin.parametros.entrada, 2)],
                      ['Gasto por mês', reais(r.mensalidade, 2), `${reais(c.gastoMensalComprar, 2)}`],
                      ['Gasto total no período', reais(r.totalPago, 2), reais(c.gastoTotalComprar, 2)],
                      ['No final você tem', 'Nada (devolve o carro)', `Um carro de cerca de ${reais(c.posse.valorFinal, 2)}`],
                      ['Custo real (gasto − valor do carro)', reais(c.custoRealAssinar, 2), reais(c.custoRealComprar, 2)],
                    ] as const).map(([a, b, d]) => (
                      <tr key={a} className="border-b"><th className="py-2 text-left font-semibold">{a}</th><td className="text-right tabular-nums">{b}</td><td className="text-right tabular-nums">{d}</td></tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-tinta-suave">Gasto por mês ao comprar = parcela de {reais(fin.primeiraParcela, 2)} + {reais(c.posse.porMes, 2)} de seguro, IPVA e revisões.</p>
              </Secao>

              <Secao titulo="Para quem vale a pena" resumo="Ajuda para decidir">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-marca-claro p-4">
                    <p className="font-bold">Assinar</p>
                    <ul className="ml-5 mt-1 list-disc text-[15px]">
                      <li>quer praticidade, sem cuidar de seguro e revisões;</li>
                      <li>prefere não dar entrada;</li>
                      <li>gosta de trocar de carro a cada 1 a 3 anos.</li>
                    </ul>
                    <p className="mt-2 text-sm text-tinta-suave">Há limite de quilômetros por mês e regras para cancelar antes do fim.</p>
                  </div>
                  <div className="rounded-xl bg-marca-claro p-4">
                    <p className="font-bold">Comprar</p>
                    <ul className="ml-5 mt-1 list-disc text-[15px]">
                      <li>quer ficar com o carro por muitos anos;</li>
                      <li>roda muitos quilômetros;</li>
                      <li>quer ter um bem para vender depois.</li>
                    </ul>
                  </div>
                </div>
              </Secao>

              <Secao titulo="A conta em detalhes" resumo="Seguro, IPVA, revisões e desvalorização">
                <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[15px]">
                  {([
                    ['Mensalidade da assinatura', reais(r.mensalidade, 2) + (r.mensalidadeEstimada ? ' (estimada)' : '')],
                    ['Total pago na assinatura', reais(r.totalPago, 2)],
                    ['Maior mensalidade que cabe no seu salário', reais(r.renda.parcelaMaximaPermitida, 2)],
                    ['Se comprasse: entrada', reais(fin.parametros.entrada, 2)],
                    ['Se comprasse: parcela', reais(fin.primeiraParcela, 2)],
                    ['Total pago ao banco (entrada + parcelas)', reais(fin.custoTotal, 2)],
                    ['Seguro no período', reais(c.posse.seguro, 2)],
                    ['IPVA no período', reais(c.posse.ipva, 2)],
                    ['Revisões, pneus e documentos', reais(c.posse.manutencao, 2)],
                    ['Gasto total ao comprar', reais(c.gastoTotalComprar, 2)],
                    ['Valor do carro no final', reais(c.posse.valorFinal, 2)],
                    ['Quanto o carro perdeu de valor', reais(c.posse.desvalorizacao, 2)],
                    ['Custo real de comprar', reais(c.custoRealComprar, 2)],
                  ] as const).map(([a, b]) => (
                    <div key={a} className="contents"><dt className="text-tinta-suave">{a}</dt><dd className="text-right tabular-nums">{b}</dd></div>
                  ))}
                </dl>
              </Secao>
            </div>
            <p className="mt-4 text-center text-xs text-tinta-suave">Simulação para referência. Mensalidade, quilometragem e regras de cancelamento dependem da proposta.</p>
          </>
        )}
      </section>
    </div>
  );
}
