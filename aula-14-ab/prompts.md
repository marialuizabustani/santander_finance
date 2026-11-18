# Registro de prompts

## 2026-11-18: Etapa 0, preparação do ambiente
**Prompt:** preparar o ambiente e escrever as regras do projeto, sem analisar
dados. (1) Criar CLAUDE.md com as regras: entrada/ somente leitura; uma etapa,
um script analise/NN_nome.py executado com o Python da .venv, gravando em
saidas/; todo número citado vem de um script executado; regras de limpeza
independentes do resultado e iguais para A e B; registrar cada prompt em
prompts.md com data e arquivos gerados. (2) Verificar Python >= 3.10, criar
.venv e instalar pandas, numpy, scipy e matplotlib, sem instalar nada fora da
.venv. (3) Conferir entrada/experimento_agendamento.csv: esperado 14.392
linhas de dados, 8 colunas e SHA-256 iniciado por 3b6b13db; parar se divergir.
Mostrar o plano e esperar o ok antes de instalar.

**Arquivos gerados:** CLAUDE.md, .gitignore, .venv/, entrada/experimento_agendamento.csv
(cópia do upload, somente leitura), prompts.md.

## 2026-11-18: Etapa 1, plano do teste e tamanho amostral
**Prompt:** como estatístico de experimentos, registrar o plano do teste A/B
e calcular o tamanho amostral sem abrir a base. Criar saidas/plano.md (pergunta,
hipótese, unidade sorteada, métricas primária e secundária, efeito mínimo, alfa,
poder, duração) e analise/01_tamanho_amostral.py (duas proporções, bicaudal,
scipy.stats.norm, sem statsmodels, arredondar para cima), acrescentando o
resultado ao fim do plano. Dados: A = página atual, B = nova página; taxa
histórica de 40%; efeito mínimo de 3 p.p.; alfa de 5%; poder de 80%; 14 dias,
de 02 a 15/03/2026; métrica secundária: tempo até concluir, entre quem concluiu.
Esperado: 4.234 usuários por grupo. Não ler nada em entrada/.

**Arquivos gerados:** saidas/plano.md, analise/01_tamanho_amostral.py.

## 2026-11-18: Etapa 2, estudo exploratório da base bruta
**Prompt:** como analista de dados, fazer o estudo exploratório da base bruta,
descrevendo e medindo sem remover nem corrigir nada. Criar
analise/02_estudo_base.py, que lê entrada/experimento_agendamento.csv e grava
saidas/estudo_base.md com: (1) estrutura (linhas, colunas, tipos, período,
usuários distintos); (2) qualidade (nulos por coluna e em que situação
aparecem, linhas duplicadas, sessao_id repetido); (3) frequência e % de
variante, dispositivo e usuario_interno; (4) média, mediana, desvio, quartis,
mín, máx e assimetria de tempo_segundos e taxa geral de conclusão;
(5) sessões por usuário e por dia; (6) ameaças: sessões internas por variante
e usuários nas duas variantes. Gravar o histograma de tempo_segundos e o
gráfico de sessões por dia (uma linha por variante). Esperado: 14.392 linhas e
8 colunas; parar se divergir. Não comparar a conclusão de A e B; não ler o
README da pasta de dados; usar só números do script. Relatório com até 90
linhas, terminando na lista de achados (Achado / Evidência / Ameaça).

**Arquivos gerados:** analise/02_estudo_base.py, saidas/estudo_base.md,
saidas/hist_tempo_segundos.png, saidas/sessoes_por_dia.png.
