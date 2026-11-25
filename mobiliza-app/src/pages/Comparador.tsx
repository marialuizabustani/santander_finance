import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { km as fmtKm, pct, reais } from '../components/formato';
import { TresFrentes } from '../components/TresFrentes';
import { Aviso, CabecalhoPagina, CampoNumero, Cartao, NavegacaoJornada, Selo, Termo } from '../components/ui';
import { NOME_MODALIDADE, NOME_TECNOLOGIA, VEICULOS, veiculoPorId } from '../data/veiculos';
import { compararTudo, MODALIDADES, type Modalidade, type ResultadoOpcao, type Tecnologia } from '../engine';
import { useEstado } from '../state/estado';
import { irPara } from '../state/rotas';

export const COR_TEC: Record<Tecnologia, string> = { eletrico: '#EC0000', hibrido: '#EA6F5D', combustao: '#3D3D3D' };
const nomeCurto = (o: ResultadoOpcao) => `${veiculoPorId(o.veiculoId).nome.replace(' (fictício)', '')} · ${NOME_MODALIDADE[o.modalidade]}`;

function DicaGrafico({ active, payload }: { active?: boolean; payload?: { payload: ResultadoOpcao }[] }) {
  if (!active || !payload?.length) return null;
  const o = payload[0].payload;
  return (
    <div className="rounded-xl bg-white p-3 text-sm shadow-lg">
      <p className="font-semibold">{nomeCurto(o)}</p>
      <p>Custo médio: {reais(o.custoMensalMedio)}/mês</p>
      <p>Gasto mensal: {reais(o.desembolsoMensal)}</p>
      <p>Custo por km: {reais(o.custoPorKm, 2)}</p>
    </div>
  );
}

