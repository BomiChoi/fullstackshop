"use client";

import { useEffect, useRef, useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ShippingInfo {
  recipientName: string;
  phone: string;
  zipcode: string;
  address: string;
  detailAddress: string;
}

// 다음 우편번호 서비스 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: { zonecode: string; address: string; addressType: string; bname: string; buildingName: string }) => void;
      }) => { open: () => void };
    };
  }
}

export default function CheckoutPage() {
  const cartItems = useQuery(api.cart.getCart);
  const { user } = useUser();
  const router = useRouter();
  const widgetRef = useRef<ReturnType<Awaited<ReturnType<typeof loadTossPayments>>["widgets"]> | null>(null);
  const initializedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [daumLoaded, setDaumLoaded] = useState(false);

  const [shipping, setShipping] = useState<ShippingInfo>({
    recipientName: "",
    phone: "",
    zipcode: "",
    address: "",
    detailAddress: "",
  });
  const [shippingErrors, setShippingErrors] = useState<Partial<ShippingInfo>>({});
  const [stockError, setStockError] = useState<string | null>(null);

  const total = cartItems?.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0
  ) ?? 0;

  // 다음 우편번호 스크립트 로드
  useEffect(() => {
    if (document.querySelector('script[src*="postcode"]')) {
      setDaumLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.onload = () => setDaumLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Toss 결제위젯 초기화
  useEffect(() => {
    if (!cartItems || cartItems.length === 0 || !user || total === 0) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      const tossPayments = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY!
      );
      const widgets = tossPayments.widgets({ customerKey: user.id });
      widgetRef.current = widgets;

      await widgets.setAmount({ currency: "KRW", value: total });

      await Promise.all([
        widgets.renderPaymentMethods({ selector: "#payment-widget", variantKey: "DEFAULT" }),
        widgets.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
      ]);

      setReady(true);
    };

    init();
  }, [cartItems, user, total]);

  // 배송정보 유효성 검사
  const validateShipping = (): boolean => {
    const errors: Partial<ShippingInfo> = {};
    if (!shipping.recipientName.trim()) errors.recipientName = "수령인 이름을 입력해주세요";
    if (!shipping.phone.trim()) errors.phone = "전화번호를 입력해주세요";
    else if (!/^[0-9]{10,11}$/.test(shipping.phone.replace(/-/g, "")))
      errors.phone = "올바른 전화번호를 입력해주세요";
    if (!shipping.zipcode) errors.zipcode = "주소를 검색해주세요";
    if (!shipping.address) errors.address = "주소를 검색해주세요";
    if (!shipping.detailAddress.trim()) errors.detailAddress = "상세주소를 입력해주세요";
    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 다음 우편번호 팝업
  const openAddressSearch = () => {
    if (!daumLoaded || !window.daum) return;
    new window.daum.Postcode({
      oncomplete: (data) => {
        let fullAddress = data.address;
        if (data.addressType === "R") {
          if (data.bname) fullAddress += ` (${data.bname}`;
          if (data.buildingName) fullAddress += `, ${data.buildingName}`;
          if (data.bname || data.buildingName) fullAddress += ")";
        }
        setShipping((prev) => ({
          ...prev,
          zipcode: data.zonecode,
          address: fullAddress,
          detailAddress: "",
        }));
        setShippingErrors((prev) => ({ ...prev, zipcode: undefined, address: undefined }));
      },
    }).open();
  };

  const handlePay = async () => {
    if (!validateShipping() || !widgetRef.current || !cartItems) return;

    // 클라이언트 사이드 재고 검증
    for (const item of cartItems) {
      if (!item.product) continue;
      if (item.product.stock < item.quantity) {
        setStockError(
          `'${item.product.name}' 재고가 부족합니다.\n현재 재고: ${item.product.stock}개 / 주문 수량: ${item.quantity}개`
        );
        return;
      }
      if (item.product.stock === 0) {
        setStockError(`'${item.product.name}'은 품절된 상품입니다.`);
        return;
      }
    }

    setPaying(true);

    const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const orderName =
      cartItems.length === 1
        ? cartItems[0].product?.name ?? "상품"
        : `${cartItems[0].product?.name} 외 ${cartItems.length - 1}건`;

    sessionStorage.setItem(
      "toss_checkout",
      JSON.stringify({
        orderId,
        amount: total,
        shippingInfo: shipping,
        cartItems: cartItems.map((item) => ({
          productId: item.product!._id,
          quantity: item.quantity,
          price: item.product!.price,
        })),
      })
    );

    try {
      await widgetRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/success`,
        failUrl: `${window.location.origin}/fail`,
        customerEmail: user?.primaryEmailAddress?.emailAddress,
        customerName: shipping.recipientName,
        customerMobilePhone: shipping.phone.replace(/-/g, ""),
      });
    } catch {
      setPaying(false);
    }
  };

  if (cartItems === undefined) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    router.replace("/cart");
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* 재고 부족 팝업 */}
      {stockError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            </div>
            <h3 className="text-center font-bold text-gray-900 mb-2">재고 부족</h3>
            <p className="text-center text-sm text-gray-600 whitespace-pre-line mb-6">{stockError}</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setStockError(null); window.location.href = "/cart"; }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                장바구니로
              </button>
              <button
                onClick={() => setStockError(null)}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <Link href="/cart" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
        ← 장바구니로
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">결제</h1>

      {/* 주문 요약 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">주문 상품</h2>
        {cartItems.map((item) => (
          <div key={item._id} className="flex justify-between items-center py-2 text-sm">
            <span className="text-gray-700">
              {item.product?.name} × {item.quantity}
            </span>
            <span className="font-medium">
              {((item.product?.price ?? 0) * item.quantity).toLocaleString("ko-KR")}원
            </span>
          </div>
        ))}
        <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center font-bold">
          <span>총 결제 금액</span>
          <span className="text-lg">{total.toLocaleString("ko-KR")}원</span>
        </div>
      </div>

      {/* 배송 정보 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">배송 정보</h2>
        <div className="space-y-4">

          {/* 수령인 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              수령인 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={shipping.recipientName}
              onChange={(e) => {
                setShipping((p) => ({ ...p, recipientName: e.target.value }));
                setShippingErrors((p) => ({ ...p, recipientName: undefined }));
              }}
              placeholder="받으실 분 이름"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {shippingErrors.recipientName && (
              <p className="text-red-500 text-xs mt-1">{shippingErrors.recipientName}</p>
            )}
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              전화번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={shipping.phone}
              onChange={(e) => {
                setShipping((p) => ({ ...p, phone: e.target.value }));
                setShippingErrors((p) => ({ ...p, phone: undefined }));
              }}
              placeholder="010-0000-0000"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {shippingErrors.phone && (
              <p className="text-red-500 text-xs mt-1">{shippingErrors.phone}</p>
            )}
          </div>

          {/* 주소 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              주소 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={shipping.zipcode}
                readOnly
                placeholder="우편번호"
                className="w-32 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 cursor-not-allowed"
              />
              <button
                type="button"
                onClick={openAddressSearch}
                className="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                주소 검색
              </button>
            </div>
            <input
              type="text"
              value={shipping.address}
              readOnly
              placeholder="기본 주소"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 cursor-not-allowed mb-2"
            />
            {shippingErrors.zipcode && (
              <p className="text-red-500 text-xs mb-2">{shippingErrors.zipcode}</p>
            )}
            <input
              type="text"
              value={shipping.detailAddress}
              onChange={(e) => {
                setShipping((p) => ({ ...p, detailAddress: e.target.value }));
                setShippingErrors((p) => ({ ...p, detailAddress: undefined }));
              }}
              placeholder="상세주소 (동, 호수 등)"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {shippingErrors.detailAddress && (
              <p className="text-red-500 text-xs mt-1">{shippingErrors.detailAddress}</p>
            )}
          </div>
        </div>
      </div>

      {/* Toss 결제위젯 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div id="payment-widget" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div id="agreement" />
      </div>

      <button
        onClick={handlePay}
        disabled={!ready || paying}
        className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {paying ? "결제 진행 중..." : `${total.toLocaleString("ko-KR")}원 결제하기`}
      </button>
    </div>
  );
}
