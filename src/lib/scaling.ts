export function getScalingFactor(basePortions: number, targetPortions: number): number {
  if (!Number.isFinite(basePortions) || basePortions <= 0) {
    throw new Error("basePortions must be > 0");
  }

  if (!Number.isFinite(targetPortions) || targetPortions <= 0) {
    throw new Error("targetPortions must be > 0");
  }

  return targetPortions / basePortions;
}

export function scaleQuantity(
  baseQuantity: number,
  basePortions: number,
  targetPortions: number,
): number {
  if (!Number.isFinite(baseQuantity) || baseQuantity < 0) {
    throw new Error("baseQuantity must be >= 0");
  }

  return baseQuantity * getScalingFactor(basePortions, targetPortions);
}
