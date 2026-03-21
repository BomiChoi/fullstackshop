import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface CartItemPayload {
  _id: string;
  quantity: number;
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
    stock: number;
  } | null;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items }: { items: CartItemPayload[] } = await req.json();

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const validItems = items.filter((item) => item.product !== null);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = validItems.map((item) => ({
    price_data: {
      currency: "krw",
      product_data: {
        name: item.product!.name,
        images: [item.product!.imageUrl],
      },
      unit_amount: item.product!.price,
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
    metadata: {
      clerkUserId: userId,
      cartItems: JSON.stringify(
        validItems.map((item) => ({
          productId: item.product!._id,
          quantity: item.quantity,
          price: item.product!.price,
        }))
      ),
    },
  });

  return NextResponse.json({ url: session.url });
}
