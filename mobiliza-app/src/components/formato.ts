export const reais = (v: number, casas = 0) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: casas, maximumFractionDigits: casas });
export const km = (v: number) => `${Math.round(v).toLocaleString('pt-BR')} km`;
export const pct = (v: number, casas = 1) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: casas })}%`;
export const num = (v: number, casas = 1) => v.toLocaleString('pt-BR', { maximumFractionDigits: casas });
