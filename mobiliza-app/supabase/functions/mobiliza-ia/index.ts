// Supabase Edge Function "mobiliza-ia": proxy entre o site estático e o OpenRouter.
//
// A chave do OpenRouter fica SÓ aqui, no secret OPENROUTER_API_KEY do projeto Supabase
// (cadastrado pelo painel do Supabase). Ela nunca vai para o navegador nem para o GitHub.
//
// Proteções: aceita apenas origens conhecidas, limita tamanho de pergunta/contexto/resposta
// e limita pedidos por IP (por instância). Defina também um limite de gasto na chave do OpenRouter.

const ORIGENS_PERMITIDAS = [
  'https://marialuizabustani.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
];
const MODELO_PADRAO = 'openrouter/auto';
const MAX_PERGUNTA = 600;
const MAX_CONTEXTO = 16000;
const MAX_HISTORICO = 6;
const LIMITE_POR_IP = 30; // pedidos
const JANELA_MS = 10 * 60 * 1000; // por 10 minutos

const INSTRUCOES = `Você é a Mobiliza IA, assistente de um PROTÓTIPO ACADÊMICO NÃO OFICIAL chamado Santander Mobiliza,
que compara formas de ter um carro (elétrico, híbrido, combustão; à vista, financiamento, leasing, assinatura) a partir da rotina real do usuário.
Público principal: Geração X. Responda em português do Brasil, em linguagem simples, frases curtas, no máximo 6 frases ou 5 tópicos.
REGRAS OBRIGATÓRIAS:
1. Use SOMENTE os números do CONTEXTO (JSON) e do "calculoDeReferencia". Nunca invente preços, taxas, prazos ou condições.
2. Se a informação não estiver no contexto, diga que o simulador não tem esse dado e sugira a tela certa do aplicativo.
3. Deixe claro que veículos, preços e taxas são fictícios ou hipóteses editáveis. Não prometa aprovação de crédito nem redução de juros real.
4. A "taxa bonificada" é uma simulação ilustrativa de relacionamento (conta, salário, débito automático), não uma oferta.
5. Não peça nem aceite CPF, senhas ou dados bancários.
6. Use **negrito** só para o número ou a conclusão principal. Não use tabelas.`;

const pedidosPorIp = new Map<string, number[]>();

function cors(origem: string | null): Record<string, string> {
  const permitido = origem && ORIGENS_PERMITIDAS.includes(origem) ? origem : ORIGENS_PERMITIDAS[0];
  return {
    'Access-Control-Allow-Origin': permitido,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

function json(corpo: unknown, status: number, origem: string | null) {
  return new Response(JSON.stringify(corpo), { status, headers: { ...cors(origem), 'Content-Type': 'application/json' } });
}

function limiteExcedido(ip: string): boolean {
  const agora = Date.now();
  const lista = (pedidosPorIp.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  lista.push(agora);
  pedidosPorIp.set(ip, lista);
  return lista.length > LIMITE_POR_IP;
}

Deno.serve(async (req: Request) => {
  const origem = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origem) });
  if (req.method !== 'POST') return json({ erro: 'metodo_nao_permitido' }, 405, origem);
  if (!origem || !ORIGENS_PERMITIDAS.includes(origem)) return json({ erro: 'origem_nao_permitida' }, 403, origem);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'desconhecido';
  if (limiteExcedido(ip)) return json({ erro: 'muitos_pedidos' }, 429, origem);

  const chave = Deno.env.get('OPENROUTER_API_KEY');
  if (!chave) return json({ erro: 'chave_ausente' }, 503, origem);

  let corpo: { pergunta?: unknown; contexto?: unknown; historico?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return json({ erro: 'json_invalido' }, 400, origem);
  }
  const pergunta = typeof corpo.pergunta === 'string' ? corpo.pergunta.trim().slice(0, MAX_PERGUNTA) : '';
  if (!pergunta) return json({ erro: 'pergunta_vazia' }, 400, origem);
  const contexto = JSON.stringify(corpo.contexto ?? {}).slice(0, MAX_CONTEXTO);
  const historico = Array.isArray(corpo.historico)
    ? (corpo.historico as { autor?: string; texto?: string }[])
        .slice(-MAX_HISTORICO)
        .filter((m) => typeof m?.texto === 'string')
        .map((m) => ({ role: m.autor === 'pessoa' ? 'user' : 'assistant', content: String(m.texto).slice(0, 1200) }))
    : [];

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${chave}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://marialuizabustani.github.io/santander_finance/mobiliza/',
        'X-Title': 'Santander Mobiliza (prototipo academico)',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENROUTER_MODEL') || MODELO_PADRAO,
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          { role: 'system', content: INSTRUCOES },
          { role: 'system', content: `CONTEXTO DO SIMULADOR (JSON):\n${contexto}` },
          ...historico,
          { role: 'user', content: pergunta },
        ],
      }),
    });
    if (!r.ok) {
      console.error('OpenRouter respondeu', r.status, (await r.text()).slice(0, 300));
      return json({ erro: 'ia_indisponivel', status: r.status }, 502, origem);
    }
    const j = await r.json();
    const texto = j?.choices?.[0]?.message?.content;
    if (typeof texto !== 'string' || !texto.trim()) return json({ erro: 'resposta_vazia' }, 502, origem);
    return json({ texto: texto.trim(), modelo: j?.model ?? null }, 200, origem);
  } catch (e) {
    console.error('Falha ao chamar o OpenRouter', String(e));
    return json({ erro: 'ia_indisponivel' }, 502, origem);
  } finally {
    clearTimeout(timer);
  }
});
