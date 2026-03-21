"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import CartItem from "@/components/CartItem";
import Link from "next/link";

export default function CartPage() {
  const cartItems = useQuery(api.cart.getCart);

  if (cartItems === undefined) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const total = cartItems.reduce((sum, item) => {
    return sum + (item.product?.price ?? 0) * item.quantity;
  }, 0);

  const handleCheckout = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cartItems }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">장바구니</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">장바구니가 비어있습니다.</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            쇼핑하러 가기
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4">
            {cartItems.map((item) => (
              <CartItem key={item._id} {...item} />
            ))}
          </div>

          <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">총 상품 금액</span>
              <span className="text-xl font-bold text-gray-900">
                {total.toLocaleString("ko-KR")}원
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
            >
              결제하기
            </button>
          </div>
        </>
      )}
    </div>
  );
}
