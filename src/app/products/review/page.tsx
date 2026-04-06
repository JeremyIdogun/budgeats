import { redirect } from "next/navigation";
import { launchFlags } from "@/lib/launch-flags";

export default function ProductReviewPage() {
  redirect(launchFlags.adminProductReview ? "/admin/products/review" : "/dashboard");
}
