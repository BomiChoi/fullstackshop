"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  cancelled: "취소됨",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const orders = useQuery(api.orders.getMyOrders);

  if (orders === undefined) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">주문 내역</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">주문 내역이 없습니다.</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            쇼핑하러 가기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400">
                    주문번호: {order._id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order._creationTime).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[order.status]}`}
                >
                  {STATUS_LABEL[order.status]}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {order.items.map((item) => (
                  <div key={item._id} className="flex items-center gap-3">
                    {item.product && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product?.name ?? "삭제된 상품"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.price.toLocaleString("ko-KR")}원 × {item.quantity}개
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {order.shippingInfo && (
                <div className="border-t border-gray-100 pt-3 mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1.5">배송 정보</p>
                  <p className="text-sm text-gray-800">
                    {order.shippingInfo.recipientName} · {order.shippingInfo.phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    [{order.shippingInfo.zipcode}] {order.shippingInfo.address} {order.shippingInfo.detailAddress}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="text-sm text-gray-500">총 결제 금액</span>
                <span className="font-bold text-gray-900">
                  {order.totalAmount.toLocaleString("ko-KR")}원
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
