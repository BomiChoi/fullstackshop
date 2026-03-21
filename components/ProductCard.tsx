"use client";

import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

interface Product {
  _id: Id<"products">;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product._id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <div className="aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">
              {product.price.toLocaleString("ko-KR")}원
            </span>
            <span className="text-xs text-gray-400">재고 {product.stock}개</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
