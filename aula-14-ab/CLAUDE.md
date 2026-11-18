# Laboratório aula-14-ab: teste A/B de agendamento

Trabalhe somente dentro desta pasta (aula-14-ab).

## Regras
- entrada/ é somente leitura.
- Cada etapa vira um script analise/NN_nome.py, executado com o Python
  da .venv, que grava o que produz em saidas/.
- Todo número citado (no chat ou em relatórios) vem de um script executado.
- Regras de limpeza são definidas sem olhar o resultado e valem igualmente
  para A e B.
- Cada prompt recebido é registrado em prompts.md com a data e os arquivos
  gerados.

## Ambiente
- Python: .venv/bin/python (pandas, numpy, scipy, matplotlib).
- Não instale nada fora da .venv.

## Estrutura
- entrada/experimento_agendamento.csv: base original (SHA-256 3b6b13db...).
- analise/: scripts numerados das etapas.
- saidas/: tudo o que os scripts produzem.
