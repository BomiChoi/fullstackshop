import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!;

interface CartItemPayload {
  productId: string;
  quantity: number;
  price: number;
}

interface ShippingInfo {
  recipientName: string;
  phone: string;
  zipcode: string;
  address: string;
  detailAddress: string;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paymentKey, orderId, amount, cartItems, shippingInfo } = await req.json() as {
    paymentKey: string;
    orderId: string;
    amount: number;
    cartItems: CartItemPayload[];
    shippingInfo?: ShippingInfo;
  };

  if (!paymentKey || !orderId || !amount || !cartItems?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Toss 결제 승인 API 호출
  const encoded = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
  const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!tossRes.ok) {
    const error = await tossRes.json();
    console.error("Toss confirm failed:", error);
    return NextResponse.json(
      { error: error.message ?? "결제 승인에 실패했습니다." },
      { status: tossRes.status }
    );
  }

  // Convex에서 유저 조회
  const user = await fetchQuery(api.orders.getUserByExternalId, {
    externalId: userId,
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 주문 생성
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  await fetchMutation(api.orders.createOrder, {
    userId: user._id,
    paymentKey,
    orderId,
    totalAmount,
    items: cartItems.map((item) => ({
      productId: item.productId as Id<"products">,
      quantity: item.quantity,
      price: item.price,
    })),
    shippingInfo,
  });

  return NextResponse.json({ success: true });
}
