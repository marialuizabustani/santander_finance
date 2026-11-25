import { CabecalhoPagina, CampoNumero, Cartao, Selo } from '../components/ui';
import { DESCRICAO_PREMISSAS, PREMISSAS_PADRAO } from '../data/premissas';
import { NOME_TECNOLOGIA } from '../data/veiculos';
import type { Premissas as TPremissas, Tecnologia } from '../engine';
import { useEstado } from '../state/estado';

const TECS: Tecnologia[] = ['eletrico', 'hibrido', 'combustao'];

export function Premissas() {
  const { dados, atualizar } = useEstado();
  const p = dados.premissas;
  const set = (f: (x: TPremissas) => TPremissas) => atualizar((d) => ({ ...d, premissas: f(d.premissas) }));
  const porTec = (campo: 'seguroPctAno' | 'ipvaPctAno' | 'depreciacaoPctAno' | 'manutencaoPorKm', escala: number, sufixo: string, passo: number) => (
    <Cartao titulo={campo === 'manutencaoPorKm' ? 'Manutenção' : campo === 'seguroPctAno' ? 'Seguro' : campo === 'ipvaPctAno' ? 'IPVA' : 'Perda de valor (depreciação)'} subtitulo={DESCRICAO_PREMISSAS[campo]}>
      <div className="grid grid-cols-3 gap-3">
        {TECS.map((t) => (
          <CampoNumero
            key={t}
            rotulo={NOME_TECNOLOGIA[t]}
            sufixo={sufixo}
            passo={passo}
            valor={Number((p[campo][t] * escala).toFixed(3))}
            aoMudar={(v) => set((x) => ({ ...x, [campo]: { ...x[campo], [t]: v / escala } }))}
          />
        ))}
      </div>
    </Cartao>
  );

  return (
    <div>
      <CabecalhoPagina titulo="Premissas do cálculo" descricao="Todas as hipóteses usadas nas comparações. São valores ilustrativos: mude à vontade e todos os resultados são recalculados.">
        <button type="button" className="botao-secundario" onClick={() => set(() => PREMISSAS_PADRAO)}>↺ Restaurar padrões</button>
      </CabecalhoPagina>
      <p className="mb-4"><Selo tipo="hipotese" /> Nenhum valor aqui é condição comercial do Santander ou de outra instituição.</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao titulo="Uso e energia">
          <div className="grid gap-3 sm:grid-cols-2">
            <CampoNumero rotulo="Período comparado" sufixo="meses" valor={p.horizonteMeses} min={6} max={84} aoMudar={(v) => set((x) => ({ ...x, horizonteMeses: Math.max(6, Math.round(v)) }))} ajuda={DESCRICAO_PREMISSAS.horizonteMeses} />
            <CampoNumero rotulo="Semanas por mês" passo={0.1} valor={p.diasPorSemanaParaMes} aoMudar={(v) => set((x) => ({ ...x, diasPorSemanaParaMes: v }))} ajuda="5 dias × 4,4 = 22 dias no mês" />
            <CampoNumero rotulo="Gasolina" prefixo="R$" sufixo="/litro" passo={0.1} valor={p.precoGasolinaLitro} aoMudar={(v) => set((x) => ({ ...x, precoGasolinaLitro: v }))} />
            <CampoNumero rotulo="Energia em casa" prefixo="R$" sufixo="/kWh" passo={0.05} valor={p.precoEnergiaCasaKwh} aoMudar={(v) => set((x) => ({ ...x, precoEnergiaCasaKwh: v }))} />
            <CampoNumero rotulo="Recarga pública" prefixo="R$" sufixo="/kWh" passo={0.1} valor={p.precoEnergiaPublicaKwh} aoMudar={(v) => set((x) => ({ ...x, precoEnergiaPublicaKwh: v }))} />
            <CampoNumero rotulo="Recargas em casa (quem tem tomada)" sufixo="%" valor={Math.round(p.eletrico.fracaoRecargaCasaComTomada * 100)} aoMudar={(v) => set((x) => ({ ...x, eletrico: { ...x.eletrico, fracaoRecargaCasaComTomada: v / 100 } }))} />
          </div>
        </Cartao>
        <Cartao titulo="Financiamento, leasing e assinatura">
          <div className="grid gap-3 sm:grid-cols-2">
            <CampoNumero rotulo="Financiamento: juros" sufixo="% a.m." passo={0.05} valor={Number((p.financiamento.taxaMes * 100).toFixed(2))} aoMudar={(v) => set((x) => ({ ...x, financiamento: { ...x.financiamento, taxaMes: v / 100 } }))} />
            <CampoNumero rotulo="Financiamento: prazo" sufixo="meses" valor={p.financiamento.prazoMeses} aoMudar={(v) => set((x) => ({ ...x, financiamento: { ...x.financiamento, prazoMeses: Math.max(1, Math.round(v)) } }))} />
            <CampoNumero rotulo="Leasing: juros" sufixo="% a.m." passo={0.05} valor={Number((p.leasing.taxaMes * 100).toFixed(2))} aoMudar={(v) => set((x) => ({ ...x, leasing: { ...x.leasing, taxaMes: v / 100 } }))} />
            <CampoNumero rotulo="Leasing: valor final" sufixo="% do preço" valor={Math.round(p.leasing.residualPct * 100)} aoMudar={(v) => set((x) => ({ ...x, leasing: { ...x.leasing, residualPct: v / 100 } }))} />
            <CampoNumero rotulo="Assinatura: mensalidade" sufixo="% do preço" passo={0.1} valor={Number((p.assinatura.mensalidadePctPreco * 100).toFixed(1))} aoMudar={(v) => set((x) => ({ ...x, assinatura: { ...x.assinatura, mensalidadePctPreco: v / 100 } }))} />
            <CampoNumero rotulo="Assinatura: franquia" sufixo="km/mês" passo={100} valor={p.assinatura.franquiaKmMes} aoMudar={(v) => set((x) => ({ ...x, assinatura: { ...x.assinatura, franquiaKmMes: v } }))} />
          </div>
        </Cartao>
        {porTec('seguroPctAno', 100, '% a.a.', 0.1)}
        {porTec('ipvaPctAno', 100, '% a.a.', 0.1)}
        {porTec('depreciacaoPctAno', 100, '% a.a.', 0.5)}
        {porTec('manutencaoPorKm', 1, 'R$/km', 0.01)}
      </div>
    </div>
  );
}
