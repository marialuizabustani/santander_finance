import { km as fmtKm, pct, reais } from '../components/formato';
import { NOME_MODALIDADE, veiculoPorId } from '../data/veiculos';
import { useEstado } from '../state/estado';
import { irPara, type IdPagina } from '../state/rotas';

const AREAS: { id: IdPagina; titulo: string; texto: string; icone: string }[] = [
  { id: 'rotina', titulo: 'Minha Rotina', texto: 'Marque seus trajetos no mapa e descubra quantos km você roda por mês.', icone: '📍' },
  { id: 'comparador', titulo: 'Comparador', texto: 'Elétrico, híbrido ou combustão. À vista, financiado, leasing ou assinatura.', icone: '⚖' },
  { id: 'eletrico', titulo: 'Mobilidade Elétrica', texto: 'Autonomia, recarga e carregadores, explicados para a sua rotina.', icone: '⚡' },
  { id: 'assistente', titulo: 'Mobiliza IA', texto: 'Tire dúvidas na hora, com os seus próprios números.', icone: '💬' },
  { id: 'conta', titulo: 'Conta e taxa', texto: 'Simule como conta e salário no banco podem reduzir a taxa do financiamento.', icone: '🏦' },
  { id: 'lojista', titulo: 'Área do Lojista', texto: 'Atendimento na concessionária, do veículo à proposta.', icone: '🏪' },
];

export function Inicio() {
  const { iniciarDemonstracao, dados, derivados } = useEstado();
  const { km, recomendacao, eletrico, premissasEfetivas } = derivados;
  const ev = eletrico[dados.veiculoEletricoId];
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-marca text-white">
        <div className="grid gap-6 p-6 sm:p-10 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-sm">Santander Mobiliza · protótipo acadêmico</p>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">Sua rotina mostra o caminho. Nós ajudamos você a escolher como percorrê-lo.</h1>
            <p className="mt-4 max-w-xl text-lg text-white/90">
              Conte por onde você anda no dia a dia. A gente calcula quanto você roda e compara, com números claros, qual forma de ter um carro faz mais sentido para o seu
              bolso: elétrico, híbrido ou a combustão; comprar, financiar, fazer leasing ou assinar.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="botao bg-white text-marca hover:bg-marca-claro" onClick={() => irPara('rotina')}>
                Descobrir minha mobilidade ideal →
              </button>
              <button type="button" className="botao border border-white/70 text-white hover:bg-white/10" onClick={iniciarDemonstracao}>
                ▶ Demonstração ao vivo
              </button>
            </div>
          </div>
          <ol className="space-y-3 rounded-2xl bg-white/10 p-5 text-white">
            {['Marque sua rotina no mapa', 'Veja seu diagnóstico de uso', 'Compare custos lado a lado', 'Tire dúvidas com a Mobiliza IA', 'Simule e veja os próximos passos'].map((t, i) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white font-bold text-marca">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {km.kmMensal > 0 && recomendacao.melhor && (
        <section aria-label="Seu painel">
          <h2 className="mb-3 text-xl font-bold">Seu painel</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button type="button" onClick={() => irPara('rotina')} className="cartao text-left">
              <span className="block text-sm text-tinta-suave">Você roda por mês</span>
              <span className="block text-2xl font-bold">{fmtKm(km.kmMensal)}</span>
              <span className="text-sm text-tinta-suave">{derivados.diagnostico.titulo}</span>
            </button>
            <button type="button" onClick={() => irPara('comparador')} className="cartao text-left">
              <span className="block text-sm text-tinta-suave">Melhor opção para você</span>
              <span className="block text-lg font-bold leading-tight">{veiculoPorId(recomendacao.melhor.veiculoId).nome.replace(' (fictício)', '')}</span>
              <span className="text-sm font-semibold text-marca">{NOME_MODALIDADE[recomendacao.melhor.modalidade]} · {reais(recomendacao.melhor.desembolsoMensal)}/mês</span>
            </button>
            <button type="button" onClick={() => irPara('eletrico')} className="cartao text-left">
              <span className="block text-sm text-tinta-suave">Elétrico economiza em energia</span>
              <span className="block text-2xl font-bold text-ok">{reais(ev.economiaMes)}/mês</span>
              <span className="text-sm text-tinta-suave">autonomia segura de {fmtKm(ev.autonomiaPlanejadaKm)}</span>
            </button>
            <button type="button" onClick={() => irPara('conta')} className="cartao text-left">
              <span className="block text-sm text-tinta-suave">Taxa do financiamento</span>
              <span className="block text-2xl font-bold">{pct(premissasEfetivas.financiamento.taxaMes, 2)} a.m.</span>
              <span className="text-sm text-tinta-suave">{premissasEfetivas.financiamento.taxaMes < dados.premissas.financiamento.taxaMes ? 'com taxa bonificada' : 'simule a taxa bonificada →'}</span>
            </button>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-bold">Explore</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS.map((a) => (
            <button key={a.id} type="button" onClick={() => irPara(a.id)} className="cartao text-left transition-shadow hover:shadow-md">
              <span aria-hidden className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-marca-suave text-xl">{a.icone}</span>
              <span className="block text-lg font-bold">{a.titulo}</span>
              <span className="mt-1 block text-tinta-suave">{a.texto}</span>
            </button>
          ))}
        </div>
      </section>

      <p className="rounded-xl bg-white px-4 py-3 text-sm text-tinta-suave shadow-cartao">
        Protótipo acadêmico não oficial, criado para demonstração. Não pedimos CPF, senhas ou dados bancários. Valores, veículos e condições são fictícios ou hipóteses
        editáveis.
      </p>
    </div>
  );
}
