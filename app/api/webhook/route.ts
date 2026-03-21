import { NextResponse } from "next/server";

// Stripe webhook은 Toss Payments로 전환 후 미사용
export async function POST() {
  return NextResponse.json({ received: true });
}
