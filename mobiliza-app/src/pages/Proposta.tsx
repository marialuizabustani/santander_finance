import { reais } from '../components/formato';
import { Aviso, CabecalhoPagina, Cartao } from '../components/ui';
import { NOME_MODALIDADE, veiculoPorId } from '../data/veiculos';
import { decodificarProposta } from '../services/proposta';
import { irPara } from '../state/rotas';

/** Página aberta pelo QR code: o cliente vê a proposta fictícia no próprio celular. */
export function Proposta({ dados }: { dados: string | null }) {
  const p = decodificarProposta(dados);
  if (!p) {
    return (
      <div>
        <CabecalhoPagina titulo="Proposta" descricao="Não foi possível ler esta proposta demonstrativa." />
        <button type="button" className="botao-primario" onClick={() => irPara('inicio')}>Ir para o início</button>
      </div>
    );
  }
  const v = veiculoPorId(p.veiculoId);
  return (
    <div className="mx-auto max-w-xl">
      <CabecalhoPagina titulo={`Proposta ${p.codigo}`} descricao={`Criada em ${p.criadaEm.split('-').reverse().join('/')} na ${p.loja}.`} />
      <Cartao>
        <p className="text-sm text-tinta-suave">{NOME_MODALIDADE[p.modalidade]}</p>
        <p className="text-xl font-bold">{v.nome}</p>
        <dl className="mt-4 space-y-2">
          <div className="flex justify-between"><dt>Entrada</dt><dd className="font-semibold">{reais(p.entrada)}</dd></div>
          <div className="flex justify-between"><dt>{p.modalidade === 'assinatura' ? 'Mensalidade' : 'Parcela'}</dt><dd className="font-semibold">{reais(p.parcela)}</dd></div>
          <div className="flex justify-between"><dt>Gasto mensal estimado</dt><dd className="font-semibold">{reais(p.gastoMensal)}</dd></div>
          <div className="flex justify-between"><dt>Custo total em {p.horizonteMeses} meses</dt><dd className="font-semibold">{reais(p.custoTotal)}</dd></div>
          <div className="flex justify-between"><dt>Quilometragem considerada</dt><dd className="font-semibold">{p.kmMensal} km/mês</dd></div>
          {p.taxaMes != null && p.modalidade !== 'assinatura' && p.modalidade !== 'avista' && (
            <div className="flex justify-between"><dt>Taxa (hipotética)</dt><dd className="font-semibold">{(p.taxaMes * 100).toFixed(2).replace('.', ',')}% ao mês</dd></div>
          )}
        </dl>
        {p.itens && p.itens.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold">Pacote</p>
            <ul className="mt-1 space-y-1 text-[15px]">{p.itens.map((i) => <li key={i}>✓ {i}</li>)}</ul>
          </div>
        )}
        <div className="mt-4"><Aviso tipo="atencao">Proposta fictícia de demonstração. Não é oferta de crédito.</Aviso></div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="botao-primario" onClick={() => irPara('assistente')}>Tirar dúvidas com a Mobiliza IA</button>
          <button type="button" className="botao-secundario" onClick={() => irPara('rotina')}>Montar minha rotina</button>
        </div>
      </Cartao>
    </div>
  );
}
