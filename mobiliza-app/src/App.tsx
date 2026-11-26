import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Assistente } from './pages/Assistente';
import { Comparador } from './pages/Comparador';
import { Conta } from './pages/Conta';
import { Diagnostico } from './pages/Diagnostico';
import { Eletrico } from './pages/Eletrico';
import { Inicio } from './pages/Inicio';
import { Lojista } from './pages/Lojista';
import { Premissas } from './pages/Premissas';
import { Proposta } from './pages/Proposta';
import { ProximosPassos } from './pages/ProximosPassos';
import { Rotina } from './pages/Rotina';
import { Simulacao } from './pages/Simulacao';
import { SimuladorClassico } from './pages/SimuladorClassico';
import { calcularRota, type RotaCalculada } from './services/roteamento';
import { useEstado } from './state/estado';
import { useRota } from './state/rotas';

/** Recalcula as rotas dos trajetos sempre que a rotina ou o modo de roteamento mudam. */
function SincronizadorRotas() {
  const { dados, definirRotas } = useEstado();
  const { rotina, modoRoteamento } = dados;
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const novas: Record<string, RotaCalculada> = {};
      for (const t of rotina.trajetos) {
        const pontos = t.paradas.map((id) => rotina.locais.find((l) => l.id === id)).filter((l) => !!l) as typeof rotina.locais;
        novas[t.id] = await calcularRota(pontos, modoRoteamento);
      }
      if (!cancelado) definirRotas(novas);
    })();
    return () => {
      cancelado = true;
    };
  }, [rotina.trajetos, rotina.locais, modoRoteamento, definirRotas]);
  return null;
}

export function App() {
  const { pagina, params } = useRota();
  const paginas = {
    inicio: <Inicio />,
    rotina: <Rotina />,
    diagnostico: <Diagnostico />,
    comparador: <Comparador />,
    assistente: <Assistente />,
    simulacao: <Simulacao />,
    'proximos-passos': <ProximosPassos />,
    eletrico: <Eletrico />,
    conta: <Conta />,
    lojista: <Lojista />,
    proposta: <Proposta dados={params.get('d')} />,
    premissas: <Premissas />,
    simulador: <SimuladorClassico />,
  };
  return (
    <Layout pagina={pagina}>
      <SincronizadorRotas />
      {paginas[pagina] ?? <Inicio />}
    </Layout>
  );
}
