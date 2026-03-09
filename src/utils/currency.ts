export function formatPence(pence: number): string {
  const abs = Math.abs(pence);
  const formatted = `£${(abs / 100).toFixed(2)}`;
  return pence < 0 ? `-${formatted}` : formatted;
}

export function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}
