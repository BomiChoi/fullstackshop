"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  const isCanceled = code === "PAY_PROCESS_CANCELED";

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {isCanceled ? "결제가 취소되었습니다" : "결제에 실패했습니다"}
      </h1>
      <p className="text-gray-500 mb-2">
        {isCanceled
          ? "결제를 취소하셨습니다. 장바구니는 그대로 유지됩니다."
          : message ?? "결제 처리 중 오류가 발생했습니다."}
      </p>
      {code && !isCanceled && (
        <p className="text-xs text-gray-400 mb-8">오류 코드: {code}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
        <Link href="/cart" className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors">
          장바구니로 돌아가기
        </Link>
        <Link href="/" className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
          쇼핑 계속하기
        </Link>
      </div>
    </div>
  );
}

export default function FailPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-20 text-center text-gray-500">로딩 중...</div>}>
      <FailContent />
    </Suspense>
  );
}
