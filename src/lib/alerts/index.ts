import { sendPriceAlert } from '../email/send-price-alert';

export async function triggerPriceAlert(args: {
  userId: string;
  userEmail: string;
  ingredientName: string;
  retailerName: string;
  oldPricePence: number;
  newPricePence: number;
}): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://loavish.com';

  await sendPriceAlert({
    to: args.userEmail,
    ingredientName: args.ingredientName,
    retailerName: args.retailerName,
    oldPricePence: args.oldPricePence,
    newPricePence: args.newPricePence,
    appUrl,
  });
}
