import { useMemo, useState } from 'react';
import { CORES_TRAJETO, COR_LOCAL, ICONE_LOCAL, Mapa, type LinhaMapa } from '../components/Mapa';
import { km as fmtKm, num } from '../components/formato';
import { Aviso, CabecalhoPagina, Cartao, Interruptor, NavegacaoJornada, Selo } from '../components/ui';
import { PONTOS_SUGERIDOS } from '../data/cenarioDemo';
import type { DiaSemana, Local, Rotina as TRotina, TipoLocal, Trajeto, ViagemLonga } from '../engine';
import { useEstado } from '../state/estado';
import { irPara } from '../state/rotas';

const novoId = () => Math.random().toString(36).slice(2, 9);
const DIAS: { d: DiaSemana; curto: string; nome: string }[] = [
  { d: 1, curto: 'S', nome: 'segunda' },
  { d: 2, curto: 'T', nome: 'terça' },
  { d: 3, curto: 'Q', nome: 'quarta' },
  { d: 4, curto: 'Q', nome: 'quinta' },
  { d: 5, curto: 'S', nome: 'sexta' },
  { d: 6, curto: 'S', nome: 'sábado' },
  { d: 0, curto: 'D', nome: 'domingo' },
];
const TIPOS: { v: TipoLocal; t: string }[] = [
  { v: 'casa', t: 'Casa' },
  { v: 'trabalho', t: 'Trabalho' },
  { v: 'escola', t: 'Escola' },
  { v: 'mercado', t: 'Supermercado' },
  { v: 'outro', t: 'Outro destino' },
];

