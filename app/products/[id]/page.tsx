"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const product = useQuery(api.products.getProduct, {
    id: id as Id<"products">,
  });
  const addToCart = useMutation(api.cart.addToCart);
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();

  if (product === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-100 rounded-xl mb-6" />
          <div className="h-8 bg-gray-100 rounded w-1/2 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-full mb-2" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">상품을 찾을 수 없습니다.</p>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    await addToCart({ productId: product._id, quantity: 1 });
    router.push("/cart");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
        ← 목록으로
      </Link>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {product.price.toLocaleString("ko-KR")}원
            </div>
            <p className="text-sm text-gray-400">재고: {product.stock}개</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {product.stock === 0 ? "품절" : "장바구니에 담기"}
          </button>
        </div>
      </div>
    </div>
  );
}
