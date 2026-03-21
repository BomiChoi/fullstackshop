"use client";

import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function ProductListInner({
  preloaded,
}: {
  preloaded: Preloaded<typeof api.products.listProducts>;
}) {
  const products = usePreloadedQuery(preloaded);
  return (
    <ul className="space-y-2">
      {products.map((p) => (
        <li key={p._id} className="text-sm text-gray-700">
          {p.name} — {p.price.toLocaleString("ko-KR")}원
        </li>
      ))}
    </ul>
  );
}
