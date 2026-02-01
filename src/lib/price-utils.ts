/**
 * Formatea precios con separador de miles (comas) y moneda MXN al lado.
 * Ejemplos: "$1,000 MXN", "$18,000.50 MXN"
 * Siempre mantiene la moneda en la misma línea que el precio.
 */
export function formatPrice(
  amount: number,
  currency: string = "MXN"
): string {
  const formatted = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(amount);
  return `$${formatted} ${currency}`;
}
