import { km as fmtKm, num, reais } from '../components/formato';
import { TresFrentes } from '../components/TresFrentes';
import { Aviso, CabecalhoPagina, CampoNumero, Cartao, Indicador, NavegacaoJornada } from '../components/ui';
import { NOME_MODALIDADE, veiculoPorId } from '../data/veiculos';
import { useEstado } from '../state/estado';
import { irPara } from '../state/rotas';

const COR_ADEQ = { adequado: 'bg-emerald-50 text-emerald-800', atencao: 'bg-amber-50 text-amber-800', inadequado: 'bg-red-50 text-red-800' };
const TXT_ADEQ = { adequado: 'Combina com sua rotina', atencao: 'Combina, com atenção', inadequado: 'Não combina hoje' };

export function Diagnostico() {
  const { dados, derivados, atualizar } = useEstado();
  const { km, diagnostico, recomendacao, eletrico } = derivados;
  const perfil = dados.perfil;
  const mudarPerfil = (campo: keyof typeof perfil, v: number | string) => atualizar((d) => ({ ...d, perfil: { ...d.perfil, [campo]: v } }));
  const ev = veiculoPorId(dados.veiculoEletricoId);
  const anEv = eletrico[ev.id];

  if (km.kmMensal === 0) {
    return (
      <div>
        <CabecalhoPagina pagina="diagnostico" titulo="Diagnóstico de mobilidade" descricao="Para fazer o diagnóstico, precisamos conhecer sua rotina." />
        <Aviso>Cadastre pelo menos um trajeto em Minha Rotina ou carregue o cenário demonstrativo.</Aviso>
        <button type="button" className="botao-primario mt-4" onClick={() => irPara('rotina')}>Ir para Minha Rotina</button>
      </div>
    );
  }

  return (
    <div>
      <CabecalhoPagina pagina="diagnostico" titulo="Diagnóstico de mobilidade" descricao="O que sua rotina diz sobre o tipo de carro e de contrato que fazem mais sentido." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador destaque rotulo="Quilometragem mensal" valor={fmtKm(km.kmMensal)} detalhe={diagnostico.titulo} />
        <Indicador rotulo="Dia mais longo" valor={fmtKm(km.maiorDiaKm)} detalhe={`${km.diasComDeslocamento} dia(s) com deslocamento por semana`} />
        <Indicador rotulo="Por semana" valor={fmtKm(km.kmSemanal)} detalhe="só deslocamentos recorrentes" />
        <Indicador rotulo="Viagens longas" valor={fmtKm(km.kmViagensMes)} detalhe="média por mês" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Cartao titulo={diagnostico.titulo} subtitulo={diagnostico.resumo}>
            <ul className="space-y-2">
              {diagnostico.pontos.map((p) => (
                <li key={p} className="flex gap-2"><span className="text-marca">●</span><span>{p}</span></li>
              ))}
            </ul>
          </Cartao>

          <Cartao titulo="E um carro elétrico?" subtitulo={`Avaliado com o ${ev.nome}`} acao={<button type="button" className="botao-discreto text-sm" onClick={() => irPara('eletrico')}>Ver detalhes →</button>}>
            <p className={`chip mb-3 px-3 py-1 text-sm ${COR_ADEQ[anEv.adequacao]}`}>{TXT_ADEQ[anEv.adequacao]}</p>
            <ul className="space-y-2 text-[15px]">
              {anEv.motivos.slice(0, 4).map((m) => <li key={m}>• {m}</li>)}
            </ul>
            <p className="mt-3 text-sm text-tinta-suave">
              Autonomia segura considerada: {fmtKm(anEv.autonomiaPlanejadaKm)}. Você recarregaria cerca de {num(anEv.recargasPorSemana)} vez(es) por semana.
            </p>
          </Cartao>
        </div>

        <div className="space-y-6">
          <Cartao titulo="Seu orçamento" subtitulo="Usado para mostrar o que cabe no seu bolso. Não pedimos renda nem CPF.">
            <div className="space-y-4">
              <CampoNumero rotulo="Quanto pode gastar por mês com o carro" prefixo="R$" passo={100} valor={perfil.orcamentoMensal} aoMudar={(v) => mudarPerfil('orcamentoMensal', v)} ajuda="Parcela ou mensalidade + combustível/recarga + seguro, IPVA e manutenção." />
              <CampoNumero rotulo="Dinheiro disponível para entrada ou compra" prefixo="R$" passo={1000} valor={perfil.valorDisponivel} aoMudar={(v) => mudarPerfil('valorDisponivel', v)} />
            </div>
          </Cartao>

          {recomendacao.melhor && (
            <Cartao titulo="Primeira indicação" subtitulo="Calculada com os seus números; veja todas as opções no comparador.">
              <p className="text-xl font-bold">{veiculoPorId(recomendacao.melhor.veiculoId).nome}</p>
              <p className="text-marca font-semibold">{NOME_MODALIDADE[recomendacao.melhor.modalidade]}</p>
              <p className="mt-2 text-[15px]">
                Cerca de <strong>{reais(recomendacao.melhor.desembolsoMensal)}</strong> por mês, custo médio de {reais(recomendacao.melhor.custoMensalMedio)} por mês em {dados.premissas.horizonteMeses} meses.
              </p>
              {recomendacao.nenhumaCabe && <Aviso tipo="atencao">{recomendacao.motivo}</Aviso>}
            </Cartao>
          )}
        </div>
      </div>

      <div className="mt-6">
        <TresFrentes compacto />
      </div>

      <NavegacaoJornada pagina="diagnostico" rotuloContinuar="Comparar alternativas" />
    </div>
  );
}
