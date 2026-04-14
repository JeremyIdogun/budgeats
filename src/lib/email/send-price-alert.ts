import { render } from "@react-email/render";
import { PriceAlert } from "./templates/PriceAlert";
import { getFromEmail, getResendClient } from "./resend";

export interface PriceAlertPayload {
  to: string;
  ingredientName: string;
  retailerName: string;
  oldPricePence: number;
  newPricePence: number;
  appUrl: string;
}

export async function sendPriceAlert(payload: PriceAlertPayload): Promise<void> {
  const { to, ingredientName, retailerName, oldPricePence, newPricePence, appUrl } = payload;
  const resend = getResendClient();

  const html = await render(
    PriceAlert({ ingredientName, retailerName, oldPricePence, newPricePence, appUrl }),
  );

  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to,
    subject: `Price drop alert — ${ingredientName} is cheaper at ${retailerName}`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
