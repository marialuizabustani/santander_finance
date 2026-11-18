"""Etapa 04: SRM (sample ratio mismatch) com qui-quadrado, esperado 50/50."""
import sys
from pathlib import Path

import pandas as pd
from scipy.stats import chisquare

RAIZ = Path(__file__).resolve().parent.parent
SAIDAS = RAIZ / "saidas"
LIMIAR = 0.01  # alarme de SRM

bruta = pd.read_csv(RAIZ / "entrada" / "experimento_agendamento.csv", usecols=["variante", "usuario_interno"])
usuarios = pd.read_csv(SAIDAS / "usuarios.csv", usecols=["variante"])

linhas = []
for momento, serie in [("bruta_sessoes", bruta["variante"]), ("limpa_usuarios", usuarios["variante"])]:
    c = serie.value_counts()
    p = chisquare([c["A"], c["B"]]).pvalue  # sem f_exp = divisão igual
    linhas.append({"momento": momento, "A": c["A"], "B": c["B"], "p_valor": p,
                   "alarme_srm": "sim" if p < LIMIAR else "nao"})
srm = pd.DataFrame(linhas)
srm.to_csv(SAIDAS / "srm.csv", index=False, float_format="%.6g")
print(srm.to_string(index=False, float_format=lambda x: f"{x:.6g}"))

# Evidência: sessões internas por variante na base bruta
internos = bruta[bruta["usuario_interno"] == "sim"]["variante"].value_counts().reindex(["A", "B"])
internos.rename("sessoes_internas").rename_axis("variante").reset_index().to_csv(SAIDAS / "srm_internos.csv", index=False)
print("\nSessões internas na base bruta:", internos.to_dict())

if srm.loc[srm["momento"] == "limpa_usuarios", "alarme_srm"].item() == "sim":
    sys.exit("PARAR: SRM na base limpa; não prosseguir para os testes das métricas.")
