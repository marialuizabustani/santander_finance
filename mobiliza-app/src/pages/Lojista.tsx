import { useMemo, useState } from 'react';
import { Monitor, Printer, X } from 'lucide-react';
import { km as fmtKm, pct, reais } from '../components/formato';
import { QrCode } from '../components/QrCode';
import { Aviso, CabecalhoPagina, CampoNumero, Interruptor, Selo } from '../components/ui';
import { NOME_MODALIDADE, NOME_TECNOLOGIA, VEICULOS, veiculoPorId } from '../data/veiculos';
import { aplicarBonificacao, calcularOpcao, MODALIDADES, ratingRelacionamento, type Modalidade, type Relacionamento } from '../engine';
import { gerarCodigo, linkProposta, type PropostaDemo } from '../services/proposta';
import { useEstado } from '../state/estado';

const ETAPAS = ['Atendimento', 'Veículo', 'Necessidade', 'Modalidade', 'Pacote', 'Proposta'];
const LOJAS = ['Concessionária Exemplo · Zona Sul (fictícia)', 'Revenda Modelo · Centro (fictícia)', 'Loja Parceira · ABC (fictícia)'];
/** Valor fictício de instalação de carregador residencial (wallbox). */
const WALLBOX = 4500;

export function Lojista() {
  const { dados, derivados } = useEstado();
  const [etapa, setEtapa] = useState(0);
  const [loja, setLoja] = useState(LOJAS[0]);
  const [vendedor, setVendedor] = useState('Vendedor(a) demonstração');
  const [cliente, setCliente] = useState('');
  const [veiculoId, setVeiculoId] = useState('eletrico-compacto');
  const [kmMensal, setKmMensal] = useState(Math.round(derivados.km.kmMensal) || 1200);
  const [orcamento, setOrcamento] = useState(dados.perfil.orcamentoMensal || 3500);
  const [disponivel, setDisponivel] = useState(dados.perfil.valorDisponivel || 30000);
  const [recargaEmCasa, setRecargaEmCasa] = useState(dados.rotina.recargaEmCasa);
  const [modalidade, setModalidade] = useState<Modalidade>('financiamento');
  const [pacote, setPacote] = useState({ seguro: true, conta: true, salario: true, wallbox: true });
  const [telaCliente, setTelaCliente] = useState(false);

  const v = veiculoPorId(veiculoId);
  const rel: Relacionamento = { abrirConta: pacote.conta, portabilidadeSalario: pacote.conta && pacote.salario, debitoAutomatico: pacote.conta, seguroSantander: pacote.seguro };
  const premissas = useMemo(() => aplicarBonificacao(dados.premissas, rel), [dados.premissas, pacote]);
  const ctx = { kmMensal, recargaEmCasa, premissas, perfil: { orcamentoMensal: orcamento, valorDisponivel: disponivel } };
  const opcoes = MODALIDADES.map((m) => calcularOpcao(v, m, ctx));
  const escolhida = opcoes.find((o) => o.modalidade === modalidade)!;
  const semBonus = calcularOpcao(v, modalidade, { ...ctx, premissas: dados.premissas });
  const seguroMensal = (v.preco * dados.premissas.seguroPctAno[v.tecnologia]) / 12;
  const temWallbox = v.tecnologia === 'eletrico' && pacote.wallbox;
  const taxa = modalidade === 'leasing' ? premissas.leasing.taxaMes : premissas.financiamento.taxaMes;
  const usaTaxa = modalidade === 'financiamento' || modalidade === 'leasing';

  const itens = [
    modalidade !== 'assinatura' && pacote.seguro ? `Seguro auto (demonstrativo) · ${reais(seguroMensal)}/mês` : null,
    modalidade === 'assinatura' ? 'Seguro, IPVA e manutenção inclusos na assinatura' : null,
    pacote.conta ? `Conta Santander${rel.portabilidadeSalario ? ' + portabilidade de salário' : ''} + débito automático` : null,
    temWallbox ? `Carregador residencial instalado · ${reais(WALLBOX)} (fictício)` : null,
  ].filter((x): x is string => !!x);

  const proposta: PropostaDemo = useMemo(() => {
    const base = {
      loja,
      vendedor,
      veiculoId,
      modalidade,
      kmMensal,
      entrada: Math.round(escolhida.desembolsoInicial),
      parcela: Math.round(escolhida.parcelaMensal),
      gastoMensal: Math.round(escolhida.desembolsoMensal),
      custoTotal: Math.round(escolhida.custoLiquido),
      horizonteMeses: escolhida.horizonteMeses,
      seguro: pacote.seguro && modalidade !== 'assinatura',
      seguroMensal: Math.round(seguroMensal),
      criadaEm: new Date().toISOString().slice(0, 10),
      itens,
      taxaMes: usaTaxa ? taxa : undefined,
    };
    return { ...base, codigo: gerarCodigo(JSON.stringify(base)) };
  }, [loja, vendedor, veiculoId, modalidade, kmMensal, escolhida, pacote, seguroMensal, taxa, usaTaxa]);
  const link = linkProposta(proposta);

  /** Painel que o cliente acompanha (também usado na tela cheia). */
  const Painel = ({ grande = false }: { grande?: boolean }) => (
    <div className={grande ? 'space-y-6' : 'space-y-4'}>
      <div>
        <p className={`${grande ? 'text-lg' : 'text-sm'} text-tinta-suave`}>{cliente ? `Proposta para ${cliente}` : 'Sua simulação'}</p>
        <p className={`${grande ? 'text-3xl' : 'text-xl'} font-bold`}>{v.nome.replace(' (fictício)', '')}</p>
        <p className="font-semibold text-marca">{NOME_TECNOLOGIA[v.tecnologia]} · {NOME_MODALIDADE[modalidade]}</p>
      </div>
      <div className={`rounded-2xl bg-marca text-white ${grande ? 'p-6' : 'p-4'}`}>
        <p className="text-white/85">{modalidade === 'assinatura' ? 'Mensalidade' : modalidade === 'avista' ? 'Pagamento à vista' : 'Parcela'}</p>
        <p className={`${grande ? 'text-6xl' : 'text-4xl'} font-bold tabular-nums`}>{reais(modalidade === 'avista' ? escolhida.desembolsoInicial : escolhida.parcelaMensal)}</p>
        {usaTaxa && semBonus.parcelaMensal - escolhida.parcelaMensal > 0.5 && (
          <p className="mt-1 text-white/90">
            <s>{reais(semBonus.parcelaMensal)}</s> sem relacionamento · economia de {reais(semBonus.parcelaMensal - escolhida.parcelaMensal)}/mês
          </p>
        )}
      </div>
      <dl className={`grid grid-cols-2 gap-3 ${grande ? 'text-xl' : 'text-[15px]'}`}>
        <div><dt className="text-tinta-suave">Entrada</dt><dd className="font-bold">{escolhida.desembolsoInicial ? reais(escolhida.desembolsoInicial) : 'Sem entrada'}</dd></div>
        <div><dt className="text-tinta-suave">Gasto total por mês</dt><dd className="font-bold">{reais(escolhida.desembolsoMensal)}</dd></div>
        {usaTaxa && <div><dt className="text-tinta-suave">Taxa (hipotética)</dt><dd className="font-bold">{pct(taxa, 2)} a.m.</dd></div>}
        <div><dt className="text-tinta-suave">Cabe no orçamento?</dt><dd className="font-bold">{escolhida.cabeNoOrcamento ? '✓ Sim' : 'Acima do ideal'}</dd></div>
      </dl>
      {itens.length > 0 && (
        <div>
          <p className="font-semibold">Pacote</p>
          <ul className="mt-1 space-y-1">{itens.map((i) => <li key={i}>✓ {i}</li>)}</ul>
        </div>
      )}
      <p className="text-xs text-tinta-suave">Valores fictícios e hipóteses. Não é oferta de crédito.</p>
    </div>
  );

  return (
    <div>
      <CabecalhoPagina titulo="Área do Lojista · modo balcão" descricao="Para usar na concessionária junto com o cliente: o vendedor monta a simulação e o pacote à esquerda; o cliente acompanha o resultado à direita.">
        <div className="flex items-center gap-2"><Selo tipo="demonstrativo" /><button type="button" className="botao-primario" onClick={() => setTelaCliente(true)}><Monitor className="h-4 w-4" aria-hidden /> Mostrar ao cliente</button></div>
      </CabecalhoPagina>

      <ol className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Etapas do atendimento">
        {ETAPAS.map((e, i) => (
          <li key={e}>
            <button type="button" onClick={() => setEtapa(i)} aria-current={i === etapa ? 'step' : undefined} className={`w-full rounded-xl px-2 py-2.5 text-sm font-semibold ${i === etapa ? 'bg-marca text-white' : i < etapa ? 'bg-marca-claro text-marca' : 'bg-white text-tinta-suave shadow-cartao'}`}>
              {i + 1}. {e}
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="cartao" aria-label="Painel do vendedor">
          {etapa === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="rotulo">Loja</span><select className="campo" value={loja} onChange={(e) => setLoja(e.target.value)}>{LOJAS.map((l) => <option key={l}>{l}</option>)}</select></label>
              <label className="block"><span className="rotulo">Vendedor(a)</span><input className="campo" value={vendedor} onChange={(e) => setVendedor(e.target.value)} /></label>
              <label className="block sm:col-span-2"><span className="rotulo">Como chamar o cliente (opcional)</span><input className="campo" placeholder="Ex.: Cláudia" value={cliente} onChange={(e) => setCliente(e.target.value)} /><span className="ajuda">Só um primeiro nome ou apelido. Não pedimos CPF nem documentos.</span></label>
              <div className="sm:col-span-2">
                <Aviso>Ambiente demonstrativo, sem integração com sistemas bancários. Em produção, este fluxo também poderia ser oferecido dentro de plataformas parceiras de venda de veículos.</Aviso>
              </div>
            </div>
          )}

          {etapa === 1 && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {VEICULOS.map((x) => (
                <button key={x.id} type="button" onClick={() => setVeiculoId(x.id)} aria-pressed={veiculoId === x.id} className={`rounded-2xl border-2 p-4 text-left ${veiculoId === x.id ? 'border-marca bg-marca-claro' : 'border-tinta-linha bg-white'}`}>
                  <p className="text-sm text-tinta-suave">{NOME_TECNOLOGIA[x.tecnologia]} · {x.categoria}</p>
                  <p className="font-bold">{x.nome}</p>
                  <p className="text-lg font-bold text-marca">{reais(x.preco)}</p>
                </button>
              ))}
            </div>
          )}

          {etapa === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoNumero rotulo="Quilometragem mensal do cliente" sufixo="km" passo={50} valor={kmMensal} aoMudar={setKmMensal} ajuda={derivados.km.kmMensal ? `Rotina registrada no Mobiliza: ${fmtKm(derivados.km.kmMensal)}` : 'Estimativa informada na loja'} />
              <CampoNumero rotulo="Quanto quer gastar por mês" prefixo="R$" passo={100} valor={orcamento} aoMudar={setOrcamento} />
              <CampoNumero rotulo="Valor disponível para entrada" prefixo="R$" passo={1000} valor={disponivel} aoMudar={setDisponivel} />
              {v.tecnologia === 'eletrico' && <Interruptor rotulo="Cliente tem garagem para recarga em casa" ligado={recargaEmCasa} aoMudar={setRecargaEmCasa} />}
            </div>
          )}

          {etapa === 3 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-[15px]">
                <thead><tr className="border-b text-left text-tinta-suave"><th className="py-2">Modalidade</th><th className="text-right">Entrada</th><th className="text-right">Parcela</th><th className="text-right">Gasto/mês</th><th className="text-right">Cabe?</th><th /></tr></thead>
                <tbody>
                  {opcoes.map((o) => (
                    <tr key={o.modalidade} className={`border-b ${o.modalidade === modalidade ? 'bg-marca-claro font-semibold' : ''}`}>
                      <td className="py-3">{NOME_MODALIDADE[o.modalidade]}</td>
                      <td className="text-right tabular-nums">{reais(o.desembolsoInicial)}</td>
                      <td className="text-right tabular-nums">{reais(o.parcelaMensal)}</td>
                      <td className="text-right tabular-nums">{reais(o.desembolsoMensal)}</td>
                      <td className="text-right">{o.cabeNoOrcamento && o.cabeNoDisponivel ? '✓' : '—'}</td>
                      <td className="text-right"><button type="button" className="botao-discreto py-1 text-sm" onClick={() => setModalidade(o.modalidade)}>{o.modalidade === modalidade ? 'Escolhida' : 'Escolher'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-sm text-tinta-suave">Simulado com as premissas do protótipo{pacote.conta ? ' e a taxa bonificada do pacote' : ''}. <Selo tipo="hipotese" /></p>
            </div>
          )}

          {etapa === 4 && (
            <div className="space-y-5">
              <p className="text-tinta-suave">Monte o pacote junto com o cliente. O painel à direita é atualizado na hora.</p>
              {modalidade === 'assinatura' ? (
                <Aviso tipo="ok">Na assinatura, seguro, IPVA e manutenção já estão incluídos.</Aviso>
              ) : (
                <Interruptor rotulo="Seguro auto (demonstrativo)" ajuda={`Estimativa de ${reais(seguroMensal)}/mês. Contratar com o banco também conta para a taxa bonificada.`} ligado={pacote.seguro} aoMudar={(x) => setPacote({ ...pacote, seguro: x })} />
              )}
              <Interruptor rotulo="Abrir conta Santander + débito automático" ajuda="Atalho de abertura de conta na própria loja (demonstrativo)." ligado={pacote.conta} aoMudar={(x) => setPacote({ ...pacote, conta: x })} />
              <Interruptor rotulo="Portabilidade de salário" ajuda={pacote.conta ? 'Melhora o rating de relacionamento e reduz a taxa (hipótese).' : 'Precisa da conta aberta.'} ligado={pacote.conta && pacote.salario} aoMudar={(x) => setPacote({ ...pacote, salario: x })} />
              {v.tecnologia === 'eletrico' && <Interruptor rotulo="Instalação de carregador residencial" ajuda={`${reais(WALLBOX)}, valor fictício. Mais recarga em casa, menor custo por km.`} ligado={pacote.wallbox} aoMudar={(x) => setPacote({ ...pacote, wallbox: x })} />}
              <div className="rounded-xl bg-tinta-fundo p-4">
                <p className="text-sm text-tinta-suave">Rating de relacionamento (ilustrativo)</p>
                <p className="text-xl font-bold">{ratingRelacionamento(rel).nivel} · {ratingRelacionamento(rel).pontos} pontos</p>
                {usaTaxa && <p className="text-sm">Taxa {pct(modalidade === 'leasing' ? dados.premissas.leasing.taxaMes : dados.premissas.financiamento.taxaMes, 2)} → <strong>{pct(taxa, 2)}</strong> ao mês</p>}
              </div>
            </div>
          )}

          {etapa === 5 && (
            <div className="grid gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm text-tinta-suave">Proposta fictícia</p>
                <p className="text-2xl font-bold">{proposta.codigo}</p>
                <p className="mt-1 text-[15px]">{loja} · {vendedor}</p>
                <div className="mt-4"><Aviso tipo="atencao">Proposta FICTÍCIA para demonstração. Não é oferta de crédito e não foi enviada a nenhum sistema.</Aviso></div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="botao-secundario" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden /> Imprimir</button>
                  <button type="button" className="botao-secundario" onClick={() => navigator.clipboard?.writeText(link)}>Copiar link</button>
                </div>
              </div>
              <div className="text-center">
                <div className="inline-block rounded-2xl border border-tinta-linha p-3"><QrCode texto={link} /></div>
                <p className="mt-2 max-w-[200px] text-sm text-tinta-suave">O cliente aponta a câmera e continua a jornada no próprio celular.</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between border-t border-tinta-linha pt-4">
            <button type="button" className="botao-discreto" disabled={etapa === 0} onClick={() => setEtapa(etapa - 1)}>← Voltar</button>
            {etapa < ETAPAS.length - 1 && <button type="button" className="botao-primario" onClick={() => setEtapa(etapa + 1)}>Continuar →</button>}
          </div>
        </section>

        <aside className="cartao border-2 border-marca lg:sticky lg:top-36 lg:self-start" aria-label="Painel do cliente">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-marca">Tela do cliente</p>
          <Painel />
        </aside>
      </div>

      {telaCliente && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white" role="dialog" aria-modal="true" aria-label="Tela do cliente">
          <div className="mx-auto max-w-3xl p-6 sm:p-10">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-xl font-bold">Santander <span className="text-marca">Mobiliza</span></p>
              <button type="button" className="botao-secundario" onClick={() => setTelaCliente(false)}><X className="h-4 w-4" aria-hidden /> Fechar</button>
            </div>
            <Painel grande />
          </div>
        </div>
      )}
    </div>
  );
}
