import { km as fmtKm, reais } from '../components/formato';
import { CabecalhoPagina, Cartao, NavegacaoJornada } from '../components/ui';
import { NOME_MODALIDADE, veiculoPorId } from '../data/veiculos';
import { useEstado, type DadosSessao, type Derivados } from '../state/estado';
import { irPara } from '../state/rotas';

/** Monta o resumo em texto simples (para baixar, imprimir ou mostrar a um especialista). */
export function montarResumo(d: DadosSessao, r: Derivados): string {
  const o = r.escolhida;
  const rec = r.recomendacao.melhor;
  const linhas = [
    'SANTANDER MOBILIZA · RESUMO DA SIMULAÇÃO (protótipo acadêmico não oficial)',
    `Gerado em ${new Date().toLocaleString('pt-BR')}. Valores fictícios ou hipóteses; não é proposta de crédito.`,
    '',
    'ROTINA',
    `- Quilometragem mensal: ${fmtKm(r.km.kmMensal)} (rotina ${fmtKm(r.km.kmRecorrenteMes)}, viagens ${fmtKm(r.km.kmViagensMes)}, outros ${fmtKm(r.km.kmExtrasMes)})`,
    ...r.km.trajetos.map((t) => `- ${t.nome}: ${t.kmPorDia.toFixed(1)} km/dia × ${t.diasNoMes.toFixed(0)} dias (${t.origem})`),
    `- Recarga em casa: ${d.rotina.recargaEmCasa ? 'sim' : 'não'}`,
    '',
    'ORÇAMENTO',
    `- Até ${reais(d.perfil.orcamentoMensal)} por mês; ${reais(d.perfil.valorDisponivel)} disponíveis para entrada`,
    '',
    'RECOMENDAÇÃO',
    rec ? `- ${veiculoPorId(rec.veiculoId).nome}, ${NOME_MODALIDADE[rec.modalidade]}: ${reais(rec.desembolsoMensal)}/mês, custo médio ${reais(rec.custoMensalMedio)}/mês` : '- (sem opções)',
    `- Motivo: ${r.recomendacao.motivo}`,
    '',
    'OPÇÃO SIMULADA',
    `- ${veiculoPorId(o.veiculoId).nome}, ${NOME_MODALIDADE[o.modalidade]}`,
    `- No início: ${reais(o.desembolsoInicial)} | Por mês: ${reais(o.desembolsoMensal)} | Custo total em ${o.horizonteMeses} meses: ${reais(o.custoLiquido)} | ${reais(o.custoPorKm, 2)}/km`,
    '',
    'PREMISSAS PRINCIPAIS (hipóteses editáveis)',
    `- Gasolina ${reais(d.premissas.precoGasolinaLitro, 2)}/L; energia em casa ${reais(d.premissas.precoEnergiaCasaKwh, 2)}/kWh; pública ${reais(d.premissas.precoEnergiaPublicaKwh, 2)}/kWh`,
    `- Financiamento: entrada ${Math.round(d.premissas.financiamento.entradaPct * 100)}%, ${(d.premissas.financiamento.taxaMes * 100).toFixed(2)}% a.m., ${d.premissas.financiamento.prazoMeses} meses`,
  ];
  return linhas.join('\n');
}

export function ProximosPassos() {
  const { dados, derivados } = useEstado();
  const o = derivados.escolhida;
  const baixar = () => {
    const blob = new Blob([montarResumo(dados, derivados)], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'resumo-santander-mobiliza.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const passos = [
    { t: 'Revise sua rotina', d: 'Confira se os trajetos e as viagens representam bem o seu dia a dia.', a: () => irPara('rotina'), b: 'Revisar' },
    { t: 'Tire as últimas dúvidas', d: 'Pergunte à Mobiliza IA o que acontece se você rodar mais ou trocar a forma de pagamento.', a: () => irPara('assistente'), b: 'Perguntar' },
    { t: 'Leve o resumo à concessionária', d: 'Na loja, o vendedor pode continuar daqui pela Área do Lojista, sem você repetir tudo.', a: () => irPara('lojista'), b: 'Ver área do lojista' },
    { t: 'Conheça os benefícios de conta', d: 'Entenda, de forma educativa, como o relacionamento com o banco pode entrar na análise.', a: () => irPara('conta'), b: 'Saber mais' },
  ];

  return (
    <div>
      <CabecalhoPagina pagina="proximos-passos" titulo="Próximos passos" descricao="Seu resumo e o que você pode fazer a seguir. Nada foi enviado a nenhum banco." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Cartao titulo="Seu resumo">
          <dl className="space-y-3">
            <div><dt className="text-sm text-tinta-suave">Você roda</dt><dd className="text-lg font-bold">{fmtKm(derivados.km.kmMensal)} por mês</dd></div>
            <div><dt className="text-sm text-tinta-suave">Opção simulada</dt><dd className="text-lg font-bold">{veiculoPorId(o.veiculoId).nome} · {NOME_MODALIDADE[o.modalidade]}</dd></div>
            <div><dt className="text-sm text-tinta-suave">Gasto mensal estimado</dt><dd className="text-lg font-bold">{reais(o.desembolsoMensal)}</dd></div>
            <div><dt className="text-sm text-tinta-suave">Custo total em {o.horizonteMeses} meses</dt><dd className="text-lg font-bold">{reais(o.custoLiquido)}</dd></div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="botao-primario" onClick={baixar}>⬇ Exportar resumo</button>
            <button type="button" className="botao-secundario" onClick={() => window.print()}>🖨 Imprimir</button>
          </div>
        </Cartao>
        <Cartao titulo="O que fazer agora">
          <ol className="space-y-4">
            {passos.map((p, i) => (
              <li key={p.t} className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-marca font-bold text-white">{i + 1}</span>
                <div className="flex-1">
                  <p className="font-semibold">{p.t}</p>
                  <p className="text-[15px] text-tinta-suave">{p.d}</p>
                </div>
                <button type="button" className="botao-discreto self-center text-sm" onClick={p.a}>{p.b} →</button>
              </li>
            ))}
          </ol>
        </Cartao>
      </div>
      <NavegacaoJornada pagina="proximos-passos" />
    </div>
  );
}
