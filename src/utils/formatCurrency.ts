/**
 * Formatea un número como moneda en pesos mexicanos (MXN).
 * @param value El número que se va a formatear.
 * @returns Una cadena con el número formateado como moneda en MXN.
 */
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