export function Comparador() {
  const { dados, derivados, atualizar } = useEstado();
  const { opcoes, km, recomendacao } = derivados;
  const p = dados.premissas;
  const [filtro, setFiltro] = useState<Modalidade | 'todas'>('todas');
  const [selecionada, setSelecionada] = useState<string | null>(null);

  const visiveis = useMemo(() => [...opcoes].filter((o) => filtro === 'todas' || o.modalidade === filtro).sort((a, b) => a.custoMensalMedio - b.custoMensalMedio), [opcoes, filtro]);
  const chave = (o: ResultadoOpcao) => `${o.veiculoId}|${o.modalidade}`;
  const recomendada = recomendacao.melhor ? chave(recomendacao.melhor) : null;
  const atual = visiveis.find((o) => chave(o) === selecionada) ?? recomendacao.melhor ?? visiveis[0];

  const mudarPremissa = (f: (x: typeof p) => typeof p) => atualizar((d) => ({ ...d, premissas: f(d.premissas) }));

  // Sensibilidade: custo médio mensal da melhor opção de cada tecnologia conforme a quilometragem
  const sensibilidade = useMemo(() => {
    const veiculos = VEICULOS.filter((v) => dados.veiculosComparados.includes(v.id));
    const tecs = [...new Set(veiculos.map((v) => v.tecnologia))];
    const pontos = [];
    for (let k = 250; k <= 3500; k += 250) {
      const ops = compararTudo(veiculos, { kmMensal: k, recargaEmCasa: dados.rotina.recargaEmCasa, premissas: derivados.premissasEfetivas }, filtro === 'todas' ? MODALIDADES : [filtro]);
      const linha: Record<string, number> = { km: k };
      for (const t of tecs) linha[t] = Math.round(Math.min(...ops.filter((o) => o.tecnologia === t).map((o) => o.custoMensalMedio)));
      pontos.push(linha);
    }
    return { pontos, tecs };
  }, [dados.veiculosComparados, dados.rotina.recargaEmCasa, derivados.premissasEfetivas, filtro]);

  if (km.kmMensal === 0) {
    return (
      <div>
        <CabecalhoPagina pagina="comparador" titulo="Comparação de alternativas" descricao="As comparações usam a sua quilometragem mensal." />
        <Aviso>Cadastre sua rotina primeiro (ou carregue o cenário demonstrativo).</Aviso>
        <button type="button" className="botao-primario mt-4" onClick={() => irPara('rotina')}>Ir para Minha Rotina</button>
      </div>
    );
  }

  const comp = atual?.composicao;
  const partes = comp
    ? [
        { nome: 'Perda de valor do carro', v: comp.depreciacao },
        { nome: 'Juros e custos do contrato', v: comp.juros },
        { nome: 'Mensalidades da assinatura', v: comp.mensalidades },
        { nome: atual.tecnologia === 'eletrico' ? 'Recarga (eletricidade)' : 'Combustível', v: comp.energia },
        { nome: 'Seguro', v: comp.seguro },
        { nome: 'IPVA', v: comp.ipva },
        { nome: 'Manutenção', v: comp.manutencao },
        { nome: 'Km acima da franquia', v: comp.excedenteKm },
      ].filter((x) => x.v > 0.5)
    : [];

  return (
    <div>
      <CabecalhoPagina
        pagina="comparador"
        titulo="Comparação de alternativas"
        descricao={`Todas as opções comparadas no mesmo período de ${p.horizonteMeses} meses, com a sua quilometragem de ${fmtKm(km.kmMensal)} por mês.`}
      />

      <TresFrentes />

      <h2 className="mb-3 mt-8 text-xl font-bold">Todas as combinações</h2>
      <Cartao titulo="O que comparar">
        <div className="flex flex-wrap gap-2">
          {VEICULOS.map((v) => {
            const ativo = dados.veiculosComparados.includes(v.id);
            return (
              <button
                key={v.id}
                type="button"
                aria-pressed={ativo}
                onClick={() =>
                  atualizar((d) => ({
                    ...d,
                    veiculosComparados: ativo ? d.veiculosComparados.filter((x) => x !== v.id) : [...d.veiculosComparados, v.id],
                  }))
                }
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${ativo ? 'border-transparent text-white' : 'border-tinta-linha bg-white text-tinta-suave'}`}
                style={ativo ? { background: COR_TEC[v.tecnologia] } : undefined}
              >
                {ativo ? '✓ ' : ''}
                {v.nome.replace(' (fictício)', '')} · {(v.preco / 1000).toFixed(0)} mil
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-tinta-suave">Veículos e preços fictícios. <Selo tipo="ficticio" /></p>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por forma de pagamento">
          {(['todas', ...MODALIDADES] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={filtro === m} onClick={() => setFiltro(m)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${filtro === m ? 'bg-marca text-white' : 'bg-tinta-fundo text-tinta'}`}>
              {m === 'todas' ? 'Todas as formas' : NOME_MODALIDADE[m]}
            </button>
          ))}
        </div>
      </Cartao>

      {opcoes.length === 0 ? (
        <Aviso tipo="atencao">Selecione pelo menos um veículo.</Aviso>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <Cartao titulo="Custo médio por mês" subtitulo="Tudo somado (compra, juros, uso e o valor do carro no fim), dividido pelos meses. Toque numa barra para ver os detalhes.">
            <div style={{ height: Math.max(220, visiveis.length * 38) }}>
              <ResponsiveContainer>
                <BarChart data={visiveis} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid horizontal={false} stroke="#eee" />
                  <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(1)} mil`} fontSize={12} />
                  <YAxis type="category" dataKey={nomeCurto} width={210} fontSize={12} />
                  <Tooltip content={<DicaGrafico />} cursor={{ fill: '#FBF1EA' }} />
                  {dados.perfil.orcamentoMensal > 0 && <ReferenceLine x={dados.perfil.orcamentoMensal} stroke="#EC0000" strokeDasharray="5 4" label={{ value: 'seu orçamento', fontSize: 11, fill: '#EC0000', position: 'top' }} />}
                  <Bar dataKey="custoMensalMedio" radius={[0, 6, 6, 0]} onClick={(d: ResultadoOpcao) => setSelecionada(chave(d))} cursor="pointer">
                    {visiveis.map((o) => (
                      <Cell key={chave(o)} fill={COR_TEC[o.tecnologia]} stroke={chave(o) === chave(atual) ? '#EC0000' : undefined} strokeWidth={3} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {(Object.keys(COR_TEC) as Tecnologia[]).map((t) => (
                <span key={t} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ background: COR_TEC[t] }} />{NOME_TECNOLOGIA[t]}</span>
              ))}
              <span className="flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dashed border-marca" />Gasto mensal que você informou</span>
            </div>
          </Cartao>

          {atual && (
            <Cartao
              titulo={nomeCurto(atual)}
              subtitulo={chave(atual) === recomendada ? '★ Recomendada para a sua rotina' : 'Opção selecionada'}
              acao={
                <button
                  type="button"
                  className="botao-primario px-3 py-2 text-sm"
                  onClick={() => {
                    atualizar((d) => ({ ...d, escolha: { veiculoId: atual.veiculoId, modalidade: atual.modalidade } }));
                    irPara('simulacao');
                  }}
                >
                  Simular esta opção
                </button>
              }
            >
              <dl className="grid grid-cols-2 gap-3">
                <div><dt className="text-sm text-tinta-suave">Gasto por mês</dt><dd className="text-xl font-bold">{reais(atual.desembolsoMensal)}</dd></div>
                <div><dt className="text-sm text-tinta-suave">No início</dt><dd className="text-xl font-bold">{atual.desembolsoInicial ? reais(atual.desembolsoInicial) : 'Sem entrada'}</dd></div>
                <div><dt className="text-sm text-tinta-suave">Custo total em {p.horizonteMeses} meses</dt><dd className="font-bold">{reais(atual.custoLiquido)}</dd></div>
                <div><dt className="text-sm text-tinta-suave">Custo por km</dt><dd className="font-bold">{reais(atual.custoPorKm, 2)}</dd></div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`chip ${atual.cabeNoOrcamento ? 'bg-ok-fundo text-ok' : 'bg-marca-suave text-marca-profundo'}`}>{atual.cabeNoOrcamento ? '✓ cabe no orçamento mensal' : 'acima do orçamento mensal'}</span>
                <span className={`chip ${atual.cabeNoDisponivel ? 'bg-ok-fundo text-ok' : 'bg-marca-suave text-marca-profundo'}`}>{atual.cabeNoDisponivel ? '✓ cabe no valor disponível' : 'exige mais que o valor disponível'}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold">Para onde vai o dinheiro</h3>
              <ul className="mt-2 space-y-1.5">
                {partes.map((x) => (
                  <li key={x.nome} className="text-sm">
                    <div className="flex justify-between"><span>{x.nome}</span><span className="tabular-nums">{reais(x.v)}</span></div>
                    <div className="h-1.5 rounded bg-tinta-fundo"><div className="h-1.5 rounded bg-marca" style={{ width: `${Math.min(100, (x.v / atual.saidasTotais) * 100)}%` }} /></div>
                  </li>
                ))}
              </ul>
              {atual.patrimonioFinal > 0 && <p className="mt-2 text-sm text-tinta-suave">O carro ainda vale cerca de {reais(atual.patrimonioFinal)} no fim (já descontado do custo). <Selo tipo="estimativa" /></p>}
              {atual.observacoes.map((o) => <p key={o} className="mt-2 text-sm text-tinta-suave">• {o}</p>)}
            </Cartao>
          )}

          <Cartao titulo="E se eu rodar mais ou menos?" subtitulo="Custo médio por mês da opção mais barata de cada tecnologia, conforme a quilometragem.">
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={sensibilidade.pontos} margin={{ right: 16, left: 4 }}>
                  <CartesianGrid stroke="#eee" />
                  <XAxis dataKey="km" tickFormatter={(v) => `${v}`} fontSize={12} label={{ value: 'km por mês', position: 'insideBottom', offset: -2, fontSize: 12 }} height={36} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(1)} mil`} fontSize={12} width={52} />
                  <Tooltip formatter={(v: number, n: string) => [reais(v), NOME_TECNOLOGIA[n as Tecnologia]]} labelFormatter={(l) => `${l} km/mês`} />
                  <Legend formatter={(n: string) => NOME_TECNOLOGIA[n as Tecnologia]} />
                  <ReferenceLine x={Math.round(km.kmMensal / 250) * 250} stroke="#EC0000" strokeDasharray="4 4" label={{ value: 'você', fill: '#EC0000', fontSize: 11, position: 'top' }} />
                  {sensibilidade.tecs.map((t) => <Line key={t} type="monotone" dataKey={t} stroke={COR_TEC[t]} strokeWidth={3} strokeDasharray={t === 'hibrido' ? '8 5' : undefined} dot={false} isAnimationActive={false} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Cartao>

          <Cartao titulo="Premissas principais" subtitulo="Hipóteses editáveis. Mude e veja tudo recalcular." acao={<button type="button" className="botao-discreto text-sm" onClick={() => irPara('premissas')}>Todas →</button>}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="rotulo">Período comparado</span>
                <select className="campo" value={p.horizonteMeses} onChange={(e) => mudarPremissa((x) => ({ ...x, horizonteMeses: Number(e.target.value) }))}>
                  {[12, 24, 36, 48, 60].map((m) => <option key={m} value={m}>{m} meses</option>)}
                </select>
              </label>
              <CampoNumero rotulo="Gasolina (R$/litro)" passo={0.1} valor={p.precoGasolinaLitro} aoMudar={(v) => mudarPremissa((x) => ({ ...x, precoGasolinaLitro: v }))} />
              <CampoNumero rotulo="Energia em casa (R$/kWh)" passo={0.05} valor={p.precoEnergiaCasaKwh} aoMudar={(v) => mudarPremissa((x) => ({ ...x, precoEnergiaCasaKwh: v }))} />
              <CampoNumero rotulo="Recarga pública (R$/kWh)" passo={0.1} valor={p.precoEnergiaPublicaKwh} aoMudar={(v) => mudarPremissa((x) => ({ ...x, precoEnergiaPublicaKwh: v }))} />
              <CampoNumero rotulo="Juros do financiamento (% ao mês)" passo={0.05} valor={Number((p.financiamento.taxaMes * 100).toFixed(2))} aoMudar={(v) => mudarPremissa((x) => ({ ...x, financiamento: { ...x.financiamento, taxaMes: v / 100 } }))} />
              <CampoNumero rotulo="Entrada do financiamento (%)" valor={Math.round(p.financiamento.entradaPct * 100)} aoMudar={(v) => mudarPremissa((x) => ({ ...x, financiamento: { ...x.financiamento, entradaPct: v / 100 } }))} />
            </div>
            <p className="mt-3 text-sm text-tinta-suave">
              <Termo termo="Custo total">Tudo o que você gasta no período (entrada, parcelas, combustível, seguro, IPVA, manutenção) menos o valor que o carro ainda tem no final.</Termo>{' '}
              considera {pct(p.depreciacaoPctAno.eletrico, 0)} de perda de valor ao ano para elétricos e {pct(p.depreciacaoPctAno.combustao, 0)} para combustão. <Selo tipo="hipotese" />
            </p>
          </Cartao>
        </div>
      )}

      <details className="cartao mt-6">
        <summary className="cursor-pointer font-semibold">Ver tabela completa</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-tinta-suave">
                <th className="py-2">Opção</th><th className="text-right">No início</th><th className="text-right">Por mês</th><th className="text-right">Custo médio/mês</th><th className="text-right">Total ({p.horizonteMeses}m)</th><th className="text-right">R$/km</th><th className="text-right">Cabe?</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((o) => (
                <tr key={chave(o)} className={`border-b ${chave(o) === recomendada ? 'bg-marca-claro font-semibold' : ''}`}>
                  <td className="py-2">{chave(o) === recomendada ? '★ ' : ''}{nomeCurto(o)}</td>
                  <td className="text-right tabular-nums">{reais(o.desembolsoInicial)}</td>
                  <td className="text-right tabular-nums">{reais(o.desembolsoMensal)}</td>
                  <td className="text-right tabular-nums">{reais(o.custoMensalMedio)}</td>
                  <td className="text-right tabular-nums">{reais(o.custoLiquido)}</td>
                  <td className="text-right tabular-nums">{reais(o.custoPorKm, 2)}</td>
                  <td className="text-right">{o.cabeNoOrcamento && o.cabeNoDisponivel ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <NavegacaoJornada pagina="comparador" rotuloContinuar="Tirar dúvidas com a Mobiliza IA" />
    </div>
  );
}
