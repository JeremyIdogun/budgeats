export type PackUnit = "g" | "kg" | "ml" | "l" | "each";

export interface PackSize {
  quantity: number;
  unit: PackUnit;
}

export interface MultipackInfo {
  count: number;
  unitSize: number;
  unit: PackUnit;
}

const UNIT_PATTERN = "kg|g|ml|l|each";

function toLowerTrimmed(raw: string): string {
  return raw.trim().toLowerCase();
}

export function parseMultipack(raw: string): MultipackInfo {
  const value = toLowerTrimmed(raw).replace(/,/g, "");
  const match = value.match(new RegExp(`(\\d+)\\s*[x×]\\s*(\\d+(?:\\.\\d+)?)\\s*(${UNIT_PATTERN})\\b`));

  if (!match) {
    throw new Error(`Unable to parse multipack: ${raw}`);
  }

  return {
    count: Number.parseInt(match[1], 10),
    unitSize: Number.parseFloat(match[2]),
    unit: match[3] as PackUnit,
  };
}

export function parsePackSize(raw: string): PackSize {
  const value = toLowerTrimmed(raw).replace(/,/g, "");

  try {
    const multi = parseMultipack(value);
    return {
      quantity: multi.count * multi.unitSize,
      unit: multi.unit,
    };
  } catch {
    // Not a multipack; continue with single-pack parsing.
  }

  const singleMatch = value.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${UNIT_PATTERN})\\b`));
  if (singleMatch) {
    return {
      quantity: Number.parseFloat(singleMatch[1]),
      unit: singleMatch[2] as PackUnit,
    };
  }

  const eachMatch = value.match(/(?:pack of\s*)?(\d+)\s*(?:pack|pk)\b/);
  if (eachMatch) {
    return {
      quantity: Number.parseInt(eachMatch[1], 10),
      unit: "each",
    };
  }

  throw new Error(`Unable to parse pack size: ${raw}`);
}

export function normalizeToBaseUnit(quantity: number, unit: string): number {
  const normalizedUnit = toLowerTrimmed(unit);

  switch (normalizedUnit) {
    case "g":
    case "ml":
    case "each":
      return quantity;
    case "kg":
    case "l":
      return quantity * 1000;
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
}

export function computeUnitPricePence(priceP: number, packSize: PackSize): number {
  if (!Number.isFinite(priceP) || priceP < 0) {
    throw new Error(`Invalid price: ${priceP}`);
  }

  const baseQuantity = normalizeToBaseUnit(packSize.quantity, packSize.unit);
  if (baseQuantity <= 0) {
    throw new Error(`Invalid pack quantity: ${packSize.quantity}`);
  }

  if (packSize.unit === "each") {
    return Math.round(priceP / baseQuantity);
  }

  return Math.round((priceP / baseQuantity) * 100);
}
