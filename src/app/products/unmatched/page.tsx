import { redirect } from "next/navigation";
import { launchFlags } from "@/lib/launch-flags";

export default function UnmatchedProductsPage() {
  redirect(launchFlags.adminProductReview ? "/admin/products/unmatched" : "/dashboard");
}
