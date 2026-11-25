import { useState } from 'react';
import { pct, reais } from '../components/formato';
import { Aviso, CabecalhoPagina, Cartao, Interruptor, NavegacaoJornada, Selo } from '../components/ui';
import { veiculoPorId } from '../data/veiculos';
import { bonusTaxa, calcularOpcao, ratingRelacionamento, taxaAnual, type Relacionamento } from '../engine';
import { useEstado } from '../state/estado';

const PACOTES = [
  { id: 'essencial', nome: 'Conta Essencial (demonstrativa)', texto: 'Para o dia a dia, com aplicativo e cartão de débito.' },
  { id: 'completa', nome: 'Conta Completa (demonstrativa)', texto: 'Com cartão de crédito, limite e investimentos.' },
];

const COR_NIVEL = { Inicial: '#9ca3af', Bom: '#f59e0b', 'Muito bom': '#10b981', Excelente: '#0f766e' };

export function Conta() {
  const { dados, derivados, atualizar } = useEstado();
  const r = dados.relacionamento;
  const mudar = (campo: keyof Relacionamento, v: boolean) => atualizar((d) => ({ ...d, relacionamento: { ...d.relacionamento, [campo]: v } }));
  const [etapa, setEtapa] = useState<0 | 1 | 2 | 3>(r.abrirConta ? 3 : 0);
  const [pacote, setPacote] = useState('essencial');
  const [portar, setPortar] = useState(true);

  const rating = ratingRelacionamento(r);
  const bonus = bonusTaxa(r, dados.premissas);
  const taxaBase = dados.premissas.financiamento.taxaMes;
  const taxaBonificada = derivados.premissasEfetivas.financiamento.taxaMes;

  // Efeito na opção escolhida, financiada (antes × depois)
  const v = veiculoPorId(dados.escolha.veiculoId);
  const ctx = { kmMensal: derivados.km.kmMensal, recargaEmCasa: dados.rotina.recargaEmCasa, perfil: dados.perfil };
  const antes = calcularOpcao(v, 'financiamento', { ...ctx, premissas: dados.premissas });
  const depois = calcularOpcao(v, 'financiamento', { ...ctx, premissas: derivados.premissasEfetivas });
  const prazo = dados.premissas.financiamento.prazoMeses;
  const economiaParcela = antes.parcelaMensal - depois.parcelaMensal;

  return (
    <div>
      <CabecalhoPagina pagina="conta" titulo="Conta Santander e taxa bonificada" descricao="Veja como abrir conta e trazer o salário podem melhorar seu relacionamento com o banco e reduzir a taxa do financiamento. Simulação ilustrativa.">
        <Selo tipo="hipotese" />
      </CabecalhoPagina>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Cartao titulo="Simulador de rating e taxa" subtitulo="Ligue as opções e veja a taxa e a parcela mudarem.">
          <div className="space-y-4">
            <Interruptor rotulo="Abrir conta Santander" ajuda={`Reduz ${pct(dados.premissas.bonificacao.conta, 2)} ao mês na taxa (hipótese).`} ligado={r.abrirConta} aoMudar={(x) => mudar('abrirConta', x)} />
            <Interruptor
              rotulo="Portabilidade de salário"
              ajuda={r.abrirConta ? `Reduz mais ${pct(dados.premissas.bonificacao.salario, 2)} ao mês (hipótese).` : 'Precisa de conta aberta.'}
              ligado={r.abrirConta && r.portabilidadeSalario}
              aoMudar={(x) => mudar('portabilidadeSalario', x)}
            />
            <Interruptor rotulo="Parcelas em débito automático" ajuda={r.abrirConta ? `Reduz mais ${pct(dados.premissas.bonificacao.debito, 2)} ao mês (hipótese).` : 'Precisa de conta aberta.'} ligado={r.abrirConta && r.debitoAutomatico} aoMudar={(x) => mudar('debitoAutomatico', x)} />
            <Interruptor rotulo="Seguro auto com o banco" ajuda={`Reduz ${pct(dados.premissas.bonificacao.seguro, 2)} ao mês (hipótese).`} ligado={r.seguroSantander} aoMudar={(x) => mudar('seguroSantander', x)} />
          </div>

          <div className="mt-6">
            <div className="flex items-end justify-between">
              <p className="font-semibold">Rating de relacionamento</p>
              <p className="text-2xl font-bold" style={{ color: COR_NIVEL[rating.nivel] }}>{rating.nivel} · {rating.pontos}</p>
            </div>
            <div className="mt-2 h-4 overflow-hidden rounded-full bg-tinta-fundo" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={rating.pontos} aria-label="Rating de relacionamento">
              <div className="h-4 rounded-full transition-all duration-500" style={{ width: `${rating.pontos}%`, background: COR_NIVEL[rating.nivel] }} />
            </div>
            <div className="mt-1 flex justify-between text-xs text-tinta-suave"><span>Inicial</span><span>Bom</span><span>Muito bom</span><span>Excelente</span></div>
            <p className="mt-2 text-xs text-tinta-suave">Escala ilustrativa do protótipo. Não é o score de crédito real.</p>
          </div>
        </Cartao>

        <div className="space-y-6">
          <section className="cartao" aria-label="Efeito na taxa">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-tinta-fundo p-4">
                <p className="text-sm text-tinta-suave">Taxa sem relacionamento</p>
                <p className="text-3xl font-bold tabular-nums">{pct(taxaBase, 2)}</p>
                <p className="text-xs text-tinta-suave">ao mês · {pct(taxaAnual(taxaBase))} ao ano</p>
              </div>
              <div className={`rounded-2xl p-4 ${bonus ? 'bg-marca text-white' : 'bg-tinta-fundo'}`}>
                <p className={`text-sm ${bonus ? 'text-white/85' : 'text-tinta-suave'}`}>Taxa bonificada</p>
                <p className="text-3xl font-bold tabular-nums">{pct(taxaBonificada, 2)}</p>
                <p className={`text-xs ${bonus ? 'text-white/85' : 'text-tinta-suave'}`}>ao mês · {pct(taxaAnual(taxaBonificada))} ao ano</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-tinta-suave">{v.nome}, financiamento em {prazo} meses</p>
              {[
                { t: 'Parcela sem relacionamento', v: antes.parcelaMensal, cor: '#9ca3af' },
                { t: 'Parcela com taxa bonificada', v: depois.parcelaMensal, cor: '#EC0000' },
              ].map((x) => (
                <div key={x.t} className="mt-2">
                  <div className="flex justify-between text-sm"><span>{x.t}</span><span className="font-bold tabular-nums">{reais(x.v)}</span></div>
                  <div className="h-3 rounded-full bg-tinta-fundo"><div className="h-3 rounded-full transition-all duration-500" style={{ width: `${(x.v / antes.parcelaMensal) * 100}%`, background: x.cor }} /></div>
                </div>
              ))}
              <p className="mt-3 text-lg">
                {economiaParcela > 0.5 ? (
                  <>Economia de <strong className="text-marca">{reais(economiaParcela)} por mês</strong>, ou {reais(economiaParcela * prazo)} no contrato.</>
                ) : (
                  'Ligue as opções ao lado para ver a economia.'
                )}
              </p>
            </div>
          </section>
          <Aviso tipo="atencao">
            <strong>Simulação ilustrativa.</strong> As reduções de taxa são hipóteses editáveis do protótipo, não ofertas. Taxa e aprovação reais dependem sempre de análise de crédito individual.
          </Aviso>
        </div>
      </div>

      <Cartao titulo="Abrir conta Santander" subtitulo="Atalho direto na jornada de contratação. Fluxo demonstrativo: nenhuma conta é aberta e não pedimos CPF ou documentos." className="mt-6">
        <ol className="mb-4 flex gap-2 text-sm" aria-label="Etapas da abertura de conta">
          {['Escolha a conta', 'Salário', 'Confirmação'].map((t, i) => (
            <li key={t} className={`flex-1 border-t-4 pt-1 ${etapa > i || etapa === 3 ? 'border-marca font-semibold text-marca' : etapa === i ? 'border-marca' : 'border-tinta-linha text-tinta-suave'}`}>{i + 1}. {t}</li>
          ))}
        </ol>
        {etapa === 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {PACOTES.map((p) => (
              <label key={p.id} className={`cursor-pointer rounded-2xl border-2 p-4 ${pacote === p.id ? 'border-marca bg-marca-claro' : 'border-tinta-linha'}`}>
                <input type="radio" name="pacote" className="sr-only" checked={pacote === p.id} onChange={() => setPacote(p.id)} />
                <span className="block font-bold">{p.nome}</span>
                <span className="text-[15px] text-tinta-suave">{p.texto}</span>
              </label>
            ))}
            <button type="button" className="botao-primario sm:col-span-2 sm:justify-self-start" onClick={() => setEtapa(1)}>Continuar →</button>
          </div>
        )}
        {etapa === 1 && (
          <div className="space-y-4">
            <Interruptor rotulo="Quero trazer meu salário para o Santander (portabilidade)" ajuda="A portabilidade é gratuita e pedida ao banco que recebe o salário. Aqui, apenas simulamos." ligado={portar} aoMudar={setPortar} />
            <div className="flex gap-2">
              <button type="button" className="botao-discreto" onClick={() => setEtapa(0)}>← Voltar</button>
              <button
                type="button"
                className="botao-primario"
                onClick={() => {
                  atualizar((d) => ({ ...d, relacionamento: { ...d.relacionamento, abrirConta: true, portabilidadeSalario: portar, debitoAutomatico: true } }));
                  setEtapa(2);
                }}
              >
                Abrir conta (demonstração)
              </button>
            </div>
          </div>
        )}
        {(etapa === 2 || etapa === 3) && (
          <div className="space-y-3">
            <Aviso tipo="ok">
              <strong>Conta aberta nesta demonstração.</strong> {PACOTES.find((p) => p.id === pacote)?.nome}{r.portabilidadeSalario ? ', com portabilidade de salário' : ''} e débito automático das parcelas. A taxa bonificada já foi aplicada em todo o simulador.
            </Aviso>
            <p className="text-sm text-tinta-suave">Em produção, este botão levaria ao onboarding oficial do banco, já com os dados da simulação.</p>
            <button
              type="button"
              className="botao-discreto"
              onClick={() => {
                atualizar((d) => ({ ...d, relacionamento: { abrirConta: false, portabilidadeSalario: false, debitoAutomatico: false, seguroSantander: false } }));
                setEtapa(0);
              }}
            >
              Desfazer e recomeçar
            </button>
          </div>
        )}
      </Cartao>

      <NavegacaoJornada pagina="conta" rotuloContinuar="Ver próximos passos" />
    </div>
  );
}
