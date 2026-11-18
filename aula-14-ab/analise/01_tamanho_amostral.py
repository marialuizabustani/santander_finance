"""Etapa 01: tamanho amostral por grupo (duas proporções, bicaudal)."""
import math
from pathlib import Path
from scipy.stats import norm

# Parâmetros do plano
p1, efeito, alfa, poder = 0.40, 0.03, 0.05, 0.80
p2 = p1 + efeito
p_bar = (p1 + p2) / 2  # proporção combinada sob H0

z_a = norm.ppf(1 - alfa / 2)  # bicaudal
z_b = norm.ppf(poder)

# n = [z_a*sqrt(2 p̄ q̄) + z_b*sqrt(p1 q1 + p2 q2)]² / (p2 - p1)²
termo_h0 = z_a * math.sqrt(2 * p_bar * (1 - p_bar))
termo_h1 = z_b * math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))
n_exato = (termo_h0 + termo_h1) ** 2 / (p2 - p1) ** 2
n = math.ceil(n_exato)  # arredonda para cima

texto = (
    "\n## Tamanho amostral\n\n"
    f"- z(1-α/2) = {z_a:.4f}; z(1-β) = {z_b:.4f}; p̄ = {p_bar:.3f}\n"
    f"- n exato = {n_exato:.2f} → **{n:,} usuários por grupo**"
    f" ({2 * n:,} no total)\n".replace(",", ".")
)
saida = Path(__file__).resolve().parent.parent / "saidas" / "plano.md"
with saida.open("a", encoding="utf-8") as f:
    f.write(texto)
print(texto)
