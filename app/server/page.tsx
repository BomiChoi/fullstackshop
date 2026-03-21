import ProductListInner from "./inner";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function ServerPage() {
  const preloaded = await preloadQuery(api.products.listProducts);

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">상품 목록 (SSR)</h1>
      <ProductListInner preloaded={preloaded} />
    </main>
  );
}
