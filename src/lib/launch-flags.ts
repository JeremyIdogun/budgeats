function parseBooleanFlag(value: string | undefined, defaultValue = false): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  return defaultValue;
}

export const launchFlags = {
  rewards: parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_REWARDS, true),
  adminProductReview: parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_ADMIN_PRODUCT_REVIEW, false),
};
