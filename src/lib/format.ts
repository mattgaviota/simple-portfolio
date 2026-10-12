const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

export function formatPrice(value: number) {
  return priceFormatter.format(value);
}
