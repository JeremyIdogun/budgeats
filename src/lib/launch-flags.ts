function parseBooleanFlag(value: string | undefined, defaultValue = false): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  return defaultValue;
}

export const launchFlags = {
  rewards: parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_REWARDS, true),
  adminProductReview: parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_ADMIN_PRODUCT_REVIEW, false),
  // Phase II capabilities — disabled until backing implementations land.
  calendarSync: parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_CALENDAR_SYNC, false),
  wasteRiskDetection: parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_WASTE_RISK, false),
};
