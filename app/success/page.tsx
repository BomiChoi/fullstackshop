"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function SuccessPage() {
  const clearCart = useMutation(api.cart.clearCart);

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">결제가 완료되었습니다!</h1>
      <p className="text-gray-500 mb-8">
        주문이 성공적으로 접수되었습니다. 주문 내역에서 확인하세요.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/orders"
          className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
        >
          주문 내역 보기
        </Link>
        <Link
          href="/"
          className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
        >
          계속 쇼핑하기
        </Link>
      </div>
    </div>
  );
}
