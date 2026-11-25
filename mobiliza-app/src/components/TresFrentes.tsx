import { useState, type ReactNode } from 'react';
import { km as fmtKm, reais } from './formato';
import { Selo } from './ui';
import { NOME_MODALIDADE, VEICULOS, veiculoPorId } from '../data/veiculos';
import { calcularOpcao, custosMensais, type ResultadoOpcao } from '../engine';
import { useEstado } from '../state/estado';
import { irPara } from '../state/rotas';

type Frente = 'eletrico' | 'combustao' | 'contrato';

const IPVA_ELETRICO = [
  { v: 0, t: 'Isento' },
  { v: 0.02, t: 'Reduzido (2%)' },
  { v: 0.04, t: 'Integral (4%)' },
];

/**
 * Comparativo em três frentes, lado a lado, com a quilometragem da rotina:
 * elétrico 100% financiado × combustão financiado × assinatura ou leasing.
 */
export function TresFrentes({ compacto = false }: { compacto?: boolean }) {
  const { dados, derivados, atualizar } = useEstado();
  const [contrato, setContrato] = useState<'assinatura' | 'leasing'>('assinatura');
  const [veiculoContrato, setVeiculoContrato] = useState('eletrico-compacto');
  const p = derivados.premissasEfetivas;
  const ctx = { kmMensal: derivados.km.kmMensal, recargaEmCasa: dados.rotina.recargaEmCasa, premissas: p, perfil: dados.perfil };
  const H = p.horizonteMeses;

  const ev = calcularOpcao(veiculoPorId(dados.veiculoEletricoId), 'financiamento', ctx);
  const cb = calcularOpcao(veiculoPorId(dados.veiculoReferenciaCombustaoId), 'financiamento', ctx);
  const ct = calcularOpcao(veiculoPorId(veiculoContrato), contrato, ctx);
  const colunas: { frente: Frente; o: ResultadoOpcao; titulo: string; cor: string }[] = [
    { frente: 'eletrico', o: ev, titulo: 'Elétrico 100%', cor: '#EC0000' },
    { frente: 'combustao', o: cb, titulo: 'Combustão', cor: '#3D3D3D' },
    { frente: 'contrato', o: ct, titulo: contrato === 'assinatura' ? 'Assinatura' : 'Leasing', cor: '#990000' },
  ];
  const menor = colunas.reduce((a, b) => (b.o.custoLiquido < a.o.custoLiquido ? b : a));
  const mesCb = custosMensais(cb);

  const linha = (rotulo: ReactNode, f: (o: ResultadoOpcao, fr: Frente) => ReactNode, destaque = false) => (
    <tr className={`border-b border-tinta-linha ${destaque ? 'font-bold' : ''}`}>
      <th scope="row" className="py-2.5 pr-2 text-left text-[15px] font-medium text-tinta-suave">{rotulo}</th>
      {colunas.map((c) => (
        <td key={c.frente} className={`py-2.5 text-right tabular-nums ${c === menor ? 'bg-marca-claro' : ''}`}>{f(c.o, c.frente)}</td>
      ))}
    </tr>
  );
  const incluso = <span className="chip bg-ok-fundo text-ok">incluso</span>;

  return (
    <section className="cartao" aria-label="Comparativo em três frentes">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Lado a lado: elétrico × combustão × {contrato === 'assinatura' ? 'assinatura' : 'leasing'}</h2>
          <p className="text-sm text-tinta-suave">
            Com a sua rotina de <strong>{fmtKm(derivados.km.kmMensal)} por mês</strong>, em {H} meses. Além da parcela: energia, manutenção preventiva, IPVA e seguro.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl bg-tinta-fundo p-1" role="radiogroup" aria-label="Terceira frente">
          {(['assinatura', 'leasing'] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={contrato === m} onClick={() => setContrato(m)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${contrato === m ? 'bg-white text-marca shadow' : 'text-tinta-suave'}`}>
              {NOME_MODALIDADE[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-[15px]">
          <thead>
            <tr>
              <th className="w-[30%]" />
              {colunas.map((c) => (
                <th key={c.frente} className={`rounded-t-xl px-2 pb-2 pt-3 text-right align-top ${c === menor ? 'bg-marca-claro' : ''}`}>
                  <span className="block text-base font-bold" style={{ color: c.cor }}>{c.titulo}</span>
                  {c.frente === 'contrato' ? (
                    <select className="mt-1 w-full rounded-lg border border-tinta-linha bg-white px-1 py-1 text-xs font-normal" value={veiculoContrato} onChange={(e) => setVeiculoContrato(e.target.value)} aria-label="Veículo da assinatura ou leasing">
                      {VEICULOS.map((v) => <option key={v.id} value={v.id}>{v.nome.replace(' (fictício)', '')}</option>)}
                    </select>
                  ) : (
                    <select
                      className="mt-1 w-full rounded-lg border border-tinta-linha bg-white px-1 py-1 text-xs font-normal"
                      value={c.o.veiculoId}
                      aria-label={`Veículo ${c.titulo}`}
                      onChange={(e) => atualizar((d) => (c.frente === 'eletrico' ? { ...d, veiculoEletricoId: e.target.value } : { ...d, veiculoReferenciaCombustaoId: e.target.value }))}
                    >
                      {VEICULOS.filter((v) => v.tecnologia === (c.frente === 'eletrico' ? 'eletrico' : 'combustao')).map((v) => <option key={v.id} value={v.id}>{v.nome.replace(' (fictício)', '')}</option>)}
                    </select>
                  )}
                  <span className="mt-1 block text-xs font-normal text-tinta-suave">{c.frente === 'contrato' ? NOME_MODALIDADE[contrato] : 'Financiamento'}</span>
                  {c === menor && <span className="chip mt-1 bg-marca text-white">★ menor custo total</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linha('Entrada', (o) => (o.desembolsoInicial ? reais(o.desembolsoInicial) : 'Sem entrada'))}
            {linha('Parcela ou mensalidade', (o) => reais(o.parcelaMensal))}
            {linha('Energia (recarga ou combustível)', (o) => reais(custosMensais(o).energia))}
            {linha('Manutenção preventiva e desgaste', (o, f) => (f === 'contrato' && contrato === 'assinatura' ? incluso : reais(custosMensais(o).manutencao)))}
            {linha(
              'IPVA (média por mês)',
              (o, f) =>
                f === 'contrato' && contrato === 'assinatura' ? incluso : (
                  <span className="inline-flex items-center gap-1">
                    {o.tecnologia === 'eletrico' && p.ipvaPctAno.eletrico < p.ipvaPctAno.combustao && (
                      <span className="chip bg-ok-fundo text-ok">{p.ipvaPctAno.eletrico === 0 ? 'isento' : 'reduzido'}</span>
                    )}
                    {reais(custosMensais(o).ipva)}
                  </span>
                ),
            )}
            {linha('Seguro (média por mês)', (o, f) => (f === 'contrato' && contrato === 'assinatura' ? <span className="chip bg-ok-fundo text-ok">incluso na mensalidade</span> : reais(custosMensais(o).seguro)))}
            {ct.composicao.excedenteKm > 0 && linha('Km acima da franquia', (o) => (o.modalidade === 'assinatura' ? reais(custosMensais(o).excedenteKm) : '—'))}
            {linha('Total por mês', (o) => <span className={o.cabeNoOrcamento ? '' : 'text-marca-profundo'}>{reais(o.desembolsoMensal)}</span>, true)}
            {linha(`Custo total em ${H} meses`, (o) => reais(o.custoLiquido), true)}
            {linha('Economia por mês vs. combustão', (o, f) => {
              if (f === 'combustao') return '—';
              const dif = mesCb.total - custosMensais(o).total;
              return <span className={dif >= 0 ? 'text-ok' : 'text-marca-profundo'}>{dif >= 0 ? `− ${reais(dif)}` : `+ ${reais(-dif)}`}</span>;
            })}
          </tbody>
        </table>
      </div>

      {!compacto && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold">IPVA do elétrico no seu estado:</span>
          {IPVA_ELETRICO.map((x) => (
            <button
              key={x.t}
              type="button"
              aria-pressed={p.ipvaPctAno.eletrico === x.v}
              onClick={() => atualizar((d) => ({ ...d, premissas: { ...d.premissas, ipvaPctAno: { ...d.premissas.ipvaPctAno, eletrico: x.v } } }))}
              className={`rounded-full border px-3 py-1 ${p.ipvaPctAno.eletrico === x.v ? 'border-marca bg-marca text-white' : 'border-tinta-linha bg-white'}`}
            >
              {x.t}
            </button>
          ))}
          <span className="text-tinta-suave">Isenção e alíquota variam por estado. <Selo tipo="hipotese" /></span>
        </div>
      )}
      <p className="mt-3 text-sm text-tinta-suave">
        "Total por mês" é o que sai do bolso (parcela + uso). O custo total já desconta quanto o carro vale no fim; na assinatura, o carro é devolvido.
        {compacto && (
          <button type="button" className="ml-2 font-semibold text-marca underline" onClick={() => irPara('comparador')}>Ver comparação completa</button>
        )}
      </p>
    </section>
  );
}
