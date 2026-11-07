export function formatPrice(value, currency = '$') {
  return `${currency}${value.toFixed(2)}`;
}

export function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
