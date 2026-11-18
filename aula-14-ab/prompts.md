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
