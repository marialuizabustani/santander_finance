import { useMemo } from 'react';
import { AlertTriangle, BatteryCharging, Check, PlugZap, Route } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { km as fmtKm, num, reais } from '../components/formato';
import { CORES_TRAJETO, Mapa, type LinhaMapa } from '../components/Mapa';
import { Aviso, CabecalhoPagina, Cartao, Indicador, Interruptor, Selo } from '../components/ui';
import { CARREGADORES_FICTICIOS } from '../data/carregadores';
import { VEICULOS, veiculoPorId } from '../data/veiculos';
import { autonomia, calcularOpcao, consumoEfetivoKwh100, energiaMensal, precoMedioKwh } from '../engine';
import { useEstado } from '../state/estado';
import { irPara } from '../state/rotas';

const ROTULO = { adequado: 'Combina com a sua rotina', atencao: 'Combina, com atenção', inadequado: 'Não combina com a rotina atual' };
const COR = { adequado: 'bg-ok', atencao: 'bg-marca-profundo', inadequado: 'bg-tinta' };

export function Eletrico() {
  const { dados, derivados, rotas, atualizar } = useEstado();
  const ev = veiculoPorId(dados.veiculoEletricoId);
  const ref = veiculoPorId(dados.veiculoReferenciaCombustaoId);
  const an = derivados.eletrico[ev.id];
  const { km } = derivados;
  const c = dados.condicoesEletrico;
  const H = dados.premissas.horizonteMeses;

  const linhas: LinhaMapa[] = useMemo(
    () => dados.rotina.trajetos.map((t, i) => ({ id: t.id, pontos: rotas[t.id]?.geometria ?? [], cor: CORES_TRAJETO[i % CORES_TRAJETO.length], tracejada: rotas[t.id]?.origem !== 'rota-real', rotulo: t.nome })),
    [dados.rotina.trajetos, rotas],
  );
  const grafico = [
    { nome: `Recarga (${dados.rotina.recargaEmCasa ? 'mais em casa' : 'mais na rua'})`, valor: an.custoRecargaMes, cor: '#EC0000' },
    { nome: `Gasolina (${ref.nome.replace(' (fictício)', '')})`, valor: an.custoCombustivelMes, cor: '#3D3D3D' },
  ];
  const usoAutonomia = an.autonomiaPlanejadaKm ? Math.min(1, km.maiorDiaKm / an.autonomiaPlanejadaKm) : 0;

  return (
    <div>
      <CabecalhoPagina titulo="Mobilidade Elétrica" descricao="Veja se um carro elétrico combina com a sua rotina, quanto você gastaria com recarga e onde carregar.">
        <div className="flex flex-wrap gap-2 text-sm"><Selo tipo="real" /><Selo tipo="estimativa" /><Selo tipo="ficticio" /></div>
      </CabecalhoPagina>

      <section className="overflow-hidden rounded-3xl bg-marca text-white" aria-label="Santander e a mobilidade elétrica">
        <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[auto_1fr] md:items-center">
          <div className="text-center md:text-left">
            <p className="text-5xl font-bold leading-none sm:text-6xl">50–60%<sup className="text-2xl">¹</sup></p>
            <p className="mt-1 text-white/90">dos veículos elétricos financiados no Brasil</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">O Santander é protagonista no financiamento de elétricos</h2>
            <p className="mt-2 text-white/90">
              Por isso o Mobiliza tem uma área só para elétricos: autonomia, recarga e custo comparados com a sua rotina real, e a simulação do financiamento no mesmo lugar.
            </p>
          </div>
        </div>
        <p className="bg-black/10 px-6 py-2 text-xs text-white/85 sm:px-8">
          ¹ Dado citado pela banca avaliadora do Santander no feedback deste projeto acadêmico. Confirme a fonte oficial antes de qualquer uso externo.
        </p>
      </section>

      <h2 className="mb-3 mt-8 text-xl font-bold">Catálogo de elétricos</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {VEICULOS.filter((v) => v.tecnologia === 'eletrico').map((v) => {
          const aut = autonomia(v, c, dados.premissas);
          const fin = calcularOpcao(v, 'financiamento', { kmMensal: km.kmMensal, recargaEmCasa: dados.rotina.recargaEmCasa, premissas: derivados.premissasEfetivas, perfil: dados.perfil });
          const ativo = v.id === ev.id;
          return (
            <article key={v.id} className={`cartao border-2 ${ativo ? 'border-marca' : 'border-transparent'}`}>
              <p className="text-sm text-tinta-suave">{v.categoria} · bateria {v.bateriaKwh} kWh</p>
              <h3 className="text-lg font-bold">{v.nome}</h3>
              <p className="text-xl font-bold text-marca">{reais(v.preco)}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-tinta-suave">Autonomia estimada</dt><dd className="font-semibold">{fmtKm(aut.estimadaKm)}</dd></div>
                <div><dt className="text-tinta-suave">Recarga por mês</dt><dd className="font-semibold">{reais(energiaMensal(v, km.kmMensal, dados.rotina.recargaEmCasa, dados.premissas))}</dd></div>
                <div><dt className="text-tinta-suave">Parcela estimada</dt><dd className="font-semibold">{reais(fin.parcelaMensal)}</dd></div>
                <div><dt className="text-tinta-suave">Total por mês</dt><dd className="font-semibold">{reais(fin.desembolsoMensal)}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={ativo ? 'botao-primario px-3 py-2 text-sm' : 'botao-secundario px-3 py-2 text-sm'} onClick={() => atualizar((d) => ({ ...d, veiculoEletricoId: v.id }))}>
                  {ativo ? '✓ Em análise' : 'Analisar este'}
                </button>
                <button
                  type="button"
                  className="botao-discreto px-3 py-2 text-sm"
                  onClick={() => {
                    atualizar((d) => ({ ...d, escolha: { veiculoId: v.id, modalidade: 'financiamento' } }));
                    irPara('simulacao');
                  }}
                >
                  Simular financiamento →
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-tinta-suave">Modelos e preços fictícios. Parcelas com as premissas do protótipo{derivados.premissasEfetivas.financiamento.taxaMes < dados.premissas.financiamento.taxaMes ? ', já com a taxa bonificada' : ''}. <Selo tipo="ficticio" /></p>

      <h2 className="mb-3 mt-8 text-xl font-bold">Combina com a sua rotina?</h2>
      {km.kmMensal === 0 && <Aviso>Cadastre sua rotina (ou carregue o cenário demonstrativo) para personalizar esta análise.</Aviso>}

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <Cartao titulo="Simulador de autonomia">
            <label className="block">
              <span className="rotulo">Carro elétrico</span>
              <select className="campo" value={ev.id} onChange={(e) => atualizar((d) => ({ ...d, veiculoEletricoId: e.target.value }))}>
                {VEICULOS.filter((v) => v.tecnologia === 'eletrico').map((v) => <option key={v.id} value={v.id}>{v.nome} · bateria {v.bateriaKwh} kWh</option>)}
              </select>
            </label>
            <label className="mt-4 block">
              <span className="rotulo">Quanto do seu uso é em estrada? {Math.round(c.fracaoRodovia * 100)}%</span>
              <input type="range" min={0} max={1} step={0.05} value={c.fracaoRodovia} className="w-full accent-marca" onChange={(e) => atualizar((d) => ({ ...d, condicoesEletrico: { ...d.condicoesEletrico, fracaoRodovia: Number(e.target.value) } }))} />
              <span className="ajuda">Em estrada, a velocidade maior gasta mais bateria.</span>
            </label>
            <div className="mt-4">
              <Interruptor rotulo="Uso ar-condicionado com frequência" ligado={c.arCondicionado} aoMudar={(v) => atualizar((d) => ({ ...d, condicoesEletrico: { ...d.condicoesEletrico, arCondicionado: v } }))} />
            </div>
            <div className="mt-4">
              <Interruptor rotulo="Tenho recarga em casa" ligado={dados.rotina.recargaEmCasa} aoMudar={(v) => atualizar((d) => ({ ...d, rotina: { ...d.rotina, recargaEmCasa: v } }))} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Indicador rotulo="Autonomia estimada" valor={fmtKm(an.autonomiaEstimadaKm)} detalhe={`consumo ${num(consumoEfetivoKwh100(ev, c))} kWh/100 km`} />
              <Indicador rotulo="Para planejar com folga" valor={fmtKm(an.autonomiaPlanejadaKm)} detalhe={`margem de ${Math.round(dados.premissas.eletrico.margemSegurancaPct * 100)}%`} />
            </div>
            <p className="mt-2 text-xs text-tinta-suave">Estimativa a partir de bateria e consumo de um modelo fictício. A autonomia real varia com relevo, temperatura e forma de dirigir.</p>
          </Cartao>

          <Cartao titulo="Compatibilidade com a sua rotina">
            <p className={`inline-block rounded-full px-3 py-1 text-sm font-semibold text-white ${COR[an.adequacao]}`}>{ROTULO[an.adequacao]}</p>
            <div className="mt-4">
              <p className="text-sm text-tinta-suave">Seu dia mais longo usa {Math.round(usoAutonomia * 100)}% da autonomia segura</p>
              <div className="mt-1 h-3 rounded-full bg-tinta-fundo"><div className={`h-3 rounded-full ${usoAutonomia > 0.85 ? 'bg-marca-profundo' : 'bg-ok'}`} style={{ width: `${usoAutonomia * 100}%` }} /></div>
            </div>
            <ul className="mt-4 space-y-2 text-[15px]">{an.motivos.map((m) => <li key={m}>• {m}</li>)}</ul>
            <p className="mt-3 text-sm text-tinta-suave">Recargas por semana: cerca de {num(an.recargasPorSemana)} (uma a cada {num(an.diasEntreRecargas, 0)} dia(s) de uso).</p>
          </Cartao>
        </div>

        <div className="space-y-6">
          <Cartao titulo="Mapa de carregadores" subtitulo="Pontos de recarga FICTÍCIOS, só para demonstração, junto com a sua rotina.">
            <Mapa locais={dados.rotina.locais} linhas={linhas} carregadores={CARREGADORES_FICTICIOS} altura="h-[360px]" />
            <p className="mt-2 text-sm text-tinta-suave">Toque num carregador para ver potência e tipo. Em uma versão real, os pontos viriam de bases públicas ou de parceiros.</p>
          </Cartao>

          <Cartao titulo="Quanto você gasta para rodar" subtitulo={`Com ${fmtKm(km.kmMensal)} por mês`}>
            <div className="h-44">
              <ResponsiveContainer>
                <BarChart data={grafico} layout="vertical" margin={{ left: 8, right: 30 }}>
                  <CartesianGrid horizontal={false} stroke="#eee" />
                  <XAxis type="number" tickFormatter={(v) => `R$ ${v}`} fontSize={12} />
                  <YAxis type="category" dataKey="nome" width={170} fontSize={12} />
                  <Tooltip formatter={(v: number) => reais(v)} />
                  <Bar dataKey="valor" radius={[0, 6, 6, 0]} label={{ position: 'right', formatter: (v: number) => reais(v), fontSize: 12 }}>
                    {grafico.map((g) => <Cell key={g.nome} fill={g.cor} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Aviso tipo={an.economiaMes > 0 ? 'ok' : 'atencao'}>
              {an.economiaMes > 0
                ? <>Com recarga, você economizaria cerca de <strong>{reais(an.economiaMes)} por mês</strong> só em "abastecimento" ({reais(an.economiaMes * H)} em {H} meses).</>
                : <>Neste cenário, a recarga sai mais cara que a gasolina.</>}{' '}
              Preço médio considerado: {reais(precoMedioKwh(dados.rotina.recargaEmCasa, dados.premissas), 2)}/kWh. <Selo tipo="hipotese" />
            </Aviso>
            <button type="button" className="botao-secundario mt-3" onClick={() => irPara('comparador')}>Comparar o custo total (compra, seguro, IPVA) →</button>
          </Cartao>
        </div>
      </div>

      <Cartao titulo="O que considerar antes de escolher um elétrico" className="mt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className="flex items-center gap-2 font-semibold"><Route className="h-5 w-5 text-marca" aria-hidden />Viagens longas</p><p className="text-[15px] text-tinta-suave">Na estrada a autonomia cai. Planeje paradas em carregadores rápidos; uma parada de 20 a 40 minutos costuma recuperar boa parte da bateria.</p></div>
          <div><p className="flex items-center gap-2 font-semibold"><PlugZap className="h-5 w-5 text-marca" aria-hidden />Recarga em casa</p><p className="text-[15px] text-tinta-suave">É o que mais reduz o custo. Sem tomada em casa, a pessoa depende de pontos públicos, que são mais caros e podem ter fila.</p></div>
          <div><p className="flex items-center gap-2 font-semibold"><BatteryCharging className="h-5 w-5 text-marca" aria-hidden />Bateria</p><p className="text-[15px] text-tinta-suave">A capacidade diminui aos poucos com os anos. Pergunte sobre a garantia da bateria e o valor de revenda.</p></div>
        </div>
        {an.viagens.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead><tr className="border-b text-left text-tinta-suave"><th className="py-2">Viagem</th><th>Ida</th><th>Maior trecho</th><th>Paradas para recarga na ida</th></tr></thead>
              <tbody>
                {an.viagens.map((v) => (
                  <tr key={v.viagem.id} className="border-b">
                    <td className="py-2">{v.viagem.nome}</td>
                    <td>{fmtKm(v.viagem.kmIdaEVolta / 2)}</td>
                    <td>{fmtKm(v.viagem.maiorTrechoKm)} {v.trechoCabe ? <Check className="inline h-4 w-4 text-ok" aria-label="cabe na autonomia" /> : <AlertTriangle className="inline h-4 w-4 text-marca-profundo" aria-label="maior que a autonomia segura" />}</td>
                    <td>{v.paradasNaIda === 0 ? 'nenhuma' : v.paradasNaIda}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>
    </div>
  );
}
