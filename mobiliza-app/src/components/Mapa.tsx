import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import type { Carregador } from '../data/carregadores';
import type { Local, TipoLocal } from '../engine';

export const COR_LOCAL: Record<TipoLocal, string> = {
  casa: '#EC0000',
  trabalho: '#990000',
  escola: '#EA6F5D',
  mercado: '#3D3D3D',
  outro: '#8A8A8A',
};
export const ICONE_LOCAL: Record<TipoLocal, string> = { casa: '⌂', trabalho: '💼', escola: '🎒', mercado: '🛒', outro: '★' };
const CENTRO_PADRAO: [number, number] = [-23.59, -46.68];
// listas vazias estáveis: evitam redesenhar (e reenquadrar) o mapa a cada renderização
const SEM_LINHAS: LinhaMapa[] = [];
const SEM_CARREGADORES: Carregador[] = [];
export const CORES_TRAJETO = ['#EC0000', '#3D3D3D', '#990000', '#EA6F5D', '#8A8A8A'];

export interface LinhaMapa {
  id: string;
  pontos: [number, number][];
  cor: string;
  tracejada?: boolean;
  rotulo?: string;
}

interface Props {
  locais: Local[];
  linhas?: LinhaMapa[];
  carregadores?: Carregador[];
  aoClicar?: (lat: number, lng: number) => void;
  altura?: string;
  centroPadrao?: [number, number];
}

/** Mapa Leaflet + OpenStreetMap. As camadas são redesenhadas quando os dados mudam. */
export function Mapa({ locais, linhas = SEM_LINHAS, carregadores = SEM_CARREGADORES, aoClicar, altura = 'h-[420px]', centroPadrao = CENTRO_PADRAO }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const camadaRef = useRef<L.LayerGroup | null>(null);
  const cliqueRef = useRef(aoClicar);
  const centroRef = useRef(centroPadrao);
  const [semBase, setSemBase] = useState(false);
  cliqueRef.current = aoClicar;

  useEffect(() => {
    if (!elRef.current || mapaRef.current) return;
    const mapa = L.map(elRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(centroRef.current, 11);
    const base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });
    let erros = 0;
    base.on('tileerror', () => {
      erros += 1;
      if (erros > 3) setSemBase(true);
    });
    base.addTo(mapa);
    camadaRef.current = L.layerGroup().addTo(mapa);
    mapa.on('click', (e: L.LeafletMouseEvent) => cliqueRef.current?.(e.latlng.lat, e.latlng.lng));
    mapaRef.current = mapa;
    return () => {
      mapa.stop();
      mapa.off();
      mapa.remove();
      mapaRef.current = null;
    };
  }, []); // cria o mapa uma única vez; as camadas são atualizadas no efeito abaixo

  useEffect(() => {
    const mapa = mapaRef.current;
    const camada = camadaRef.current;
    if (!mapa || !camada) return;
    camada.clearLayers();
    const limites: L.LatLngExpression[] = [];

    linhas.forEach((l) => {
      if (l.pontos.length < 2) return;
      L.polyline(l.pontos, { color: '#fff', weight: 8, opacity: 0.9 }).addTo(camada);
      const pl = L.polyline(l.pontos, { color: l.cor, weight: 5, opacity: 0.95, dashArray: l.tracejada ? '8 8' : undefined }).addTo(camada);
      if (l.rotulo) pl.bindTooltip(l.rotulo, { sticky: true });
      limites.push(...l.pontos);
    });

    locais.forEach((loc) => {
      const icone = L.divIcon({
        className: '',
        html: `<div class="pino" style="background:${COR_LOCAL[loc.tipo]}"><span>${ICONE_LOCAL[loc.tipo]}</span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });
      L.marker([loc.lat, loc.lng], { icon: icone, title: loc.nome, keyboard: true })
        .bindTooltip(`${loc.nome}${loc.ficticio ? ' (endereço fictício)' : ''}`, { direction: 'top', offset: [0, -30] })
        .addTo(camada);
      limites.push([loc.lat, loc.lng]);
    });

    carregadores.forEach((c) => {
      const icone = L.divIcon({ className: '', html: `<div class="pino-carregador" title="${c.nome}">⚡</div>`, iconSize: [26, 26], iconAnchor: [13, 13] });
      L.marker([c.lat, c.lng], { icon: icone, title: c.nome })
        .bindPopup(`<strong>${c.nome}</strong><br>${c.tipo === 'rapido' ? 'Recarga rápida' : 'Recarga lenta'} · ${c.potenciaKw} kW<br><em>Ponto fictício</em>`)
        .addTo(camada);
      limites.push([c.lat, c.lng]);
    });

    if (limites.length) mapa.fitBounds(L.latLngBounds(limites), { paddingTopLeft: [40, 56], paddingBottomRight: [40, 40], maxZoom: 14, animate: false });
  }, [locais, linhas, carregadores]);

  return (
    <div className="relative">
      <div ref={elRef} className={`${altura} w-full overflow-hidden rounded-2xl border border-tinta-linha bg-[#F3ECE6]`} role="application" aria-label="Mapa da rotina" />
      {semBase && (
        <p className="absolute bottom-2 left-2 right-2 z-[400] rounded-lg bg-white/95 px-3 py-1.5 text-xs text-tinta-suave shadow">
          Não foi possível carregar o fundo do mapa (sem internet ou bloqueado). Pontos e rotas continuam visíveis.
        </p>
      )}
    </div>
  );
}
