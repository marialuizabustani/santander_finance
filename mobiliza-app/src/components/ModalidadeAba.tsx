import { km as fmtKm, pct, reais } from './formato';
import { Banknote, CalendarDays, KeyRound, Landmark, type LucideIcon } from 'lucide-react';
import { CampoNumero, Cartao, Selo } from './ui';
import { NOME_MODALIDADE, NOME_TECNOLOGIA, veiculoPorId } from '../data/veiculos';
import { taxaAnual, type Modalidade, type Premissas, type ResultadoOpcao } from '../engine';
import { useEstado } from '../state/estado';
import { irPara } from '../state/rotas';

/** Textos de cada forma de pagamento, em linguagem simples. */
export const SOBRE_MODALIDADE: Record<Modalidade, { icone: LucideIcon; resumo: string; como: string[]; paraQuem: string; atencao: string }> = {
  financiamento: {
    icone: Landmark,
    resumo: 'O banco paga o carro e você devolve em parcelas, com juros. O carro é seu desde o início.',
    como: ['Você dá uma entrada e financia o restante.', 'Paga parcelas fixas durante o prazo escolhido.', 'Seguro, IPVA e manutenção ficam por sua conta.'],
    paraQuem: 'Quem quer ficar com o carro por muitos anos e construir patrimônio.',
    atencao: 'Quanto maior o prazo, mais juros no total. Abrir conta e trazer o salário pode reduzir a taxa (simulação).',
  },
  leasing: {
    icone: KeyRound,
    resumo: 'Um aluguel com opção de compra: você paga parcelas e, no fim, decide se paga um valor final e fica com o carro.',
    como: ['Entrada menor e parcelas que podem ser mais baixas.', 'No fim, paga o valor final (residual) para ficar com o carro, ou devolve.', 'Não tem IOF; o carro fica no nome do banco até o fim.'],
    paraQuem: 'Quem quer parcelas menores agora e consegue juntar o valor final.',
    atencao: 'Deixar um valor final alto reduz a parcela, mas aumenta os juros no total.',
  },
  assinatura: {
    icone: CalendarDays,
    resumo: 'Uma mensalidade fixa com seguro, IPVA e manutenção inclusos. No fim do contrato, você devolve o carro.',
    como: ['Sem entrada.', 'Seguro, IPVA, documentação e revisões já estão na mensalidade.', 'Há um limite de km por mês; o que passar é cobrado por km.'],
    paraQuem: 'Quem quer previsibilidade, sem surpresas de manutenção, e gosta de trocar de carro a cada 1 a 3 anos.',
    atencao: 'No fim você não fica com o carro. Cancelar antes do prazo costuma ter multa.',
  },
  avista: {
    icone: Banknote,
    resumo: 'Você paga o valor total na hora, sem juros. O carro é seu.',
    como: ['Sem parcelas nem juros.', 'Seguro, IPVA e manutenção ficam por sua conta.', 'O dinheiro sai todo de uma vez.'],
    paraQuem: 'Quem já tem o dinheiro e não precisa dele para outras coisas.',
    atencao: 'O dinheiro usado deixa de render em uma aplicação (o simulador não considera esse rendimento).',
  },
};

