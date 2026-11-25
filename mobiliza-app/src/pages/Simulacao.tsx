import { pct, reais } from '../components/formato';
import { Aviso, CabecalhoPagina, CampoNumero, Cartao, Indicador, NavegacaoJornada, Selo, Termo } from '../components/ui';
import { NOME_MODALIDADE, VEICULOS, veiculoPorId } from '../data/veiculos';
import { MODALIDADES, parcelaPrice, saldoDevedorPrice, taxaAnual, type Modalidade } from '../engine';
import { irPara } from '../state/rotas';
import { useEstado } from '../state/estado';

export function Simulacao() {
  const { dados, derivados, atualizar } = useEstado();
  const { escolha, premissas: p } = dados;
  const o = derivados.escolhida;
  const v = veiculoPorId(escolha.veiculoId);
  const mudarP = (f: (x: typeof p) => typeof p) => atualizar((d) => ({ ...d, premissas: f(d.premissas) }));

  // Parcelas com a taxa efetiva (bonificada, se houver relacionamento); os campos editam a taxa base
  const pe = derivados.premissasEfetivas;
  const bonificada = pe.financiamento.taxaMes < p.financiamento.taxaMes;
  const f = pe.financiamento;
  const principal = (v.preco * (1 - f.entradaPct)) * (1 + f.custosContratacaoPct);
  const pmt = parcelaPrice(principal, f.taxaMes, f.prazoMeses);
  const marcos = [1, 12, 24, 36, 48, 60].filter((m) => m <= f.prazoMeses).map((m) => {
    const saldoAntes = saldoDevedorPrice(principal, f.taxaMes, f.prazoMeses, m - 1);
    const juros = saldoAntes * f.taxaMes;
    return { m, juros, amortizacao: pmt - juros, saldo: saldoDevedorPrice(principal, f.taxaMes, f.prazoMeses, m) };
  });

  return (
    <div>
      <CabecalhoPagina pagina="simulacao" titulo="Simulação financeira demonstrativa" descricao="Ajuste a opção escolhida e veja como ficam entrada, parcelas e custo total. As condições são hipóteses, não ofertas." />

      <Cartao>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="rotulo">Veículo</span>
            <select className="campo" value={escolha.veiculoId} onChange={(e) => atualizar((d) => ({ ...d, escolha: { ...d.escolha, veiculoId: e.target.value } }))}>
              {VEICULOS.map((x) => <option key={x.id} value={x.id}>{x.nome} · {reais(x.preco)}</option>)}
            </select>
          </label>
          <fieldset>
            <legend className="rotulo">Forma de pagamento</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MODALIDADES.map((m: Modalidade) => (
                <button key={m} type="button" aria-pressed={escolha.modalidade === m} onClick={() => atualizar((d) => ({ ...d, escolha: { ...d.escolha, modalidade: m } }))} className={`rounded-xl px-2 py-2.5 text-sm font-semibold ${escolha.modalidade === m ? 'bg-marca text-white' : 'bg-tinta-fundo'}`}>
                  {NOME_MODALIDADE[m]}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </Cartao>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador destaque rotulo={o.modalidade === 'assinatura' ? 'Mensalidade' : o.modalidade === 'avista' ? 'Pagamento à vista' : 'Parcela'} valor={reais(o.modalidade === 'avista' ? o.desembolsoInicial : o.parcelaMensal)} detalhe={o.modalidade === 'financiamento' ? `${f.prazoMeses} parcelas` : o.modalidade === 'leasing' ? `${p.horizonteMeses} parcelas` : undefined} />
        <Indicador rotulo="Gasto total por mês" valor={reais(o.desembolsoMensal)} detalhe="incluindo uso do carro" />
        <Indicador rotulo="Valor no início" valor={o.desembolsoInicial ? reais(o.desembolsoInicial) : 'R$ 0'} />
        <Indicador rotulo={`Custo total em ${p.horizonteMeses} meses`} valor={reais(o.custoLiquido)} detalhe={`${reais(o.custoMensalMedio)} por mês em média`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Cartao titulo="Ajuste as condições" subtitulo="Hipóteses editáveis. Elas não representam taxas ou ofertas do banco.">
          {o.modalidade === 'financiamento' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <CampoNumero rotulo="Entrada (%)" valor={Math.round(f.entradaPct * 100)} aoMudar={(x) => mudarP((q) => ({ ...q, financiamento: { ...q.financiamento, entradaPct: x / 100 } }))} ajuda={reais(v.preco * f.entradaPct)} />
              <label className="block"><span className="rotulo">Prazo</span><select className="campo" value={f.prazoMeses} onChange={(e) => mudarP((q) => ({ ...q, financiamento: { ...q.financiamento, prazoMeses: Number(e.target.value) } }))}>{[12, 24, 36, 48, 60].map((m) => <option key={m} value={m}>{m} meses</option>)}</select></label>
              <CampoNumero rotulo="Juros sem relacionamento (% ao mês)" passo={0.05} valor={Number((p.financiamento.taxaMes * 100).toFixed(2))} aoMudar={(x) => mudarP((q) => ({ ...q, financiamento: { ...q.financiamento, taxaMes: x / 100 } }))} ajuda={bonificada ? `Com bonificação: ${pct(f.taxaMes, 2)} a.m. (${pct(taxaAnual(f.taxaMes))} a.a.)` : `= ${pct(taxaAnual(f.taxaMes))} ao ano`} />
              <CampoNumero rotulo="IOF e tarifas (% financiado)" passo={0.5} valor={Number((f.custosContratacaoPct * 100).toFixed(1))} aoMudar={(x) => mudarP((q) => ({ ...q, financiamento: { ...q.financiamento, custosContratacaoPct: x / 100 } }))} />
            </div>
          )}
          {o.modalidade === 'leasing' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <CampoNumero rotulo="Entrada (%)" valor={Math.round(p.leasing.entradaPct * 100)} aoMudar={(x) => mudarP((q) => ({ ...q, leasing: { ...q.leasing, entradaPct: x / 100 } }))} />
              <CampoNumero rotulo="Juros (% ao mês)" passo={0.05} valor={Number((p.leasing.taxaMes * 100).toFixed(2))} aoMudar={(x) => mudarP((q) => ({ ...q, leasing: { ...q.leasing, taxaMes: x / 100 } }))} />
              <CampoNumero rotulo="Valor final para ficar com o carro (%)" valor={Math.round(p.leasing.residualPct * 100)} aoMudar={(x) => mudarP((q) => ({ ...q, leasing: { ...q.leasing, residualPct: x / 100 } }))} ajuda={reais(v.preco * p.leasing.residualPct)} />
            </div>
          )}
          {o.modalidade === 'assinatura' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <CampoNumero rotulo="Mensalidade (% do preço por mês)" passo={0.1} valor={Number((p.assinatura.mensalidadePctPreco * 100).toFixed(1))} aoMudar={(x) => mudarP((q) => ({ ...q, assinatura: { ...q.assinatura, mensalidadePctPreco: x / 100 } }))} />
              <CampoNumero rotulo="Franquia (km por mês)" passo={100} valor={p.assinatura.franquiaKmMes} aoMudar={(x) => mudarP((q) => ({ ...q, assinatura: { ...q.assinatura, franquiaKmMes: x } }))} />
              <CampoNumero rotulo="Km excedente (R$ por km)" passo={0.05} valor={p.assinatura.excedentePorKm} aoMudar={(x) => mudarP((q) => ({ ...q, assinatura: { ...q.assinatura, excedentePorKm: x } }))} />
            </div>
          )}
          {o.modalidade === 'avista' && <p>Na compra à vista não há juros. Você paga o valor total no início e fica com o carro.</p>}
          <p className="mt-3"><Selo tipo="hipotese" /></p>
        </Cartao>

        <Cartao titulo="Entenda os termos">
          <ul className="space-y-3 text-[15px]">
            <li><Termo termo="Juros">O valor cobrado por emprestar o dinheiro. Neste exemplo, {pct(f.taxaMes, 2)} ao mês.</Termo>: quanto maior o prazo, mais juros você paga no total.</li>
            <li><Termo termo="CET">Custo Efetivo Total: soma juros, tarifas e impostos. É o número certo para comparar propostas de bancos diferentes.</Termo>: sempre peça esse número na proposta real.</li>
            <li><Termo termo="Valor residual">Quanto o carro ainda vale no fim do período. Aqui é uma estimativa com depreciação de {pct(p.depreciacaoPctAno[v.tecnologia], 0)} ao ano.</Termo>: entra como "desconto" no custo total de quem fica com o carro.</li>
            <li><Termo termo="Franquia de km">Na assinatura, quantos km por mês já estão incluídos. Acima disso, paga-se por km.</Termo>: importante para quem roda muito.</li>
          </ul>
        </Cartao>

        {o.modalidade === 'financiamento' && (
          <Cartao titulo="Como a dívida diminui" subtitulo="No começo, a maior parte da parcela é juros; no fim, é a dívida.">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-tinta-suave"><th className="py-2">Parcela</th><th className="text-right">Juros</th><th className="text-right">Abate da dívida</th><th className="text-right">Ainda deve</th></tr></thead>
              <tbody>
                {marcos.map((x) => (
                  <tr key={x.m} className="border-b"><td className="py-2">{x.m}ª</td><td className="text-right tabular-nums">{reais(x.juros)}</td><td className="text-right tabular-nums">{reais(x.amortizacao)}</td><td className="text-right tabular-nums">{reais(x.saldo)}</td></tr>
                ))}
              </tbody>
            </table>
          </Cartao>
        )}

        <Cartao titulo="Cabe no seu orçamento?">
          {o.cabeNoOrcamento && o.cabeNoDisponivel ? (
            <Aviso tipo="ok">Sim: {reais(o.desembolsoMensal)} por mês (seu limite é {reais(dados.perfil.orcamentoMensal)}) e {reais(o.desembolsoInicial)} no início (você tem {reais(dados.perfil.valorDisponivel)}).</Aviso>
          ) : (
            <Aviso tipo="atencao">
              {!o.cabeNoOrcamento && <>O gasto mensal de {reais(o.desembolsoMensal)} passa do seu limite de {reais(dados.perfil.orcamentoMensal)}. </>}
              {!o.cabeNoDisponivel && <>O valor inicial de {reais(o.desembolsoInicial)} é maior que os {reais(dados.perfil.valorDisponivel)} disponíveis. </>}
              Tente outro prazo, outra entrada ou outra forma de pagamento.
            </Aviso>
          )}
          <p className="mt-3 text-sm text-tinta-suave">Condições reais dependem de análise de crédito. Este protótipo não aprova nem reserva crédito.</p>
        </Cartao>
      </div>

      <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-marca p-5 text-white">
        <div>
          <p className="text-lg font-bold">{bonificada ? `Taxa bonificada aplicada: ${pct(f.taxaMes, 2)} ao mês` : 'Quer uma taxa menor?'}</p>
          <p className="text-white/90">{bonificada ? 'Veja ou ajuste seu relacionamento com o banco.' : 'Simule a abertura de conta Santander e a portabilidade de salário.'}</p>
        </div>
        <button type="button" className="botao bg-white text-marca hover:bg-marca-claro" onClick={() => irPara('conta')}>
          {bonificada ? 'Ver conta e taxa' : 'Abrir conta Santander'} →
        </button>
      </section>

      <NavegacaoJornada pagina="simulacao" rotuloContinuar="Abrir conta e ver a taxa bonificada" />
    </div>
  );
}
