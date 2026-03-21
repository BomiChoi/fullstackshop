"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const clearCart = useMutation(api.cart.clearCart);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setErrorMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    const checkout = sessionStorage.getItem("toss_checkout");
    if (!checkout) {
      setStatus("error");
      setErrorMessage("주문 정보를 찾을 수 없습니다.");
      return;
    }

    const { cartItems, shippingInfo } = JSON.parse(checkout);

    const confirm = async () => {
      try {
        const res = await fetch("/api/toss/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
            cartItems,
            shippingInfo,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setErrorMessage(data.error ?? "결제 승인에 실패했습니다.");
          setStatus("error");
          return;
        }

        sessionStorage.removeItem("toss_checkout");
        await clearCart();
        setStatus("success");
      } catch {
        setStatus("error");
        setErrorMessage("결제 처리 중 오류가 발생했습니다.");
      }
    };

    confirm();
  }, []);

  if (status === "loading") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-6" />
        <p className="text-gray-600">결제를 처리하고 있습니다...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">결제 승인 실패</h1>
        <p className="text-gray-500 mb-8">{errorMessage}</p>
        <Link href="/cart" className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors">
          장바구니로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">결제가 완료되었습니다!</h1>
      <p className="text-gray-500 mb-8">
        주문이 성공적으로 접수되었습니다. 주문 내역에서 확인하세요.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/orders" className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors">
          주문 내역 보기
        </Link>
        <Link href="/" className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
          계속 쇼핑하기
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-6" />
        <p className="text-gray-600">결제를 처리하고 있습니다...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
