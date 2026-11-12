export const SEARCH_VALUES = [3, 6, 9, 12, 17, 23, 31, 40, 55];
export const SEARCH_TARGET = 23;

export function createSearch() {
  return { low: 0, high: SEARCH_VALUES.length - 1, solved: false };
}

export function checkSearchStep(search, index) {
  if (search.solved || index !== Math.floor((search.low + search.high) / 2)) return 'wrong';
  const value = SEARCH_VALUES[index];
  if (value === SEARCH_TARGET) {
    search.solved = true;
    return 'found';
  }
  if (value < SEARCH_TARGET) {
    search.low = index + 1;
    return 'right';
  }
  search.high = index - 1;
  return 'left';
}
