"""Etapa 03: limpeza na ordem do desenho. Mesmas regras para A e B."""
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parent.parent
SAIDAS = RAIZ / "saidas"
base = pd.read_csv(RAIZ / "entrada" / "experimento_agendamento.csv")
ESPERADO = {"remover_duplicadas": 14152, "excluir_internos": 13516,
            "excluir_usuarios_duas_variantes": 13044, "agregar_por_usuario": 10400}
log = []


def registra(regra, justificativa, antes, depois):
    log.append({"regra": regra, "justificativa": justificativa, "linhas_antes": antes, "linhas_depois": depois})
    print(f"{regra:35s} {antes:>6} -> {depois:>6}  (esperado {ESPERADO[regra]})")


# 1. Duplicadas: mantém a primeira ocorrência
antes = len(base); base = base.drop_duplicates()
registra("remover_duplicadas", "a sessão ocorreu uma vez; a cópia vem do reenvio do log", antes, len(base))

# 2. Usuários internos
antes = len(base); base = base[base["usuario_interno"] != "sim"]
registra("excluir_internos", "equipe interna não é paciente", antes, len(base))

# 3. Usuários nas duas variantes (sobre a base após a regra 2)
n_var = base.groupby("usuario_id")["variante"].nunique()
ambos = n_var[n_var > 1].index
antes = len(base); base = base[~base["usuario_id"].isin(ambos)]
registra("excluir_usuarios_duas_variantes",
         "a unidade sorteada é o usuário; quem viu as duas páginas está contaminado", antes, len(base))

# 4. Uma linha por usuário; dispositivo da primeira sessão (data, depois sessao_id)
assert (base.groupby("usuario_id")["variante"].nunique() == 1).all()
ordenada = base.sort_values(["usuario_id", "data", "sessao_id"])
usuarios = ordenada.groupby("usuario_id").agg(
    variante=("variante", "first"), dispositivo=("dispositivo", "first"), primeira_data=("data", "min"),
    concluiu=("concluiu", "max"), tempo_segundos=("tempo_segundos", "max")).reset_index()
registra("agregar_por_usuario", "a métrica primária é por usuário; uma linha por usuario_id", len(base), len(usuarios))

# Confere com o esperado antes de gravar
divergentes = [r["regra"] for r in log if r["linhas_depois"] != ESPERADO[r["regra"]]]
if divergentes:
    raise SystemExit(f"Divergência em {divergentes}; nada foi gravado.")
pd.DataFrame(log).to_csv(SAIDAS / "regras_de_limpeza.csv", index=False)
usuarios["tempo_segundos"] = usuarios["tempo_segundos"].astype("Int64")
usuarios.to_csv(SAIDAS / "usuarios.csv", index=False)
print(f"Gravados: regras_de_limpeza.csv ({len(log)} regras) e usuarios.csv ({len(usuarios)} usuários)")
