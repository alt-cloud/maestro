const UNIT_MULTIPLIERS: Record<string, number> = {
  '': 1,
  B: 1,
  K: 1_000,
  KB: 1_000,
  M: 1_000_000,
  MB: 1_000_000,
  G: 1_000_000_000,
  GB: 1_000_000_000,
  T: 1_000_000_000_000,
  TB: 1_000_000_000_000,
  P: 1_000_000_000_000_000,
  PB: 1_000_000_000_000_000,
  KI: 1_024,
  KIB: 1_024,
  MI: 1_048_576,
  MIB: 1_048_576,
  GI: 1_073_741_824,
  GIB: 1_073_741_824,
  TI: 1_099_511_627_776,
  TIB: 1_099_511_627_776,
  PI: 1_125_899_906_842_624,
  PIB: 1_125_899_906_842_624,
};

const LEADING_SIZE_PATTERN = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(?:\s*([a-zA-Z]+))?/;

export default function parseSizeToBytes(rawValue: string): number | null {
  const normalizedInput = rawValue.trim();
  const sizeMatch = normalizedInput.match(LEADING_SIZE_PATTERN);

  if (!sizeMatch) {
    return null;
  }

  const numericPart = Number.parseFloat(sizeMatch[1]);
  if (!Number.isFinite(numericPart)) {
    return null;
  }

  const unitSuffix = (sizeMatch[2] ?? '').toUpperCase();
  const multiplier = UNIT_MULTIPLIERS[unitSuffix];
  if (typeof multiplier === 'undefined') {
    return numericPart;
  }

  return numericPart * multiplier;
}
