export function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

export function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}
