export function add(a, b) {
  return a + b;
}

export function divide(a, b) {
  if (b === 0) {
    throw new Error('division by zero');
  }
  return a / b;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export const utils = {
  add,
  divide,
  clamp,
};