export function Rotina() {
  const { dados, derivados, rotas, atualizar, carregarCenarioDemo } = useEstado();
  const { rotina, modoRoteamento } = dados;
  const { km } = derivados;
  const [novoLocal, setNovoLocal] = useState<{ nome: string; tipo: TipoLocal }>({ nome: '', tipo: 'casa' });
  const [posicionando, setPosicionando] = useState(false);

  const mudarRotina = (f: (r: TRotina) => TRotina) => atualizar((d) => ({ ...d, rotina: f(d.rotina) }));
  const mudarTrajeto = (id: string, f: (t: Trajeto) => Trajeto) => mudarRotina((r) => ({ ...r, trajetos: r.trajetos.map((t) => (t.id === id ? f(t) : t)) }));
  const mudarViagem = (id: string, f: (v: ViagemLonga) => ViagemLonga) => mudarRotina((r) => ({ ...r, viagens: r.viagens.map((v) => (v.id === id ? f(v) : v)) }));

  const adicionarLocal = (lat: number, lng: number) => {
    const tipo = novoLocal.tipo;
    const nome = novoLocal.nome.trim() || TIPOS.find((t) => t.v === tipo)!.t;
    mudarRotina((r) => ({ ...r, locais: [...r.locais, { id: novoId(), nome, tipo, lat, lng }] }));
    setNovoLocal({ nome: '', tipo: 'outro' });
    setPosicionando(false);
  };
  const removerLocal = (id: string) =>
    mudarRotina((r) => ({ ...r, locais: r.locais.filter((l) => l.id !== id), trajetos: r.trajetos.map((t) => ({ ...t, paradas: t.paradas.filter((p) => p !== id) })) }));

  const linhas: LinhaMapa[] = useMemo(
    () =>
      rotina.trajetos.map((t, i) => ({
        id: t.id,
        pontos: rotas[t.id]?.geometria ?? [],
        cor: CORES_TRAJETO[i % CORES_TRAJETO.length],
        tracejada: rotas[t.id]?.origem !== 'rota-real',
        rotulo: t.nome,
      })),
    [rotina.trajetos, rotas],
  );
  const avisoRota = Object.values(rotas).find((r) => (r as { aviso?: string }).aviso) as { aviso?: string } | undefined;
  const nomeLocal = (id: string) => rotina.locais.find((l) => l.id === id)?.nome ?? '?';
  const vazio = rotina.locais.length === 0;

  return (
    <div>
      <CabecalhoPagina
        pagina="rotina"
        titulo="Minha Rotina"
        descricao="Marque os lugares por onde você passa e em que dias. Com isso calculamos quantos quilômetros você roda por mês, e esse número alimenta todas as comparações."
      >
        {vazio && (
          <button type="button" className="botao-secundario" onClick={carregarCenarioDemo}>
            ▶ Carregar cenário demonstrativo
          </button>
        )}
      </CabecalhoPagina>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        {/* Coluna do mapa e do resumo */}
        <div className="space-y-4 lg:sticky lg:top-36 lg:self-start">
          <div className="relative">
            <Mapa locais={rotina.locais} linhas={linhas} aoClicar={posicionando ? adicionarLocal : undefined} altura="h-[340px] sm:h-[440px]" />
            {posicionando && (
              <p className="absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full bg-marca px-4 py-2 text-sm font-semibold text-white shadow-lg">
                Toque no mapa para posicionar “{novoLocal.nome || TIPOS.find((t) => t.v === novoLocal.tipo)!.t}”
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-tinta-suave">
            <span className="flex items-center gap-1"><span className="inline-block h-1 w-6 rounded bg-marca" /> rota real</span>
            <span className="flex items-center gap-1"><span className="inline-block h-0 w-6 border-t-2 border-dashed border-marca" /> estimativa</span>
            <label className="ml-auto flex items-center gap-2">
              <span>Distâncias:</span>
              <select
                className="campo w-auto py-1.5 text-sm"
                value={modoRoteamento}
                onChange={(e) => atualizar((d) => ({ ...d, modoRoteamento: e.target.value as typeof modoRoteamento }))}
              >
                <option value="demonstrativo">Estimativa (sem internet)</option>
                <option value="osrm">Rotas reais (serviço OSRM)</option>
              </select>
            </label>
          </div>
          {avisoRota?.aviso && <Aviso tipo="atencao">{avisoRota.aviso}</Aviso>}

          <div className="rounded-2xl bg-marca p-5 text-white">
            <p className="text-sm text-white/75">Você roda por mês, aproximadamente</p>
            <p className="text-4xl font-bold tabular-nums">{fmtKm(km.kmMensal)}</p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div><dt className="text-white/80">Rotina</dt><dd className="font-semibold">{fmtKm(km.kmRecorrenteMes)}</dd></div>
              <div><dt className="text-white/80">Viagens</dt><dd className="font-semibold">{fmtKm(km.kmViagensMes)}</dd></div>
              <div><dt className="text-white/80">Outros</dt><dd className="font-semibold">{fmtKm(km.kmExtrasMes)}</dd></div>
            </dl>
            <button type="button" className="botao mt-4 w-full bg-white text-marca hover:bg-marca-claro" disabled={km.kmMensal === 0} onClick={() => irPara('diagnostico')}>
              Analisar minhas opções de mobilidade →
            </button>
          </div>
        </div>

        {/* Coluna dos formulários */}
        <div className="space-y-5">
          <Cartao titulo="1. Meus lugares" subtitulo="Pode usar endereços fictícios. Não pedimos sua localização.">
            <ul className="mb-4 space-y-2">
              {rotina.locais.map((l: Local) => (
                <li key={l.id} className="flex items-center gap-3 rounded-xl border border-tinta-linha px-3 py-2">
                  <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full text-white" style={{ background: COR_LOCAL[l.tipo] }}>{ICONE_LOCAL[l.tipo]}</span>
                  <input
                    className="min-w-0 flex-1 bg-transparent font-medium focus:outline-none"
                    value={l.nome}
                    aria-label="Nome do lugar"
                    onChange={(e) => mudarRotina((r) => ({ ...r, locais: r.locais.map((x) => (x.id === l.id ? { ...x, nome: e.target.value } : x)) }))}
                  />
                  {l.ficticio && <Selo tipo="ficticio" />}
                  <button type="button" className="botao-discreto px-2 py-1" onClick={() => removerLocal(l.id)} aria-label={`Remover ${l.nome}`}>✕</button>
                </li>
              ))}
              {vazio && <li className="text-tinta-suave">Nenhum lugar ainda. Comece pela sua casa.</li>}
            </ul>
            <div className="grid gap-2 rounded-xl bg-tinta-fundo p-3 sm:grid-cols-[1fr_auto]">
              <input className="campo" placeholder="Nome (ex.: Academia)" value={novoLocal.nome} onChange={(e) => setNovoLocal({ ...novoLocal, nome: e.target.value })} />
              <select className="campo" value={novoLocal.tipo} onChange={(e) => setNovoLocal({ ...novoLocal, tipo: e.target.value as TipoLocal })} aria-label="Tipo de lugar">
                {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.t}</option>)}
              </select>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <button type="button" className={posicionando ? 'botao-primario' : 'botao-secundario'} onClick={() => setPosicionando(!posicionando)}>
                  {posicionando ? 'Cancelar' : '📍 Marcar no mapa'}
                </button>
                <select
                  className="campo w-auto flex-1"
                  value=""
                  aria-label="Ou escolha uma região de referência"
                  onChange={(e) => {
                    const p = PONTOS_SUGERIDOS.find((x) => x.nome === e.target.value);
                    if (p) adicionarLocal(p.lat + (Math.random() - 0.5) * 0.01, p.lng + (Math.random() - 0.5) * 0.01);
                  }}
                >
                  <option value="">ou escolha uma região…</option>
                  {PONTOS_SUGERIDOS.map((p) => <option key={p.nome} value={p.nome}>{p.nome}</option>)}
                </select>
              </div>
            </div>
          </Cartao>

          <Cartao
            titulo="2. Meus trajetos"
            subtitulo="Cada trajeto é uma sequência de paradas que se repete em certos dias."
            acao={
              <button
                type="button"
                className="botao-secundario px-3 py-2 text-sm"
                disabled={rotina.locais.length < 2}
                onClick={() => mudarRotina((r) => ({ ...r, trajetos: [...r.trajetos, { id: novoId(), nome: `Trajeto ${r.trajetos.length + 1}`, paradas: r.locais.slice(0, 2).map((l) => l.id), dias: [1, 2, 3, 4, 5] }] }))}
              >
                + Trajeto
              </button>
            }
          >
            {rotina.trajetos.length === 0 && <p className="text-tinta-suave">Cadastre pelo menos dois lugares para criar um trajeto.</p>}
            <div className="space-y-4">
              {rotina.trajetos.map((t, i) => {
                const k = km.trajetos.find((x) => x.trajetoId === t.id);
                return (
                  <article key={t.id} className="rounded-xl border border-tinta-linha p-3" style={{ borderLeft: `5px solid ${CORES_TRAJETO[i % CORES_TRAJETO.length]}` }}>
                    <div className="flex items-center gap-2">
                      <input className="campo flex-1 font-semibold" value={t.nome} aria-label="Nome do trajeto" onChange={(e) => mudarTrajeto(t.id, (x) => ({ ...x, nome: e.target.value }))} />
                      <button type="button" className="botao-discreto px-2" aria-label="Remover trajeto" onClick={() => mudarRotina((r) => ({ ...r, trajetos: r.trajetos.filter((x) => x.id !== t.id) }))}>✕</button>
                    </div>
                    <ol className="mt-3 space-y-1">
                      {t.paradas.map((p, j) => (
                        <li key={`${p}-${j}`} className="flex items-center gap-2 text-[15px]">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-tinta-fundo text-xs font-bold">{j + 1}</span>
                          <span className="flex-1">{nomeLocal(p)}</span>
                          <button type="button" className="botao-discreto px-2 py-0.5" disabled={j === 0} aria-label="Subir parada" onClick={() => mudarTrajeto(t.id, (x) => { const a = [...x.paradas]; [a[j - 1], a[j]] = [a[j], a[j - 1]]; return { ...x, paradas: a }; })}>↑</button>
                          <button type="button" className="botao-discreto px-2 py-0.5" disabled={j === t.paradas.length - 1} aria-label="Descer parada" onClick={() => mudarTrajeto(t.id, (x) => { const a = [...x.paradas]; [a[j + 1], a[j]] = [a[j], a[j + 1]]; return { ...x, paradas: a }; })}>↓</button>
                          <button type="button" className="botao-discreto px-2 py-0.5" aria-label="Remover parada" onClick={() => mudarTrajeto(t.id, (x) => ({ ...x, paradas: x.paradas.filter((_, z) => z !== j) }))}>✕</button>
                        </li>
                      ))}
                    </ol>
                    <select className="campo mt-2 text-sm" value="" aria-label="Adicionar parada" onChange={(e) => e.target.value && mudarTrajeto(t.id, (x) => ({ ...x, paradas: [...x.paradas, e.target.value] }))}>
                      <option value="">+ adicionar parada…</option>
                      {rotina.locais.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                    </select>
                    <fieldset className="mt-3">
                      <legend className="rotulo">Em quais dias?</legend>
                      <div className="flex flex-wrap gap-1.5">
                        {DIAS.map(({ d, curto, nome }) => {
                          const ativo = t.dias.includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              aria-pressed={ativo}
                              aria-label={nome}
                              onClick={() => mudarTrajeto(t.id, (x) => ({ ...x, dias: ativo ? x.dias.filter((z) => z !== d) : [...x.dias, d] }))}
                              className={`h-10 w-10 rounded-full font-semibold ${ativo ? 'bg-marca text-white' : 'bg-tinta-fundo text-tinta-suave'}`}
                            >
                              {curto}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                    {k && (
                      <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-tinta-fundo p-2.5 text-sm">
                        <div>
                          <p className="text-tinta-suave">Por dia</p>
                          <p className="font-bold">{num(k.kmPorDia)} km <Selo tipo={k.origem === 'rota-real' ? 'real' : k.origem === 'manual' ? 'demonstrativo' : 'estimativa'} /></p>
                        </div>
                        <div>
                          <p className="text-tinta-suave">No mês ({num(k.diasNoMes)} dias)</p>
                          <p className="font-bold">{fmtKm(k.kmNoMes)}</p>
                        </div>
                        <label className="ml-auto w-36">
                          <span className="text-tinta-suave">Corrigir km/dia</span>
                          <input
                            type="number"
                            min={0}
                            className="campo py-1.5"
                            placeholder="automático"
                            value={t.kmManual ?? ''}
                            onChange={(e) => mudarTrajeto(t.id, (x) => ({ ...x, kmManual: e.target.value === '' ? null : Number(e.target.value) }))}
                          />
                        </label>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </Cartao>

          <Cartao
            titulo="3. Viagens longas"
            subtitulo="Viagens que não acontecem toda semana, como visitar a família."
            acao={
              <button type="button" className="botao-secundario px-3 py-2 text-sm" onClick={() => mudarRotina((r) => ({ ...r, viagens: [...r.viagens, { id: novoId(), nome: 'Nova viagem', kmIdaEVolta: 300, vezesPorAno: 2, maiorTrechoKm: 150 }] }))}>
                + Viagem
              </button>
            }
          >
            {rotina.viagens.length === 0 && <p className="text-tinta-suave">Nenhuma viagem longa cadastrada.</p>}
            <div className="space-y-3">
              {rotina.viagens.map((v) => (
                <div key={v.id} className="grid grid-cols-2 gap-2 rounded-xl border border-tinta-linha p-3 sm:grid-cols-4">
                  <label className="col-span-2 sm:col-span-4">
                    <span className="sr-only">Nome da viagem</span>
                    <span className="flex gap-2">
                      <input className="campo font-semibold" value={v.nome} onChange={(e) => mudarViagem(v.id, (x) => ({ ...x, nome: e.target.value }))} />
                      <button type="button" className="botao-discreto px-2" aria-label="Remover viagem" onClick={() => mudarRotina((r) => ({ ...r, viagens: r.viagens.filter((x) => x.id !== v.id) }))}>✕</button>
                    </span>
                  </label>
                  <label><span className="text-sm text-tinta-suave">Ida e volta (km)</span><input type="number" min={0} className="campo" value={v.kmIdaEVolta} onChange={(e) => mudarViagem(v.id, (x) => ({ ...x, kmIdaEVolta: Number(e.target.value) }))} /></label>
                  <label><span className="text-sm text-tinta-suave">Vezes por ano</span><input type="number" min={0} className="campo" value={v.vezesPorAno} onChange={(e) => mudarViagem(v.id, (x) => ({ ...x, vezesPorAno: Number(e.target.value) }))} /></label>
                  <label className="col-span-2"><span className="text-sm text-tinta-suave">Maior trecho sem parar (km)</span><input type="number" min={0} className="campo" value={v.maiorTrechoKm} onChange={(e) => mudarViagem(v.id, (x) => ({ ...x, maiorTrechoKm: Number(e.target.value) }))} /></label>
                </div>
              ))}
            </div>
          </Cartao>

          <Cartao titulo="4. Outras informações">
            <div className="space-y-4">
              <label className="block">
                <span className="rotulo">Outros quilômetros por mês</span>
                <input type="number" min={0} className="campo" value={rotina.kmExtrasMes} onChange={(e) => mudarRotina((r) => ({ ...r, kmExtrasMes: Number(e.target.value) }))} />
                <span className="ajuda">Passeios de fim de semana e imprevistos que não estão nos trajetos.</span>
              </label>
              <Interruptor
                rotulo="Tenho onde carregar um carro elétrico em casa"
                ajuda="Garagem com tomada adequada ou espaço para instalar um carregador (wallbox)."
                ligado={rotina.recargaEmCasa}
                aoMudar={(v) => mudarRotina((r) => ({ ...r, recargaEmCasa: v }))}
              />
            </div>
          </Cartao>
        </div>
      </div>
      <NavegacaoJornada pagina="rotina" rotuloContinuar="Analisar minhas opções de mobilidade" />
    </div>
  );
}
