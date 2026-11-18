"""Etapa 05: métrica primária, taxa de conclusão por usuário (B vs A)."""
import re
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import chi2_contingency, norm

RAIZ = Path(__file__).resolve().parent.parent
SAIDAS = RAIZ / "saidas"
usuarios = pd.read_csv(SAIDAS / "usuarios.csv")
bruta = pd.read_csv(RAIZ / "entrada" / "experimento_agendamento.csv")

# Efeito mínimo lido do plano (linha "Efeito mínimo | +3 pontos percentuais")
plano = (SAIDAS / "plano.md").read_text(encoding="utf-8")
efeito_min_pp = float(re.search(r"\| Efeito mínimo \| \+?(\d+(?:[.,]\d+)?) pontos", plano).group(1).replace(",", "."))


def por_variante(df, base):
    g = df.groupby("variante")["concluiu"].agg(unidades="size", concluiram="sum")
    g["taxa"] = g["concluiram"] / g["unidades"]
    return g.reindex(["A", "B"]).reset_index().assign(base=base)


# 1. Taxas na base limpa (usuário)
limpa = por_variante(usuarios, "limpa_usuarios")
pA, pB = limpa["taxa"]
nA, nB = limpa["unidades"]
dif = pB - pA

# 2. Qui-quadrado sem Yates
tabela = pd.crosstab(usuarios["variante"], usuarios["concluiu"]).reindex(["A", "B"])
qui2, p, gl, _ = chi2_contingency(tabela, correction=False)

# 3. IC 95% da diferença (Wald, sem pooling)
ep = np.sqrt(pA * (1 - pA) / nA + pB * (1 - pB) / nB)
z = norm.ppf(0.975)
ic = (dif - z * ep, dif + z * ep)

# 4. Base bruta, por sessão (descritivo, sem teste: sessões não são independentes)
bru = por_variante(bruta, "bruta_sessoes")

linha_dif = {"base": "limpa_usuarios", "variante": "B-A", "dif_pp": 100 * dif, "ic95_inf_pp": 100 * ic[0],
             "ic95_sup_pp": 100 * ic[1], "qui2": qui2, "p_valor": p}
bru.loc[bru["variante"] == "B", "dif_pp"] = 100 * (bru["taxa"].iloc[1] - bru["taxa"].iloc[0])
res = pd.concat([limpa, pd.DataFrame([linha_dif]), bru], ignore_index=True)
cols = ["base", "variante", "unidades", "concluiram", "taxa", "dif_pp", "ic95_inf_pp", "ic95_sup_pp", "qui2", "p_valor"]
res = res[cols].astype({"unidades": "Int64", "concluiram": "Int64"})
res.to_csv(SAIDAS / "resultado_primario.csv", index=False, float_format="%.6g")

print("Tabela de contingência (variante x concluiu):\n", tabela, sep="")
print(f"\nqui2 = {qui2:.4f}, gl = {gl}, p = {p:.5f}, z = {z:.4f}, EP = {100 * ep:.3f} p.p.\n")
print(res.to_string(index=False, float_format=lambda x: f"{x:.4f}"))
lo, hi = 100 * ic[0], 100 * ic[1]
print(f"\nEfeito mínimo do plano: {efeito_min_pp} p.p.")
print(f"IC exclui 0: {lo > 0 or hi < 0}; IC todo acima do efeito mínimo: {lo > efeito_min_pp}; "
      f"IC contém o efeito mínimo: {lo <= efeito_min_pp <= hi}; IC todo abaixo: {hi < efeito_min_pp}")
