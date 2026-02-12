import { IntervalOption } from './RefreshIntervalControl';

export type IntervalValue = number | null;

const INTERVAL_VALUES = [1000, 5000, 10000, 30000, 60000] as const;

export function alignRefreshInterval(delay: string | number | null | undefined): IntervalValue {
  if (typeof delay === 'undefined' || Number.isNaN(Number(delay)) || Number(delay) <= 0) {
    return null;
  }

  const delayMs = Number(delay) * 1000;
  let lastValue = 0;

  for (const value of INTERVAL_VALUES) {
    if (delayMs <= value) {
      return value;
    }
    lastValue = value;
  }

  return lastValue || null;
}

export function getRefreshIntervalOptions(t: (key: string) => string): readonly IntervalOption[] {
  return [
    { label: t('refresh.oneSecond'), value: 1000 },
    { label: t('refresh.fiveSeconds'), value: 5000 },
    { label: t('refresh.tenSeconds'), value: 10000 },
    { label: t('refresh.thirtySeconds'), value: 30000 },
    { label: t('refresh.oneMinute'), value: 60000 },
    { label: t('refresh.off'), value: null },
  ] as const;
}