/** Condições editáveis de cada modalidade (hipóteses, não ofertas). */
function Condicoes({ m }: { m: Modalidade }) {
  const { dados, derivados, atualizar } = useEstado();
  const p = dados.premissas;
  const set = (f: (x: Premissas) => Premissas) => atualizar((d) => ({ ...d, premissas: f(d.premissas) }));
  const bonificada = derivados.premissasEfetivas.financiamento.taxaMes < p.financiamento.taxaMes;

  if (m === 'financiamento')
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <CampoNumero rotulo="Entrada (% do preço)" valor={Math.round(p.financiamento.entradaPct * 100)} aoMudar={(v) => set((x) => ({ ...x, financiamento: { ...x.financiamento, entradaPct: v / 100 } }))} />
        <label className="block">
          <span className="rotulo">Prazo</span>
          <select className="campo" value={p.financiamento.prazoMeses} onChange={(e) => set((x) => ({ ...x, financiamento: { ...x.financiamento, prazoMeses: Number(e.target.value) } }))}>
            {[12, 24, 36, 48, 60].map((n) => <option key={n} value={n}>{n} meses</option>)}
          </select>
        </label>
        <CampoNumero
          rotulo="Juros (% ao mês)"
          passo={0.05}
          valor={Number((p.financiamento.taxaMes * 100).toFixed(2))}
          aoMudar={(v) => set((x) => ({ ...x, financiamento: { ...x.financiamento, taxaMes: v / 100 } }))}
          ajuda={bonificada ? `Com taxa bonificada: ${pct(derivados.premissasEfetivas.financiamento.taxaMes, 2)} a.m.` : `= ${pct(taxaAnual(p.financiamento.taxaMes))} ao ano`}
        />
        <CampoNumero rotulo="IOF e tarifas (% financiado)" passo={0.5} valor={Number((p.financiamento.custosContratacaoPct * 100).toFixed(1))} aoMudar={(v) => set((x) => ({ ...x, financiamento: { ...x.financiamento, custosContratacaoPct: v / 100 } }))} />
      </div>
    );
  if (m === 'leasing')
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <CampoNumero rotulo="Entrada (%)" valor={Math.round(p.leasing.entradaPct * 100)} aoMudar={(v) => set((x) => ({ ...x, leasing: { ...x.leasing, entradaPct: v / 100 } }))} />
        <CampoNumero rotulo="Juros (% ao mês)" passo={0.05} valor={Number((p.leasing.taxaMes * 100).toFixed(2))} aoMudar={(v) => set((x) => ({ ...x, leasing: { ...x.leasing, taxaMes: v / 100 } }))} />
        <CampoNumero rotulo="Valor final (% do preço)" valor={Math.round(p.leasing.residualPct * 100)} aoMudar={(v) => set((x) => ({ ...x, leasing: { ...x.leasing, residualPct: v / 100 } }))} />
      </div>
    );
  if (m === 'assinatura')
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <CampoNumero rotulo="Mensalidade (% do preço)" passo={0.1} valor={Number((p.assinatura.mensalidadePctPreco * 100).toFixed(1))} aoMudar={(v) => set((x) => ({ ...x, assinatura: { ...x.assinatura, mensalidadePctPreco: v / 100 } }))} />
        <CampoNumero rotulo="Franquia (km/mês)" passo={100} valor={p.assinatura.franquiaKmMes} aoMudar={(v) => set((x) => ({ ...x, assinatura: { ...x.assinatura, franquiaKmMes: v } }))} />
        <CampoNumero rotulo="Km excedente (R$/km)" passo={0.05} valor={p.assinatura.excedentePorKm} aoMudar={(v) => set((x) => ({ ...x, assinatura: { ...x.assinatura, excedentePorKm: v } }))} />
      </div>
    );
  return <p className="text-tinta-suave">Na compra à vista não há condições de crédito: só o preço do carro e os custos de uso.</p>;
}

