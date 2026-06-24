import { redirect } from "next/navigation";

// There is only one product now — the personalized alphabet set. The old
// multi-product chooser is gone; /products sends straight to its order flow.
export default function ProductsPage() {
  redirect("/products/alphabet");
}
