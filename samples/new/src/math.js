export function add(a, b) {
  return a + b;
}

export function divide(a, b) {
  if (b === 0) {
    return null;
  }
  return a / b;
}

export function safeDivide(a, b, fallback = 0) {
  return b === 0 ? fallback : a / b;
}

export const utils = {
  add,
  divide,
  safeDivide,
};