/** Conteúdo da aba de uma forma de pagamento: explicação, condições e ranking dos veículos. */
export function ModalidadeAba({ m, opcoes, aoEscolher }: { m: Modalidade; opcoes: ResultadoOpcao[]; aoEscolher: (o: ResultadoOpcao) => void }) {
  const { dados, derivados, atualizar } = useEstado();
  const s = SOBRE_MODALIDADE[m];
  const H = dados.premissas.horizonteMeses;
  const ranking = [...opcoes].sort((a, b) => a.custoLiquido - b.custoLiquido);
  const melhorQueCabe = ranking.find((o) => o.cabeNoOrcamento && o.cabeNoDisponivel);
  const rotuloParcela = m === 'assinatura' ? 'Mensalidade' : m === 'avista' ? 'Pagamento à vista' : 'Parcela';

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Cartao titulo={<span className="flex items-center gap-2"><s.icone className="h-5 w-5 text-marca" aria-hidden />Como funciona: {NOME_MODALIDADE[m]}</span>} subtitulo={s.resumo}>
          <ul className="space-y-1.5 text-[15px]">{s.como.map((c) => <li key={c}>• {c}</li>)}</ul>
          <p className="mt-3 text-[15px]"><strong>Boa para:</strong> {s.paraQuem}</p>
          <p className="mt-2 rounded-xl bg-marca-claro px-3 py-2 text-sm text-marca-profundo"><strong>Atenção:</strong> {s.atencao}</p>
        </Cartao>
        <Cartao titulo="Condições desta modalidade" subtitulo="Hipóteses editáveis, não são ofertas. Mude e veja os veículos abaixo recalcularem.">
          <Condicoes m={m} />
          <p className="mt-3"><Selo tipo="hipotese" /></p>
        </Cartao>
      </div>

      <section aria-label={`Veículos em ${NOME_MODALIDADE[m]}`}>
        <h2 className="mb-1 text-xl font-bold">Veículos em {NOME_MODALIDADE[m].toLowerCase()}</h2>
        <p className="mb-3 text-sm text-tinta-suave">Do menor para o maior custo total em {H} meses, com {fmtKm(derivados.km.kmMensal)} por mês.</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ranking.map((o) => {
            const v = veiculoPorId(o.veiculoId);
            const destaque = o === melhorQueCabe;
            return (
              <article key={o.veiculoId} className={`cartao border-2 ${destaque ? 'border-marca' : 'border-transparent'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-tinta-suave">{NOME_TECNOLOGIA[v.tecnologia]} · {v.categoria}</p>
                    <h3 className="text-lg font-bold leading-tight">{v.nome.replace(' (fictício)', '')}</h3>
                  </div>
                  {destaque && <span className="chip shrink-0 bg-marca text-white">Melhor opção</span>}
                </div>
                <p className="mt-3 text-sm text-tinta-suave">{rotuloParcela}</p>
                <p className="text-3xl font-bold tabular-nums text-marca">{reais(m === 'avista' ? o.desembolsoInicial : o.parcelaMensal)}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-tinta-suave">Entrada</dt><dd className="font-semibold">{m === 'avista' ? '—' : o.desembolsoInicial ? reais(o.desembolsoInicial) : 'Sem entrada'}</dd></div>
                  <div><dt className="text-tinta-suave">Total por mês</dt><dd className="font-semibold">{reais(o.desembolsoMensal)}</dd></div>
                  <div><dt className="text-tinta-suave">Custo em {H} meses</dt><dd className="font-semibold">{reais(o.custoLiquido)}</dd></div>
                  <div><dt className="text-tinta-suave">Custo por km</dt><dd className="font-semibold">{reais(o.custoPorKm, 2)}</dd></div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className={`chip ${o.cabeNoOrcamento ? 'bg-ok-fundo text-ok' : 'bg-marca-suave text-marca-profundo'}`}>{o.cabeNoOrcamento ? '✓ cabe no mês' : 'acima do orçamento'}</span>
                  <span className={`chip ${o.cabeNoDisponivel ? 'bg-ok-fundo text-ok' : 'bg-marca-suave text-marca-profundo'}`}>{o.cabeNoDisponivel ? '✓ cabe na entrada' : 'entrada acima do disponível'}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="botao-secundario px-3 py-2 text-sm" onClick={() => aoEscolher(o)}>Ver detalhes</button>
                  <button
                    type="button"
                    className="botao-primario px-3 py-2 text-sm"
                    onClick={() => {
                      atualizar((d) => ({ ...d, escolha: { veiculoId: o.veiculoId, modalidade: m } }));
                      irPara('simulacao');
                    }}
                  >
                    Simular →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        {ranking.length === 0 && <p className="text-tinta-suave">Selecione veículos acima para comparar.</p>}
      </section>
    </div>
  );
}
